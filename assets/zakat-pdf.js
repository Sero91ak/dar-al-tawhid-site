/**
 * DAR AL TAWḤĪD — Zakāt PDF-Export (iOS/Android: Share + Blob, kein about:blank)
 */
(function (global) {
  "use strict";

  const HTML2PDF_URL = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.2/dist/html2pdf.bundle.min.js";
  let html2pdfLoading = null;

  function isMobile() {
    return global.matchMedia?.("(max-width: 768px)")?.matches || /iPhone|iPad|iPod|Android/i.test(global.navigator?.userAgent || "");
  }

  function loadHtml2Pdf() {
    if (global.html2pdf) return Promise.resolve(global.html2pdf);
    if (html2pdfLoading) return html2pdfLoading;
    html2pdfLoading = new Promise((resolve, reject) => {
      const script = global.document.createElement("script");
      script.src = HTML2PDF_URL;
      script.async = true;
      script.onload = () => {
        if (global.html2pdf) resolve(global.html2pdf);
        else reject(new Error("PDF-Bibliothek nicht verfügbar"));
      };
      script.onerror = () => reject(new Error("PDF-Bibliothek konnte nicht geladen werden"));
      global.document.head.appendChild(script);
    });
    return html2pdfLoading;
  }

  async function fetchAsDataUrl(url) {
    const res = await fetch(url, { mode: "cors", credentials: "same-origin" });
    if (!res.ok) throw new Error(`Bild ${res.status}`);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function inlineImages(html) {
    const origin = String(global.location?.origin || "https://dar-al-tawhid.de").replace(/\/$/, "");
    const urls = [...html.matchAll(/src="([^"]+\.(?:jpg|jpeg|png|webp))"/gi)].map((m) => m[1]);
    let out = html;
    for (const raw of new Set(urls)) {
      const url = raw.startsWith("http") ? raw : `${origin}${raw.startsWith("/") ? "" : "/"}${raw}`;
      try {
        const data = await fetchAsDataUrl(url);
        out = out.split(`src="${raw}"`).join(`src="${data}"`);
      } catch (e) {}
    }
    return out;
  }

  function cleanupExportUi() {
    global.document.getElementById("zakat-pdf-export-host")?.remove();
    global.document.getElementById("zakat-pdf-overlay")?.remove();
    global.document.body.classList.remove("zakat-pdf-print-mode");
  }

  function mountHiddenHost(html) {
    cleanupExportUi();
    const host = global.document.createElement("div");
    host.id = "zakat-pdf-export-host";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:fixed;left:-9999px;top:0;width:794px;height:1123px;opacity:0;pointer-events:none;z-index:-1;overflow:hidden";

    const parsed = new DOMParser().parseFromString(html, "text/html");
    parsed.querySelectorAll("style").forEach((node) => host.appendChild(node.cloneNode(true)));
    const root = parsed.querySelector(".zakat-pdf-root");
    if (root) host.appendChild(root.cloneNode(true));
    global.document.body.appendChild(host);
    return host;
  }

  function waitForImages(root, timeoutMs) {
    const imgs = Array.from(root.querySelectorAll("img"));
    if (!imgs.length) return Promise.resolve();
    return Promise.race([
      Promise.all(
        imgs.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete && img.naturalWidth) resolve();
              else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      ),
      new Promise((resolve) => setTimeout(resolve, timeoutMs || 4000))
    ]);
  }

  async function shareOrDownload(blob, filename) {
    const file = new File([blob], filename, { type: "application/pdf" });
    if (global.navigator?.canShare?.({ files: [file] })) {
      await global.navigator.share({ files: [file], title: "Zakāt-Bericht" });
      return { ok: true, method: "share" };
    }
    const url = URL.createObjectURL(blob);
    try {
      const link = global.document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      link.style.display = "none";
      global.document.body.appendChild(link);
      link.click();
      link.remove();
      return { ok: true, method: "download" };
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    }
  }

  function injectPrintStyles() {
    if (global.document.getElementById("zakat-pdf-print-css")) return;
    const style = global.document.createElement("style");
    style.id = "zakat-pdf-print-css";
    style.textContent = `@media print{
      body.zakat-pdf-print-mode *{visibility:hidden}
      body.zakat-pdf-print-mode #zakat-pdf-overlay,#zakat-pdf-overlay *{visibility:visible}
      body.zakat-pdf-print-mode #zakat-pdf-overlay{position:absolute;inset:0;background:#fff;overflow:visible}
      body.zakat-pdf-print-mode #zakat-pdf-toolbar{display:none!important}
      body.zakat-pdf-print-mode .zakat-pdf-page{page-break-after:auto;border:none}
    }`;
    global.document.head.appendChild(style);
  }

  function showPreviewOverlay(html) {
    cleanupExportUi();
    injectPrintStyles();

    const overlay = global.document.createElement("div");
    overlay.id = "zakat-pdf-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:#1a1a1a;overflow:auto;-webkit-overflow-scrolling:touch";

    const toolbar = global.document.createElement("div");
    toolbar.id = "zakat-pdf-toolbar";
    toolbar.style.cssText =
      "position:sticky;top:0;display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;background:#173843;z-index:2";

    const closeBtn = mkBtn("Schließen", "#5c2a2a");
    closeBtn.onclick = () => cleanupExportUi();

    const printBtn = mkBtn("Als PDF speichern", "#c5a059", "#173843");
    printBtn.onclick = () => {
      global.document.body.classList.add("zakat-pdf-print-mode");
      global.setTimeout(() => {
        try {
          global.print();
        } finally {
          global.setTimeout(() => global.document.body.classList.remove("zakat-pdf-print-mode"), 500);
        }
      }, 100);
    };

    const hint = global.document.createElement("span");
    hint.textContent = isMobile()
      ? "Oder: Teilen-Symbol oben → „Sichere in Dateien“"
      : "Drucken → Ziel „Als PDF speichern“ wählen";
    hint.style.cssText = "color:#f6f1e8;font-size:11px;line-height:1.4;flex:1 1 100%;padding:2px 0";

    toolbar.append(closeBtn, printBtn, hint);

    const body = global.document.createElement("div");
    body.style.cssText = "padding:10px;max-width:820px;margin:0 auto";
    const parsed = new DOMParser().parseFromString(html, "text/html");
    parsed.querySelectorAll("style").forEach((node) => body.appendChild(node.cloneNode(true)));
    const root = parsed.querySelector(".zakat-pdf-root");
    if (root) body.appendChild(root.cloneNode(true));

    overlay.append(toolbar, body);
    global.document.body.appendChild(overlay);
    return { ok: true, method: "overlay" };
  }

  function mkBtn(label, bg, color) {
    const btn = global.document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.style.cssText = `border:0;border-radius:8px;padding:10px 14px;font-weight:700;font-size:13px;background:${bg};color:${color || "#fff"}`;
    return btn;
  }

  async function exportZakatPdf(html, filename) {
    cleanupExportUi();
    let prepared = html;
    try {
      prepared = await inlineImages(html);
    } catch (e) {}

    const host = mountHiddenHost(prepared);
    const target = host.querySelector(".zakat-pdf-root") || host;
    await waitForImages(host, 4000);
    await new Promise((r) => setTimeout(r, 250));

    try {
      const html2pdf = await loadHtml2Pdf();
      const blob = await html2pdf()
        .set({
          margin: 0,
          filename: filename || "zakat-bericht.pdf",
          image: { type: "jpeg", quality: 0.92 },
          html2canvas: {
            scale: Math.min(2, global.devicePixelRatio || 1.5),
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#f6f1e8",
            logging: false,
            width: 794,
            height: 1123,
            windowWidth: 794,
            windowHeight: 1123,
            scrollX: 0,
            scrollY: 0
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all"] }
        })
        .from(target)
        .outputPdf("blob");

      cleanupExportUi();

      if (!(blob instanceof Blob) || blob.size < 200) {
        throw new Error("PDF konnte nicht erzeugt werden");
      }

      try {
        return await shareOrDownload(blob, filename || "zakat-bericht.pdf");
      } catch (shareErr) {
        if (shareErr?.name === "AbortError") return { ok: true, method: "cancelled" };
        return showPreviewOverlay(prepared);
      }
    } catch (err) {
      cleanupExportUi();
      return showPreviewOverlay(prepared);
    }
  }

  global.DARZakatPdf = { exportZakatPdf, cleanupExportUi };
})(typeof window !== "undefined" ? window : global);
