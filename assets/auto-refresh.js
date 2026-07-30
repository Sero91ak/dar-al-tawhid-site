/* DAR AL TAWḤID – Auto-Refresh Modul
   Erkennt neue Posts im Hintergrund und zeigt ein Banner.
   Lädt Posts alle 60 Sekunden und aktualisiert die UI sofort. */

(function() {
  'use strict';

  const CHECK_INTERVAL = 60 * 1000; // 60 Sekunden
  const REPO_OWNER = '1dh2';
  const REPO_NAME = 'dar-al-tawhid';
  const POSTS_DIR = 'content/posts';
  const BRANCH = 'main';
  let refreshTimer = null;
  let lastPostCount = 0;
  let isChecking = false;

  function getCurrentPostCount() {
    // Wir greifen auf die globale Variable `posts` aus index.html zu
    if (typeof posts !== 'undefined' && Array.isArray(posts)) {
      return posts.length;
    }
    return 0;
  }

  function render() {
    if (typeof window.render === 'function') {
      window.render();
    }
  }

  function showNewPostsBanner(newCount) {
    const banner = document.getElementById('newPostsBanner');
    if (!banner) return;
    banner.querySelector('.new-posts-text').textContent = `${newCount} neue Beiträge verfügbar`;
    banner.classList.remove('hidden');
    banner.style.display = 'flex';
  }

  function hideNewPostsBanner() {
    const banner = document.getElementById('newPostsBanner');
    if (!banner) return;
    banner.classList.add('hidden');
    banner.style.display = 'none';
  }

  async function checkForNewPosts() {
    if (isChecking || !navigator.onLine) return;
    isChecking = true;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_DIR}?ref=${BRANCH}`,
        { cache: 'no-store', headers: { 'Accept': 'application/vnd.github.v3+json' } }
      );
      if (!response.ok) {
        isChecking = false;
        return;
      }

      const files = await response.json();
      const markdownCount = files.filter(f => f.type === 'file' && f.name.endsWith('.md')).length;
      const currentCount = getCurrentPostCount();

      if (markdownCount > currentCount) {
        const diff = markdownCount - currentCount;
        showNewPostsBanner(diff);
      }

    } catch (e) {
      console.warn('Auto-refresh check:', e);
    } finally {
      isChecking = false;
    }
  }

  async function refreshPosts() {
    hideNewPostsBanner();
    if (typeof window.loadPosts === 'function') {
      await window.loadPosts();
    }
    if (typeof window.persistOfflineLibrary === 'function') {
      window.persistOfflineLibrary();
    }
    render();
  }

  function initAutoRefresh() {
    lastPostCount = getCurrentPostCount();

    // Banner-Click-Handler
    const banner = document.getElementById('newPostsBanner');
    if (banner) {
      banner.addEventListener('click', () => {
        refreshPosts();
      });
    }

    // Sofort einmal prüfen
    setTimeout(checkForNewPosts, 3000);

    // Regelmäßig prüfen
    refreshTimer = setInterval(checkForNewPosts, CHECK_INTERVAL);

    // Bei Online-Event sofort prüfen
    window.addEventListener('online', () => {
      checkForNewPosts();
    });
  }

  // Auto-Refresh starten, wenn die Seite geladen ist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoRefresh);
  } else {
    initAutoRefresh();
  }

  // API für manuelle Prüfung
  window.DAR_AUTO_REFRESH = {
    check: checkForNewPosts,
    refresh: refreshPosts,
    hideBanner: hideNewPostsBanner,
    showBanner: showNewPostsBanner
  };
})();
