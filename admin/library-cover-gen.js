/**
 * DAR AL TAWḤĪD — Bibliotheks-Cover-Generator (Premium, Admin)
 */
(function (global) {
  "use strict";

  const LOGO_URL = "/app-icon-512.png";
  const SERIF = "Georgia, 'Times New Roman', 'Cormorant Garamond', serif";

  const THEME_PALETTES = {
    Tawḥīd: { bg1: "#0f2a22", bg2: "#16352b", accent: "#e8dcc4", ink: "#f4efe4", mood: "green" },
    "ʿAqīdah": { bg1: "#0f1f35", bg2: "#162a45", accent: "#d8c08e", ink: "#f2ebe0", mood: "navy" },
    "al-Asmāʾ waṣ-Ṣifāt": { bg1: "#101f35", bg2: "#182a45", accent: "#d8c08e", ink: "#f2ebe0", mood: "navy" },
    "Qurʾān": { bg1: "#0f2238", bg2: "#16304a", accent: "#e8dcc0", ink: "#f5f0e6", mood: "quran" },
    Sunnah: { bg1: "#1a2230", bg2: "#243248", accent: "#dcc992", ink: "#efe8da", mood: "navy" },
    Schirk: { bg1: "#241820", bg2: "#342430", accent: "#d4bc88", ink: "#efe6da", mood: "bordeaux" },
    "Kufr und Ṭāghūt": { bg1: "#241820", bg2: "#342430", accent: "#d4bc88", ink: "#efe6da", mood: "bordeaux" },
    "Sünden und Reue": { bg1: "#2a1820", bg2: "#3a2230", accent: "#d8c090", ink: "#f2e8dc", mood: "bordeaux" },
    Gebet: { bg1: "#152838", bg2: "#1f3850", accent: "#e0cc96", ink: "#f0e8d8", mood: "navy" },
    Fiqh: { bg1: "#182a28", bg2: "#223a38", accent: "#d2c088", ink: "#efe8da", mood: "green" },
    Familie: { bg1: "#2a2220", bg2: "#3a302c", accent: "#dcc898", ink: "#f2ebe0", mood: "brown" },
    Manhaj: { bg1: "#1c2430", bg2: "#283448", accent: "#d8be84", ink: "#efe8da", mood: "navy" },
    Widerlegungen: { bg1: "#281820", bg2: "#382430", accent: "#d4b880", ink: "#efe6da", mood: "bordeaux" },
    default: { bg1: "#101f35", bg2: "#182a45", accent: "#d8c08e", ink: "#f2ebe0", mood: "navy" }
  };

  let logoImage = null;
  let logoLoading = null;

  function paletteFor(options) {
    return THEME_PALETTES[options?.topic] || THEME_PALETTES[options?.category] || THEME_PALETTES.default;
  }

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

  function drawOrnaments(ctx, W, H, palette) {
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.14;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(72, 96);
    ctx.lineTo(W - 72, 96);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(96, H - 168);
    ctx.lineTo(W - 96, H - 168);
    ctx.stroke();
    if (palette.mood === "quran") {
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 5; i++) {
        const y = 220 + i * 42;
        ctx.beginPath();
        ctx.moveTo(120, y);
        ctx.lineTo(W - 120, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  async function loadLogo() {
    if (logoImage) return logoImage;
    if (logoLoading) return logoLoading;
    logoLoading = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        logoImage = img;
        resolve(img);
      };
      img.onerror = () => reject(new Error("Logo konnte nicht geladen werden"));
      img.src = LOGO_URL;
    });
    return logoLoading;
  }

  async function drawCoverCanvas(options) {
    const W = 800;
    const H = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const palette = paletteFor(options);

    const grad = ctx.createLinearGradient(0, 0, W * 0.2, H);
    grad.addColorStop(0, palette.bg1);
    grad.addColorStop(1, palette.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.18, 20, W * 0.5, H * 0.18, 280);
    glow.addColorStop(0, "rgba(255,255,255,0.05)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    drawOrnaments(ctx, W, H, palette);

    ctx.textAlign = "center";
    ctx.fillStyle = palette.accent;
    ctx.font = `600 24px ${SERIF}`;
    ctx.fillText("DAR AL TAWḤĪD", W / 2, 78);

    const topic = String(options.topic || options.transliteratedTitle || "").trim();
    if (topic) {
      ctx.fillStyle = "rgba(244, 236, 216, 0.78)";
      ctx.font = `italic 20px ${SERIF}`;
      ctx.fillText(topic, W / 2, 118);
    }

    const title = String(options.title || "Neue Veröffentlichung").trim();
    const titleSize = fitFontSize(ctx, title, W - 120, 40, 22, "700", SERIF);
    ctx.fillStyle = palette.ink;
    ctx.font = `700 ${titleSize}px ${SERIF}`;
    const titleLines = wrapLines(ctx, title, W - 120, 5);
    let y = 220;
    titleLines.forEach((line) => {
      ctx.fillText(line, W / 2, y);
      y += titleSize * 1.18;
    });

    const subtitle = String(options.subtitle || "").trim();
    if (subtitle) {
      ctx.fillStyle = "rgba(244, 236, 216, 0.82)";
      ctx.font = `400 18px ${SERIF}`;
      const subLines = wrapLines(ctx, subtitle, W - 130, 3);
      y += 12;
      subLines.forEach((line) => {
        ctx.fillText(line, W / 2, y);
        y += 24;
      });
    }

    try {
      const logo = await loadLogo();
      const logoSize = 108;
      const logoY = H - 250;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, logoY, logoSize / 2 + 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = palette.accent;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(W / 2, logoY, logoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logo, W / 2 - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
      ctx.restore();
    } catch (e) {
      /* Logo optional — Cover bleibt nutzbar */
    }

    ctx.fillStyle = palette.accent;
    ctx.font = `600 13px ${SERIF}`;
    ctx.fillText("by Serhat Abu Malik", W / 2, H - 168);

    ctx.fillStyle = "rgba(232, 220, 195, 0.86)";
    ctx.font = `500 17px ${SERIF}`;
    ctx.fillText("Serhat Abu Malik", W / 2, H - 118);

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
    const canvas = await drawCoverCanvas(options || {});
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

  async function renderPdfFirstPageCover(file) {
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
    THEME_PALETTES,
    drawCoverCanvas,
    generateCoverVariants,
    renderPdfFirstPageCover,
    generateCoverVariantsFromCanvas,
    blobToBase64,
    loadLogo
  };
})(window);
