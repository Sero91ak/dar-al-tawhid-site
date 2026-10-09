/* DĀR AL TAWḤĪD — Desktop Zakāt bridge.
 * Reuses the production visitor Zakāt engine, data, price service and UI.
 * Only desktop-specific adapters live here; no duplicated fiqh/calculation rules.
 */
(function (global) {
  "use strict";
  var STORAGE_KEY = "dar.desktop.zakat.saved.v1";
  var hostId = "desktopZakatMount";

  function isRoute() {
    return new URLSearchParams(global.location.search).get("page") === "zakat";
  }
  // The production module relies on the visitor application's route contract.
  global.readRoute = function () {
    return { view: isRoute() ? "zakat" : "desktop" };
  };

  function safeReadHistory() {
    try {
      var rows = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(rows) ? rows.slice(0, 20) : [];
    } catch (_) {
      return [];
    }
  }
  function safeWriteHistory(rows) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 20)));
      return true;
    } catch (_) {
      return false;
    }
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
    });
  }
  // Keep escaped visitor content safe when the mobile app helper is absent.
  if (typeof global.esc !== "function") global.esc = esc;

  function inputSnapshot() {
    var names = {
      cash:"zakatCash", bank:"zakatBank", digital:"zakatDigital",
      otherLiquid:"zakatOtherLiquid", goldGrams:"zakatGoldGrams",
      goldValueManual:"zakatGoldManual", silverGrams:"zakatSilverGrams",
      silverValueManual:"zakatSilverManual", goldType:"zakatGoldType",
      debtsDue:"zakatDebts", nisabSinceDate:"zakatNisabSince",
      todayDate:"zakatToday"
    };
    var result = {};
    Object.keys(names).forEach(function (name) {
      var field = global.document.getElementById(names[name]);
      result[name] = field ? field.value : "";
    });
    var gold = global.document.getElementById("zakatManualGoldPrice");
    var silver = global.document.getElementById("zakatManualSilverPrice");
    result.manualPrices = {
      goldPerGramEur: gold ? gold.value : "",
      silverPerGramEur: silver ? silver.value : ""
    };
    return result;
  }
  function valueText(value) {
    var n = Number(value || 0);
    return new Intl.NumberFormat("de-DE", {style:"currency",currency:"EUR"}).format(n);
  }
  function historyHtml(rows) {
    if (!rows.length) return "";
    return '<section class="desktop-zakat-history" aria-label="Lokal gespeicherte Berechnungen">' +
      '<div class="desktop-zakat-history-head"><h3>Auf diesem Gerät gespeichert</h3>' +
      '<span>'+rows.length+' Einträge</span></div>' +
      '<p>Die Werte liegen nur in diesem Browser und werden nicht mit deinem App-Konto synchronisiert. Nicht auf gemeinsam genutzten Geräten speichern.</p>' +
      '<div class="desktop-zakat-history-list">' + rows.map(function (row) {
        return '<div class="desktop-zakat-history-row" data-desktop-zakat-record="'+esc(row.id)+'">' +
          '<span>'+esc(row.date)+'</span><b>'+valueText(row.amount)+'</b>' +
          '<button type="button" data-desktop-zakat-restore="'+esc(row.id)+'">Öffnen</button>' +
          '<button type="button" data-desktop-zakat-delete="'+esc(row.id)+'">Löschen</button>' +
          '</div>';
      }).join("") + '</div></section>';
  }

  function decorate(host) {
    var login = host.querySelector('[data-nav="account"]');
    if (login && !global.accountSession?.()?.id) {
      login.removeAttribute("data-nav");
      login.id = "desktopZakatSaveLocal";
      login.textContent = "Lokal speichern";
      login.title = "Nur nach deiner Eingabe auf diesem Gerät speichern; keine Konto-Synchronisation";
      login.addEventListener("click", function () {
        if (!global.DARZakat || !global.DARZakatApp) return;
        var config = global.DARZakatApp.getConfig();
        var input = inputSnapshot();
        var result = config ? global.DARZakat.computeZakat(input, config) : null;
        var populated = ["cash","bank","digital","otherLiquid","goldGrams","goldValueManual","silverGrams","silverValueManual","debtsDue"]
          .some(function (key) { return global.DARZakat.parseAmount(input[key]) > 0; });
        if (!result || !populated) {
          global.alert("Bitte zuerst Vermögenswerte eingeben.");
          return;
        }
        if (!global.confirm("Diese Berechnung nur auf diesem Browser speichern? Auf gemeinsam genutzten Geräten sind die gespeicherten Werte möglicherweise einsehbar.")) return;
        var entry = {
          id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
          date: new Date().toLocaleDateString("de-DE"),
          amount: result.zakatDue,
          input: input
        };
        if (!safeWriteHistory([entry].concat(safeReadHistory()))) {
          global.alert("Lokale Speicherung nicht möglich. Bitte PDF verwenden.");
          return;
        }
        mount();
      });
    }
    var old = host.querySelector(".desktop-zakat-history");
    if (old) old.remove();
    host.insertAdjacentHTML("beforeend", historyHtml(safeReadHistory()));
  }

  function mount() {
    var host = global.document.getElementById(hostId);
    if (!host || !isRoute()) return;
    if (!global.DARZakat || !global.DARZakatApp) {
      host.innerHTML = '<div class="desktop-zakat-error" role="alert">Der Zakāt-Rechner konnte nicht vollständig geladen werden. Bitte prüfe die Verbindung und lade die Seite erneut.</div>';
      return;
    }
    var oldTop = host.getBoundingClientRect().top;
    host.innerHTML = global.DARZakatApp.renderZakat();
    global.DARZakatApp.bindZakat();
    decorate(host);
    // The production UI rebuilds after each changed input. Keep the viewport steady.
    if (global.__preserveScrollOnRender && oldTop !== 0) {
      var newTop = host.getBoundingClientRect().top;
      if (Math.abs(newTop - oldTop) > 2) global.scrollBy(0, newTop - oldTop);
      global.__preserveScrollOnRender = false;
    }
  }
  global.render = function () { if (isRoute()) mount(); };
  global.DARDesktopZakat = {
    mount: mount,
    ready: function () {
      if (!isRoute()) return;
      mount();
      if (global.DARZakatApp) {
        global.DARZakatApp.ensureZakatReady().catch(function (err) {
          var host = global.document.getElementById(hostId);
          if (host) {
            var note = global.document.createElement("p");
            note.className = "desktop-zakat-error";
            note.textContent = "Preis- oder Quellenservice derzeit nicht erreichbar: " + (err?.message || "Verbindungsfehler") + ". Bei fehlenden aktuellen Preisen nur Vorschau.";
            host.prepend(note);
          }
        });
      }
    }
  };
  if (!global.__darDesktopZakatListeners) {
    global.__darDesktopZakatListeners = true;
    global.document.addEventListener("click", function (event) {
      if (!isRoute()) return;
      var restore = event.target.closest("[data-desktop-zakat-restore]");
      var remove = event.target.closest("[data-desktop-zakat-delete]");
      if (!restore && !remove) return;
      var id = (restore || remove).getAttribute(restore ? "data-desktop-zakat-restore" : "data-desktop-zakat-delete");
      var rows = safeReadHistory();
      var entry = rows.find(function (row) { return row.id === id; });
      if (!entry) return;
      if (remove) {
        if (!global.confirm("Gespeicherte Berechnung wirklich löschen?")) return;
        safeWriteHistory(rows.filter(function (row) { return row.id !== id; }));
        mount();
        return;
      }
      if (global.DARZakatApp?.restoreInput) {
        global.DARZakatApp.restoreInput(entry.input);
        return;
      }
      var inputs = {
        cash:"zakatCash", bank:"zakatBank", digital:"zakatDigital",
        otherLiquid:"zakatOtherLiquid", goldGrams:"zakatGoldGrams",
        goldValueManual:"zakatGoldManual", silverGrams:"zakatSilverGrams",
        silverValueManual:"zakatSilverManual", goldType:"zakatGoldType",
        debtsDue:"zakatDebts", nisabSinceDate:"zakatNisabSince",
        todayDate:"zakatToday"
      };
      Object.keys(inputs).forEach(function (key) {
        var el = global.document.getElementById(inputs[key]);
        if (el) el.value = entry.input?.[key] || "";
      });
      var gm = global.document.getElementById("zakatManualGoldPrice");
      var sm = global.document.getElementById("zakatManualSilverPrice");
      if (gm) gm.value = entry.input?.manualPrices?.goldPerGramEur || "";
      if (sm) sm.value = entry.input?.manualPrices?.silverPerGramEur || "";
      var first = global.document.getElementById("zakatCash");
      if (first) first.dispatchEvent(new Event("input", {bubbles:true}));
    });
  }
})(window);
