/**
 * DAR Admin — Feed-Bild am Markdown-Beitrag (kompakt, Drag & Drop)
 */
(function (global) {
  "use strict";

  var stateByContext = Object.create(null);
  var IMAGE_EXT_RE = /\.(png|jpe?g|webp)$/i;
  var FEED_MAX_BYTES = 20 * 1024 * 1024;

  function ctxKey(context) {
    return String(context || "draft");
  }

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
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
    updateFeedStatusUi(context);
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
      '<div class="feed-image-panel" data-feed-image-context="' + c + '">' +
        '<div class="feed-image-head">' +
          '<div class="feed-image-head-text">' +
            '<strong>Feed · Bildbeitrag</strong>' +
            '<span>Im Feed-Tab sichtbar nach Veröffentlichen</span>' +
          '</div>' +
          '<label class="switch switch-compact" title="Im Feed anzeigen">' +
            '<input type="checkbox" id="feedEnabled-' + c + '" data-feed-enabled="' + c + '" checked><span></span>' +
          '</label>' +
        '</div>' +
        '<div class="feed-image-dropzone" id="feedImageDropzone-' + c + '" data-feed-dropzone="' + c + '" role="button" tabindex="0" aria-label="Feed-Bild hochladen">' +
          '<div class="feed-image-preview" id="feedImagePreview-' + c + '" data-feed-preview="' + c + '">' +
            '<span class="feed-drop-label"><strong>Bild hier ablegen</strong><br>Drag &amp; Drop oder tippen · PNG/JPG · max. 20 MB</span>' +
          '</div>' +
        '</div>' +
        '<input type="file" id="feedImageInput-' + c + '" data-feed-input="' + c + '" accept="image/png,image/jpeg,image/webp" hidden>' +
        '<div id="feedImageStatus-' + c + '" class="feed-image-status" data-feed-status="' + c + '" hidden></div>' +
        '<div class="feed-image-toolbar">' +
          '<button type="button" class="btn" data-feed-pick="' + c + '">Datei wählen</button>' +
          '<button type="button" class="btn danger" data-feed-remove="' + c + '" hidden>Aus Feed entfernen</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderPreviewEl(root, src) {
    if (!root) return;
    if (!src) {
      root.innerHTML = '<span class="feed-drop-label"><strong>Bild hier ablegen</strong><br>Drag &amp; Drop oder tippen · PNG/JPG · max. 20 MB</span>';
      return;
    }
    root.innerHTML = '<img class="feed-image-thumb" src="' + src.replace(/"/g, "&quot;") + '" alt="Feed-Vorschau">';
  }

  function updateFeedStatusUi(context) {
    var c = ctxKey(context);
    var st = getState(context);
    var status = document.querySelector('[data-feed-status="' + c + '"]');
    var removeBtn = document.querySelector('[data-feed-remove="' + c + '"]');
    var dropzone = document.querySelector('[data-feed-dropzone="' + c + '"]');
    var has = !st.removePending && (!!st.file || !!st.previewUrl || !!st.existingImage);
    if (status) {
      if (has) {
        var name = st.file ? st.file.name : String(st.existingImage || "Bild").split("/").pop();
        status.hidden = false;
        status.innerHTML = '✓ Feed-Bild bereit · <strong>' + escHtml(name) + '</strong> — erscheint im Feed nach Veröffentlichen';
      } else {
        status.hidden = true;
        status.innerHTML = "";
      }
    }
    if (removeBtn) removeBtn.hidden = !has;
    if (dropzone) dropzone.classList.toggle("has-image", has && !!st.previewUrl);
  }

  function validateFeedImageFile(file) {
    if (!file) throw new Error("Keine Datei gewählt");
    if (!file.type.startsWith("image/") && !IMAGE_EXT_RE.test(file.name || "")) {
      throw new Error("Nur PNG, JPG oder WEBP für Feed-Bilder");
    }
    if (Number(file.size || 0) > FEED_MAX_BYTES) throw new Error("Maximal 20 MB pro Bild");
    return true;
  }

  function applyFeedFile(context, file, siteOrigin) {
    validateFeedImageFile(file);
    var st = getState(context);
    var c = ctxKey(context);
    var preview = document.querySelector('[data-feed-preview="' + c + '"]');
    var enabled = document.querySelector('[data-feed-enabled="' + c + '"]');
    var input = document.querySelector('[data-feed-input="' + c + '"]');
    if (st.previewUrl && st.previewUrl.indexOf("blob:") === 0) {
      try { URL.revokeObjectURL(st.previewUrl); } catch (e) {}
    }
    st.file = file;
    st.removePending = false;
    st.previewUrl = URL.createObjectURL(file);
    if (enabled) enabled.checked = true;
    renderPreviewEl(preview, st.previewUrl);
    updateFeedStatusUi(context);
    if (input) input.value = "";
    if (typeof global.toast === "function") global.toast("Feed-Bild eingefügt — wird beim Veröffentlichen hochgeladen");
  }

  function clearFeedFile(context) {
    var st = getState(context);
    var c = ctxKey(context);
    var preview = document.querySelector('[data-feed-preview="' + c + '"]');
    var enabled = document.querySelector('[data-feed-enabled="' + c + '"]');
    var input = document.querySelector('[data-feed-input="' + c + '"]');
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
    updateFeedStatusUi(context);
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
    if (enabledEl) {
      enabledEl.checked = hasFeedBlockInMarkdown(markdown)
        ? feed.enabled !== false
        : true;
    }
    var src = feed.image ? new URL(feed.image, siteOrigin || global.location.origin).href : "";
    st.previewUrl = src;
    renderPreviewEl(root, src);
    updateFeedStatusUi(context);
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
    updateFeedStatusUi(context);
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
    var dropzone = root.querySelector('[data-feed-dropzone="' + c + '"]');
    var dragDepth = 0;

    function handleFiles(files) {
      var file = files && files[0];
      if (!file) return;
      try {
        applyFeedFile(context, file, siteOrigin);
      } catch (e) {
        alert(e.message || String(e));
      }
    }

    function setDragActive(on) {
      root.classList.toggle("is-drag-active", !!on);
      if (dropzone) dropzone.classList.toggle("is-dragover", !!on);
    }

    function prevent(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    root.querySelectorAll('[data-feed-pick="' + c + '"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (input) input.click();
      });
    });

    if (dropzone) {
      dropzone.addEventListener("click", function (e) {
        if (e.target.closest("[data-feed-pick], [data-feed-remove]")) return;
        if (input) input.click();
      });
      dropzone.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (input) input.click();
        }
      });
    }

    root.addEventListener("dragenter", function (e) {
      prevent(e);
      dragDepth++;
      setDragActive(true);
    }, { passive: false });

    root.addEventListener("dragover", function (e) {
      prevent(e);
      setDragActive(true);
    }, { passive: false });

    root.addEventListener("dragleave", function (e) {
      prevent(e);
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) setDragActive(false);
    }, { passive: false });

    root.addEventListener("drop", function (e) {
      prevent(e);
      dragDepth = 0;
      setDragActive(false);
      handleFiles(e.dataTransfer && e.dataTransfer.files);
    }, { passive: false });

    if (input) {
      input.addEventListener("change", function (ev) {
        handleFiles(ev.target.files);
      });
    }

    root.querySelectorAll('[data-feed-remove="' + c + '"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!confirm("Diesen Bildbeitrag aus dem Besucher-Feed entfernen?\n\nDer Beitrag selbst bleibt erhalten.")) return;
        clearFeedFile(context);
      });
    });

    updateFeedStatusUi(context);
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
    pickSourceImageUrl: pickSourceImageUrl,
    updateFeedStatusUi: updateFeedStatusUi
  };
})(typeof window !== "undefined" ? window : globalThis);
