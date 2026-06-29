/**
 * DAR Admin — Feed-Bild am Markdown-Beitrag (Original + Preview)
 */
(function (global) {
  "use strict";

  var stateByContext = Object.create(null);
  var IMAGE_EXT_RE = /\.(png|jpe?g|webp)$/i;

  function ctxKey(context) {
    return String(context || "draft");
  }

  function getState(context) {
    var key = ctxKey(context);
    if (!stateByContext[key]) {
      stateByContext[key] = {
        file: null,
        previewUrl: "",
        existingImage: "",
        existingOriginal: "",
        removePending: false
      };
    }
    return stateByContext[key];
  }

  function resetState(context) {
    var st = getState(context);
    if (st.previewUrl && st.previewUrl.indexOf("blob:") === 0) {
      try { URL.revokeObjectURL(st.previewUrl); } catch (e) {}
    }
    stateByContext[ctxKey(context)] = {
      file: null,
      previewUrl: "",
      existingImage: "",
      existingOriginal: "",
      removePending: false
    };
  }

  function extFromMime(mime, name) {
    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
    var m = String(name || "").match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "jpg";
  }

  function normalizeAssetUrl(path) {
    var p = String(path || "").trim();
    if (!p) return "";
    if (p.indexOf("http") === 0) return p;
    return p.indexOf("/") === 0 ? p : "/" + p;
  }

  function pickSourceImageUrl(sourceQueue, markdown) {
    var queue = Array.isArray(sourceQueue) ? sourceQueue : [];
    for (var i = 0; i < queue.length; i++) {
      var item = queue[i] || {};
      var path = String(item.path || item.name || "");
      if (IMAGE_EXT_RE.test(path)) return normalizeAssetUrl(path);
    }
    var md = String(markdown || "");
    var linkRe = /-\s*label:\s*["']?(?:→\s*)?(?:Bild-Scan|Bildscan|Scan)[^"'\n]*["']?\s*\n\s*url:\s*["'](\/assets\/[^"']+\.(?:png|jpe?g|webp))["']/gi;
    var m = linkRe.exec(md);
    if (m && m[1]) return normalizeAssetUrl(m[1]);
    var anyAsset = md.match(/url:\s*["'](\/assets\/[^"']+\.(?:png|jpe?g|webp))["']/i);
    return anyAsset && anyAsset[1] ? normalizeAssetUrl(anyAsset[1]) : "";
  }

  function fileToBase64(file) {
    return file.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      var chunk = 0x8000;
      var parts = [];
      for (var i = 0; i < bytes.length; i += chunk) {
        parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunk)));
      }
      return btoa(parts.join(""));
    });
  }

  function buildPreviewBlob(file, maxW) {
    maxW = maxW || 900;
    if (!file || !global.createImageBitmap) {
      return Promise.reject(new Error("preview-unavailable"));
    }
    return createImageBitmap(file).then(function (bmp) {
      var scale = Math.min(1, maxW / Math.max(1, bmp.width));
      var w = Math.max(1, Math.round(bmp.width * scale));
      var h = Math.max(1, Math.round(bmp.height * scale));
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(bmp, 0, 0, w, h);
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error("preview-blob"));
        }, "image/jpeg", 0.88);
      });
    });
  }

  function renderPanel(context) {
    var c = ctxKey(context);
    return (
      '<aside class="editor-card feed-image-card" data-feed-image-context="' + c + '">' +
        '<div class="feed-image-head">' +
          '<div><p class="admin-kicker">Feed</p><h2>Bildbeitrag</h2></div>' +
          '<label class="switch" title="Im Feed anzeigen"><input type="checkbox" id="feedEnabled-' + c + '" data-feed-enabled="' + c + '" checked><span></span></label>' +
        '</div>' +
        '<p class="feed-help">Dieses Bild erscheint im <strong>Feed-Tab</strong> (nicht nur als Quellen-Scan im Text). Bild hier hinzufügen <em>oder</em> beim Quellen-Upload ein Bild anhängen — beides verknüpft automatisch den Feed, wenn „Im Feed anzeigen“ aktiv ist.</p>' +
        '<div class="feed-image-preview" id="feedImagePreview-' + c + '" data-feed-preview="' + c + '">' +
          '<div class="feed-image-empty"><span>🖼</span><p>Noch kein Bild hinzugefügt</p></div>' +
        '</div>' +
        '<div class="feed-image-actions">' +
          '<input type="file" id="feedImageInput-' + c + '" data-feed-input="' + c + '" accept="image/png,image/jpeg,image/webp" hidden>' +
          '<button type="button" class="btn btn-primary btn-full" data-feed-add="' + c + '">🖼 Bild hinzufügen</button>' +
          '<button type="button" class="btn btn-ghost btn-full" data-feed-remove="' + c + '">Bild entfernen</button>' +
        '</div>' +
        '<div class="feed-meta">' +
          '<label class="field-label" for="feedAlt-' + c + '">Bildbeschreibung</label>' +
          '<input type="text" id="feedAlt-' + c + '" class="input" data-feed-alt="' + c + '" placeholder="Bildbeitrag zu: Titel">' +
        '</div>' +
      '</aside>'
    );
  }

  function renderPreviewEl(root, src) {
    if (!root) return;
    if (!src) {
      root.innerHTML = '<div class="feed-image-empty"><span>🖼</span><p>Noch kein Bild hinzugefügt</p></div>';
      return;
    }
    root.innerHTML = '<img src="' + src.replace(/"/g, "&quot;") + '" alt="Feed-Bild Vorschau">';
  }

  function hasFeedBlockInMarkdown(markdown) {
    var m = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---/);
    return m ? /^feed:\s*$/m.test(m[1]) : false;
  }

  function syncFromMarkdown(context, markdown, siteOrigin) {
    var st = getState(context);
    var feed = global.DARQuellen && global.DARQuellen.parseFeedFromMarkdown
      ? global.DARQuellen.parseFeedFromMarkdown(markdown)
      : { enabled: false, image: "", originalImage: "", alt: "", shareEnabled: false };
    st.existingImage = feed.image || "";
    st.existingOriginal = feed.originalImage || "";
    st.removePending = false;
    st.file = null;
    var root = document.querySelector('[data-feed-preview="' + ctxKey(context) + '"]');
    var enabledEl = document.querySelector('[data-feed-enabled="' + ctxKey(context) + '"]');
    var altEl = document.querySelector('[data-feed-alt="' + ctxKey(context) + '"]');
    if (enabledEl) {
      enabledEl.checked = hasFeedBlockInMarkdown(markdown)
        ? feed.enabled !== false
        : true;
    }
    if (altEl) altEl.value = feed.alt || "";
    var src = feed.image ? new URL(feed.image, siteOrigin || global.location.origin).href : "";
    st.previewUrl = src;
    renderPreviewEl(root, src);
  }

  function adoptSourceImage(context, imageUrl, siteOrigin) {
    var url = normalizeAssetUrl(imageUrl);
    if (!url || !IMAGE_EXT_RE.test(url)) return;
    var st = getState(context);
    var preview = document.querySelector('[data-feed-preview="' + ctxKey(context) + '"]');
    var enabled = document.querySelector('[data-feed-enabled="' + ctxKey(context) + '"]');
    st.existingImage = url;
    st.existingOriginal = url;
    st.removePending = false;
    if (!st.file) {
      st.previewUrl = new URL(url, siteOrigin || global.location.origin).href;
      renderPreviewEl(preview, st.previewUrl);
    }
    if (enabled && !enabled.checked) enabled.checked = true;
  }

  function readUi(context) {
    var c = ctxKey(context);
    return {
      enabled: !!(document.querySelector('[data-feed-enabled="' + c + '"]') || {}).checked,
      alt: (document.querySelector('[data-feed-alt="' + c + '"]') || {}).value || ""
    };
  }

  function applyFeedToMarkdown(markdown, postId, title, context, opts) {
    opts = opts || {};
    var st = getState(context);
    var ui = readUi(context);
    var sourceUrl = pickSourceImageUrl(opts.sourceQueue, markdown);
    var hasFeedFile = !st.removePending && !!st.file;
    var hasExisting = !st.removePending && !!st.existingImage;
    var useSourceFallback = !st.removePending && !hasFeedFile && !!sourceUrl;
    var hasImage = hasFeedFile || hasExisting || useSourceFallback;
    var enabled = ui.enabled && hasImage && !st.removePending;
    var feed;

    if (st.removePending || !enabled) {
      feed = { enabled: false, image: "", originalImage: "", alt: "", shareEnabled: false };
    } else if (hasFeedFile) {
      var id = String(postId || "").trim() || "beitrag";
      feed = global.DARQuellen.buildFeedFrontmatter(postId, title, {
        enabled: true,
        hasImage: true,
        image: st.existingImage || "/assets/posts/" + id + "/feed-preview.jpg",
        originalImage: st.existingOriginal || "/assets/posts/" + id + "/feed-original.jpg",
        alt: ui.alt || ("Bildbeitrag zu: " + (title || "Beitrag")),
        shareEnabled: true
      });
    } else {
      var img = st.existingImage || sourceUrl;
      var orig = st.existingOriginal || sourceUrl || img;
      feed = {
        enabled: true,
        image: img,
        originalImage: orig,
        alt: ui.alt || ("Bildbeitrag zu: " + (title || "Beitrag")),
        shareEnabled: true
      };
    }
    return global.DARQuellen.mergeFeedFrontmatter(markdown, feed);
  }

  function collectUploadFiles(postId, context) {
    var st = getState(context);
    var ui = readUi(context);
    if (st.removePending || !ui.enabled) return Promise.resolve([]);
    if (!st.file) return Promise.resolve([]);
    var id = String(postId || "").trim() || "beitrag";
    var ext = extFromMime(st.file.type, st.file.name);
    var originalPath = "assets/posts/" + id + "/feed-original." + ext;
    var previewPath = "assets/posts/" + id + "/feed-preview.jpg";
    return fileToBase64(st.file).then(function (originalB64) {
      return buildPreviewBlob(st.file).then(function (previewBlob) {
        return new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function () {
            var bin = new Uint8Array(reader.result);
            var parts = [];
            var chunk = 0x8000;
            for (var i = 0; i < bin.length; i += chunk) {
              parts.push(String.fromCharCode.apply(null, bin.subarray(i, i + chunk)));
            }
            resolve([
              { path: originalPath, contentBase64: originalB64, binary: true },
              { path: previewPath, contentBase64: btoa(parts.join("")), binary: true }
            ]);
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(previewBlob);
        });
      });
    });
  }

  function bindRoot(root, context, siteOrigin) {
    if (!root) return;
    var c = ctxKey(context);
    var input = root.querySelector('[data-feed-input="' + c + '"]');
    var preview = root.querySelector('[data-feed-preview="' + c + '"]');
    var enabled = root.querySelector('[data-feed-enabled="' + c + '"]');
    root.querySelectorAll('[data-feed-add="' + c + '"]').forEach(function (btn) {
      btn.addEventListener("click", function () { if (input) input.click(); });
    });
    if (input) {
      input.addEventListener("change", function (ev) {
        var file = ev.target.files && ev.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          alert("Bitte nur Bilddateien hochladen.");
          return;
        }
        var st = getState(context);
        if (st.previewUrl && st.previewUrl.indexOf("blob:") === 0) {
          try { URL.revokeObjectURL(st.previewUrl); } catch (e) {}
        }
        st.file = file;
        st.removePending = false;
        st.previewUrl = URL.createObjectURL(file);
        if (enabled) enabled.checked = true;
        renderPreviewEl(preview, st.previewUrl);
      });
    }
    root.querySelectorAll('[data-feed-remove="' + c + '"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var st = getState(context);
        if (st.previewUrl && st.previewUrl.indexOf("blob:") === 0) {
          try { URL.revokeObjectURL(st.previewUrl); } catch (e) {}
        }
        st.file = null;
        st.previewUrl = "";
        st.existingImage = "";
        st.existingOriginal = "";
        st.removePending = true;
        if (input) input.value = "";
        if (enabled) enabled.checked = false;
        renderPreviewEl(preview, "");
      });
    });
  }

  global.DARAdminFeedImage = {
    renderPanel: renderPanel,
    bindRoot: bindRoot,
    resetState: resetState,
    syncFromMarkdown: syncFromMarkdown,
    applyFeedToMarkdown: applyFeedToMarkdown,
    collectUploadFiles: collectUploadFiles,
    readUi: readUi,
    adoptSourceImage: adoptSourceImage,
    pickSourceImageUrl: pickSourceImageUrl
  };
})(typeof window !== "undefined" ? window : globalThis);
