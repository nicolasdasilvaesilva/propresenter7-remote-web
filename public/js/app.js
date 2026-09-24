// ==========================================================================
// PROPRESENTER 7 REMOTE - APLICAÇÃO CLIENTE COM LOOKS E GRID DE MÍDIA
// ==========================================================================

const state = {
  activePlaylistType: 'media', // 'media' (ProContent / Mídia Exclusivo) ou 'presentation' (Culto)
  activePlaylistId: null,
  activePlaylistName: 'Carregando...',
  playlistItems: [],
  selectedItemIndex: -1, // Índice do item selecionado na playlist atual
  selectedItem: null, // Item selecionado atualmente
  currentPresentationSlides: [],
  currentSlideIndex: -1, // Slide atual dentro da apresentação selecionada
  liveSlideIndex: null,
  livePresentationUuid: null,
  lastActionSource: 'media', // 'media' ou 'presentation'
  looks: [],
  currentLook: null,
  isConnected: false,
  pollTimer: null
};

// Elementos do DOM
const dom = {
  // Header
  btnTogglePlaylists: document.getElementById('btn-toggle-playlists'),
  playlistTypeLabel: document.getElementById('playlist-type-label'),
  activePlaylistTitle: document.getElementById('active-playlist-title'),
  
  // Look Dropdown
  btnQuickLook: document.getElementById('btn-quick-look'),
  currentLookLabel: document.getElementById('current-look-label'),
  lookDropdownMenu: document.getElementById('look-dropdown-menu'),
  lookMenuList: document.getElementById('look-menu-list'),

  btnQuickBlack: document.getElementById('btn-quick-black'),
  btnQuickClear: document.getElementById('btn-quick-clear'),
  connectionStatus: document.getElementById('connection-status'),
  btnOpenSettings: document.getElementById('btn-open-settings'),

  // Preview & Transporte
  liveSlideImage: document.getElementById('live-slide-image'),
  previewTextOverlay: document.getElementById('preview-text-overlay'),
  previewPlaceholder: document.getElementById('preview-placeholder'),
  btnPrevSlide: document.getElementById('btn-prev-slide'),
  btnNextSlide: document.getElementById('btn-next-slide'),
  liveItemTitle: document.getElementById('live-item-title'),
  liveCueSubtitle: document.getElementById('live-cue-subtitle'),
  btnExpandPreview: document.getElementById('btn-expand-preview'),

  // Lista de Itens (Coluna Esquerda)
  playlistItemsContainer: document.getElementById('playlist-items-container'),
  itemsCounter: document.getElementById('items-counter'),
  itemsSectionHeader: document.getElementById('items-section-header'),

  // Slides (Coluna Direita - Tablet)
  selectedPresentationTitle: document.getElementById('selected-presentation-title'),
  selectedPresentationMeta: document.getElementById('selected-presentation-meta'),
  slidesGridContainer: document.getElementById('slides-grid-container'),
  btnTriggerFirstSlide: document.getElementById('btn-trigger-first-slide'),

  // Drawer de Pastas / Playlists
  drawerOverlay: document.getElementById('drawer-overlay'),
  btnCloseDrawer: document.getElementById('btn-close-drawer'),
  tabMediaPlaylists: document.getElementById('tab-media-playlists'),
  tabPresentationPlaylists: document.getElementById('tab-presentation-playlists'),
  drawerPlaylistsContainer: document.getElementById('drawer-playlists-container'),

  // Modal de Configurações
  settingsModal: document.getElementById('settings-modal'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  cfgProHost: document.getElementById('cfg-pro-host'),
  cfgProPort: document.getElementById('cfg-pro-port'),
  localIpsDisplay: document.getElementById('local-ips-display'),
  btnSaveSettings: document.getElementById('btn-save-settings')
};

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadServerInfo();
  loadLooks();
  loadInitialPlaylists();
  startStatusPolling();
  registerServiceWorker();
});

// Registro do Service Worker para PWA
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('ProPresenter PWA Service Worker registrado:', reg.scope))
      .catch(err => console.log('Erro ao registrar Service Worker:', err));
  }
}

// Suporte para prompt de instalação PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Exibe o botão de instalar app no header se estiver oculto
  const installBtn = document.getElementById('btn-install-pwa');
  if (installBtn) {
    installBtn.classList.remove('hidden');
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          installBtn.classList.add('hidden');
        }
        deferredPrompt = null;
      }
    });
  }
});

function setupEventListeners() {
  // Drawer de Playlists
  dom.btnTogglePlaylists.addEventListener('click', () => openDrawer());
  dom.btnCloseDrawer.addEventListener('click', () => closeDrawer());
  dom.drawerOverlay.addEventListener('click', (e) => {
    if (e.target === dom.drawerOverlay) closeDrawer();
  });

  dom.tabMediaPlaylists.addEventListener('click', () => switchDrawerTab('media'));
  dom.tabPresentationPlaylists.addEventListener('click', () => switchDrawerTab('presentation'));

  // Looks Dropdown
  dom.btnQuickLook.addEventListener('click', (e) => {
    e.stopPropagation();
    dom.lookDropdownMenu.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!dom.lookDropdownMenu.contains(e.target) && e.target !== dom.btnQuickLook) {
      dom.lookDropdownMenu.classList.remove('open');
    }
  });

  // Botões Rápidos
  dom.btnQuickClear.addEventListener('click', handleQuickClear);
  dom.btnQuickBlack.addEventListener('click', handleQuickBlack);

  // Navegação nas setas << e >>
  dom.btnPrevSlide.addEventListener('click', handlePrevItem);
  dom.btnNextSlide.addEventListener('click', handleNextItem);

  // Teclado
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      handleNextItem();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      handlePrevItem();
    } else if (e.key === 'Escape') {
      handleQuickClear();
    }
  });

  // Configurações
  dom.btnOpenSettings.addEventListener('click', () => dom.settingsModal.classList.add('open'));
  dom.btnCloseSettings.addEventListener('click', () => dom.settingsModal.classList.remove('open'));
  dom.btnSaveSettings.addEventListener('click', handleSaveSettings);

  // Botão Expandir Preview
  dom.btnExpandPreview.addEventListener('click', () => {
    const screen = dom.previewScreen || dom.liveSlideImage.parentElement;
    if (!document.fullscreenElement) {
      screen.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
}

// ==========================================================================
// COMUNICAÇÃO COM O PROXY DA API
// ==========================================================================
async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = { method };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`/api${endpoint}`, options);
    updateConnectionStatus(res.ok);
    if (!res.ok) {
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return res;
  } catch (err) {
    updateConnectionStatus(false);
    return null;
  }
}

function updateConnectionStatus(connected) {
  state.isConnected = connected;
  const dot = dom.connectionStatus.querySelector('.status-dot');
  if (connected) {
    dot.classList.remove('disconnected');
    dom.connectionStatus.title = 'Conectado ao ProPresenter 7';
  } else {
    dot.classList.add('disconnected');
    dom.connectionStatus.title = 'Sem conexão com o ProPresenter 7';
  }
}

// ==========================================================================
// LOOKS (APARÊNCIA DO PROPRESENTER)
// ==========================================================================
async function loadLooks() {
  const looks = await apiRequest('/v1/looks');
  const currentLookData = await apiRequest('/v1/look/current');

  if (looks && Array.isArray(looks)) {
    state.looks = looks;
    if (currentLookData && currentLookData.id) {
      state.currentLook = currentLookData.id;
      dom.currentLookLabel.textContent = currentLookData.id.name || 'Look';
    } else if (looks.length > 0) {
      dom.currentLookLabel.textContent = looks[0].id.name || 'Look';
    }
    renderLooksMenu();
  }
}

function renderLooksMenu() {
  dom.lookMenuList.innerHTML = '';
  state.looks.forEach(look => {
    const item = document.createElement('div');
    const isCurrent = state.currentLook && (state.currentLook.uuid === look.id.uuid || state.currentLook.name === look.id.name);
    item.className = `look-menu-item ${isCurrent ? 'active' : ''}`;
    item.innerHTML = `
      <span>${escapeHtml(look.id.name)}</span>
      ${isCurrent ? '<span class="check-icon">✓</span>' : ''}
    `;

    item.addEventListener('click', async () => {
      await triggerLook(look);
      dom.lookDropdownMenu.classList.remove('open');
    });

    dom.lookMenuList.appendChild(item);
  });
}

async function triggerLook(look) {
  const lookId = look.id.uuid || look.id.name || look.id.index;
  await apiRequest(`/v1/look/${encodeURIComponent(lookId)}/trigger`);
  state.currentLook = look.id;
  dom.currentLookLabel.textContent = look.id.name || 'Look';
  renderLooksMenu();
}

// ==========================================================================
// CARREGAR PLAYLISTS & PASTAS
// ==========================================================================
async function loadInitialPlaylists() {
  const savedType = localStorage.getItem('last_playlist_type') || 'media';
  const savedId = localStorage.getItem('last_playlist_id');

  await switchDrawerTab(savedType, false);

  if (savedId) {
    selectPlaylist(savedType, savedId, localStorage.getItem('last_playlist_name') || 'Playlist');
  } else {
    selectDefaultPlaylist(savedType);
  }
}

async function switchDrawerTab(type, render = true) {
  state.activePlaylistType = type;
  if (type === 'media') {
    dom.tabMediaPlaylists.classList.add('active');
    dom.tabPresentationPlaylists.classList.remove('active');
  } else {
    dom.tabPresentationPlaylists.classList.add('active');
    dom.tabMediaPlaylists.classList.remove('active');
  }
  await renderDrawerPlaylists(type);
}

async function renderDrawerPlaylists(type) {
  dom.drawerPlaylistsContainer.innerHTML = `
    <div class="loading-spinner-box">
      <div class="spinner"></div>
      <span>Buscando pastas de ${type === 'media' ? 'Mídia / ProContent' : 'Playlists de Culto'}...</span>
    </div>
  `;

  const endpoint = type === 'media' ? '/v1/media/playlists' : '/v1/playlists';
  const playlists = await apiRequest(endpoint);

  if (!playlists || !Array.isArray(playlists) || playlists.length === 0) {
    dom.drawerPlaylistsContainer.innerHTML = `
      <div class="slides-empty-notice">
        <p>Nenhuma playlist encontrada nesta categoria.</p>
      </div>
    `;
    return;
  }

  dom.drawerPlaylistsContainer.innerHTML = '';
  playlists.forEach(pl => {
    const item = document.createElement('div');
    const plId = pl.id.uuid || pl.id.index;
    const plName = pl.id.name;
    const isSelected = state.activePlaylistId == plId && state.activePlaylistType === type;

    item.className = `drawer-playlist-item ${isSelected ? 'selected' : ''}`;
    item.innerHTML = `
      <div class="drawer-item-title">${escapeHtml(plName)}</div>
      <span class="drawer-item-badge">${type === 'media' ? 'Mídia / ProContent' : 'Apresentação'}</span>
    `;

    item.addEventListener('click', () => {
      selectPlaylist(type, plId, plName);
      closeDrawer();
    });

    dom.drawerPlaylistsContainer.appendChild(item);
  });
}

async function selectDefaultPlaylist(type) {
  const endpoint = type === 'media' ? '/v1/media/playlists' : '/v1/playlists';
  const playlists = await apiRequest(endpoint);
  if (playlists && playlists.length > 0) {
    let target = playlists[0];
    if (type === 'media') {
      const pregacao = playlists.find(p => p.id.name.toUpperCase().includes('PREGAÇÃO') || p.id.name.toUpperCase().includes('PREGACAO'));
      if (pregacao) target = pregacao;
    }
    const plId = target.id.uuid || target.id.index;
    selectPlaylist(type, plId, target.id.name);
  }
}

async function selectPlaylist(type, id, name) {
  state.activePlaylistType = type;
  state.activePlaylistId = id;
  state.activePlaylistName = name;
  state.selectedItemIndex = -1;
  state.selectedItem = null;
  state.currentSlideIndex = -1;
  state.currentPresentationSlides = [];

  localStorage.setItem('last_playlist_type', type);
  localStorage.setItem('last_playlist_id', id);
  localStorage.setItem('last_playlist_name', name);

  dom.playlistTypeLabel.textContent = type === 'media' ? 'MÍDIA' : 'CULTO';
  dom.activePlaylistTitle.textContent = name;
  dom.itemsSectionHeader.textContent = name;

  await loadPlaylistItems(type, id);
}

// ==========================================================================
// CARREGAR ITENS DA PLAYLIST SELECIONADA
// ==========================================================================
async function loadPlaylistItems(type, id) {
  dom.playlistItemsContainer.innerHTML = `
    <div class="loading-spinner-box">
      <div class="spinner"></div>
      <span>Carregando itens de ${escapeHtml(state.activePlaylistName)}...</span>
    </div>
  `;

  const endpoint = type === 'media' ? `/v1/media/playlist/${id}` : `/v1/playlist/${id}`;
  const data = await apiRequest(endpoint);

  if (!data || !data.items || data.items.length === 0) {
    dom.playlistItemsContainer.innerHTML = `
      <div class="slides-empty-notice">
        <p>Esta pasta/playlist está vazia no ProPresenter.</p>
      </div>
    `;
    dom.itemsCounter.textContent = '0';
    clearSlidesColumn();
    return;
  }

  state.playlistItems = data.items;
  dom.itemsCounter.textContent = data.items.length;
  dom.playlistItemsContainer.innerHTML = '';

  data.items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'playlist-item-card';
    card.dataset.index = idx;
    card.dataset.uuid = item.id?.uuid || item.presentation_info?.presentation_uuid || '';

    let thumbHtml = '';
    const itemType = (item.type || '').toLowerCase();

    if (type === 'media') {
      const mediaUuid = item.id?.uuid;
      if (itemType === 'image' || itemType === 'video') {
        thumbHtml = `<img src="/api/v1/media/${mediaUuid}/thumbnail" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="thumb"><div class="fallback-icon hidden">${itemType === 'video' ? '🎬' : '🖼️'}</div>`;
      } else {
        thumbHtml = `<span class="fallback-icon">🎥</span>`;
      }
    } else {
      const presUuid = item.presentation_info?.presentation_uuid || item.id?.uuid;
      if (presUuid) {
        thumbHtml = `<img src="/api/v1/presentation/${presUuid}/thumbnail/0" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="slide"><div class="fallback-icon hidden">📑</div>`;
      } else {
        thumbHtml = `<span class="fallback-icon">📑</span>`;
      }
    }

    card.innerHTML = `
      <div class="item-thumb-box">${thumbHtml}</div>
      <div class="item-info-col">
        <div class="item-meta">${itemType || 'Item'} ${idx + 1}</div>
        <div class="item-name-row">
          <span class="item-index-badge">${idx + 1}</span>
          <span class="item-name" title="${escapeHtml(item.id?.name || item.name || '')}">${escapeHtml(item.id?.name || item.name || '')}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      handleItemClick(item, idx, card, true);
    });

    dom.playlistItemsContainer.appendChild(card);
  });

  // Se for MÍDIA, renderiza o grid completo com TODAS as imagens/vídeos na coluna da direita!
  if (type === 'media') {
    renderAllMediaItemsGrid(data.items, 0);
  }

  // Pré-seleciona o primeiro item visualmente
  if (data.items.length > 0) {
    const firstCard = dom.playlistItemsContainer.firstElementChild;
    handleItemClick(data.items[0], 0, firstCard, false);
  }
}

// ==========================================================================
// SELEÇÃO E DISPARO DE ITENS
// ==========================================================================
async function handleItemClick(item, idx, cardElement, shouldTrigger = true) {
  state.selectedItemIndex = idx;
  state.selectedItem = item;

  highlightPlaylistItem(idx);

  const itemName = item.id?.name || item.name || 'Item';
  dom.selectedPresentationTitle.textContent = itemName;

  // 1. CASO DE MÍDIA / PROCONTENT EXCLUSIVO (Área Vermelha):
  if (state.activePlaylistType === 'media') {
    state.lastActionSource = 'media';
    if (shouldTrigger) {
      await triggerMediaItem(item, idx);
    } else {
      updateMediaPreviewUI(item, idx);
    }
    highlightActiveMediaCard(idx);
    return;
  }

  // 2. CASO DE PLAYLIST DE CULTO (Apresentação tradicional):
  state.lastActionSource = 'presentation';
  const presUuid = item.presentation_info?.presentation_uuid || item.id?.uuid;
  if (presUuid) {
    await loadPresentationSlides(presUuid, itemName, idx, shouldTrigger);
  } else {
    if (shouldTrigger) {
      await apiRequest(`/v1/playlist/${state.activePlaylistId}/${idx}/trigger`);
    }
  }
}

function highlightPlaylistItem(idx) {
  document.querySelectorAll('.playlist-item-card').forEach(c => {
    if (parseInt(c.dataset.index) === idx) {
      c.classList.add('active');
      c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      c.classList.remove('active');
    }
  });
}

// Disparo de Mídia
async function triggerMediaItem(item, idx) {
  const mediaId = item.id?.uuid || item.id?.index || idx;
  await apiRequest(`/v1/media/playlist/${state.activePlaylistId}/${mediaId}/trigger`);
  updateMediaPreviewUI(item, idx);
}

function updateMediaPreviewUI(item, idx) {
  const total = state.playlistItems.length || 1;
  const itemName = item.id?.name || item.name || 'Mídia';
  const itemType = item.type || 'Mídia';

  dom.liveItemTitle.textContent = itemName;
  dom.liveCueSubtitle.textContent = `${state.activePlaylistName} • ${itemType} ${idx + 1} de ${total}`;

  dom.previewPlaceholder.classList.add('hidden');
  dom.liveSlideImage.classList.remove('hidden');

  if (item.id?.uuid) {
    dom.liveSlideImage.src = `/api/v1/media/${item.id.uuid}/thumbnail?t=${Date.now()}`;
    dom.liveSlideImage.onerror = () => {
      dom.liveSlideImage.classList.add('hidden');
      dom.previewTextOverlay.textContent = itemName;
    };
  } else {
    dom.liveSlideImage.classList.add('hidden');
    dom.previewTextOverlay.textContent = itemName;
  }
  dom.previewTextOverlay.textContent = '';
}

// ==========================================================================
// RENDERIZAR TODOS OS ITENS DE MÍDIA NA COLUNA DA DIREITA (CONFORME SOLICITADO NO ÁUDIO)
// ==========================================================================
function renderAllMediaItemsGrid(items, activeIdx = 0) {
  dom.selectedPresentationTitle.textContent = state.activePlaylistName;
  dom.selectedPresentationMeta.textContent = `${items.length} itens na pasta de mídia`;
  dom.slidesGridContainer.innerHTML = '';

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    const isLive = idx === activeIdx;
    card.className = `slide-card-item ${isLive ? 'live' : ''}`;
    card.dataset.mediaIndex = idx;

    const itemName = item.id?.name || item.name || `Mídia ${idx + 1}`;
    const mediaUuid = item.id?.uuid;
    const thumbUrl = mediaUuid ? `/api/v1/media/${mediaUuid}/thumbnail` : '';

    card.innerHTML = `
      <div class="slide-index-label">${idx + 1}</div>
      <div class="slide-preview-wrapper" style="max-height: 280px;">
        <img class="slide-thumbnail-img" src="${thumbUrl}" onerror="this.style.display='none';" alt="${escapeHtml(itemName)}" loading="lazy">
        <div class="slide-text-overlay">${escapeHtml(itemName)}</div>
        <div class="live-badge-tag ${isLive ? '' : 'hidden'}">AO VIVO</div>
      </div>
    `;

    card.addEventListener('click', () => {
      const leftCard = dom.playlistItemsContainer.children[idx];
      handleItemClick(item, idx, leftCard, true);
    });

    dom.slidesGridContainer.appendChild(card);
  });
}

function highlightActiveMediaCard(activeIdx) {
  document.querySelectorAll('.slide-card-item').forEach(card => {
    const idx = parseInt(card.dataset.mediaIndex);
    if (idx === activeIdx) {
      card.classList.add('live');
      const badge = card.querySelector('.live-badge-tag');
      if (badge) badge.classList.remove('hidden');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      card.classList.remove('live');
      const badge = card.querySelector('.live-badge-tag');
      if (badge) badge.classList.add('hidden');
    }
  });
}

// ==========================================================================
// CARREGAR E RENDERIZAR SLIDES (COLUNA DA DIREITA NO TABLET PARA CULTO)
// ==========================================================================
async function loadPresentationSlides(presUuid, presName, itemIndex, shouldTriggerFirst = false) {
  dom.slidesGridContainer.innerHTML = `
    <div class="loading-spinner-box">
      <div class="spinner"></div>
      <span>Carregando slides de ${escapeHtml(presName)}...</span>
    </div>
  `;

  const presData = await apiRequest(`/v1/presentation/${presUuid}`);
  if (!presData || !presData.presentation) {
    dom.slidesGridContainer.innerHTML = `
      <div class="slides-empty-notice">
        <p>Não foi possível carregar os slides desta apresentação.</p>
      </div>
    `;
    return;
  }

  const pres = presData.presentation;
  const groups = pres.groups || [];
  let allSlides = [];
  let globalCueIndex = 0;

  groups.forEach(g => {
    const groupName = g.name || '';
    const slides = g.slides || [];
    slides.forEach(s => {
      allSlides.push({
        groupName: groupName,
        text: s.text || '',
        notes: s.notes || '',
        cueIndex: globalCueIndex,
        presUuid: presUuid
      });
      globalCueIndex++;
    });
  });

  state.currentPresentationSlides = allSlides;
  dom.selectedPresentationMeta.textContent = `${allSlides.length} slides na apresentação`;

  if (allSlides.length === 0) {
    dom.slidesGridContainer.innerHTML = `
      <div class="slides-empty-notice">
        <p>Esta apresentação não contém slides.</p>
      </div>
    `;
    return;
  }

  dom.slidesGridContainer.innerHTML = '';

  allSlides.forEach((slide) => {
    const card = document.createElement('div');
    card.className = 'slide-card-item';
    card.dataset.cue = slide.cueIndex;

    const thumbUrl = `/api/v1/presentation/${presUuid}/thumbnail/${slide.cueIndex}`;

    card.innerHTML = `
      <div class="slide-index-label">${slide.cueIndex + 1}</div>
      <div class="slide-preview-wrapper">
        <img class="slide-thumbnail-img" src="${thumbUrl}" alt="Slide ${slide.cueIndex + 1}" loading="lazy">
        ${slide.text ? `<div class="slide-text-overlay">${escapeHtml(slide.text)}</div>` : ''}
        <div class="live-badge-tag hidden">AO VIVO</div>
      </div>
    `;

    card.addEventListener('click', () => {
      triggerSlideCue(presUuid, slide.cueIndex, presName, slide.text, allSlides.length);
    });

    dom.slidesGridContainer.appendChild(card);
  });

  if (shouldTriggerFirst) {
    triggerSlideCue(presUuid, 0, presName, allSlides[0]?.text || '', allSlides.length);
  }
}

// Disparar slide individual ao clicar
async function triggerSlideCue(presUuid, cueIndex, presName, slideText = '', totalSlides = 1) {
  state.lastActionSource = 'presentation';
  state.currentSlideIndex = cueIndex;
  state.liveSlideIndex = cueIndex;
  state.livePresentationUuid = presUuid;

  await apiRequest(`/v1/presentation/${presUuid}/${cueIndex}/trigger`);

  highlightActiveSlide(cueIndex);

  dom.liveItemTitle.textContent = presName || dom.selectedPresentationTitle.textContent;
  dom.liveCueSubtitle.textContent = `Slide ${cueIndex + 1} de ${totalSlides || state.currentPresentationSlides.length}`;

  dom.previewPlaceholder.classList.add('hidden');
  dom.liveSlideImage.classList.remove('hidden');
  dom.liveSlideImage.src = `/api/v1/presentation/${presUuid}/thumbnail/${cueIndex}?t=${Date.now()}`;
  dom.previewTextOverlay.textContent = slideText || '';
}

function highlightActiveSlide(cueIndex) {
  document.querySelectorAll('.slide-card-item').forEach(card => {
    if (parseInt(card.dataset.cue) === cueIndex) {
      card.classList.add('live');
      const badge = card.querySelector('.live-badge-tag');
      if (badge) badge.classList.remove('hidden');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      card.classList.remove('live');
      const badge = card.querySelector('.live-badge-tag');
      if (badge) badge.classList.add('hidden');
    }
  });
}

function clearSlidesColumn() {
  dom.selectedPresentationTitle.textContent = 'Nenhuma seleção';
  dom.selectedPresentationMeta.textContent = '0 slides';
  dom.slidesGridContainer.innerHTML = `
    <div class="slides-empty-notice">
      <p>Selecione um item da lista à esquerda para carregar os slides.</p>
    </div>
  `;
}

// ==========================================================================
// NAVEGAÇÃO INTELIGENTE DAS SETAS << e >>
// ==========================================================================
async function handleNextItem() {
  // SE ESTIVER EM MÍDIA / PROCONTENT EXCLUSIVO:
  if (state.activePlaylistType === 'media') {
    if (state.playlistItems.length === 0) return;
    let nextIdx = state.selectedItemIndex + 1;
    if (nextIdx >= state.playlistItems.length) {
      nextIdx = 0;
    }
    const nextItem = state.playlistItems[nextIdx];
    const cardEl = dom.playlistItemsContainer.children[nextIdx];
    await handleItemClick(nextItem, nextIdx, cardEl, true);
    return;
  }

  // SE ESTIVER EM PLAYLIST DE CULTO (Apresentação):
  if (state.currentPresentationSlides && state.currentPresentationSlides.length > 0) {
    let nextSlide = state.currentSlideIndex + 1;
    if (nextSlide < state.currentPresentationSlides.length) {
      const slide = state.currentPresentationSlides[nextSlide];
      await triggerSlideCue(slide.presUuid, nextSlide, dom.selectedPresentationTitle.textContent, slide.text, state.currentPresentationSlides.length);
      return;
    }
  }

  await apiRequest('/v1/trigger/next');
  fetchLiveSlideStatus();
}

async function handlePrevItem() {
  // SE ESTIVER EM MÍDIA / PROCONTENT EXCLUSIVO:
  if (state.activePlaylistType === 'media') {
    if (state.playlistItems.length === 0) return;
    let prevIdx = state.selectedItemIndex - 1;
    if (prevIdx < 0) {
      prevIdx = state.playlistItems.length - 1;
    }
    const prevItem = state.playlistItems[prevIdx];
    const cardEl = dom.playlistItemsContainer.children[prevIdx];
    await handleItemClick(prevItem, prevIdx, cardEl, true);
    return;
  }

  // SE ESTIVER EM PLAYLIST DE CULTO (Apresentação):
  if (state.currentPresentationSlides && state.currentPresentationSlides.length > 0) {
    let prevSlide = state.currentSlideIndex - 1;
    if (prevSlide >= 0) {
      const slide = state.currentPresentationSlides[prevSlide];
      await triggerSlideCue(slide.presUuid, prevSlide, dom.selectedPresentationTitle.textContent, slide.text, state.currentPresentationSlides.length);
      return;
    }
  }

  await apiRequest('/v1/trigger/previous');
  fetchLiveSlideStatus();
}

// ==========================================================================
// AÇÕES RÁPIDAS (CLEAR, BLACK)
// ==========================================================================
async function handleQuickClear() {
  await apiRequest('/v1/clear/group/0/trigger');
  await apiRequest('/v1/clear/layer/slide');
  await apiRequest('/v1/clear/layer/media');
  await apiRequest('/v1/clear/layer/video_input');

  dom.liveSlideImage.src = '';
  dom.liveSlideImage.classList.add('hidden');
  dom.previewTextOverlay.textContent = '';
  dom.previewPlaceholder.classList.remove('hidden');
  dom.liveItemTitle.textContent = 'Telas Limpas';
  dom.liveCueSubtitle.textContent = 'Nenhum slide no ar';

  document.querySelectorAll('.slide-card-item').forEach(card => {
    card.classList.remove('live');
    const badge = card.querySelector('.live-badge-tag');
    if (badge) badge.classList.add('hidden');
  });
}

async function handleQuickBlack() {
  await apiRequest('/v1/clear/layer/slide');
  await apiRequest('/v1/clear/layer/media');
  dom.liveItemTitle.textContent = 'Blackout Ativo';
  dom.liveCueSubtitle.textContent = 'Saída cortada';
}

// ==========================================================================
// POLLING DE STATUS AO VIVO
// ==========================================================================
function startStatusPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(fetchLiveSlideStatus, 1000);
}

async function fetchLiveSlideStatus() {
  if (state.lastActionSource === 'media') {
    return;
  }

  const slideIndexData = await apiRequest('/v1/presentation/slide_index');
  if (slideIndexData && slideIndexData.presentation_index) {
    const pIndex = slideIndexData.presentation_index;
    const curIdx = pIndex.index;
    const presUuid = pIndex.presentation_id?.uuid;
    const presName = pIndex.presentation_id?.name;
    const totalCues = pIndex.total_cues || 1;

    if (curIdx !== state.liveSlideIndex || presUuid !== state.livePresentationUuid) {
      state.liveSlideIndex = curIdx;
      state.currentSlideIndex = curIdx;
      state.livePresentationUuid = presUuid;

      dom.liveItemTitle.textContent = presName || 'Apresentação';
      dom.liveCueSubtitle.textContent = `Slide ${curIdx + 1} de ${totalCues}`;

      dom.previewPlaceholder.classList.add('hidden');
      dom.liveSlideImage.classList.remove('hidden');
      dom.liveSlideImage.src = `/api/v1/presentation/${presUuid}/thumbnail/${curIdx}?t=${Date.now()}`;

      highlightActiveSlide(curIdx);
    }
  }
}

// ==========================================================================
// DRAWER E CONFIGURAÇÕES
// ==========================================================================
function openDrawer() {
  dom.drawerOverlay.classList.add('open');
}

function closeDrawer() {
  dom.drawerOverlay.classList.remove('open');
}

async function loadServerInfo() {
  const data = await apiRequest('/server-info');
  if (data) {
    dom.cfgProHost.value = data.proHost;
    dom.cfgProPort.value = data.proPort;
    if (data.ips && data.ips.length > 0) {
      const links = data.ips.map(n => `<code>http://${n.ip}:3000</code> (${n.name})`).join('<br>');
      dom.localIpsDisplay.innerHTML = `Acesse no Tablet / Celular:<br>${links}`;
    }
  }
}

async function handleSaveSettings() {
  const host = dom.cfgProHost.value.trim();
  const port = parseInt(dom.cfgProPort.value.trim()) || 50820;

  const res = await fetch('/api/set-pro-host', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host, port })
  });

  if (res.ok) {
    dom.settingsModal.classList.remove('open');
    loadInitialPlaylists();
  } else {
    alert('Erro ao salvar configurações.');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
