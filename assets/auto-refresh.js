/* DAR AL TAWḤID – Auto-Refresh Modul (Legacy)
   Nutzt dieselbe Index-Signatur wie VERSION_UPDATE_GUARD in index.html. */

(function() {
  'use strict';

  const CHECK_INTERVAL = 60 * 1000;

  function hideNewPostsBanner() {
    if (typeof window.DAR_AUTO_REFRESH?.hideAllBanners === 'function') {
      window.DAR_AUTO_REFRESH.hideAllBanners();
    }
  }

  async function checkForNewPosts() {
    if (!navigator.onLine) return;
    if (typeof window.DAR_AUTO_REFRESH?.check === 'function') {
      await window.DAR_AUTO_REFRESH.check();
    }
  }

  async function refreshPosts() {
    if (typeof window.DAR_AUTO_REFRESH?.refresh === 'function') {
      await window.DAR_AUTO_REFRESH.refresh();
    }
  }

  function initAutoRefresh() {
    const banner = document.getElementById('newPostsBanner');
    if (banner && !banner.dataset.autoRefreshBound) {
      banner.dataset.autoRefreshBound = '1';
      banner.addEventListener('click', () => { refreshPosts(); });
    }
    setTimeout(checkForNewPosts, 3000);
    setInterval(checkForNewPosts, CHECK_INTERVAL);
    window.addEventListener('online', checkForNewPosts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoRefresh);
  } else {
    initAutoRefresh();
  }

  window.DAR_AUTO_REFRESH_LEGACY = {
    check: checkForNewPosts,
    refresh: refreshPosts,
    hideBanner: hideNewPostsBanner
  };
})();
