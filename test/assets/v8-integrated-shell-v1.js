/* DĀR AL TAWḤĪD · isolated DAR TEST V8 integrated shell.
 * Presentation and local preference layer only. Existing renderers continue to
 * own content, readers, account, audio, prayer, GPS, sharing, push and routing.
 */
(function (w, d) {
    "use strict";

    if (!/^\/test(?:\/|$)/.test(w.location.pathname) || /^\/test\/kids(?:\/|$)/.test(w.location.pathname)) return;
    if (w.DarV8IntegratedShell) return;

    var root = d.documentElement;
    var frame = 0;
    var observer = null;
    var localeKey = "darAdultPreferredLocaleV1";
    var densityKey = "darV8Density";
    var motionKey = "darV8Motion";
    var navKey = "darV8Navigation";
    var usageKey = "darV8LocalUsageV1";
    var localeCatalog = null;
    var routes = [
        ["home", "Start", "home.png"],
        ["quran", "Qurʾān", "quran.png"],
        ["recent", "Beiträge", "posts.png"],
        ["topics", "Wissen", "ilm.png"],
        ["more", "Mehr", "more.png"],
        ["duas", "Duʿāʾ", "dua.png"],
        ["hadith", "Ḥadīṯ", "hadith.png"],
        ["bibliothek", "Bibliothek", "library.png"],
        ["frauen", "Frauen", "frauen.png"],
        ["quiz", "Quiz", "quiz.png"],
        ["prayer", "Gebetszeiten", "prayer.png"],
        ["saved", "Favoriten", "saved.png"],
        ["account", "Konto", "lock.png"],
        ["settings", "Einstellungen", "settings.png"]
    ];
    var routeLabels = Object.fromEntries(routes.map(function (item) { return [item[0], item[1]]; }));

    function read(key, fallback) {
        try { return w.localStorage.getItem(key) || fallback; } catch (_) { return fallback; }
    }

    function write(key, value) {
        try { w.localStorage.setItem(key, value); } catch (_) {}
    }

    function route() {
        var value = decodeURIComponent((w.location.hash || "#home").slice(1).split("/")[0] || "home");
        return value === "start" ? "home" : value;
    }

    function parentRoute(value) {
        if (["post", "topic", "news", "news-detail", "series"].includes(value)) return "recent";
        if (["quran-surah", "quran-player", "quran-topic", "quran-topics", "quran-search"].includes(value)) return "quran";
        if (["dua", "dua-cat", "dua-detail"].includes(value)) return "duas";
        if (["bibliothek-detail", "bibliothek-reader", "book"].includes(value)) return "bibliothek";
        if (["jummah", "qibla", "calendar"].includes(value)) return "prayer";
        if (["scholar", "scholars", "scholar-detail"].includes(value)) return "topics";
        return value;
    }

    function navigate(value) {
        if (typeof w.navigate === "function") w.navigate(value);
        else w.location.hash = "#" + encodeURIComponent(value);
    }

    function viewport() {
        var visual = w.visualViewport;
        var width = Math.round(root.clientWidth || w.innerWidth || (visual && visual.width) || 0);
        var height = Math.round(root.clientHeight || w.innerHeight || (visual && visual.height) || 0);
        var active = d.activeElement;
        var keyboard = !!(visual && height - visual.height > 140 && active && /INPUT|TEXTAREA|SELECT/.test(active.tagName || ""));
        var expanded = width >= 760 && height >= 560 && width - 88 - 240 - 14 - 28 >= 360 && !keyboard;
        return { width: width, height: height, keyboard: keyboard, expanded: expanded };
    }

    function syncViewport() {
        var size = viewport();
        var preference = read(navKey, "auto");
        var mode = preference === "bottom" ? "compact" : (preference === "left" || preference === "right" ? "expanded" : (size.expanded ? "expanded" : size.width >= 600 ? "medium" : "compact"));
        root.dataset.v8Viewport = mode;
        root.dataset.v8Nav = preference;
        root.dataset.v8Keyboard = size.keyboard ? "open" : "closed";
        root.dataset.v8Density = read(densityKey, "compact");
        root.dataset.v8Motion = read(motionKey, "system");
    }

    function image(name) {
        var img = d.createElement("img");
        img.src = "/test/assets/dar-3d-icons/" + name;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", function () { img.hidden = true; }, { once: true });
        return img;
    }

    function ensureRail() {
        var rail = d.getElementById("darV8IntegratedRail");
        if (!rail) {
            rail = d.createElement("aside");
            rail.id = "darV8IntegratedRail";
            rail.setAttribute("aria-label", "DĀR Hauptnavigation");
            var brand = d.createElement("button");
            brand.type = "button";
            brand.className = "dv8-brand";
            brand.dataset.v8Nav = "home";
            brand.append(image("home.png"));
            var brandText = d.createElement("span");
            brandText.innerHTML = "DĀR AL TAWḤĪD<small>QURʾĀN · SUNNAH · ĀṮĀR</small>";
            brand.append(brandText);
            rail.append(brand);
            var nav = d.createElement("nav");
            nav.setAttribute("aria-label", "Erwachsenenbereiche");
            routes.forEach(function (item, index) {
                var button = d.createElement("button");
                button.type = "button";
                button.dataset.v8Nav = item[0];
                button.className = index < 5 ? "dv8-primary" : "dv8-secondary";
                button.append(image(item[2]));
                var title = d.createElement("span");
                title.textContent = item[1];
                button.append(title);
                nav.append(button);
            });
            rail.append(nav);
            d.body.append(rail);
        }
        var active = parentRoute(route());
        rail.querySelectorAll("[data-v8-nav]").forEach(function (button) {
            var selected = button.dataset.v8Nav === active;
            button.classList.toggle("is-active", selected);
            if (selected) button.setAttribute("aria-current", "page");
            else button.removeAttribute("aria-current");
        });
    }

    function openLanguage(button) {
        if (w.DARAdultLanguagePickerV1 && typeof w.DARAdultLanguagePickerV1.open === "function") {
            w.DARAdultLanguagePickerV1.open("quick", button);
        }
    }

    function ensureQuickActions() {
        var host = d.querySelector(".app-bar") || d.querySelector(".top-shell");
        if (!host || d.getElementById("darV8IntegratedActions")) return;
        var actions = d.createElement("div");
        actions.id = "darV8IntegratedActions";
        actions.setAttribute("role", "group");
        actions.setAttribute("aria-label", "Sprache, Konto und Erscheinungsbild");
        [["language", "Sprache", "globe"], ["account", "Konto", "person.crop.circle"], ["appearance", "Erscheinungsbild", "paintpalette"]].forEach(function (spec) {
            var button = d.createElement("button");
            button.type = "button";
            button.dataset.v8Action = spec[0];
            button.setAttribute("aria-label", spec[1]);
            var symbol = d.createElement("span");
            symbol.setAttribute("aria-hidden", "true");
            symbol.textContent = spec[0] === "language" ? "🌐" : spec[0] === "account" ? "◉" : "◐";
            button.append(symbol);
            actions.append(button);
        });
        host.append(actions);
    }

    function usage() {
        try { return JSON.parse(read(usageKey, "{}")); } catch (_) { return {}; }
    }

    function recordUsage() {
        var current = parentRoute(route());
        if (current === "home" || !routeLabels[current]) return;
        var state = usage();
        state[current] = { count: ((state[current] && state[current].count) || 0) + 1, last: Date.now() };
        write(usageKey, JSON.stringify(state));
    }

    function rankedUsage() {
        var state = usage();
        return Object.keys(state).filter(function (key) { return routeLabels[key]; }).sort(function (a, b) {
            var left = state[a], right = state[b];
            return (right.count * 10000000000000 + right.last) - (left.count * 10000000000000 + left.last);
        }).slice(0, 4);
    }

    function ensureSmartDashboard() {
        if (parentRoute(route()) !== "home") return;
        var home = d.getElementById("dv3Home") || d.querySelector("#appView .home-view") || d.querySelector("#appView .dv3-home");
        if (!home) return;
        var panel = home.querySelector(".dv8-smart-dashboard");
        if (!panel) {
            panel = d.createElement("section");
            panel.className = "dv8-smart-dashboard";
            panel.setAttribute("aria-labelledby", "dv8SmartTitle");
            var heading = d.createElement("div");
            heading.className = "dv8-smart-head";
            heading.innerHTML = '<div><small>LOKAL · NACHVOLLZIEHBAR</small><h2 id="dv8SmartTitle">Für dich weiter</h2></div><button type="button" data-v8-reset-usage>Standard wiederherstellen</button>';
            panel.append(heading, d.createElement("div"));
            panel.lastElementChild.className = "dv8-smart-links";
            var anchor = home.querySelector(".dv3-hometitle, h1");
            if (anchor) anchor.insertAdjacentElement("afterend", panel); else home.prepend(panel);
        }
        var keys = rankedUsage();
        var links = panel.querySelector(".dv8-smart-links");
        links.replaceChildren();
        (keys.length ? keys : ["quran", "recent", "duas", "prayer"]).forEach(function (key) {
            var button = d.createElement("button");
            button.type = "button";
            button.dataset.v8Nav = key;
            button.append(image((routes.find(function (item) { return item[0] === key; }) || [0, 0, "home.png"])[2]));
            var text = d.createElement("span");
            text.innerHTML = "<strong>" + routeLabels[key] + "</strong><small>" + (keys.length ? "Nach deiner lokalen Nutzung" : "Schnellzugriff") + "</small>";
            button.append(text);
            links.append(button);
        });
    }

    function localeStatus(code) {
        var review = localeCatalog && localeCatalog.reviewStatus && localeCatalog.reviewStatus[code];
        if (review === "draft-incomplete") return "Entwurf · unvollständig";
        if (review === "registered-needs-linguistic-review") return "registriert · Prüfung offen";
        if (review === "source-reviewed") return "geprüfte Ausgangssprache";
        var available = false;
        try { available = !!(w.DARAdultLanguagePickerV1 && w.DARAdultLanguagePickerV1.available(code)); } catch (_) {}
        return available ? "verfügbar" : "in Arbeit";
    }

    function ensureSettings() {
        var settings = d.querySelector("#appView .dsh-shell.dsh-home");
        if (!settings || d.getElementById("darV8IntegratedSettings")) return;
        var panel = d.createElement("section");
        panel.id = "darV8IntegratedSettings";
        panel.className = "dsh-group dv8-settings";
        panel.innerHTML = '<div class="dsh-group-head"><span>V8 Oberfläche & Geräte</span></div>' +
            '<div class="dv8-setting-row"><strong>Navigation</strong><div>' + ["auto", "left", "bottom", "right"].map(function (value) { return '<button type="button" data-v8-nav-choice="' + value + '">' + ({ auto: "Automatisch", left: "Links", bottom: "Unten", right: "Rechts" })[value] + '</button>'; }).join("") + '</div></div>' +
            '<div class="dv8-setting-row"><strong>Darstellung</strong><div><button type="button" data-v8-density="compact">Kompakt</button><button type="button" data-v8-density="comfort">Komfort</button></div></div>' +
            '<div class="dv8-setting-row"><strong>Bewegung</strong><div><button type="button" data-v8-motion="system">System</button><button type="button" data-v8-motion="reduce">Reduziert</button></div></div>' +
            '<div class="dv8-languages"><strong>9 Sprachen</strong><p></p><div data-dar-language-entry="settings"></div></div>';
        panel.querySelector(".dv8-languages p").textContent = [["de", "Deutsch"], ["ar", "العربية"], ["en", "English"], ["tr", "Türkçe"], ["ku", "Kurmancî"], ["ckb", "سۆرانی"], ["bs", "Bosanski"], ["fr", "Français"], ["es", "Español"]].map(function (item) { return item[1] + " · " + localeStatus(item[0]); }).join("  |  ");
        settings.append(panel);
        if (w.DARAdultLanguagePickerV1) w.DARAdultLanguagePickerV1.refresh();
    }

    function protectReaders() {
        d.querySelectorAll(".post-reader,.quran-ayah-list,.quran-reader-shell,.qrc-shell,.dua-detail-box,.post-body,.article,.post-share-modal,.qrc-ayah-share").forEach(function (element) {
            element.dataset.v8OriginalReader = "1";
        });
    }

    function sync() {
        frame = 0;
        root.classList.add("dar-v8-integrated");
        root.dir = ["ar", "ckb"].includes(read(localeKey, "de")) ? "rtl" : "ltr";
        syncViewport();
        ensureRail();
        ensureQuickActions();
        ensureSmartDashboard();
        ensureSettings();
        protectReaders();
    }

    function schedule() {
        if (!frame) frame = w.requestAnimationFrame(sync);
    }

    d.addEventListener("click", function (event) {
        var nav = event.target.closest("[data-v8-nav]");
        if (nav) { event.preventDefault(); navigate(nav.dataset.v8Nav); return; }
        var action = event.target.closest("[data-v8-action]");
        if (action) {
            event.preventDefault();
            if (action.dataset.v8Action === "language") openLanguage(action);
            else navigate(action.dataset.v8Action === "account" ? "account" : "settings");
            return;
        }
        var choice = event.target.closest("[data-v8-nav-choice]");
        if (choice) { write(navKey, choice.dataset.v8NavChoice); schedule(); return; }
        var density = event.target.closest("[data-v8-density]");
        if (density) { write(densityKey, density.dataset.v8Density); schedule(); return; }
        var motion = event.target.closest("[data-v8-motion]");
        if (motion) { write(motionKey, motion.dataset.v8Motion); schedule(); return; }
        if (event.target.closest("[data-v8-reset-usage]")) { write(usageKey, "{}"); schedule(); }
    });

    function onRoute() { recordUsage(); schedule(); }

    function boot() {
        w.fetch("/test/i18n/adult-ui-locales-nine-v8.json", { cache: "no-store" }).then(function (response) {
            if (!response.ok) throw new Error("V8 locale catalog unavailable");
            return response.json();
        }).then(function (catalog) {
            localeCatalog = catalog;
            w.DarV8LocaleCatalog = catalog;
            var settings = d.getElementById("darV8IntegratedSettings");
            if (settings) settings.remove();
            schedule();
        }).catch(function () { schedule(); });
        recordUsage();
        schedule();
        var app = d.getElementById("appView");
        if (app && w.MutationObserver) {
            observer = new MutationObserver(schedule);
            observer.observe(app, { childList: true, subtree: false });
        }
        w.addEventListener("hashchange", onRoute, { passive: true });
        w.addEventListener("resize", schedule, { passive: true });
        if (w.visualViewport) w.visualViewport.addEventListener("resize", schedule, { passive: true });
        w.addEventListener("dar-adult-locale-changed", schedule);
        d.addEventListener("dar:view-rendered", schedule);
    }

    w.DarV8IntegratedShell = Object.freeze({
        version: "20261022-integrated-1",
        base: "51819da661d094e1c5738f0685478e8683c0a6b7",
        refresh: schedule,
        status: function () { return { route: route(), viewport: viewport(), locale: read(localeKey, "de"), personalized: rankedUsage() }; }
    });

    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot, { once: true });
    else boot();
})(window, document);
