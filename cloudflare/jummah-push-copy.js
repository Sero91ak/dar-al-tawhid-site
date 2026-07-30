/** Jumuʿah-Push-Texte – Freitag, getrennt von normalen Gebets-Pushs */

export const JUMMAH_MORNING = {
  title: "🕌 Heute ist Jumuʿah",
  body: "Bereite dich auf diesen besonderen Tag vor, lies Sūrat al-Kahf und vermehre die Ṣalawāt auf den Propheten ﷺ."
};

export const JUMMAH_ADVANCE = {
  title: "🕌 Jumuʿah naht",
  body: "Bereite dich auf Khutbah und Gebet vor und gehe rechtzeitig zur Moschee."
};

export const JUMMAH_ENTRY = {
  title: "🕌 Jumuʿah-Zeit ist eingetreten",
  body: "Eile zum Gedenken Allahs und nimm dir bewusst Zeit für das Gebet."
};

export function jummahCopyForMode(mode) {
  if (mode === "morning") return JUMMAH_MORNING;
  if (mode === "advance") return JUMMAH_ADVANCE;
  return JUMMAH_ENTRY;
}
