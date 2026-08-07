(function(){
  const ENABLED = !!window.__DAR_STAGING_APP;
  const INDEX_PATH = "/content/staging/prophets/index.json";
  const INDEX_CACHE_KEY = "darProphetsIndexStagingV1";
  const PROFILE_CACHE_PREFIX = "darProphetProfileStagingV1:";
  let prophetsIndex = null;
  let prophetsLoading = null;
  const prophetProfiles = new Map();
  const prophetProfileLoads = new Map();
  let prophetsSearchQuery = "";

  function foldText(value){
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/qur'an|quran|koran/g, "quran")
      .replace(/musa/g, "musa")
      .replace(/musaa/g, "musa")
      .replace(/firawn|fir'aun|firʿawn/g, "firawn")
      .replace(/banu|banu/g, "banu")
      .replace(/[^a-z0-9\u0600-\u06ff\s:-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function searchMatch(haystack, query){
    const rawHay = String(haystack || "").toLowerCase();
    const rawQuery = String(query || "").trim().toLowerCase();
    if(!rawQuery) return true;
    if(rawHay.includes(rawQuery)) return true;
    return foldText(haystack).includes(foldText(query));
  }
  function defaultIndex(){
    return {
      searchPlaceholder: "Prophet, Volk, Ereignis, Sūrah oder Aussage suchen",
      intro: {
        eyebrow: "DIE PROPHETEN",
        arabic: "الأنبياء",
        description: "Was Qurʾān, authentische Sunnah und zuverlässig belegte frühe Überlieferungen über die Propheten berichten."
      },
      ululAzm: [],
      prophets: [],
      disputedPeople: []
    };
  }
  function readJsonCache(key, fallback){
    try{
      return typeof getJson === "function" ? getJson(key, fallback) : fallback;
    }catch(e){
      return fallback;
    }
  }
  function writeJsonCache(key, value){
    try{
      if(typeof setJson === "function") setJson(key, value);
    }catch(e){}
  }
  async function loadIndex(){
    if(!ENABLED) return defaultIndex();
    if(prophetsIndex) return prophetsIndex;
    if(prophetsLoading) return prophetsLoading;
    const cached = readJsonCache(INDEX_CACHE_KEY, null);
    if(cached && Array.isArray(cached.prophets)){
      prophetsIndex = cached;
      return prophetsIndex;
    }
    prophetsLoading = (async function(){
      try{
        const response = await fetch(`${INDEX_PATH}?v=${Date.now()}`, { cache: "no-store" });
        if(!response.ok) throw new Error(`Propheten-Index ${response.status}`);
        const payload = await response.json();
        prophetsIndex = payload && Array.isArray(payload.prophets) ? payload : defaultIndex();
        writeJsonCache(INDEX_CACHE_KEY, prophetsIndex);
        return prophetsIndex;
      }catch(e){
        console.warn("Propheten-Index:", e);
        prophetsIndex = cached && Array.isArray(cached.prophets) ? cached : defaultIndex();
        return prophetsIndex;
      }finally{
        prophetsLoading = null;
      }
    })();
    return prophetsLoading;
  }
  function prophetMetaById(id){
    const data = prophetsIndex || defaultIndex();
    return (data.prophets || []).find(function(entry){ return String(entry.id) === String(id); }) || null;
  }
  async function loadProfileById(id){
    const key = String(id || "").trim();
    if(!key) return null;
    if(prophetProfiles.has(key)) return prophetProfiles.get(key);
    if(prophetProfileLoads.has(key)) return prophetProfileLoads.get(key);
    const meta = prophetMetaById(key);
    if(!meta || !meta.profilePath) return null;
    const cached = readJsonCache(PROFILE_CACHE_PREFIX + key, null);
    if(cached && cached.id){
      prophetProfiles.set(key, cached);
      return cached;
    }
    const pending = (async function(){
      try{
        const response = await fetch(`${meta.profilePath}?v=${Date.now()}`, { cache: "no-store" });
        if(!response.ok) throw new Error(`Propheten-Profil ${response.status}`);
        const payload = await response.json();
        prophetProfiles.set(key, payload);
        writeJsonCache(PROFILE_CACHE_PREFIX + key, payload);
        return payload;
      }catch(e){
        console.warn("Propheten-Profil:", key, e);
        if(cached && cached.id){
          prophetProfiles.set(key, cached);
          return cached;
        }
        return null;
      }finally{
        prophetProfileLoads.delete(key);
      }
    })();
    prophetProfileLoads.set(key, pending);
    return pending;
  }
  function routeParts(value){
    const parts = String(value || "").split("/").filter(Boolean);
    return {
      id: parts[0] || "",
      tab: parts[1] || "overview"
    };
  }
  function routeValue(id, tab){
    return tab && tab !== "overview" ? `${id}/${tab}` : String(id || "");
  }
  function labelFromRoute(route){
    const parts = routeParts(route && route.value);
    const meta = prophetMetaById(parts.id);
    return meta ? meta.name : "Propheten";
  }
  function statusLabel(status){
    if(status === "quran") return "Qurʾān";
    if(status === "sahih") return "Ṣaḥīḥ";
    if(status === "reliable_athar") return "Zuverlässiger Āṯar";
    if(status === "disputed") return "Umstritten";
    if(status === "daif") return "Ḍaʿīf";
    if(status === "israiliyyat") return "Isrāʾīliyyāt";
    if(status === "unverified") return "Nicht verifiziert";
    if(status === "quran_explicit") return "Qurʾān-belegt";
    if(status === "authentic_sunnah_explicit") return "Sunnah-belegt";
    if(status === "scholarly_disputed") return "Umstritten";
    if(status === "not_established") return "Nicht feststehend";
    return "Geprüft";
  }
  function verificationLabel(status){
    if(status === "approved") return "Freigegeben";
    if(status === "research") return "In Forschung";
    if(status === "source_check") return "Quellenprüfung";
    if(status === "isnad_check") return "Isnād-Prüfung";
    if(status === "draft") return "Entwurf";
    if(status === "rejected") return "Nicht veröffentlicht";
    return "Geprüft";
  }
  function prophetStats(profile){
    return {
      claims: Array.isArray(profile?.claims) ? profile.claims.length : 0,
      quranRefs: Array.isArray(profile?.quranReferences) ? profile.quranReferences.length : 0,
      sayings: Array.isArray(profile?.sayings) ? profile.sayings.length : 0,
      sources: Array.isArray(profile?.sources) ? profile.sources.length : 0
    };
  }
  function claimMap(profile){
    const map = new Map();
    (profile?.claims || []).forEach(function(claim){ map.set(String(claim.id), claim); });
    return map;
  }
  function claimRefs(profile, claimIds){
    const map = claimMap(profile);
    return (Array.isArray(claimIds) ? claimIds : [])
      .map(function(id){ return map.get(String(id)); })
      .filter(Boolean);
  }
  function renderClaimLinks(profile, claimIds){
    const refs = claimRefs(profile, claimIds);
    if(!refs.length) return "";
    return `<div class="prophet-claim-links">${refs.map(function(claim){
      return `<span class="prophet-claim-pill">${esc(claim.sourceLocation || claim.source || claim.claim || "")}</span>`;
    }).join("")}</div>`;
  }
  function renderMetaChips(meta){
    const chips = [];
    (meta.roles || []).forEach(function(role){ chips.push(`<span class="prophet-meta-chip">${esc(role)}</span>`); });
    if(meta.people) chips.push(`<span class="prophet-meta-chip">${esc(meta.people)}</span>`);
    if(meta.metaLine) chips.push(`<span class="prophet-status-chip">${esc(meta.metaLine)}</span>`);
    return chips.length ? `<div class="prophet-meta-row">${chips.join("")}</div>` : "";
  }
  function libraryEntries(){
    const data = prophetsIndex || defaultIndex();
    const query = String(prophetsSearchQuery || "").trim();
    const all = Array.isArray(data.prophets) ? data.prophets.slice() : [];
    if(!query) return all;
    return all.filter(function(entry){
      const haystack = [
        entry.name,
        entry.arabicName,
        entry.people,
        entry.region,
        entry.summary,
        entry.metaLine
      ].concat(Array.isArray(entry.searchTerms) ? entry.searchTerms : []).join(" ");
      return searchMatch(haystack, query);
    });
  }
  function renderFeatureRow(item){
    const search = [item.title, item.arabicTitle, item.desc, item.group, item.badge, item.metaLine].filter(Boolean).join(" ").toLowerCase();
    return `<button class="more-feature-row more-feature-row--prophets" type="button" data-nav="${esc(item.nav)}" data-feature-search="${esc(search)}">
      <div class="prophet-feature-kicker">
        <span>Die Propheten</span>
        <span class="prophet-feature-badge">${esc(item.badge || "Test")}</span>
      </div>
      <h4 class="prophet-feature-title">${esc(item.title)}</h4>
      <span class="prophet-feature-arabic">${esc(item.arabicTitle || "")}</span>
      <p class="prophet-feature-desc">${esc(item.desc || "")}</p>
      <div class="prophet-feature-footer">
        <span>${esc(item.metaLine || "")}</span>
        <span class="prophet-feature-link">${esc(item.button || "Entdecken")} ›</span>
      </div>
    </button>`;
  }
  function renderLoading(title){
    return `${setPageHeader(title, "Der Bereich wird für die Test-App geladen.", "Propheten")}<section class="prophets-shell"><div class="prophet-empty-state">Inhalte werden geladen …</div></section>`;
  }
  function renderUnavailable(){
    return `${setPageHeader("Propheten", "Dieser Bereich ist nur in der Test-App sichtbar.", "Propheten")}<section class="prophets-shell"><div class="prophet-empty-state">In der Besucher-App ist dieser Bereich noch nicht freigegeben.</div></section>`;
  }
  function renderProphetRow(meta){
    return `<button class="prophet-catalog-row" type="button" data-nav="prophet" data-value="${esc(routeValue(meta.id, "overview"))}">
      <span>
        <h4 class="prophet-catalog-title">${esc(meta.displayTitle || meta.name || "")}</h4>
        <span class="prophet-catalog-arabic">${esc(meta.arabicName || "")} ${esc(meta.honorific || "")}</span>
        ${renderMetaChips(meta)}
        <p class="prophet-catalog-summary">${esc(meta.summary || "")}</p>
      </span>
      <span class="prophet-catalog-action">Biografie · Aussagen · Quellen</span>
    </button>`;
  }
  function renderDisputed(data){
    if(!Array.isArray(data.disputedPeople) || !data.disputedPeople.length) return "";
    return `<section class="prophet-panel">
      <div class="prophet-section-head">
        <div>
          <p class="prophet-section-kicker">Umstrittene Einordnung</p>
          <h3>Getrennt behandelt</h3>
        </div>
        <span>Diese Personen erscheinen nicht in der Hauptliste eindeutig belegter Propheten.</span>
      </div>
      <div class="prophet-disputed-grid">${data.disputedPeople.map(function(entry){
        return `<article class="prophet-disputed-card">
          <h4>${esc(entry.name || "")} <span class="prophets-arabic">${esc(entry.arabicName || "")}</span></h4>
          <div class="prophet-meta-row"><span class="prophet-status-chip">${esc(statusLabel(entry.prophetStatus))}</span></div>
          <p>${esc(entry.note || "")}</p>
        </article>`;
      }).join("")}</div>
    </section>`;
  }
  function renderLibrary(){
    if(!ENABLED) return renderUnavailable();
    if(!prophetsIndex){
      loadIndex().then(function(){
        const route = typeof readRoute === "function" ? readRoute() : null;
        if(route && route.view === "prophets" && typeof render === "function") render();
      });
      return renderLoading("Propheten");
    }
    const data = prophetsIndex || defaultIndex();
    const entries = libraryEntries();
    const ululAzm = entries.filter(function(entry){ return (data.ululAzm || []).includes(entry.id); });
    const remaining = entries.filter(function(entry){ return !(data.ululAzm || []).includes(entry.id); });
    return `${setPageHeader("Propheten", data.intro?.description || "", "Propheten")}
      <section class="prophets-shell">
        <section class="prophets-hero">
          <p class="prophets-kicker">${esc(data.intro?.eyebrow || "DIE PROPHETEN")}</p>
          <h3 class="prophet-detail-title">Propheten</h3>
          <span class="prophets-arabic">${esc(data.intro?.arabic || "الأنبياء")}</span>
          <p class="prophet-detail-subline">${esc(data.intro?.description || "")}</p>
          <div class="prophets-divider">✦</div>
          <input id="prophetsSearchInput" class="prophets-search-input" type="search" autocomplete="off" placeholder="${esc(data.searchPlaceholder || defaultIndex().searchPlaceholder)}" value="${esc(prophetsSearchQuery)}">
        </section>
        ${ululAzm.length ? `<section class="prophet-panel">
          <div class="prophet-section-head">
            <div>
              <p class="prophet-section-kicker">Besondere Kategorie</p>
              <h3>Ulū l-ʿAzm</h3>
            </div>
            <span>Hochwertige Referenzprofile mit strenger Quellenstruktur.</span>
          </div>
          <div class="prophet-catalog">${ululAzm.map(renderProphetRow).join("")}</div>
        </section>` : ""}
        <section class="prophet-panel">
          <div class="prophet-section-head">
            <div>
              <p class="prophet-section-kicker">Eindeutig belegt</p>
              <h3>Prophetenbibliothek</h3>
            </div>
            <span>${entries.length} Eintrag${entries.length === 1 ? "" : "e"} in der Test-App</span>
          </div>
          <div class="prophet-catalog">${remaining.length ? remaining.map(renderProphetRow).join("") : `<div class="prophet-empty-state">Keine Treffer für diese Suche.</div>`}</div>
        </section>
        ${renderDisputed(data)}
      </section>`;
  }
  function renderOverview(profile){
    return `<section class="prophet-panel">
      <h3>Übersicht</h3>
      <div class="prophet-overview-grid">${(profile.overviewFields || []).map(function(field){
        return `<article class="prophet-overview-card">
          <b>${esc(field.label || "")}</b>
          <span>${esc(field.value || "")}</span>
          ${renderClaimLinks(profile, field.claimIds)}
        </article>`;
      }).join("")}</div>
    </section>`;
  }
  function renderBiography(profile){
    return `<section class="prophet-panel">
      <h3>Lebensweg</h3>
      <div class="prophet-biography">${(profile.biographySections || []).map(function(section){
        return `<article class="prophet-event-card">
          <h4>${esc(section.title || "")}</h4>
          <p>${esc(section.summary || "")}</p>
          ${renderClaimLinks(profile, section.claimIds)}
        </article>`;
      }).join("")}</div>
    </section>`;
  }
  function renderQuran(profile){
    return `<section class="prophet-panel">
      <h3>Qurʾān</h3>
      <div class="prophet-quran-list">${(profile.quranReferences || []).map(function(entry){
        return `<article class="prophet-source-card">
          <h4>${esc(entry.title || "")}</h4>
          <p>${esc(entry.range || "")} · ${esc(entry.classification || "")}</p>
          <p>${esc(entry.note || "")}</p>
          ${renderClaimLinks(profile, entry.claimIds)}
          <div class="prophet-inline-actions">
            <button class="prophet-action-btn primary" type="button" data-prophet-quran-open="${esc(`${entry.surah}:${entry.ayahStart || entry.ayahEnd || 1}`)}">Im Qurʾān öffnen</button>
          </div>
        </article>`;
      }).join("")}</div>
    </section>`;
  }
  function renderSayings(profile){
    const sayings = Array.isArray(profile.sayings) ? profile.sayings : [];
    const hadith = Array.isArray(profile.hadithAboutProphet) ? profile.hadithAboutProphet : [];
    return `<section class="prophet-panel">
      <h3>Aussagen</h3>
      <div class="prophet-quote-list">${sayings.map(function(entry){
        return `<article class="prophet-quote-card">
          <h4>${esc(entry.title || "")}</h4>
          <p>${esc(entry.translationDe || "")}</p>
          <div class="prophet-meta-row">
            <span class="prophet-meta-chip">${esc(entry.source || "")}</span>
            <span class="prophet-status-chip">${esc(statusLabel(entry.grading || "quran"))}</span>
          </div>
          <p>${esc(entry.context || entry.sourceLocation || "")}</p>
          <div class="prophet-inline-actions">
            <button class="prophet-action-btn" type="button" data-prophet-quran-open="${esc(`${entry.directReference?.surah || 0}:${entry.directReference?.ayah || 1}`)}">Qurʾān öffnen</button>
          </div>
        </article>`;
      }).join("") || `<div class="prophet-empty-state">Noch keine Aussagen freigegeben.</div>`}</div>
      ${hadith.length ? "" : `<div class="prophet-research-note"><p>${esc(profile.researchStatus?.hadith || "Für diese Phase sind noch keine separat freigegebenen Ḥadīṯe veröffentlicht.")}</p></div>`}
    </section>`;
  }
  function renderFamily(profile){
    return `<section class="prophet-panel">
      <h3>Familie</h3>
      <div class="prophet-overview-grid prophet-family-grid">${(profile.familyFields || []).map(function(field){
        return `<article class="prophet-overview-card">
          <b>${esc(field.label || "")}</b>
          <span>${esc(field.value || "")}</span>
          ${renderClaimLinks(profile, field.claimIds)}
        </article>`;
      }).join("")}</div>
    </section>`;
  }
  function renderEvents(profile){
    const claimGroups = (profile.claims || []).filter(function(claim){
      return ["events", "biography", "revelation", "people"].includes(claim.category);
    });
    return `<section class="prophet-panel">
      <h3>Ereignisse</h3>
      <div class="prophet-biography">${claimGroups.map(function(claim){
        return `<article class="prophet-event-card">
          <h4>${esc(claim.claim || "")}</h4>
          <p>${esc(claim.translationDe || claim.notes || "")}</p>
          <div class="prophet-meta-row">
            <span class="prophet-meta-chip">${esc(claim.source || "")}</span>
            <span class="prophet-status-chip">${esc(statusLabel(claim.grading || claim.status || ""))}</span>
          </div>
          <p>${esc(claim.sourceLocation || "")}</p>
        </article>`;
      }).join("")}</div>
      <div class="prophet-research-note"><p>${esc(profile.researchStatus?.disputedReports || "")}</p></div>
    </section>`;
  }
  function renderSources(profile){
    return `<section class="prophet-panel">
      <h3>Quellen</h3>
      <div class="prophet-source-list">${(profile.sources || []).map(function(source){
        return `<article class="prophet-source-card">
          <h4>${esc(source.work || "")}</h4>
          <div class="prophet-meta-row">
            <span class="prophet-meta-chip">${esc(source.sourceType || "")}</span>
            <span class="prophet-status-chip">${esc(verificationLabel(source.verificationStatus || ""))}</span>
          </div>
          <ul>${(source.entries || []).map(function(entry){ return `<li>${esc(entry)}</li>`; }).join("")}</ul>
          ${source.directReference?.kind === "quran" ? `<div class="prophet-inline-actions"><button class="prophet-action-btn primary" type="button" data-prophet-quran-open="${esc(`${source.directReference.surah}:${source.directReference.ayah}`)}">Direkt öffnen</button></div>` : ""}
        </article>`;
      }).join("")}</div>
      <div class="prophet-research-note">
        <p>${esc(profile.researchStatus?.athar || "")}</p>
      </div>
    </section>`;
  }
  function renderTabs(profile, activeTab){
    const tabs = [
      ["overview", "Übersicht"],
      ["biography", "Lebensweg"],
      ["quran", "Qurʾān"],
      ["sayings", "Aussagen"],
      ["family", "Familie"],
      ["events", "Ereignisse"],
      ["sources", "Quellen"]
    ];
    return `<div class="prophet-tab-strip">${tabs.map(function(tab){
      const isActive = activeTab === tab[0];
      return `<button class="prophet-tab-btn${isActive ? " is-active" : ""}" type="button" data-nav="prophet" data-value="${esc(routeValue(profile.id, tab[0]))}">${esc(tab[1])}</button>`;
    }).join("")}</div>`;
  }
  function renderDetailSection(profile, activeTab){
    if(activeTab === "quran") return renderQuran(profile);
    if(activeTab === "sayings") return renderSayings(profile);
    if(activeTab === "family") return renderFamily(profile);
    if(activeTab === "events") return renderEvents(profile);
    if(activeTab === "sources") return renderSources(profile);
    if(activeTab === "biography") return renderBiography(profile);
    return renderOverview(profile);
  }
  function renderDetail(value){
    if(!ENABLED) return renderUnavailable();
    const parts = routeParts(value);
    if(!prophetsIndex){
      loadIndex().then(function(){
        const route = typeof readRoute === "function" ? readRoute() : null;
        if(route && route.view === "prophet" && typeof render === "function") render();
      });
      return renderLoading("Propheten");
    }
    const meta = prophetMetaById(parts.id);
    if(!meta) return `${setPageHeader("Propheten", "Der gewünschte Prophet ist in dieser Phase noch nicht freigegeben.", "Propheten")}<section class="prophets-shell"><div class="prophet-empty-state">Kein freigegebenes Referenzprofil gefunden.</div></section>`;
    const profile = prophetProfiles.get(parts.id);
    if(!profile){
      loadProfileById(parts.id).then(function(){
        const route = typeof readRoute === "function" ? readRoute() : null;
        if(route && route.view === "prophet" && typeof render === "function") render();
      });
      return renderLoading(meta.name || "Propheten");
    }
    const stats = prophetStats(profile);
    return `${setPageHeader(meta.name || "Propheten", meta.summary || meta.metaLine || "", "Propheten")}
      <section class="prophets-shell">
        <section class="prophet-detail-hero">
          <p class="prophets-kicker">Die Propheten</p>
          <h3 class="prophet-detail-title">${esc(profile.displayTitle || profile.name || "")}</h3>
          <span class="prophet-detail-arabic">${esc(profile.arabicName || "")} ${esc(profile.honorific || "")}</span>
          <div class="prophet-meta-row">
            ${(profile.roles || []).map(function(role){ return `<span class="prophet-meta-chip">${esc(role)}</span>`; }).join("")}
            ${profile.people ? `<span class="prophet-meta-chip">${esc(profile.people)}</span>` : ""}
            <span class="prophet-status-chip">${esc(statusLabel(profile.prophetStatus || ""))}</span>
          </div>
          <p class="prophet-detail-subline">${esc(profile.mission || meta.summary || "")}</p>
          <div class="prophet-meta-row">
            <span class="prophet-meta-chip">${stats.claims} Claims</span>
            <span class="prophet-meta-chip">${stats.quranRefs} Qurʾān-Fundstellen</span>
            <span class="prophet-meta-chip">${stats.sayings} Aussagen</span>
            <span class="prophet-meta-chip">${stats.sources} Werke</span>
          </div>
        </section>
        ${renderTabs(profile, parts.tab)}
        ${renderDetailSection(profile, parts.tab)}
      </section>`;
  }
  function bindEvents(){
    const route = typeof readRoute === "function" ? readRoute() : null;
    if(route?.view === "prophets"){
      const input = document.getElementById("prophetsSearchInput");
      if(input){
        input.oninput = function(){
          prophetsSearchQuery = input.value || "";
          window.DARScrollManager?.preserveNextRender?.();
          if(typeof render === "function") render();
        };
      }
    }
    document.querySelectorAll("[data-prophet-quran-open]").forEach(function(btn){
      btn.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        const parts = String(btn.getAttribute("data-prophet-quran-open") || "").split(":");
        const surah = Number(parts[0]);
        const ayah = Number(parts[1] || 1);
        if(typeof openQuranSurah === "function" && Number.isFinite(surah) && surah > 0){
          openQuranSurah(surah, ayah);
        }
      };
    });
  }

  window.DARProphetsTest = {
    isEnabled: function(){ return ENABLED; },
    renderFeatureRow,
    renderLibrary,
    renderDetail,
    bindEvents,
    labelFromRoute
  };
})();
