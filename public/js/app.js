// ==========================================================================
// PROPRESENTER 7 REMOTE - CLIENTE WEB COM MACROS, CLEAR LAYERS E BUSCA
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
  macros: [],
  audio: {
    playlists: [],
    activePlaylistId: null,
    activePlaylistName: '',
    tracks: [],
    currentTrackUuid: null,
    currentTrackName: '',
    isPlaying: false
  },
  messages: {
    list: [],
    activeMessageUuid: null,
    activeTemplate: null,
    tokenValues: {}
  },
  liveMediaUuid: null,
  liveMediaIndex: -1,
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

  // Macros
  btnQuickMacro: document.getElementById('btn-quick-macro'),
  btnMobileMacro: document.getElementById('btn-mobile-macro'),
  macroModal: document.getElementById('macro-modal'),
  btnCloseMacro: document.getElementById('btn-close-macro'),
  macroGridContainer: document.getElementById('macro-grid-container'),
  macroBadgeCount: document.getElementById('macro-badge-count'),

  // Áudio
  btnQuickAudio: document.getElementById('btn-quick-audio'),
  btnMobileAudio: document.getElementById('btn-mobile-audio'),
  audioModal: document.getElementById('audio-modal'),
  btnCloseAudio: document.getElementById('btn-close-audio'),
  audioPlaylistsTabs: document.getElementById('audio-playlists-tabs'),
  audioTracksContainer: document.getElementById('audio-tracks-container'),
  audioBadgeCount: document.getElementById('audio-badge-count'),
  audioCurrentTrackName: document.getElementById('audio-current-track-name'),
  audioCurrentTrackMeta: document.getElementById('audio-current-track-meta'),
  audioBarVisualizer: document.getElementById('audio-bar-visualizer'),
  btnAudioPrev: document.getElementById('btn-audio-prev'),
  btnAudioPlayPause: document.getElementById('btn-audio-playpause'),
  btnAudioNext: document.getElementById('btn-audio-next'),
  btnAudioClear: document.getElementById('btn-audio-clear'),
  audioIconPlay: document.getElementById('audio-icon-play'),
  audioIconPause: document.getElementById('audio-icon-pause'),
  headerAudioPlayingIndicator: document.getElementById('header-audio-playing-indicator'),
  mobileAudioPlayingIndicator: document.getElementById('mobile-audio-playing-indicator'),

  // Mensagens
  btnQuickMessages: document.getElementById('btn-quick-messages'),
  btnMobileMessages: document.getElementById('btn-mobile-messages'),
  messagesModal: document.getElementById('messages-modal'),
  btnCloseMessages: document.getElementById('btn-close-messages'),
  messagesTabs: document.getElementById('messages-tabs'),
  messagesBodyContainer: document.getElementById('messages-body-container'),
  messagesBadgeCount: document.getElementById('messages-badge-count'),
  btnTriggerMessage: document.getElementById('btn-trigger-message'),
  btnClearMessage: document.getElementById('btn-clear-message'),
  msgStatusIndicator: document.getElementById('msg-status-indicator'),

  // Clear Layers
  btnQuickClear: document.getElementById('btn-quick-clear'),
  btnMobileClear: document.getElementById('btn-mobile-clear'),
  clearDropdownMenu: document.getElementById('clear-dropdown-menu'),

  // Ferramentas & Submenu (Stage, Timers, Inputs, Props, Live)
  btnQuickTools: document.getElementById('btn-quick-tools'),
  toolsDropdownMenu: document.getElementById('tools-dropdown-menu'),
  btnMobileTools: document.getElementById('btn-mobile-tools'),
  mobileToolsDropdownMenu: document.getElementById('mobile-tools-dropdown-menu'),
  toolItemStage: document.getElementById('tool-item-stage'),
  toolItemTimers: document.getElementById('tool-item-timers'),
  toolItemVideoInputs: document.getElementById('tool-item-video-inputs'),
  toolItemProps: document.getElementById('tool-item-props'),
  toolItemCapture: document.getElementById('tool-item-capture'),
  mobileToolItemStage: document.getElementById('mobile-tool-item-stage'),
  mobileToolItemTimers: document.getElementById('mobile-tool-item-timers'),
  mobileToolItemVideoInputs: document.getElementById('mobile-tool-item-video-inputs'),
  mobileToolItemProps: document.getElementById('mobile-tool-item-props'),
  mobileToolItemCapture: document.getElementById('mobile-tool-item-capture'),

  // Modais de Ferramentas
  stageModal: document.getElementById('stage-modal'),
  btnCloseStage: document.getElementById('btn-close-stage'),
  stageBodyContainer: document.getElementById('stage-body-container'),
  stageBadgeCount: document.getElementById('stage-badge-count'),

  timersModal: document.getElementById('timers-modal'),
  btnCloseTimers: document.getElementById('btn-close-timers'),
  timersBodyContainer: document.getElementById('timers-body-container'),
  timersBadgeCount: document.getElementById('timers-badge-count'),

  videoInputsModal: document.getElementById('video-inputs-modal'),
  btnCloseVideoInputs: document.getElementById('btn-close-video-inputs'),
  videoInputsBodyContainer: document.getElementById('video-inputs-body-container'),
  videoInputsBadgeCount: document.getElementById('video-inputs-badge-count'),

  propsModal: document.getElementById('props-modal'),
  btnCloseProps: document.getElementById('btn-close-props'),
  propsBodyContainer: document.getElementById('props-body-container'),
  propsBadgeCount: document.getElementById('props-badge-count'),

  captureModal: document.getElementById('capture-modal'),
  btnCloseCapture: document.getElementById('btn-close-capture'),
  captureBodyContainer: document.getElementById('capture-body-container'),
  captureBadgeCount: document.getElementById('capture-badge-count'),

  // Mobile Action Bar & Dropdowns
  btnMobileLook: document.getElementById('btn-mobile-look'),
  mobileLookLabel: document.getElementById('mobile-look-label'),
  mobileLookDropdownMenu: document.getElementById('mobile-look-dropdown-menu'),
  mobileLookMenuList: document.getElementById('mobile-look-menu-list'),
  mobileClearDropdownMenu: document.getElementById('mobile-clear-dropdown-menu'),

  // Pesquisa de Músicas
  desktopSearchInput: document.getElementById('desktop-search-input'),
  desktopSearchResults: document.getElementById('desktop-search-results'),
  btnDesktopClearSearch: document.getElementById('btn-desktop-clear-search'),
  mobileSearchInput: document.getElementById('mobile-search-input'),
  mobileSearchResults: document.getElementById('mobile-search-results'),
  btnMobileClearSearch: document.getElementById('btn-mobile-clear-search'),

  // Status & Settings
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
  btnSaveSettings: document.getElementById('btn-save-settings'),

  // Instalação PWA Multiplataforma (iPad, Tablet, Android, iOS, PC)
  btnInstallPwa: document.getElementById('btn-install-pwa'),
  btnMobileInstall: document.getElementById('btn-mobile-install'),
  iosInstallModal: document.getElementById('ios-install-modal'),
  btnCloseIosInstall: document.getElementById('btn-close-ios-install'),
  btnDismissIosInstall: document.getElementById('btn-dismiss-ios-install'),
  tabPwaIos: document.getElementById('tab-pwa-ios'),
  tabPwaAndroid: document.getElementById('tab-pwa-android'),
  tabPwaDesktop: document.getElementById('tab-pwa-desktop'),
  btnTriggerDesktopInstall: document.getElementById('btn-trigger-desktop-install')
};

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupClearLayers();
  setupSearchHandlers();
  loadServerInfo();
  loadLooks();
  loadMacros();
  loadInitialPlaylists();
  startStatusPolling();
  registerServiceWorker();
  setupPwaInstall();
});

// Registro do Service Worker para PWA com detecção de atualização
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => {
      console.log('ProPresenter PWA Service Worker registrado:', reg.scope);

      // Verifica atualizações periodicamente (a cada 60 minutos)
      setInterval(() => reg.update(), 60 * 60 * 1000);

      // Detecta quando um novo Service Worker está pronto
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nova versão disponível - força ativação imediata
            console.log('Nova versão do PWA detectada, ativando...');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    })
    .catch(err => console.warn('Aviso ao registrar Service Worker:', err));

  // Quando o Service Worker muda (nova versão ativada), recarrega a página
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('Service Worker atualizado, recarregando...');
    window.location.reload();
  });
}

// ============================================================
// SUPORTE PARA INSTALAÇÃO PWA MULTIPLATAFORMA
// ============================================================
let deferredPrompt = null;

// Chrome/Edge/Samsung Internet no Android disparam este evento
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('beforeinstallprompt capturado - PWA instalável!');
  // Mostra os botões de instalação
  if (dom.btnInstallPwa) dom.btnInstallPwa.classList.remove('hidden');
  if (dom.btnMobileInstall) dom.btnMobileInstall.classList.remove('hidden');
});

// Detecta quando o app já foi instalado
window.addEventListener('appinstalled', () => {
  console.log('PWA instalado com sucesso!');
  deferredPrompt = null;
  dom.btnInstallPwa?.classList.add('hidden');
  dom.btnMobileInstall?.classList.add('hidden');
});

function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  return isIOS ? 'ios' : (isAndroid ? 'android' : 'desktop');
}

function switchPwaTab(targetTab) {
  const tabs = [
    { id: 'tab-pwa-ios', content: 'pwa-content-ios', key: 'ios' },
    { id: 'tab-pwa-android', content: 'pwa-content-android', key: 'android' },
    { id: 'tab-pwa-desktop', content: 'pwa-content-desktop', key: 'desktop' }
  ];
  tabs.forEach(tab => {
    const btn = document.getElementById(tab.id);
    const content = document.getElementById(tab.content);
    const isActive = tab.key === targetTab;
    if (btn) btn.classList.toggle('active', isActive);
    if (content) {
      content.classList.toggle('active', isActive);
      content.style.display = isActive ? 'block' : 'none';
    }
  });
}

function setupPwaInstall() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const platform = detectPlatform();

  // Se já está instalado como PWA standalone, esconde os botões
  if (isStandalone) {
    dom.btnInstallPwa?.classList.add('hidden');
    dom.btnMobileInstall?.classList.add('hidden');
    return; // Não precisa configurar nada mais
  }

  // iOS/iPadOS: NUNCA recebe beforeinstallprompt, sempre mostra botão manual
  if (platform === 'ios') {
    dom.btnInstallPwa?.classList.remove('hidden');
    dom.btnMobileInstall?.classList.remove('hidden');
  }

  // Android: o botão fica visível, no clique tentamos o prompt nativo primeiro
  if (platform === 'android') {
    dom.btnInstallPwa?.classList.remove('hidden');
    dom.btnMobileInstall?.classList.remove('hidden');
  }

  // Desktop: fica visível também (o beforeinstallprompt mostrará se disponível)
  if (platform === 'desktop') {
    dom.btnInstallPwa?.classList.remove('hidden');
  }

  // Handler unificado de clique para instalação
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Desktop: usa o prompt nativo do navegador
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          dom.btnInstallPwa?.classList.add('hidden');
          dom.btnMobileInstall?.classList.add('hidden');
        }
        deferredPrompt = null;
      } catch (err) {
        console.warn('Erro no prompt PWA:', err);
        openIosInstallModal();
      }
    } else {
      // iOS ou Android sem prompt: abre o modal com instruções manuais
      openIosInstallModal();
    }
  };

  if (dom.btnInstallPwa) {
    dom.btnInstallPwa.addEventListener('click', handleInstallClick);
  }
  if (dom.btnMobileInstall) {
    dom.btnMobileInstall.addEventListener('click', handleInstallClick);
  }

  // Abas de plataforma dentro do modal
  document.getElementById('tab-pwa-ios')?.addEventListener('click', () => switchPwaTab('ios'));
  document.getElementById('tab-pwa-android')?.addEventListener('click', () => switchPwaTab('android'));
  document.getElementById('tab-pwa-desktop')?.addEventListener('click', () => switchPwaTab('desktop'));

  // Botão direto de instalação no Desktop
  document.getElementById('btn-trigger-desktop-install')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        closeIosInstallModal();
        dom.btnInstallPwa?.classList.add('hidden');
        dom.btnMobileInstall?.classList.add('hidden');
      }
      deferredPrompt = null;
    } else {
      alert('Para instalar no computador, clique no ícone de instalação (⊕) ao lado da barra de endereços do Chrome ou Edge.');
    }
  });

  // Botões de fechar o modal
  if (dom.btnCloseIosInstall) {
    dom.btnCloseIosInstall.addEventListener('click', closeIosInstallModal);
  }
  if (dom.btnDismissIosInstall) {
    dom.btnDismissIosInstall.addEventListener('click', closeIosInstallModal);
  }
  if (dom.iosInstallModal) {
    dom.iosInstallModal.addEventListener('click', (e) => {
      if (e.target === dom.iosInstallModal) closeIosInstallModal();
    });
  }
}

function openIosInstallModal() {
  switchPwaTab(detectPlatform());
  dom.iosInstallModal?.classList.add('open');
}

function closeIosInstallModal() {
  dom.iosInstallModal?.classList.remove('open');
}

// Teleporta menus flutuantes para o <body> para NUNCA sofrerem corte de overflow no iPad/Safari
function teleportDropdownsToBody() {
  const elementsToPortal = [
    dom.lookDropdownMenu,
    dom.clearDropdownMenu,
    dom.toolsDropdownMenu,
    dom.desktopSearchResults,
    dom.mobileLookDropdownMenu,
    dom.mobileClearDropdownMenu,
    dom.mobileToolsDropdownMenu,
    dom.mobileSearchResults
  ];

  elementsToPortal.forEach(el => {
    if (el && el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  });
}

function openFixedDropdown(btnEl, menuEl) {
  if (!btnEl || !menuEl) return;
  const isCurrentlyOpen = menuEl.classList.contains('open');
  closeAllDropdowns();
  if (isCurrentlyOpen) return;

  if (menuEl.parentElement !== document.body) {
    document.body.appendChild(menuEl);
  }

  menuEl.classList.add('open');
  const rect = btnEl.getBoundingClientRect();
  menuEl.style.position = 'fixed';
  menuEl.style.top = `${rect.bottom + 6}px`;
  menuEl.style.zIndex = '99999';

  const menuWidth = menuEl.offsetWidth || 260;
  if (rect.right - menuWidth >= 10) {
    menuEl.style.left = 'auto';
    menuEl.style.right = `${window.innerWidth - rect.right}px`;
  } else {
    menuEl.style.left = `${Math.max(10, rect.left)}px`;
    menuEl.style.right = 'auto';
  }
}

function setupEventListeners() {
  // Teleporta menus flutuantes para o <body> para NUNCA sofrerem corte de overflow no iPad/Safari
  teleportDropdownsToBody();

  // Configuração do botão de Instalação PWA
  setupPwaInstall();

  // Drawer de Playlists
  dom.btnTogglePlaylists.addEventListener('click', () => openDrawer());
  dom.btnCloseDrawer.addEventListener('click', () => closeDrawer());
  dom.drawerOverlay.addEventListener('click', (e) => {
    if (e.target === dom.drawerOverlay) closeDrawer();
  });

  dom.tabMediaPlaylists.addEventListener('click', () => switchDrawerTab('media'));
  dom.tabPresentationPlaylists.addEventListener('click', () => switchDrawerTab('presentation'));

  // Looks Dropdown Desktop
  if (dom.btnQuickLook && dom.lookDropdownMenu) {
    dom.btnQuickLook.addEventListener('click', (e) => {
      e.stopPropagation();
      openFixedDropdown(dom.btnQuickLook, dom.lookDropdownMenu);
    });
  }

  // Looks Dropdown Mobile
  if (dom.btnMobileLook && dom.mobileLookDropdownMenu) {
    dom.btnMobileLook.addEventListener('click', (e) => {
      e.stopPropagation();
      openFixedDropdown(dom.btnMobileLook, dom.mobileLookDropdownMenu);
    });
  }

  // Clear Layers Dropdown Desktop
  if (dom.btnQuickClear && dom.clearDropdownMenu) {
    dom.btnQuickClear.addEventListener('click', (e) => {
      e.stopPropagation();
      openFixedDropdown(dom.btnQuickClear, dom.clearDropdownMenu);
    });
  }

  // Clear Layers Dropdown Mobile
  if (dom.btnMobileClear && dom.mobileClearDropdownMenu) {
    dom.btnMobileClear.addEventListener('click', (e) => {
      e.stopPropagation();
      openFixedDropdown(dom.btnMobileClear, dom.mobileClearDropdownMenu);
    });
  }

  // Submenu de Ferramentas (Desktop)
  if (dom.btnQuickTools && dom.toolsDropdownMenu) {
    dom.btnQuickTools.addEventListener('click', (e) => {
      e.stopPropagation();
      openFixedDropdown(dom.btnQuickTools, dom.toolsDropdownMenu);
    });
  }

  // Submenu de Ferramentas (Mobile)
  if (dom.btnMobileTools && dom.mobileToolsDropdownMenu) {
    dom.btnMobileTools.addEventListener('click', (e) => {
      e.stopPropagation();
      openFixedDropdown(dom.btnMobileTools, dom.mobileToolsDropdownMenu);
    });
  }

  // Itens de Ferramentas (abrem os pop-ups)
  const bindToolAction = (el, action) => {
    if (el) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        action();
      });
    }
  };

  bindToolAction(dom.toolItemStage, openStageModal);
  bindToolAction(dom.mobileToolItemStage, openStageModal);
  bindToolAction(dom.toolItemTimers, openTimersModal);
  bindToolAction(dom.mobileToolItemTimers, openTimersModal);
  bindToolAction(dom.toolItemVideoInputs, openVideoInputsModal);
  bindToolAction(dom.mobileToolItemVideoInputs, openVideoInputsModal);
  bindToolAction(dom.toolItemProps, openPropsModal);
  bindToolAction(dom.mobileToolItemProps, openPropsModal);
  bindToolAction(dom.toolItemCapture, openCaptureModal);
  bindToolAction(dom.mobileToolItemCapture, openCaptureModal);

  // Fechamento dos 5 Modais de Ferramentas
  const bindModalClose = (btn, modal, closeFn) => {
    if (btn) btn.addEventListener('click', closeFn);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFn();
      });
    }
  };

  bindModalClose(dom.btnCloseStage, dom.stageModal, closeStageModal);
  bindModalClose(dom.btnCloseTimers, dom.timersModal, closeTimersModal);
  bindModalClose(dom.btnCloseVideoInputs, dom.videoInputsModal, closeVideoInputsModal);
  bindModalClose(dom.btnCloseProps, dom.propsModal, closePropsModal);
  bindModalClose(dom.btnCloseCapture, dom.captureModal, closeCaptureModal);

  // Fecha dropdowns ao clicar ou tocar fora (com total compatibilidade com Safari no iPad)
  const handleOutsideClick = (e) => {
    if (e.target.closest('#btn-quick-look, #btn-mobile-look, #look-dropdown-menu, #mobile-look-dropdown-menu')) return;
    if (e.target.closest('#btn-quick-clear, #btn-mobile-clear, #clear-dropdown-menu, #mobile-clear-dropdown-menu')) return;
    if (e.target.closest('#btn-quick-tools, #btn-mobile-tools, #tools-dropdown-menu, #mobile-tools-dropdown-menu')) return;
    if (e.target.closest('#desktop-search-input, #desktop-search-results, #mobile-search-input, #mobile-search-results')) return;

    closeAllDropdowns();
    if (dom.desktopSearchResults) dom.desktopSearchResults.classList.add('hidden');
    if (dom.mobileSearchResults) dom.mobileSearchResults.classList.add('hidden');
  };

  document.addEventListener('pointerdown', handleOutsideClick);
  document.addEventListener('click', handleOutsideClick);

  // Modal de Macros (Desktop e Mobile)
  if (dom.btnQuickMacro) {
    dom.btnQuickMacro.addEventListener('click', openMacroModal);
  }
  if (dom.btnMobileMacro) {
    dom.btnMobileMacro.addEventListener('click', openMacroModal);
  }
  if (dom.btnCloseMacro) {
    dom.btnCloseMacro.addEventListener('click', closeMacroModal);
  }
  if (dom.macroModal) {
    dom.macroModal.addEventListener('click', (e) => {
      if (e.target === dom.macroModal) closeMacroModal();
    });
  }

  // Modal de Áudio (Desktop e Mobile)
  if (dom.btnQuickAudio) {
    dom.btnQuickAudio.addEventListener('click', openAudioModal);
  }
  if (dom.btnMobileAudio) {
    dom.btnMobileAudio.addEventListener('click', openAudioModal);
  }
  if (dom.btnCloseAudio) {
    dom.btnCloseAudio.addEventListener('click', closeAudioModal);
  }
  if (dom.audioModal) {
    dom.audioModal.addEventListener('click', (e) => {
      if (e.target === dom.audioModal) closeAudioModal();
    });
  }

  // Controles de Transporte de Áudio
  if (dom.btnAudioPlayPause) {
    dom.btnAudioPlayPause.addEventListener('click', toggleAudioPlayPause);
  }
  if (dom.btnAudioNext) {
    dom.btnAudioNext.addEventListener('click', triggerAudioNext);
  }
  if (dom.btnAudioPrev) {
    dom.btnAudioPrev.addEventListener('click', triggerAudioPrev);
  }
  if (dom.btnAudioClear) {
    dom.btnAudioClear.addEventListener('click', clearAudioLayer);
  }

  // Modais de Mensagens
  if (dom.btnQuickMessages) {
    dom.btnQuickMessages.addEventListener('click', openMessagesModal);
  }
  if (dom.btnMobileMessages) {
    dom.btnMobileMessages.addEventListener('click', openMessagesModal);
  }
  if (dom.btnCloseMessages) {
    dom.btnCloseMessages.addEventListener('click', closeMessagesModal);
  }
  if (dom.messagesModal) {
    dom.messagesModal.addEventListener('click', (e) => {
      if (e.target === dom.messagesModal) closeMessagesModal();
    });
  }
  if (dom.btnTriggerMessage) {
    dom.btnTriggerMessage.addEventListener('click', triggerSendMessage);
  }
  if (dom.btnClearMessage) {
    dom.btnClearMessage.addEventListener('click', clearCurrentMessage);
  }

  // Navegação nas setas << e >>
  dom.btnPrevSlide.addEventListener('click', handlePrevItem);
  dom.btnNextSlide.addEventListener('click', handleNextItem);

  // Teclado (com proteção total para digitação na busca ou inputs)
  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      if (e.key === 'Escape') {
        activeEl.blur();
      }
      return; // Permite digitação natural de espaço, setas e backspace
    }

    if (e.key === 'Escape') {
      closeMacroModal();
      closeAudioModal();
      closeMessagesModal();
      closeStageModal();
      closeTimersModal();
      closeVideoInputsModal();
      closePropsModal();
      closeCaptureModal();
      closePlaylistPicker();
      dom.settingsModal?.classList.remove('open');
      closeDrawer();
      closeAllDropdowns();
      return;
    }

    // Com um pop-up aberto, as teclas de navegacao nao devem passar slide ao vivo por engano
    if (document.querySelector('.modal-overlay.open, .drawer-overlay.open, #playlist-picker-overlay.open')) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      handleNextItem();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      handlePrevItem();
    }
  });

  // Configurações
  dom.btnOpenSettings.addEventListener('click', () => dom.settingsModal.classList.add('open'));
  dom.btnCloseSettings.addEventListener('click', () => dom.settingsModal.classList.remove('open'));
  dom.btnSaveSettings.addEventListener('click', handleSaveSettings);

  // Ativa rolagem por toque/arraste invisível no menu superior
  enableHeaderDragToScroll();
}

// Permite arrastar o menu superior suavemente com toque no iPad ou mouse no tablet/desktop
function enableHeaderDragToScroll() {
  const header = document.querySelector('.app-header');
  if (!header) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, input, a, .action-btn, .icon-btn, .look-dropdown-menu, .clear-dropdown-menu, .search-dropdown-results')) {
      return;
    }
    isDown = true;
    startX = e.pageX - header.offsetLeft;
    scrollLeft = header.scrollLeft;
    header.style.cursor = 'grab';
  });

  window.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      header.style.cursor = '';
    }
  });

  header.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - header.offsetLeft;
    const walk = (x - startX) * 1.4;
    header.scrollLeft = scrollLeft - walk;
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
    // 404 = "nada no ar / não existe" (resposta normal do ProPresenter). Só 502/503 (ou falha de rede) é offline.
    updateConnectionStatus(res.status !== 502 && res.status !== 503);
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
    const activeName = (currentLookData && currentLookData.id) ? (currentLookData.id.name || 'Look') : (looks[0]?.id?.name || 'Look');
    if (currentLookData && currentLookData.id) {
      state.currentLook = currentLookData.id;
    }
    if (dom.currentLookLabel) dom.currentLookLabel.textContent = activeName;
    if (dom.mobileLookLabel) dom.mobileLookLabel.textContent = activeName;
    renderLooksMenu();
  }
}

function closeAllDropdowns() {
  if (dom.lookDropdownMenu) dom.lookDropdownMenu.classList.remove('open');
  if (dom.mobileLookDropdownMenu) dom.mobileLookDropdownMenu.classList.remove('open');
  if (dom.clearDropdownMenu) dom.clearDropdownMenu.classList.remove('open');
  if (dom.mobileClearDropdownMenu) dom.mobileClearDropdownMenu.classList.remove('open');
  if (dom.toolsDropdownMenu) dom.toolsDropdownMenu.classList.remove('open');
  if (dom.mobileToolsDropdownMenu) dom.mobileToolsDropdownMenu.classList.remove('open');
}

function renderLooksMenu() {
  const containers = [dom.lookMenuList, dom.mobileLookMenuList].filter(Boolean);
  containers.forEach(container => {
    container.innerHTML = '';
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
        closeAllDropdowns();
      });

      container.appendChild(item);
    });
  });
}

async function triggerLook(look) {
  const lookId = look.id.uuid || look.id.name || look.id.index;
  await apiRequest(`/v1/look/${encodeURIComponent(lookId)}/trigger`);
  state.currentLook = look.id;
  const name = look.id.name || 'Look';
  if (dom.currentLookLabel) dom.currentLookLabel.textContent = name;
  if (dom.mobileLookLabel) dom.mobileLookLabel.textContent = name;
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

// O ProPresenter aninha playlists em pastas (grupos): "playlists" (spec) ou "children" (áudio/mídia).
// Devolve só as playlists de verdade, com o nome da pasta de origem.
function flattenPlaylistTree(list, groupName = '') {
  const out = [];
  if (!Array.isArray(list)) return out;
  for (const item of list) {
    const kids = item.playlists || item.children;
    const kind = item.type || item.field_type;
    const hasKids = Array.isArray(kids) && kids.length > 0;
    if (hasKids) out.push(...flattenPlaylistTree(kids, (item.id && item.id.name) || groupName));
    if (kind === 'group') continue;
    if (kind === 'playlist' || (!kind && !hasKids)) out.push(Object.assign({}, item, { groupName }));
  }
  return out;
}

async function renderDrawerPlaylists(type) {
  dom.drawerPlaylistsContainer.innerHTML = `
    <div class="loading-spinner-box">
      <div class="spinner"></div>
      <span>Buscando pastas de ${type === 'media' ? 'Mídia / ProContent' : 'Playlists de Culto'}...</span>
    </div>
  `;

  const endpoint = type === 'media' ? '/v1/media/playlists' : '/v1/playlists';
  const rawPlaylists = await apiRequest(endpoint);
  const playlists = flattenPlaylistTree(rawPlaylists);

  if (playlists.length === 0) {
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
      <span class="drawer-item-badge">${pl.groupName ? escapeHtml(pl.groupName) : (type === 'media' ? 'Mídia / ProContent' : 'Apresentação')}</span>
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
  const playlists = flattenPlaylistTree(await apiRequest(endpoint));
  if (playlists.length > 0) {
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
  if (shouldTrigger) lastUserActionTime = Date.now();
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
  const itemKind = (item.type || 'presentation').toLowerCase();
  // Cabeçalhos e espaços reservados não têm slides nem disparo
  if (itemKind === 'header' || itemKind === 'placeholder') return;
  const presUuid = itemKind === 'presentation'
    ? (item.presentation_info?.presentation_uuid || item.id?.uuid)
    : null;
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

let lastUserActionTime = 0;

// Disparo de Mídia
async function triggerMediaItem(item, idx) {
  lastUserActionTime = Date.now();
  const mediaId = item.id?.uuid || item.uuid || item.id?.index || idx;
  await apiRequest(`/v1/media/playlist/${state.activePlaylistId}/${mediaId}/trigger`);
  updateMediaPreviewUI(item, idx);
}

function updateMediaPreviewUI(item, idx) {
  if (!item) return;
  const total = state.playlistItems?.length || 1;
  const itemName = item.id?.name || item.name || 'Mídia';
  const itemType = item.type || 'Mídia';

  dom.liveItemTitle.textContent = itemName;
  dom.liveCueSubtitle.textContent = `${state.activePlaylistName || 'Mídia'} • ${itemType} ${idx + 1} de ${total}`;

  dom.previewPlaceholder.classList.add('hidden');

  const mediaUuid = item.id?.uuid || item.uuid;
  if (mediaUuid) {
    dom.previewTextOverlay.classList.add('hidden');
    dom.previewTextOverlay.textContent = '';
    dom.liveSlideImage.classList.remove('hidden');

    // Evita recarregar a mesma imagem com timestamp a cada segundo (elimina 100% qualquer piscada!)
    if (dom.liveSlideImage.dataset.loadedUuid !== mediaUuid) {
      dom.liveSlideImage.dataset.loadedUuid = mediaUuid;
      dom.liveSlideImage.src = `/api/v1/media/${mediaUuid}/thumbnail`;
    }

    dom.liveSlideImage.onerror = () => {
      dom.liveSlideImage.classList.add('hidden');
      dom.previewTextOverlay.classList.remove('hidden');
      dom.previewTextOverlay.innerHTML = `<div style="font-size: 16px; font-weight: 700; color: #fff;">${escapeHtml(itemName)}</div>`;
    };
  } else {
    dom.liveSlideImage.classList.add('hidden');
    dom.previewTextOverlay.classList.remove('hidden');
    dom.previewTextOverlay.innerHTML = `<div style="font-size: 16px; font-weight: 700; color: #fff;">${escapeHtml(itemName)}</div>`;
  }
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
        <img class="slide-thumbnail-img" src="${thumbUrl}" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" alt="${escapeHtml(itemName)}" loading="lazy">
        <div class="slide-text-overlay hidden">${escapeHtml(itemName)}</div>
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
let slidesLoadSeq = 0;

async function loadPresentationSlides(presUuid, presName, itemIndex, shouldTriggerFirst = false) {
  dom.slidesGridContainer.innerHTML = `
    <div class="loading-spinner-box">
      <div class="spinner"></div>
      <span>Carregando slides de ${escapeHtml(presName)}...</span>
    </div>
  `;

  const loadSeq = ++slidesLoadSeq;
  const presRaw = await apiRequest(`/v1/presentation/${presUuid}`);
  // Uma carga mais nova (outro toque) já começou: descarta esta para não sobrescrever a grade
  if (loadSeq !== slidesLoadSeq) return;
  const presData = presRaw && (presRaw.presentation ? presRaw : (presRaw.groups ? { presentation: presRaw } : null));
  if (!presData) {
    dom.slidesGridContainer.innerHTML = `
      <div class="slides-empty-notice">
        <p>Não foi possível carregar os slides desta apresentação.</p>
      </div>
    `;
    return;
  }

  const pres = presData.presentation;
  state.currentPresentationUuid = presUuid;
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
    const hasLyrics = slide.text && slide.text.trim().length > 0;

    let contentHtml = '';
    if (hasLyrics) {
      contentHtml = `
        <div class="slide-lyrics-display">
          <div class="slide-lyrics-text">${escapeHtml(slide.text)}</div>
        </div>
      `;
    } else {
      contentHtml = `
        <img class="slide-thumbnail-img" src="${thumbUrl}" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" alt="Slide ${slide.cueIndex + 1}" loading="lazy">
        <div class="slide-text-overlay hidden">Slide ${slide.cueIndex + 1}</div>
      `;
    }

    card.innerHTML = `
      <div class="slide-index-label">${slide.cueIndex + 1}</div>
      <div class="slide-preview-wrapper">
        ${contentHtml}
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
  lastUserActionTime = Date.now();
  state.lastActionSource = 'presentation';
  state.currentSlideIndex = cueIndex;
  state.liveSlideIndex = cueIndex;
  state.livePresentationUuid = presUuid;
  state.currentPresentationUuid = presUuid;

  highlightActiveSlide(cueIndex);

  const title = presName || dom.selectedPresentationTitle?.textContent || 'Apresentação';
  dom.liveItemTitle.textContent = title;
  dom.liveCueSubtitle.textContent = `Slide ${cueIndex + 1} de ${totalSlides || state.currentPresentationSlides?.length || 1}`;

  dom.previewPlaceholder.classList.add('hidden');

  const slideKey = `${presUuid}_${cueIndex}`;
  const hasLyrics = slideText && slideText.trim().length > 0;
  if (hasLyrics) {
    dom.liveSlideImage.classList.add('hidden');
    dom.liveSlideImage.dataset.loadedUuid = '';
    dom.previewTextOverlay.classList.remove('hidden');
    dom.previewTextOverlay.innerHTML = `<div class="slide-lyrics-text" style="font-size: 20px; font-weight: 700; color: #fff;">${escapeHtml(slideText)}</div>`;
  } else {
    dom.previewTextOverlay.classList.add('hidden');
    dom.previewTextOverlay.innerHTML = '';
    dom.liveSlideImage.classList.remove('hidden');

    if (dom.liveSlideImage.dataset.loadedUuid !== slideKey) {
      dom.liveSlideImage.dataset.loadedUuid = slideKey;
      dom.liveSlideImage.src = `/api/v1/presentation/${presUuid}/thumbnail/${cueIndex}`;
    }
  }

  await apiRequest(`/v1/presentation/${presUuid}/${cueIndex}/trigger`);
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
// MACROS DO PROPRESENTER (CARDS COLORIDOS NATIVOS)
// ==========================================================================
const NUMBER_WORDS = {
  'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8',
  'nine': '9', 'ten': '10', 'slide': 'P'
};

function openMacroModal() {
  dom.lookDropdownMenu.classList.remove('open');
  dom.clearDropdownMenu.classList.remove('open');
  dom.macroModal.classList.add('open');
  if (!state.macros || state.macros.length === 0) {
    loadMacros();
  }
}

function closeMacroModal() {
  dom.macroModal.classList.remove('open');
}

async function loadMacros() {
  const macrosData = await apiRequest('/v1/macros');
  if (!macrosData || !Array.isArray(macrosData)) {
    if (dom.macroBadgeCount) dom.macroBadgeCount.textContent = 'Indisponível';
    return;
  }

  state.macros = macrosData;
  if (dom.macroBadgeCount) dom.macroBadgeCount.textContent = `${macrosData.length} macros`;
  renderMacroGrid(macrosData);
}

const ACTION_SVGS = {
  audience_look: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" title="Audience Look"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  clear: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" title="Clear"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  stage_layout: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" title="Stage Layout"><line x1="4" y1="12" x2="20" y2="12"/><line x1="12" y1="4" x2="12" y2="20"/><rect x="6" y="8" width="12" height="8" rx="1.5"/></svg>`,
  prop: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" title="Prop"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  media_bin_playlist: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" title="Mídia"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
};

const SLIDE_ICON_SVG = `
  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.2">
    <rect x="3" y="4" width="18" height="16" rx="3" stroke-width="2.2"/>
    <line x1="7" y1="9" x2="17" y2="9" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="7" y1="13" x2="17" y2="13" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="7" y1="17" x2="13" y2="17" stroke-width="2.5" stroke-linecap="round"/>
  </svg>
`;

function renderMacroGrid(macros) {
  if (!dom.macroGridContainer) return;
  dom.macroGridContainer.innerHTML = '';

  macros.forEach((m, idx) => {
    const itemWrapper = document.createElement('div');
    itemWrapper.className = 'macro-item-wrapper';

    // Conversão das cores da API (0.0 a 1.0) para CSS rgb
    let colorCss = '#2563eb';
    if (m.color) {
      const r = Math.round((m.color.red || 0) * 255);
      const g = Math.round((m.color.green || 0) * 255);
      const b = Math.round((m.color.blue || 0) * 255);
      colorCss = `rgb(${r}, ${g}, ${b})`;
    }

    // Extrair o número da tecla ou identificar se é slide
    const imgType = (m.image_type || '').toLowerCase();
    const isSlide = (imgType === 'slide');
    let keyNum = NUMBER_WORDS[imgType];
    if (!keyNum) {
      const match = (m.id?.name || '').match(/TECLA\s+(\d+)/i);
      keyNum = match ? match[1] : String(idx + 1);
    }

    const macroName = m.id?.name || `Macro ${idx + 1}`;
    const macroUuid = m.id?.uuid || idx;

    // Gerar ícones das ações presentes
    const actions = m.actions || [];
    const actionIconsHtml = actions.map(a => ACTION_SVGS[a.type] || '').filter(Boolean).join('');

    itemWrapper.innerHTML = `
      <div class="macro-card-box" style="background: ${colorCss}; --macro-glow: ${colorCss};">
        <div class="macro-inner-squircle">
          ${isSlide ? `<span style="color: ${colorCss}; display: flex;">${SLIDE_ICON_SVG}</span>` : `<span class="macro-number-text" style="color: ${colorCss};">${escapeHtml(keyNum)}</span>`}
        </div>
        <div class="macro-actions-strip">
          ${actionIconsHtml}
        </div>
      </div>
      <div class="macro-label-text" title="${escapeHtml(macroName)}">${escapeHtml(macroName)}</div>
    `;

    itemWrapper.addEventListener('click', () => triggerMacro(macroUuid, macroName, itemWrapper));
    dom.macroGridContainer.appendChild(itemWrapper);
  });
}

async function triggerMacro(uuid, name, cardEl) {
  if (cardEl) {
    cardEl.classList.add('triggered');
    setTimeout(() => cardEl.classList.remove('triggered'), 850);
  }

  dom.liveItemTitle.textContent = name;
  dom.liveCueSubtitle.textContent = 'Macro Executado';

  await apiRequest(`/v1/macro/${uuid}/trigger`);
}

// ==========================================================================
// PLAYLISTS DE ÁUDIO DO PROPRESENTER
// ==========================================================================
function openAudioModal() {
  if (dom.audioModal) {
    dom.audioModal.classList.add('open');
    loadAudioPlaylists();
    checkAudioTransportStatus();
  }
}

function closeAudioModal() {
  if (dom.audioModal) {
    dom.audioModal.classList.remove('open');
  }
}

async function loadAudioPlaylists() {
  try {
    if (dom.audioBadgeCount) dom.audioBadgeCount.textContent = 'Carregando...';
    const rawAudioPlaylists = await apiRequest('/v1/audio/playlists');
    const playlists = flattenPlaylistTree(rawAudioPlaylists);
    if (!Array.isArray(rawAudioPlaylists)) {
      if (dom.audioBadgeCount) dom.audioBadgeCount.textContent = '0 playlists';
      return;
    }

    state.audio.playlists = playlists;
    renderAudioPlaylistTabs(playlists);

    if (!state.audio.activePlaylistId && playlists.length > 0) {
      selectAudioPlaylist(playlists[0].id.uuid, playlists[0].id.name);
    } else if (state.audio.activePlaylistId) {
      selectAudioPlaylist(state.audio.activePlaylistId, state.audio.activePlaylistName);
    }
  } catch (err) {
    console.error('Erro ao carregar playlists de áudio:', err);
    if (dom.audioBadgeCount) dom.audioBadgeCount.textContent = 'Erro';
  }
}

function renderAudioPlaylistTabs(playlists) {
  if (!dom.audioPlaylistsTabs) return;
  dom.audioPlaylistsTabs.innerHTML = '';

  playlists.forEach(pl => {
    const pill = document.createElement('button');
    const plUuid = pl.id?.uuid;
    const plName = pl.id?.name || 'Playlist';
    const isActive = (state.audio.activePlaylistId === plUuid);

    pill.className = `audio-tab-pill ${isActive ? 'active' : ''}`;
    pill.dataset.uuid = plUuid;
    pill.innerHTML = `<span>${escapeHtml(plName)}</span>`;

    pill.addEventListener('click', () => {
      selectAudioPlaylist(plUuid, plName);
    });

    dom.audioPlaylistsTabs.appendChild(pill);
  });
}

async function selectAudioPlaylist(playlistUuid, playlistName) {
  state.audio.activePlaylistId = playlistUuid;
  state.audio.activePlaylistName = playlistName;

  document.querySelectorAll('.audio-tab-pill').forEach(pill => {
    if (pill.dataset.uuid === playlistUuid) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  if (dom.audioTracksContainer) {
    dom.audioTracksContainer.innerHTML = '<div class="loading-state" style="padding: 30px; text-align: center;"><div class="spinner"></div><p style="margin-top: 10px; color: var(--text-dim); font-size: 13px;">Carregando faixas...</p></div>';
  }

  try {
    const data = await apiRequest(`/v1/audio/playlist/${playlistUuid}`);
    const items = (data && Array.isArray(data.items)) ? data.items : [];
    state.audio.tracks = items;
    if (dom.audioBadgeCount) {
      dom.audioBadgeCount.textContent = `${items.length} ${items.length === 1 ? 'faixa' : 'faixas'}`;
    }
    renderAudioTracksList(items, playlistUuid, playlistName);
  } catch (err) {
    console.error('Erro ao buscar faixas de áudio:', err);
    if (dom.audioTracksContainer) {
      dom.audioTracksContainer.innerHTML = '<div class="empty-state" style="padding: 30px; text-align: center; color: var(--color-danger);"><p>Erro ao carregar faixas</p></div>';
    }
  }
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderAudioTracksList(tracks, playlistUuid, playlistName) {
  if (!dom.audioTracksContainer) return;

  if (tracks.length === 0) {
    dom.audioTracksContainer.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px; text-align: center; color: var(--text-muted);">
        <p>Nenhuma faixa nesta playlist de áudio.</p>
      </div>
    `;
    return;
  }

  dom.audioTracksContainer.innerHTML = '';
  tracks.forEach((track, idx) => {
    const card = document.createElement('div');
    const trackUuid = track.id?.uuid || track.id?.index || idx;
    const trackName = track.id?.name || `Faixa ${idx + 1}`;
    const artist = track.artist && track.artist !== 'unknown' ? track.artist : 'Áudio ProPresenter';
    const duration = formatDuration(track.duration);
    const isThisPlaying = state.audio.isPlaying && state.audio.currentTrackUuid === trackUuid;

    card.className = `audio-track-item ${isThisPlaying ? 'playing' : ''}`;
    card.dataset.uuid = trackUuid;
    card.dataset.index = idx;

    card.innerHTML = `
      <div class="audio-track-left">
        <span class="audio-track-index">${idx + 1}</span>
        <div class="audio-track-info">
          <div class="audio-track-title" title="${escapeHtml(trackName)}">${escapeHtml(trackName)}</div>
          <div class="audio-track-meta">${escapeHtml(artist)}</div>
        </div>
      </div>
      <div class="audio-track-right">
        <span class="audio-track-duration">${duration}</span>
        <button class="audio-track-play-btn" title="Tocar esta faixa">
          ${isThisPlaying ? `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ` : `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          `}
        </button>
      </div>
    `;

    card.addEventListener('click', () => {
      triggerAudioTrack(playlistUuid, trackUuid, trackName, artist);
    });

    dom.audioTracksContainer.appendChild(card);
  });
}

async function triggerAudioTrack(playlistUuid, trackUuid, trackName, artist = 'Áudio ProPresenter') {
  state.audio.currentTrackUuid = trackUuid;
  state.audio.currentTrackName = trackName;
  state.audio.isPlaying = true;

  updateAudioUIPlayingState(trackName, `${state.audio.activePlaylistName} • ${artist}`, true);

  await apiRequest(`/v1/audio/playlist/${playlistUuid}/${trackUuid}/trigger`);
  checkAudioTransportStatus();
}

async function toggleAudioPlayPause() {
  if (state.audio.isPlaying) {
    await apiRequest('/v1/transport/audio/pause');
    state.audio.isPlaying = false;
    updateAudioUIPlayingState(state.audio.currentTrackName, 'Pausado', false);
  } else {
    await apiRequest('/v1/transport/audio/play');
    state.audio.isPlaying = true;
    updateAudioUIPlayingState(state.audio.currentTrackName, 'Reproduzindo', true);
  }
}

async function triggerAudioNext() {
  if (state.audio.activePlaylistId) {
    await apiRequest(`/v1/audio/playlist/${state.audio.activePlaylistId}/next/trigger`);
  } else {
    await apiRequest('/v1/trigger/audio/next');
  }
  setTimeout(checkAudioTransportStatus, 300);
}

async function triggerAudioPrev() {
  if (state.audio.activePlaylistId) {
    await apiRequest(`/v1/audio/playlist/${state.audio.activePlaylistId}/previous/trigger`);
  } else {
    await apiRequest('/v1/trigger/audio/previous');
  }
  setTimeout(checkAudioTransportStatus, 300);
}

async function clearAudioLayer() {
  await apiRequest('/v1/clear/layer/audio');
  state.audio.isPlaying = false;
  state.audio.currentTrackUuid = null;
  state.audio.currentTrackName = '';
  updateAudioUIPlayingState('Nenhum áudio tocando', 'Camada de áudio limpa', false);
}

function updateAudioUIPlayingState(trackName, meta, isPlaying) {
  if (dom.audioCurrentTrackName) dom.audioCurrentTrackName.textContent = trackName || 'Nenhum áudio tocando';
  if (dom.audioCurrentTrackMeta) dom.audioCurrentTrackMeta.textContent = meta || '';

  if (isPlaying) {
    dom.audioIconPlay?.classList.add('hidden');
    dom.audioIconPause?.classList.remove('hidden');
    dom.audioBarVisualizer?.classList.remove('hidden');
    dom.headerAudioPlayingIndicator?.classList.remove('hidden');
    dom.mobileAudioPlayingIndicator?.classList.remove('hidden');
    dom.btnQuickAudio?.classList.add('active');
    dom.btnMobileAudio?.classList.add('active');
  } else {
    dom.audioIconPlay?.classList.remove('hidden');
    dom.audioIconPause?.classList.add('hidden');
    dom.audioBarVisualizer?.classList.add('hidden');
    dom.headerAudioPlayingIndicator?.classList.add('hidden');
    dom.mobileAudioPlayingIndicator?.classList.add('hidden');
    dom.btnQuickAudio?.classList.remove('active');
    dom.btnMobileAudio?.classList.remove('active');
  }

  document.querySelectorAll('.audio-track-item').forEach(card => {
    const isThis = isPlaying && (card.dataset.uuid === state.audio.currentTrackUuid);
    card.classList.toggle('playing', isThis);
    const playBtn = card.querySelector('.audio-track-play-btn');
    if (playBtn) {
      playBtn.innerHTML = isThis ? `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      ` : `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
    }
  });
}

async function checkAudioTransportStatus() {
  try {
    const current = await apiRequest('/v1/transport/audio/current');
    if (current && (current.name || current.id?.name)) {
      const name = current.name || current.id?.name;
      const artist = current.artist || 'ProPresenter';
      const playing = current.is_playing !== false;
      state.audio.isPlaying = playing;
      state.audio.currentTrackName = name;
      const curUuid = current.uuid || current.id?.uuid;
      if (curUuid) state.audio.currentTrackUuid = curUuid;
      updateAudioUIPlayingState(name, playing ? `${state.audio.activePlaylistName || 'Playlist'} • ${artist}` : 'Pausado', playing);
    }
  } catch (e) {
    // Silencioso
  }
}

// ==========================================================================
// MÓDULO DE MENSAGENS NO TELÃO (PROPRESENTER MESSAGES)
// ==========================================================================
function openMessagesModal() {
  dom.messagesModal?.classList.add('open');
  loadMessages();
}

function closeMessagesModal() {
  dom.messagesModal?.classList.remove('open');
}

async function loadMessages() {
  if (dom.messagesBadgeCount) dom.messagesBadgeCount.textContent = 'Carregando...';
  
  const data = await apiRequest('/v1/messages');
  let list = [];
  if (data && Array.isArray(data)) {
    list = data;
  } else if (data && Array.isArray(data.value)) {
    list = data.value;
  }

  state.messages.list = list;

  if (dom.messagesBadgeCount) {
    dom.messagesBadgeCount.textContent = `${list.length} modelo${list.length !== 1 ? 's' : ''}`;
  }

  if (list.length === 0) {
    if (dom.messagesBodyContainer) {
      dom.messagesBodyContainer.innerHTML = `
        <div class="slides-empty-notice">
          <p>Nenhum modelo de mensagem configurado no ProPresenter.</p>
        </div>
      `;
    }
    return;
  }

  let selected = list.find(m => m.id?.uuid === state.messages.activeMessageUuid);
  if (!selected) {
    selected = list.find(m => m.is_active) || list[0];
  }
  selectMessageTemplate(selected);
}

function selectMessageTemplate(msg) {
  if (!msg) return;
  state.messages.activeMessageUuid = msg.id?.uuid || msg.id?.index;
  state.messages.activeTemplate = msg;

  if (!dom.messagesBodyContainer) return;

  const msgName = msg.id?.name || 'Mensagem';
  const rawMessage = msg.message || '';
  const tokens = msg.tokens || [];
  const isOnScreen = !!msg.is_active;

  tokens.forEach(tok => {
    if (state.messages.tokenValues[tok.name] === undefined) {
      state.messages.tokenValues[tok.name] = tok.text?.text || '';
    }
  });

  const allTemplates = state.messages.list || [];

  let tokensRowsHtml = '';
  if (tokens.length > 0) {
    tokensRowsHtml = tokens.map(tok => {
      const val = state.messages.tokenValues[tok.name] !== undefined ? state.messages.tokenValues[tok.name] : (tok.text?.text || '');
      return `
        <div class="pro-token-row">
          <div class="pro-token-header">${escapeHtml(tok.name)}</div>
          <div class="pro-token-value-row">
            <span class="pro-token-value-label">Value:</span>
            <input type="text" class="pro-token-input" data-token-name="${escapeHtml(tok.name)}" value="${escapeHtml(val)}" placeholder="Digite ${escapeHtml(tok.name)}...">
          </div>
        </div>
      `;
    }).join('');
  } else {
    tokensRowsHtml = `
      <div style="font-size:12px; color: var(--text-dim); padding: 12px 14px; background: #1e1e1e;">
        Esta mensagem é de texto fixo (sem variáveis dinâmicas).
      </div>
    `;
  }

  dom.messagesBodyContainer.innerHTML = `
    <div class="pro-messages-container" id="pro-messages-card">
      <!-- HEADER COM SELETOR DROPDOWN NATIVO DO PROPRESENTER (CARROS ↕ / KIDS ↕) -->
      <div class="pro-msg-header">
        <div class="pro-msg-select-trigger" id="pro-msg-select-trigger" title="Selecionar modelo de mensagem">
          <svg class="pro-msg-send-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
          <span class="pro-msg-current-name">${escapeHtml(msgName)}</span>
          <span class="pro-msg-chevron">↕</span>
        </div>

        <div class="pro-msg-dropdown-list hidden" id="pro-msg-dropdown-list">
          ${allTemplates.map(t => {
            const isSel = (t.id?.uuid || t.id?.index) === state.messages.activeMessageUuid;
            const tName = t.id?.name || 'Mensagem';
            return `
              <button class="pro-msg-dropdown-item ${isSel ? 'selected' : ''}" data-msg-uuid="${escapeHtml(t.id?.uuid || t.id?.index)}">
                <span class="check-icon">${isSel ? '✓' : ''}</span>
                <span>${escapeHtml(tName)}</span>
                ${t.is_active ? '<span style="color:#ef4444;font-size:10px;margin-left:auto;">● NO TELÃO</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>

        <div class="message-template-status-badge ${isOnScreen ? 'active' : 'inactive'}">
          ${isOnScreen ? '● NO TELÃO' : 'PRONTO'}
        </div>
      </div>

      <!-- TEXTO DO TEMPLATE (BASE COM AS VARIÁVEIS) -->
      <div class="pro-msg-template-box" id="pro-msg-template-text">
        ${escapeHtml(rawMessage)}
      </div>

      <!-- CAMPOS DE VARIÁVEIS (TOKENS) -->
      <div class="pro-msg-tokens-container">
        ${tokensRowsHtml}
      </div>

      <!-- RODAPÉ COM STATUS E BOTÕES CLEAR & SHOW -->
      <div class="pro-msg-footer">
        <div class="pro-msg-status" id="pro-msg-status">
          ${isOnScreen ? '<span class="status-live">● Exibindo nos Telões (Resolume NDI 1 e 2)</span>' : '<span>Telões de Saída: Resolume NDI 1 e 2</span>'}
        </div>
        <div class="pro-msg-btn-group">
          <button class="pro-btn-dark btn-pro-clear" id="btn-pro-clear" title="Ocultar mensagem do telão">
            Clear
          </button>
          <button class="pro-btn-dark btn-pro-show ${isOnScreen ? 'active' : ''}" id="btn-pro-show" title="Exibir mensagem no telão">
            ${isOnScreen ? 'Show (Ativo)' : 'Show'}
          </button>
        </div>
      </div>
    </div>
  `;

  // Dropdown toggle
  const triggerBtn = document.getElementById('pro-msg-select-trigger');
  const dropdownList = document.getElementById('pro-msg-dropdown-list');

  if (triggerBtn && dropdownList) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownList.classList.toggle('hidden');
    });

    dropdownList.querySelectorAll('.pro-msg-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownList.classList.add('hidden');
        const targetUuid = item.dataset.msgUuid;
        const targetTemplate = allTemplates.find(t => (t.id?.uuid || t.id?.index) == targetUuid);
        if (targetTemplate) selectMessageTemplate(targetTemplate);
      });
    });

    const closeDropdownOnClickOutside = (e) => {
      if (!triggerBtn.contains(e.target) && !dropdownList.contains(e.target)) {
        dropdownList.classList.add('hidden');
      }
    };
    document.addEventListener('click', closeDropdownOnClickOutside, { once: true });
  }

  // Inputs
  dom.messagesBodyContainer.querySelectorAll('.pro-token-input').forEach(input => {
    input.addEventListener('input', () => {
      const tokName = input.dataset.tokenName;
      state.messages.tokenValues[tokName] = input.value;
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerSendMessage();
      }
    });
  });

  // Botões Show e Clear
  const btnShow = document.getElementById('btn-pro-show');
  const btnClear = document.getElementById('btn-pro-clear');

  if (btnShow) btnShow.addEventListener('click', triggerSendMessage);
  if (btnClear) btnClear.addEventListener('click', clearCurrentMessage);
}

async function triggerSendMessage() {
  if (!state.messages.activeTemplate) return;

  const msg = state.messages.activeTemplate;
  const msgUuid = msg.id?.uuid || msg.id?.index;
  const tokens = msg.tokens || [];

  const statusEl = document.getElementById('pro-msg-status');
  const btnShow = document.getElementById('btn-pro-show');

  if (statusEl) {
    statusEl.innerHTML = '<span style="color:#38bdf8;">Enviando para os telões...</span>';
  }
  if (btnShow) {
    btnShow.textContent = 'Enviando...';
  }

  // Tokens de timer e relógio voltam como vieram; só os de texto recebem o valor digitado
  const cleanTokens = tokens.map(tok => {
    if (tok.timer || tok.clock) return tok;
    return {
      name: tok.name,
      text: {
        text: state.messages.tokenValues[tok.name] !== undefined ? String(state.messages.tokenValues[tok.name]) : (tok.text?.text || '')
      }
    };
  });

  try {
    // 1. Atualiza e salva o modelo no ProPresenter via PUT
    const msgObjToSave = Object.assign({}, msg, {
      tokens: cleanTokens,
      visible_on_network: true
    });
    await apiRequest(`/v1/message/${msgUuid}`, 'PUT', msgObjToSave);

    // 2. Dispara a exibição no telão via POST trigger
    const res = await fetch(`/api/v1/message/${msgUuid}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanTokens)
    });

    if (res.ok || res.status === 204) {
      msg.is_active = true;
      if (statusEl) {
        statusEl.innerHTML = '<span class="status-live">● Exibindo nos Telões (Resolume NDI 1 e 2)!</span>';
      }
      if (btnShow) {
        btnShow.className = 'pro-btn-dark btn-pro-show active';
        btnShow.textContent = 'Show (Ativo)';
      }
      const badge = dom.messagesBodyContainer?.querySelector('.message-template-status-badge');
      if (badge) {
        badge.className = 'message-template-status-badge active';
        badge.textContent = '● NO TELÃO';
      }
    } else {
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:#ef4444;">Erro ao enviar mensagem.</span>';
      }
      if (btnShow) btnShow.textContent = 'Show';
    }
  } catch (err) {
    console.error('Erro ao disparar mensagem:', err);
    if (statusEl) {
      statusEl.innerHTML = '<span style="color:#ef4444;">Falha de comunicação com o ProPresenter.</span>';
    }
    if (btnShow) btnShow.textContent = 'Show';
  }
}

async function clearCurrentMessage() {
  if (!state.messages.activeTemplate) return;

  const msg = state.messages.activeTemplate;
  const msgUuid = msg.id?.uuid || msg.id?.index;

  const statusEl = document.getElementById('pro-msg-status');
  const btnShow = document.getElementById('btn-pro-show');

  if (statusEl) {
    statusEl.innerHTML = '<span style="color:#f87171;">Ocultando do telão...</span>';
  }

  try {
    await apiRequest(`/v1/message/${msgUuid}/clear`);
    await apiRequest('/v1/clear/layer/messages');

    msg.is_active = false;

    if (statusEl) {
      statusEl.innerHTML = '<span>Mensagem ocultada do telão.</span>';
    }
    if (btnShow) {
      btnShow.className = 'pro-btn-dark btn-pro-show';
      btnShow.textContent = 'Show';
    }
    const badge = dom.messagesBodyContainer?.querySelector('.message-template-status-badge');
    if (badge) {
      badge.className = 'message-template-status-badge inactive';
      badge.textContent = 'PRONTO';
    }
  } catch (err) {
    console.error('Erro ao ocultar mensagem:', err);
  }
}

// ==========================================================================
// CAMADAS DE LIMPEZA (CLEAR LAYERS)
// ==========================================================================
function setupClearLayers() {
  document.querySelectorAll('.clear-item-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const layer = btn.getAttribute('data-layer');
      closeAllDropdowns();
      await triggerClearLayer(layer);
    });
  });
}

async function triggerClearLayer(layer) {
  if (layer === 'all') {
    await apiRequest('/v1/clear/group/0/trigger');
    await apiRequest('/v1/clear/layer/slide');
    await apiRequest('/v1/clear/layer/media');
    await apiRequest('/v1/clear/layer/video_input');
    await apiRequest('/v1/clear/layer/audio');
    await apiRequest('/v1/clear/layer/messages');
    await apiRequest('/v1/clear/layer/props');
    await apiRequest('/v1/clear/layer/announcements');

    dom.liveSlideImage.src = '';
    dom.liveSlideImage.classList.add('hidden');
    dom.previewTextOverlay.textContent = '';
    dom.previewPlaceholder.classList.remove('hidden');
    dom.liveItemTitle.textContent = 'Telas Limpas';
    dom.liveCueSubtitle.textContent = 'Todas as camadas limpas';

    document.querySelectorAll('.slide-card-item').forEach(card => {
      card.classList.remove('live');
      const badge = card.querySelector('.live-badge-tag');
      if (badge) badge.classList.add('hidden');
    });

    state.audio.isPlaying = false;
    state.audio.currentTrackUuid = null;
    state.audio.currentTrackName = '';
    updateAudioUIPlayingState('Nenhum áudio tocando', 'Camada de áudio limpa', false);
    return;
  }

  // Camada individual
  await apiRequest(`/v1/clear/layer/${layer}`);

  if (layer === 'audio') {
    state.audio.isPlaying = false;
    state.audio.currentTrackUuid = null;
    state.audio.currentTrackName = '';
    updateAudioUIPlayingState('Nenhum áudio tocando', 'Camada de áudio limpa', false);
  }

  if (layer === 'slide') {
    dom.previewTextOverlay.textContent = '';
    if (dom.liveSlideImage.classList.contains('hidden')) {
      dom.previewPlaceholder.classList.remove('hidden');
    }
  } else if (layer === 'media') {
    dom.liveSlideImage.src = '';
    dom.liveSlideImage.classList.add('hidden');
    if (!dom.previewTextOverlay.textContent) {
      dom.previewPlaceholder.classList.remove('hidden');
    }
  }

  dom.liveItemTitle.textContent = `Camada ${layer.toUpperCase()} Limpa`;
  dom.liveCueSubtitle.textContent = 'Comando enviado ao ProPresenter';
}

// ==========================================================================
// BUSCA GLOBAL DE MÚSICAS / APRESENTAÇÕES (4.500+ MÚSICAS)
// ==========================================================================
function setupSearchHandlers() {
  bindSearchBox(dom.desktopSearchInput, dom.desktopSearchResults, dom.btnDesktopClearSearch);
  bindSearchBox(dom.mobileSearchInput, dom.mobileSearchResults, dom.btnMobileClearSearch);
}

function bindSearchBox(inputEl, resultsEl, clearBtnEl) {
  if (!inputEl || !resultsEl) return;

  let debounceTimer = null;

  inputEl.addEventListener('input', () => {
    const query = inputEl.value.trim();
    if (clearBtnEl) {
      clearBtnEl.classList.toggle('hidden', query.length === 0);
    }

    if (query.length < 2) {
      resultsEl.classList.add('hidden');
      resultsEl.innerHTML = '';
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => executeSearch(query, resultsEl), 150);
  });

  if (clearBtnEl) {
    clearBtnEl.addEventListener('click', () => {
      inputEl.value = '';
      clearBtnEl.classList.add('hidden');
      resultsEl.classList.add('hidden');
      resultsEl.innerHTML = '';
      inputEl.focus();
    });
  }

  document.addEventListener('click', (e) => {
    if (!inputEl.contains(e.target) && !resultsEl.contains(e.target)) {
      resultsEl.classList.add('hidden');
    }
  });

  inputEl.addEventListener('focus', () => {
    if (inputEl.value.trim().length >= 2 && resultsEl.children.length > 0) {
      positionSearchResults(inputEl, resultsEl);
      resultsEl.classList.remove('hidden');
    }
  });
}

function positionSearchResults(inputEl, resultsEl) {
  if (resultsEl.parentElement !== document.body) {
    document.body.appendChild(resultsEl);
  }
  const rect = inputEl.getBoundingClientRect();
  resultsEl.style.position = 'fixed';
  resultsEl.style.top = `${rect.bottom + 6}px`;
  resultsEl.style.zIndex = '99999';

  if (window.innerWidth <= 768) {
    resultsEl.style.left = '10px';
    resultsEl.style.right = '10px';
    resultsEl.style.width = 'auto';
    resultsEl.style.maxWidth = 'calc(100vw - 20px)';
  } else {
    resultsEl.style.left = `${Math.max(10, rect.left)}px`;
    resultsEl.style.right = 'auto';
    resultsEl.style.width = `${Math.max(rect.width, 360)}px`;
  }
  resultsEl.style.maxHeight = '60vh';
}

async function executeSearch(query, resultsEl) {
  try {
    const res = await fetch(`/api/search-songs?q=${encodeURIComponent(query)}`);
    if (!res.ok) return;
    const data = await res.json();
    renderSearchResults(data.results || [], resultsEl);
  } catch (err) {
    console.error('Erro na busca:', err);
  }
}

function showToast(message, type = 'success') {
  let toastEl = document.getElementById('app-floating-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'app-floating-toast';
    toastEl.className = 'app-floating-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.className = `app-floating-toast visible toast-${type}`;
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 3500);
}

function renderSearchResults(items, resultsEl) {
  if (items.length === 0) {
    resultsEl.innerHTML = `<div class="search-empty-state">Nenhuma música encontrada</div>`;
    const inputEl = (resultsEl === dom.desktopSearchResults) ? dom.desktopSearchInput : dom.mobileSearchInput;
    if (inputEl) positionSearchResults(inputEl, resultsEl);
    resultsEl.classList.remove('hidden');
    return;
  }

  resultsEl.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'search-item-row';
    row.innerHTML = `
      <div class="search-item-info">
        <div class="search-item-title">${escapeHtml(item.name)}</div>
        <div class="search-item-meta">
          <span class="search-item-lib-badge">${escapeHtml(item.libraryName || 'Música')}</span>
          <span>Apresentação</span>
        </div>
      </div>
      <button class="btn-add-search-playlist" title="Adicionar ao final da Playlist de Culto sem tocar ao vivo e sem sair da tela">
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>Add à Playlist</span>
      </button>
    `;

    // Botão de adicionar à playlist sem disparar no telão e sem sair da tela atual
    const btnAdd = row.querySelector('.btn-add-search-playlist');
    if (btnAdd) {
      btnAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAddSongToCultoPlaylist(item, resultsEl);
      });
    }

    // Clique na linha abre a apresentação
    row.addEventListener('click', () => {
      resultsEl.classList.add('hidden');
      openPresentationFromSearch(item);
    });
    resultsEl.appendChild(row);
  });

  const inputEl = (resultsEl === dom.desktopSearchResults) ? dom.desktopSearchInput : dom.mobileSearchInput;
  if (inputEl) positionSearchResults(inputEl, resultsEl);

  resultsEl.classList.remove('hidden');
}

async function handleAddSongToCultoPlaylist(item, resultsEl) {
  // Abre o seletor de playlist para o usuário escolher onde adicionar
  openPlaylistPicker(item);
}

// ==========================================================================
// MODAL SELETOR DE PLAYLIST (PICKER)
// ==========================================================================
function getOrCreatePickerOverlay() {
  let overlay = document.getElementById('playlist-picker-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'playlist-picker-overlay';
    overlay.className = 'playlist-picker-overlay';
    overlay.innerHTML = `
      <div class="playlist-picker-modal">
        <div class="playlist-picker-header">
          <div>
            <h3>Escolha a Playlist</h3>
            <div class="picker-song-name" id="picker-song-name"></div>
          </div>
          <button class="playlist-picker-close" id="picker-close-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="playlist-picker-list" id="picker-list"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Fechar ao clicar fora ou no X
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePlaylistPicker();
    });
    document.getElementById('picker-close-btn').addEventListener('click', () => closePlaylistPicker());
  }
  return overlay;
}

function closePlaylistPicker() {
  const overlay = document.getElementById('playlist-picker-overlay');
  if (overlay) overlay.classList.remove('open');
}

async function openPlaylistPicker(songItem) {
  const overlay = getOrCreatePickerOverlay();
  const listEl = document.getElementById('picker-list');
  const songNameEl = document.getElementById('picker-song-name');

  songNameEl.textContent = `♪ ${songItem.name}`;
  listEl.innerHTML = `<div class="playlist-picker-loading"><div class="spinner"></div> Buscando playlists...</div>`;
  overlay.classList.add('open');

  try {
    const res = await fetch('/api/list-culto-playlists');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao listar playlists');
    const playlists = data.playlists || [];

    if (playlists.length === 0) {
      listEl.innerHTML = `<div class="playlist-picker-empty">Nenhuma playlist de culto encontrada no ProPresenter.</div>`;
      return;
    }

    listEl.innerHTML = '';
    playlists.forEach(pl => {
      const item = document.createElement('div');
      item.className = 'playlist-picker-item';
      item.innerHTML = `
        <div class="picker-pl-icon">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
        <span class="picker-pl-name">${pl.group ? escapeHtml(pl.group) + ' › ' : ''}${escapeHtml(pl.name)}</span>
      `;
      item.addEventListener('click', () => {
        closePlaylistPicker();
        confirmAddToPlaylist(songItem, pl);
      });
      listEl.appendChild(item);
    });
  } catch (err) {
    listEl.innerHTML = `<div class="playlist-picker-empty">Erro ao buscar playlists: ${err.message}</div>`;
  }
}

async function confirmAddToPlaylist(songItem, playlist) {
  showToast(`Adicionando "${songItem.name}" à ${playlist.name}...`, 'info');

  try {
    const res = await fetch('/api/add-song-to-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songUuid: songItem.uuid,
        songName: songItem.name,
        playlistId: playlist.uuid || playlist.name,
        playlistName: playlist.name
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`✓ "${songItem.name}" adicionada à ${data.playlistName}!` + ((data.avisos && data.avisos.length) ? ' ⚠ ' + data.avisos.join(' ') : ''), 'success');

      // Se o usuário já estiver na tela de apresentações com essa playlist aberta, atualiza a lista
      if (state.activePlaylistType === 'presentation' && state.activePlaylistId === data.playlistId) {
        await loadPlaylistItems('presentation', data.playlistId);
      }
    } else {
      showToast(`Erro ao adicionar: ${data.error || 'Falha na API'}`, 'info');
      if (data.details) console.warn('Detalhe do ProPresenter:', data.status, data.details);
    }
  } catch (err) {
    console.error('Erro ao adicionar música na playlist:', err);
    showToast('Erro ao comunicar com o servidor', 'info');
  }
}

async function openPresentationFromSearch(item) {
  state.activePlaylistType = 'presentation';
  state.activePlaylistName = item.libraryName || 'Biblioteca';
  dom.playlistTypeLabel.textContent = 'MÚSICA';
  dom.activePlaylistTitle.textContent = item.name;

  // Atualiza título da coluna de slides
  dom.selectedPresentationTitle.textContent = item.name;
  dom.itemsSectionHeader.textContent = item.name;

  // Carrega slides da apresentação
  await loadPresentationSlides(item.uuid, item.name, 0, false);
}

// ==========================================================================
// POLLING DE STATUS AO VIVO
// ==========================================================================
function startStatusPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(fetchLiveSlideStatus, 1000);
}

let audioPollCounter = 0;
let pollInFlight = false;
const POLL_QUIET_AFTER_CLICK_MS = 2500;

async function fetchLiveSlideStatus() {
  if (++audioPollCounter % 3 === 0) {
    checkAudioTransportStatus();
  }

  // Nunca deixa duas consultas rodando juntas, e fica quieto logo após um toque do usuário:
  // o ProPresenter ainda pode devolver o slide/música ANTIGOS e o app "voltaria" o destaque.
  if (pollInFlight) return;
  if (Date.now() - lastUserActionTime < POLL_QUIET_AFTER_CLICK_MS) return;
  pollInFlight = true;
  const startedAt = Date.now();
  try {
    await pollLiveStatusOnce(startedAt);
  } finally {
    pollInFlight = false;
  }
}

async function pollLiveStatusOnce(startedAt) {
  // Descarta a resposta se o usuário tocou em algo depois que esta consulta começou
  const isStale = () => lastUserActionTime > startedAt;

  // 1. SINCRONISMO AO VIVO DE MÍDIA / PROCONTENT (Acompanha automaticamente entre Tablets, Celular e ProPresenter)
  if (state.activePlaylistType === 'media') {
    try {
      const activeMediaData = await apiRequest('/v1/media/playlist/active');
      const samePlaylist = !activeMediaData?.playlist?.uuid || String(activeMediaData.playlist.uuid) === String(state.activePlaylistId);
      if (!isStale() && samePlaylist && activeMediaData && activeMediaData.item) {
        const mItem = activeMediaData.item;
        const mIdx = (mItem.index !== undefined) ? mItem.index : 0;
        const mUuid = mItem.uuid;

        if (mUuid !== state.liveMediaUuid || mIdx !== state.liveMediaIndex) {
          state.liveMediaUuid = mUuid;
          state.liveMediaIndex = mIdx;
          state.selectedItemIndex = mIdx;

          // Destaca o card na lista vertical (coluna esquerda) e rola até ele
          highlightPlaylistItem(mIdx);

          // Destaca o card no grid de thumbnails (coluna direita - imagem 1) e rola até ele
          highlightActiveMediaCard(mIdx);

          // Atualiza o player de preview ao vivo
          dom.liveItemTitle.textContent = mItem.name || 'Mídia';
          const totalItems = state.playlistItems?.length || 1;
          dom.liveCueSubtitle.textContent = `${state.activePlaylistName || 'Mídia'} • item ${mIdx + 1} de ${totalItems}`;

          dom.previewPlaceholder.classList.add('hidden');
          dom.previewTextOverlay.classList.add('hidden');
          dom.liveSlideImage.classList.remove('hidden');
          dom.liveSlideImage.src = `/api/v1/media/${mUuid}/thumbnail?t=${Date.now()}`;
        }
      }
    } catch (err) {
      // Silencioso
    }
  }

  // 2. SINCRONISMO AO VIVO DE APRESENTAÇÕES (PLAYLIST DE CULTO / MÚSICAS)
  if (state.activePlaylistType === 'presentation') {
    try {
      const slideIndexData = await apiRequest('/v1/presentation/slide_index');
      if (!isStale() && slideIndexData && slideIndexData.presentation_index) {
        const pIndex = slideIndexData.presentation_index;
        const curIdx = pIndex.index;
        const presUuid = pIndex.presentation_id?.uuid;
        const presName = pIndex.presentation_id?.name;
        // A API não informa o total de slides: só usa a contagem quando a grade carregada é desta apresentação
        const knownTotal = (state.currentPresentationUuid === presUuid) ? state.currentPresentationSlides.length : 0;
        const totalCues = knownTotal || pIndex.total_cues || 0;
        const slideLabel = totalCues ? `Slide ${curIdx + 1} de ${totalCues}` : `Slide ${curIdx + 1}`;

        if (curIdx !== state.liveSlideIndex || presUuid !== state.livePresentationUuid) {
          state.liveSlideIndex = curIdx;
          state.currentSlideIndex = curIdx;
          state.livePresentationUuid = presUuid;

          dom.liveItemTitle.textContent = presName || 'Apresentação';
          dom.liveCueSubtitle.textContent = slideLabel;

          dom.previewPlaceholder.classList.add('hidden');

          // Se a apresentação ativa no ProPresenter mudou, carrega os slides dela automaticamente
          if (presUuid && (!state.currentPresentationUuid || state.currentPresentationUuid !== presUuid)) {
            state.currentPresentationUuid = presUuid;
            dom.selectedPresentationTitle.textContent = presName || 'Apresentação';
            dom.itemsSectionHeader.textContent = presName || 'Apresentação';
            loadPresentationSlides(presUuid, presName, curIdx, false);
          } else {
            const curSlide = state.currentPresentationSlides && state.currentPresentationSlides[curIdx];
            const hasLyrics = curSlide && curSlide.text && curSlide.text.trim().length > 0;
            const slideKey = `${presUuid}_${curIdx}`;

            if (hasLyrics) {
              dom.liveSlideImage.classList.add('hidden');
              dom.liveSlideImage.dataset.loadedUuid = '';
              dom.previewTextOverlay.classList.remove('hidden');
              dom.previewTextOverlay.innerHTML = `<div class="slide-lyrics-text" style="font-size: 20px; font-weight: 700; color: #fff;">${escapeHtml(curSlide.text)}</div>`;
            } else {
              dom.previewTextOverlay.classList.add('hidden');
              dom.previewTextOverlay.innerHTML = '';
              dom.liveSlideImage.classList.remove('hidden');

              if (dom.liveSlideImage.dataset.loadedUuid !== slideKey) {
                dom.liveSlideImage.dataset.loadedUuid = slideKey;
                dom.liveSlideImage.src = `/api/v1/presentation/${presUuid}/thumbnail/${curIdx}?t=${Date.now()}`;
              }
            }

            highlightActiveSlide(curIdx);
          }
        }
      }
    } catch (err) {
      // Silencioso
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

// ==========================================================================
// 1. STAGE DISPLAY (MONITORES DE PALCO E MENSAGENS)
// ==========================================================================
// ATENCAO: o ProPresenter devolve TROCADAS as telas 1 e 2 quando a LEITURA do layout e por indice
// (GET /v1/stage/screen/{indice}/layout). Por UUID (ou nome) a leitura e correta; por isso as telas
// sao SEMPRE enderecadas pelo UUID. O indice so serve para a preferencia antiga e para exibir.
function stageScreenIndex(s) { return (s.index !== undefined) ? s.index : (s.id?.index ?? 0); }
function stageScreenId(s) { return s.uuid || s.id?.uuid || stageScreenIndex(s); }
function stageScreenName(s) { return s.name || s.id?.name || ''; }
function stageSyncKey(s) { return `${stageScreenName(s).toLowerCase()}#${stageScreenIndex(s)}`; }
function readStageSyncMap() {
  try { return JSON.parse(localStorage.getItem('propresenter_stage_sync_map') || '{}') || {}; } catch (e) { return {}; }
}
function jsArgs(...args) { return escapeHtml(args.map(a => JSON.stringify(a)).join(',')); }

// Regra UNICA de "esta tela muda junto com o botao Plataforma?"
function isStageScreenSynced(screen) {
  const map = readStageSyncMap();
  const name = stageScreenName(screen).toLowerCase();
  const key = stageSyncKey(screen);
  if (map[key] !== undefined) return Boolean(map[key]);
  if (map[name] !== undefined) return Boolean(map[name]);
  if (map[stageScreenIndex(screen)] !== undefined) return Boolean(map[stageScreenIndex(screen)]);
  // Padrao: iPad ou NDI e sempre independente; retornos de plataforma mudam em conjunto
  return !(name.includes('ipad') || name.includes('ndi'));
}

function buildStageAllSectionHtml() {
  if (stageLayoutsCache.length === 0 || stageScreensCache.length === 0) return '';
  const synced = stageScreensCache.filter(isStageScreenSynced);
  const names = synced.map(s => stageScreenName(s) || 'Retorno').join(' e ');
  let html = `
    <div class="stage-all-screens-card">
      <div class="stage-all-screens-header">
        <span class="stage-all-title">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          Mudar Retornos Plataforma (${synced.length} Telas)
        </span>
        <span class="stage-all-hint">${synced.length ? 'Aplica em ' + escapeHtml(names) + ' (as telas desmarcadas ficam independentes)' : 'Nenhuma tela marcada em "Mudar em conjunto".'}</span>
      </div>
      <div class="stage-all-grid">`;
  stageLayoutsCache.forEach((layout, lIdx) => {
    const layoutName = layout.id?.name || layout.name || `Layout ${lIdx + 1}`;
    const layoutUuid = layout.id?.uuid || layout.uuid || (layout.id?.index !== undefined ? layout.id.index : lIdx);
    html += `
        <button class="stage-layout-chip stage-layout-chip-all" ${synced.length ? '' : 'disabled style="opacity:.5"'}
                onclick="handleSetAllStageLayouts(${jsArgs(String(layoutUuid), layoutName)})">
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span class="chip-text">Plataforma: ${escapeHtml(layoutName)}</span>
        </button>`;
  });
  html += `
      </div>
    </div>`;
  return html;
}

// O ProPresenter IGNORA em silêncio (respondendo 204) uma troca de layout que chega menos de ~100 ms
// depois de outra. Por isso as trocas entram numa fila, com intervalo entre elas, e cada uma é
// conferida lendo o layout da tela de volta (com nova tentativa se o ProPresenter ignorou).
const STAGE_SET_GAP_MS = 400;
let stageSetChain = Promise.resolve();

function stageSetLayoutSafe(screenId, layoutTarget) {
  const enc = encodeURIComponent;
  const target = String(layoutTarget);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
  const job = stageSetChain.then(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await apiRequest(`/v1/stage/screen/${enc(screenId)}/layout/${enc(target)}`);
      await new Promise(r => setTimeout(r, STAGE_SET_GAP_MS));
      if (!res) continue;
      if (!isUuid) return true;
      const cur = await apiRequest(`/v1/stage/screen/${enc(screenId)}/layout`);
      const curUuid = cur && typeof cur === 'object' ? (cur.uuid || cur.id?.uuid) : null;
      if (!curUuid || curUuid.toLowerCase() === target.toLowerCase()) return true;
    }
    return false;
  });
  stageSetChain = job.catch(() => {});
  return job;
}

async function refreshStageCurrentLayouts(onlyIds) {
  const wanted = onlyIds ? onlyIds.map(String) : null;
  const screens = stageScreensCache.filter(s => !wanted || wanted.includes(String(stageScreenId(s))));
  await Promise.all(screens.map(async (s) => {
    const id = stageScreenId(s);
    const cur = await apiRequest(`/v1/stage/screen/${encodeURIComponent(id)}/layout`);
    const card = document.getElementById(`stage-card-screen-${id}`);
    if (!card || !cur || typeof cur !== 'object') return;
    const curName = (cur.name || cur.id?.name || '').toLowerCase();
    const curUuid = cur.id?.uuid || cur.uuid;
    card.querySelectorAll('.stage-layout-chip').forEach(c => {
      const match = (curUuid && c.dataset.layoutId === String(curUuid)) ||
                    (curName && (c.dataset.layoutName || '').toLowerCase() === curName);
      c.classList.toggle('active', Boolean(match));
    });
    const lbl = card.querySelector('.lbl-cur-layout');
    if (lbl && (cur.name || cur.id?.name)) lbl.textContent = cur.name || cur.id.name;
  }));
}

let stageScreensCache = [];
let stageLayoutsCache = [];

async function openStageModal() {
  if (dom.stageModal) {
    dom.stageModal.classList.add('open');
    await loadStageData();
  }
}

function closeStageModal() {
  if (dom.stageModal) dom.stageModal.classList.remove('open');
}

async function loadStageData() {
  if (!dom.stageBodyContainer) return;
  dom.stageBodyContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #9ca3af;">Carregando telas de palco e layouts...</div>';

  try {
    const [screens, layouts, currentMessage] = await Promise.all([
      apiRequest('/v1/stage/screens'),
      apiRequest('/v1/stage/layouts'),
      apiRequest('/v1/stage/message')
    ]);

    stageScreensCache = Array.isArray(screens) ? screens : [];
    stageLayoutsCache = Array.isArray(layouts) ? layouts : [];

    if (dom.stageBadgeCount) {
      dom.stageBadgeCount.textContent = `${stageScreensCache.length} Telas`;
    }

    // Busca o layout atual de cada tela individualmente
    const screenLayoutPromises = stageScreensCache.map(s => {
      return apiRequest(`/v1/stage/screen/${encodeURIComponent(stageScreenId(s))}/layout`);
    });
    const currentLayouts = await Promise.all(screenLayoutPromises);

    window.toggleScreenSyncPreference = function(screenId, screenName, checked) {
      const screen = stageScreensCache.find(s => String(stageScreenId(s)) === String(screenId) && stageScreenName(s) === screenName)
                  || stageScreensCache.find(s => String(stageScreenId(s)) === String(screenId));
      if (!screen) return;
      try {
        const map = readStageSyncMap();
        map[stageSyncKey(screen)] = checked;
        localStorage.setItem('propresenter_stage_sync_map', JSON.stringify(map));
      } catch (err) {
        console.error('Erro ao salvar preferencia de sincronizacao de palco:', err);
      }
      const card = document.getElementById(`stage-card-screen-${screenId}`);
      if (card) {
        card.classList.toggle('is-independent', !checked);
        const badgeContainer = card.querySelector('.stage-badge-container');
        if (badgeContainer) {
          badgeContainer.innerHTML = checked
            ? '<span class="stage-sync-badge" title="Muda junto ao clicar nos botões da Plataforma">⚡ Plataforma</span>'
            : '<span class="stage-independent-badge" title="Tela 100% independente: não altera ao clicar nos botões da Plataforma">🔒 Independente</span>';
        }
      }
      const section = document.getElementById('stage-all-section');
      if (section) section.innerHTML = buildStageAllSectionHtml();
      showToast(checked ? `"${screenName}" agora muda junto com a Plataforma.` : `"${screenName}" agora é 100% independente!`, 'info');
    };

    let html = '';

    // =========================================================================
    // SEÇÃO 1: MUDAR RETORNOS DA PLATAFORMA (R & L) - EXCLUI IPAD/NDI
    // =========================================================================
    html += `<div id="stage-all-section">${buildStageAllSectionHtml()}</div>`;

    // =========================================================================
    // SEÇÃO 2: CONTROLE INDEPENDENTE DE CADA TELA
    // =========================================================================
    html += `
      <div class="stage-section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
        </svg>
        Controle Individual por Tela de Retorno
      </div>
      <div class="stage-screens-list">
    `;

    if (stageScreensCache.length === 0) {
      html += '<div style="color: #6b7280; font-size: 13px; padding: 10px;">Nenhuma tela de palco configurada no momento.</div>';
    } else {
      stageScreensCache.forEach((screen, sIdx) => {
        const screenName = screen.name || screen.id?.name || `Retorno ${sIdx + 1}`;
        const screenId = stageScreenId(screen);
        const curLayoutObj = currentLayouts[sIdx];
        const curLayoutName = curLayoutObj?.name || curLayoutObj?.id?.name || 'Padrão';
        const curLayoutIdx = (curLayoutObj?.index !== undefined) ? curLayoutObj.index : curLayoutObj?.id?.index;
        const curLayoutUuid = curLayoutObj?.id?.uuid || curLayoutObj?.uuid;
        const isSync = isStageScreenSynced(screen);

        html += `
          <div class="stage-screen-card ${isSync ? '' : 'is-independent'}" id="stage-card-screen-${screenId}" data-screen-id="${screenId}">
            <div class="stage-screen-header">
              <div class="stage-screen-name-row">
                <span class="stage-screen-name">📺 ${escapeHtml(screenName)}</span>
                <span class="stage-badge-container">
                  ${isSync 
                    ? '<span class="stage-sync-badge" title="Muda junto ao clicar nos botões da Plataforma">⚡ Plataforma</span>' 
                    : '<span class="stage-independent-badge" title="Tela 100% independente: não altera ao clicar nos botões da Plataforma">🔒 Independente</span>'}
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <label class="stage-sync-toggle-label" title="Marque para incluir ou desmarque para deixar independente">
                  <input type="checkbox" ${isSync ? 'checked' : ''} onchange="toggleScreenSyncPreference(${jsArgs(String(screenId), screenName)}, this.checked)">
                  <span>Mudar em conjunto</span>
                </label>
                <span class="stage-screen-current-layout">Layout Atual: <strong class="lbl-cur-layout">${escapeHtml(curLayoutName)}</strong></span>
              </div>
            </div>
            <div class="stage-layouts-grid">
        `;

        stageLayoutsCache.forEach((layout, lIdx) => {
          const layoutName = layout.id?.name || layout.name || `Layout ${lIdx + 1}`;
          const layoutId = (layout.id?.index !== undefined) ? layout.id.index : (layout.index !== undefined ? layout.index : lIdx);
          const layoutUuid = layout.id?.uuid || layout.uuid || layoutId;
          const isActive = (curLayoutUuid && curLayoutUuid === layoutUuid) ||
                           (curLayoutIdx !== undefined && curLayoutIdx === layoutId) || 
                           (curLayoutName.toLowerCase() === layoutName.toLowerCase());

          html += `
            <button class="stage-layout-chip ${isActive ? 'active' : ''}" 
                    data-layout-id="${layoutUuid}"
                    data-layout-name="${escapeHtml(layoutName)}"
                    onclick="handleSetStageLayout(${jsArgs(String(screenId), String(layoutUuid), layoutName)}, this)">
              ${escapeHtml(layoutName)}
            </button>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });
    }

    html += `
      </div>
    `;

    // =========================================================================
    // SEÇÃO 3: MENSAGEM DE PALCO
    // =========================================================================
    const msgText = (typeof currentMessage === 'string') ? currentMessage : (currentMessage?.message || '');
    html += `
      <div class="stage-message-box">
        <div class="stage-section-title" style="margin-top: 0;">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Mensagem para o Palco (Avisos aos Ministros / Pregador)
        </div>
        <div class="stage-msg-input-row">
          <input type="text" id="stage-msg-input" class="stage-msg-input" 
                 placeholder="Digite um aviso para o retorno (ex: '2 minutos', 'Falar mais alto')..." 
                 value="${escapeHtml(msgText)}" />
          <button class="btn-primary" onclick="handleSendStageMessage()">
            Enviar
          </button>
          <button class="btn-pro-clear" onclick="handleClearStageMessage()">
            Limpar
          </button>
        </div>
      </div>
    `;

    dom.stageBodyContainer.innerHTML = html;
  } catch (err) {
    dom.stageBodyContainer.innerHTML = '<div style="color: #ef4444; padding: 20px; text-align: center;">Erro ao carregar dados do Stage Display. Verifique a conexão com o ProPresenter.</div>';
  }
}

// Troca o layout de UMA tela; depois confere no ProPresenter o que realmente ficou
window.handleSetStageLayout = async function(screenId, layoutTarget, layoutName, btnEl) {
  const parentCard = document.getElementById(`stage-card-screen-${screenId}`) || btnEl?.closest('.stage-screen-card');
  if (parentCard && btnEl) {
    parentCard.querySelectorAll('.stage-layout-chip').forEach(c => c.classList.remove('active'));
    btnEl.classList.add('active');
  }
  const ok = await stageSetLayoutSafe(screenId, layoutTarget);
  if (!ok) showToast('O ProPresenter não aplicou o layout nesta tela.', 'info');
  await refreshStageCurrentLayouts([screenId]);
};

// Troca o layout so das telas marcadas em "Mudar em conjunto"; avisa quais falharam
window.handleSetAllStageLayouts = async function(layoutTarget, layoutName) {
  const targets = stageScreensCache.filter(isStageScreenSynced);
  if (targets.length === 0) {
    showToast('Nenhuma tela está marcada em "Mudar em conjunto".', 'info');
    return;
  }
  const failed = [];
  for (const screen of targets) {
    const id = stageScreenId(screen);
    const ok = await stageSetLayoutSafe(id, layoutTarget);
    if (!ok) failed.push(stageScreenName(screen) || `tela ${id}`);
  }
  await refreshStageCurrentLayouts(targets.map(stageScreenId));
  if (failed.length) {
    showToast(`Falhou em: ${failed.join(', ')}`, 'info');
  } else {
    showToast(`✓ Retornos alterados para "${layoutName}"`, 'info');
  }
};

window.handleSendStageMessage = async function() {
  const input = document.getElementById('stage-msg-input');
  if (!input) return;
  const msg = input.value.trim();
  try {
    const res = msg
      ? await fetch('/api/v1/stage/message', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) })
      : await fetch('/api/v1/stage/message', { method: 'DELETE' });
    if (res.ok) {
      showToast(msg ? 'Mensagem enviada aos retornos de palco.' : 'Mensagem de palco limpa.', 'success');
    } else {
      showToast(`Erro ${res.status} ao enviar a mensagem de palco.`, 'info');
    }
  } catch (err) {
    console.error('Erro ao enviar mensagem de palco:', err);
    showToast('Sem conexão com o servidor.', 'info');
  }
};

window.handleClearStageMessage = async function() {
  const input = document.getElementById('stage-msg-input');
  try {
    const res = await fetch('/api/v1/stage/message', { method: 'DELETE' });
    if (res.ok) {
      if (input) input.value = '';
      showToast('Mensagem de palco limpa.', 'success');
    } else {
      showToast(`Erro ${res.status} ao limpar a mensagem de palco.`, 'info');
    }
  } catch (err) {
    console.error('Erro ao limpar mensagem de palco:', err);
    showToast('Sem conexão com o servidor.', 'info');
  }
};

// ==========================================================================
// 2. TIMERS (CRONÔMETROS DE CULTO)
// ==========================================================================
let timersInterval = null;

async function openTimersModal() {
  if (dom.timersModal) {
    dom.timersModal.classList.add('open');
    await loadTimersData();
    if (timersInterval) clearInterval(timersInterval);
    timersInterval = setInterval(loadTimersData, 1000);
  }
}

function closeTimersModal() {
  if (dom.timersModal) dom.timersModal.classList.remove('open');
  if (timersInterval) {
    clearInterval(timersInterval);
    timersInterval = null;
  }
}

async function loadTimersData() {
  if (!dom.timersBodyContainer) return;
  try {
    const timers = await apiRequest('/v1/timers/current');
    if (!timers || !Array.isArray(timers)) {
      if (!dom.timersBodyContainer.innerHTML.includes('timer-card')) {
        dom.timersBodyContainer.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 20px;">Nenhum cronômetro ativo configurado no ProPresenter.</div>';
      }
      return;
    }

    if (dom.timersBadgeCount) {
      dom.timersBadgeCount.textContent = `${timers.length} Cronômetros`;
    }

    let html = '';
    timers.forEach(t => {
      const name = t.id?.name || 'Cronômetro';
      const id = t.id?.index ?? t.id?.uuid ?? 0;
      const timeStr = t.time || '00:00';
      const stateStr = (t.state || 'stopped').toLowerCase();
      const isRunning = stateStr === 'running';
      const isOver = stateStr === 'overrunning' || stateStr === 'overran';
      const statusLabel = isRunning ? '● Rodando' : (isOver ? '● Estourado' : '○ Parado');

      html += `
        <div class="timer-card" data-timer-id="${id}">
          <div class="timer-card-header">
            <span class="timer-card-title">⏱️ ${escapeHtml(name)}</span>
            <span class="timer-card-status ${isRunning || isOver ? 'running' : ''}">
              ${statusLabel}
            </span>
          </div>
          <div class="timer-display-box">
            <div class="timer-display-time">${escapeHtml(timeStr)}</div>
          </div>
          <div class="timer-controls-row">
            <div class="timer-main-btns">
              <button class="btn-timer-action btn-timer-start" onclick="handleTimerControl(${jsArgs(id, 'start')})">
                ▶ Iniciar
              </button>
              <button class="btn-timer-action btn-timer-stop" onclick="handleTimerControl(${jsArgs(id, 'stop')})">
                ⏸ Pausar
              </button>
              <button class="btn-timer-action btn-timer-reset" onclick="handleTimerControl(${jsArgs(id, 'reset')})">
                ↺ Reiniciar
              </button>
            </div>
            <div class="timer-inc-btns">
              <button class="btn-timer-action btn-timer-inc" onclick="handleTimerIncrement(${jsArgs(id, 60)})">
                +1 min
              </button>
              <button class="btn-timer-action btn-timer-inc" onclick="handleTimerIncrement(${jsArgs(id, 300)})">
                +5 min
              </button>
            </div>
          </div>
        </div>
      `;
    });

    // Se os cronometros sao os mesmos, so atualiza hora/estado (recriar os botoes a cada segundo perde toques)
    const existing = dom.timersBodyContainer.querySelectorAll('.timer-card');
    const sameSet = existing.length === timers.length &&
      [...existing].every((el, i) => el.dataset.timerId === String(timers[i].id?.index ?? timers[i].id?.uuid ?? 0));
    if (sameSet) {
      timers.forEach((t, i) => {
        const el = existing[i];
        const st = (t.state || 'stopped').toLowerCase();
        const running = st === 'running';
        const over = st === 'overrunning' || st === 'overran';
        el.querySelector('.timer-display-time').textContent = t.time || '00:00';
        const stEl = el.querySelector('.timer-card-status');
        stEl.textContent = running ? '● Rodando' : (over ? '● Estourado' : '○ Parado');
        stEl.classList.toggle('running', running || over);
      });
    } else {
      dom.timersBodyContainer.innerHTML = html;
    }
  } catch (err) {
    console.error('Erro ao atualizar cronômetros:', err);
  }
}

window.handleTimerControl = async function(timerId, op) {
  try {
    await apiRequest(`/v1/timer/${encodeURIComponent(timerId)}/${op}`);
    await loadTimersData();
  } catch (err) {
    console.error(`Erro ao executar ${op} no timer:`, err);
  }
};

window.handleTimerIncrement = async function(timerId, seconds) {
  try {
    await apiRequest(`/v1/timer/${encodeURIComponent(timerId)}/increment/${seconds}`);
    await loadTimersData();
  } catch (err) {
    console.error('Erro ao incrementar timer:', err);
  }
};

// ==========================================================================
// 3. VIDEO INPUTS (ENTRADAS DE VÍDEO / INPUT)
// ==========================================================================
async function openVideoInputsModal() {
  if (dom.videoInputsModal) {
    dom.videoInputsModal.classList.add('open');
    await loadVideoInputsData();
  }
}

function closeVideoInputsModal() {
  if (dom.videoInputsModal) dom.videoInputsModal.classList.remove('open');
}

async function loadVideoInputsData() {
  if (!dom.videoInputsBodyContainer) return;
  dom.videoInputsBodyContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #9ca3af;">Carregando entradas de vídeo...</div>';

  try {
    const inputs = await apiRequest('/v1/video_inputs');
    const inputList = Array.isArray(inputs) ? inputs : [];

    if (dom.videoInputsBadgeCount) {
      dom.videoInputsBadgeCount.textContent = `${inputList.length} Entradas`;
    }

    if (inputList.length === 0) {
      dom.videoInputsBodyContainer.innerHTML = `
        <div style="color: #6b7280; font-size: 13px; text-align: center; padding: 20px;">
          Nenhuma entrada de vídeo (câmera, placa de captura ou NDI) configurada no ProPresenter.
        </div>
      `;
      return;
    }

    let html = `
      <div class="video-inputs-hint" style="margin-bottom: 10px; font-size: 12.5px; color: #9ca3af;">
        Selecione uma entrada de vídeo ao vivo para colocar no ar imediatamente:
      </div>
      <div class="video-inputs-grid">
    `;

    inputList.forEach((item, idx) => {
      const name = item.name || item.id?.name || `Entrada ${idx + 1}`;
      const id = item.uuid ?? item.id?.uuid ?? item.index ?? item.id?.index ?? idx;
      const displayIndex = item.index ?? item.id?.index ?? idx;

      html += `
        <div class="video-input-card">
          <div class="video-input-header">
            <div class="video-input-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            </div>
            <div class="video-input-info">
              <div class="video-input-name">${escapeHtml(name)}</div>
              <div class="video-input-index">Canal / Input #${displayIndex}</div>
            </div>
          </div>
          <button class="btn-trigger-input" onclick="handleTriggerVideoInput(${jsArgs(id)})">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Disparar no Telão</span>
          </button>
        </div>
      `;
    });

    html += `
      </div>
      <button class="btn-clear-video-input" onclick="handleClearVideoInput()">
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Limpar Entrada de Vídeo (Remover do Telão)
      </button>
    `;

    dom.videoInputsBodyContainer.innerHTML = html;
  } catch (err) {
    dom.videoInputsBodyContainer.innerHTML = '<div style="color: #ef4444; padding: 20px; text-align: center;">Erro ao carregar entradas de vídeo.</div>';
  }
}

window.handleTriggerVideoInput = async function(inputId) {
  try {
    await apiRequest(`/v1/video_inputs/${encodeURIComponent(inputId)}/trigger`);
  } catch (err) {
    console.error('Erro ao disparar entrada de vídeo:', err);
  }
};

window.handleClearVideoInput = async function() {
  try {
    await apiRequest('/v1/clear/layer/video_input');
  } catch (err) {
    console.error('Erro ao limpar entrada de vídeo:', err);
  }
};

// ==========================================================================
// 4. PROPS (OVERLAYS / ADEREÇOS)
// ==========================================================================
async function openPropsModal() {
  if (dom.propsModal) {
    dom.propsModal.classList.add('open');
    await loadPropsData();
  }
}

function closePropsModal() {
  if (dom.propsModal) dom.propsModal.classList.remove('open');
}

async function loadPropsData() {
  if (!dom.propsBodyContainer) return;
  dom.propsBodyContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #9ca3af;">Carregando Props...</div>';

  try {
    const props = await apiRequest('/v1/props');
    const propList = Array.isArray(props) ? props : [];

    if (dom.propsBadgeCount) {
      dom.propsBadgeCount.textContent = `${propList.length} Props`;
    }

    if (propList.length === 0) {
      dom.propsBodyContainer.innerHTML = `
        <div style="color: #6b7280; font-size: 13px; text-align: center; padding: 20px;">
          Nenhum Prop (Overlay / Adereço) configurado no ProPresenter.
        </div>
      `;
      return;
    }

    let html = `
      <div style="margin-bottom: 12px; font-size: 13px; color: #9ca3af;">
        Adereços e sobreposições ativas no ProPresenter:
      </div>
      <div class="props-grid">
    `;

    propList.forEach((prop, idx) => {
      const name = prop.id?.name || prop.name || `Prop ${idx + 1}`;
      const id = prop.id?.index ?? prop.id?.uuid ?? idx;
      const activeTag = prop.is_active ? ' <span style="color:#22c55e;font-size:11px;font-weight:700;">● ATIVO</span>' : '';

      html += `
        <div class="prop-card">
          <div class="prop-name">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="#a78bfa" stroke-width="2" fill="none">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            ${escapeHtml(name)}${activeTag}
          </div>
          <div class="prop-actions">
            <button class="btn-trigger-prop" onclick="handleTriggerProp(${jsArgs(id)})">
              Ativar
            </button>
            <button class="btn-pro-clear" onclick="handleClearProp(${jsArgs(id)})">
              Desativar
            </button>
          </div>
        </div>
      `;
    });

    html += `
      </div>
      <button class="btn-clear-all-props" onclick="handleClearAllProps()">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Limpar Todos os Props
      </button>
    `;

    dom.propsBodyContainer.innerHTML = html;
  } catch (err) {
    dom.propsBodyContainer.innerHTML = '<div style="color: #ef4444; padding: 20px; text-align: center;">Erro ao carregar props.</div>';
  }
}

window.handleTriggerProp = async function(propId) {
  try {
    await apiRequest(`/v1/prop/${encodeURIComponent(propId)}/trigger`);
  } catch (err) {
    console.error('Erro ao disparar prop:', err);
  }
};

window.handleClearProp = async function(propId) {
  try {
    await apiRequest(`/v1/prop/${encodeURIComponent(propId)}/clear`);
  } catch (err) {
    console.error('Erro ao limpar prop:', err);
  }
};

window.handleClearAllProps = async function() {
  try {
    await apiRequest('/v1/clear/layer/props');
  } catch (err) {
    console.error('Erro ao limpar camada de props:', err);
  }
};

// ==========================================================================
// 5. CAPTURE (GRAVAÇÃO & TRANSMISSÃO)
// ==========================================================================
let captureInterval = null;

async function openCaptureModal() {
  if (dom.captureModal) {
    dom.captureModal.classList.add('open');
    await loadCaptureData();
    if (captureInterval) clearInterval(captureInterval);
    captureInterval = setInterval(loadCaptureData, 1000);
  }
}

function closeCaptureModal() {
  if (dom.captureModal) dom.captureModal.classList.remove('open');
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
}

async function loadCaptureData() {
  if (!dom.captureBodyContainer) return;
  try {
    const data = await apiRequest('/v1/capture/status');
    const statusStr = (data?.status || 'inactive').toLowerCase();
    const isActive = statusStr === 'active' || statusStr === 'caution';
    const timeStr = data?.capture_time || data?.time || '00:00:00';
    const statusText = statusStr === 'error' ? 'Erro na captura'
      : statusStr === 'caution' ? 'Gravando / Transmitindo (atenção)'
      : isActive ? 'Gravando / Transmitindo' : 'Captura Inativa';

    if (dom.captureBadgeCount) {
      dom.captureBadgeCount.textContent = isActive ? 'AO VIVO' : 'PARADO';
      dom.captureBadgeCount.style.color = isActive ? '#ef4444' : '#9ca3af';
    }

    dom.captureBodyContainer.innerHTML = `
      <div class="capture-status-panel">
        <div class="capture-status-indicator ${isActive ? 'active' : ''}">
          <span style="font-size: 16px;">●</span> ${statusText}
        </div>
        <div class="capture-time-display">${escapeHtml(timeStr)}</div>
      </div>
      <div class="capture-actions-row">
        <button class="btn-capture-start" onclick="handleStartCapture()" ${isActive ? 'disabled style="opacity: 0.5;"' : ''}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="4" fill="currentColor"></circle>
          </svg>
          Iniciar Gravação
        </button>
        <button class="btn-capture-stop" onclick="handleStopCapture()" ${!isActive ? 'disabled style="opacity: 0.5;"' : ''}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <rect x="6" y="6" width="12" height="12"></rect>
          </svg>
          Parar Gravação
        </button>
      </div>
    `;
  } catch (err) {
    console.error('Erro ao verificar status de captura:', err);
  }
}

window.handleStartCapture = async function() {
  try {
    const res = await fetch('/api/v1/capture/start');
    if (!res.ok) showToast('Não foi possível iniciar a gravação.', 'info');
    await loadCaptureData();
  } catch (err) {
    console.error('Erro ao iniciar captura:', err);
  }
};

window.handleStopCapture = async function() {
  try {
    const res = await fetch('/api/v1/capture/stop');
    if (!res.ok) showToast('Não foi possível parar a gravação.', 'info');
    await loadCaptureData();
  } catch (err) {
    console.error('Erro ao parar captura:', err);
  }
};

