/* ===================================
   Social Hub — Tab-based navigation
   Chaque onglet = une webview (Electron) ou iframe (web)
   =================================== */

// Détection Electron vs navigateur web
const IS_ELECTRON = navigator.userAgent.toLowerCase().includes('electron');

// ===== PLATFORM DEFINITIONS =====
const PLATFORMS = {
  youtube: {
    name: 'YouTube',
    icon: 'fa-brands fa-youtube',
    url: 'https://www.youtube.com',
    color: '#ff0000',
    embeddable: true,
    domain: 'youtube.com'
  },
  facebook: {
    name: 'Facebook',
    icon: 'fa-brands fa-facebook-f',
    url: 'https://www.facebook.com',
    color: '#1877f2',
    embeddable: true,
    domain: 'facebook.com'
  },
  instagram: {
    name: 'Instagram',
    icon: 'fa-brands fa-instagram',
    url: 'https://www.instagram.com',
    color: '#e4405f',
    embeddable: true,
    domain: 'instagram.com'
  },
  tiktok: {
    name: 'TikTok',
    icon: 'fa-brands fa-tiktok',
    url: 'https://www.tiktok.com',
    color: '#69c9d0',
    embeddable: true,
    domain: 'tiktok.com'
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'fa-brands fa-x-twitter',
    url: 'https://x.com',
    color: '#ffffff',
    embeddable: true,
    domain: 'x.com'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'fa-brands fa-linkedin-in',
    url: 'https://www.linkedin.com',
    color: '#0a66c2',
    embeddable: true,
    domain: 'linkedin.com'
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: 'fa-brands fa-whatsapp',
    url: 'https://web.whatsapp.com',
    color: '#25d366',
    embeddable: true,
    domain: 'web.whatsapp.com'
  },
  messenger: {
    name: 'Messenger',
    icon: 'fa-brands fa-facebook-messenger',
    url: 'https://www.messenger.com',
    color: '#0084ff',
    embeddable: true,
    domain: 'messenger.com'
  },
  gmail: {
    name: 'Gmail',
    icon: 'fa-solid fa-envelope',
    url: 'https://mail.google.com',
    color: '#ea4335',
    embeddable: true,
    domain: 'mail.google.com'
  },
  drive: {
    name: 'Google Drive',
    icon: 'fa-brands fa-google-drive',
    url: 'https://drive.google.com',
    color: '#4285f4',
    embeddable: true,
    domain: 'drive.google.com'
  },
  maps: {
    name: 'Google Maps',
    icon: 'fa-solid fa-map-location-dot',
    url: 'https://www.google.com/maps',
    color: '#34a853',
    embeddable: true,
    domain: 'google.com/maps'
  }
};

// ===== TAB MANAGER =====
let tabs = [];          // { id, platformId, webview, tabEl }
let activeTabId = null;
let nextTabId = 1;

/**
 * Crée un nouvel onglet pour une plateforme donnée.
 * Si un onglet pour cette plateforme existe déjà → on l'active.
 * @param {string} platformId
 * @param {boolean} forceNew  - Si true, crée un nouvel onglet même si déjà ouvert
 */
function openTab(platformId, forceNew = false) {
  const platform = PLATFORMS[platformId];
  if (!platform) return;

  // Si l'onglet existe déjà et qu'on ne force pas un nouveau, on l'active
  if (!forceNew) {
    const existing = tabs.find(t => t.platformId === platformId);
    if (existing) {
      activateTab(existing.id);
      return;
    }
  }

  const tabId = nextTabId++;

  // ── Créer la webview ou iframe selon l'environnement ──
  let view;
  if (IS_ELECTRON) {
    view = document.createElement('webview');
    view.setAttribute('allowpopups', '');
    view.src = platform.embeddable ? platform.url : 'about:blank';
  } else {
    view = document.createElement('iframe');
    view.src = platform.embeddable ? platform.url : 'about:blank';
    view.setAttribute('allowfullscreen', '');
    view.setAttribute('allow', 'camera; microphone; clipboard-write; encrypted-media; fullscreen');
  }
  view.style.cssText = `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    border: none; background: #fff;
    display: none;
  `;

  // ── Créer le loader ──
  const loader = document.createElement('div');
  loader.className = 'frame-loader';
  loader.innerHTML = `<div class="loader-spinner"></div><p>Chargement...</p>`;
  loader.dataset.tabId = tabId;

  // ── Créer la quick-launch (pour plateformes non-intégrables) ──
  const ql = createQuickLaunch(platformId, tabId);
  ql.style.display = 'none';

  // ── Assemblage dans frameContainer ──
  const frameContainer = document.getElementById('frameContainer');
  const wrapper = document.createElement('div');
  wrapper.className = 'tab-view';
  wrapper.dataset.tabId = tabId;
  wrapper.style.cssText = `
    position: absolute; inset: 0;
    display: none;
    flex-direction: column;
    background: var(--bg-dark);
  `;
  wrapper.appendChild(loader);
  wrapper.appendChild(view);
  wrapper.appendChild(ql);
  frameContainer.appendChild(wrapper);

  // ── Loader events ──
  if (IS_ELECTRON && platform.embeddable) {
    // Electron webview : peut charger les sites normalement
    view.addEventListener('did-finish-load', () => {
      loader.classList.add('hidden');
      view.style.display = 'flex';
    });
    view.addEventListener('did-fail-load', () => {
      loader.classList.add('hidden');
      view.style.display = 'none';
      ql.style.display = 'flex';
    });
    setTimeout(() => {
      if (!loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
        view.style.display = 'flex';
      }
    }, 8000);
  } else {
    // Mode navigateur web : les sites bloquent les iframes (X-Frame-Options)
    // → afficher directement le quick-launch
    loader.classList.add('hidden');
    view.style.display = 'none';
    ql.style.display = 'flex';
  }

  // ── Créer l'élément tab dans la barre ──
  const tabEl = document.createElement('div');
  tabEl.className = 'sh-tab new-tab';
  tabEl.dataset.tabId = tabId;
  tabEl.innerHTML = `
    <i class="tab-favicon ${platform.icon}" style="color:${platform.color}"></i>
    <span class="tab-title">${platform.name}</span>
    <button class="tab-close" title="Fermer" onclick="closeTab(${tabId}, event)">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  tabEl.addEventListener('click', (e) => {
    if (!e.target.closest('.tab-close')) activateTab(tabId);
  });

  // Retirer l'animation après qu'elle se termine
  tabEl.addEventListener('animationend', () => tabEl.classList.remove('new-tab'), { once: true });

  document.getElementById('tabList').appendChild(tabEl);

  // ── Enregistrer l'onglet ──
  tabs.push({ id: tabId, platformId, view, tabEl, wrapper });

  // ── Activer ──
  activateTab(tabId);

  // Scroll vers le nouvel onglet
  tabEl.scrollIntoView({ behavior: 'smooth', inline: 'end' });
}

/** Active un onglet par son ID */
function activateTab(tabId) {
  activeTabId = tabId;
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  // Masquer tous les wrappers
  document.querySelectorAll('.tab-view').forEach(w => {
    w.style.display = 'none';
  });

  // Afficher le bon
  tab.wrapper.style.display = 'block';

  // Mettre à jour les classes tab
  document.querySelectorAll('.sh-tab').forEach(el => el.classList.remove('active'));
  tab.tabEl.classList.add('active');

  // Mettre à jour la sidebar
  const platform = PLATFORMS[tab.platformId];
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.platform === tab.platformId);
  });
  document.querySelectorAll('.mob-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.platform === tab.platformId);
  });

  // Mettre à jour la toolbar
  const platformIcon = document.getElementById('platformIcon');
  const platformTitle = document.getElementById('platformTitle');
  const urlText = document.getElementById('urlText');
  const mobileName = document.getElementById('mobilePlatformName');

  if (platformIcon) platformIcon.className = platform.icon;
  if (platformTitle) platformTitle.textContent = platform.name;
  if (urlText) urlText.textContent = platform.domain;
  if (mobileName) mobileName.textContent = platform.name;

  // Sauvegarder la session
  localStorage.setItem('sh_active_platform', tab.platformId);
}

/** Ferme un onglet */
function closeTab(tabId, event) {
  if (event) event.stopPropagation();

  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;

  const tab = tabs[index];

  // Animation de sortie
  tab.tabEl.style.transition = 'all 0.18s ease';
  tab.tabEl.style.transform = 'scale(0.85)';
  tab.tabEl.style.opacity = '0';

  setTimeout(() => {
    tab.tabEl.remove();
    tab.wrapper.remove();
    tabs.splice(index, 1);

    // S'il reste des onglets, activer le voisin
    if (tabs.length > 0) {
      const nextIndex = Math.min(index, tabs.length - 1);
      activateTab(tabs[nextIndex].id);
    } else {
      // Plus d'onglets : ouvrir l'accueil YouTube
      openTab('youtube');
    }
  }, 180);
}

/** Ouvre un nouvel onglet via la sidebar (appelé depuis switchPlatform) */
function switchPlatform(platformId) {
  openTab(platformId, false); // Pas de doublon
  closeSidebar();
}

/** Bouton "+" → ouvre un menu ou YouTube par défaut */
function openNewTab() {
  // Ouvrir YouTube dans un nouvel onglet (forceNew = true)
  const platformKeys = Object.keys(PLATFORMS);
  // Trouver une plateforme non encore ouverte
  const unused = platformKeys.find(id => !tabs.some(t => t.platformId === id));
  openTab(unused || 'youtube', true);
}

// ===== QUICK LAUNCH =====
function createQuickLaunch(platformId, tabId) {
  const platform = PLATFORMS[platformId];
  const el = document.createElement('div');
  el.className = 'quick-launch';
  el.innerHTML = `
    <div class="ql-icon"><i class="${platform.icon}" style="color:${platform.color}"></i></div>
    <div class="ql-info-banner">
      <i class="fa-solid fa-shield-halved"></i>
      Ce site bloque l'intégration pour des raisons de sécurité
    </div>
    <h2>${platform.name}</h2>
    <p>Cliquez le bouton ci-dessous pour l'ouvrir dans le navigateur externe.</p>
    <a class="ql-btn" href="${platform.url}" target="_blank" rel="noopener"
       style="background: linear-gradient(135deg, ${platform.color}, ${adjustColor(platform.color, 30)})">
      <i class="fa-solid fa-up-right-from-square"></i> Ouvrir ${platform.name}
    </a>
    <div class="ql-shortcuts">
      <h3>Accès rapide</h3>
      <div class="ql-grid">
        ${Object.entries(PLATFORMS)
          .filter(([id]) => id !== platformId)
          .slice(0, 6)
          .map(([id, p]) => `
            <div class="ql-shortcut-card" onclick="openTab('${id}', false)">
              <i class="${p.icon}" style="color:${p.color}"></i>
              <span>${p.name}</span>
            </div>
          `).join('')}
      </div>
    </div>
  `;
  return el;
}

// ===== TOOLBAR ACTIONS =====
function refreshFrame() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const loader = tab.wrapper.querySelector('.frame-loader');
  if (loader) loader.classList.remove('hidden');
  tab.view.style.display = 'none';
  tab.view.src = tab.view.src; // reload
}

function openExternalTab() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const platform = PLATFORMS[tab.platformId];
  if (platform) window.open(platform.url, '_blank', 'noopener');
}

function goFullscreen() {
  const container = document.getElementById('frameContainer');
  if (!container) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    container.requestFullscreen().catch(() => {});
  }
}

// ===== MOBILE SIDEBAR =====
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    overlay.style.display = 'block';
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
  setTimeout(() => {
    if (!overlay.classList.contains('visible')) overlay.style.display = 'none';
  }, 300);
}

// ===== UTILITY =====
function adjustColor(hex, amount) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Ouvrir la dernière plateforme utilisée, sinon YouTube
  const last = localStorage.getItem('sh_active_platform');
  openTab((last && PLATFORMS[last]) ? last : 'youtube');
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  // Ctrl+T : nouvel onglet
  if (e.ctrlKey && e.key === 't') {
    e.preventDefault();
    openNewTab();
    return;
  }

  // Ctrl+W : fermer l'onglet actif
  if (e.ctrlKey && e.key === 'w') {
    e.preventDefault();
    if (activeTabId !== null) closeTab(activeTabId, null);
    return;
  }

  // Ctrl+Tab / Ctrl+Shift+Tab : naviguer entre onglets
  if (e.ctrlKey && e.key === 'Tab') {
    e.preventDefault();
    const idx = tabs.findIndex(t => t.id === activeTabId);
    if (tabs.length > 1) {
      const next = e.shiftKey
        ? (idx - 1 + tabs.length) % tabs.length
        : (idx + 1) % tabs.length;
      activateTab(tabs[next].id);
    }
    return;
  }

  // Ctrl+1-9 : aller à l'onglet N
  if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    const index = parseInt(e.key) - 1;
    if (index < tabs.length) activateTab(tabs[index].id);
    return;
  }

  // Ctrl+R : refresh
  if (e.ctrlKey && e.key === 'r') {
    e.preventDefault();
    refreshFrame();
    return;
  }

  // Escape : fermer sidebar mobile
  if (e.key === 'Escape') closeSidebar();
});
