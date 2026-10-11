/**
 * DĀR AL TAWḤĪD KIDS · Support Inbox V1 (staged, never contains secrets).
 * Install ONLY while signed into dar.al.tauhid91@gmail.com.
 * Does not query children's accounts, change passwords, or send reset codes.
 * GmailApp requires the mailbox owner's one-time explicit Google authorization.
 */
const KIDS_RECOVERY_SUPPORT = Object.freeze({
  mailbox: 'dar.al.tauhid91@gmail.com',
  autoLabel: 'DAR KIDS/01 Automatisch beantwortet',
  manualLabel: 'DAR KIDS/02 Manuell pruefen',
  recoveryLabel: 'DAR KIDS/Passwort',
  generalLabel: 'DAR KIDS/Allgemeine Hilfe',
  maxThreadsPerRun: 20
});

function darKidsClassifySupport_(subject, body) {
  const combined = String(subject || '') + ' ' + String(body || '').slice(0, 4000);
  return /passwort|vergessen|wiederherstell|zuruecksetz|zurücksetz|anmelden|konto/i.test(combined)
    ? 'recovery' : 'general';
}

function darKidsCleanSender_(from) {
  const text = String(from || '').trim();
  const bracketed = text.match(/<([^<>\s]+@[^<>\s]+)>/);
  const raw = bracketed ? bracketed[1] : text;
  if (!/^[a-zA-Z0-9.!#$%&'*+\-/=?^_`{|}~]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(raw)) return '';
  return raw.toLowerCase().slice(0, 254);
}

function darKidsEnsureLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

/**
 * Run once as the support-mailbox owner; installs ONE five-minute trigger.
 * Unlike mere Gmail access inside ChatGPT, this runs on Google's servers.
 */
function darKidsInstallFiveMinuteIntake() {
  const account = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (account !== KIDS_RECOVERY_SUPPORT.mailbox) {
    throw new Error('STOP: Script muss im offiziellen DĀR-KIDS-Support-Gmail laufen.');
  }
  const others = ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'darKidsProcessSupportInbox');
  others.forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('darKidsProcessSupportInbox').timeBased().everyMinutes(5).create();
}

/**
 * Auto triage & neutral acknowledgment. Leaves every case in the review label.
 * Never trusts a sender's assertion as proof of account ownership.
 */
function darKidsProcessSupportInbox() {
  const account = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (account !== KIDS_RECOVERY_SUPPORT.mailbox) {
    throw new Error('STOP: falsches Gmail-Konto.');
  }
  const auto = darKidsEnsureLabel_(KIDS_RECOVERY_SUPPORT.autoLabel);
  const manual = darKidsEnsureLabel_(KIDS_RECOVERY_SUPPORT.manualLabel);
  const recovery = darKidsEnsureLabel_(KIDS_RECOVERY_SUPPORT.recoveryLabel);
  const general = darKidsEnsureLabel_(KIDS_RECOVERY_SUPPORT.generalLabel);
  const threads = GmailApp.search(
    'in:inbox -in:spam -in:trash "DAR AL TAWHID KIDS" -label:"' +
    KIDS_RECOVERY_SUPPORT.autoLabel + '" newer_than:30d',
    0, KIDS_RECOVERY_SUPPORT.maxThreadsPerRun
  );
  for (const thread of threads) {
    const messages = thread.getMessages();
    const incoming = messages.slice().reverse().find(m =>
      darKidsCleanSender_(m.getFrom()) !== KIDS_RECOVERY_SUPPORT.mailbox
    );
    if (!incoming || !/DAR AL TAWHID KIDS/i.test(incoming.getSubject())) continue;
    const sender = darKidsCleanSender_(incoming.getFrom());
    if (!sender || /(?:^|[.@-])(no[-_.]?reply|mailer[-_.]?daemon|postmaster)(?:[@.-]|$)/i.test(sender)) continue;
    const kind = darKidsClassifySupport_(incoming.getSubject(), incoming.getPlainBody());
    thread.addLabel(kind === 'recovery' ? recovery : general);
    thread.addLabel(manual);
    // Response is intentionally generic: no account existence, identity proof
    // or sensitive child information is revealed to the requesting address.
    GmailApp.sendEmail(
      sender,
      'DĀR AL TAWḤĪD KIDS – Anfrage eingegangen',
      'As-salāmu ʿalaykum,\n\n' +
      'deine Nachricht an DĀR AL TAWḤĪD KIDS ist eingegangen.\n' +
      'Wir prüfen dein Anliegen. Die E-Mail-Adresse allein beweist nicht, wem ein Kinderkonto gehört.\n' +
      'Bitte sende uns kein Passwort, keinen Ausweis und keine sensiblen Daten eines Kindes.\n' +
      'Für einen Passwortwechsel ist eine gesonderte, sichere Berechtigungsprüfung erforderlich.\n\n' +
      'DĀR AL TAWḤĪD KIDS Support',
      { name: 'DĀR AL TAWḤĪD KIDS Support', replyTo: KIDS_RECOVERY_SUPPORT.mailbox }
    );
    thread.addLabel(auto);
    thread.markUnread();
  }
}
