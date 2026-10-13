# DĀR AL TAWḤĪD KIDS — Schätze der Salaf

## Verbindliche Master-Regel (13.10.2026)

**Eine Geschichte = ein vollständiger Master-Text = eine Master-Audioaufnahme.** Derselbe Wortlaut wird im Jungen- und Mädchenprofil sowie bei **4–5, 6–8 und 9–10 Jahren** gelesen, gehört und mitgelesen. Keine gekürzten oder abweichenden Kinderfassungen; keine separaten Alters-Texte, keine drei Alters-Master-Audios. Altersprofile verändern nur die **Darstellung und altersgerechte Lernhilfen**, nicht den eigentlichen Erzähltext.

## Gemeinsamer erzählerischer Rahmen

Der warme Kindertext beginnt mit dem vollständigen Salām und einer persönlichen, liebevollen Ansprache an **Bruder und Schwester**. Ein redaktionelles Muster lautet:

> As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh, mein lieber Bruder, meine liebe Schwester.
>
> Heute möchte ich euch eine besondere Geschichte erzählen ...

Nach der authentisch belegten Begebenheit folgt eine verständliche, nicht überladene Lehre für das Kind. Der Schluss übernimmt den vertrauten Stil der bestehenden Propheten-/Ṣaḥābah-/Ṣaḥābiyyāt-Hörgeschichten:

> Und Allah weiß es am besten.
>
> Möge Allah euch nützliches Wissen schenken, euren Īmān stärken und euch al-Firdaws al-Aʿlā, die höchste Stufe des Paradieses, schenken.
>
> As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.

Der wortgetreue Satzbau kann bei einer Persönlichkeit natürlich zum Inhalt passen; der Master muss **immer** mit Salām beginnen und mit dem Salām enden. Keine wörtlichen Dialoge, Handlungen oder historischen Einzelheiten dazuerfinden. Begriffe kindgerecht innerhalb derselben Erzählung erklären. Quellenlisten liegen getrennt unter der Geschichte und werden **nicht als trockene Quellenaufzählung vorgelesen**.

## Datenvertrag für eine veröffentlichte Geschichte

Jede freigegebene Geschichte hat **genau einen** `masterStoryText` und **einen** `audioMaster`:

```json
{
  "id": "historisch-gepruefter-eindeutiger-slug",
  "verification": "approved",
  "editorialRelease": true,
  "category": "rahma",
  "title": "Kindgerechter Titel",
  "person": "Historische Persönlichkeit",
  "summary": "Kurze Beschreibung",
  "image": "/kids/assets/salaf/historischer-motiv.jpg",
  "sources": [
    {
      "author": "Quellenautor",
      "work": "Originalwerk",
      "reference": "Überprüfte Ausgabe, Band, Seite / Nummer und Direktnachweis",
      "assessment": "verified"
    }
  ],
  "masterStoryText": "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh, mein lieber Bruder, meine liebe Schwester.\n\n[Hier steht die VOLLSTÄNDIGE belegte und liebevolle Erzählung.]\n\nUnd Allah weiß es am besten. Möge Allah euch nützliches Wissen schenken, euren Īmān stärken und euch al-Firdaws al-Aʿlā schenken.\n\nAs-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.",
  "audioMaster": {
    "url": "/kids/audio/salaf/historisch-gepruefter-eindeutiger-slug.mp3",
    "timings": []
  }
}
```

**Das Beispiel ist nur eine Schemaskizze, keine echte Geschichte oder Freigabe.** Die Felder `texts:{"4-5":...}`, `scripts:{"4-5":...}` und nach Alter getrennte Audio-Master sind für neue Salaf-Geschichten nicht vorgesehen.

## Freigabe

- Erst Primärstelle, Berichtsweg und Authentizität prüfen, arabischen Wortlaut korrekt zuordnen und Quellenautor von der historischen Person trennen.
- Erzählerische Wärme kommt durch direkte, freundliche Ansprache – **nicht durch erfundene Szenen oder Dialoge**.
- Ein Text inklusive Begrüßung, Erzählung, Lehre, Duʿāʾ und Abschieds-Salām. Dieser Text ist vollständig in der App sichtbar.
- Genau eine Aufnahme derselben Wörter in der vorgesehenen Masterstimme; synchrones Mitlesen ist textgleich. Aufnahme erst nach inhaltlicher und sprachlicher Freigabe.
- Kein System-TTS als unbemerkter Ersatz. Offline-Download speichert **denselben** Text und dieselbe Aufnahme für alle Profile.
- Die vorhandenen Propheten-, Ṣaḥābah- und Ṣaḥābiyyāt-Archive nicht ändern. Bis die ersten Belege vorliegen, bleiben die Salaf-Geschichten unveröffentlicht.
