/* Gemeinsame Qurʾān-Rezitation, gleiche Quelle und Pfade wie die DAR-AL-TAWḤĪD-Apps:
   /quran-audio/{edition}/{globaleAyah}.mp3 (eigener Endpunkt, Standard-Edition ar.alafasy).
   Das Gerät spricht nur mit dar-al-tawhid.de, kein Drittanbieter. */
(function () {
  if (window.DARKidsQuranAudio) return;
  var EDITION = "ar.alafasy";
  var COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  function globalAyah(surah, ayah) {
    var s = Math.max(1, Math.min(114, Number(surah) || 1));
    var n = Math.max(1, Number(ayah) || 1);
    var base = 0;
    for (var i = 0; i < s - 1; i++) base += COUNTS[i];
    return base + n;
  }
  function url(surah, ayah, edition) {
    return "/quran-audio/" + (edition || EDITION) + "/" + globalAyah(surah, ayah) + ".mp3";
  }
  window.DARKidsQuranAudio = { edition: EDITION, globalAyah: globalAyah, url: url };
})();
