/* Royal Manuskript V4.2: non-destructive shared enhancements for /q/N/.
   No source quotation, original attribution, isnād or citation URL is rewritten. */
(() => {
  "use strict";
  const version = "royal-manuscript-v42";
  const themeKey = "dar-quellen-royal-theme";
  const root = document.documentElement;
  const body = document.body;
  const languageUI = {
  "de": {
    "source": "Quelle",
    "single": "Einzelner Quellenbeleg",
    "copy": "Kurzlink kopieren",
    "copied": "Kopiert ✓",
    "select": "Link auswählen",
    "light": "Helles Design einschalten",
    "dark": "Dunkles Design einschalten",
    "missing": "Für diesen Originalnachweis ist noch keine gültige Adresse eingetragen."
  },
  "ar": {
    "source": "المصدر",
    "single": "دليل المصدر",
    "copy": "نسخ الرابط المختصر",
    "copied": "تم النسخ ✓",
    "select": "تحديد الرابط",
    "light": "تفعيل المظهر الفاتح",
    "dark": "تفعيل المظهر الداكن",
    "missing": "لا يتوفر رابط صالح لهذا الدليل الأصلي بعد."
  },
  "en": {
    "source": "Source",
    "single": "Individual source reference",
    "copy": "Copy short link",
    "copied": "Copied ✓",
    "select": "Select link",
    "light": "Switch to light mode",
    "dark": "Switch to dark mode",
    "missing": "A valid link for this original reference is not yet available."
  },
  "tr": {
    "source": "Kaynak",
    "single": "Tek kaynak belgesi",
    "copy": "Kısa bağlantıyı kopyala",
    "copied": "Kopyalandı ✓",
    "select": "Bağlantıyı seç",
    "light": "Açık temayı etkinleştir",
    "dark": "Koyu temayı etkinleştir",
    "missing": "Bu özgün kaynak için henüz geçerli bir bağlantı bulunmuyor."
  },
  "ku": {
    "source": "Çavkanî",
    "single": "Belgeya çavkaniyê",
    "copy": "Girêdana kurt kopî bike",
    "copied": "Hat kopîkirin ✓",
    "select": "Girêdanê hilbijêre",
    "light": "Dîmena ronahî çalak bike",
    "dark": "Dîmena tarî çalak bike",
    "missing": "Ji bo vê belgeya orîjînal hîn girêdanek derbasdar tune ye."
  },
  "ckb": {
    "source": "سەرچاوە",
    "single": "بەڵگەی سەرچاوە",
    "copy": "کۆپیکردنی بەستەری کورت",
    "copied": "کۆپی کرا ✓",
    "select": "هەڵبژاردنی بەستەر",
    "light": "کردنەوەی دیمەنی ڕووناک",
    "dark": "کردنەوەی دیمەنی تاریک",
    "missing": "هێشتا بەستەرێکی دروست بۆ ئەم بەڵگە ڕەسەنە بەردەست نییە."
  },
  "bs": {
    "source": "Izvor",
    "single": "Pojedinačni izvorni dokaz",
    "copy": "Kopiraj kratki link",
    "copied": "Kopirano ✓",
    "select": "Označi link",
    "light": "Uključi svijetlu temu",
    "dark": "Uključi tamnu temu",
    "missing": "Važeći link za ovaj izvorni dokaz još nije dostupan."
  },
  "fr": {
    "source": "Source",
    "single": "Référence de source individuelle",
    "copy": "Copier le lien court",
    "copied": "Copié ✓",
    "select": "Sélectionner le lien",
    "light": "Activer le thème clair",
    "dark": "Activer le thème sombre",
    "missing": "Aucun lien valide n'est encore disponible pour cette référence originale."
  },
  "es": {
    "source": "Fuente",
    "single": "Referencia individual",
    "copy": "Copiar enlace corto",
    "copied": "Copiado ✓",
    "select": "Seleccionar enlace",
    "light": "Activar tema claro",
    "dark": "Activar tema oscuro",
    "missing": "Todavía no hay un enlace válido para esta fuente original."
  }
};
  function locale(){
    let code="";
    try{code=new URL(location.href).searchParams.get("lang")||new URL(location.href).searchParams.get("locale")||""}catch(_){}
    if(!languageUI[code]){
      try{code=localStorage.getItem("darAdultPreferredLocaleV1")||""}catch(_){}
    }
    if(!languageUI[code])code=document.documentElement.lang||"de";
    return languageUI[code]?code:"de";
  }
  const labels=()=>languageUI[locale()];
  if (!body || !body.classList.contains("qsource-body") || root.dataset.qRoyalReady === "1") return;
  root.dataset.qRoyalReady = "1";
  const path = location.pathname.match(/^\/q\/([1-9][0-9]*)\/?/);
  const number = path ? Number(path[1]) : null;
  const readTheme = () => {
    try { return localStorage.getItem(themeKey) === "dark" ? "dark" : "light"; }
    catch (_) { return "light"; }
  };
  const setTheme = (value) => {
    const next = value === "dark" ? "dark" : "light";
    root.setAttribute("data-q-theme", next);
    root.setAttribute("data-theme", next);
    const btn = document.querySelector(".rq-theme");
    if (btn) {
      btn.textContent = next === "dark" ? "☀" : "☾";
      btn.setAttribute("aria-label", next === "dark" ? labels().light : labels().dark);
      btn.setAttribute("title", btn.getAttribute("aria-label"));
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "dark" ? "#090c0b" : "#fcfdfc");
    try { localStorage.setItem(themeKey, next); } catch (_) {}
  };
  const page = document.querySelector(".qsource-page");
  const header = document.querySelector(".qsource-header");
  if (!page || !header) return;
  // Header keeps the actual, existing official logo file.
  const logo = header.querySelector(".qsource-logo");
  if (logo && logo.getAttribute("src") !== "/watermark-my-logo-full.png") {
    logo.setAttribute("src", "/watermark-my-logo-full.png");
  }
  if (logo && !logo.getAttribute("alt")) logo.alt = "DĀR AL TAWḤĪD – Original-Logo";
  const brand = header.querySelector(".qsource-brand");
  if (brand) brand.textContent = "DĀR AL TAWḤĪD";
  const sign = header.querySelector(".qsource-sign");
  if (sign) sign.textContent = "by Serhat Abu Malik";
  const change = document.createElement("button");
  change.type = "button";
  change.className = "rq-theme";
  header.appendChild(change);
  change.addEventListener("click", () => setTheme(root.getAttribute("data-q-theme") === "dark" ? "light" : "dark"));
  setTheme(readTheme());
  // Public deep links are isolated source cards, never an entry into the owner's index.
  const top = document.createElement("div");
  top.className = "rq-topbar";
  top.setAttribute("aria-label", labels().single);
  const badge = document.createElement("span");
  badge.textContent = number ? labels().source+" Q"+number : labels().single;
  top.appendChild(badge);
  header.insertAdjacentElement("afterend", top);
  for (const anchor of page.querySelectorAll('a[href]')) {
    try {
      const target = new URL(anchor.getAttribute("href"), location.href);
      if (target.origin === location.origin && (target.pathname === "/quellen" || target.pathname.startsWith("/quellen/"))) {
        anchor.remove();
      }
    } catch (_) {}
  }
  // Mark broken placeholder links as unavailable, never masquerade as valid evidence.
  for (const a of page.querySelectorAll('a.qsource-link[href="#"]')) {
    a.addEventListener("click", event => event.preventDefault());
    a.setAttribute("aria-disabled", "true");
    a.title = labels().missing;
  }
  let copyButton=null,copyState="normal";
  if (number) {
    const actions = document.createElement("div");
    actions.className = "rq-source-actions";
    const address = document.createElement("a");
    address.className = "rq-permalink";
    address.href = "/q/" + number + "/";
    address.textContent = "dar-al-tawhid.de/q/" + number + "/";
    const copy = document.createElement("button");
    copy.className = "rq-copy";
    copy.type = "button";
    copy.textContent = labels().copy;
    copyButton=copy;
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(new URL(address.href, location.href).href);
        copyState="copied";copy.textContent = labels().copied;
      } catch (_) {
        copyState="select";copy.textContent = labels().select;
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(address);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      setTimeout(() => { copyState="normal";copy.textContent = labels().copy; }, 1900);
    });
    actions.append(address, copy);
    const social = page.querySelector(".qsource-social");
    const footer = page.querySelector(".qsource-footer");
    page.insertBefore(actions, social || footer || null);
  }
  function refreshLocale(){
    const l=labels();
    top.setAttribute("aria-label",l.single);
    badge.textContent=number?l.source+" Q"+number:l.single;
    if(copyButton)copyButton.textContent=copyState==="copied"?l.copied:copyState==="select"?l.select:l.copy;
    const themeButton=document.querySelector(".rq-theme");
    if(themeButton){const name=root.getAttribute("data-q-theme")==="dark"?l.light:l.dark;themeButton.setAttribute("aria-label",name);themeButton.setAttribute("title",name)}
    for(const a of page.querySelectorAll('a.qsource-link[href="#"]'))a.title=l.missing;
  }
  ["dar:qlegacy:locale-ready","dar:q49:locale-ready","dar:q50:locale-ready","dar:q51:locale-ready","dar-adult-locale-changed","dar:locale-changed","popstate"].forEach(name=>window.addEventListener(name,refreshLocale));
  window.addEventListener("storage",event=>{if(event.key==="darAdultPreferredLocaleV1")refreshLocale()});
  refreshLocale();
  body.dataset.qRoyalVersion = version;
})();