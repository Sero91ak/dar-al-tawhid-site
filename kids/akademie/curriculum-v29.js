/* DĀR AL TAWḤĪD KIDS V29: Unterricht 63–66, four independent sourced lessons.
 * Each lesson includes distinct age texts (4–5, 6–8, 9–10), child-safe exercises.
 * Exact Qurʾān passages and Ṣaḥīḥ references; paraphrases clearly marked.
 * No unapproved speech recordings or learning-progress changes.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!prior["family-geschwister-unterstuetzen"])return;
const additions={
  "aqidah-allah-pflanzen-wachsen": {
    "id": "aqidah-allah-pflanzen-wachsen",
    "subject": "aqidah",
    "pillar": "tawhid",
    "topic": "Allah ließ Pflanzen wachsen",
    "title": "Tawḥīd · Allah lässt Pflanzen wachsen",
    "lead": "Wir sehen, wie Pflanzen durch Allahs Schöpfung wachsen.",
    "goal": "Ich erkenne Allah als Schöpfer und kann Pflanzen behutsam pflegen.",
    "quran": {
      "surah": 6,
      "ayah": 99,
      "label": "Sūrat al-Anʿām · 6:99",
      "arabic": "وَهُوَ الَّذِي أَنْزَلَ مِنَ السَّمَاءِ مَاءً فَأَخْرَجْنَا بِهِ نَبَاتَ كُلِّ شَيْءٍ",
      "meaning": "Er ist es, Der Wasser vom Himmel herabkommen lässt, wodurch Wir Pflanzen aller Art hervorbringen. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 2320; Ṣaḥīḥ Muslim, Nr. 1553 · Anas ibn Mālik",
      "text": "Wer sät oder pflanzt und dessen Pflanzen Menschen oder Tiere ernähren, dem wird dies als gute Wohltat angerechnet. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/bukhari:2320",
      "hadithNumber": "2320",
      "narrator": "Anas ibn Mālik",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "6:99",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Der Vers nennt Regen und Pflanzen; der Ḥadīṯ berichtet vom Lohn für hilfreiches Pflanzen. Das Keimversuch-Beispiel ist eigene altersgerechte Didaktik."
    },
    "hint": "Pflanzen wachsen mit Wasser, Licht und Pflege; der Glaube an Allah als Schöpfer schließt das Beobachten natürlicher Abläufe nicht aus.",
    "sample": "Allah ist der Schöpfer. Ich kann ein Samenkorn behutsam pflanzen und seine Entwicklung beobachten.",
    "ageText": {
      "4-5": {
        "intro": "Schau dir einen kleinen Samen an. Daraus kann eine Pflanze werden.",
        "lines": [
          "Allah hat die Pflanzen erschaffen.",
          "Ein Samenkorn kann zu einer Pflanze wachsen.",
          "Mit einem Erwachsenen darf ich es einpflanzen.",
          "Ich gieße vorsichtig und beobachte, wie es wächst."
        ],
        "evidence": "Qurʾān 6:99 erzählt vom Regen und von Pflanzen. Der Prophet ﷺ lehrte, dass Pflanzen für andere nützlich sein kann."
      },
      "6-8": {
        "intro": "Warum kommen nach Regen und Wärme neue Pflanzen aus der Erde?",
        "lines": [
          "Der Qurʾān nennt den Regen und das Hervorbringen der Pflanzen.",
          "Allah ist ihr Schöpfer; wir können die Entwicklung Schritt für Schritt beobachten.",
          "Im authentischen Ḥadīṯ wird hilfreiches Pflanzen als gute Tat beschrieben.",
          "Ich kann einen Samen mit Erlaubnis pflanzen und regelmäßig, aber nicht zu viel gießen."
        ],
        "evidence": "Qurʾān 6:99 behandelt Allahs Schöpfung; al-Buḫārī 2320 den Nutzen von Pflanzen für Menschen und Tiere."
      },
      "9-10": {
        "intro": "Wir betrachten die religiöse Aussage über den Schöpfer und ein beobachtbares Naturbeispiel.",
        "lines": [
          "Qurʾān 6:99 spricht von Wasser, das Allah herabkommen lässt, und davon, dass Pflanzen hervorgebracht werden.",
          "Anas ibn Mālik überlieferte den Ṣaḥīḥ-Ḥadīṯ über das Pflanzen, dessen Ertrag anderen zugutekommt.",
          "Das Keimen eines Samens können wir durch Beobachtung nachvollziehen.",
          "Die Aussage über den Schöpfer ist Qurʾān; unsere Pflanzaufgabe ist ein heutiges Lernexperiment."
        ],
        "evidence": "Die Quelle ist ein Versauszug; der Ḥadīṯ handelt vom Nutzen und Lohn guter Bepflanzung, nicht vom genauen biologischen Wachstum."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Wer hat die Pflanzen erschaffen?",
          "options": [
            "Allah",
            "Ein Spielzeugauto"
          ],
          "correct": 0,
          "hint": "Denke an den Qurʾān.",
          "explain": "Allah ist der Schöpfer."
        },
        {
          "type": "choice",
          "prompt": "Was tust du mit einem Samenkorn?",
          "options": [
            "Mit Hilfe vorsichtig einpflanzen.",
            "Es auf andere werfen."
          ],
          "correct": 0,
          "hint": "Wir gehen sorgsam mit Pflanzen um.",
          "explain": "Ich pflanze es behutsam."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was nennt Qurʾān 6:99?",
          "options": [
            "Wasser vom Himmel und Pflanzen.",
            "Eine moderne Maschine."
          ],
          "correct": 0,
          "hint": "Regen hilft Pflanzen zu wachsen.",
          "explain": "Der Vers erwähnt Wasser und Pflanzen."
        },
        {
          "type": "choice",
          "prompt": "Welchen Nutzen erwähnt al-Buḫārī 2320?",
          "options": [
            "Menschen oder Tiere können von Pflanzen essen.",
            "Man soll alle Pflanzen absichtlich zerstören."
          ],
          "correct": 0,
          "hint": "Pflanzen können anderen nützen.",
          "explain": "Ihr Nutzen kann eine gute Tat sein."
        },
        {
          "type": "text",
          "prompt": "Wie kannst du einen Samen sicher beobachten?",
          "sample": "Ich pflanze mit Erlaubnis, gieße angemessen und notiere das Wachstum.",
          "hint": "Das ist unsere Unterrichtsübung."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage ist quellengetreu?",
          "options": [
            "Qurʾān 6:99 nennt Wasser und Pflanzen; al-Buḫārī 2320 den Nutzen des Pflanzens.",
            "Der Ḥadīṯ erklärt eine genaue botanische Messmethode."
          ],
          "correct": 0,
          "hint": "Trenne Qurʾān und Sunnah.",
          "explain": "Die Quellen haben verschiedene Schwerpunkte."
        },
        {
          "type": "text",
          "prompt": "Welche Teile der Unterrichtseinheit sind Anwendung statt Originalzitat?",
          "sample": "Das Einpflanzen und Beobachten eines Samens sind unsere Lernaufgaben.",
          "hint": "Keine erfundenen Prophetenworte."
        },
        {
          "type": "text",
          "prompt": "Warum widerspricht das Beobachten natürlicher Abläufe nicht dem Glauben an Allah als Schöpfer?",
          "sample": "Wir lernen, wie Pflanzen wachsen, und glauben, dass Allah die Schöpfung hervorgebracht hat.",
          "hint": "Zwei unterschiedliche Fragen: Schöpfer und beobachtbare Vorgänge."
        }
      ]
    },
    "voiceApproved": false
  },
  "aqidah-iman-an-engel": {
    "id": "aqidah-iman-an-engel",
    "subject": "aqidah",
    "pillar": "iman",
    "topic": "Īmān an die Engel",
    "title": "Īmān · Ich glaube an Allahs Engel",
    "lead": "Die Engel gehören zum Glauben, den der Prophet ﷺ erklärt hat.",
    "goal": "Ich weiß, dass der Glaube an die Engel eine Grundlage des Īmān ist.",
    "quran": {
      "surah": 2,
      "ayah": 285,
      "label": "Sūrat al-Baqarah · 2:285",
      "arabic": "كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ",
      "meaning": "Alle glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten. (Versauszug)",
      "excerpt": true
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 8 · ʿUmar ibn al-Khaṭṭāb (Ḥadīṯ Ǧibrīl)",
      "text": "Der Prophet ﷺ erklärte den Īmān: an Allah, Seine Engel, Seine Bücher, Seine Gesandten, den Jüngsten Tag und die Bestimmung zu glauben. (Sinngemäß)"
    },
    "sourceAudit": {
      "hadithUrl": "https://sunnah.com/muslim:8a",
      "hadithNumber": "8",
      "narrator": "ʿUmar ibn al-Khaṭṭāb",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "2:285",
      "quranTextType": "excerpt",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Der Ḥadīṯ bei Muslim Nr. 8 ist primäre Quelle; die Dorar-Nachweisseite führt auch eine spätere Einstufung als Sekundärnachweis an. Keine erfundenen Namen, Formen, Farben oder Darstellungen von Engeln."
    },
    "hint": "Engel sind Geschöpfe Allahs, über die wir aus Qurʾān und authentischer Sunnah wissen. Keine Illustrationen oder Spekulationen über ihr Aussehen.",
    "sample": "Ich glaube an Allahs Engel, weil der Qurʾān und der Prophet ﷺ uns davon berichten.",
    "ageText": {
      "4-5": {
        "intro": "Zum Īmān gehört auch, an Allahs Engel zu glauben.",
        "lines": [
          "Īmān bedeutet: Glaube.",
          "Allah berichtet uns von Engeln.",
          "Die Engel gehören zu Allahs Schöpfung.",
          "Ich muss mir ihr Aussehen nicht ausdenken."
        ],
        "evidence": "In Qurʾān 2:285 werden Engel genannt; der Prophet ﷺ erklärte den Glauben an sie."
      },
      "6-8": {
        "intro": "Manche Dinge kennen wir aus authentischer Offenbarung, auch wenn wir sie nicht selbst sehen.",
        "lines": [
          "Qurʾān 2:285 nennt den Glauben an die Engel.",
          "Der Ḥadīṯ von Ǧibrīl zählt den Glauben an die Engel zu den Glaubensgrundlagen.",
          "Wir sprechen darüber nur so, wie Qurʾān und Sunnah sie beschreiben.",
          "Wir erfinden keine Geschichten und keine Bilder von Engeln."
        ],
        "evidence": "Muslim 8 beschreibt die Grundlagen des Īmān; diese Stunde vertieft nur den Glauben an Engel."
      },
      "9-10": {
        "intro": "Wir lernen die Engel als Teil des Īmān und halten die Grenzen unseres Wissens ein.",
        "lines": [
          "Im Vers 2:285 wird neben dem Glauben an Allah auch der Glaube an Engel genannt.",
          "Im authentischen Ḥadīṯ von Ǧibrīl wird der Īmān ausdrücklich erklärt.",
          "Wir wissen nicht alles über die Engel und vermeiden ausgedachte Einzelheiten.",
          "Wir unterscheiden Offenbarungsaussagen von Bildern, Gerüchten oder eigenen Vermutungen."
        ],
        "evidence": "Die Unterrichtsübung ist, echte Quellen zu unterscheiden; das Erfinden von Details ist kein religiöses Wissen."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Gehört der Glaube an Engel zum Īmān?",
          "options": [
            "Ja.",
            "Nein, der Qurʾān sagt nichts davon."
          ],
          "correct": 0,
          "hint": "Der Vers nennt Engel.",
          "explain": "Ja, er gehört zum Īmān."
        },
        {
          "type": "choice",
          "prompt": "Dürfen wir das Aussehen der Engel einfach erfinden?",
          "options": [
            "Nein.",
            "Ja, wie wir möchten."
          ],
          "correct": 0,
          "hint": "Wir bleiben bei den Quellen.",
          "explain": "Nein, wir erfinden nichts."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Wo nennt der Qurʾān die Engel?",
          "options": [
            "In 2:285.",
            "In einer erfundenen Geschichte."
          ],
          "correct": 0,
          "hint": "Schau auf den Vers.",
          "explain": "Qurʾān 2:285."
        },
        {
          "type": "choice",
          "prompt": "Welcher Ḥadīṯ erklärt die sechs Glaubensgrundlagen?",
          "options": [
            "Der Ḥadīṯ von Ǧibrīl.",
            "Ein Märchen."
          ],
          "correct": 0,
          "hint": "Quelle: Muslim 8.",
          "explain": "Der Ḥadīṯ von Ǧibrīl."
        },
        {
          "type": "text",
          "prompt": "Wie lernen wir über Engel?",
          "sample": "Aus Qurʾān und authentischer Sunnah, ohne neue Details zu erfinden.",
          "hint": "Unterscheide Wissen von Vermutungen."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Welche Aussage ist belegbar?",
          "options": [
            "Engel sind im Qurʾān und im Ḥadīṯ von Ǧibrīl genannt.",
            "Wir wissen sicher jede Farbe und Form der Engel."
          ],
          "correct": 0,
          "hint": "Bleibe bei belegbaren Texten.",
          "explain": "Der Glaube an die Engel ist belegt."
        },
        {
          "type": "text",
          "prompt": "Wie stimmen Qurʾān 2:285 und Muslim 8 überein?",
          "sample": "Beide nennen die Engel als Gegenstand des Glaubens.",
          "hint": "Vergleiche die ausdrücklich genannten Grundlagen."
        },
        {
          "type": "text",
          "prompt": "Was machst du bei einer unbelegten Geschichte über Engel?",
          "sample": "Ich erkläre freundlich, dass ich erst den authentischen Nachweis prüfen möchte.",
          "hint": "Nicht weiterverbreiten, solange unbelegt."
        }
      ]
    },
    "voiceApproved": false
  },
  "akhlaq-helfen-ohne-gegenleistung": {
    "id": "akhlaq-helfen-ohne-gegenleistung",
    "subject": "akhlaq",
    "pillar": "ikhlas",
    "topic": "Helfen ohne Gegenleistung",
    "title": "Ikhlāṣ · Gutes tun ohne Gegenleistung",
    "lead": "Wir helfen, weil es gut ist, und verlangen nicht jedes Mal eine Belohnung.",
    "goal": "Ich erkenne eine aufrichtige Hilfe, die nicht auf Lob oder ein Geschenk abzielt.",
    "quran": {
      "surah": 76,
      "ayah": 9,
      "label": "Sūrat al-Insān · 76:9",
      "arabic": "إِنَّمَا نُطْعِمُكُمْ لِوَجْهِ اللَّهِ لَا نُرِيدُ مِنْكُمْ جَزَاءً وَلَا شُكُورًا",
      "meaning": "Wir geben euch zu essen um Allahs willen; wir wollen von euch weder Belohnung noch Dank.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ Muslim, Nr. 2699 · Abū Hurayrah",
      "text": "Der Prophet ﷺ erklärte, dass Allah Seinem Diener hilft, solange dieser seinem Bruder hilft. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/123965",
      "hadithNumber": "2699",
      "narrator": "Abū Hurayrah",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "76:9",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Die Dorar-Seite beinhaltet mehrere Überlieferungsvarianten; die verwendete Aussage ist ausdrücklich als Ṣaḥīḥ Muslim Nr. 2699 dort aufgeführt. Die Hilfe im Unterricht ist freiwillig und keine unbezahlte Pflichtarbeit für Kinder."
    },
    "hint": "Für freiwillige Freundlichkeit muss es nicht immer ein Geschenk geben. Hilfsbereitschaft schließt Grenzen, Ruhezeiten und das Bitten um Hilfe nicht aus.",
    "sample": "Ich helfe bei einer kleinen guten Sache, ohne dafür ein Geschenk zu verlangen.",
    "ageText": {
      "4-5": {
        "intro": "Manchmal kann ich etwas Gutes tun, ohne dafür ein Geschenk zu bekommen.",
        "lines": [
          "Ein Freund lässt seine Stifte fallen.",
          "Ich darf freundlich einen Stift aufheben.",
          "Ich muss dafür keine Süßigkeit bekommen.",
          "Wenn ich nicht helfen kann, darf ich freundlich Nein sagen."
        ],
        "evidence": "Qurʾān 76:9 spricht von Gutes-Tun um Allahs willen. Der Prophet ﷺ lehrte gegenseitige Hilfe."
      },
      "6-8": {
        "intro": "Eine gute Tat bleibt gut, auch wenn niemand dafür klatscht.",
        "lines": [
          "Der Qurʾān nennt Menschen, die Gutes um Allahs willen tun.",
          "Im Ḥadīṯ bei Muslim 2699 wird gegenseitige Hilfe gelobt.",
          "Ich kann jemandem freiwillig eine kleine Unterstützung anbieten.",
          "Ich muss nicht für jeden guten Schritt Lob, Punkte oder ein Geschenk erwarten."
        ],
        "evidence": "Der Vers beschreibt aufrichtiges Geben; der Ḥadīṯ die Hilfe unter Menschen. Unsere Schulbeispiele sind eigene Anwendungen."
      },
      "9-10": {
        "intro": "Wir betrachten den Unterschied zwischen Hilfsbereitschaft und der Erwartung einer Belohnung.",
        "lines": [
          "Qurʾān 76:9 nennt eine aufrichtige Hilfe, für die kein Dank verlangt wird.",
          "In Muslim 2699 lehrt der Prophet ﷺ über den Wert, anderen Menschen zu helfen.",
          "Ikhlāṣ bezieht sich auf die Absicht; über die Absicht anderer urteilen wir nicht.",
          "Aufrichtig helfen darf freiwillig und begrenzt sein: Kinder müssen sich nicht überfordern oder ihre Sicherheit gefährden."
        ],
        "evidence": "Dass Hilfe gut ist, ist belegt; eine konkrete Schulaufgabe ist ein modernes Unterrichtsbeispiel."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Was ist eine freundliche Hilfe?",
          "options": [
            "Einen heruntergefallenen Stift aufheben.",
            "Jemanden absichtlich ärgern."
          ],
          "correct": 0,
          "hint": "Eine kleine gute Tat reicht.",
          "explain": "Ich hebe den Stift auf."
        },
        {
          "type": "choice",
          "prompt": "Musst du dafür ein Geschenk verlangen?",
          "options": [
            "Nein.",
            "Ja, sonst ist Hilfe verboten."
          ],
          "correct": 0,
          "hint": "Gutes geht auch ohne Geschenk.",
          "explain": "Ich kann ohne Geschenk helfen."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Was bedeutet aufrichtig helfen?",
          "options": [
            "Gutes tun, ohne immer eine Belohnung zu erwarten.",
            "Andere nur gegen Geschenke unterstützen."
          ],
          "correct": 0,
          "hint": "Die Absicht zählt.",
          "explain": "Hilfe kann freiwillig sein."
        },
        {
          "type": "choice",
          "prompt": "Was lehrt Muslim 2699?",
          "options": [
            "Gegenseitige Hilfe ist wertvoll.",
            "Kinder müssen alles alleine schaffen."
          ],
          "correct": 0,
          "hint": "Der Prophet ﷺ lobte Hilfe.",
          "explain": "Helfen ist gut."
        },
        {
          "type": "text",
          "prompt": "Wann darfst du Nein sagen?",
          "sample": "Wenn ich erschöpft bin, mich unsicher fühle oder die Aufgabe zu groß ist.",
          "hint": "Gute Hilfe ist freiwillig und sicher."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was macht Qurʾān 76:9 deutlich?",
          "options": [
            "Aufrichtige Hilfe kann ohne Forderung nach Dank geschehen.",
            "Dank darf niemals angenommen werden."
          ],
          "correct": 0,
          "hint": "Unterscheide Fordern von Erhalten.",
          "explain": "Keinen Dank einzufordern heißt nicht, Dank zu verbieten."
        },
        {
          "type": "text",
          "prompt": "Wie ergänzt Muslim 2699 den Qurʾānvers?",
          "sample": "Der Vers spricht von aufrichtigem Geben, der Ḥadīṯ vom Wert der gegenseitigen Hilfe.",
          "hint": "Gib beide Quellen getrennt an."
        },
        {
          "type": "text",
          "prompt": "Warum beurteilen wir fremde Absichten nicht?",
          "sample": "Wir kennen nicht sicher das Herz anderer; wir verbessern unsere eigenen Absichten.",
          "hint": "Ikhlāṣ betrifft die innere Haltung."
        }
      ]
    },
    "voiceApproved": false
  },
  "akhlaq-fehler-ehrlich-zugeben": {
    "id": "akhlaq-fehler-ehrlich-zugeben",
    "subject": "akhlaq",
    "pillar": "akhlaq",
    "topic": "Fehler ohne Ausreden zugeben",
    "title": "Akhlāq · Fehler ehrlich zugeben",
    "lead": "Ein Fehler kann passieren. Wir dürfen ehrlich sein und lernen, ihn zu berichtigen.",
    "goal": "Ich benenne einen Fehler wahrheitsgemäß und finde einen sicheren nächsten Schritt.",
    "quran": {
      "surah": 33,
      "ayah": 70,
      "label": "Sūrat al-Aḥzāb · 33:70",
      "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَقُولُوا قَوْلًا سَدِيدًا",
      "meaning": "O die ihr glaubt, fürchtet Allah und sagt treffende, aufrichtige Worte.",
      "excerpt": false
    },
    "hadith": {
      "source": "Ṣaḥīḥ al-Buḫārī, Nr. 6094; Ṣaḥīḥ Muslim, Nr. 2607 · ʿAbdullāh ibn Masʿūd",
      "text": "Der Prophet ﷺ erklärte, dass Wahrhaftigkeit zur Rechtschaffenheit führt. (Sinngemäße Bedeutung)"
    },
    "sourceAudit": {
      "hadithUrl": "https://dorar.net/hadith/sharh/3232",
      "hadithNumber": "6094",
      "narrator": "ʿAbdullāh ibn Masʿūd",
      "authenticity": "Ṣaḥīḥ",
      "quranReference": "33:70",
      "quranTextType": "complete",
      "hadithMeaningIsParaphrase": true,
      "verifiedDate": "2026-10-12",
      "note": "Eigenständiges Lernziel gegenüber Ṣidq: nicht bloß die Wahrheit kennen, sondern einen konkreten eigenen Fehler zugeben, um Hilfe bitten und wenn möglich wiedergutmachen. Kein Kind zur Offenbarung privater oder gefährlicher Details vor der Gruppe nötigen."
    },
    "hint": "Erwachsene müssen auf ein Eingeständnis ohne Beschämung oder Bedrohung reagieren. Ein Kind muss gefährliche Geheimnisse nicht bewahren und darf sich jederzeit an eine sichere Vertrauensperson wenden.",
    "sample": "Ich sage: Das ist mir passiert. Es tut mir leid. Wie kann ich es wieder gutmachen?",
    "ageText": {
      "4-5": {
        "intro": "Manchmal fällt mir etwas herunter oder ich mache einen Fehler.",
        "lines": [
          "Ein Becher kippt um.",
          "Ich darf sagen: Das ist mir passiert.",
          "Ich bitte ruhig um Hilfe beim Aufwischen.",
          "Wir lernen daraus, ohne andere auszulachen."
        ],
        "evidence": "Der Qurʾān lehrt, aufrichtig zu sprechen. Der Prophet ﷺ lehrte die Bedeutung der Wahrheit."
      },
      "6-8": {
        "intro": "Fehler zuzugeben kann Mut brauchen. Es ist ein guter erster Schritt zum Bessermachen.",
        "lines": [
          "Qurʾān 33:70 lehrt gute, aufrichtige Worte.",
          "Die Sunnah lehrt, dass Wahrhaftigkeit zu Gutem führt.",
          "Wenn ich etwas falsch gemacht habe, darf ich es ehrlich erklären.",
          "Ich kann mich entschuldigen und helfen, einen entstandenen Schaden zu beheben."
        ],
        "evidence": "Die Szene mit dem umgekippten Becher ist eine pädagogische Geschichte; kein historischer Ḥadīṯ."
      },
      "9-10": {
        "intro": "Wir verbinden eine wahrhaftige Aussage mit Verantwortung für das eigene Verhalten.",
        "lines": [
          "Im Qurʾān 33:70 werden die Gläubigen zu treffenden und aufrichtigen Worten aufgefordert.",
          "Ibn Masʿūd überlieferte einen Ṣaḥīḥ-Ḥadīṯ über die Bedeutung von Wahrhaftigkeit.",
          "Einen Fehler zuzugeben ist nicht das Ende; man kann Wiedergutmachung anbieten und Hilfe suchen.",
          "Ehrlichkeit bedeutet nicht, sich in einer gefährlichen Situation zu exponieren; bei Bedrohung wendet man sich an eine Vertrauensperson."
        ],
        "evidence": "Die Aussage über Wahrhaftigkeit stammt aus al-Buḫārī 6094, das Schulbeispiel ist unsere Anwendung."
      }
    },
    "questions": {
      "4-5": [
        {
          "type": "choice",
          "prompt": "Du verschüttest Wasser. Was kannst du sagen?",
          "options": [
            "Das ist mir passiert.",
            "Ich beschuldige absichtlich jemand anderen."
          ],
          "correct": 0,
          "hint": "Ein Fehler kann passieren.",
          "explain": "Ich sage ehrlich, was passiert ist."
        },
        {
          "type": "choice",
          "prompt": "Was ist ein guter nächster Schritt?",
          "options": [
            "Hilfe zum Aufwischen holen.",
            "Alle auslachen."
          ],
          "correct": 0,
          "hint": "Wir machen es zusammen besser.",
          "explain": "Ich bitte um Hilfe."
        }
      ],
      "6-8": [
        {
          "type": "choice",
          "prompt": "Du möchtest etwas erzählen, obwohl es schwerfällt, ehrlich zu sein. Was sollen wir nach dem Unterricht beim Sprechen beachten?",
          "options": [
            "Aufrichtig und richtig sprechen.",
            "Nur ehrlich sein, wenn es uns leichtfällt."
          ],
          "correct": 0,
          "hint": "Denk an die Worte.",
          "explain": "Wir sprechen wahrhaftig."
        },
        {
          "type": "choice",
          "prompt": "Was kannst du nach einem Fehler anbieten?",
          "options": [
            "Eine Entschuldigung und passende Wiedergutmachung.",
            "Eine Ausrede über jemand anderen."
          ],
          "correct": 0,
          "hint": "Versuche es besser zu machen.",
          "explain": "Ich übernehme Verantwortung."
        },
        {
          "type": "text",
          "prompt": "Wie sprichst du über einen Fehler ohne jemand anderen zu beschuldigen?",
          "sample": "Das ist mir passiert. Ich möchte es wieder gutmachen.",
          "hint": "Du musst keine Angst haben, um Hilfe zu bitten."
        }
      ],
      "9-10": [
        {
          "type": "choice",
          "prompt": "Was ist das Ziel dieser Unterrichtseinheit?",
          "options": [
            "Einen Fehler ehrlich benennen und eine gute Lösung suchen.",
            "Fehler durch Ausreden verstecken."
          ],
          "correct": 0,
          "hint": "Gutes Verhalten geht über ein Wort hinaus.",
          "explain": "Ehrlichkeit und Wiedergutmachung."
        },
        {
          "type": "text",
          "prompt": "Wir haben einen Qurʾān-Vers über richtiges Sprechen und eine Überlieferung über Wahrhaftigkeit kennengelernt. Welche gemeinsame Lehre erkennst du darin?",
          "sample": "Beide bekräftigen wahrhaftiges Reden und seine gute Wirkung.",
          "hint": "Überlege, was beide Quellen über aufrichtiges Sprechen lehren."
        },
        {
          "type": "text",
          "prompt": "Welche Grenzen gelten bei einer ehrlichen Aussage?",
          "sample": "Ich kann mir in unsicheren Situationen Unterstützung einer Vertrauensperson holen.",
          "hint": "Ehrlichkeit bedeutet nicht, dass Kinder gefährlichen Druck aushalten müssen."
        }
      ]
    },
    "voiceApproved": false
  }
};
for(const [id,l] of Object.entries(additions)){
 if(l.id!==id||prior[id]||!l.quran?.surah||!l.sourceAudit?.hadithUrl||l.voiceApproved)throw Error("V29 unsafe lesson "+id);
 for(const age of ["4-5","6-8","9-10"]){
  if(l.ageText?.[age]?.lines?.length!==4||l.questions?.[age]?.length<2)throw Error("V29 incomplete age content "+id);
 }
}
/* TAWḤĪD KIDS · Curriculum Content V30: ausschließlich vorhandene Inhaltsfelder.
 * Bestehende IDs, Qurʾān, Hadith-Quellen, Navigation, Lernstände und Audiodaten unverändert.
 * Redaktionsstatus: menschliche Quellen-/Audiofreigabe ausstehend. Kein TTS ausgeführt.
 */
const editorialContentV30={
 "akhlaq-sabr": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du bist traurig, weil du warten musst. Was zeigt Geduld?",
     "options": [
      "Ich darf traurig sein und trotzdem freundlich warten.",
      "Ich muss so tun, als wäre ich nicht traurig."
     ],
     "correct": 0,
     "hint": "Darf man sich traurig fühlen und trotzdem geduldig handeln?",
     "explain": "Geduld bedeutet nicht, Gefühle zu verstecken. Ich darf freundlich bleiben und um Hilfe bitten."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Geduld“: Du musst auf etwas warten. Was tust du?",
     "options": [
      "Ich warte ruhig und bleibe freundlich.",
      "Ich schimpfe alle an."
     ],
     "correct": 0,
     "hint": "Geduld heißt nicht, dass man nie traurig ist. Man übt ruhiges Verhalten.",
     "explain": "Ich kann ruhig warten und freundlich bleiben."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Geduld“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich kann ruhig warten und freundlich bleiben. Ich darf um Hilfe bitten und geduldig weiterüben.",
     "hint": "Allah hilft den Geduldigen."
    },
    {
     "type": "choice",
     "prompt": "Welche Aussage passt zu Qurʾān 2:153 und zu Ṣabr?",
     "options": [
      "Ich kann durch Geduld und Gebet Hilfe suchen.",
      "Geduld bedeutet, nie um Hilfe zu bitten.",
      "Wer geduldig ist, muss nicht mehr beten."
     ],
     "correct": 0,
     "hint": "Denke an die beiden Wege der Hilfe, die im Vers genannt werden.",
     "explain": "Im Vers werden Geduld und Gebet gemeinsam als Hilfe genannt."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Ein Kind sagt: „Wer geduldig ist, wird niemals traurig.“ Was antwortest du?",
     "options": [
      "Geduld zeigt sich im Verhalten; Traurigkeit darf trotzdem da sein.",
      "Geduld bedeutet, jedes Gefühl zu unterdrücken.",
      "Geduld ist nur wichtig, wenn alles leicht ist."
     ],
     "correct": 0,
     "hint": "Trenne Gefühle von bewusstem Verhalten.",
     "explain": "Ein Mensch darf traurig sein und dennoch freundlich und geduldig handeln."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Geduld“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich kann ruhig warten und freundlich bleiben. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Baqarah · 2:153 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen. Sunnah (sinngemäß): Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht. Eigenes Lernbeispiel: Ich übe Geduld, wenn etwas nicht sofort klappt.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Allah hilft den Geduldigen.",
    "lines": [
     "Manchmal müssen wir auf etwas warten.",
     "Dann atme ich ruhig und werde nicht gemein.",
     "Ich darf um Hilfe bitten und geduldig weiterüben.",
     "Mit Geduld handle ich freundlich."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich übe Geduld, wenn etwas nicht sofort klappt.",
    "lines": [
     "Manchmal müssen wir auf etwas warten.",
     "Dann atme ich ruhig und werde nicht gemein.",
     "Ich darf um Hilfe bitten und geduldig weiterüben.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Mit Geduld handle ich freundlich."
    ],
    "evidence": "Qurʾān: Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Geduld“ zusammenhängen.",
    "lines": [
     "Manchmal müssen wir auf etwas warten.",
     "Der Qurʾān nennt in Sūrat al-Baqarah · 2:153 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 1469.",
     "Anwendung im Alltag: Ich übe Geduld, wenn etwas nicht sofort klappt."
    ],
    "evidence": "Sūrat al-Baqarah · 2:153: Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen. Ṣaḥīḥ al-Buḫārī, Nr. 1469: Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "akhlaq-amanah": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Ein Freund leiht dir ein Buch. Wie achtest du darauf?",
     "options": [
      "Ich behandle es vorsichtig und gebe es zurück.",
      "Ich gebe es ohne zu fragen an jemand anderen weiter."
     ],
     "correct": 0,
     "hint": "Wem gehört das Buch?",
     "explain": "Ein geliehenes Buch ist mir anvertraut. Ich gehe sorgfältig damit um."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Vertrauen“: Du bekommst ein Buch geliehen. Was tust du?",
     "options": [
      "Ich behandle es gut und gebe es zurück.",
      "Ich gebe es ohne Fragen weiter."
     ],
     "correct": 0,
     "hint": "Anvertraute Dinge gehören nicht automatisch mir.",
     "explain": "Ich gehe gut mit geliehenen Sachen um."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Vertrauen“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich gehe gut mit geliehenen Sachen um. Ich frage, bevor ich etwas weitergebe.",
     "hint": "Eine anvertraute Sache soll ich sorgfältig behandeln."
    },
    {
     "type": "choice",
     "prompt": "Was lehrt der behandelte Vers über anvertraute Dinge?",
     "options": [
      "Wir achten auf anvertraute Dinge und Vereinbarungen.",
      "Wir dürfen sie weitergeben, sobald wir sie gut finden.",
      "Es genügt, sie am Ende irgendwann zurückzugeben."
     ],
     "correct": 0,
     "hint": "Gehört zu Vertrauen auch, eine Absprache einzuhalten?",
     "explain": "Qurʾān 23:8 betont Zuverlässigkeit bei anvertrauten Dingen und Vereinbarungen."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Du hast ein geliehenes Buch vorsichtig benutzt. Eine Freundin möchte es mitnehmen. Was ist zuverlässig?",
     "options": [
      "Ich frage zuerst die Person, von der ich es geliehen habe.",
      "Ich gebe es weiter, weil ich damit schon vorsichtig war.",
      "Ich gebe es heimlich weiter und lege später ein anderes Buch hin."
     ],
     "correct": 0,
     "hint": "Wer hat erlaubt, das Buch zu benutzen?",
     "explain": "Amānah betrifft auch die Vereinbarung, nicht nur den Zustand der Sache."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Vertrauen“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich gehe gut mit geliehenen Sachen um. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Muʾminūn · 23:8 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten. Sunnah (sinngemäß): Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten. Eigenes Lernbeispiel: Ich bin zuverlässig, wenn mir jemand etwas anvertraut.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Eine anvertraute Sache soll ich sorgfältig behandeln.",
    "lines": [
     "Jemand leiht mir ein Buch oder Spielzeug.",
     "Ich gehe sorgfältig damit um.",
     "Ich frage, bevor ich etwas weitergebe.",
     "Ich gebe es zuverlässig zurück."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich bin zuverlässig, wenn mir jemand etwas anvertraut.",
    "lines": [
     "Jemand leiht mir ein Buch oder Spielzeug.",
     "Ich gehe sorgfältig damit um.",
     "Ich frage, bevor ich etwas weitergebe.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Ich gebe es zuverlässig zurück."
    ],
    "evidence": "Qurʾān: Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Vertrauen“ zusammenhängen.",
    "lines": [
     "Jemand leiht mir ein Buch oder Spielzeug.",
     "Der Qurʾān nennt in Sūrat al-Muʾminūn · 23:8 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 33.",
     "Anwendung im Alltag: Ich bin zuverlässig, wenn mir jemand etwas anvertraut."
    ],
    "evidence": "Sūrat al-Muʾminūn · 23:8: Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten. Ṣaḥīḥ al-Buḫārī, Nr. 33: Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-salam": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Jemand sagt den Salām zu dir. Was ist eine gute Antwort?",
     "options": [
      "Ich erwidere den Friedensgruß freundlich.",
      "Ich nicke nur und sage gar nichts, obwohl ich antworten kann."
     ],
     "correct": 0,
     "hint": "Überlege: Was machst du, wenn jemand dich freundlich grüßt?",
     "explain": "Wir erwidern den Salām freundlich und lernen die passende Antwort."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Grüßen“: Jemand sagt zu dir As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh. Was tust du?",
     "options": [
      "Ich grüße freundlich zurück.",
      "Ich sage absichtlich etwas Unfreundliches."
     ],
     "correct": 0,
     "hint": "Wir beantworten einen guten Gruß freundlich.",
     "explain": "Ich kann mit einem guten Gruß beginnen und antworten."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Grüßen“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich kann mit einem guten Gruß beginnen und antworten. Wenn ich gegrüßt werde, antworte ich freundlich.",
     "hint": "Ein schöner Gruß bringt Freundlichkeit in unsere Begegnung."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort passt zur Bedeutung von Qurʾān 4:86?",
     "options": [
      "Wir erwidern einen Gruß mit einem gleichwertigen oder besseren.",
      "Wir erwidern Grüße nur, wenn wir die Person gut kennen.",
      "Wir antworten nur, wenn der Gruß besonders laut gesprochen wurde."
     ],
     "correct": 0,
     "hint": "Was bedeutet: gleichwertig oder besser?",
     "explain": "Der Vers lehrt, den Gruß gut zu erwidern."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Ein Kind erwidert einen Gruß freundlich, aber leiser als sein Freund. Wie beurteilst du das?",
     "options": [
      "Entscheidend ist, dass der Gruß angemessen erwidert wird; ich sollte niemanden bloßstellen.",
      "Ein Gruß zählt nur, wenn er lauter als der erste gesprochen wird.",
      "Wer unsicher spricht, sollte keinen Salām erwidern."
     ],
     "correct": 0,
     "hint": "Wovon spricht der Qurʾān-Vers wirklich?",
     "explain": "Die Bedeutung des Grußes ist wichtiger als eine laute Vorführung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Grüßen“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich kann mit einem guten Gruß beginnen und antworten. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat an-Nisāʾ · 4:86 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß. Sunnah (sinngemäß): Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten. Eigenes Lernbeispiel: Wir üben den islamischen Friedensgruß und eine gute Antwort.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Ein schöner Gruß bringt Freundlichkeit in unsere Begegnung.",
    "lines": [
     "Ich darf andere freundlich begrüßen.",
     "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh ist ein islamischer Friedensgruß.",
     "Wenn ich gegrüßt werde, antworte ich freundlich.",
     "So zeigen wir einander Respekt und Frieden."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Wir üben den islamischen Friedensgruß und eine gute Antwort.",
    "lines": [
     "Ich darf andere freundlich begrüßen.",
     "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh ist ein islamischer Friedensgruß.",
     "Wenn ich gegrüßt werde, antworte ich freundlich.",
     "Wir üben das Thema mit einer passenden Alltagssituation: So zeigen wir einander Respekt und Frieden."
    ],
    "evidence": "Qurʾān: Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Grüßen“ zusammenhängen.",
    "lines": [
     "Ich darf andere freundlich begrüßen.",
     "Der Qurʾān nennt in Sūrat an-Nisāʾ · 4:86 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ Muslim, Nr. 54a.",
     "Anwendung im Alltag: Wir üben den islamischen Friedensgruß und eine gute Antwort."
    ],
    "evidence": "Sūrat an-Nisāʾ · 4:86: Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß. Ṣaḥīḥ Muslim, Nr. 54a: Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-worte": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Dein Freund möchte etwas anderes spielen. Wie kannst du sprechen?",
     "options": [
      "Ich sage freundlich, was ich möchte, und höre zu.",
      "Ich sage einfach Ja, obwohl ich Nein meine."
     ],
     "correct": 0,
     "hint": "Darfst du anderer Meinung sein und trotzdem freundlich reden?",
     "explain": "Freundlich sprechen und ehrlich sein passen zusammen."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Freundlich sprechen“: Du bist anderer Meinung als ein Freund. Was tust du?",
     "options": [
      "Ich spreche ruhig und freundlich.",
      "Ich beleidige ihn."
     ],
     "correct": 0,
     "hint": "Gute Worte sind besser als verletzende Worte.",
     "explain": "Ich will ruhig und freundlich sprechen."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Freundlich sprechen“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich will ruhig und freundlich sprechen. Ich muss niemanden verspotten oder beleidigen.",
     "hint": "Freundliche Worte sind Teil guten Benehmens."
    },
    {
     "type": "choice",
     "prompt": "Was passt zur Aufforderung, auf die beste Weise zu sprechen?",
     "options": [
      "Ich spreche freundlich und wahrheitsgemäß, auch bei anderer Meinung.",
      "Ich muss immer zustimmen, damit kein Streit entsteht.",
      "Ich sage nichts mehr, sobald ich anderer Meinung bin."
     ],
     "correct": 0,
     "hint": "Gute Worte müssen nicht bedeuten, immer Ja zu sagen.",
     "explain": "Gute Worte können ehrlich, ruhig und respektvoll zugleich sein."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Du weißt, dass eine Aussage falsch ist, aber du möchtest höflich bleiben. Was ist geeignet?",
     "options": [
      "Ich widerspreche sachlich und erkläre freundlich meinen Grund.",
      "Ich bestätige die falsche Aussage, damit niemand verärgert ist.",
      "Ich beleidige die Person, weil die Aussage falsch ist."
     ],
     "correct": 0,
     "hint": "Welche Antwort vermeidet Lüge und Beleidigung zugleich?",
     "explain": "Gute Rede verbindet Wahrhaftigkeit mit einem freundlichen Umgang."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Freundlich sprechen“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich will ruhig und freundlich sprechen. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Isrāʾ · 17:53 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Sag Meinen Dienern, sie sollen auf die beste Weise sprechen. Sunnah (sinngemäß): Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen. Eigenes Lernbeispiel: Wir sprechen ehrlich und freundlich, auch wenn wir anderer Meinung sind.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Freundliche Worte sind Teil guten Benehmens.",
    "lines": [
     "Meine Worte können andere freuen oder verletzen.",
     "Ich spreche ruhig und höflich.",
     "Ich muss niemanden verspotten oder beleidigen.",
     "Auch bei einem Streit kann ich freundlich bleiben."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Wir sprechen ehrlich und freundlich, auch wenn wir anderer Meinung sind.",
    "lines": [
     "Meine Worte können andere freuen oder verletzen.",
     "Ich spreche ruhig und höflich.",
     "Ich muss niemanden verspotten oder beleidigen.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Auch bei einem Streit kann ich freundlich bleiben."
    ],
    "evidence": "Qurʾān: Sag Meinen Dienern, sie sollen auf die beste Weise sprechen. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Freundlich sprechen“ zusammenhängen.",
    "lines": [
     "Meine Worte können andere freuen oder verletzen.",
     "Der Qurʾān nennt in Sūrat al-Isrāʾ · 17:53 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 6018.",
     "Anwendung im Alltag: Wir sprechen ehrlich und freundlich, auch wenn wir anderer Meinung sind."
    ],
    "evidence": "Sūrat al-Isrāʾ · 17:53: Sag Meinen Dienern, sie sollen auf die beste Weise sprechen. Ṣaḥīḥ al-Buḫārī, Nr. 6018: Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-respekt": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Ein Elternteil bittet dich um eine kleine, sichere Hilfe. Was kannst du sagen?",
     "options": [
      "Ich antworte freundlich und helfe, wenn ich kann.",
      "Ich sage freundlich Ja, tue aber absichtlich nichts."
     ],
     "correct": 0,
     "hint": "Welche Antwort ist nicht nur freundlich, sondern auch verlässlich?",
     "explain": "Respekt kann sich darin zeigen, freundlich zu antworten und zuverlässig zu helfen."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Respekt“: Ein Elternteil bittet dich freundlich um Hilfe. Was tust du?",
     "options": [
      "Ich antworte respektvoll und helfe, soweit ich kann.",
      "Ich beschimpfe ihn."
     ],
     "correct": 0,
     "hint": "Respekt zeigt sich auch in unseren Worten.",
     "explain": "Ich höre zu und gehe freundlich mit anderen um."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Respekt“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich höre zu und gehe freundlich mit anderen um. Ich bin hilfsbereit gegenüber meiner Familie.",
     "hint": "Menschen verdienen einen freundlichen Umgang."
    },
    {
     "type": "choice",
     "prompt": "Was zeigen Qurʾān 17:23 und die besprochene Sunnah?",
     "options": [
      "Allah lehrt einen guten Umgang mit Eltern; die Sunnah betont ihre gute Behandlung.",
      "Respekt zählt nur, wenn man dieselbe Meinung hat.",
      "Eltern muss man nie etwas erklären oder um Hilfe bitten."
     ],
     "correct": 0,
     "hint": "Welche Aussage verbindet guten Umgang und Eltern?",
     "explain": "Die Quellen betonen Güte und ehrerbietige Worte gegenüber den Eltern."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Du sollst etwas tun, das dir Angst macht und unsicher erscheint. Wie verbindest du Respekt und Sicherheit?",
     "options": [
      "Ich bleibe möglichst höflich, sage Nein und suche Hilfe bei einer sicheren Vertrauensperson.",
      "Ich muss jede Anweisung ausführen, auch wenn ich dadurch gefährdet werde.",
      "Ich schweige immer, damit mein Nein nicht unhöflich klingt."
     ],
     "correct": 0,
     "hint": "Respekt und sichere Grenzen dürfen zusammengehören.",
     "explain": "Respekt hebt persönliche Sicherheit und das Recht auf Hilfe nicht auf."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Respekt“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich höre zu und gehe freundlich mit anderen um. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Isrāʾ · 17:23 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen. Sunnah (sinngemäß): Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters. Eigenes Lernbeispiel: Wir üben Respekt für Eltern, Familie und Mitmenschen.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Menschen verdienen einen freundlichen Umgang.",
    "lines": [
     "Respekt heißt: Ich gehe achtsam mit anderen um.",
     "Ich höre zu und antworte freundlich.",
     "Ich bin hilfsbereit gegenüber meiner Familie.",
     "Ich vermeide grobe und verletzende Worte."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Wir üben Respekt für Eltern, Familie und Mitmenschen.",
    "lines": [
     "Respekt heißt: Ich gehe achtsam mit anderen um.",
     "Ich höre zu und antworte freundlich.",
     "Ich bin hilfsbereit gegenüber meiner Familie.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Ich vermeide grobe und verletzende Worte."
    ],
    "evidence": "Qurʾān: Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Respekt“ zusammenhängen.",
    "lines": [
     "Respekt heißt: Ich gehe achtsam mit anderen um.",
     "Der Qurʾān nennt in Sūrat al-Isrāʾ · 17:23 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 5971.",
     "Anwendung im Alltag: Wir üben Respekt für Eltern, Familie und Mitmenschen."
    ],
    "evidence": "Sūrat al-Isrāʾ · 17:23: Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen. Ṣaḥīḥ al-Buḫārī, Nr. 5971: Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "fiqh-taharah": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Deine Kleidung ist schmutzig. Was kannst du tun?",
     "options": [
      "Ich lasse sie reinigen oder bitte um Hilfe beim Reinigen.",
      "Ich lege sie in den Schrank und tue so, als sei sie sauber."
     ],
     "correct": 0,
     "hint": "Was hilft gegen Schmutz an der Kleidung?",
     "explain": "Saubere Kleidung ist Teil des Unterrichts über Reinheit."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Reinheit“: Deine Kleidung ist verschmutzt. Was tust du?",
     "options": [
      "Ich reinige sie oder bitte um Hilfe.",
      "Ich beachte es absichtlich nie."
     ],
     "correct": 0,
     "hint": "Reinheit ist mehr als nur ordentlich aussehen.",
     "explain": "Ich achte auf Reinheit und frage, wenn ich Hilfe brauche."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Reinheit“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich achte auf Reinheit und frage, wenn ich Hilfe brauche. Nach dem Toilettengang reinigen wir uns.",
     "hint": "Reinheit hat im Islam einen hohen Stellenwert."
    },
    {
     "type": "choice",
     "prompt": "Worauf weist der behandelte Qurʾān-Vers 74:4 hin?",
     "options": [
      "Die Kleidung soll gereinigt werden.",
      "Es genügt, den Raum aufzuräumen.",
      "Es genügt, nur die Hände zu reinigen."
     ],
     "correct": 0,
     "hint": "Es geht im Vers um ein bestimmtes Kleidungsstück-Thema.",
     "explain": "Der behandelte Vers erwähnt ausdrücklich das Reinigen der Kleidung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Ein Freund sagt: „Mein Zimmer ist ordentlich, also weiß ich bereits alles über Ṭahārah.“ Was ist genauer?",
     "options": [
      "Ordnung ist gut, aber rituelle Reinheit hat eigene Regeln, die man lernen muss.",
      "Ein ordentliches Zimmer ersetzt die rituelle Reinigung.",
      "Rituelle Reinheit bedeutet nur, dass nichts sichtbar schmutzig ist."
     ],
     "correct": 0,
     "hint": "Gibt es Reinheitsfragen, die man nicht nur mit den Augen sieht?",
     "explain": "Allgemeine Sauberkeit und die Regeln der rituellen Reinheit werden unterschieden."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Reinheit“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich achte auf Reinheit und frage, wenn ich Hilfe brauche. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Muddaṯṯir · 74:4 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Und reinige deine Kleidung. Sunnah (sinngemäß): Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist. Eigenes Lernbeispiel: Wir lernen, uns selbst, unsere Kleidung und unsere Umgebung sauber zu halten.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Reinheit hat im Islam einen hohen Stellenwert.",
    "lines": [
     "Vor dem Gebet achten wir auf Reinheit.",
     "Wir halten unsere Kleidung sauber.",
     "Nach dem Toilettengang reinigen wir uns.",
     "Wenn ich etwas nicht weiß, frage ich freundlich nach."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Wir lernen, uns selbst, unsere Kleidung und unsere Umgebung sauber zu halten.",
    "lines": [
     "Vor dem Gebet achten wir auf Reinheit.",
     "Wir halten unsere Kleidung sauber.",
     "Nach dem Toilettengang reinigen wir uns.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Wenn ich etwas nicht weiß, frage ich freundlich nach."
    ],
    "evidence": "Qurʾān: Und reinige deine Kleidung. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Reinheit“ zusammenhängen.",
    "lines": [
     "Vor dem Gebet achten wir auf Reinheit.",
     "Der Qurʾān nennt in Sūrat al-Muddaṯṯir · 74:4 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ Muslim, Nr. 223.",
     "Anwendung im Alltag: Wir lernen, uns selbst, unsere Kleidung und unsere Umgebung sauber zu halten."
    ],
    "evidence": "Sūrat al-Muddaṯṯir · 74:4: Und reinige deine Kleidung. Ṣaḥīḥ Muslim, Nr. 223: Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "fiqh-wudu": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du möchtest Wuḍūʾ lernen. Wie gehst du vor?",
     "options": [
      "Ich lasse mir die Waschung richtig zeigen.",
      "Ich erfinde die Schritte, die ich noch nicht kenne."
     ],
     "correct": 0,
     "hint": "Was machst du, wenn du einen Schritt noch nicht weißt?",
     "explain": "Wuḍūʾ lernen wir nach zuverlässiger Anleitung."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Wuḍūʾ“: Du möchtest beten und brauchst Wuḍūʾ. Was tust du?",
     "options": [
      "Ich mache die Gebetswaschung und frage bei Unsicherheit.",
      "Ich lasse die Gebetswaschung absichtlich weg."
     ],
     "correct": 0,
     "hint": "Bei Wuḍūʾ ist sorgfältiges Lernen wichtig.",
     "explain": "Ich möchte die Gebetswaschung richtig lernen."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Wuḍūʾ“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich möchte die Gebetswaschung richtig lernen. Wir streichen über den Kopf und waschen die Füße.",
     "hint": "Für das Gebet lernen wir die rituelle Waschung."
    },
    {
     "type": "choice",
     "prompt": "Du siehst in der Lektion nur einen arabischen Auszug aus Qurʾān 5:6. Was ist richtig?",
     "options": [
      "Ich weiß: Für den vollständigen Vers und die genaue Anleitung muss ich weiter nachsehen.",
      "Der Auszug beschreibt allein alle Einzelheiten des Wuḍūʾ.",
      "Ich darf aus dem Auszug neue Pflichtschritte erfinden."
     ],
     "correct": 0,
     "hint": "Ist ein Auszug immer der ganze Text?",
     "explain": "Ein Versauszug ist nicht die vollständige praktische Anleitung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Ein Kind behauptet, aus einem kurzen Auszug alle Waschungs-Einzelheiten zu kennen. Was wäre eine quellentreue Antwort?",
     "options": [
      "Wir lesen den vollständigen Vers und lernen die Praxis zusätzlich aus authentischer Sunnah und zuverlässiger Anleitung.",
      "Der Auszug macht weitere Quellen unnötig.",
      "Was nicht im Auszug steht, darf jedes Kind selbst bestimmen."
     ],
     "correct": 0,
     "hint": "Welche Texte fehlen bei einem Auszug?",
     "explain": "Für die praktische Ausführung betrachten wir die überlieferten Quellen sorgfältig."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Wuḍūʾ“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich möchte die Gebetswaschung richtig lernen. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Māʾidah · 5:6 (Textauszug) und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln. Sunnah (sinngemäß): Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt. Eigenes Lernbeispiel: Wir erkennen die grundlegenden Glieder der Gebetswaschung, ohne einzelne Sonderfälle vorwegzunehmen.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Für das Gebet lernen wir die rituelle Waschung.",
    "lines": [
     "Vor dem Gebet lernen wir Wuḍūʾ.",
     "Wir waschen Gesicht und Arme.",
     "Wir streichen über den Kopf und waschen die Füße.",
     "Die genaue Ausführung üben wir mit einer erwachsenen Lehrperson."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Wir erkennen die grundlegenden Glieder der Gebetswaschung, ohne einzelne Sonderfälle vorwegzunehmen.",
    "lines": [
     "Vor dem Gebet lernen wir Wuḍūʾ.",
     "Wir waschen Gesicht und Arme.",
     "Wir streichen über den Kopf und waschen die Füße.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Die genaue Ausführung üben wir mit einer erwachsenen Lehrperson."
    ],
    "evidence": "Qurʾān: Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Wuḍūʾ“ zusammenhängen.",
    "lines": [
     "Vor dem Gebet lernen wir Wuḍūʾ.",
     "Der Qurʾān nennt in Sūrat al-Māʾidah · 5:6 (Textauszug) eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 135.",
     "Anwendung im Alltag: Wir erkennen die grundlegenden Glieder der Gebetswaschung, ohne einzelne Sonderfälle vorwegzunehmen."
    ],
    "evidence": "Sūrat al-Māʾidah · 5:6 (Textauszug): Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln. Ṣaḥīḥ al-Buḫārī, Nr. 135: Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "fiqh-salah": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du möchtest das Gebet lernen. Was ist ein guter Anfang?",
     "options": [
      "Ich lasse mir die Gebetsweise Schritt für Schritt zeigen.",
      "Ich denke mir eigene Gebetsbewegungen aus."
     ],
     "correct": 0,
     "hint": "Woher lernen wir, wie der Prophet ﷺ betete?",
     "explain": "Wir lernen die Gebetsweise nach zuverlässigem Vorbild."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Gebet“: Was ist ein guter erster Schritt beim Gebetslernen?",
     "options": [
      "Ich lasse mir das Gebet Schritt für Schritt zeigen.",
      "Ich erfinde eigene Gebetsbewegungen."
     ],
     "correct": 0,
     "hint": "Das Vorbild des Propheten ﷺ ist beim Gebet wichtig.",
     "explain": "Ich lerne das Gebet nach dem Vorbild des Propheten ﷺ."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Gebet“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich lerne das Gebet nach dem Vorbild des Propheten ﷺ. Im Gebet wenden wir uns Allah zu.",
     "hint": "Das Gebet erinnert uns an Allah."
    },
    {
     "type": "choice",
     "prompt": "Was hebt der behandelte Qurʾān-Vers 20:14 hervor?",
     "options": [
      "Das Gebet dient dem Gedenken Allahs.",
      "Beim Gebet geht es nur um Körperbewegungen.",
      "Gebet bedeutet, sich nur an Menschen zu erinnern."
     ],
     "correct": 0,
     "hint": "Welche Absicht hinter dem Gebet wurde erklärt?",
     "explain": "Allah nennt im Vers das Gebet zu Seinem Gedenken."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Jemand sagt: „Wichtig ist allein, dass ich mich bewege; die Bedeutung des Gebets spielt keine Rolle.“ Wie antwortest du?",
     "options": [
      "Wir lernen sowohl den Sinn des Gebets aus dem Qurʾān als auch seine Ausführung nach der Sunnah.",
      "Nur die Bewegung zählt, der Sinn ist nicht wichtig.",
      "Nur die persönliche Idee zählt, das prophetische Vorbild ist unwichtig."
     ],
     "correct": 0,
     "hint": "Brauchen wir Sinn und ein verlässliches Vorbild?",
     "explain": "Im Unterricht lernen wir die Bedeutung und die überlieferte Ausführung des Gebets."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Gebet“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich lerne das Gebet nach dem Vorbild des Propheten ﷺ. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat Ṭā Hā · 20:14 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken. Sunnah (sinngemäß): Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat. Eigenes Lernbeispiel: Wir beginnen mit dem Sinn des Gebets und lernen die Praxis anschließend Schritt für Schritt.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Das Gebet erinnert uns an Allah.",
    "lines": [
     "Das Gebet ist eine wichtige ʿIbādah.",
     "Wir lernen Zeiten, Waschung und Gebetshaltungen Schritt für Schritt.",
     "Im Gebet wenden wir uns Allah zu.",
     "Wir lassen uns die Bewegungen richtig zeigen."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Wir beginnen mit dem Sinn des Gebets und lernen die Praxis anschließend Schritt für Schritt.",
    "lines": [
     "Das Gebet ist eine wichtige ʿIbādah.",
     "Wir lernen Zeiten, Waschung und Gebetshaltungen Schritt für Schritt.",
     "Im Gebet wenden wir uns Allah zu.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Wir lassen uns die Bewegungen richtig zeigen."
    ],
    "evidence": "Qurʾān: Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Gebet“ zusammenhängen.",
    "lines": [
     "Das Gebet ist eine wichtige ʿIbādah.",
     "Der Qurʾān nennt in Sūrat Ṭā Hā · 20:14 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 631.",
     "Anwendung im Alltag: Wir beginnen mit dem Sinn des Gebets und lernen die Praxis anschließend Schritt für Schritt."
    ],
    "evidence": "Sūrat Ṭā Hā · 20:14: Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken. Ṣaḥīḥ al-Buḫārī, Nr. 631: Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "aqidah-tawhid": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du möchtest Allah um etwas Gutes bitten. An wen richtest du dein Duʿāʾ?",
     "options": [
      "An Allah allein.",
      "An jemanden, der Allah angeblich ersetzen kann."
     ],
     "correct": 0,
     "hint": "Wen beten wir an?",
     "explain": "Tawḥīd lehrt uns, Allah allein anzubeten und unser Duʿāʾ an Ihn zu richten."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Tawḥīd“: Wem allein gebührt die Anbetung?",
     "options": [
      "Allah allein.",
      "Anderen neben Allah."
     ],
     "correct": 0,
     "hint": "Tawḥīd bedeutet die Einzigkeit Allahs.",
     "explain": "Ich bete Allah allein an."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du: Nur Allah wird angebetet? Nenne ein Beispiel aus dem Unterricht.",
     "sample": "Muslime beten Allah allein an. Auch das Duʿāʾ als Anbetung richten wir an Ihn.",
     "hint": "Unser Beispiel erklärt die Anbetung; wir erfinden keinen neuen Offenbarungstext."
    },
    {
     "type": "choice",
     "prompt": "Was sagt der behandelte Vers aus Sūrat al-Ikhlāṣ?",
     "options": [
      "Allah ist der Eine.",
      "Der Vers zählt die sechs Īmān-Grundlagen auf.",
      "Der Vers erklärt alle Gebetsbewegungen."
     ],
     "correct": 0,
     "hint": "Welche grundlegende Aussage steht in dem kurzen Vers?",
     "explain": "Qurʾān 112:1 bezeugt Allahs Einzigkeit."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Ein Freund verbindet die Quellen so: „Qurʾān 112:1 sagt, Allah ist Einer; der Ḥadīṯ erklärt Sein Recht auf alleinige Anbetung.“ Was ist daran richtig?",
     "options": [
      "Er unterscheidet die Aussage des Verses von der Erklärung des Hadiths.",
      "Der Vers nennt wortwörtlich alle Einzelheiten des Hadiths.",
      "Die beiden Quellen handeln nur von der Gebetszeit."
     ],
     "correct": 0,
     "hint": "Welche Aussage stammt aus welchem Beleg?",
     "explain": "Die Quellen sind verbunden, enthalten aber unterschiedliche konkrete Aussagen."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Tawḥīd“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich bete Allah allein an. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Iḫlāṣ · 112:1 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Sag: Er ist Allah, der Eine. Sunnah (sinngemäß): Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen. Eigenes Lernbeispiel: Wir lernen, dass nur Allah angebetet wird.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Allah ist Einer und hat keinen Teilhaber.",
    "lines": [
     "Allah ist Einer.",
     "Nur Allah gebührt die Anbetung.",
     "Wir richten unser Duʿāʾ und unsere ʿIbādah an Allah.",
     "Wir lernen Allahs Namen und Eigenschaften aus Qurʾān und Sunnah."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Wir lernen, dass nur Allah angebetet wird.",
    "lines": [
     "Allah ist Einer.",
     "Nur Allah gebührt die Anbetung.",
     "Wir richten unser Duʿāʾ und unsere ʿIbādah an Allah.",
     "Wir stellen Fragen, prüfen die Belege und erklären das Gelernte in eigenen Worten."
    ],
    "evidence": "Qurʾān: Sag: Er ist Allah, der Eine. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Tawḥīd“ zusammenhängen.",
    "lines": [
     "Allah ist Einer.",
     "Der Qurʾān nennt in Sūrat al-Iḫlāṣ · 112:1 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 2856.",
     "Unser Lernschritt: Wir lernen Allahs Namen und Eigenschaften aus Qurʾān und Sunnah."
    ],
    "evidence": "Sūrat al-Iḫlāṣ · 112:1: Sag: Er ist Allah, der Eine. Ṣaḥīḥ al-Buḫārī, Nr. 2856: Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "aqidah-iman": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Ein Kind fragt, ob der Glaube an die Engel zum Īmān gehört. Was sagst du?",
     "options": [
      "Ja, den Glauben an Engel lernen wir aus authentischen Quellen.",
      "Nein, Īmān bedeutet nur, dass wir das Gebet lernen."
     ],
     "correct": 0,
     "hint": "Was wurde über die Engel gelernt?",
     "explain": "Die Sunnah nennt den Glauben an die Engel unter den Grundlagen des Īmān."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Īmān“: Was gehört zu unserem Glauben?",
     "options": [
      "Der Glaube an Allah und Seine Gesandten.",
      "Wir erfinden selbst die Glaubensgrundlagen."
     ],
     "correct": 0,
     "hint": "Die Grundlagen des Īmān werden durch die Offenbarung erklärt.",
     "explain": "Ich lerne die Grundlagen des Glaubens aus Qurʾān und Sunnah."
    },
    {
     "type": "text",
     "prompt": "Nenne drei Dinge, an die Muslime glauben. Woher lernen wir davon?",
     "sample": "Wir glauben an Allah, Seine Engel und Seine Gesandten. Wir lernen diese Grundlagen aus Qurʾān und Sunnah.",
     "hint": "Die Glaubensgrundlagen sind überliefert; ich denke mir keine weiteren aus."
    },
    {
     "type": "choice",
     "prompt": "Welche Aussage gehört zum behandelten Qurʾān-Vers 2:3?",
     "options": [
      "Die Gläubigen glauben an das Verborgene, beten und geben von ihrer Versorgung.",
      "Dieser Vers zählt ausdrücklich alle sechs Īmān-Grundlagen vollständig auf.",
      "Der Vers erklärt allein die genaue Gebetswaschung."
     ],
     "correct": 0,
     "hint": "Welche drei Dinge werden im Vers genannt?",
     "explain": "Der Vers nennt Eigenschaften der Gläubigen; die sechs Grundlagen stehen in der besprochenen Überlieferung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Ein Freund verwechselt Qurʾān 2:3 und den Ḥadīṯ Ǧibrīl. Wie kannst du richtig unterscheiden?",
     "options": [
      "Der Vers nennt Merkmale der Gläubigen, während der Ḥadīṯ die Grundlagen des Īmān ausdrücklich erklärt.",
      "Qurʾān 2:3 enthält dieselbe vollständige Aufzählung wie der Hadith.",
      "Der Ḥadīṯ Ǧibrīl handelt in dieser Lektion nur von Sauberkeit."
     ],
     "correct": 0,
     "hint": "Welcher Beleg nennt ausdrücklich die Īmān-Grundlagen?",
     "explain": "Qurʾān und Sunnah ergänzen unser Wissen, müssen aber korrekt zugeordnet werden."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Īmān“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich lerne die Grundlagen des Glaubens aus Qurʾān und Sunnah. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Baqarah · 2:3 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Diejenigen, die an das Verborgene glauben, das Gebet verrichten und von dem geben, womit Wir sie versorgt haben. Sunnah (sinngemäß): Der Prophet ﷺ erklärte die Grundlagen des Īmān: Allah, Seine Engel, Bücher, Gesandten, den Jüngsten Tag und die Vorherbestimmung. Eigenes Lernbeispiel: Der Glaube umfasst die im Qurʾān und in der Sunnah genannten Grundlagen.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Wir lernen, woran Muslime glauben.",
    "lines": [
     "Īmān bedeutet Glaube.",
     "Wir glauben an Allah und an das, was Er offenbart hat.",
     "Die Engel, Bücher und Gesandten gehören zum Glauben.",
     "Wir lernen auch über den Jüngsten Tag und die Vorherbestimmung."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Der Glaube umfasst die im Qurʾān und in der Sunnah genannten Grundlagen.",
    "lines": [
     "Īmān bedeutet Glaube.",
     "Wir glauben an Allah und an das, was Er offenbart hat.",
     "Die Engel, Bücher und Gesandten gehören zum Glauben.",
     "Wir stellen Fragen, prüfen die Belege und erklären das Gelernte in eigenen Worten."
    ],
    "evidence": "Qurʾān: Diejenigen, die an das Verborgene glauben, das Gebet verrichten und von dem geben, womit Wir sie versorgt haben. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte die Grundlagen des Īmān: Allah, Seine Engel, Bücher, Gesandten, den Jüngsten Tag und die Vorherbestimmung."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Īmān“ zusammenhängen.",
    "lines": [
     "Īmān bedeutet Glaube.",
     "Der Qurʾān nennt in Sūrat al-Baqarah · 2:3 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl).",
     "Unser Lernschritt: Wir lernen auch über den Jüngsten Tag und die Vorherbestimmung."
    ],
    "evidence": "Sūrat al-Baqarah · 2:3: Diejenigen, die an das Verborgene glauben, das Gebet verrichten und von dem geben, womit Wir sie versorgt haben. Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl): Der Prophet ﷺ erklärte die Grundlagen des Īmān: Allah, Seine Engel, Bücher, Gesandten, den Jüngsten Tag und die Vorherbestimmung. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "aqidah-ikhlas": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du hilfst jemandem, ohne dass andere dich sehen. Warum kann das gut sein?",
     "options": [
      "Meine gute Absicht ist wichtig, auch ohne Lob.",
      "Eine Tat kann nur gut sein, wenn mich jemand lobt."
     ],
     "correct": 0,
     "hint": "Wird jede gute Tat von anderen gesehen?",
     "explain": "Gute Taten und ihre Absichten sind nicht vom Applaus abhängig."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Ikhlāṣ“: Warum tun wir gute Taten?",
     "options": [
      "Wir bemühen uns um Aufrichtigkeit gegenüber Allah.",
      "Nur damit alle uns bewundern."
     ],
     "correct": 0,
     "hint": "Die Absicht gehört zu den wichtigen Dingen bei Taten.",
     "explain": "Ich bemühe mich, Allah aufrichtig zu dienen."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Ikhlāṣ“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich bemühe mich, Allah aufrichtig zu dienen. Ich darf Gutes tun, auch wenn niemand zuschaut.",
     "hint": "Wir bemühen uns, Allah aufrichtig zu dienen."
    },
    {
     "type": "choice",
     "prompt": "Was erklärt die genannte Sunnah über die Taten?",
     "options": [
      "Die Absicht ist bei Taten wichtig.",
      "Nur die Zahl der Zuschauer entscheidet über eine Tat.",
      "Eine gute Tat ist erst nach einem Lob wertvoll."
     ],
     "correct": 0,
     "hint": "Denke darüber nach, warum jemand eine Tat macht.",
     "explain": "Der Ḥadīṯ lehrt, dass Taten nach ihren Absichten beurteilt werden."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Ein Kind wird für eine gute Tat gelobt. Können wir dadurch seine innere Absicht sicher kennen?",
     "options": [
      "Nein. Wir sehen die Tat, aber die verborgene Absicht kennen wir nicht sicher.",
      "Ja. Wer gelobt wird, tut es immer nur für das Lob.",
      "Ja. Wer keinen Applaus erhält, hatte automatisch eine bessere Absicht."
     ],
     "correct": 0,
     "hint": "Was siehst du außen, und was bleibt im Herzen verborgen?",
     "explain": "Wir dürfen nicht behaupten, die verborgenen Absichten anderer Menschen sicher zu kennen."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Ikhlāṣ“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich bemühe mich, Allah aufrichtig zu dienen. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat az-Zumar · 39:11 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein. Sunnah (sinngemäß): Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden. Eigenes Lernbeispiel: Gute Taten sollen nicht nur zum Angeben getan werden.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Wir bemühen uns, Allah aufrichtig zu dienen.",
    "lines": [
     "Wenn ich etwas Gutes tue, ist meine Absicht wichtig.",
     "Ich will Allah gefallen, nicht nur gelobt werden.",
     "Ich darf Gutes tun, auch wenn niemand zuschaut.",
     "Ich bitte Allah um Aufrichtigkeit."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Gute Taten sollen nicht nur zum Angeben getan werden.",
    "lines": [
     "Wenn ich etwas Gutes tue, ist meine Absicht wichtig.",
     "Ich will Allah gefallen, nicht nur gelobt werden.",
     "Ich darf Gutes tun, auch wenn niemand zuschaut.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Ich bitte Allah um Aufrichtigkeit."
    ],
    "evidence": "Qurʾān: Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Ikhlāṣ“ zusammenhängen.",
    "lines": [
     "Wenn ich etwas Gutes tue, ist meine Absicht wichtig.",
     "Der Qurʾān nennt in Sūrat az-Zumar · 39:11 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 1.",
     "Anwendung im Alltag: Gute Taten sollen nicht nur zum Angeben getan werden."
    ],
    "evidence": "Sūrat az-Zumar · 39:11: Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein. Ṣaḥīḥ al-Buḫārī, Nr. 1: Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "akhlaq-sabr-geduldig-warten": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Ein Freund spielt noch. Was fragst du?",
     "options": [
      "Darf ich danach spielen?",
      "Gib es mir sofort!"
     ],
     "correct": 0,
     "hint": "Geduldig warten heißt freundlich fragen.",
     "explain": "Geduldig warten heißt freundlich fragen."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Geduldig warten“: Du wartest auf dein Spielzeug. Was machst du?",
     "options": [
      "Ich warte ruhig und frage freundlich.",
      "Ich reiße es einem anderen Kind weg."
     ],
     "correct": 0,
     "hint": "Denke daran: Ich übe Geduld, wenn etwas nicht sofort klappt.",
     "explain": "Ich warte ruhig und frage freundlich. Ich übe Geduld, wenn etwas nicht sofort klappt."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Geduldig warten“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich kann warten, ohne andere anzuschreien. Ich bleibe freundlich und versuche es erneut.",
     "hint": "Denke daran: Ich übe Geduld, wenn etwas nicht sofort klappt."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Geduldig warten“?",
     "options": [
      "Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen.",
      "Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht.",
      "Unser Übungsziel: Ich kann warten, ohne andere anzuschreien."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Baqarah · 2:153.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Baqarah · 2:153 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Geduldig warten“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich kann warten, ohne andere anzuschreien. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Baqarah · 2:153 und Ṣaḥīḥ al-Buḫārī, Nr. 1469; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Geduldig warten“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich kann warten, ohne andere anzuschreien. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Baqarah · 2:153 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen. Sunnah (sinngemäß): Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht. Eigenes Lernbeispiel: Ich kann warten, ohne andere anzuschreien.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Ich lerne ruhig zu bleiben, wenn ich warten muss.",
    "lines": [
     "Manchmal bin ich noch nicht an der Reihe.",
     "Ich darf sagen, dass mir Warten schwerfällt.",
     "Ich bleibe freundlich und versuche es erneut.",
     "Geduld üben wir jeden Tag."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich kann warten, ohne andere anzuschreien.",
    "lines": [
     "Manchmal bin ich noch nicht an der Reihe.",
     "Ich darf sagen, dass mir Warten schwerfällt.",
     "Ich bleibe freundlich und versuche es erneut.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Geduld üben wir jeden Tag."
    ],
    "evidence": "Qurʾān: Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Geduldig warten“ zusammenhängen.",
    "lines": [
     "Manchmal bin ich noch nicht an der Reihe.",
     "Der Qurʾān nennt in Sūrat al-Baqarah · 2:153 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 1469.",
     "Anwendung im Alltag: Ich kann warten, ohne andere anzuschreien."
    ],
    "evidence": "Sūrat al-Baqarah · 2:153: Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen. Ṣaḥīḥ al-Buḫārī, Nr. 1469: Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "akhlaq-sabr-nicht-aufgeben": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Dein Turm fällt um. Was hilft?",
     "options": [
      "Ich versuche es noch einmal.",
      "Ich höre für immer auf."
     ],
     "correct": 0,
     "hint": "Einen Fehler darf ich verbessern.",
     "explain": "Einen Fehler darf ich verbessern."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Nicht aufgeben“: Eine Aufgabe klappt beim ersten Mal nicht. Was machst du?",
     "options": [
      "Ich bitte um Hilfe und probiere es erneut.",
      "Ich werfe alles wütend weg."
     ],
     "correct": 0,
     "hint": "Denke daran: Ich übe Geduld, wenn etwas nicht sofort klappt.",
     "explain": "Ich bitte um Hilfe und probiere es erneut. Ich übe Geduld, wenn etwas nicht sofort klappt."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Nicht aufgeben“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich kann bei einem Fehler erneut üben. Ich darf um Hilfe bitten.",
     "hint": "Denke daran: Ich übe Geduld, wenn etwas nicht sofort klappt."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Nicht aufgeben“?",
     "options": [
      "Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen.",
      "Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht.",
      "Unser Übungsziel: Ich kann bei einem Fehler erneut üben."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Baqarah · 2:153.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Baqarah · 2:153 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Nicht aufgeben“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich kann bei einem Fehler erneut üben. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Baqarah · 2:153 und Ṣaḥīḥ al-Buḫārī, Nr. 1469; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Nicht aufgeben“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich kann bei einem Fehler erneut üben. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Baqarah · 2:153 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen. Sunnah (sinngemäß): Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht. Eigenes Lernbeispiel: Ich kann bei einem Fehler erneut üben.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Auch schwierige Dinge darf ich Schritt für Schritt lernen.",
    "lines": [
     "Nicht alles klappt beim ersten Versuch.",
     "Ein Fehler ist eine Gelegenheit zu lernen.",
     "Ich darf um Hilfe bitten.",
     "Dann versuche ich es noch einmal."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich kann bei einem Fehler erneut üben.",
    "lines": [
     "Nicht alles klappt beim ersten Versuch.",
     "Ein Fehler ist eine Gelegenheit zu lernen.",
     "Ich darf um Hilfe bitten.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Dann versuche ich es noch einmal."
    ],
    "evidence": "Qurʾān: Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Nicht aufgeben“ zusammenhängen.",
    "lines": [
     "Nicht alles klappt beim ersten Versuch.",
     "Der Qurʾān nennt in Sūrat al-Baqarah · 2:153 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 1469.",
     "Anwendung im Alltag: Ich kann bei einem Fehler erneut üben."
    ],
    "evidence": "Sūrat al-Baqarah · 2:153: Ihr, die ihr glaubt, sucht Hilfe durch Geduld und Gebet. Allah ist mit den Geduldigen. Ṣaḥīḥ al-Buḫārī, Nr. 1469: Der Prophet ﷺ lehrte, dass Allah demjenigen Geduld gibt, der sich um Geduld bemüht. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "akhlaq-amanah-geliehene-dinge": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du hast einen Stift geliehen. Was machst du danach?",
     "options": [
      "Ich gebe ihn zurück.",
      "Ich lege ihn zu meinen Sachen."
     ],
     "correct": 0,
     "hint": "Geliehene Dinge gehören anderen.",
     "explain": "Geliehene Dinge gehören anderen."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Geliehene Dinge“: Du bekommst ein Buch ausgeliehen. Was machst du?",
     "options": [
      "Ich behandle es sorgfältig und gebe es zurück.",
      "Ich behalte es heimlich."
     ],
     "correct": 0,
     "hint": "Denke daran: Ich bin zuverlässig, wenn mir jemand etwas anvertraut.",
     "explain": "Ich behandle es sorgfältig und gebe es zurück. Ich bin zuverlässig, wenn mir jemand etwas anvertraut."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Geliehene Dinge“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich gebe Geliehenes verlässlich zurück. Ich achte darauf, dass sie heil bleibt.",
     "hint": "Denke daran: Ich bin zuverlässig, wenn mir jemand etwas anvertraut."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Geliehene Dinge“?",
     "options": [
      "Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten.",
      "Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten.",
      "Unser Übungsziel: Ich gebe Geliehenes verlässlich zurück."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Muʾminūn · 23:8.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Muʾminūn · 23:8 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Geliehene Dinge“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich gebe Geliehenes verlässlich zurück. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Muʾminūn · 23:8 und Ṣaḥīḥ al-Buḫārī, Nr. 33; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Geliehene Dinge“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich gebe Geliehenes verlässlich zurück. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Muʾminūn · 23:8 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten. Sunnah (sinngemäß): Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten. Eigenes Lernbeispiel: Ich gebe Geliehenes verlässlich zurück.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Anvertraute Sachen behandle ich sorgfältig.",
    "lines": [
     "Eine Sache gehört manchmal jemand anderem.",
     "Ich frage, bevor ich sie benutze.",
     "Ich achte darauf, dass sie heil bleibt.",
     "Ich gebe sie wie vereinbart zurück."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich gebe Geliehenes verlässlich zurück.",
    "lines": [
     "Eine Sache gehört manchmal jemand anderem.",
     "Ich frage, bevor ich sie benutze.",
     "Ich achte darauf, dass sie heil bleibt.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Ich gebe sie wie vereinbart zurück."
    ],
    "evidence": "Qurʾān: Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Geliehene Dinge“ zusammenhängen.",
    "lines": [
     "Eine Sache gehört manchmal jemand anderem.",
     "Der Qurʾān nennt in Sūrat al-Muʾminūn · 23:8 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 33.",
     "Anwendung im Alltag: Ich gebe Geliehenes verlässlich zurück."
    ],
    "evidence": "Sūrat al-Muʾminūn · 23:8: Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten. Ṣaḥīḥ al-Buḫārī, Nr. 33: Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "akhlaq-amanah-mein-versprechen": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du kannst deine Zusage nicht halten. Was machst du?",
     "options": [
      "Ich sage ehrlich Bescheid.",
      "Ich sage einfach nichts."
     ],
     "correct": 0,
     "hint": "Versprechen soll man ernst nehmen.",
     "explain": "Versprechen soll man ernst nehmen."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Mein Versprechen“: Du hast versprochen, beim Aufräumen zu helfen. Was machst du?",
     "options": [
      "Ich halte meine Zusage oder erkläre ehrlich ein Problem.",
      "Ich tue so, als hätte ich nie etwas gesagt."
     ],
     "correct": 0,
     "hint": "Denke daran: Ich bin zuverlässig, wenn mir jemand etwas anvertraut.",
     "explain": "Ich halte meine Zusage oder erkläre ehrlich ein Problem. Ich bin zuverlässig, wenn mir jemand etwas anvertraut."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Mein Versprechen“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich bemühe mich, Zusagen einzuhalten. Wenn etwas nicht klappt, sage ich es ehrlich.",
     "hint": "Denke daran: Ich bin zuverlässig, wenn mir jemand etwas anvertraut."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Mein Versprechen“?",
     "options": [
      "Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten.",
      "Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten.",
      "Unser Übungsziel: Ich bemühe mich, Zusagen einzuhalten."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Muʾminūn · 23:8.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Muʾminūn · 23:8 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Mein Versprechen“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich bemühe mich, Zusagen einzuhalten. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Muʾminūn · 23:8 und Ṣaḥīḥ al-Buḫārī, Nr. 33; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Mein Versprechen“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich bemühe mich, Zusagen einzuhalten. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Muʾminūn · 23:8 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten. Sunnah (sinngemäß): Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten. Eigenes Lernbeispiel: Ich bemühe mich, Zusagen einzuhalten.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Ich überlege gut, bevor ich etwas verspreche.",
    "lines": [
     "Andere Menschen verlassen sich auf mein Wort.",
     "Deshalb verspreche ich nichts leichtfertig.",
     "Wenn etwas nicht klappt, sage ich es ehrlich.",
     "So lernen wir, zuverlässig zu sein."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich bemühe mich, Zusagen einzuhalten.",
    "lines": [
     "Andere Menschen verlassen sich auf mein Wort.",
     "Deshalb verspreche ich nichts leichtfertig.",
     "Wenn etwas nicht klappt, sage ich es ehrlich.",
     "Wir üben das Thema mit einer passenden Alltagssituation: So lernen wir, zuverlässig zu sein."
    ],
    "evidence": "Qurʾān: Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Mein Versprechen“ zusammenhängen.",
    "lines": [
     "Andere Menschen verlassen sich auf mein Wort.",
     "Der Qurʾān nennt in Sūrat al-Muʾminūn · 23:8 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 33.",
     "Anwendung im Alltag: Ich bemühe mich, Zusagen einzuhalten."
    ],
    "evidence": "Sūrat al-Muʾminūn · 23:8: Und diejenigen, die auf anvertraute Dinge und ihre Vereinbarungen achten. Ṣaḥīḥ al-Buḫārī, Nr. 33: Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-salam-salam-erwidern": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Ein Kind grüßt mit Salām. Was antwortest du?",
     "options": [
      "Wa ʿalaykum as-Salām.",
      "Ich bleibe absichtlich still."
     ],
     "correct": 0,
     "hint": "Wir erwidern den Friedensgruß.",
     "explain": "Wir erwidern den Friedensgruß."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Salām erwidern“: Jemand grüßt dich mit Salām. Was machst du?",
     "options": [
      "Ich antworte freundlich mit Salām.",
      "Ich mache mich über den Gruß lustig."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir üben den islamischen Friedensgruß und eine gute Antwort.",
     "explain": "Ich antworte freundlich mit Salām. Wir üben den islamischen Friedensgruß und eine gute Antwort."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Salām erwidern“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich übe eine gute Antwort auf den Salām. Der Friedensgruß verbindet uns.",
     "hint": "Denke daran: Wir üben den islamischen Friedensgruß und eine gute Antwort."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Salām erwidern“?",
     "options": [
      "Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß.",
      "Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten.",
      "Unser Übungsziel: Ich übe eine gute Antwort auf den Salām."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat an-Nisāʾ · 4:86.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat an-Nisāʾ · 4:86 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Salām erwidern“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich übe eine gute Antwort auf den Salām. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat an-Nisāʾ · 4:86 und Ṣaḥīḥ Muslim, Nr. 54a; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Salām erwidern“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich übe eine gute Antwort auf den Salām. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat an-Nisāʾ · 4:86 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß. Sunnah (sinngemäß): Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten. Eigenes Lernbeispiel: Ich übe eine gute Antwort auf den Salām.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Auf einen Gruß antworte ich freundlich.",
    "lines": [
     "Jemand sagt freundlich Salām zu mir.",
     "Ich höre zu und antworte freundlich.",
     "Der Friedensgruß verbindet uns.",
     "Wir grüßen ohne Spott."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich übe eine gute Antwort auf den Salām.",
    "lines": [
     "Jemand sagt freundlich Salām zu mir.",
     "Ich höre zu und antworte freundlich.",
     "Der Friedensgruß verbindet uns.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Wir grüßen ohne Spott."
    ],
    "evidence": "Qurʾān: Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Salām erwidern“ zusammenhängen.",
    "lines": [
     "Jemand sagt freundlich Salām zu mir.",
     "Der Qurʾān nennt in Sūrat an-Nisāʾ · 4:86 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ Muslim, Nr. 54a.",
     "Anwendung im Alltag: Ich übe eine gute Antwort auf den Salām."
    ],
    "evidence": "Sūrat an-Nisāʾ · 4:86: Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß. Ṣaḥīḥ Muslim, Nr. 54a: Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-salam-zuerst-gru-en": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du triffst einen muslimischen Freund. Was kannst du sagen?",
     "options": [
      "As-Salāmu ʿalaykum.",
      "Ich gehe ohne Gruß vorbei."
     ],
     "correct": 0,
     "hint": "Ein guter Gruß verbindet uns.",
     "explain": "Ein guter Gruß verbindet uns."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Zuerst grüßen“: Du triffst eine bekannte Person. Was machst du?",
     "options": [
      "Ich begrüße sie freundlich.",
      "Ich beleidige sie zur Begrüßung."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir üben den islamischen Friedensgruß und eine gute Antwort.",
     "explain": "Ich begrüße sie freundlich. Wir üben den islamischen Friedensgruß und eine gute Antwort."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Zuerst grüßen“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich grüße Menschen höflich. Ich spreche den Gruß deutlich.",
     "hint": "Denke daran: Wir üben den islamischen Friedensgruß und eine gute Antwort."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Zuerst grüßen“?",
     "options": [
      "Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß.",
      "Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten.",
      "Unser Übungsziel: Ich grüße Menschen höflich."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat an-Nisāʾ · 4:86.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat an-Nisāʾ · 4:86 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Zuerst grüßen“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich grüße Menschen höflich. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat an-Nisāʾ · 4:86 und Ṣaḥīḥ Muslim, Nr. 54a; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Zuerst grüßen“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich grüße Menschen höflich. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat an-Nisāʾ · 4:86 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß. Sunnah (sinngemäß): Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten. Eigenes Lernbeispiel: Ich grüße Menschen höflich.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Mit einem freundlichen Gruß kann ich beginnen.",
    "lines": [
     "Ein Gruß kann Freude schenken.",
     "Ich beginne freundlich, wenn es passt.",
     "Ich spreche den Gruß deutlich.",
     "Danach höre ich aufmerksam zu."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich grüße Menschen höflich.",
    "lines": [
     "Ein Gruß kann Freude schenken.",
     "Ich beginne freundlich, wenn es passt.",
     "Ich spreche den Gruß deutlich.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Danach höre ich aufmerksam zu."
    ],
    "evidence": "Qurʾān: Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Zuerst grüßen“ zusammenhängen.",
    "lines": [
     "Ein Gruß kann Freude schenken.",
     "Der Qurʾān nennt in Sūrat an-Nisāʾ · 4:86 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ Muslim, Nr. 54a.",
     "Anwendung im Alltag: Ich grüße Menschen höflich."
    ],
    "evidence": "Sūrat an-Nisāʾ · 4:86: Wenn ihr freundlich gegrüßt werdet, antwortet mit einem besseren oder gleichwertigen Gruß. Ṣaḥīḥ Muslim, Nr. 54a: Der Prophet ﷺ ermutigte dazu, den Salām untereinander zu verbreiten. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-worte-bei-streit-sprechen": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du möchtest anders spielen. Was sagst du?",
     "options": [
      "Ich sage freundlich meine Meinung.",
      "Ich rede nicht mehr mit dir!"
     ],
     "correct": 0,
     "hint": "Ich darf freundlich widersprechen.",
     "explain": "Ich darf freundlich widersprechen."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Bei Streit sprechen“: Du bist mit einem Freund uneinig. Was machst du?",
     "options": [
      "Ich sage ruhig, was ich meine.",
      "Ich beschimpfe meinen Freund."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir sprechen ehrlich und freundlich, auch wenn wir anderer Meinung sind.",
     "explain": "Ich sage ruhig, was ich meine. Wir sprechen ehrlich und freundlich, auch wenn wir anderer Meinung sind."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Bei Streit sprechen“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich spreche ohne Beleidigungen. Ich muss niemanden beleidigen.",
     "hint": "Denke daran: Wir sprechen ehrlich und freundlich, auch wenn wir anderer Meinung sind."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Bei Streit sprechen“?",
     "options": [
      "Sag Meinen Dienern, sie sollen auf die beste Weise sprechen.",
      "Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen.",
      "Unser Übungsziel: Ich spreche ohne Beleidigungen."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Isrāʾ · 17:53.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Isrāʾ · 17:53 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Bei Streit sprechen“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich spreche ohne Beleidigungen. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Isrāʾ · 17:53 und Ṣaḥīḥ al-Buḫārī, Nr. 6018; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Bei Streit sprechen“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich spreche ohne Beleidigungen. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Isrāʾ · 17:53 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Sag Meinen Dienern, sie sollen auf die beste Weise sprechen. Sunnah (sinngemäß): Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen. Eigenes Lernbeispiel: Ich spreche ohne Beleidigungen.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Auch wenn ich verärgert bin, wähle ich gute Worte.",
    "lines": [
     "Manchmal sind zwei Menschen anderer Meinung.",
     "Ich darf ruhig sagen, was ich denke.",
     "Ich muss niemanden beleidigen.",
     "Gute Worte helfen uns, wieder zuzuhören."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich spreche ohne Beleidigungen.",
    "lines": [
     "Manchmal sind zwei Menschen anderer Meinung.",
     "Ich darf ruhig sagen, was ich denke.",
     "Ich muss niemanden beleidigen.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Gute Worte helfen uns, wieder zuzuhören."
    ],
    "evidence": "Qurʾān: Sag Meinen Dienern, sie sollen auf die beste Weise sprechen. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Bei Streit sprechen“ zusammenhängen.",
    "lines": [
     "Manchmal sind zwei Menschen anderer Meinung.",
     "Der Qurʾān nennt in Sūrat al-Isrāʾ · 17:53 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 6018.",
     "Anwendung im Alltag: Ich spreche ohne Beleidigungen."
    ],
    "evidence": "Sūrat al-Isrāʾ · 17:53: Sag Meinen Dienern, sie sollen auf die beste Weise sprechen. Ṣaḥīḥ al-Buḫārī, Nr. 6018: Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-worte-erst-nachdenken": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du bist verärgert. Was hilft vor dem Reden?",
     "options": [
      "Kurz überlegen.",
      "Sofort schimpfen."
     ],
     "correct": 0,
     "hint": "Gute Worte beginnen mit Nachdenken.",
     "explain": "Gute Worte beginnen mit Nachdenken."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Erst nachdenken“: Dir fällt ein gemeiner Satz ein. Was machst du?",
     "options": [
      "Ich denke nach und sage etwas Freundliches.",
      "Ich verletze jemanden absichtlich."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir sprechen ehrlich und freundlich, auch wenn wir anderer Meinung sind.",
     "explain": "Ich denke nach und sage etwas Freundliches. Wir sprechen ehrlich und freundlich, auch wenn wir anderer Meinung sind."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Erst nachdenken“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich lerne, unnötige verletzende Worte zu vermeiden. Ich sage etwas Gutes, wenn ich kann.",
     "hint": "Denke daran: Wir sprechen ehrlich und freundlich, auch wenn wir anderer Meinung sind."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Erst nachdenken“?",
     "options": [
      "Sag Meinen Dienern, sie sollen auf die beste Weise sprechen.",
      "Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen.",
      "Unser Übungsziel: Ich lerne, unnötige verletzende Worte zu vermeiden."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Isrāʾ · 17:53.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Isrāʾ · 17:53 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Erst nachdenken“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich lerne, unnötige verletzende Worte zu vermeiden. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Isrāʾ · 17:53 und Ṣaḥīḥ al-Buḫārī, Nr. 6018; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Erst nachdenken“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich lerne, unnötige verletzende Worte zu vermeiden. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Isrāʾ · 17:53 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Sag Meinen Dienern, sie sollen auf die beste Weise sprechen. Sunnah (sinngemäß): Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen. Eigenes Lernbeispiel: Ich lerne, unnötige verletzende Worte zu vermeiden.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Vor dem Sprechen überlege ich, ob meine Worte gut sind.",
    "lines": [
     "Worte können trösten oder verletzen.",
     "Ich denke vor dem Sprechen nach.",
     "Ich sage etwas Gutes, wenn ich kann.",
     "Sonst darf ich erst einmal schweigen."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich lerne, unnötige verletzende Worte zu vermeiden.",
    "lines": [
     "Worte können trösten oder verletzen.",
     "Ich denke vor dem Sprechen nach.",
     "Ich sage etwas Gutes, wenn ich kann.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Sonst darf ich erst einmal schweigen."
    ],
    "evidence": "Qurʾān: Sag Meinen Dienern, sie sollen auf die beste Weise sprechen. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Erst nachdenken“ zusammenhängen.",
    "lines": [
     "Worte können trösten oder verletzen.",
     "Der Qurʾān nennt in Sūrat al-Isrāʾ · 17:53 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 6018.",
     "Anwendung im Alltag: Ich lerne, unnötige verletzende Worte zu vermeiden."
    ],
    "evidence": "Sūrat al-Isrāʾ · 17:53: Sag Meinen Dienern, sie sollen auf die beste Weise sprechen. Ṣaḥīḥ al-Buḫārī, Nr. 6018: Der Prophet ﷺ lehrte: Wer Gutes sagen kann, soll Gutes sagen; sonst soll er schweigen. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-respekt-eltern-zuhoren": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du verstehst eine Bitte nicht. Was tust du?",
     "options": [
      "Ich frage freundlich nach.",
      "Ich tue so, als hätte ich zugehört."
     ],
     "correct": 0,
     "hint": "Nachfragen kann respektvoll sein.",
     "explain": "Nachfragen kann respektvoll sein."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Eltern zuhören“: Dein Vater bittet dich um Hilfe. Was machst du?",
     "options": [
      "Ich antworte freundlich und höre zu.",
      "Ich schreie ihn absichtlich an."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir üben Respekt für Eltern, Familie und Mitmenschen.",
     "explain": "Ich antworte freundlich und höre zu. Wir üben Respekt für Eltern, Familie und Mitmenschen."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Eltern zuhören“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich antworte respektvoll, auch wenn ich müde bin. Ich spreche freundlich und ehrlich.",
     "hint": "Denke daran: Wir üben Respekt für Eltern, Familie und Mitmenschen."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Eltern zuhören“?",
     "options": [
      "Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen.",
      "Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters.",
      "Unser Übungsziel: Ich antworte respektvoll, auch wenn ich müde bin."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Isrāʾ · 17:23.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Isrāʾ · 17:23 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Eltern zuhören“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich antworte respektvoll, auch wenn ich müde bin. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Isrāʾ · 17:23 und Ṣaḥīḥ al-Buḫārī, Nr. 5971; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Eltern zuhören“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich antworte respektvoll, auch wenn ich müde bin. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Isrāʾ · 17:23 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen. Sunnah (sinngemäß): Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters. Eigenes Lernbeispiel: Ich antworte respektvoll, auch wenn ich müde bin.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Ich übe, meinen Eltern freundlich zu antworten.",
    "lines": [
     "Manchmal bitten mich meine Eltern um etwas.",
     "Ich höre aufmerksam zu.",
     "Ich spreche freundlich und ehrlich.",
     "Wenn ich Hilfe brauche, bitte ich darum."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich antworte respektvoll, auch wenn ich müde bin.",
    "lines": [
     "Manchmal bitten mich meine Eltern um etwas.",
     "Ich höre aufmerksam zu.",
     "Ich spreche freundlich und ehrlich.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Wenn ich Hilfe brauche, bitte ich darum."
    ],
    "evidence": "Qurʾān: Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Eltern zuhören“ zusammenhängen.",
    "lines": [
     "Manchmal bitten mich meine Eltern um etwas.",
     "Der Qurʾān nennt in Sūrat al-Isrāʾ · 17:23 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 5971.",
     "Anwendung im Alltag: Ich antworte respektvoll, auch wenn ich müde bin."
    ],
    "evidence": "Sūrat al-Isrāʾ · 17:23: Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen. Ṣaḥīḥ al-Buḫārī, Nr. 5971: Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-respekt-hilfsbereit-sein": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du siehst, dass jemand Hilfe braucht. Was fragst du?",
     "options": [
      "Kann ich helfen?",
      "Du schaffst das sowieso nicht!"
     ],
     "correct": 0,
     "hint": "Freundlich helfen beginnt mit Nachfragen.",
     "explain": "Freundlich helfen beginnt mit Nachfragen."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Hilfsbereit sein“: Deine Mutter trägt mehrere leichte Sachen. Was machst du?",
     "options": [
      "Ich frage freundlich, ob ich helfen kann.",
      "Ich lache sie aus."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir üben Respekt für Eltern, Familie und Mitmenschen.",
     "explain": "Ich frage freundlich, ob ich helfen kann. Wir üben Respekt für Eltern, Familie und Mitmenschen."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Hilfsbereit sein“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich bemerke, wenn jemand Unterstützung braucht. Freundliche Worte sind dabei wichtig.",
     "hint": "Denke daran: Wir üben Respekt für Eltern, Familie und Mitmenschen."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Hilfsbereit sein“?",
     "options": [
      "Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen.",
      "Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters.",
      "Unser Übungsziel: Ich bemerke, wenn jemand Unterstützung braucht."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Isrāʾ · 17:23.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Isrāʾ · 17:23 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Hilfsbereit sein“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich bemerke, wenn jemand Unterstützung braucht. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Isrāʾ · 17:23 und Ṣaḥīḥ al-Buḫārī, Nr. 5971; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Hilfsbereit sein“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich bemerke, wenn jemand Unterstützung braucht. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Isrāʾ · 17:23 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen. Sunnah (sinngemäß): Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters. Eigenes Lernbeispiel: Ich bemerke, wenn jemand Unterstützung braucht.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "In der Familie kann ich mit kleinen Dingen helfen.",
    "lines": [
     "Es gibt viele kleine Aufgaben zu Hause.",
     "Ich kann fragen, ob ich helfen darf.",
     "Freundliche Worte sind dabei wichtig.",
     "So zeigen wir Fürsorge im Alltag."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich bemerke, wenn jemand Unterstützung braucht.",
    "lines": [
     "Es gibt viele kleine Aufgaben zu Hause.",
     "Ich kann fragen, ob ich helfen darf.",
     "Freundliche Worte sind dabei wichtig.",
     "Wir üben das Thema mit einer passenden Alltagssituation: So zeigen wir Fürsorge im Alltag."
    ],
    "evidence": "Qurʾān: Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Hilfsbereit sein“ zusammenhängen.",
    "lines": [
     "Es gibt viele kleine Aufgaben zu Hause.",
     "Der Qurʾān nennt in Sūrat al-Isrāʾ · 17:23 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 5971.",
     "Anwendung im Alltag: Ich bemerke, wenn jemand Unterstützung braucht."
    ],
    "evidence": "Sūrat al-Isrāʾ · 17:23: Allah befiehlt, Ihm allein zu dienen und die Eltern gut zu behandeln. Sprich ehrerbietig mit ihnen. Ṣaḥīḥ al-Buḫārī, Nr. 5971: Der Prophet ﷺ betonte besonders die gute Behandlung der Mutter und auch des Vaters. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "fiqh-taharah-saubere-kleidung": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Dein Ärmel ist schmutzig. Was kannst du tun?",
     "options": [
      "Ich bitte beim Reinigen um Hilfe.",
      "Ich verstecke den Ärmel."
     ],
     "correct": 0,
     "hint": "Saubere Kleidung ist gut.",
     "explain": "Saubere Kleidung ist gut."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Saubere Kleidung“: Du bemerkst Schmutz an deinem Ärmel. Was machst du?",
     "options": [
      "Ich sage es und reinige ihn, wenn es möglich ist.",
      "Ich verteile den Schmutz absichtlich."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir lernen, uns selbst, unsere Kleidung und unsere Umgebung sauber zu halten.",
     "explain": "Ich sage es und reinige ihn, wenn es möglich ist. Wir lernen, uns selbst, unsere Kleidung und unsere Umgebung sauber zu halten."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Saubere Kleidung“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich lerne, warum saubere Kleidung wichtig ist. Ich bitte bei Bedarf um Hilfe.",
     "hint": "Denke daran: Wir lernen, uns selbst, unsere Kleidung und unsere Umgebung sauber zu halten."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Saubere Kleidung“?",
     "options": [
      "Und reinige deine Kleidung.",
      "Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist.",
      "Unser Übungsziel: Ich lerne, warum saubere Kleidung wichtig ist."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Muddaṯṯir · 74:4.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Muddaṯṯir · 74:4 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Saubere Kleidung“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich lerne, warum saubere Kleidung wichtig ist. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Muddaṯṯir · 74:4 und Ṣaḥīḥ Muslim, Nr. 223; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Saubere Kleidung“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich lerne, warum saubere Kleidung wichtig ist. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Muddaṯṯir · 74:4 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Und reinige deine Kleidung. Sunnah (sinngemäß): Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist. Eigenes Lernbeispiel: Ich lerne, warum saubere Kleidung wichtig ist.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Für den Alltag und das Gebet achte ich auf Sauberkeit.",
    "lines": [
     "Meine Kleidung soll sauber sein.",
     "Wenn etwas schmutzig ist, melde ich es.",
     "Ich bitte bei Bedarf um Hilfe.",
     "Sauberkeit ist etwas Gutes."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich lerne, warum saubere Kleidung wichtig ist.",
    "lines": [
     "Meine Kleidung soll sauber sein.",
     "Wenn etwas schmutzig ist, melde ich es.",
     "Ich bitte bei Bedarf um Hilfe.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Sauberkeit ist etwas Gutes."
    ],
    "evidence": "Qurʾān: Und reinige deine Kleidung. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Saubere Kleidung“ zusammenhängen.",
    "lines": [
     "Meine Kleidung soll sauber sein.",
     "Der Qurʾān nennt in Sūrat al-Muddaṯṯir · 74:4 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ Muslim, Nr. 223.",
     "Anwendung im Alltag: Ich lerne, warum saubere Kleidung wichtig ist."
    ],
    "evidence": "Sūrat al-Muddaṯṯir · 74:4: Und reinige deine Kleidung. Ṣaḥīḥ Muslim, Nr. 223: Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "fiqh-taharah-sauberer-lernplatz": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du hast fertig gebastelt. Was machst du?",
     "options": [
      "Ich räume meinen Platz auf.",
      "Ich lasse alles liegen."
     ],
     "correct": 0,
     "hint": "Ich sorge mit für meinen Platz.",
     "explain": "Ich sorge mit für meinen Platz."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Sauberer Lernplatz“: Nach dem Basteln liegen Papierschnipsel herum. Was machst du?",
     "options": [
      "Ich helfe beim Aufräumen.",
      "Ich werfe noch mehr auf den Boden."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir lernen, uns selbst, unsere Kleidung und unsere Umgebung sauber zu halten.",
     "explain": "Ich helfe beim Aufräumen. Wir lernen, uns selbst, unsere Kleidung und unsere Umgebung sauber zu halten."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Sauberer Lernplatz“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich übe sorgsamen Umgang mit meiner Umgebung. Ich achte auf Sauberkeit.",
     "hint": "Denke daran: Wir lernen, uns selbst, unsere Kleidung und unsere Umgebung sauber zu halten."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Sauberer Lernplatz“?",
     "options": [
      "Und reinige deine Kleidung.",
      "Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist.",
      "Unser Übungsziel: Ich übe sorgsamen Umgang mit meiner Umgebung."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Muddaṯṯir · 74:4.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Muddaṯṯir · 74:4 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Sauberer Lernplatz“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich übe sorgsamen Umgang mit meiner Umgebung. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Muddaṯṯir · 74:4 und Ṣaḥīḥ Muslim, Nr. 223; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Sauberer Lernplatz“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich übe sorgsamen Umgang mit meiner Umgebung. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Muddaṯṯir · 74:4 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Und reinige deine Kleidung. Sunnah (sinngemäß): Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist. Eigenes Lernbeispiel: Ich übe sorgsamen Umgang mit meiner Umgebung.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Ich halte meinen Platz so sauber, wie ich kann.",
    "lines": [
     "Nach dem Spielen liegen manchmal Sachen herum.",
     "Ich räume meinen Platz auf.",
     "Ich achte auf Sauberkeit.",
     "Dabei kann ich um Hilfe bitten."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich übe sorgsamen Umgang mit meiner Umgebung.",
    "lines": [
     "Nach dem Spielen liegen manchmal Sachen herum.",
     "Ich räume meinen Platz auf.",
     "Ich achte auf Sauberkeit.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Dabei kann ich um Hilfe bitten."
    ],
    "evidence": "Qurʾān: Und reinige deine Kleidung. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Sauberer Lernplatz“ zusammenhängen.",
    "lines": [
     "Nach dem Spielen liegen manchmal Sachen herum.",
     "Der Qurʾān nennt in Sūrat al-Muddaṯṯir · 74:4 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ Muslim, Nr. 223.",
     "Anwendung im Alltag: Ich übe sorgsamen Umgang mit meiner Umgebung."
    ],
    "evidence": "Sūrat al-Muddaṯṯir · 74:4: Und reinige deine Kleidung. Ṣaḥīḥ Muslim, Nr. 223: Der Prophet ﷺ erklärte, dass die rituelle Reinigung ein wichtiger Teil des Glaubens ist. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "fiqh-wudu-gesicht-und-arme": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Was wird beim Wuḍūʾ gewaschen?",
     "options": [
      "Das Gesicht und die Arme.",
      "Nur die Haare."
     ],
     "correct": 0,
     "hint": "Im Qurʾān werden Gesicht und Arme genannt.",
     "explain": "Im Qurʾān werden Gesicht und Arme genannt."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Gesicht und Arme“: Welches Körperteil wird in Qurʾān 5:6 ausdrücklich erwähnt?",
     "options": [
      "Das Gesicht gehört zum Wuḍūʾ.",
      "Die Haare müssen abgeschnitten werden."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir erkennen die grundlegenden Glieder der Gebetswaschung, ohne einzelne Sonderfälle vorwegzunehmen.",
     "explain": "Das Gesicht gehört zum Wuḍūʾ. Wir erkennen die grundlegenden Glieder der Gebetswaschung, ohne einzelne Sonderfälle vorwegzunehmen."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Gesicht und Arme“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich erkenne Gesicht und Arme als Teile des Wuḍūʾ. Er nennt auch die Arme.",
     "hint": "Denke daran: Wir erkennen die grundlegenden Glieder der Gebetswaschung, ohne einzelne Sonderfälle vorwegzunehmen."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Gesicht und Arme“?",
     "options": [
      "Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln.",
      "Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt.",
      "Unser Übungsziel: Ich erkenne Gesicht und Arme als Teile des Wuḍūʾ."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Māʾidah · 5:6 (Textauszug).",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Māʾidah · 5:6 (Textauszug) wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Gesicht und Arme“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich erkenne Gesicht und Arme als Teile des Wuḍūʾ. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Māʾidah · 5:6 (Textauszug) und Ṣaḥīḥ al-Buḫārī, Nr. 135; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Gesicht und Arme“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich erkenne Gesicht und Arme als Teile des Wuḍūʾ. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Māʾidah · 5:6 (Textauszug) und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln. Sunnah (sinngemäß): Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt. Eigenes Lernbeispiel: Ich erkenne Gesicht und Arme als Teile des Wuḍūʾ.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Der Qurʾān nennt Glieder der Gebetswaschung.",
    "lines": [
     "Vor dem Gebet lernen wir Wuḍūʾ.",
     "Der Qurʾān nennt das Gesicht.",
     "Er nennt auch die Arme.",
     "Wir lernen die Handlung Schritt für Schritt."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich erkenne Gesicht und Arme als Teile des Wuḍūʾ.",
    "lines": [
     "Vor dem Gebet lernen wir Wuḍūʾ.",
     "Der Qurʾān nennt das Gesicht.",
     "Er nennt auch die Arme.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Wir lernen die Handlung Schritt für Schritt."
    ],
    "evidence": "Qurʾān: Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Gesicht und Arme“ zusammenhängen.",
    "lines": [
     "Vor dem Gebet lernen wir Wuḍūʾ.",
     "Der Qurʾān nennt in Sūrat al-Māʾidah · 5:6 (Textauszug) eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 135.",
     "Anwendung im Alltag: Ich erkenne Gesicht und Arme als Teile des Wuḍūʾ."
    ],
    "evidence": "Sūrat al-Māʾidah · 5:6 (Textauszug): Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln. Ṣaḥīḥ al-Buḫārī, Nr. 135: Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "fiqh-wudu-kopf-und-fu-e": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Was machen wir beim Wuḍūʾ am Kopf?",
     "options": [
      "Wir streichen mit nassen Händen darüber.",
      "Wir waschen nur den Hals."
     ],
     "correct": 0,
     "hint": "Das Streichen über den Kopf gehört dazu.",
     "explain": "Das Streichen über den Kopf gehört dazu."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Kopf und Füße“: Was gehört laut Qurʾān 5:6 zur Gebetswaschung?",
     "options": [
      "Über den Kopf streichen.",
      "Den Kopf mit Seife schrubben."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir erkennen die grundlegenden Glieder der Gebetswaschung, ohne einzelne Sonderfälle vorwegzunehmen.",
     "explain": "Über den Kopf streichen. Wir erkennen die grundlegenden Glieder der Gebetswaschung, ohne einzelne Sonderfälle vorwegzunehmen."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Kopf und Füße“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich erkenne das Streichen über den Kopf. Wir lernen außerdem die Reinigung der Füße.",
     "hint": "Denke daran: Wir erkennen die grundlegenden Glieder der Gebetswaschung, ohne einzelne Sonderfälle vorwegzunehmen."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Kopf und Füße“?",
     "options": [
      "Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln.",
      "Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt.",
      "Unser Übungsziel: Ich erkenne das Streichen über den Kopf."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Māʾidah · 5:6 (Textauszug).",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Māʾidah · 5:6 (Textauszug) wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Kopf und Füße“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich erkenne das Streichen über den Kopf. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Māʾidah · 5:6 (Textauszug) und Ṣaḥīḥ al-Buḫārī, Nr. 135; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Kopf und Füße“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich erkenne das Streichen über den Kopf. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Māʾidah · 5:6 (Textauszug) und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln. Sunnah (sinngemäß): Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt. Eigenes Lernbeispiel: Ich erkenne das Streichen über den Kopf.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Ich höre aufmerksam zu, welche Glieder genannt werden.",
    "lines": [
     "Im Qurʾān wird auch der Kopf genannt.",
     "Wir lernen das Streichen über den Kopf.",
     "Wir lernen außerdem die Reinigung der Füße.",
     "Praktische Übungen machen wir mit Anleitung."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich erkenne das Streichen über den Kopf.",
    "lines": [
     "Im Qurʾān wird auch der Kopf genannt.",
     "Wir lernen das Streichen über den Kopf.",
     "Wir lernen außerdem die Reinigung der Füße.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Praktische Übungen machen wir mit Anleitung."
    ],
    "evidence": "Qurʾān: Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Kopf und Füße“ zusammenhängen.",
    "lines": [
     "Im Qurʾān wird auch der Kopf genannt.",
     "Der Qurʾān nennt in Sūrat al-Māʾidah · 5:6 (Textauszug) eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 135.",
     "Anwendung im Alltag: Ich erkenne das Streichen über den Kopf."
    ],
    "evidence": "Sūrat al-Māʾidah · 5:6 (Textauszug): Der Vers nennt unter anderem das Waschen des Gesichts und der Arme, das Streichen über den Kopf und das Waschen der Füße bis zu den Knöcheln. Ṣaḥīḥ al-Buḫārī, Nr. 135: Der Prophet ﷺ erklärte, dass man bei einem Zustand, der die Gebetswaschung aufhebt, vor dem Gebet erneut Wuḍūʾ benötigt. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "fiqh-salah-allah-gedenken": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Wen gedenken wir im Gebet?",
     "options": [
      "Allah.",
      "Unserem Spielzeug."
     ],
     "correct": 0,
     "hint": "Das Gebet ist Gottesdienst.",
     "explain": "Das Gebet ist Gottesdienst."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Allah gedenken“: Woran denken wir im Gebet?",
     "options": [
      "Wir gedenken Allahs.",
      "Wir beten nur zum Zeitvertreib."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir beginnen mit dem Sinn des Gebets und lernen die Praxis anschließend Schritt für Schritt.",
     "explain": "Wir gedenken Allahs. Wir beginnen mit dem Sinn des Gebets und lernen die Praxis anschließend Schritt für Schritt."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Allah gedenken“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich verstehe, warum das Gebet wichtig ist. Der Prophet ﷺ zeigte uns das Gebet.",
     "hint": "Denke daran: Wir beginnen mit dem Sinn des Gebets und lernen die Praxis anschließend Schritt für Schritt."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Allah gedenken“?",
     "options": [
      "Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken.",
      "Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat.",
      "Unser Übungsziel: Ich verstehe, warum das Gebet wichtig ist."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat Ṭā Hā · 20:14.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat Ṭā Hā · 20:14 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Allah gedenken“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich verstehe, warum das Gebet wichtig ist. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat Ṭā Hā · 20:14 und Ṣaḥīḥ al-Buḫārī, Nr. 631; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Allah gedenken“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich verstehe, warum das Gebet wichtig ist. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat Ṭā Hā · 20:14 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken. Sunnah (sinngemäß): Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat. Eigenes Lernbeispiel: Ich verstehe, warum das Gebet wichtig ist.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Im Gebet wenden wir uns Allah zu.",
    "lines": [
     "Wir lernen das Gebet langsam.",
     "Im Gebet gedenken wir Allahs.",
     "Der Prophet ﷺ zeigte uns das Gebet.",
     "Wir üben die Schritte mit Anleitung."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich verstehe, warum das Gebet wichtig ist.",
    "lines": [
     "Wir lernen das Gebet langsam.",
     "Im Gebet gedenken wir Allahs.",
     "Der Prophet ﷺ zeigte uns das Gebet.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Wir üben die Schritte mit Anleitung."
    ],
    "evidence": "Qurʾān: Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Allah gedenken“ zusammenhängen.",
    "lines": [
     "Wir lernen das Gebet langsam.",
     "Der Qurʾān nennt in Sūrat Ṭā Hā · 20:14 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 631.",
     "Anwendung im Alltag: Ich verstehe, warum das Gebet wichtig ist."
    ],
    "evidence": "Sūrat Ṭā Hā · 20:14: Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken. Ṣaḥīḥ al-Buḫārī, Nr. 631: Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "fiqh-salah-gebet-lernen": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Wie lernst du die Gebetsbewegungen?",
     "options": [
      "Ich lasse sie mir zeigen.",
      "Ich denke mir neue Bewegungen aus."
     ],
     "correct": 0,
     "hint": "Das Gebet lernen wir nach der Sunnah.",
     "explain": "Das Gebet lernen wir nach der Sunnah."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Gebet lernen“: Woher lernen wir die Gebetspraxis?",
     "options": [
      "Aus der authentischen Sunnah des Propheten ﷺ.",
      "Wir erfinden die Gebetsschritte selbst."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir beginnen mit dem Sinn des Gebets und lernen die Praxis anschließend Schritt für Schritt.",
     "explain": "Aus der authentischen Sunnah des Propheten ﷺ. Wir beginnen mit dem Sinn des Gebets und lernen die Praxis anschließend Schritt für Schritt."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Gebet lernen“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich übe das Gebet Schritt für Schritt. Wir üben die Bewegungen mit Begleitung.",
     "hint": "Denke daran: Wir beginnen mit dem Sinn des Gebets und lernen die Praxis anschließend Schritt für Schritt."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Gebet lernen“?",
     "options": [
      "Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken.",
      "Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat.",
      "Unser Übungsziel: Ich übe das Gebet Schritt für Schritt."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat Ṭā Hā · 20:14.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat Ṭā Hā · 20:14 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Gebet lernen“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich übe das Gebet Schritt für Schritt. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat Ṭā Hā · 20:14 und Ṣaḥīḥ al-Buḫārī, Nr. 631; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Gebet lernen“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich übe das Gebet Schritt für Schritt. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat Ṭā Hā · 20:14 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken. Sunnah (sinngemäß): Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat. Eigenes Lernbeispiel: Ich übe das Gebet Schritt für Schritt.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Wir lernen das Gebet nach der Sunnah.",
    "lines": [
     "Der Prophet ﷺ zeigte das Gebet.",
     "Wir schauen uns seine Lehre an.",
     "Wir üben die Bewegungen mit Begleitung.",
     "Wenn etwas schwerfällt, üben wir weiter."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich übe das Gebet Schritt für Schritt.",
    "lines": [
     "Der Prophet ﷺ zeigte das Gebet.",
     "Wir schauen uns seine Lehre an.",
     "Wir üben die Bewegungen mit Begleitung.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Wenn etwas schwerfällt, üben wir weiter."
    ],
    "evidence": "Qurʾān: Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Gebet lernen“ zusammenhängen.",
    "lines": [
     "Der Prophet ﷺ zeigte das Gebet.",
     "Der Qurʾān nennt in Sūrat Ṭā Hā · 20:14 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 631.",
     "Anwendung im Alltag: Ich übe das Gebet Schritt für Schritt."
    ],
    "evidence": "Sūrat Ṭā Hā · 20:14: Ich bin Allah, es gibt keinen Gott außer Mir. Diene Mir und verrichte das Gebet zu Meinem Gedenken. Ṣaḥīḥ al-Buḫārī, Nr. 631: Der Prophet ﷺ lehrte, das Gebet so zu verrichten, wie er es vorgezeigt hat. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "aqidah-tawhid-allah-ist-einer": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Was bedeutet Allah ist Einer?",
     "options": [
      "Allah hat keinen Teilhaber.",
      "Viele Götter teilen sich die Anbetung."
     ],
     "correct": 0,
     "hint": "Wir beten Allah allein an.",
     "explain": "Wir beten Allah allein an."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Allah ist Einer“: Wer allein wird angebetet?",
     "options": [
      "Allah allein.",
      "Wir beten beliebige Dinge an."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir lernen, dass nur Allah angebetet wird.",
     "explain": "Allah allein. Wir lernen, dass nur Allah angebetet wird."
    },
    {
     "type": "text",
     "prompt": "Was bedeutet Sūrat al-Iḫlāṣ 112:1? Wie würdest du es einem Freund sagen?",
     "sample": "Allah ist Einer und hat keinen Teilhaber. Das steht sinngemäß in Sūrat al-Iḫlāṣ.",
     "hint": "Ich kann die belegte Aussage wiedergeben, ohne neue Eigenschaften Allahs zu erfinden."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Allah ist Einer“?",
     "options": [
      "Sag: Er ist Allah, der Eine.",
      "Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen.",
      "Unser Übungsziel: Ich lerne, dass nur Allah angebetet wird."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Iḫlāṣ · 112:1.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Iḫlāṣ · 112:1 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Allah ist Einer“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich lerne, dass nur Allah angebetet wird. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Iḫlāṣ · 112:1 und Ṣaḥīḥ al-Buḫārī, Nr. 2856; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Allah ist Einer“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich lerne, dass nur Allah angebetet wird. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Iḫlāṣ · 112:1 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Sag: Er ist Allah, der Eine. Sunnah (sinngemäß): Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen. Eigenes Lernbeispiel: Ich lerne, dass nur Allah angebetet wird.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Sūrat al-Ikhlāṣ lehrt uns, dass Allah Einer ist.",
    "lines": [
     "Allah ist Einer.",
     "Wir beten Allah allein an.",
     "Wir gesellen Ihm nichts bei.",
     "Das nennen wir Tawḥīd."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich lerne, dass nur Allah angebetet wird.",
    "lines": [
     "Allah ist Einer.",
     "Wir beten Allah allein an.",
     "Wir gesellen Ihm nichts bei.",
     "Wir stellen Fragen, prüfen die Belege und erklären das Gelernte in eigenen Worten."
    ],
    "evidence": "Qurʾān: Sag: Er ist Allah, der Eine. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Allah ist Einer“ zusammenhängen.",
    "lines": [
     "Allah ist Einer.",
     "Der Qurʾān nennt in Sūrat al-Iḫlāṣ · 112:1 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 2856.",
     "Unser Lernschritt: Das nennen wir Tawḥīd."
    ],
    "evidence": "Sūrat al-Iḫlāṣ · 112:1: Sag: Er ist Allah, der Eine. Ṣaḥīḥ al-Buḫārī, Nr. 2856: Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "aqidah-tawhid-nur-allah-anbeten": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "An wen richten wir die Anbetung?",
     "options": [
      "An Allah allein.",
      "An Allah und die Sterne."
     ],
     "correct": 0,
     "hint": "ʿIbādah gilt Allah allein.",
     "explain": "ʿIbādah gilt Allah allein."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Nur Allah anbeten“: Wem gilt unsere Anbetung?",
     "options": [
      "Allah allein.",
      "Einem geschaffenen Gegenstand."
     ],
     "correct": 0,
     "hint": "Denke daran: Wir lernen, dass nur Allah angebetet wird.",
     "explain": "Allah allein. Wir lernen, dass nur Allah angebetet wird."
    },
    {
     "type": "text",
     "prompt": "Nenne eine Form der Anbetung. Wem allein gehört sie?",
     "sample": "Ein Bittgebet als Anbetung richtet sich an Allah allein.",
     "hint": "Andere Menschen darf ich um praktische Hilfe bei alltäglichen Dingen bitten."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Nur Allah anbeten“?",
     "options": [
      "Sag: Er ist Allah, der Eine.",
      "Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen.",
      "Unser Übungsziel: Ich erkenne die Bedeutung des Tawḥīd im Gebet."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Iḫlāṣ · 112:1.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Iḫlāṣ · 112:1 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Nur Allah anbeten“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich erkenne die Bedeutung des Tawḥīd im Gebet. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Iḫlāṣ · 112:1 und Ṣaḥīḥ al-Buḫārī, Nr. 2856; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Nur Allah anbeten“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich erkenne die Bedeutung des Tawḥīd im Gebet. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Iḫlāṣ · 112:1 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Sag: Er ist Allah, der Eine. Sunnah (sinngemäß): Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen. Eigenes Lernbeispiel: Ich erkenne die Bedeutung des Tawḥīd im Gebet.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Die Anbetung gehört Allah allein.",
    "lines": [
     "Wir wenden uns im Gebet an Allah.",
     "Niemand hat das Recht, neben Ihm angebetet zu werden.",
     "Der Prophet ﷺ lehrte uns Allahs Recht.",
     "Wir lernen Tawḥīd mit Qurʾān und Sunnah."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich erkenne die Bedeutung des Tawḥīd im Gebet.",
    "lines": [
     "Wir wenden uns im Gebet an Allah.",
     "Niemand hat das Recht, neben Ihm angebetet zu werden.",
     "Der Prophet ﷺ lehrte uns Allahs Recht.",
     "Wir stellen Fragen, prüfen die Belege und erklären das Gelernte in eigenen Worten."
    ],
    "evidence": "Qurʾān: Sag: Er ist Allah, der Eine. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Nur Allah anbeten“ zusammenhängen.",
    "lines": [
     "Wir wenden uns im Gebet an Allah.",
     "Der Qurʾān nennt in Sūrat al-Iḫlāṣ · 112:1 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 2856.",
     "Unser Lernschritt: Wir lernen Tawḥīd mit Qurʾān und Sunnah."
    ],
    "evidence": "Sūrat al-Iḫlāṣ · 112:1: Sag: Er ist Allah, der Eine. Ṣaḥīḥ al-Buḫārī, Nr. 2856: Der Prophet ﷺ erklärte, dass Allahs Recht darin besteht, Ihn allein anzubeten und Ihm nichts beizugesellen. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "aqidah-iman-die-engel": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Gehört der Glaube an Engel zum Īmān?",
     "options": [
      "Ja, das gehört dazu.",
      "Nein, wir glauben nur, was wir sehen."
     ],
     "correct": 0,
     "hint": "Wir glauben an das im Qurʾān und der Sunnah Berichtete.",
     "explain": "Wir glauben an das im Qurʾān und der Sunnah Berichtete."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Die Engel“: Was gehört zu den Grundlagen des Īmān?",
     "options": [
      "Der Glaube an die Engel.",
      "Der Glaube nur an Spielzeug."
     ],
     "correct": 0,
     "hint": "Denke daran: Der Glaube umfasst die im Qurʾān und in der Sunnah genannten Grundlagen.",
     "explain": "Der Glaube an die Engel. Der Glaube umfasst die im Qurʾān und in der Sunnah genannten Grundlagen."
    },
    {
     "type": "text",
     "prompt": "Warum glauben Muslime an Engel, obwohl wir sie nicht sehen?",
     "sample": "Qurʾān und die authentische Sunnah berichten uns von Engeln. Wir glauben daran, ohne ihr Aussehen zu erfinden.",
     "hint": "Wir sprechen nur über das Verborgene, soweit es uns offenbart wurde."
    },
    {
     "type": "choice",
     "prompt": "Welche Quelle in dieser Lektion nennt Engel ausdrücklich?",
     "options": [
      "Den Ḥadīṯ Ǧibrīl in Ṣaḥīḥ Muslim 8a.",
      "Den hier gezeigten Vers 2:3."
     ],
     "correct": 0,
     "hint": "Welche Worte stehen wirklich im gezeigten Vers 2:3? Vergleiche mit Muslim 8a.",
     "explain": "Der Qurʾān-Vers 2:3 spricht vom Verborgenen. Der Ḥadīṯ Ǧibrīl nennt den Glauben an Engel ausdrücklich."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Die Engel“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich kann die Engel als einen Bestandteil des Īmān nennen. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Baqarah · 2:3 und Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl); das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Die Engel“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich kann die Engel als einen Bestandteil des Īmān nennen. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Baqarah · 2:3 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Diejenigen, die an das Verborgene glauben, das Gebet verrichten und von dem geben, womit Wir sie versorgt haben. Sunnah (sinngemäß): Der Prophet ﷺ erklärte die Grundlagen des Īmān: Allah, Seine Engel, Bücher, Gesandten, den Jüngsten Tag und die Vorherbestimmung. Eigenes Lernbeispiel: Ich kann die Engel als einen Bestandteil des Īmān nennen.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Der Prophet ﷺ nannte den Glauben an die Engel.",
    "lines": [
     "Īmān bedeutet Glaube.",
     "Der Prophet ﷺ erklärte seine Grundlagen.",
     "Dazu gehört der Glaube an Allahs Engel.",
     "Wir lernen die Grundlagen Schritt für Schritt."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich kann die Engel als einen Bestandteil des Īmān nennen.",
    "lines": [
     "Īmān bedeutet Glaube.",
     "Der Prophet ﷺ erklärte seine Grundlagen.",
     "Dazu gehört der Glaube an Allahs Engel.",
     "Wir stellen Fragen, prüfen die Belege und erklären das Gelernte in eigenen Worten."
    ],
    "evidence": "Qurʾān: Diejenigen, die an das Verborgene glauben, das Gebet verrichten und von dem geben, womit Wir sie versorgt haben. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte die Grundlagen des Īmān: Allah, Seine Engel, Bücher, Gesandten, den Jüngsten Tag und die Vorherbestimmung."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Die Engel“ zusammenhängen.",
    "lines": [
     "Īmān bedeutet Glaube.",
     "Der Qurʾān nennt in Sūrat al-Baqarah · 2:3 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl).",
     "Unser Lernschritt: Wir lernen die Grundlagen Schritt für Schritt."
    ],
    "evidence": "Sūrat al-Baqarah · 2:3: Diejenigen, die an das Verborgene glauben, das Gebet verrichten und von dem geben, womit Wir sie versorgt haben. Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl): Der Prophet ﷺ erklärte die Grundlagen des Īmān: Allah, Seine Engel, Bücher, Gesandten, den Jüngsten Tag und die Vorherbestimmung. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "aqidah-iman-die-gesandten": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "An wen glauben Muslime auch?",
     "options": [
      "An Allahs Gesandte.",
      "Nur an Menschen, die heute leben."
     ],
     "correct": 0,
     "hint": "Die Gesandten gehören zum Īmān.",
     "explain": "Die Gesandten gehören zum Īmān."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Die Gesandten“: Was gehört zum Īmān?",
     "options": [
      "Der Glaube an Allahs Gesandte.",
      "Nur die eigenen Wünsche entscheiden."
     ],
     "correct": 0,
     "hint": "Denke daran: Der Glaube umfasst die im Qurʾān und in der Sunnah genannten Grundlagen.",
     "explain": "Der Glaube an Allahs Gesandte. Der Glaube umfasst die im Qurʾān und in der Sunnah genannten Grundlagen."
    },
    {
     "type": "text",
     "prompt": "Wie weißt du, dass der Glaube an Allahs Gesandte zum Īmān gehört?",
     "sample": "Das erklärt der Prophet ﷺ im Ḥadīṯ Ǧibrīl. Wir glauben an Allahs Gesandte.",
     "hint": "Wir folgen den überlieferten Grundlagen und erfinden keine neuen Gesandten."
    },
    {
     "type": "choice",
     "prompt": "Welche Quelle nennt hier die Gesandten ausdrücklich als Glaubensgrundlage?",
     "options": [
      "Den Ḥadīṯ Ǧibrīl in Ṣaḥīḥ Muslim 8a.",
      "Den hier gezeigten Vers 2:3."
     ],
     "correct": 0,
     "hint": "Welche Worte stehen wirklich im gezeigten Vers 2:3? Vergleiche mit Muslim 8a.",
     "explain": "Der Vers 2:3 beschreibt Glaubende. Der Ḥadīṯ Ǧibrīl nennt die Gesandten ausdrücklich."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Die Gesandten“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich kenne einen weiteren Bestandteil des Īmān. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat al-Baqarah · 2:3 und Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl); das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Die Gesandten“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich kenne einen weiteren Bestandteil des Īmān. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat al-Baqarah · 2:3 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Diejenigen, die an das Verborgene glauben, das Gebet verrichten und von dem geben, womit Wir sie versorgt haben. Sunnah (sinngemäß): Der Prophet ﷺ erklärte die Grundlagen des Īmān: Allah, Seine Engel, Bücher, Gesandten, den Jüngsten Tag und die Vorherbestimmung. Eigenes Lernbeispiel: Ich kenne einen weiteren Bestandteil des Īmān.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Zum Īmān gehört der Glaube an Allahs Gesandte.",
    "lines": [
     "Allah sandte Gesandte.",
     "Der Glaube an sie gehört zum Īmān.",
     "Wir hören auf die Botschaft des Propheten ﷺ.",
     "Dabei lernen wir aus Qurʾān und Sunnah."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich kenne einen weiteren Bestandteil des Īmān.",
    "lines": [
     "Allah sandte Gesandte.",
     "Der Glaube an sie gehört zum Īmān.",
     "Wir hören auf die Botschaft des Propheten ﷺ.",
     "Wir stellen Fragen, prüfen die Belege und erklären das Gelernte in eigenen Worten."
    ],
    "evidence": "Qurʾān: Diejenigen, die an das Verborgene glauben, das Gebet verrichten und von dem geben, womit Wir sie versorgt haben. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ erklärte die Grundlagen des Īmān: Allah, Seine Engel, Bücher, Gesandten, den Jüngsten Tag und die Vorherbestimmung."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Die Gesandten“ zusammenhängen.",
    "lines": [
     "Allah sandte Gesandte.",
     "Der Qurʾān nennt in Sūrat al-Baqarah · 2:3 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl).",
     "Unser Lernschritt: Dabei lernen wir aus Qurʾān und Sunnah."
    ],
    "evidence": "Sūrat al-Baqarah · 2:3: Diejenigen, die an das Verborgene glauben, das Gebet verrichten und von dem geben, womit Wir sie versorgt haben. Ṣaḥīḥ Muslim, Nr. 8a (Ḥadīṯ Ǧibrīl): Der Prophet ﷺ erklärte die Grundlagen des Īmān: Allah, Seine Engel, Bücher, Gesandten, den Jüngsten Tag und die Vorherbestimmung. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "aqidah-ikhlas-gutes-ohne-lob": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du hast geholfen. Niemand hat es gesehen. Und jetzt?",
     "options": [
      "Ich freue mich, dass ich helfen konnte.",
      "Dann war die Hilfe umsonst."
     ],
     "correct": 0,
     "hint": "Gute Taten brauchen keinen Applaus.",
     "explain": "Gute Taten brauchen keinen Applaus."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Gutes ohne Lob“: Du hilfst beim Aufräumen und niemand sieht es. Was machst du?",
     "options": [
      "Ich helfe trotzdem mit guter Absicht.",
      "Ich helfe nur, wenn ich gelobt werde."
     ],
     "correct": 0,
     "hint": "Denke daran: Gute Taten sollen nicht nur zum Angeben getan werden.",
     "explain": "Ich helfe trotzdem mit guter Absicht. Gute Taten sollen nicht nur zum Angeben getan werden."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Gutes ohne Lob“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich helfe mit guter Absicht. Allah kennt meine Absicht.",
     "hint": "Denke daran: Gute Taten sollen nicht nur zum Angeben getan werden."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Gutes ohne Lob“?",
     "options": [
      "Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein.",
      "Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden.",
      "Unser Übungsziel: Ich helfe mit guter Absicht."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat az-Zumar · 39:11.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat az-Zumar · 39:11 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Gutes ohne Lob“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich helfe mit guter Absicht. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat az-Zumar · 39:11 und Ṣaḥīḥ al-Buḫārī, Nr. 1; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Gutes ohne Lob“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich helfe mit guter Absicht. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat az-Zumar · 39:11 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein. Sunnah (sinngemäß): Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden. Eigenes Lernbeispiel: Ich helfe mit guter Absicht.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Gute Taten sollen nicht nur dem Lob anderer dienen.",
    "lines": [
     "Jemand braucht vielleicht Hilfe.",
     "Ich helfe nicht nur, damit alle mich loben.",
     "Allah kennt meine Absicht.",
     "Ich bemühe mich um Aufrichtigkeit."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich helfe mit guter Absicht.",
    "lines": [
     "Jemand braucht vielleicht Hilfe.",
     "Ich helfe nicht nur, damit alle mich loben.",
     "Allah kennt meine Absicht.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Ich bemühe mich um Aufrichtigkeit."
    ],
    "evidence": "Qurʾān: Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Gutes ohne Lob“ zusammenhängen.",
    "lines": [
     "Jemand braucht vielleicht Hilfe.",
     "Der Qurʾān nennt in Sūrat az-Zumar · 39:11 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 1.",
     "Anwendung im Alltag: Ich helfe mit guter Absicht."
    ],
    "evidence": "Sūrat az-Zumar · 39:11: Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein. Ṣaḥīḥ al-Buḫārī, Nr. 1: Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "aqidah-ikhlas-gute-absichten": {
  "questionPatches": {
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du willst jemandem helfen. Woran denkst du?",
     "options": [
      "Ich möchte Gutes für Allah tun.",
      "Alle müssen mir dafür danken."
     ],
     "correct": 0,
     "hint": "Eine gute Absicht ist wichtig.",
     "explain": "Eine gute Absicht ist wichtig."
    }
   ],
   "6-8": [
    {
     "type": "choice",
     "prompt": "Zum Thema „Gute Absichten“: Du möchtest etwas Gutes tun. Was machst du?",
     "options": [
      "Ich bemühe mich um eine aufrichtige Absicht.",
      "Ich tue es nur, um damit anzugeben."
     ],
     "correct": 0,
     "hint": "Denke daran: Gute Taten sollen nicht nur zum Angeben getan werden.",
     "explain": "Ich bemühe mich um eine aufrichtige Absicht. Gute Taten sollen nicht nur zum Angeben getan werden."
    },
    {
     "type": "text",
     "prompt": "Wie kannst du „Gute Absichten“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich denke darüber nach, warum ich Gutes tue. Ich möchte Allah aufrichtig dienen.",
     "hint": "Denke daran: Gute Taten sollen nicht nur zum Angeben getan werden."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Gute Absichten“?",
     "options": [
      "Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein.",
      "Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden.",
      "Unser Übungsziel: Ich denke darüber nach, warum ich Gutes tue."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat az-Zumar · 39:11.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat az-Zumar · 39:11 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    {
     "type": "choice",
     "prompt": "Welche Aussage trennt bei „Gute Absichten“ die Quelle von unserem Beispiel?",
     "options": [
      "Unser Ziel ist: Ich denke darüber nach, warum ich Gutes tue. Das Alltagsbeispiel ist eine Übung, kein wörtliches Qurʾān-Zitat.",
      "Jede konkrete Übung im Unterricht ist als eigenes Gebot im Qurʾān wortwörtlich erwähnt.",
      "Die überlieferte Sunnah braucht man beim Lernen dieses Themas nicht zu beachten."
     ],
     "correct": 0,
     "hint": "Unterscheide religiösen Beleg, deutsche Erklärung und Unterrichtsbeispiel.",
     "explain": "Die Quellen stehen gesondert bei Sūrat az-Zumar · 39:11 und Ṣaḥīḥ al-Buḫārī, Nr. 1; das Lernziel ist eine pädagogische Anwendung."
    },
    {
     "type": "text",
     "prompt": "Wie erklärst du „Gute Absichten“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich denke darüber nach, warum ich Gutes tue. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    },
    {
     "type": "text",
     "prompt": "Was lehren Sūrat az-Zumar · 39:11 und die genannte Sunnah? Was ist unser eigenes Beispiel?",
     "sample": "Qurʾān-Bedeutung: Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein. Sunnah (sinngemäß): Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden. Eigenes Lernbeispiel: Ich denke darüber nach, warum ich Gutes tue.",
     "hint": "Fasse die beiden Quellen getrennt zusammen; eine Alltagsübung ist kein eigenes Prophetenzitat."
    }
   ]
  },
  "ageText": {
   "4-5": {
    "intro": "Die Absicht gehört zu unseren guten Taten.",
    "lines": [
     "Vor einer guten Tat kann ich nachdenken.",
     "Warum möchte ich das tun?",
     "Ich möchte Allah aufrichtig dienen.",
     "Ich muss nicht mit meinen Taten angeben."
    ],
    "evidence": "Wir hören den Qurʾān und lernen aus der Sunnah. Unsere Übung ist ein Beispiel für den Alltag."
   },
   "6-8": {
    "intro": "Heute verstehen wir: Ich denke darüber nach, warum ich Gutes tue.",
    "lines": [
     "Vor einer guten Tat kann ich nachdenken.",
     "Warum möchte ich das tun?",
     "Ich möchte Allah aufrichtig dienen.",
     "Wir üben das Thema mit einer passenden Alltagssituation: Ich muss nicht mit meinen Taten angeben."
    ],
    "evidence": "Qurʾān: Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein. Die Sunnah lehrt sinngemäß: Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden."
   },
   "9-10": {
    "intro": "Wir prüfen, wie Qurʾān, Sunnah und unsere eigene Alltagsübung bei „Gute Absichten“ zusammenhängen.",
    "lines": [
     "Vor einer guten Tat kann ich nachdenken.",
     "Der Qurʾān nennt in Sūrat az-Zumar · 39:11 eine Grundlage des Themas.",
     "Die genannte authentische Überlieferung stammt aus Ṣaḥīḥ al-Buḫārī, Nr. 1.",
     "Anwendung im Alltag: Ich denke darüber nach, warum ich Gutes tue."
    ],
    "evidence": "Sūrat az-Zumar · 39:11: Sag: Mir wurde befohlen, Allah zu dienen und Ihm gegenüber aufrichtig im Glauben zu sein. Ṣaḥīḥ al-Buḫārī, Nr. 1: Der Prophet ﷺ lehrte, dass Taten nach ihren Absichten beurteilt werden. Wir kennzeichnen unseren Unterrichtsalltag ausdrücklich als eigenes Beispiel."
   }
  }
 },
 "adab-essen-bismillah": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Essen mit Bismillāh“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich sage Bismillāh und esse achtsam. Ich esse mit meiner rechten Hand und nehme von meiner Seite.",
     "hint": "Der Prophet ﷺ erklärte die Tischsitten freundlich einem Kind."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Essen mit Bismillāh“?",
     "options": [
      "Esst und trinkt, aber seid nicht maßlos.",
      "Der Prophet ﷺ lehrte den jungen ʿUmar ibn Abī Salamah: Nenne Allahs Namen, iss mit deiner rechten Hand und iss von dem, was vor dir liegt.",
      "Unser Übungsziel: Ich sage Bismillāh, esse mit der rechten Hand und nehme von meiner Seite."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Aʿrāf · 7:31.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Aʿrāf · 7:31 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Essen mit Bismillāh“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich sage Bismillāh und esse achtsam. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du fängst an zu essen. Was sagst du?",
     "options": [
      "Bismillāh.",
      "Ich sage lieber gar nichts."
     ],
     "correct": 0,
     "hint": "Bismillāh gehört zur Sunnah beim Essen.",
     "explain": "Bismillāh gehört zur Sunnah beim Essen."
    }
   ]
  }
 },
 "akhlaq-tiere-barmherzigkeit": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Barmherzig zu Tieren“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich tue Tieren nicht weh und bitte bei einem hilfsbedürftigen Tier um Hilfe. Ich erschrecke oder verletze Tiere nicht.",
     "hint": "Bei fremden oder verletzten Tieren holen Kinder zuerst Erwachsene zu Hilfe."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Barmherzig zu Tieren“?",
     "options": [
      "Auch die Tiere auf der Erde und die Vögel sind Gemeinschaften wie ihr.",
      "Der Prophet ﷺ berichtete von einem Mann, der einem durstigen Hund Wasser gab, und erklärte, dass es für Güte gegenüber Lebewesen Lohn gibt.",
      "Unser Übungsziel: Ich gehe achtsam mit Tieren um und hole bei Bedarf Erwachsene dazu."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Anʿām · 6:38.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Anʿām · 6:38 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Barmherzig zu Tieren“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich tue Tieren nicht weh und bitte bei einem hilfsbedürftigen Tier um Hilfe. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du siehst einen fremden Hund. Was ist sicher?",
     "options": [
      "Abstand halten und einen Erwachsenen fragen.",
      "Sofort hinrennen und streicheln."
     ],
     "correct": 0,
     "hint": "Tieren helfen wir vorsichtig.",
     "explain": "Tieren helfen wir vorsichtig."
    }
   ]
  }
 },
 "adab-nachbarn-gutes": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Gute Nachbarschaft“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich grüße höflich und nehme Rücksicht auf andere im Haus. Wir sprechen höflich und vermeiden absichtliche Störungen.",
     "hint": "Freundlichkeit heißt nicht, dass Kinder die Tür öffnen oder Fremde allein besuchen sollen."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Gute Nachbarschaft“?",
     "options": [
      "Und seid gut zu nahen und ferneren Nachbarn.",
      "Der Prophet ﷺ sagte, dass Ǧibrīl ihm die gute Behandlung des Nachbarn so oft ans Herz legte, dass er annahm, der Nachbar könne erbberechtigt werden.",
      "Unser Übungsziel: Ich nehme Rücksicht und helfe, wenn es sicher und möglich ist."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat an-Nisāʾ · 4:36.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat an-Nisāʾ · 4:36 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Gute Nachbarschaft“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich grüße höflich und nehme Rücksicht auf andere im Haus. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Ein Nachbar braucht Ruhe. Was machst du?",
     "options": [
      "Ich spreche leiser.",
      "Ich rede absichtlich lauter."
     ],
     "correct": 0,
     "hint": "Wir nehmen Rücksicht auf Nachbarn.",
     "explain": "Wir nehmen Rücksicht auf Nachbarn."
    }
   ]
  }
 },
 "aqidah-dua-allah-bitten": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Allah um Hilfe bitten“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich bitte Allah im Duʿāʾ und darf Menschen um praktische Hilfe bitten. Menschen dürfen wir um alltägliche Hilfe bitten, zum Beispiel beim Lernen.",
     "hint": "Menschen um alltägliche Hilfe zu bitten ist etwas anderes als das Bittgebet als Anbetung an Allah."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Allah um Hilfe bitten“?",
     "options": [
      "Dir allein dienen wir, und Dich allein bitten wir um Hilfe.",
      "Der Prophet ﷺ lehrte, beim Bittgebet nicht ungeduldig zu werden und nicht vorschnell zu sagen, man habe gebetet, aber keine Antwort erhalten.",
      "Unser Übungsziel: Ich weiß: Duʿāʾ richten wir an Allah und bleiben geduldig."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Fātiḥah · 1:5.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Fātiḥah · 1:5 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Allah um Hilfe bitten“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich bitte Allah im Duʿāʾ und darf Menschen um praktische Hilfe bitten. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du brauchst Hilfe beim Schuheanziehen. Was darfst du tun?",
     "options": [
      "Allah bitten und einen Erwachsenen fragen.",
      "Nur beten und niemanden fragen."
     ],
     "correct": 0,
     "hint": "Duʿāʾ und praktische Hilfe schließen sich nicht aus.",
     "explain": "Duʿāʾ und praktische Hilfe schließen sich nicht aus."
    }
   ]
  }
 },
 "aqidah-tawhid-recht-allahs": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Was ist Allahs Recht auf die Menschen laut dem Ḥadīṯ von Muʿāḏ?",
     "sample": "Dass sie Allah allein anbeten und Ihm nichts beigesellen.",
     "hint": "Praktische Hilfe bei Menschen zu suchen ist nicht dasselbe wie Anbetung."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Allah allein anbeten“?",
     "options": [
      "Ich habe die Ǧinn und die Menschen nur erschaffen, damit sie Mir dienen.",
      "Der Prophet ﷺ erklärte Muʿāḏ ibn Ǧabal, dass Allahs Recht gegenüber den Menschen darin besteht, dass sie Ihn anbeten und Ihm nichts beigesellen.",
      "Unser Übungsziel: Ich lerne, dass wir Allah allein anbeten."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat aḏ-Ḏāriyāt · 51:56.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat aḏ-Ḏāriyāt · 51:56 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Allah allein anbeten“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich richte mein Bittgebet an Allah und kann Menschen um praktische Hilfe bitten. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du brauchst ein Glas Wasser. Wen kannst du fragen?",
     "options": [
      "Einen Erwachsenen, der dir helfen kann.",
      "Niemanden: Nur Duʿāʾ ist erlaubt."
     ],
     "correct": 0,
     "hint": "Praktische Hilfe von Menschen ist erlaubt.",
     "explain": "Praktische Hilfe von Menschen ist erlaubt."
    }
   ]
  }
 },
 "aqidah-iman-sechs-grundlagen": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Welche zwei Glaubensgrundlagen nennt der Ḥadīṯ Ǧibrīl zusätzlich zum angeführten Versauszug?",
     "sample": "Den Jüngsten Tag und Allahs Vorherbestimmung.",
     "hint": "Der Versauszug 2:285 nennt vier Grundlagen; Muslim 8 erläutert alle sechs."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Die sechs Glaubenssäulen“?",
     "options": [
      "Alle glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten.",
      "Im Ḥadīṯ Ǧibrīl erläuterte der Prophet ﷺ die sechs Grundlagen des Īmān: Allah, Engel, Bücher, Gesandte, Jüngster Tag und Allahs Bestimmung.",
      "Unser Übungsziel: Ich lerne die sechs Glaubensgrundlagen in meinem Tempo."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Baqarah · 2:285.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Baqarah · 2:285 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Die sechs Glaubenssäulen“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich kann die Glaubensgrundlagen nach und nach nennen. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Was gehört zum Īmān?",
     "options": [
      "Der Glaube an Engel.",
      "Nur das Lernen der Gebetsbewegungen."
     ],
     "correct": 0,
     "hint": "Der Prophet ﷺ erklärte die Glaubensgrundlagen.",
     "explain": "Der Prophet ﷺ erklärte die Glaubensgrundlagen."
    }
   ]
  }
 },
 "aqidah-ikhlas-warum-gutes-tun": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Gutes mit richtiger Absicht“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich helfe, weil ich Gutes für Allah tun möchte, nicht nur für Applaus. Wenn ich gelobt werde, darf ich mich bedanken und bescheiden bleiben.",
     "hint": "Niyyah heißt Absicht. Ikhlāṣ heißt Aufrichtigkeit."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Gutes mit richtiger Absicht“?",
     "options": [
      "Ihnen wurde aufgetragen, Allah zu dienen und Ihm gegenüber aufrichtig zu sein.",
      "Der Prophet ﷺ erklärte, dass der Wert einer Handlung mit der Absicht zusammenhängt, mit der sie ausgeführt wird.",
      "Unser Übungsziel: Ich übe eine gute Absicht, ohne auf Lob zu warten."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Bayyinah · 98:5.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Bayyinah · 98:5 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Gutes mit richtiger Absicht“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich helfe, weil ich Gutes für Allah tun möchte, nicht nur für Applaus. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du hilfst, und niemand lobt dich. Was machst du?",
     "options": [
      "Ich kann trotzdem Gutes tun.",
      "Dann zählt meine Tat gar nicht."
     ],
     "correct": 0,
     "hint": "Die Absicht ist wichtig.",
     "explain": "Die Absicht ist wichtig."
    }
   ]
  }
 },
 "akhlaq-wut-ruhig-bleiben": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Stark sein bei Wut“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich sage, dass ich wütend bin, und bitte bei Bedarf um Hilfe. Stärke bedeutet nicht, bei jedem Streit zu gewinnen.",
     "hint": "Gefühle darfst du sagen. Niemand muss sich verletzen lassen."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Stark sein bei Wut“?",
     "options": [
      "Diejenigen, die ihren Zorn zurückhalten und den Menschen vergeben.",
      "Der Prophet ﷺ erklärte, dass wahre Stärke nicht darin besteht, andere zu besiegen, sondern sich bei Wut zu beherrschen.",
      "Unser Übungsziel: Ich lerne, wütend sein zu dürfen und trotzdem niemanden zu verletzen."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat Āl ʿImrān · 3:134.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat Āl ʿImrān · 3:134 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Stark sein bei Wut“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich sage, dass ich wütend bin, und bitte bei Bedarf um Hilfe. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du bist sehr ärgerlich. Was hilft?",
     "options": [
      "Eine Pause und bei Bedarf Hilfe holen.",
      "Sofort zurückschubsen."
     ],
     "correct": 0,
     "hint": "Man darf wütend sein, aber niemanden verletzen.",
     "explain": "Man darf wütend sein, aber niemanden verletzen."
    }
   ]
  }
 },
 "adab-erlaubnis-anklopfen": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Erst um Erlaubnis bitten“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich klopfe an und frage, ob ich eintreten darf. Ich respektiere es, wenn jemand gerade nicht öffnen möchte.",
     "hint": "Nur bei Personen, zu denen du gehen darfst, anklopfen. Fremde Türen öffnest du nicht selbst."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Erst um Erlaubnis bitten“?",
     "options": [
      "Betretet keine fremden Häuser, bevor ihr um Erlaubnis gebeten und ihre Bewohner begrüßt habt.",
      "Der Prophet ﷺ lehrte, beim Eintritt um Erlaubnis zu bitten und nach höchstens drei erfolglosen Bitten wieder zu gehen.",
      "Unser Übungsziel: Ich frage vor dem Eintreten und respektiere ein Nein."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat an-Nūr · 24:27.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat an-Nūr · 24:27 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Erst um Erlaubnis bitten“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich klopfe an und frage, ob ich eintreten darf. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Eine Zimmertür ist geschlossen. Was machst du?",
     "options": [
      "Ich klopfe an und warte.",
      "Ich öffne ohne zu fragen."
     ],
     "correct": 0,
     "hint": "Wir achten auf Privatsphäre.",
     "explain": "Wir achten auf Privatsphäre."
    }
   ]
  }
 },
 "akhlaq-tarbiyah-sanft-lernen": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Tarbiyah – freundlich lernen“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich lerne Schritt für Schritt und frage, wenn ich ein Wort nicht verstehe. Eine gute Lehrperson erklärt klar und freundlich.",
     "hint": "Du darfst fragen und Pausen machen. Lernen soll verständlich sein."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Tarbiyah – freundlich lernen“?",
     "options": [
      "Fordere deine Familie zum Gebet auf und bleibe dabei geduldig und beständig.",
      "Der Prophet ﷺ lehrte, Dinge zu erleichtern statt sie unnötig schwer zu machen, und Menschen zu ermutigen statt abzuschrecken.",
      "Unser Übungsziel: Ich kann in kleinen Schritten üben und bei Bedarf Hilfe erbitten."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat Ṭāhā · 20:132.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat Ṭāhā · 20:132 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Tarbiyah – freundlich lernen“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich lerne Schritt für Schritt und frage, wenn ich ein Wort nicht verstehe. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Ein neues Wort ist schwer. Was kannst du sagen?",
     "options": [
      "Kannst du es mir erklären?",
      "Ich muss so tun, als wüsste ich es."
     ],
     "correct": 0,
     "hint": "Fragen ist beim Lernen erlaubt.",
     "explain": "Fragen ist beim Lernen erlaubt."
    }
   ]
  }
 },
 "akhlaq-nafs-gutes-herz": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Tazkiyah – gute innere Haltung“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich denke über mein Verhalten nach und versuche eine kleine gute Tat. Wenn ich einen Fehler mache, kann ich ihn ehrlich zugeben und verbessern.",
     "hint": "Du bist mehr als dein Aussehen. Gute Gedanken und Taten sind wichtig."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Tazkiyah – gute innere Haltung“?",
     "options": [
      "Erfolg hat gewiss, wer seine Seele läutert.",
      "Der Prophet ﷺ erklärte, dass nicht Aussehen und Besitz das Entscheidende sind, sondern Herzen und Taten.",
      "Unser Übungsziel: Ich kann mein Verhalten betrachten und einen guten Schritt zur Besserung wählen."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat aš-Šams · 91:9.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat aš-Šams · 91:9 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "9-10": [
    null,
    null,
    {
     "type": "text",
     "prompt": "Wie erklärst du „Tazkiyah – gute innere Haltung“ einem jüngeren Kind? Gib ein Beispiel und stelle ihm eine Frage.",
     "sample": "Ich denke über mein Verhalten nach und versuche eine kleine gute Tat. Ich frage danach: Kannst du mir ein eigenes gutes Beispiel nennen?",
     "hint": "Verwende eigene Worte. Sprich freundlich, ohne Angst oder Druck zu erzeugen."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du hast einen Freund traurig gemacht. Was hilft?",
     "options": [
      "Entschuldigen und es besser versuchen.",
      "Sagen, dass er sich nicht traurig fühlen darf."
     ],
     "correct": 0,
     "hint": "Wir können gute Taten lernen.",
     "explain": "Wir können gute Taten lernen."
    }
   ]
  }
 },
 "fiqh-reinheit-unterscheiden": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Reinheit und Sauberkeit“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich halte mich sauber und lerne die Gebetswaschung. In Qurʾān 5:6 werden Gesicht und Arme genannt.",
     "hint": "Händewaschen nach dem Spielen ist gut. Wuḍūʾ ist die besondere Waschung vor dem Gebet."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Reinheit und Sauberkeit“?",
     "options": [
      "Wenn ihr zum Gebet aufsteht, wascht eure Gesichter und Hände bis zu den Ellenbogen. (Auszug)",
      "Der Prophet ﷺ betonte die große Bedeutung der rituellen Reinheit für den Glauben.",
      "Unser Übungsziel: Ich unterscheide gewöhnliche Sauberkeit von der Gebetswaschung."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Māʾidah · 5:6.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Māʾidah · 5:6 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du hast deine Hände gewaschen. Ist das schon immer Wuḍūʾ?",
     "options": [
      "Nein, Wuḍūʾ hat eigene Schritte.",
      "Ja, jede Handwäsche ist Wuḍūʾ."
     ],
     "correct": 0,
     "hint": "Normales Waschen und Wuḍūʾ unterscheiden sich.",
     "explain": "Normales Waschen und Wuḍūʾ unterscheiden sich."
    }
   ]
  }
 },
 "aqidah-quran-allahs-wort": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie unterscheidest du einen arabischen Qurʾān-Vers von seiner deutschen Bedeutungsübersetzung?",
     "sample": "Der arabische Qurʾān ist der Offenbarungstext; die deutsche Übersetzung erklärt seine Bedeutung.",
     "hint": "Eine deutsche Bedeutung darf nicht als arabische Qurʾān-Rezitation ausgegeben werden."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Der Qurʾān – Allahs Wort“?",
     "options": [
      "Dies ist das Buch, an dem kein Zweifel besteht: eine Rechtleitung für die Gottesfürchtigen.",
      "Der Prophet ﷺ lehrte den besonderen Wert dessen, der den Qurʾān lernt und ihn weiterlehrt.",
      "Unser Übungsziel: Ich lerne den Qurʾān mit Respekt und übe in Ruhe."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Baqarah · 2:2.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Baqarah · 2:2 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du hörst einen Qurʾān-Vers. Was kannst du tun?",
     "options": [
      "Aufmerksam zuhören.",
      "Sofort etwas anderes darüber rufen."
     ],
     "correct": 0,
     "hint": "Wir begegnen dem Qurʾān mit Respekt.",
     "explain": "Wir begegnen dem Qurʾān mit Respekt."
    }
   ]
  }
 },
 "aqidah-sirah-adam-erschoepfung": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Ein Freund erzählt etwas Unbekanntes über Ādam. Wie kannst du es prüfen?",
     "sample": "Ich frage, ob es im Qurʾān oder in der authentischen Sunnah steht, und bitte um die Quelle.",
     "hint": "Wir erzählen über Propheten keine ausgedachten Einzelheiten."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Ādam عليه السلام kennenlernen“?",
     "options": [
      "Bei Allah ist das Beispiel von ʿĪsā wie das von Ādam. Er erschuf ihn aus Erde, dann sagte Er zu ihm: Sei!, und er war.",
      "Der Prophet ﷺ berichtete, dass Allah Ādam erschuf und ihn lehrte, die Engel mit dem Friedensgruß zu begrüßen.",
      "Unser Übungsziel: Ich weiß, dass Allah Ādam erschuf; wir erfinden keine Einzelheiten über ihn."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat Āl ʿImrān · 3:59.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat Āl ʿImrān · 3:59 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du hörst eine Geschichte über Ādam. Was darfst du fragen?",
     "options": [
      "Steht das im Qurʾān oder in der Sunnah?",
      "Darf ich mir neue Ereignisse ausdenken?"
     ],
     "correct": 0,
     "hint": "Wir erfinden keine Propheten-Geschichten.",
     "explain": "Wir erfinden keine Propheten-Geschichten."
    }
   ]
  }
 },
 "adab-morgen-dhikr": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Morgens Allah gedenken“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich gedenke Allahs ohne Eile und lerne die Bedeutung von Subḥāna llāhi wa-bi-ḥamdihī. Der Prophet ﷺ lehrte Subḥāna llāhi wa-bi-ḥamdihī.",
     "hint": "Die Überlieferung nennt hundert Wiederholungen für einen bestimmten Lohn; für kleine Kinder ist das keine Pflicht oder Leistungsprüfung."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Morgens Allah gedenken“?",
     "options": [
      "O ihr, die ihr glaubt, gedenkt Allahs in häufigem Gedenken.",
      "Der Prophet ﷺ nannte die Lobpreisung Subḥāna llāhi wa-bi-ḥamdihī für den Morgen und Abend und erwähnte den besonderen Lohn für hundert Wiederholungen.",
      "Unser Übungsziel: Ich lerne eine authentische Lobpreisung und verstehe ihren Sinn."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Aḥzāb · 33:41.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Aḥzāb · 33:41 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du lernst einen Morgen-Ḏikr. Wie übst du?",
     "options": [
      "Ruhig und mit seiner Bedeutung.",
      "Du musst sofort alles fehlerfrei können."
     ],
     "correct": 0,
     "hint": "Wir lernen ohne Druck; freiwillig ist nicht Pflicht.",
     "explain": "Wir lernen ohne Druck; freiwillig ist nicht Pflicht."
    }
   ]
  }
 },
 "adab-eltern-freundlich": {
  "questionPatches": {
   "6-8": [
    null,
    {
     "type": "text",
     "prompt": "Wie kannst du „Mit Eltern liebevoll umgehen“ in einer eigenen, sicheren Alltagssituation anwenden? Erkläre auch, warum du so handelst.",
     "sample": "Ich spreche freundlich mit meinen Eltern und hole Hilfe, wenn ich sie brauche. Auch dem Vater begegnen wir mit Respekt.",
     "hint": "Freundlich sein bedeutet nicht, bei Angst, Gefahr oder unerlaubten Forderungen schweigen zu müssen. Kinder dürfen immer vertrauenswürdige Erwachsene um Hilfe bitten."
    },
    {
     "type": "choice",
     "prompt": "Welche Antwort erklärt den Qurʾān-Vers zu „Mit Eltern liebevoll umgehen“?",
     "options": [
      "Und zu den Eltern sollt ihr gütig sein. (Auszug)",
      "Auf die Frage nach der Person, die besonders gute Behandlung verdient, nannte der Prophet ﷺ dreimal die Mutter und dann den Vater.",
      "Unser Übungsziel: Ich spreche freundlich, höre zu und kann bei Schwierigkeiten um Hilfe bitten."
     ],
     "correct": 0,
     "hint": "Sieh zuerst auf den Qurʾān-Beleg: Sūrat al-Isrāʾ · 17:23.",
     "explain": "Die erste Antwort gibt die Bedeutung von Sūrat al-Isrāʾ · 17:23 wieder. Die zweite bezieht sich auf die Sunnah, die dritte auf unsere Übung."
    }
   ],
   "4-5": [
    null,
    {
     "type": "choice",
     "prompt": "Du brauchst Hilfe. Wie sprichst du mit deinen Eltern?",
     "options": [
      "Ich frage freundlich nach Hilfe.",
      "Ich sage nichts, auch wenn ich Angst habe."
     ],
     "correct": 0,
     "hint": "Bei Sorgen darfst du um Hilfe bitten.",
     "explain": "Bei Sorgen darfst du um Hilfe bitten."
    }
   ]
  }
 },
 "aqidah-allah-erschuf-tiere": {
  "questionPatches": {
   "4-5": [
    {
     "type": "choice",
     "prompt": "Wer hat die Tiere erschaffen?",
     "options": [
      "Allah.",
      "Ein Tierarzt."
     ],
     "correct": 0,
     "hint": "Allah ist der Schöpfer.",
     "explain": "Allah ist der Schöpfer."
    },
    null
   ]
  }
 },
 "aqidah-iman-an-allah-vertiefen": {
  "questionPatches": {
   "4-5": [
    {
     "type": "choice",
     "prompt": "Was bedeutet Īmān?",
     "options": [
      "Glaube.",
      "Nur Händewaschen."
     ],
     "correct": 0,
     "hint": "Īmān bedeutet Glaube.",
     "explain": "Īmān bedeutet Glaube."
    },
    null
   ]
  }
 },
 "fiqh-wudu-schritte-reihenfolge": {
  "questionPatches": {
   "4-5": [
    {
     "type": "choice",
     "prompt": "Was bedeutet Wuḍūʾ?",
     "options": [
      "Die Gebetswaschung.",
      "Nur Hände mit Seife waschen."
     ],
     "correct": 0,
     "hint": "Wuḍūʾ ist die rituelle Waschung.",
     "explain": "Wuḍūʾ ist die rituelle Waschung."
    },
    null
   ]
  }
 },
 "sirah-nuh-geduldig-einladen": {
  "questionPatches": {
   "4-5": [
    {
     "type": "choice",
     "prompt": "Wer war Nūḥ?",
     "options": [
      "Ein Gesandter Allahs.",
      "Ein gewöhnlicher König."
     ],
     "correct": 0,
     "hint": "Nūḥ war ein Gesandter Allahs.",
     "explain": "Nūḥ war ein Gesandter Allahs."
    },
    null
   ]
  }
 },
 "aqidah-allah-pflanzen-wachsen": {
  "questionPatches": {
   "4-5": [
    {
     "type": "choice",
     "prompt": "Wer hat die Pflanzen erschaffen?",
     "options": [
      "Allah.",
      "Ein Gärtner."
     ],
     "correct": 0,
     "hint": "Allah ist der Schöpfer der Pflanzen.",
     "explain": "Allah ist der Schöpfer der Pflanzen."
    },
    null
   ]
  }
 }
};
const editorialAdditionsV30={};
for(const [lessonId,pack] of Object.entries(editorialContentV30)){
 const original=additions[lessonId]||prior[lessonId];
 if(!original||!original.questions)throw Error("KIDS V30: missing lesson "+lessonId);
 const questions={...original.questions};
 for(const age of ["4-5","6-8","9-10"]){
  const patches=pack.questionPatches?.[age];
  if(patches){
   if(patches.length!==questions[age].length)throw Error("KIDS V30: question count drift "+lessonId+" "+age);
   questions[age]=questions[age].map((row,index)=>patches[index]||row);
  }
 }
 editorialAdditionsV30[lessonId]=Object.freeze({...original,questions:Object.freeze(questions),...(pack.ageText?{ageText:Object.freeze(pack.ageText)}:{})});
}
window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions,...editorialAdditionsV30});
window.DARKidsAcademyCurriculumV29=Object.freeze({"version":"20261012-v29","count":4,"ids":["aqidah-allah-pflanzen-wachsen","aqidah-iman-an-engel","akhlaq-helfen-ohne-gegenleistung","akhlaq-fehler-ehrlich-zugeben"],"pillars":{"aqidah-allah-pflanzen-wachsen":"tawhid","aqidah-iman-an-engel":"iman","akhlaq-helfen-ohne-gegenleistung":"ikhlas","akhlaq-fehler-ehrlich-zugeben":"akhlaq"},"religiousSourcesVerified":true,"voiceRecordingsApproved":false,"requiresHumanAudioApproval":true});
})();