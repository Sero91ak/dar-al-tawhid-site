/* Kids Duʿāʾ · redaktionell überprüfbare sinngemäße Wort-/Bedeutungsgruppen.
   Nur exakt zugeordnete Einträge werden als einzelne deutsche Bedeutungen gezeigt.
   Alle anderen Duʿāʾs zeigen die vorhandene freigegebene Gesamtübersetzung. */
(function(){
  "use strict";
  var byId={
  "dua-knowledge": [
    "Mein Herr",
    "vermehre mir",
    "Wissen"
  ],
  "dua-parents": [
    "Unser Herr",
    "vergib",
    "mir",
    "und meinen Eltern",
    "und den Gläubigen",
    "am Tag",
    "an dem stattfindet",
    "die Abrechnung"
  ],
  "dua-protection": [
    "Mein Herr",
    "ich suche Zuflucht",
    "bei Dir",
    "vor",
    "den Einflüsterungen",
    "der Teufel",
    "und ich suche Zuflucht",
    "bei Dir",
    "mein Herr",
    "davor, dass",
    "sie anwesend sind"
  ],
  "dua-sleep": [
    "O Allah",
    "in Deinem Namen",
    "lebe ich",
    "und sterbe ich"
  ],
  "dua-wake": [
    "Alles Lob",
    "gehört Allah",
    "Der",
    "uns lebendig machte",
    "nachdem",
    "Er",
    "uns sterben ließ",
    "und zu Ihm",
    "die Auferstehung"
  ],
  "dua-eating": [
    "Im Namen",
    "Allahs"
  ],
  "dua-after-eating": [
    "Alles Lob",
    "gehört Allah",
    "Der",
    "mir zu essen gab",
    "dies",
    "und es mir gewährte",
    "ohne",
    "ohne eigene",
    "Kraft",
    "von mir",
    "und keine",
    "Macht"
  ],
  "dua-toilet-enter": [
    "O Allah",
    "ich",
    "suche Zuflucht",
    "bei Dir",
    "vor",
    "den männlichen Teufeln",
    "und den weiblichen Teufeln"
  ],
  "dua-toilet-exit": [
    "Deine Vergebung erbitte ich"
  ],
  "dua-leave-home": [
    "Im Namen",
    "Allahs",
    "ich vertraue",
    "auf",
    "Allah",
    "keine",
    "Macht",
    "und keine",
    "Kraft",
    "außer",
    "durch Allah"
  ],
  "dua-mosque-enter": [
    "O Allah",
    "öffne",
    "mir",
    "die Tore",
    "Deiner Barmherzigkeit"
  ],
  "dua-mosque-exit": [
    "O Allah",
    "ich",
    "bitte Dich",
    "um",
    "Deine Huld"
  ],
  "dua-afiyah": [
    "O Allah",
    "ich",
    "bitte Dich",
    "um Verzeihung",
    "und Wohlergehen",
    "im",
    "Diesseits",
    "und im Jenseits"
  ],
  "dua-rabbana-atina": [
    "Unser Herr",
    "gib uns",
    "im",
    "Diesseits",
    "Gutes",
    "und im",
    "Jenseits",
    "Gutes",
    "und bewahre uns",
    "vor der Strafe",
    "des Feuers"
  ],
  "dua-repentance": [
    "Unser Herr",
    "wir taten Unrecht",
    "uns selbst",
    "und wenn",
    "nicht",
    "Du vergibst",
    "uns",
    "und Dich unser erbarmst",
    "werden wir gewiss",
    "zu den",
    "Verlierern gehören"
  ],
  "dua-clear-speech": [
    "Mein Herr",
    "weite",
    "mir",
    "meine Brust",
    "und erleichtere",
    "mir",
    "meine Angelegenheit",
    "und löse",
    "einen Knoten",
    "von",
    "meiner Zunge",
    "damit sie verstehen",
    "meine Worte"
  ],
  "dua-accept-deeds": [
    "Unser Herr",
    "nimm an",
    "von uns",
    "gewiss Du",
    "Du bist",
    "der Allhörende",
    "der Allwissende"
  ],
  "dua-heart-guidance": [
    "Unser Herr",
    "nicht",
    "lass abweichen",
    "unsere Herzen",
    "nachdem",
    "Du",
    "uns rechtgeleitet hast",
    "und schenke",
    "uns",
    "von",
    "Dir",
    "Barmherzigkeit",
    "gewiss Du",
    "Du bist",
    "der viel Schenkende"
  ],
  "dua-ya-muqallib": [
    "O",
    "Wender",
    "der Herzen",
    "festige",
    "mein Herz",
    "auf",
    "Deiner Religion"
  ],
  "dua-guidance-taqwa": [
    "O Allah",
    "ich",
    "bitte Dich",
    "um Rechtleitung",
    "und Gottesfurcht",
    "und Keuschheit",
    "und Genügsamkeit"
  ]
};
  window.DARKidsDuaWordMeanings={
    get:function(dua,words){
      var rows=dua&&byId[String(dua.id||"")];
      return rows&&Array.isArray(words)&&rows.length===words.length?rows.slice():null;
    },
    coverage:function(){return Object.keys(byId).length}
  };
})();
