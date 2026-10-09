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
  Object.assign(byId,{
  "dua-kids-ride": [
    "Gepriesen sei",
    "Der",
    "dienstbar machte",
    "für uns",
    "dies",
    "obwohl nicht",
    "wir",
    "es",
    "bezwingen konnten",
    "und gewiss wir",
    "zu",
    "unserem Herrn",
    "zurückkehren werden"
  ],
  "dua-kids-rain": [
    "O Allah",
    "lass Regen fallen",
    "der nützlich ist"
  ],
  "dua-kids-after-rain": [
    "Uns wurde Regen gegeben",
    "durch die Huld",
    "Allahs",
    "und Seine Barmherzigkeit"
  ],
  "dua-kids-calamity": [
    "Wir",
    "gehören Allah",
    "und wir",
    "zu Ihm",
    "kehren zurück",
    "O Allah",
    "belohne mich",
    "in",
    "meinem Unglück",
    "und gib Ersatz",
    "mir",
    "etwas Besseres",
    "als dieses"
  ],
  "dua-kids-healing": [
    "Nimm hinweg",
    "das Leiden",
    "Herr",
    "der Menschen",
    "heile",
    "Du",
    "bist der Heiler",
    "keine",
    "Heilung",
    "außer",
    "Deiner Heilung",
    "eine Heilung",
    "die keine",
    "zurücklässt",
    "Krankheit"
  ],
  "dua-kids-pain": [
    "Im Namen",
    "Allahs",
    "ich suche Zuflucht",
    "bei der Macht",
    "Allahs",
    "und Seiner Kraft",
    "vor",
    "dem Übel",
    "dessen, was",
    "ich spüre",
    "und befürchte"
  ],
  "dua-kids-anger": [
    "Ich suche Zuflucht",
    "bei Allah",
    "vor",
    "dem Satan",
    "dem Verfluchten"
  ],
  "dua-kids-after-adhan": [
    "O Allah",
    "Herr",
    "dieses",
    "Rufes",
    "vollkommenen",
    "und des Gebets",
    "das verrichtet wird",
    "gib",
    "Muḥammad",
    "die Wasīlah",
    "und Vorzüglichkeit",
    "und erwecke ihn",
    "zu einer Stellung",
    "lobenswerten",
    "die",
    "Du ihm versprochen hast"
  ],
  "dua-kids-after-prayer": [
    "Ich bitte um Vergebung",
    "Allahs",
    "O Allah",
    "Du",
    "bist der Frieden",
    "und von Dir",
    "kommt der Frieden",
    "gesegnet bist Du",
    "Besitzer",
    "der Majestät",
    "und der Ehre"
  ],
  "dua-kids-gathering": [
    "Gepriesen bist Du",
    "O Allah",
    "und Dir gehört das Lob",
    "ich bezeuge",
    "dass",
    "kein",
    "Gott zu verehren ist",
    "außer",
    "Dir",
    "ich bitte Dich um Vergebung",
    "und ich kehre um",
    "zu Dir"
  ],
  "dua-kids-children-protection": [
    "Ich suche für euch beide Schutz",
    "mit den Worten",
    "Allahs",
    "den vollkommenen",
    "vor",
    "jedem",
    "Satan",
    "und schädlichen Wesen",
    "und vor",
    "jedem",
    "Blick",
    "der schadet"
  ],
  "dua-kids-ruqyah": [
    "Im Namen",
    "Allahs",
    "spreche ich Ruqyah über dich",
    "vor",
    "jedem",
    "Ding",
    "das dir schadet",
    "vor",
    "dem Übel",
    "jeder",
    "Seele",
    "oder",
    "dem Blick",
    "eines Neiders",
    "Allah",
    "möge dich heilen",
    "im Namen",
    "Allahs",
    "spreche ich Ruqyah über dich"
  ],
  "dua-kids-cemetery": [
    "Friede",
    "sei mit euch",
    "Bewohner",
    "dieser Stätten",
    "unter",
    "den Gläubigen",
    "und Muslimen",
    "und wir",
    "wenn",
    "es will",
    "Allah",
    "werden euch folgen",
    "ich bitte",
    "Allah",
    "für uns",
    "und für euch",
    "um Wohlergehen"
  ],
  "dua-kids-five-good-things": [
    "O Allah",
    "vergib",
    "mir",
    "und erbarme Dich meiner",
    "und leite mich recht",
    "und schenke mir Wohlergehen",
    "und versorge mich"
  ],
  "dua-kids-distress": [
    "Es gibt keinen",
    "anbetungswürdigen Gott",
    "außer",
    "Allah",
    "dem Gewaltigen",
    "dem Mildtätigen",
    "es gibt keinen",
    "anbetungswürdigen Gott",
    "außer",
    "Allah",
    "Herrn",
    "des Thrones",
    "des gewaltigen",
    "es gibt keinen",
    "anbetungswürdigen Gott",
    "außer",
    "Allah",
    "Herrn",
    "der Himmel",
    "und Herrn",
    "der Erde",
    "und Herrn",
    "des Thrones",
    "des edlen"
  ],
  "dua-kids-new-place-protection": [
    "Ich suche Zuflucht",
    "bei den Worten",
    "Allahs",
    "den vollkommenen",
    "vor",
    "dem Übel",
    "dessen, was",
    "Er erschaffen hat"
  ],
  "dua-kids-morning-evening-protection": [
    "Im Namen",
    "Allahs",
    "mit Dessen",
    "kein",
    "schaden kann",
    "zusammen mit",
    "Seinem Namen",
    "etwas",
    "auf",
    "der Erde",
    "und nicht",
    "im",
    "Himmel",
    "und Er",
    "ist der Allhörende",
    "der Allwissende"
  ],
  "dua-kids-between-sujud": [
    "Mein Herr",
    "vergib",
    "mir",
    "mein Herr",
    "vergib",
    "mir"
  ],
  "dua-kids-ruku-sujud": [
    "Gepriesen bist Du",
    "O Allah",
    "unser Herr",
    "und Dir gehört Lob",
    "O Allah",
    "vergib",
    "mir"
  ],
  "dua-kids-wind": [
    "O Allah",
    "ich",
    "bitte Dich",
    "um sein Gutes",
    "und um das Gute",
    "das",
    "in ihm ist",
    "und das Gute",
    "dessen, womit",
    "er gesandt wurde",
    "mit ihm",
    "und ich suche Zuflucht",
    "bei Dir",
    "vor",
    "seinem Übel",
    "und dem Übel",
    "das",
    "in ihm ist",
    "und dem Übel",
    "dessen, womit",
    "er gesandt wurde",
    "mit ihm"
  ],
  "dua-kids-jannah-fire": [
    "O Allah",
    "ich",
    "bitte Dich",
    "um das Paradies",
    "und suche Zuflucht",
    "bei Dir",
    "vor",
    "dem Feuer"
  ]
});
  Object.assign(byId,{
  "kids-dua-002-sabr-thabbit": [
    "Unser Herr",
    "gieße aus",
    "über uns",
    "Geduld",
    "und festige",
    "unsere Schritte",
    "und hilf uns",
    "gegen",
    "das Volk",
    "das ungläubige"
  ],
  "kids-dua-003-la-tuakhidhna": [
    "Unser Herr",
    "nicht",
    "nimm uns zur Rechenschaft",
    "wenn",
    "wir vergessen",
    "oder",
    "Fehler machen"
  ],
  "kids-dua-004-ighfir-dhunubana": [
    "Unser Herr",
    "vergib",
    "uns",
    "unsere Sünden",
    "und unser Übermaß",
    "in",
    "unserer Angelegenheit",
    "und festige",
    "unsere Schritte"
  ],
  "kids-dua-005-faghfir-lana": [
    "Unser Herr",
    "wir glauben",
    "so vergib",
    "uns",
    "und erbarme Dich unser",
    "und Du bist",
    "der Beste",
    "der Barmherzigen"
  ],
  "kids-dua-006-rabbi-ighfir-warham": [
    "Mein Herr",
    "vergib",
    "und erbarme Dich",
    "und Du bist",
    "der Beste",
    "der Barmherzigen"
  ],
  "kids-dua-007-qalb-salim": [
    "und nicht",
    "beschäme mich",
    "am Tag",
    "an dem sie auferweckt werden",
    "am Tag",
    "nicht",
    "nützt",
    "Besitz",
    "und auch nicht",
    "Kinder",
    "außer",
    "wer",
    "kommt",
    "zu Allah",
    "mit einem Herzen",
    "einem gesunden"
  ],
  "kids-dua-008-hukman-walhiqni": [
    "Mein Herr",
    "schenke",
    "mir",
    "Urteilskraft",
    "und füge mich hinzu",
    "den Rechtschaffenen"
  ],
  "kids-dua-009-lisan-sidq": [
    "und mache",
    "mir",
    "einen Ruf",
    "einen wahrhaftigen",
    "unter",
    "den Späteren"
  ],
  "kids-dua-010-jannah-naim": [
    "und mache mich",
    "zu",
    "den Erben",
    "des Gartens",
    "der Wonne"
  ],
  "kids-dua-011-najji-mina-zalimin": [
    "Mein Herr",
    "rette mich",
    "vor",
    "dem Volk",
    "dem ungerechten"
  ],
  "kids-dua-012-awzini-shukr": [
    "Mein Herr",
    "leite mich an",
    "dass",
    "ich dankbar bin",
    "für Deine Gunst",
    "die",
    "Du erwiesen hast",
    "mir",
    "und",
    "meinen Eltern"
  ],
  "kids-dua-013-amal-salih": [
    "und dass",
    "ich handle",
    "rechtschaffen",
    "womit Du zufrieden bist"
  ],
  "kids-dua-014-adkhilni-rahmatik": [
    "und lass mich eintreten",
    "durch Deine Barmherzigkeit",
    "unter",
    "Deine Diener",
    "die Rechtschaffenen"
  ],
  "kids-dua-015-fattah": [
    "Unser Herr",
    "entscheide",
    "zwischen uns",
    "und zwischen",
    "unserem Volk",
    "in Wahrheit",
    "und Du bist",
    "der Beste",
    "der Entscheidenden"
  ],
  "kids-dua-016-afrigh-sabra-tawaffana": [
    "Unser Herr",
    "gieße aus",
    "über uns",
    "Geduld",
    "und lass uns sterben",
    "als Muslime"
  ],
  "kids-dua-017-rahma-ilm": [
    "Unser Herr",
    "Du umfasst",
    "alles",
    "Dinge",
    "mit Barmherzigkeit",
    "und Wissen",
    "so vergib",
    "denjenigen",
    "die bereuen",
    "und folgen",
    "Deinem Weg",
    "und bewahre sie",
    "vor der Strafe",
    "des Höllenfeuers"
  ],
  "kids-dua-018-adkhilhum-jannat-adn": [
    "Unser Herr",
    "und lass sie eintreten",
    "in die Gärten",
    "von ʿAdn",
    "die",
    "Du ihnen versprachst",
    "und diejenigen",
    "die rechtschaffen waren",
    "unter",
    "ihren Vätern",
    "und ihren Ehepartnern",
    "und ihren Nachkommen"
  ],
  "kids-dua-019-qihim-sayyiat": [
    "und bewahre sie",
    "vor schlechten Taten",
    "und wen",
    "Du bewahrst",
    "vor schlechten Taten",
    "an jenem Tag",
    "so hast Du gewiss",
    "Dich seiner erbarmt"
  ],
  "kids-dua-020-rabbana-ghfir-lana-ikhwan": [
    "Unser Herr",
    "vergib",
    "uns",
    "und unseren Brüdern",
    "die",
    "uns vorausgingen",
    "im Glauben"
  ],
  "kids-dua-021-la-ghill": [
    "und nicht",
    "lasse entstehen",
    "in",
    "unseren Herzen",
    "Groll",
    "gegen diejenigen",
    "die glauben",
    "unser Herr",
    "gewiss Du bist",
    "gütig",
    "barmherzig"
  ],
  "kids-dua-022-tawakkalna-anabna": [
    "Unser Herr",
    "auf Dich",
    "vertrauen wir",
    "und zu Dir",
    "kehren wir um",
    "und zu Dir",
    "ist die Rückkehr"
  ],
  "kids-dua-023-la-tajalna-fitna": [
    "Unser Herr",
    "nicht",
    "mache uns",
    "zur Versuchung",
    "für diejenigen",
    "die ungläubig sind",
    "und vergib",
    "uns",
    "unser Herr"
  ],
  "kids-dua-024-atmim-nurana": [
    "Unser Herr",
    "vollende",
    "für uns",
    "unser Licht",
    "und vergib",
    "uns",
    "gewiss Du",
    "über",
    "alle",
    "Dinge",
    "hast Macht"
  ],
  "kids-dua-025-qunut-witr": [
    "O Allah",
    "leite mich recht",
    "unter denen",
    "die Du geleitet hast",
    "und schenke mir Wohlergehen",
    "unter denen",
    "denen Du Wohlergehen gabst",
    "und nimm Dich meiner an",
    "unter denen",
    "deren Du Dich angenommen hast"
  ]
});
  window.DARKidsDuaWordMeanings={
    get:function(dua,words){
      var rows=dua&&byId[String(dua.id||"")];
      return rows&&Array.isArray(words)&&rows.length===words.length?rows.slice():null;
    },
    coverage:function(){return Object.keys(byId).length}
  };
})();
