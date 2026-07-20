/**
 * DAR AL TAWḤĪD — Bibliotheks-Cover-Generator (Premium, Admin)
 */
(function (global) {
  "use strict";

  const LOGO_URL = "/app-icon-512.png";
  const SERIF = "Georgia, 'Times New Roman', 'Cormorant Garamond', 'Palatino Linotype', serif";
  const COVER_W = 1600;
  const COVER_H = 2400;

  const THEME_PALETTES = {
    Tawḥīd: { bg1: "#0c241c", bg2: "#143028", accent: "#e8dcc4", ink: "#f8f4ea", mood: "green" },
    "ʿAqīdah": { bg1: "#0d1a2e", bg2: "#152842", accent: "#d8c08e", ink: "#f4efe4", mood: "navy" },
    "al-Asmāʾ waṣ-Ṣifāt": { bg1: "#101f35", bg2: "#182a45", accent: "#d8c08e", ink: "#f2ebe0", mood: "navy" },
    "Qurʾān": { bg1: "#0e2036", bg2: "#16304c", accent: "#e8dcc0", ink: "#f7f2e8", mood: "quran" },
    Sunnah: { bg1: "#181f2c", bg2: "#223046", accent: "#dcc992", ink: "#f0e9db", mood: "navy" },
    Schirk: { bg1: "#22161e", bg2: "#32202c", accent: "#d4bc88", ink: "#f2e8dc", mood: "bordeaux" },
    "Kufr und Ṭāghūt": { bg1: "#241820", bg2: "#342430", accent: "#d4bc88", ink: "#efe6da", mood: "bordeaux" },
    "Sünden und Reue": { bg1: "#2a1820", bg2: "#3a2230", accent: "#d8c090", ink: "#f2e8dc", mood: "bordeaux" },
    Gebet: { bg1: "#142636", bg2: "#1e3850", accent: "#e0cc96", ink: "#f0e8d8", mood: "navy" },
    Fiqh: { bg1: "#162a28", bg2: "#223a38", accent: "#d2c088", ink: "#efe8da", mood: "green" },
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

  function drawPremiumFrame(ctx, W, H, palette) {
    const inset = 56;
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 2;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 1;
    ctx.strokeRect(inset + 14, inset + 14, W - (inset + 14) * 2, H - (inset + 14) * 2);
    ctx.restore();
  }

  function drawOrnaments(ctx, W, H, palette) {
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.5;
    const yTop = 148;
    const yBottom = H - 248;
    ctx.beginPath();
    ctx.moveTo(108, yTop);
    ctx.lineTo(W - 108, yTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128, yBottom);
    ctx.lineTo(W - 128, yBottom);
    ctx.stroke();
    if (palette.mood === "quran") {
      ctx.globalAlpha = 0.07;
      for (let i = 0; i < 6; i++) {
        const y = 300 + i * 52;
        ctx.beginPath();
        ctx.moveTo(140, y);
        ctx.lineTo(W - 140, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawHiResImage(ctx, img, dx, dy, dw, dh) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function downscaleCanvas(source, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);
    return canvas;
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
    const W = COVER_W;
    const H = COVER_H;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const palette = paletteFor(options);

    const grad = ctx.createLinearGradient(0, 0, W * 0.25, H);
    grad.addColorStop(0, palette.bg1);
    grad.addColorStop(0.55, palette.bg2);
    grad.addColorStop(1, palette.bg1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.22, 30, W * 0.5, H * 0.22, 520);
    glow.addColorStop(0, "rgba(255,255,255,0.06)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.2, W * 0.5, H * 0.5, H * 0.72);
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    drawPremiumFrame(ctx, W, H, palette);
    drawOrnaments(ctx, W, H, palette);

    ctx.textAlign = "center";

    const category = String(options.category || options.topic || "").trim();
    if (category) {
      ctx.fillStyle = palette.accent;
      ctx.font = `600 28px ${SERIF}`;
      ctx.letterSpacing = "0.18em";
      ctx.fillText(category.toUpperCase(), W / 2, 196);
      ctx.letterSpacing = "0";
    }

    ctx.fillStyle = palette.accent;
    ctx.font = `600 34px ${SERIF}`;
    ctx.letterSpacing = "0.22em";
    ctx.fillText("DAR AL TAWḤĪD", W / 2, category ? 248 : 210);
    ctx.letterSpacing = "0";

    const title = String(options.title || "Neue Veröffentlichung").trim();
    const titleSize = fitFontSize(ctx, title, W - 200, 78, 42, "700", SERIF);
    ctx.fillStyle = palette.ink;
    ctx.font = `700 ${titleSize}px ${SERIF}`;
    const titleLines = wrapLines(ctx, title, W - 200, 5);
    let y = category ? 360 : 320;
    titleLines.forEach((line) => {
      ctx.fillText(line, W / 2, y);
      y += titleSize * 1.16;
    });

    const subtitle = String(options.subtitle || "").trim();
    if (subtitle) {
      ctx.fillStyle = "rgba(244, 236, 216, 0.84)";
      ctx.font = `400 30px ${SERIF}`;
      const subLines = wrapLines(ctx, subtitle, W - 220, 3);
      y += 18;
      subLines.forEach((line) => {
        ctx.fillText(line, W / 2, y);
        y += 38;
      });
    }

    try {
      const logo = await loadLogo();
      const logoSize = 220;
      const logoY = H - 430;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, logoY, logoSize / 2 + 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fill();
      ctx.strokeStyle = palette.accent;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(W / 2, logoY, logoSize / 2 + 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      drawHiResImage(ctx, logo, W / 2 - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
      ctx.restore();
    } catch (e) {
      /* Logo optional */
    }

    ctx.fillStyle = palette.accent;
    ctx.font = `italic 500 26px ${SERIF}`;
    ctx.fillText("Serhat Abu Malik", W / 2, H - 210);

    ctx.fillStyle = "rgba(232, 220, 195, 0.72)";
    ctx.font = `500 22px ${SERIF}`;
    ctx.letterSpacing = "0.12em";
    ctx.fillText("DAR AL TAWḤĪD · QUELLENBASIERTE AUSGABE", W / 2, H - 158);
    ctx.letterSpacing = "0";

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
    const master = await canvasToBlob(canvas, "image/webp", 0.94);
    const small = await canvasToBlob(downscaleCanvas(canvas, 400, 600), "image/webp", 0.88);
    const medium = await canvasToBlob(downscaleCanvas(canvas, 800, 1200), "image/webp", 0.92);
    return {
      small: await blobToBase64(small),
      medium: await blobToBase64(medium),
      master: await blobToBase64(master)
    };
  }

  function composeImageToCoverCanvas(img, mode) {
    const canvas = document.createElement("canvas");
    canvas.width = COVER_W;
    canvas.height = COVER_H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8f6f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const fit = mode === "cover"
      ? Math.max(canvas.width / img.width, canvas.height / img.height)
      : Math.min(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * fit;
    const h = img.height * fit;
    drawHiResImage(ctx, img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    return canvas;
  }

  async function renderPdfFirstPageCover(file) {
    if (!global.pdfjsLib) throw new Error("PDF.js nicht geladen");
    const data = await file.arrayBuffer();
    const doc = await global.pdfjsLib.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const fitScale = Math.min(COVER_W / baseViewport.width, COVER_H / baseViewport.height) * 2;
    const scaledViewport = page.getViewport({ scale: fitScale });
    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = Math.ceil(scaledViewport.width);
    renderCanvas.height = Math.ceil(scaledViewport.height);
    const renderCtx = renderCanvas.getContext("2d");
    renderCtx.fillStyle = "#ffffff";
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    await page.render({ canvasContext: renderCtx, viewport: scaledViewport }).promise;
    const canvas = document.createElement("canvas");
    canvas.width = COVER_W;
    canvas.height = COVER_H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const fit = Math.min(canvas.width / renderCanvas.width, canvas.height / renderCanvas.height);
    const w = renderCanvas.width * fit;
    const h = renderCanvas.height * fit;
    drawHiResImage(ctx, renderCanvas, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
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
    const master = await canvasToBlob(canvas, "image/webp", 0.94);
    const small = await canvasToBlob(downscaleCanvas(canvas, 400, 600), "image/webp", 0.88);
    const medium = await canvasToBlob(downscaleCanvas(canvas, 800, 1200), "image/webp", 0.92);
    return {
      small: await blobToBase64(small),
      medium: await blobToBase64(medium),
      master: await blobToBase64(master)
    };
  }

  global.DARLibraryCoverGen = {
    COVER_W,
    COVER_H,
    THEME_PALETTES,
    drawCoverCanvas,
    generateCoverVariants,
    renderPdfFirstPageCover,
    generateCoverVariantsFromCanvas,
    composeImageToCoverCanvas,
    blobToBase64,
    loadLogo
  };
})(window);
