/**
 * DAR AL TAWḤĪD — Zakāt PDF-Export (html2pdf + Druck-Fallback)
 */
(function (global) {
  "use strict";

  const HTML2PDF_URL = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.2/dist/html2pdf.bundle.min.js";
  let html2pdfLoading = null;

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

  function waitForImages(root, timeoutMs) {
    const imgs = Array.from(root.querySelectorAll("img"));
    if (!imgs.length) return Promise.resolve();
    return Promise.race([
      Promise.all(
        imgs.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve();
              else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      ),
      new Promise((resolve) => setTimeout(resolve, timeoutMs || 2500))
    ]);
  }

  function openPrintFallback(html) {
    const w = global.open("", "_blank", "noopener");
    if (!w) throw new Error("Popup blockiert — bitte Popups erlauben oder erneut versuchen.");
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus({ preventScroll: true });
    setTimeout(() => {
      try {
        w.print();
      } catch (e) {}
    }, 350);
    return { ok: true, method: "print" };
  }

  async function exportZakatPdf(html, filename) {
    const frame = global.document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText =
      "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;opacity:0;pointer-events:none";
    global.document.body.appendChild(frame);

    const doc = frame.contentDocument || frame.contentWindow?.document;
    if (!doc) {
      frame.remove();
      return openPrintFallback(html);
    }

    doc.open();
    doc.write(html);
    doc.close();

    await waitForImages(doc.body, 3000);
    await new Promise((r) => setTimeout(r, 120));

    try {
      const html2pdf = await loadHtml2Pdf();
      const target = doc.querySelector(".zakat-pdf-root") || doc.body;
      await html2pdf()
        .set({
          margin: 0,
          filename: filename || "zakat-bericht.pdf",
          image: { type: "jpeg", quality: 0.96 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#f6f1e8",
            logging: false,
            width: 794,
            windowWidth: 794
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"], before: ".zakat-pdf-page + .zakat-pdf-page" }
        })
        .from(target)
        .save();
      frame.remove();
      return { ok: true, method: "pdf" };
    } catch (err) {
      frame.remove();
      try {
        return openPrintFallback(html);
      } catch (fallbackErr) {
        throw err;
      }
    }
  }

  global.DARZakatPdf = { exportZakatPdf };
})(typeof window !== "undefined" ? window : global);
