/**
 * DAR Admin — Feed-Bild am Markdown-Beitrag (Original + Preview)
 */
(function (global) {
  "use strict";

  var stateByContext = Object.create(null);

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
          '<label class="switch"><input type="checkbox" id="feedEnabled-' + c + '" data-feed-enabled="' + c + '"><span></span></label>' +
        '</div>' +
        '<p class="feed-help">Dieses Bild erscheint automatisch im Feed und verlinkt zum Textbeitrag.</p>' +
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
    if (enabledEl) enabledEl.checked = !!feed.enabled && !!feed.image;
    if (altEl) altEl.value = feed.alt || "";
    var src = feed.image ? new URL(feed.image, siteOrigin || global.location.origin).href : "";
    st.previewUrl = src;
    renderPreviewEl(root, src);
  }

  function readUi(context) {
    var c = ctxKey(context);
    return {
      enabled: !!(document.querySelector('[data-feed-enabled="' + c + '"]') || {}).checked,
      alt: (document.querySelector('[data-feed-alt="' + c + '"]') || {}).value || ""
    };
  }

  function applyFeedToMarkdown(markdown, postId, title, context) {
    var st = getState(context);
    var ui = readUi(context);
    var hasImage = !st.removePending && (st.file || st.existingImage);
    var feed = global.DARQuellen.buildFeedFrontmatter(postId, title, {
      enabled: ui.enabled && hasImage,
      hasImage: hasImage,
      image: hasImage ? (st.existingImage || `/assets/posts/${postId}/feed-preview.jpg`) : "",
      originalImage: hasImage ? (st.existingOriginal || `/assets/posts/${postId}/feed-original.jpg`) : "",
      alt: ui.alt || ("Bildbeitrag zu: " + (title || "Beitrag")),
      shareEnabled: ui.enabled && hasImage
    });
    if (st.removePending || !ui.enabled) {
      feed = { enabled: false, image: "", originalImage: "", alt: "", shareEnabled: false };
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
    readUi: readUi
  };
})(typeof window !== "undefined" ? window : globalThis);
