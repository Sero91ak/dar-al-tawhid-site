/**
 * DAR AL TAWḤĪD — Bibliotheks-Cover-Generator (Admin)
 */
(function (global) {
  "use strict";

  const SERIES_STYLES = {
    Tawḥīd: { bg1: "#122033", bg2: "#1a2a42", accent: "#d6be84" },
    "ʿAqīdah": { bg1: "#1a2230", bg2: "#243248", accent: "#e8d49a" },
    "al-Asmāʾ waṣ-Ṣifāt": { bg1: "#101f35", bg2: "#182a45", accent: "#d8c08e" },
    "Qurʾān": { bg1: "#123628", bg2: "#1a4a38", accent: "#d4c48a" },
    Sunnah: { bg1: "#1f2430", bg2: "#2a3345", accent: "#dcc992" },
    Schirk: { bg1: "#2a1820", bg2: "#3a2230", accent: "#d0b884" },
    "Kufr und Ṭāghūt": { bg1: "#241820", bg2: "#342430", accent: "#d4bc88" },
    "Sünden und Reue": { bg1: "#1f2028", bg2: "#2b2d38", accent: "#d8c090" },
    Gebet: { bg1: "#152838", bg2: "#1f3850", accent: "#e0cc96" },
    Fiqh: { bg1: "#182a28", bg2: "#223a38", accent: "#d2c088" },
    Familie: { bg1: "#2a2220", bg2: "#3a302c", accent: "#dcc898" },
    Manhaj: { bg1: "#1c2430", bg2: "#283448", accent: "#d8be84" },
    Widerlegungen: { bg1: "#281820", bg2: "#382430", accent: "#d4b880" },
    default: { bg1: "#101f35", bg2: "#182a45", accent: "#d8c08e" }
  };

  function wrapLines(ctx, text, maxWidth, maxLines) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    });
    if (line) lines.push(line);
    return lines.slice(0, maxLines);
  }

  function fitFontSize(ctx, text, maxWidth, startSize, minSize, weight, family) {
    let size = startSize;
    while (size >= minSize) {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 1;
    }
    return minSize;
  }

  function drawCoverCanvas(options) {
    const W = 800;
    const H = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const style = SERIES_STYLES[options.series || options.category] || SERIES_STYLES.default;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, style.bg1);
    grad.addColorStop(1, style.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = style.accent;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.globalAlpha = 0.2;
    ctx.strokeRect(52, 52, W - 104, H - 104);
    ctx.globalAlpha = 1;

    ctx.fillStyle = style.accent;
    ctx.font = "600 28px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText("DAR AL TAWḤĪD", W / 2, 120);

    const topic = String(options.transliteratedTitle || options.topic || "").trim();
    if (topic) {
      ctx.font = "italic 24px Georgia, serif";
      ctx.fillText(topic, W / 2, 170);
    }

    const title = String(options.title || "").trim().toUpperCase();
    const titleSize = fitFontSize(ctx, title.split("\n")[0] || title, W - 120, 42, 24, "700", "Georgia, serif");
    ctx.font = `700 ${titleSize}px Georgia, 'Times New Roman', serif`;
    const titleLines = wrapLines(ctx, title, W - 120, 4);
    let y = 280;
    titleLines.forEach((line) => {
      ctx.fillText(line, W / 2, y);
      y += titleSize * 1.15;
    });

    const subtitle = String(options.subtitle || "").trim();
    if (subtitle) {
      ctx.fillStyle = "rgba(244, 236, 216, 0.88)";
      ctx.font = "400 20px Georgia, serif";
      const subLines = wrapLines(ctx, subtitle, W - 130, 3);
      y += 18;
      subLines.forEach((line) => {
        ctx.fillText(line, W / 2, y);
        y += 26;
      });
    }

    ctx.beginPath();
    ctx.arc(W / 2, H - 220, 42, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(214, 190, 132, 0.18)";
    ctx.fill();
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = style.accent;
    ctx.font = "700 22px Georgia, serif";
    ctx.fillText("DAR", W / 2, H - 228);
    ctx.font = "600 14px Georgia, serif";
    ctx.fillText("AL TAWḤĪD", W / 2, H - 206);

    const editor = String(options.editor || "Serhat Abu Malik").trim();
    ctx.fillStyle = "rgba(232, 220, 195, 0.82)";
    ctx.font = "500 18px Georgia, serif";
    ctx.fillText(editor, W / 2, H - 120);

    if (options.version) {
      ctx.font = "500 14px Georgia, serif";
      ctx.fillStyle = "rgba(200, 184, 150, 0.75)";
      ctx.fillText(`Version ${options.version}`, W / 2, H - 86);
    }

    return canvas;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Cover-Export fehlgeschlagen"))), type, quality);
    });
  }

  async function blobToBase64(blob) {
    const buffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function generateCoverVariants(options) {
    const canvas = drawCoverCanvas(options || {});
    const master = await canvasToBlob(canvas, "image/webp", 0.92);
    const smallCanvas = document.createElement("canvas");
    smallCanvas.width = 400;
    smallCanvas.height = 600;
    smallCanvas.getContext("2d").drawImage(canvas, 0, 0, 400, 600);
    const mediumCanvas = document.createElement("canvas");
    mediumCanvas.width = 600;
    mediumCanvas.height = 900;
    mediumCanvas.getContext("2d").drawImage(canvas, 0, 0, 600, 900);
    const small = await canvasToBlob(smallCanvas, "image/webp", 0.86);
    const medium = await canvasToBlob(mediumCanvas, "image/webp", 0.9);
    return {
      small: await blobToBase64(small),
      medium: await blobToBase64(medium),
      master: await blobToBase64(master)
    };
  }

  async function renderPdfFirstPageCover(file, options) {
    if (!global.pdfjsLib) throw new Error("PDF.js nicht geladen");
    const data = await file.arrayBuffer();
    const doc = await global.pdfjsLib.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / viewport.width, canvas.height / viewport.height);
    const scaled = page.getViewport({ scale });
    const x = (canvas.width - scaled.width) / 2;
    const y = (canvas.height - scaled.height) / 2;
    await page.render({ canvasContext: ctx, viewport: scaled, transform: [scale, 0, 0, scale, x, y] }).promise;
    const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let white = 0;
    for (let i = 0; i < sample.length; i += 16) {
      if (sample[i] > 245 && sample[i + 1] > 245 && sample[i + 2] > 245) white++;
    }
    if (white / (sample.length / 16) > 0.985) {
      throw new Error("Die erste Seite konnte nicht als Cover verwendet werden. Bitte lade ein Cover hoch oder verwende die automatische Cover-Vorlage.");
    }
    return generateCoverVariantsFromCanvas(canvas);
  }

  async function generateCoverVariantsFromCanvas(canvas) {
    const master = await canvasToBlob(canvas, "image/webp", 0.92);
    const smallCanvas = document.createElement("canvas");
    smallCanvas.width = 400;
    smallCanvas.height = 600;
    smallCanvas.getContext("2d").drawImage(canvas, 0, 0, 400, 600);
    const mediumCanvas = document.createElement("canvas");
    mediumCanvas.width = 600;
    mediumCanvas.height = 900;
    mediumCanvas.getContext("2d").drawImage(canvas, 0, 0, 600, 900);
    return {
      small: await blobToBase64(await canvasToBlob(smallCanvas, "image/webp", 0.86)),
      medium: await blobToBase64(await canvasToBlob(mediumCanvas, "image/webp", 0.9)),
      master: await blobToBase64(master)
    };
  }

  global.DARLibraryCoverGen = {
    SERIES_STYLES,
    drawCoverCanvas,
    generateCoverVariants,
    renderPdfFirstPageCover,
    generateCoverVariantsFromCanvas,
    blobToBase64
  };
})(window);
