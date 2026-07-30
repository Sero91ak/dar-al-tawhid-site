/* Legacy shim – canonical-source-library.js is the active module */
(function loadCanonicalSourceLibrary(global) {
  if (global.DARCanonicalSourceLibrary) return;
  const script = document.createElement("script");
  script.src = "/test/assets/library/canonical-source-library.js?v=1";
  script.defer = true;
  document.head.appendChild(script);
})(window);
