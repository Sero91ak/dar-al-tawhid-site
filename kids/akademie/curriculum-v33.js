/* DĀR AL TAWḤĪD KIDS V33 · Unterricht 79–82.
 * Exakt belegte Qurʾān-/Ṣaḥīḥ-Aussagen; Unterrichtsanwendungen als solche gekennzeichnet.
 * Drei Altersstufen, keine ungeprüften Masterstimmen-Aufnahmen und keine alten Fortschrittsänderungen.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!prior["akhlaq-mitgefuehl-andere-troesten"])return;
const additions={
  "adab-freundlich-um-etwas-bitten": {
    "id": "adab-freundlich-um-etwas-bitten",
    "subject": "adab",
    "pillar": "adab",
    "topic": "Höflich um etwas bitten",
    "title": "Adab · Freundlich um etwas bitten",
    "lead": "Ein freundlicher Wunsch respektiert auch die Entscheidung der anderen Person.",
    "goal": "Ich kann eine Bitte in ruhigen Worten aussprechen und akzeptiere eine höfliche Absage.",
    "quran": {
      "surah": 2,
      "ayah": 83,
      "label": "Sūrat al-Baqarah · 2:83",
      "arabic": "وَقُولُوا لِلنَّاسِ حُسْنًا",
      "meaning": "Und sprecht zu den Menschen auf gute Weise. (Versauszug, sinngemäß)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2593 · ʿĀʾishah",
      "text": "Der Prophet ﷺ lehrte, dass Allah Sanftmut liebt und für Sanftmut Gutes gewährt. (Sinngemäß, nicht wörtlich übersetzt)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/26226",
      "hadithNumber": "2593",
      "narrator": "ʿĀʾishah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "2:83",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "Der Qurʾān enthält hier die allgemeine Weisung, gut zu Menschen zu sprechen; Muslim 2593 lehrt Sanftmut. Das deutsche Wort 'bitte', das respektvolle Fragen und das Annehmen einer Absage sind unsere Anwendung, keine angeblich wörtliche Sunnah-Formel."
    },
    "hint": "Ein Kind muss einer fremden Person nichts geben, nur weil diese freundlich bittet. Bei Unsicherheit gelten eigene Grenzen und die Unterstützung vertrauter Erwachsener.",
    "sample": "Darf ich den Stift benutzen, bitte? Es ist auch in Ordnung, wenn du Nein sagst.",
    "ageText": {
      "4-5": {
        "intro": "Zwei Kinder möchten denselben Stift benutzen.",
        "lines": [
          "Ich frage: Darf ich ihn bitte kurz haben?",
          "Ich lasse dem anderen Kind Zeit zu antworten.",
          "Ein Nein darf ich akzeptieren.",
          "Wir suchen dann eine andere Lösung."
        ],
        "evidence": "Der Vers lehrt gute Worte. Die Stift-Szene ist eine erfundene Alltagsübung."
      },
      "6-8": {
        "intro": "Freundliches Bitten besteht aus mehr als einem besonderen Wort.",
        "lines": [
          "In Qurʾān 2:83 werden gute Worte gegenüber Menschen genannt.",
          "Der Prophet ﷺ lehrte Sanftmut im Umgang miteinander.",
          "Ich formuliere, was ich benötige, ohne jemanden anzuschreien.",
          "Die andere Person darf ablehnen, und ich darf ebenfalls freundlich Nein sagen."
        ],
        "evidence": "Qurʾān und Sunnah liefern Grundsätze; keine bestimmte deutsche Bitte-Formel ist als Wortlaut offenbart."
      },
      "9-10": {
        "intro": "Eine gute Bitte achtet die Würde und die Grenzen beider Seiten.",
        "lines": [
          "Qurʾān 2:83 gebietet im überlieferten Text gute Rede gegenüber Menschen.",
          "Muslim 2593 lehrt die besondere Bedeutung von Rifq, also sanfter Haltung.",
          "Daraus üben wir eine konkrete Bitte: klar, höflich und ohne Druck.",
          "Eine Ablehnung bedeutet nicht, dass man die andere Person beleidigen darf; im Notfall darf man direkt und dringend um Hilfe rufen."
        ],
        "evidence": "Die sozialen Übungsregeln werden aus allgemeinen Belegen abgeleitet, nicht als wörtliches Gebot des Ḥadīṯ dargestellt."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wie fragst du nach dem Stift?",
          "options": [
            "Darf ich den Stift bitte haben?",
            "Gib sofort her!"
          ],
          "correct": 0,
          "hint": "Denke an freundliche Worte.",
          "explain": "Eine ruhige Bitte ist gut."
        },
        {
          "type": "choice",
          "prompt": "Was kannst du tun, wenn jemand Nein sagt?",
          "options": [
            "Das Nein respektieren.",
            "Die Person anschreien."
          ],
          "correct": 0,
          "hint": "Jeder darf Grenzen haben.",
          "explain": "Wir suchen eine andere Lösung."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was fordert Qurʾān 2:83?",
          "options": [
            "Gute Worte gegenüber Menschen.",
            "Andere beim Bitten bedrohen."
          ],
          "correct": 0,
          "hint": "Denke an den Vers.",
          "explain": "Gute Worte gehören zum Adab."
        },
        {
          "type": "choice",
          "prompt": "Was lehrt Muslim 2593?",
          "options": [
            "Sanftmut wird von Allah geliebt.",
            "Schreien führt immer zum Ziel."
          ],
          "correct": 0,
          "hint": "Rifq heißt sanft handeln.",
          "explain": "Sanftmut ist ein guter Charakterzug."
        },
        {
          "type": "text",
          "prompt": "Formuliere eine Bitte, bei der ein Nein erlaubt bleibt.",
          "sample": "Darf ich bitte mitspielen? Falls es nicht klappt, ist das in Ordnung.",
          "hint": "Eine Bitte ist kein Befehl."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage ist quellentreu?",
          "options": [
            "Die Quellen lehren gutes Sprechen und Sanftmut; unsere deutsche Bitte ist ein Beispiel.",
            "Der Prophet ﷺ befahl genau den deutschen Satz 'Bitte gib mir den Stift'."
          ],
          "correct": 0,
          "hint": "Trenne Original und Anwendung.",
          "explain": "Wir erfinden kein Zitat."
        },
        {
          "type": "text",
          "prompt": "Was gehört zu einer höflichen Bitte?",
          "sample": "Ich sage klar, was ich brauche, frage ruhig und respektiere die Entscheidung.",
          "hint": "Gib ein konkretes Beispiel."
        },
        {
          "type": "text",
          "prompt": "Wann darf man eine Unterhaltung dringend unterbrechen?",
          "sample": "Wenn ich Schutz oder unmittelbare Hilfe brauche, darf ich direkt sprechen.",
          "hint": "Höflichkeit darf Sicherheit nicht verhindern."
        }
      ]
    },
    "voiceApproved": false
  },
  "tarbiyah-lernziel-freundlich-planen": {
    "id": "tarbiyah-lernziel-freundlich-planen",
    "subject": "akhlaq",
    "pillar": "tarbiyah",
    "topic": "Lernziele freundlich planen",
    "title": "Tarbiyah · Ein kleines Lernziel wählen",
    "lead": "Wir wählen ein erreichbares Ziel für diese Woche, ohne uns wegen Fehlern abzuwerten.",
    "goal": "Ich kann ein freiwilliges Ziel formulieren, einen passenden Schritt wählen und Veränderungen zulassen.",
    "quran": {
      "surah": 18,
      "ayah": 23,
      "label": "Sūrat al-Kahf · 18:23–24",
      "arabic": "وَلَا تَقُولَنَّ لِشَيْءٍ إِنِّي فَاعِلٌ ذَٰلِكَ غَدًا إِلَّا أَنْ يَشَاءَ اللَّهُ",
      "meaning": "Und sage nicht über etwas: Ich werde das morgen tun – außer: wenn Allah will. (Sinngemäßer Auszug aus zwei Versen)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2664 · Abū Hurayrah",
      "text": "Der Prophet ﷺ riet, sich um das Nützliche zu bemühen, Allah um Hilfe zu bitten und nicht aufzugeben. (Sinngemäßer Teilauszug)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/139097",
      "hadithNumber": "2664",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "18:23-24",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "18:23–24 betreffen die Abhängigkeit künftiger Vorhaben von Allahs Willen, nicht vorgeschriebene Wochenpläne. Muslim 2664 ruft zu nützlicher Bemühung und Hilfe Allahs auf. Wochenziel und Kontrollkästchen sind ausdrücklich reine Pädagogik; Überforderung und Bewertung des Kindes verboten."
    },
    "hint": "Nie ein bestimmtes Lerntempo erzwingen. Bei Bedarf gemeinsam das Ziel verändern oder pausieren.",
    "sample": "In shāʾ Allāh lerne ich diese Woche eine kurze Erklärung und bitte um Hilfe, wenn ich sie brauche.",
    "ageText": {
      "4-5": {
        "intro": "Ich möchte in dieser Woche etwas Kleines lernen.",
        "lines": [
          "Ich wähle: Ich lerne ein neues gutes Wort.",
          "Ein Erwachsener zeigt es mir.",
          "Ich übe, wenn es gut für mich passt.",
          "Wenn ich mehr Zeit brauche, ist das in Ordnung."
        ],
        "evidence": "Die Wochenaufgabe ist unsere Idee. Der Qurʾān lehrt, 'wenn Allah will' zu sagen."
      },
      "6-8": {
        "intro": "Ein gutes Ziel ist erreichbar, freundlich und veränderbar.",
        "lines": [
          "In Qurʾān 18:23–24 lernen wir, künftige Vorhaben Allahs Willen anzuvertrauen.",
          "Muslim 2664 ermuntert zu hilfreichem Bemühen und dazu, Allah um Hilfe zu bitten.",
          "Ich wähle ein kleines Lernziel für die Woche und plane eine kurze Übung.",
          "Wenn es nicht gelingt, frage ich nach Hilfe oder passe meinen Plan an."
        ],
        "evidence": "Der Ḥadīṯ enthält keine Stundenplan-Methode; sie ist eine praktische Lernhilfe."
      },
      "9-10": {
        "intro": "Planen heißt, bewusst zu handeln und zugleich Grenzen anzuerkennen.",
        "lines": [
          "Der Wortlaut von 18:23–24 verbindet Vorhaben für morgen mit Allahs Willen.",
          "Der authentische Ḥadīṯ Muslim 2664 fordert dazu auf, sich um das Nützliche zu bemühen und Allah um Hilfe zu bitten.",
          "Unsere Übung übersetzt diese Grundsätze in ein freiwilliges Wochenziel mit einem machbaren Schritt.",
          "Das ist weder eine religiöse Pflicht zur Selbstoptimierung noch ein Urteil über den Wert einer Person."
        ],
        "evidence": "Wir trennen Offenbarung von pädagogischen Techniken wie Wochenplan und Erfolgskontrolle."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Welches Ziel ist freundlich zu dir?",
          "options": [
            "Ich lerne ein kleines Wort.",
            "Ich muss alles sofort können."
          ],
          "correct": 0,
          "hint": "Nimm ein erreichbares Ziel.",
          "explain": "Kleine Übungen sind erlaubt."
        },
        {
          "type": "choice",
          "prompt": "Was machst du, wenn es noch nicht klappt?",
          "options": [
            "Ich bitte um Hilfe.",
            "Ich beschimpfe mich."
          ],
          "correct": 0,
          "hint": "Lernen darf Zeit brauchen.",
          "explain": "Ein neuer Versuch ist gut."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was lernen wir aus 18:23–24 über Pläne?",
          "options": [
            "Wir sagen 'in shāʾ Allāh', wenn wir etwas für morgen vorhaben.",
            "Alles wird immer genauso klappen."
          ],
          "correct": 0,
          "hint": "Allahs Wille gehört zu unseren Plänen.",
          "explain": "Wir vertrauen auf Allah."
        },
        {
          "type": "choice",
          "prompt": "Wozu rät Muslim 2664?",
          "options": [
            "Das Nützliche tun und Allah um Hilfe bitten.",
            "Jede Mühe verweigern."
          ],
          "correct": 0,
          "hint": "Verbinde Bemühung und Hilfe.",
          "explain": "Wir bemühen uns."
        },
        {
          "type": "text",
          "prompt": "Formuliere ein erreichbares Wochenziel.",
          "sample": "In shāʾ Allāh lerne ich zwei gute Wörter und übe zweimal kurz.",
          "hint": "Ziel und kleine Handlung nennen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was ist keine wörtliche Vorschrift aus den Belegen?",
          "options": [
            "Für jeden Lernenden genau sieben Kontrollkästchen zu machen.",
            "Allahs Willen in Vorhaben berücksichtigen."
          ],
          "correct": 0,
          "hint": "Unterscheide Unterrichtsmethode und Offenbarung.",
          "explain": "Die Wochenliste ist unsere eigene Methode."
        },
        {
          "type": "text",
          "prompt": "Wie passen Qurʾān 18:23–24 und Muslim 2664 zusammen?",
          "sample": "Ich plane im Bewusstsein von Allahs Willen und bemühe mich um das Nützliche mit Seiner Hilfe.",
          "hint": "Nenne beide Quellen."
        },
        {
          "type": "text",
          "prompt": "Was ist bei einem zu schweren Ziel richtig?",
          "sample": "Ich passe es an, hole Hilfe oder pausiere, ohne mich abzuwerten.",
          "hint": "Erkläre eine sichere Lösung."
        }
      ]
    },
    "voiceApproved": false
  },
  "nafs-bei-angst-hilfe-holen": {
    "id": "nafs-bei-angst-hilfe-holen",
    "subject": "akhlaq",
    "pillar": "nafs",
    "topic": "Sich bei Angst Hilfe holen",
    "title": "Nafs · Hilfe suchen, wenn ich Angst habe",
    "lead": "Angst darf ausgesprochen werden. Ich kann Hilfe bei vertrauten Erwachsenen suchen.",
    "goal": "Ich kann ein ungutes Gefühl benennen und eine sichere erwachsene Vertrauensperson ansprechen.",
    "quran": {
      "surah": 5,
      "ayah": 2,
      "label": "Sūrat al-Māʾidah · 5:2",
      "arabic": "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ",
      "meaning": "Und helft einander zu Güte und Gottesfurcht. (Versauszug, sinngemäß)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2699 · Abū Hurayrah",
      "text": "Der Prophet ﷺ lehrte, dass Allah Seinem Diener hilft, solange dieser seinem Bruder hilft. (Teilauszug, sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/123965",
      "hadithNumber": "2699",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "5:2",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "Qurʾān 5:2 gebietet gegenseitige Hilfe beim Guten, Muslim 2699 beschreibt Hilfe für Menschen. Der Satz 'Ein Kind soll bei Angst Hilfe holen' ist ein kinderschützender pädagogischer Schluss, keine wörtliche Ḥadīṯformel. Bei Bedrohung keine Geheimhaltung, niemals Schuldzuweisung."
    },
    "hint": "Bei Angst, Gewalt, Grenzverletzung, Krankheit oder Unwohlsein Hilfe durch sichere Erwachsene ermutigen. Bei ernster Gefahr schnell lokale Notfallhilfe veranlassen. Keine Verpflichtung, private Erlebnisse vor anderen Kindern zu erzählen.",
    "sample": "Ich habe Angst und brauche deine Hilfe. Kannst du mir bitte zuhören?",
    "ageText": {
      "4-5": {
        "intro": "Manchmal macht mir etwas Angst.",
        "lines": [
          "Ich darf sagen: Ich habe Angst.",
          "Ich gehe zu einer vertrauten erwachsenen Person.",
          "Ich sage: Bitte hilf mir.",
          "Wenn jemand nicht zuhört, suche ich eine andere sichere Person."
        ],
        "evidence": "Qurʾān und Sunnah lehren Hilfe. Die Sätze sind eigene Schutzübungen."
      },
      "6-8": {
        "intro": "Hilfe suchen ist eine gute und sichere Möglichkeit, mit Sorgen umzugehen.",
        "lines": [
          "Qurʾān 5:2 fordert dazu auf, sich beim Guten zu helfen.",
          "Der Prophet ﷺ lehrte, Menschen in Not zu unterstützen.",
          "Wenn ich Angst habe, darf ich genau sagen, was mir Sorgen macht.",
          "Ich darf weitere vertraute Erwachsene ansprechen, wenn die erste Person mir nicht hilft."
        ],
        "evidence": "Die Beispiele sind Schutzpädagogik und keine überlieferte Geschichte."
      },
      "9-10": {
        "intro": "Wir üben, Angst ernst zu nehmen und sichere Hilfewege zu erkennen.",
        "lines": [
          "Sūrat al-Māʾidah 5:2 fordert gegenseitige Hilfe im Guten.",
          "Muslim 2699 erklärt die Bedeutung menschlicher Unterstützung.",
          "Es ist keine Schwäche, einer vertrauenswürdigen Person Sorgen, Grenzverletzungen oder eine Bedrohung mitzuteilen.",
          "Niemand darf dich mit einem vermeintlichen religiösen Gebot zum Verschweigen von gefährlichen Situationen zwingen."
        ],
        "evidence": "Die konkrete Hilfe-Anleitung ist pädagogisch; sie wird nicht als zusätzlicher Ḥadīṯtext ausgegeben."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Du bekommst Angst. Was darfst du sagen?",
          "options": [
            "Bitte hilf mir.",
            "Ich muss es für immer geheim halten."
          ],
          "correct": 0,
          "hint": "Du darfst mit Erwachsenen reden.",
          "explain": "Hilfe holen ist gut."
        },
        {
          "type": "choice",
          "prompt": "Die erste erwachsene Person hört nicht zu. Was dann?",
          "options": [
            "Eine andere sichere Person suchen.",
            "Niemals wieder etwas sagen."
          ],
          "correct": 0,
          "hint": "Du darfst Hilfe bekommen.",
          "explain": "Versuche es bei einer weiteren vertrauten Person."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was gebietet Qurʾān 5:2?",
          "options": [
            "Einander im Guten helfen.",
            "Bei Gefahr nie helfen."
          ],
          "correct": 0,
          "hint": "Der Vers spricht von Zusammenarbeit.",
          "explain": "Wir helfen im Guten."
        },
        {
          "type": "choice",
          "prompt": "Was machst du bei einer beängstigenden Situation?",
          "options": [
            "Zu einer sicheren erwachsenen Person gehen.",
            "Alles allein geheim halten."
          ],
          "correct": 0,
          "hint": "Sicherheit zuerst.",
          "explain": "Du darfst immer um Hilfe bitten."
        },
        {
          "type": "text",
          "prompt": "Welche Bitte kannst du sagen, wenn du Angst hast?",
          "sample": "Ich fühle mich nicht sicher. Bitte hör mir zu und hilf mir.",
          "hint": "Du musst nicht jedes Erlebnis in der Gruppe erzählen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage folgt pädagogisch aus den Quellen?",
          "options": [
            "Hilfe zu suchen und zu leisten ist gut und gehört zu einer sicheren Gemeinschaft.",
            "Gefährliche Geheimnisse müssen immer verborgen bleiben."
          ],
          "correct": 0,
          "hint": "Beachte den Schutz von Kindern.",
          "explain": "Hilfesuche ist erlaubt."
        },
        {
          "type": "text",
          "prompt": "Was kannst du tun, wenn jemand dich einschüchtert?",
          "sample": "Ich suche eine sichere erwachsene Person und erzähle, dass ich Hilfe brauche.",
          "hint": "Eine sichere Person kann helfen."
        },
        {
          "type": "text",
          "prompt": "Worin unterscheiden sich Offenbarung und Lernübung?",
          "sample": "Vers und Ḥadīṯ handeln von Hilfe; die konkrete Sicherheitsübung haben Erwachsene pädagogisch formuliert.",
          "hint": "Originalbeleg und Anwendung trennen."
        }
      ]
    },
    "voiceApproved": false
  },
  "fiqh-wann-wudu-noetig": {
    "id": "fiqh-wann-wudu-noetig",
    "subject": "fiqh",
    "pillar": "fiqh",
    "topic": "Wann braucht man Wuḍūʾ?",
    "title": "Fiqh · Wann brauche ich Wuḍūʾ?",
    "lead": "Wir lernen, dass die rituelle Reinheit für das Gebet nötig ist, und wann eine neue Waschung erforderlich wird.",
    "goal": "Ich unterscheide: noch bestehender Wuḍūʾ oder aufgehobene Reinheit; bei Fragen hole ich die Hilfe eines Erwachsenen.",
    "quran": {
      "surah": 5,
      "ayah": 6,
      "label": "Sūrat al-Māʾidah · 5:6",
      "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى الْمَرَافِقِ",
      "meaning": "O ihr, die ihr glaubt, wenn ihr euch zum Gebet erhebt, so wascht eure Gesichter und eure Hände bis zu den Ellenbogen. (Versauszug, sinngemäß)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 135; Ṣaḥīḥ Muslim, Nr. 225 · Abū Hurayrah",
      "text": "Der Prophet ﷺ erklärte, dass nach Eintritt von Ḥadaṯ das Gebet nicht angenommen wird, bis man Wuḍūʾ vollzogen hat. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/6252",
      "hadithNumber": "135",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "5:6",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-13",
      "note": "Ḥadaṯ bedeutet ein Zustand, der die rituelle Reinheit aufhebt. Bestehender gültiger Wuḍūʾ muss nicht vor jeder einzelnen Ṣalāh erneuert werden; wenn Reinheit verloren ging, ist erneute Reinigung erforderlich. Sonderfälle wie Tayammum, Ghusl und unterschiedliche Nullifikatoren gehören in gesonderte fiqhrechtlich geprüfte Lektionen. Kinder vor der Pubertät lernen ohne irreführenden Schuld- oder Pflichtdruck."
    },
    "hint": "Die Lehrübung ersetzt keine individuelle fiqhrechtliche Prüfung. Bei Unsicherheit Eltern fragen; nicht obsessives Kontrollieren fördern. Nicht behaupten, jede Ṣalāh erfordere automatisch frisches Wuḍūʾ.",
    "sample": "Wenn ich noch Wuḍūʾ habe, kann ich damit beten. Wenn es aufgehoben wurde, muss ich mich vor dem Gebet neu reinigen.",
    "ageText": {
      "4-5": {
        "intro": "Zum Gebet gehört Reinheit.",
        "lines": [
          "Ich lerne mit einem Erwachsenen, was Wuḍūʾ bedeutet.",
          "Wuḍūʾ ist eine Waschung vor dem Gebet.",
          "Manchmal bleibt die Waschung für mehrere Gebete gültig.",
          "Wenn ich Hilfe brauche, frage ich ruhig nach."
        ],
        "evidence": "Qurʾān 5:6 nennt die Reinigung vor dem Gebet; wir lernen ohne Druck."
      },
      "6-8": {
        "intro": "Die rituelle Waschung muss gültig sein, wenn wir beten.",
        "lines": [
          "In Qurʾān 5:6 wird die Waschung im Zusammenhang mit dem Gebet erklärt.",
          "Der Prophet ﷺ erläuterte, dass Ḥadaṯ den Wuḍūʾ aufhebt.",
          "Habe ich noch gültigen Wuḍūʾ, brauche ich ihn nicht nur wegen einer neuen Gebetszeit zu wiederholen.",
          "Wurde er aufgehoben, reinige ich mich vor dem Gebet erneut und frage bei Zweifeln eine vertrauenswürdige Person."
        ],
        "evidence": "Ḥadaṯ wird hier als Aufhebung des Wuḍūʾ erklärt; strittige Detailfälle werden nicht behandelt."
      },
      "9-10": {
        "intro": "Wir unterscheiden die Pflicht zur Reinheit von einer empfohlenen Erneuerung der Waschung.",
        "lines": [
          "Qurʾān 5:6 enthält die grundlegenden Bestimmungen zur Reinigung vor der Ṣalāh.",
          "Abū Hurayrah überlieferte in al-Buḫārī 135, dass das Gebet nach Ḥadaṯ erst nach erneuter Reinigung gültig ist.",
          "Die Gebetszeit allein hebt einen bestehenden Wuḍūʾ nicht auf; mehrere Gebete mit derselben gültigen Waschung sind möglich.",
          "Fragen über Sonderfälle, Tayammum, Ghusl oder einzelne Wuḍūʾ-Brecher behandeln wir sorgfältig mit qualifizierter Begleitung."
        ],
        "evidence": "Die Regel der bestehenden Reinheit wird als grundlegender fiqhrechtlicher Unterricht vermittelt; daraus folgt keine Pflicht für kleine Kinder vor der Pubertät."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was lernen wir vor dem Gebet?",
          "options": [
            "Wuḍūʾ und Reinheit.",
            "Absichtlich unrein zu bleiben."
          ],
          "correct": 0,
          "hint": "Eine gute Vorbereitung ist wichtig.",
          "explain": "Wuḍūʾ ist die Waschung."
        },
        {
          "type": "choice",
          "prompt": "Wenn du etwas nicht verstehst, was kannst du tun?",
          "options": [
            "Einen vertrauten Erwachsenen fragen.",
            "Dich dafür schämen."
          ],
          "correct": 0,
          "hint": "Fragen hilft.",
          "explain": "Du darfst ruhig lernen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Braucht man immer neues Wuḍūʾ, nur weil ein neues Gebet beginnt?",
          "options": [
            "Nein, wenn die Reinigung noch gültig ist.",
            "Ja, jede neue Uhrzeit hebt die Reinheit auf."
          ],
          "correct": 0,
          "hint": "Denke an die bestehende Reinheit.",
          "explain": "Eine gültige Waschung kann erhalten bleiben."
        },
        {
          "type": "choice",
          "prompt": "Wann ist neuer Wuḍūʾ nötig?",
          "options": [
            "Wenn die rituelle Reinheit aufgehoben wurde.",
            "Nach jedem gelesenen Wort."
          ],
          "correct": 0,
          "hint": "Ḥadaṯ ist entscheidend.",
          "explain": "Wenn Wuḍūʾ aufgehoben wurde, erneuern wir ihn."
        },
        {
          "type": "text",
          "prompt": "Was machst du bei Unsicherheit über Wuḍūʾ?",
          "sample": "Ich frage einen Erwachsenen, der die Regeln kennt, und lerne ohne Angst.",
          "hint": "Nicht ständig aus bloßem Zweifel wiederholen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage ist fiqhrechtlich richtig?",
          "options": [
            "Eine neue Gebetszeit hebt einen gültigen Wuḍūʾ nicht automatisch auf.",
            "Jedes Gebet erfordert zwingend eine neue Waschung."
          ],
          "correct": 0,
          "hint": "Die Quelle behandelt Ḥadaṯ.",
          "explain": "Entscheidend ist die bestehende Reinheit."
        },
        {
          "type": "text",
          "prompt": "Wie hängen Qurʾān 5:6 und al-Buḫārī 135 zusammen?",
          "sample": "Der Vers erklärt die Reinigung vor dem Gebet; der Ḥadīṯ betont die Notwendigkeit erneuter Reinheit nach Ḥadaṯ.",
          "hint": "Nenne beide Stellen."
        },
        {
          "type": "text",
          "prompt": "Welche Fälle werden in späteren Stunden eigens geprüft?",
          "sample": "Tayammum, Ghusl, einzelne Wuḍūʾ-Brecher und Unterschiede in besonderen Situationen.",
          "hint": "Vermeide ungeprüfte Einzelfallurteile."
        }
      ]
    },
    "voiceApproved": false
  }
};
for(const [id,l] of Object.entries(additions)){
 if(prior[id]||!l.quran||!l.hadith||!l.sourceAudit?.hadithUrl?.startsWith("https://dorar.net/hadith/sharh/")||l.voiceApproved!==false)throw Error("V33 invalid "+id);
 for(const age of ["4-5","6-8","9-10"])if(l.ageText?.[age]?.lines?.length!==4||l.questions?.[age]?.length<(age==="4-5"?2:3))throw Error("V33 age "+id+" "+age);
}
window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions});
window.DARKidsAcademyCurriculumV33=Object.freeze({"version":"20261013-v33","count":4,"ids":["adab-freundlich-um-etwas-bitten","tarbiyah-lernziel-freundlich-planen","nafs-bei-angst-hilfe-holen","fiqh-wann-wudu-noetig"],"pillars":{"adab-freundlich-um-etwas-bitten":"adab","tarbiyah-lernziel-freundlich-planen":"tarbiyah","nafs-bei-angst-hilfe-holen":"nafs","fiqh-wann-wudu-noetig":"fiqh"},"religiousSourcesVerified":true,"voiceRecordingsApproved":false,"requiresHumanAudioApproval":true});
})();
