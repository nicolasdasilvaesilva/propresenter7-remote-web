// Pele DESKTOP — Fase 2: dados reais do ProPresenter (mesmo backend/API da pele mobile).
// Funções de segurança (fila do Stage, guarda do "pulo") são as MESMAS já testadas em public/js/app.js —
// reaproveitadas aqui porque é código nosso, não copiado de terceiros.

const state = {
  activePlaylistId: null,
  activePlaylistName: '',
  playlistItems: [],
  liveSlideIndex: null,
  livePresentationUuid: null,
  currentPresentationUuid: null,
  currentPresentationSlides: [],
  liveSlideName: '',
  isConnected: false,
};
let lastUserActionTime = 0;
let slidesLoadSeq = 0;

// ==========================================================================
// Troca de abas + toggles do Stage (Fase 1, mantido)
// ==========================================================================
document.querySelectorAll('.pp-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pp-tabpanel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.querySelector(`.pp-tabpanel[data-panel="${tab.dataset.tab}"]`);
    if (panel) panel.classList.add('active');
  });
});

// ==========================================================================
// Comunicação com o proxy da API (igual à pele mobile)
// ==========================================================================
async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = { method };
    if (body !== null && body !== undefined) { options.headers = { 'Content-Type': 'application/json' }; options.body = JSON.stringify(body); }
    const res = await fetch(`/api${endpoint}`, options);
    atualizarStatusConexao(res.status !== 502 && res.status !== 503);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? await res.json() : res;
  } catch (err) {
    atualizarStatusConexao(false);
    return null;
  }
}

function atualizarStatusConexao(conectado) {
  state.isConnected = conectado;
  const dot = document.getElementById('pp-conn-dot');
  const label = document.getElementById('pp-conn-label');
  if (!dot) return;
  dot.className = 'pp-dot ' + (conectado ? 'on-green' : 'on-red-conn');
  if (label) label.textContent = I18N.t(conectado ? 'conectado' : 'sem_conexao', idiomaAtual);
}

// O ProPresenter aninha playlists em pastas: "playlists" (spec) ou "children" (áudio/mídia).
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ==========================================================================
// Preview ao vivo (PGM), em camadas: imagem de fundo (mídia OU o próprio slide)
// + letra por cima, igual pedido pelo dono olhando o painel oficial — "se eu
// passar a letra, a imagem junto, quero que apareçam os dois, que são camadas".
// ==========================================================================
function setLivePreview({ imgUrl, fallbackIcon, lyricsText, title, subtitle, live }) {
  const img = document.getElementById('pp-live-bg-img');
  const fallback = document.getElementById('pp-live-fallback-icon');
  const overlay = document.getElementById('pp-live-lyrics-overlay');
  const box = document.getElementById('pp-live-preview');
  const titleEl = document.getElementById('pp-live-title');
  const subtitleEl = document.getElementById('pp-live-subtitle');

  if (imgUrl) {
    img.classList.remove('hidden');
    fallback.classList.add('hidden');
    if (img.dataset.loadedUrl !== imgUrl) {
      img.dataset.loadedUrl = imgUrl;
      img.src = imgUrl;
      img.onerror = () => { img.classList.add('hidden'); fallback.classList.remove('hidden'); fallback.textContent = fallbackIcon || '🖼️'; };
    }
    box.classList.add('has-media');
  } else {
    img.classList.add('hidden');
    img.dataset.loadedUrl = '';
    fallback.classList.add('hidden');
    box.classList.remove('has-media');
  }

  if (lyricsText) {
    overlay.classList.remove('hidden');
    overlay.innerHTML = `<div class="pp-live-lyrics-text">${escapeHtml(lyricsText)}</div>`;
  } else {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }

  if (titleEl && title !== undefined) titleEl.textContent = title;
  if (subtitleEl && subtitle !== undefined) subtitleEl.textContent = subtitle;
}

function clearLivePreview() {
  setLivePreview({ imgUrl: null, lyricsText: null, title: I18N.t('nada_no_ar', idiomaAtual) || 'Nada no ar', subtitle: '—', live: false });
}

// Carrega os slides/letras de uma apresentação num grid clicável (igual ao mobile),
// para poder ver e escolher o slide certo ANTES de mandar ao vivo.
async function loadPresentationSlides(presUuid, presName, itemIndex, shouldTriggerFirst = false) {
  const grid = document.getElementById('pp-slide-grid');
  if (!grid || !presUuid) return;
  grid.innerHTML = `<div class="pp-slide-grid-empty">${I18N.t('carregando', idiomaAtual) || 'Carregando...'}</div>`;

  const loadSeq = ++slidesLoadSeq;
  const presRaw = await apiRequest(`/v1/presentation/${encodeURIComponent(presUuid)}`);
  if (loadSeq !== slidesLoadSeq) return;
  const presData = presRaw && (presRaw.presentation ? presRaw : (presRaw.groups ? { presentation: presRaw } : null));
  if (!presData) {
    grid.innerHTML = '<div class="pp-slide-grid-empty">Não foi possível carregar os slides desta apresentação.</div>';
    return;
  }

  const pres = presData.presentation;
  state.currentPresentationUuid = presUuid;
  const groups = pres.groups || [];
  const allSlides = [];
  let globalCueIndex = 0;
  groups.forEach(g => {
    (g.slides || []).forEach(s => {
      allSlides.push({ text: s.text || '', cueIndex: globalCueIndex, presUuid });
      globalCueIndex++;
    });
  });
  state.currentPresentationSlides = allSlides;

  if (allSlides.length === 0) {
    grid.innerHTML = '<div class="pp-slide-grid-empty">Esta apresentação não contém slides.</div>';
    return;
  }

  grid.innerHTML = '';
  allSlides.forEach(slide => {
    const card = document.createElement('div');
    card.className = 'pp-slide-card';
    card.dataset.cue = slide.cueIndex;
    const hasLyrics = slide.text && slide.text.trim().length > 0;
    const thumbUrl = `/api/v1/presentation/${encodeURIComponent(presUuid)}/thumbnail/${slide.cueIndex}`;
    const contentHtml = hasLyrics
      ? `<div class="pp-slide-lyrics-display"><div class="pp-slide-lyrics-text">${escapeHtml(slide.text)}</div></div>`
      : `<img class="pp-slide-thumb-img" src="${thumbUrl}" alt="Slide ${slide.cueIndex + 1}" onerror="this.style.display='none'">`;
    card.innerHTML = `<div class="pp-slide-card-index">${slide.cueIndex + 1}</div><div class="pp-slide-preview-wrapper">${contentHtml}</div>`;
    card.addEventListener('click', () => triggerSlideCue(presUuid, slide.cueIndex, presName, slide.text, allSlides.length));
    grid.appendChild(card);
  });

  highlightActiveSlideCard(state.livePresentationUuid === presUuid ? state.liveSlideIndex : -1);

  if (shouldTriggerFirst) triggerSlideCue(presUuid, 0, presName, allSlides[0]?.text || '', allSlides.length);
}

function highlightActiveSlideCard(cueIndex) {
  document.querySelectorAll('#pp-slide-grid .pp-slide-card').forEach(card => {
    card.classList.toggle('live', Number(card.dataset.cue) === cueIndex);
  });
}

async function triggerSlideCue(presUuid, cueIndex, presName, slideText = '', totalSlides = 1) {
  lastUserActionTime = Date.now();
  state.currentSlideIndex = cueIndex;
  state.liveSlideIndex = cueIndex;
  state.livePresentationUuid = presUuid;
  state.currentPresentationUuid = presUuid;
  highlightActiveSlideCard(cueIndex);
  highlightActiveItem();

  // A letra SEMPRE é desenhada em HTML (nítida em qualquer tamanho) quando o slide tem
  // texto — igual o mobile já fazia. O thumbnail do slide é uma imagem pequena (ex.: 400x150)
  // que fica borrada esticada no monitor; então só usamos ele como FUNDO quando não há letra
  // (slide só de imagem) ou quando o fundo é uma mídia separada (vídeo/imagem em loop atrás
  // do texto — aí sim mostra os dois juntos, cada um na sua função).
  const hasLyrics = Boolean(slideText && slideText.trim().length > 0);
  const bgUrl = mediaState.liveUuid
    ? `/api/v1/media/${encodeURIComponent(mediaState.liveUuid)}/thumbnail?t=${Date.now()}`
    : (hasLyrics ? null : `/api/v1/presentation/${encodeURIComponent(presUuid)}/thumbnail/${cueIndex}?t=${Date.now()}`);
  setLivePreview({
    imgUrl: bgUrl,
    fallbackIcon: '📑',
    lyricsText: hasLyrics ? slideText : '',
    title: presName || '—',
    subtitle: `Slide ${cueIndex + 1} de ${totalSlides || state.currentPresentationSlides.length || 1}`,
    live: true,
  });

  await apiRequest(`/v1/presentation/${encodeURIComponent(presUuid)}/${cueIndex}/trigger`);
}

// ==========================================================================
// Playlists de Culto/Apresentação (coluna esquerda)
// ==========================================================================
async function loadPlaylists() {
  const raw = await apiRequest('/v1/playlists');
  const playlists = flattenPlaylistTree(raw);
  const tree = document.getElementById('pp-playlist-tree');
  if (!tree) return;
  tree.innerHTML = '';
  if (playlists.length === 0) {
    tree.innerHTML = '<div class="pp-tree-item" style="opacity:.6">Nenhuma playlist encontrada</div>';
    return;
  }
  playlists.forEach(pl => {
    const id = pl.id.uuid || pl.id.name;
    const el = document.createElement('div');
    el.className = 'pp-tree-item' + (id === state.activePlaylistId ? ' active' : '');
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h12M4 12h8M4 18h5"/></svg>${escapeHtml(pl.id.name)}`;
    el.addEventListener('click', () => selectPlaylist(id, pl.id.name));
    tree.appendChild(el);
  });
  if (!state.activePlaylistId && playlists[0]) selectPlaylist(playlists[0].id.uuid || playlists[0].id.name, playlists[0].id.name);
}

// Vários painéis (Playlist/Biblioteca/Mídia, Palco, Áudio, Mensagens, Props, Entradas de
// Vídeo, Macros, Looks) só carregam UMA VEZ na conexão. Se o ProPresenter ainda estivesse
// abrindo o show (ou a API não respondesse a tempo) naquele instante, o painel ficava vazio
// pra sempre — só reiniciando o app resolvia (achado de verdade: Macros vazio na produção,
// mesmo com o ProPresenter ligado e com macros configurados, porque o servidor sobe sozinho
// com o Windows e às vezes conecta antes do ProPresenter estar pronto). Este relógio detecta
// "ainda não carregou nada de verdade" e tenta de novo sozinho até dar certo, sem mexer em
// nada que já carregou. Cada `render*`/`load*` marca seu próprio placeholder de "nada aqui"
// com a classe `pp-vazio` (só ela — nunca reaproveitar `.pp-item-card` sozinha pra isso, pois
// varios paineis TAMBÉM usam essa classe pra card de conteúdo real, ex.: Props e Entradas de
// Vídeo, o que faria um painel com 1 item real de verdade ser confundido com vazio). Pra
// Playlist/Biblioteca/Mídia (árvores de pastas, não listas de item), "vazio" é a ausência de
// qualquer `.pp-tree-item` real (os reais nunca têm o atributo `style`, só o placeholder tem).
function painelAindaVazio(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  if (el.children.length === 0) return true;
  if (el.querySelector('.pp-vazio')) return true;
  if (el.classList.contains('pp-tree') && !el.querySelector('.pp-tree-item:not([style])')) return true;
  return false;
}

function recarregarPaineisVaziosSeNecessario() {
  const alvos = [
    ['pp-playlist-tree', loadPlaylists],
    ['pp-library-tree', loadLibraries],
    ['pp-media-tree', loadMediaPlaylists],
    ['pp-stage-screens-list', loadStageData],
    ['pp-audio-tabs', loadAudioPlaylists],
    ['pp-msg-select', loadMessages],
    ['pp-props-grid', loadProps],
    ['pp-video-list', loadVideoInputs],
    ['pp-macro-grid', loadMacros],
    ['pp-look-menu-list', loadLooks],
  ];
  for (const [id, fn] of alvos) {
    if (painelAindaVazio(id)) fn();
  }
}

function selectPlaylist(id, name) {
  state.mode = 'playlist';
  state.activePlaylistId = id;
  state.activePlaylistName = name;
  document.querySelectorAll('#pp-library-tree .pp-tree-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#pp-playlist-tree .pp-tree-item').forEach(el => {
    el.classList.toggle('active', el.textContent.trim() === name.trim());
  });
  loadPlaylistItems(id);
}

async function loadPlaylistItems(id) {
  const data = await apiRequest(`/v1/playlist/${encodeURIComponent(id)}`);
  const items = (data && Array.isArray(data.items)) ? data.items : [];
  state.playlistItems = items;
  renderItemsList(items, {
    vazio: 'Playlist vazia',
    podeReordenar: true,
    aoClicar: (item, idx) => selectPlaylistItem(item),
    aoReordenar: (idx, dir) => reordenarItem(id, idx, dir),
  });
}

// ==========================================================================
// Biblioteca (todas as apresentações de um acervo — sem playlist nem reordenar)
// ==========================================================================
async function loadLibraries() {
  const libs = await apiRequest('/v1/libraries');
  const tree = document.getElementById('pp-library-tree');
  if (!tree) return;
  const lista = Array.isArray(libs) ? libs : [];
  tree.innerHTML = '';
  if (lista.length === 0) { tree.innerHTML = '<div class="pp-tree-item" style="opacity:.6">Nenhuma biblioteca encontrada</div>'; return; }
  lista.forEach(lib => {
    const id = lib.uuid || lib.id?.uuid;
    const name = lib.name || lib.id?.name || 'Biblioteca';
    const el = document.createElement('div');
    el.className = 'pp-tree-item';
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/></svg>${escapeHtml(name)}`;
    el.addEventListener('click', () => selectLibrary(id, name));
    tree.appendChild(el);
  });
}

function selectLibrary(id, name) {
  state.mode = 'library';
  state.activeLibraryId = id;
  state.activeLibraryName = name;
  document.querySelectorAll('#pp-playlist-tree .pp-tree-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#pp-library-tree .pp-tree-item').forEach(el => {
    el.classList.toggle('active', el.textContent.trim() === name.trim());
  });
  loadLibraryItems(id);
}

async function loadLibraryItems(id) {
  const data = await apiRequest(`/v1/library/${encodeURIComponent(id)}`);
  const items = (data && Array.isArray(data.items)) ? data.items : [];
  state.playlistItems = items.map(it => ({ id: it, type: 'presentation', presentation_info: { presentation_uuid: it.uuid } }));
  renderItemsList(state.playlistItems, {
    vazio: 'Biblioteca vazia',
    podeReordenar: false,
    aoClicar: (item) => selectLibraryItem(item.id.uuid, item),
  });
}

// Clicar só CARREGA o grid de slides/letras (como no mobile e no painel oficial);
// disparar ao vivo é um clique à parte, no slide específico do grid.
function selectLibraryItem(presentationUuid, item) {
  const nome = item?.id?.name || item?.name || 'Apresentação';
  loadPresentationSlides(presentationUuid, nome, 0, false);
}

// Renderiza a lista de itens (playlist OU biblioteca) num único lugar, para as duas
// árvores alimentarem a mesma coluna sem duplicar HTML.
function renderItemsList(items, { vazio, podeReordenar, aoClicar, aoReordenar }) {
  const list = document.getElementById('pp-items-list');
  const counter = document.getElementById('pp-items-count');
  if (!list) return;
  if (counter) counter.textContent = `${items.length} ${I18N.t('itens', idiomaAtual)}`;
  if (items.length === 0) { list.innerHTML = `<div class="pp-item-card">${vazio}</div>`; return; }

  list.innerHTML = '';
  items.forEach((item, idx) => {
    const isPresentation = item.type === 'presentation';
    const row = document.createElement('div');
    row.className = 'pp-item-row';
    row.dataset.index = idx;
    const nome = item.id?.name || item.name || `Item ${idx + 1}`;
    const podeArrastar = podeReordenar && isPresentation;
    // As setas ▲▼ saíram: o arrastar-e-soltar (⠿) já cobre reordenar, é mais prático.
    row.innerHTML = `
      ${podeArrastar ? '<span class="pp-drag-handle" title="Arraste pra reordenar">⠿</span>' : ''}
      <span class="pp-item-idx">${idx + 1}</span>
      <span class="pp-item-name" title="${escapeHtml(nome)}">${escapeHtml(nome)}</span>
    `;
    row.addEventListener('click', (e) => {
      if (e.target.closest('.pp-drag-handle')) return;
      aoClicar(item, idx);
    });
    if (podeArrastar) {
      // Arrastar-e-soltar pra reordenar (mais prático que setas, a pedido do dono).
      row.draggable = true;
      row.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
        row.classList.add('dragging');
      });
      row.addEventListener('dragend', () => row.classList.remove('dragging'));
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        const origem = Number(e.dataTransfer.getData('text/plain'));
        if (!Number.isNaN(origem) && origem !== idx) aoReordenar(origem, idx);
      });
    }
    list.appendChild(row);
  });
  highlightActiveItem();
}

function highlightActiveItem() {
  document.querySelectorAll('#pp-items-list .pp-item-row').forEach(row => {
    const idx = Number(row.dataset.index);
    const item = state.playlistItems[idx];
    const uuid = item?.presentation_info?.presentation_uuid || item?.id?.uuid;
    const isLive = uuid && uuid === state.livePresentationUuid && state.currentPresentationUuid === uuid;
    row.classList.toggle('live', Boolean(isLive));
  });
}

// Clicar num item da playlist só CARREGA o grid de slides/letras (não vai ao ar sozinho) —
// igual ao mobile e ao painel oficial: browse é seguro, ir ao vivo é um clique à parte no slide.
function selectPlaylistItem(item) {
  const uuid = item?.presentation_info?.presentation_uuid || item?.target_uuid || item?.id?.uuid;
  const nome = item?.id?.name || item?.name || 'Apresentação';
  if (!uuid) return;
  loadPresentationSlides(uuid, nome, 0, false);
}

// direcaoOuIndice: 'up'/'down' (botões ▲▼) OU um número (posição solta ao arrastar).
async function reordenarItem(playlistId, itemIndex, direcaoOuIndice) {
  lastUserActionTime = Date.now();
  const payload = typeof direcaoOuIndice === 'number'
    ? { playlistId, itemIndex, toIndex: direcaoOuIndice }
    : { playlistId, itemIndex, direction: direcaoOuIndice };
  const res = await apiRequest('/reorder-playlist-item', 'POST', payload);
  if (res && res.success) {
    await loadPlaylistItems(playlistId);
  } else {
    alert((res && res.error) || 'Não foi possível reordenar este item.');
  }
}

document.getElementById('pp-btn-prev')?.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest('/v1/trigger/previous'); });
document.getElementById('pp-btn-next')?.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest('/v1/trigger/next'); });

// Setas do teclado avançam/voltam o slide ou a mídia (igual pedido: "seta pra frente/trás e
// pra cima/baixo funcione na letra e na mídia") — protegido contra digitação em campos de texto.
window.addEventListener('keydown', (e) => {
  const alvo = document.activeElement;
  if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)) return;
  if (!document.getElementById('pp-search-overlay')?.classList.contains('hidden')) return;
  if (!document.getElementById('pp-picker-overlay')?.classList.contains('hidden')) return;
  if (!document.getElementById('pp-config-overlay')?.classList.contains('hidden')) return;

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault();
    lastUserActionTime = Date.now();
    apiRequest('/v1/trigger/next');
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    lastUserActionTime = Date.now();
    apiRequest('/v1/trigger/previous');
  }
});
document.getElementById('pp-btn-show')?.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest('/v1/trigger/next'); });
// Faixa de limpar por camada (dentro do PGM) + o botão "Limpar" do topo (tudo de uma vez).
// Cada ícone só limpa a SUA camada na API; o estado local só é tocado nas camadas que
// realmente afetam o composto ao vivo (slide/mídia/áudio) — as outras (mensagem/props/
// anúncio) não têm representação visual própria no PGM ainda, só o clear na API mesmo.
async function limparCamada(layer) {
  lastUserActionTime = Date.now();
  if (layer === 'all') {
    for (const camada of ['slide', 'media', 'audio', 'messages', 'props', 'announcements', 'video_input']) {
      await apiRequest(`/v1/clear/layer/${camada}`);
    }
    state.liveSlideIndex = null;
    state.livePresentationUuid = null;
    mediaState.liveUuid = null;
    mediaState.liveSince = null;
    audioState.playing = false;
    audioState.currentTrackUuid = null;
    highlightActiveSlideCard(-1);
    highlightLiveMedia();
    atualizarDestaqueAudio();
    clearLivePreview();
    return;
  }
  await apiRequest(`/v1/clear/layer/${layer}`);
  if (layer === 'slide') {
    state.liveSlideIndex = null;
    state.livePresentationUuid = null;
    highlightActiveSlideCard(-1);
  } else if (layer === 'media') {
    mediaState.liveUuid = null;
    mediaState.liveSince = null;
    highlightLiveMedia();
  } else if (layer === 'audio') {
    audioState.playing = false;
    audioState.currentTrackUuid = null;
    atualizarDestaqueAudio();
  }
  refreshLiveComposite();
}
document.getElementById('pp-clear-strip')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.pp-clear-btn');
  if (btn) limparCamada(btn.dataset.layer);
});
document.getElementById('pp-btn-clear-all')?.addEventListener('click', () => limparCamada('all'));

// Grupos de Limpar (presets) que a própria igreja já configura DENTRO do ProPresenter (ex.:
// "Limpar tudo" com uma combinação específica de camadas) — achado no spec oficial da API
// (openapi.propresenter.com), não existia antes no app. Mostra só se houver algum configurado.
async function loadClearGroups() {
  const wrap = document.getElementById('pp-clear-groups-extra');
  if (!wrap) return;
  const grupos = await apiRequest('/v1/clear/groups');
  const lista = Array.isArray(grupos) ? grupos : [];
  if (lista.length === 0) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = '<div class="pp-clear-strip-sep"></div>' + lista.map(g => `
    <button class="pp-clear-btn color-props" data-group-id="${escapeHtml(g.id?.uuid || '')}" title="Grupo de Limpar: ${escapeHtml(g.id?.name || 'Sem nome')}">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/></svg>
    </button>`).join('');
}
document.getElementById('pp-clear-groups-extra')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-group-id]');
  if (!btn || !btn.dataset.groupId) return;
  lastUserActionTime = Date.now();
  await apiRequest(`/v1/clear/group/${encodeURIComponent(btn.dataset.groupId)}/trigger`);
});

// ==========================================================================
// Sincronismo ao vivo (mesma proteção contra o "pulo" da pele mobile):
// ignora respostas antigas por ~2,5s após um toque, e nunca roda 2 consultas juntas.
// ==========================================================================
let pollInFlight = false;
const POLL_QUIET_AFTER_CLICK_MS = 2500;

// Monta o preview ao vivo com as DUAS camadas que o ProPresenter pode ter simultâneas:
// o fundo (mídia em loop OU o próprio slide, se não houver mídia à parte) + a letra
// por cima quando o slide tiver texto — pedido do dono olhando o painel oficial.
function refreshLiveComposite() {
  const presUuid = state.livePresentationUuid;
  const idx = state.liveSlideIndex;
  const curSlide = (presUuid && state.currentPresentationUuid === presUuid) ? state.currentPresentationSlides[idx] : null;
  // A letra sempre é desenhada em HTML (nítida) quando o slide tem texto — igual o mobile.
  // O thumbnail do slide é pequeno (ex.: 400x150) e fica borrado esticado no monitor, então
  // só vira fundo quando não há letra, ou quando o fundo é uma mídia separada (aí mostra
  // os dois juntos: vídeo/imagem em loop atrás + letra nítida por cima).
  const hasLyrics = Boolean(curSlide && curSlide.text && curSlide.text.trim().length > 0);
  const somethingLive = Boolean(mediaState.liveUuid || presUuid);

  let imgUrl = null;
  let fallbackIcon = '📑';
  let title = I18N.t('nada_no_ar', idiomaAtual) || 'Nada no ar';
  let subtitle = '—';

  if (presUuid) {
    title = state.liveSlideName || title;
    subtitle = `Slide ${(idx ?? 0) + 1}` + (state.currentPresentationSlides.length ? ` de ${state.currentPresentationSlides.length}` : '');
  }
  if (mediaState.liveUuid) {
    imgUrl = `/api/v1/media/${encodeURIComponent(mediaState.liveUuid)}/thumbnail?t=${Date.now()}`;
    fallbackIcon = '🎬';
    if (!presUuid) { title = mediaState.liveName || title; subtitle = mediaState.activeName || '—'; }
  } else if (presUuid && !hasLyrics) {
    imgUrl = `/api/v1/presentation/${encodeURIComponent(presUuid)}/thumbnail/${idx}?t=${Date.now()}`;
  }

  setLivePreview({ imgUrl, fallbackIcon, lyricsText: hasLyrics ? curSlide.text : '', title, subtitle, live: somethingLive });
}

async function pollLiveStatus() {
  if (pollInFlight) return;
  if (Date.now() - lastUserActionTime < POLL_QUIET_AFTER_CLICK_MS) return;
  pollInFlight = true;
  const startedAt = Date.now();
  try {
    const isStale = () => lastUserActionTime > startedAt;
    let mudou = false;

    const slideIndexData = await apiRequest('/v1/presentation/slide_index');
    if (!isStale() && slideIndexData && slideIndexData.presentation_index) {
      const pIndex = slideIndexData.presentation_index;
      const presUuid = pIndex.presentation_id?.uuid;
      const presName = pIndex.presentation_id?.name;
      if (pIndex.index !== state.liveSlideIndex || presUuid !== state.livePresentationUuid) {
        state.liveSlideIndex = pIndex.index;
        state.livePresentationUuid = presUuid;
        state.liveSlideName = presName;
        mudou = true;
        highlightActiveItem();
        // Outra apresentação ficou ao vivo (disparada de outro aparelho ou do próprio
        // ProPresenter): recarrega o grid de slides/letras pra bater com o que está no ar.
        if (presUuid && presUuid !== state.currentPresentationUuid) {
          await loadPresentationSlides(presUuid, presName, pIndex.index, false);
        } else {
          highlightActiveSlideCard(pIndex.index);
        }
      }
    }

    const activeMedia = await apiRequest('/v1/media/playlist/active');
    if (!isStale()) {
      const mUuid = activeMedia?.item?.uuid || null;
      if (mUuid !== mediaState.liveUuid) {
        mediaState.liveUuid = mUuid;
        mediaState.liveName = activeMedia?.item?.name || '';
        mediaState.liveSince = mUuid ? Date.now() : null;
        mudou = true;
        highlightLiveMedia();
      }
    }

    if (!isStale() && mudou) refreshLiveComposite();
  } finally {
    pollInFlight = false;
  }
}

// ==========================================================================
// STAGE DISPLAY — lógica idêntica (e já corrigida) da pele mobile: endereçar
// SEMPRE por UUID (o ProPresenter troca as telas 1 e 2 na leitura por índice) e
// enfileirar as trocas de layout com 400ms + conferência (trocas coladas são ignoradas).
// ==========================================================================
let stageScreensCache = [];
let stageLayoutsCache = [];

function stageScreenIndex(s) { return (s.index !== undefined) ? s.index : (s.id?.index ?? 0); }
function stageScreenId(s) { return s.uuid || s.id?.uuid || stageScreenIndex(s); }
function stageScreenName(s) { return s.name || s.id?.name || ''; }
function stageSyncKey(s) { return `${stageScreenName(s).toLowerCase()}#${stageScreenIndex(s)}`; }
function readStageSyncMap() {
  try { return JSON.parse(localStorage.getItem('propresenter_stage_sync_map') || '{}') || {}; } catch (e) { return {}; }
}
function isStageScreenSynced(screen) {
  const map = readStageSyncMap();
  const name = stageScreenName(screen).toLowerCase();
  const key = stageSyncKey(screen);
  if (map[key] !== undefined) return Boolean(map[key]);
  if (map[name] !== undefined) return Boolean(map[name]);
  return !(name.includes('ipad') || name.includes('ndi'));
}

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
    const card = document.getElementById(`pp-stage-screen-${id}`);
    if (!card || !cur || typeof cur !== 'object') return;
    const curName = (cur.name || cur.id?.name || '').toLowerCase();
    const curUuid = cur.id?.uuid || cur.uuid;
    card.querySelectorAll('.pp-stage-layout-chip').forEach(c => {
      const match = (curUuid && c.dataset.layoutId === String(curUuid)) || (curName && (c.dataset.layoutName || '').toLowerCase() === curName);
      c.classList.toggle('active', Boolean(match));
    });
    const lbl = card.querySelector('.layout');
    if (lbl && (cur.name || cur.id?.name)) lbl.textContent = cur.name || cur.id.name;
  }));
}

function buildStageAllSectionHtml() {
  if (stageLayoutsCache.length === 0 || stageScreensCache.length === 0) return '';
  const synced = stageScreensCache.filter(isStageScreenSynced);
  return `
    <div class="pp-sync-row">
      <span data-i18n="mudar_retornos">${I18N.t('mudar_retornos', idiomaAtual)}</span>
      <select id="pp-stage-all-select" class="pp-btn pp-btn-sm" ${synced.length ? '' : 'disabled'}>
        ${stageLayoutsCache.map(l => `<option value="${escapeHtml(l.id?.uuid || l.uuid)}">${escapeHtml(l.id?.name || l.name)}</option>`).join('')}
      </select>
      <button class="pp-btn pp-btn-sm primary" id="pp-stage-all-apply" ${synced.length ? '' : 'disabled'} data-i18n="aplicar_layout">${I18N.t('aplicar_layout', idiomaAtual)}</button>
    </div>`;
}

async function loadStageData() {
  const list = document.getElementById('pp-stage-screens-list');
  const allSection = document.getElementById('pp-stage-all-section');
  if (!list) return;
  const [screens, layouts] = await Promise.all([apiRequest('/v1/stage/screens'), apiRequest('/v1/stage/layouts')]);
  stageScreensCache = Array.isArray(screens) ? screens : [];
  stageLayoutsCache = Array.isArray(layouts) ? layouts : [];

  if (allSection) allSection.innerHTML = buildStageAllSectionHtml();
  document.getElementById('pp-stage-all-apply')?.addEventListener('click', async () => {
    const layoutUuid = document.getElementById('pp-stage-all-select').value;
    const layoutName = document.getElementById('pp-stage-all-select').selectedOptions[0]?.textContent || '';
    const targets = stageScreensCache.filter(isStageScreenSynced);
    const falhou = [];
    for (const screen of targets) {
      const ok = await stageSetLayoutSafe(stageScreenId(screen), layoutUuid);
      if (!ok) falhou.push(stageScreenName(screen));
    }
    await refreshStageCurrentLayouts(targets.map(stageScreenId));
    alert(falhou.length ? `Falhou em: ${falhou.join(', ')}` : `✓ Retornos alterados para "${layoutName}"`);
  });

  if (stageScreensCache.length === 0) { list.innerHTML = '<div class="pp-item-card pp-vazio">Nenhuma tela de palco configurada.</div>'; return; }

  list.innerHTML = '';
  stageScreensCache.forEach(screen => {
    const id = stageScreenId(screen);
    const name = stageScreenName(screen) || 'Retorno';
    const synced = isStageScreenSynced(screen);
    const div = document.createElement('div');
    div.className = 'pp-stage-screen';
    div.id = `pp-stage-screen-${id}`;
    div.innerHTML = `
      <div class="pp-stage-screen-head">
        <span class="name">${escapeHtml(name)}</span>
        <span class="layout">…</span>
      </div>
      <div class="pp-toggle ${synced ? 'on' : ''}" title="${synced ? 'Muda em conjunto' : 'Independente'}"></div>
      <div class="pp-stage-layouts-row"></div>
    `;
    const toggle = div.querySelector('.pp-toggle');
    toggle.addEventListener('click', () => {
      const novo = !toggle.classList.contains('on');
      toggle.classList.toggle('on', novo);
      toggle.title = novo ? 'Muda em conjunto' : 'Independente';
      const map = readStageSyncMap();
      map[stageSyncKey(screen)] = novo;
      localStorage.setItem('propresenter_stage_sync_map', JSON.stringify(map));
      const allSec = document.getElementById('pp-stage-all-section');
      if (allSec) allSec.innerHTML = buildStageAllSectionHtml();
    });
    const layoutsRow = div.querySelector('.pp-stage-layouts-row');
    stageLayoutsCache.forEach(layout => {
      const chip = document.createElement('button');
      chip.className = 'pp-btn pp-btn-sm pp-stage-layout-chip';
      chip.style.marginRight = '4px';
      chip.style.marginTop = '4px';
      chip.dataset.layoutId = layout.id?.uuid || layout.uuid || '';
      chip.dataset.layoutName = (layout.id?.name || layout.name || '').toLowerCase();
      chip.textContent = layout.id?.name || layout.name || '';
      chip.addEventListener('click', async () => {
        const ok = await stageSetLayoutSafe(id, chip.dataset.layoutId);
        if (!ok) alert('O ProPresenter não aplicou o layout nesta tela.');
        await refreshStageCurrentLayouts([id]);
      });
      layoutsRow.appendChild(chip);
    });
    list.appendChild(div);
  });
  refreshStageCurrentLayouts();
}

document.getElementById('pp-stage-msg-show')?.addEventListener('click', async () => {
  const msg = document.getElementById('pp-stage-msg-input').value;
  await fetch('/api/v1/stage/message', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
});
document.getElementById('pp-stage-msg-clear')?.addEventListener('click', async () => {
  await fetch('/api/v1/stage/message', { method: 'DELETE' });
  document.getElementById('pp-stage-msg-input').value = '';
});

// ==========================================================================
// Divisórias arrastáveis (redimensionar colunas/áreas) — visual, sem API.
// Tamanho lembrado por aparelho em localStorage.
// ==========================================================================
(function setupResizers() {
  const CHAVE = 'propresenter_remote_desktop_layout';
  function lerTamanhos() { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; } }
  function gravarTamanho(campo, valor) {
    try { const t = lerTamanhos(); t[campo] = valor; localStorage.setItem(CHAVE, JSON.stringify(t)); } catch (e) { /* localStorage indisponível */ }
  }

  const colLeft = document.getElementById('pp-col-left');
  const colRight = document.getElementById('pp-col-right');
  const mediaBrowser = document.getElementById('pp-media-browser');
  const playlistTree = document.getElementById('pp-playlist-tree');
  const libraryTree = document.getElementById('pp-library-tree');
  const mediaGrid = document.getElementById('pp-media-grid');
  const previewBlock = document.getElementById('pp-preview-block');
  const salvos = lerTamanhos();
  if (colLeft && salvos.left) colLeft.style.width = salvos.left + 'px';
  if (colRight && salvos.right) colRight.style.width = salvos.right + 'px';
  if (mediaBrowser && salvos.mediaBrowserH) mediaBrowser.style.height = salvos.mediaBrowserH + 'px';
  if (playlistTree && salvos.playlistTreeH) playlistTree.style.height = salvos.playlistTreeH + 'px';
  if (libraryTree && salvos.libraryTreeH) libraryTree.style.height = salvos.libraryTreeH + 'px';
  if (mediaGrid && salvos.mediaGridH) mediaGrid.style.height = salvos.mediaGridH + 'px';
  if (previewBlock && salvos.previewBlockH) previewBlock.style.height = salvos.previewBlockH + 'px';

  function arrastavelVertical(resizer, painel, campo, invertido) {
    if (!resizer || !painel) return;
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const inicioX = e.clientX;
      const larguraInicial = painel.getBoundingClientRect().width;
      document.body.classList.add('pp-resizing-v');
      resizer.classList.add('dragging');
      function mover(ev) {
        const delta = ev.clientX - inicioX;
        painel.style.width = (larguraInicial + (invertido ? -delta : delta)) + 'px';
      }
      function soltar() {
        document.body.classList.remove('pp-resizing-v');
        resizer.classList.remove('dragging');
        gravarTamanho(campo, Math.round(painel.getBoundingClientRect().width));
        window.removeEventListener('mousemove', mover);
        window.removeEventListener('mouseup', soltar);
      }
      window.addEventListener('mousemove', mover);
      window.addEventListener('mouseup', soltar);
    });
  }

  function arrastavelHorizontal(resizer, painel, campo, invertido) {
    if (!resizer || !painel) return;
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const inicioY = e.clientY;
      const alturaInicial = painel.getBoundingClientRect().height;
      document.body.classList.add('pp-resizing-h');
      resizer.classList.add('dragging');
      function mover(ev) {
        const delta = ev.clientY - inicioY;
        painel.style.height = (alturaInicial + (invertido ? -delta : delta)) + 'px';
      }
      function soltar() {
        document.body.classList.remove('pp-resizing-h');
        resizer.classList.remove('dragging');
        gravarTamanho(campo, Math.round(painel.getBoundingClientRect().height));
        window.removeEventListener('mousemove', mover);
        window.removeEventListener('mouseup', soltar);
      }
      window.addEventListener('mousemove', mover);
      window.addEventListener('mouseup', soltar);
    });
  }

  arrastavelVertical(document.querySelector('.pp-resizer[data-resize="left"]'), colLeft, 'left', false);
  arrastavelVertical(document.querySelector('.pp-resizer[data-resize="right"]'), colRight, 'right', true);
  arrastavelHorizontal(document.querySelector('.pp-resizer[data-resize="left-vertical"]'), mediaBrowser, 'mediaBrowserH', true);
  arrastavelHorizontal(document.querySelector('.pp-resizer[data-resize="playlist-tree"]'), playlistTree, 'playlistTreeH', false);
  arrastavelHorizontal(document.querySelector('.pp-resizer[data-resize="library-tree"]'), libraryTree, 'libraryTreeH', false);
  arrastavelHorizontal(document.querySelector('.pp-resizer[data-resize="media-grid"]'), mediaGrid, 'mediaGridH', true);
  arrastavelHorizontal(document.querySelector('.pp-resizer[data-resize="preview-block"]'), previewBlock, 'previewBlockH', false);

  // O monitor (PGM) é sempre 16:9, como o painel oficial: qualquer divisória que mude o
  // espaço dele (largura da coluna OU altura do bloco) recalcula o tamanho exato em px pra
  // caber sem esticar a imagem nem cortar a faixa de limpar — o CSS aspect-ratio sozinho não
  // dá conta de respeitar os dois limites (largura E altura) ao mesmo tempo.
  const videoWrap = document.querySelector('.pp-preview-video-wrap');
  const videoBox = document.getElementById('pp-live-preview');
  function ajustarMonitor16x9() {
    if (!videoWrap || !videoBox) return;
    const cs = getComputedStyle(videoWrap);
    const vu = document.getElementById('pp-vu-meter');
    const clearStrip = document.getElementById('pp-clear-strip');
    const gap = parseFloat(cs.gap || 0);
    const vuFolga = vu ? vu.getBoundingClientRect().width + gap : 0;
    const clearFolga = clearStrip ? clearStrip.getBoundingClientRect().width + gap : 0;
    const availW = videoWrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - vuFolga - clearFolga;
    const availH = videoWrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (availW <= 0 || availH <= 0) return;
    let w, h;
    if (availW / availH > 16 / 9) { h = availH; w = h * 16 / 9; }
    else { w = availW; h = w * 9 / 16; }
    videoBox.style.width = w + 'px';
    videoBox.style.height = h + 'px';
    if (vu) vu.style.height = h + 'px'; // simétrico com o monitor, nunca mais alto que ele
    if (clearStrip) clearStrip.style.height = h + 'px'; // idem: a faixa de limpar fica do tamanho do monitor
  }
  if (videoWrap) new ResizeObserver(ajustarMonitor16x9).observe(videoWrap);
})();

// ==========================================================================
// Mídia / ProContent (árvore esquerda + grade central). A API só permite
// LEITURA e DISPARO de playlists de mídia — nunca reordenar (ver /v1/media/playlist).
// ==========================================================================
const mediaState = { activeId: null, activeName: '', items: [], liveUuid: null, liveName: '', liveSince: null };

async function loadMediaPlaylists() {
  const raw = await apiRequest('/v1/media/playlists');
  const playlists = flattenPlaylistTree(raw);
  const tree = document.getElementById('pp-media-tree');
  if (!tree) return;
  tree.innerHTML = '';
  if (playlists.length === 0) { tree.innerHTML = '<div class="pp-tree-item" style="opacity:.6">Nenhuma playlist de mídia</div>'; return; }
  playlists.forEach(pl => {
    const id = pl.id.uuid || pl.id.name;
    const el = document.createElement('div');
    el.className = 'pp-tree-item' + (id === mediaState.activeId ? ' active' : '');
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h12M4 12h8M4 18h5"/></svg>${escapeHtml(pl.id.name)}`;
    el.addEventListener('click', () => selectMediaPlaylist(id, pl.id.name));
    tree.appendChild(el);
  });
  if (!mediaState.activeId && playlists[0]) selectMediaPlaylist(playlists[0].id.uuid || playlists[0].id.name, playlists[0].id.name);
}

function selectMediaPlaylist(id, name) {
  mediaState.activeId = id;
  mediaState.activeName = name;
  document.querySelectorAll('#pp-media-tree .pp-tree-item').forEach(el => el.classList.toggle('active', el.textContent.trim() === name.trim()));
  loadMediaItems(id);
}

async function loadMediaItems(id) {
  const grid = document.getElementById('pp-media-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="pp-item-card">Carregando...</div>';
  const data = await apiRequest(`/v1/media/playlist/${encodeURIComponent(id)}`);
  const items = (data && Array.isArray(data.items)) ? data.items : [];
  mediaState.items = items;
  if (items.length === 0) { grid.innerHTML = '<div class="pp-item-card">Pasta de mídia vazia</div>'; return; }
  grid.innerHTML = '';
  items.forEach((item, idx) => {
    const uuid = item.id?.uuid;
    const nome = item.id?.name || item.name || `Mídia ${idx + 1}`;
    const isVideoOuImagem = item.type === 'video' || item.type === 'image';
    const card = document.createElement('div');
    card.className = 'pp-media-card';
    card.dataset.uuid = uuid || '';
    card.innerHTML = isVideoOuImagem && uuid
      ? `<div class="pp-media-thumb" style="padding:0"><img src="/api/v1/media/${uuid}/thumbnail" style="width:100%;height:100%;object-fit:cover;border-radius:6px" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" alt="${escapeHtml(nome)}"><div class="pp-media-fallback-icon" style="display:none">${item.type === 'video' ? '🎬' : '🖼️'}</div><span class="pp-media-elapsed"></span></div><div class="pp-media-caption"><span>${idx + 1}</span><span>${escapeHtml(nome)}</span></div>`
      : `<div class="pp-media-thumb">${escapeHtml(nome)}<span class="pp-media-elapsed"></span></div><div class="pp-media-caption"><span>${idx + 1}</span><span>${escapeHtml(nome)}</span></div>`;
    card.addEventListener('click', () => triggerMediaItem(id, item, idx));
    grid.appendChild(card);
  });
  highlightLiveMedia();
}

async function triggerMediaItem(playlistId, item, idx) {
  lastUserActionTime = Date.now();
  const mediaId = item.id?.uuid ?? idx;
  await apiRequest(`/v1/media/playlist/${encodeURIComponent(playlistId)}/${encodeURIComponent(mediaId)}/trigger`);
  mediaState.liveUuid = item.id?.uuid || null;
  mediaState.liveName = item.id?.name || item.name || '';
  mediaState.liveSince = Date.now();
  highlightLiveMedia();
  refreshLiveComposite();
}

function highlightLiveMedia() {
  document.querySelectorAll('#pp-media-grid .pp-media-card').forEach(card => {
    card.classList.toggle('live', Boolean(mediaState.liveUuid) && card.dataset.uuid === mediaState.liveUuid);
  });
  atualizarContadorMedia();
}

// Contador de tempo decorrido na mídia ao vivo (aproximado: a API não devolve a posição
// de reprodução, então conta a partir do momento em que detectamos o disparo).
function atualizarContadorMedia() {
  document.querySelectorAll('#pp-media-grid .pp-media-card .pp-media-elapsed').forEach(el => { el.textContent = ''; });
  if (!mediaState.liveUuid || !mediaState.liveSince) return;
  const card = document.querySelector(`#pp-media-grid .pp-media-card[data-uuid="${CSS.escape(mediaState.liveUuid)}"] .pp-media-elapsed`);
  if (!card) return;
  const segundos = Math.max(0, Math.floor((Date.now() - mediaState.liveSince) / 1000));
  const m = Math.floor(segundos / 60), s = segundos % 60;
  card.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// VU meter aproximado, ao lado do monitor: pulsa quando o MP3 ou a mídia/vídeo ao vivo têm
// áudio tocando. A API do ProPresenter não devolve o volume real (nenhum decibel), só se
// está tocando ou não — então isto é uma animação "está tocando", igual em espírito às 3
// barrinhas que já existem no mobile, não uma leitura fiel do áudio.
function atualizarVuMeter() {
  const fill = document.getElementById('pp-vu-fill');
  if (!fill) return;
  // Só "balança" quando existe áudio de verdade tocando: o MP3, OU a camada de
  // presentation/mídia com duração > 0 (vídeo) E tocando — uma imagem estática (PNG/JPEG)
  // não tem duração nenhuma, então fica parado, em vez de animar à toa.
  const pres = transportState.presentation;
  const tocando = audioState.playing || (pres.isPlaying && pres.duration > DURACAO_MINIMA_REAL);
  const pct = tocando ? (22 + Math.random() * 45) : 92;
  fill.style.height = pct + '%';
}
// quando dá — igual ao painel oficial. Mesma API da pele mobile: /api/search-songs,
// /api/list-culto-playlists, /api/add-song-to-playlist.
// ==========================================================================
let searchDebounce = null;
let searchSelecionado = null; // { uuid, name, libraryName, libraryUuid }
const searchModalInput = document.getElementById('pp-search-modal-input');

document.getElementById('pp-btn-search-open')?.addEventListener('click', () => {
  document.getElementById('pp-search-overlay').classList.remove('hidden');
  searchModalInput.value = '';
  searchModalInput.focus();
  document.getElementById('pp-search-modal-list').innerHTML = '<div class="pp-search-empty">Digite pra buscar…</div>';
  document.getElementById('pp-search-modal-preview').innerHTML = '<div class="pp-search-empty">Selecione um resultado pra ver a letra</div>';
  searchSelecionado = null;
  atualizarBotoesBusca();
});
document.getElementById('pp-search-modal-close')?.addEventListener('click', fecharModalBusca);
function fecharModalBusca() { document.getElementById('pp-search-overlay').classList.add('hidden'); }

searchModalInput?.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  const q = searchModalInput.value.trim();
  searchSelecionado = null;
  atualizarBotoesBusca();
  document.getElementById('pp-search-modal-preview').innerHTML = '<div class="pp-search-empty">Selecione um resultado pra ver a letra</div>';
  if (!q) { document.getElementById('pp-search-modal-list').innerHTML = '<div class="pp-search-empty">Digite pra buscar…</div>'; return; }
  searchDebounce = setTimeout(() => executarBusca(q), 250);
});

async function executarBusca(q) {
  const list = document.getElementById('pp-search-modal-list');
  const res = await fetch(`/api/search-songs?q=${encodeURIComponent(q)}`);
  const data = await res.json().catch(() => null);
  const results = (data && data.results) || [];
  if (results.length === 0) { list.innerHTML = '<div class="pp-search-empty">Nenhuma música encontrada</div>'; return; }
  list.innerHTML = '';
  results.forEach(item => {
    const row = document.createElement('div');
    row.className = 'pp-search-modal-result';
    row.innerHTML = `<span>${escapeHtml(item.name)}</span><span class="lib">${escapeHtml(item.libraryName || '')}</span>`;
    row.addEventListener('click', () => selecionarResultadoBusca(item, row));
    list.appendChild(row);
  });
}

function atualizarBotoesBusca() {
  document.getElementById('pp-search-modal-add').disabled = !searchSelecionado;
  document.getElementById('pp-search-modal-open').disabled = !searchSelecionado;
}

async function selecionarResultadoBusca(item, row) {
  searchSelecionado = item;
  document.querySelectorAll('.pp-search-modal-result.selected').forEach(el => el.classList.remove('selected'));
  row.classList.add('selected');
  atualizarBotoesBusca();

  const preview = document.getElementById('pp-search-modal-preview');
  preview.innerHTML = '<div class="pp-search-empty">Carregando letra…</div>';
  // Preview é um extra: se a apresentação não carregar (ex.: item de mídia), some sozinho
  // e a busca+adicionar continuam funcionando normalmente (igual já era no mobile).
  const presRaw = await apiRequest(`/v1/presentation/${encodeURIComponent(item.uuid)}`);
  const presData = presRaw && (presRaw.presentation ? presRaw : (presRaw.groups ? { presentation: presRaw } : null));
  const linhas = [];
  (presData?.presentation?.groups || []).forEach(g => (g.slides || []).forEach(s => { if (s.text && s.text.trim()) linhas.push(s.text.trim()); }));
  if (linhas.length === 0) {
    preview.innerHTML = `<h4>${escapeHtml(item.name)}</h4><div class="pp-search-empty">Sem letra pra mostrar (mídia ou slide sem texto)</div>`;
  } else {
    preview.innerHTML = `<h4>${escapeHtml(item.name)}</h4>` + linhas.map(l => `<div class="pp-slide-line">${escapeHtml(l)}</div>`).join('');
  }
}

document.getElementById('pp-search-modal-add')?.addEventListener('click', () => { if (searchSelecionado) abrirEscolhaPlaylist(searchSelecionado); });
document.getElementById('pp-search-modal-open')?.addEventListener('click', () => {
  if (!searchSelecionado) return;
  loadPresentationSlides(searchSelecionado.uuid, searchSelecionado.name, 0, false);
  fecharModalBusca();
});

async function abrirEscolhaPlaylist(songItem) {
  const overlay = document.getElementById('pp-picker-overlay');
  const body = document.getElementById('pp-picker-body');
  overlay.classList.remove('hidden');
  body.innerHTML = 'Buscando playlists...';
  try {
    // 1 nova tentativa: a chamada pode coincidir com o sincronismo ao vivo (a cada 1s) e falhar por concorrência
    let data = null;
    for (let tentativa = 0; tentativa < 2 && !data?.playlists?.length; tentativa++) {
      if (tentativa > 0) await new Promise(r => setTimeout(r, 500));
      const res = await fetch('/api/list-culto-playlists');
      data = await res.json().catch(() => null);
    }
    const playlists = (data && data.playlists) || [];
    if (playlists.length === 0) { body.innerHTML = 'Nenhuma playlist de culto encontrada.'; return; }
    body.innerHTML = '';
    playlists.forEach(pl => {
      const row = document.createElement('div');
      row.className = 'pp-picker-item';
      row.innerHTML = `${pl.group ? `<span class="grupo">${escapeHtml(pl.group)} › </span>` : ''}${escapeHtml(pl.name)}`;
      row.addEventListener('click', () => confirmarAddPlaylist(songItem, pl));
      body.appendChild(row);
    });
  } catch (e) {
    body.innerHTML = 'Erro ao buscar playlists: ' + e.message;
  }
}

async function confirmarAddPlaylist(songItem, playlist) {
  document.getElementById('pp-picker-overlay').classList.add('hidden');
  const res = await fetch('/api/add-song-to-playlist', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songUuid: songItem.uuid, songName: songItem.name, playlistId: playlist.uuid || playlist.name, playlistName: playlist.name })
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.success) {
    alert(`✓ "${songItem.name}" adicionada à ${data.playlistName}!` + ((data.avisos && data.avisos.length) ? ' ⚠ ' + data.avisos.join(' ') : ''));
    if (state.activePlaylistId === data.playlistId) await loadPlaylistItems(data.playlistId);
  } else {
    alert('Erro ao adicionar: ' + (data.error || 'Falha na API'));
  }
  fecharModalBusca();
}

document.getElementById('pp-picker-close')?.addEventListener('click', () => document.getElementById('pp-picker-overlay').classList.add('hidden'));

// ==========================================================================
// ÁUDIO
// ==========================================================================
const audioState = { activeId: null, activeName: '', tracks: [], playing: false, currentTrackUuid: null, duration: 0, currentTime: 0 };

// Transporte de "presentation" (cobre slide/vídeo E mídia/ProContent — é a mesma camada
// no ProPresenter) e de "announcement" (camada de anúncios em loop). A API dá tocar/pausar
// E a posição atual (/time) — confirmado incrementando ao vivo contra o ProPresenter real —
// então dá pra montar a barra de progresso de verdade. O que ela NÃO dá é como escrever uma
// posição nova com segurança (não testamos escrita numa mídia ao vivo), então a barra é só
// visual/leitura, sem arrastar pra avançar/voltar.
const transportState = {
  presentation: { isPlaying: false, uuid: '', name: '', duration: 0, currentTime: 0 },
  announcement: { isPlaying: false, uuid: '', name: '', duration: 0, currentTime: 0 },
};

// Testado ao vivo: uma imagem estática (PNG/JPEG) também aparece em /transport/presentation
// com uma "duração" residual (ex.: 0.33s) que não é tempo de reprodução real — só vídeo/áudio
// de verdade passa de 1,5s. Usado tanto pra mostrar o mini-player quanto pro VU meter.
const DURACAO_MINIMA_REAL = 1.5;

function formatarTempo(segundos) {
  const s = Math.max(0, Math.floor(segundos || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

async function checarTransporte(layer) {
  const cur = await apiRequest(`/v1/transport/${layer}/current`);
  const st = transportState[layer];
  if (cur && cur.uuid) {
    st.isPlaying = cur.is_playing !== false;
    st.uuid = cur.uuid;
    st.name = cur.name || '';
    st.duration = Number(cur.duration) || 0;
    const tempo = await apiRequest(`/v1/transport/${layer}/time`);
    st.currentTime = Number(tempo) || 0;
  } else {
    st.isPlaying = false;
    st.uuid = '';
    st.name = '';
    st.duration = 0;
    st.currentTime = 0;
  }
  atualizarPainelTransporte(layer);
}

// Só mostra o mini-player quando existe DE VERDADE um conteúdo com tempo (vídeo/áudio) na
// camada — um slide de texto ou uma imagem estática não tem duração, então fica escondido.
function atualizarPainelTransporte(layer) {
  const row = document.getElementById(`pp-transport-${layer}`);
  const btn = document.getElementById(layer === 'presentation' ? 'pp-btn-pres-playpause' : 'pp-btn-announ-playpause');
  const nameEl = document.getElementById(`pp-transport-${layer}-name`);
  const fill = document.getElementById(`pp-transport-${layer}-bar-fill`);
  const timeEl = document.getElementById(`pp-transport-${layer}-time`);
  if (!row) return;
  const st = transportState[layer];
  const temConteudo = Boolean(st.uuid) && st.duration > DURACAO_MINIMA_REAL;
  row.classList.toggle('hidden', !temConteudo);
  if (!temConteudo) return;
  if (nameEl) nameEl.textContent = st.name || '—';
  if (btn) btn.textContent = st.isPlaying ? '⏸' : '▶';
  if (fill) fill.style.width = Math.min(100, (st.currentTime / st.duration) * 100) + '%';
  if (timeEl) timeEl.textContent = `${formatarTempo(st.currentTime)} / ${formatarTempo(st.duration)}`;
}

function ligarBotaoTransporte(layer, btnId) {
  document.getElementById(btnId)?.addEventListener('click', async () => {
    lastUserActionTime = Date.now();
    const st = transportState[layer];
    await apiRequest(`/v1/transport/${layer}/${st.isPlaying ? 'pause' : 'play'}`);
    st.isPlaying = !st.isPlaying;
    atualizarPainelTransporte(layer);
  });
}
ligarBotaoTransporte('presentation', 'pp-btn-pres-playpause');
ligarBotaoTransporte('announcement', 'pp-btn-announ-playpause');

// Avançar/voltar segundos no vídeo/mídia — usa os endpoints nativos skip_forward/
// skip_backward (achados no spec oficial da API, openapi.propresenter.com) em vez de ler o
// tempo atual e escrever um novo valor na mão: evita corrida entre leitura e escrita, e é o
// mesmo mecanismo que o "-10"/"+10" oficial do ProPresenter usa por dentro. Não existe
// endpoint de marcador na API (isso é só do editor).
async function pularTempoTransporte(layer, delta) {
  lastUserActionTime = Date.now();
  const st = transportState[layer];
  if (!st.uuid) return;
  const acao = delta >= 0 ? 'skip_forward' : 'skip_backward';
  await apiRequest(`/v1/transport/${layer}/${acao}/${Math.abs(delta)}`);
  st.currentTime = Math.min(st.duration, Math.max(0, st.currentTime + delta));
  atualizarPainelTransporte(layer);
}
document.getElementById('pp-btn-pres-back10')?.addEventListener('click', () => pularTempoTransporte('presentation', -10));
document.getElementById('pp-btn-pres-fwd10')?.addEventListener('click', () => pularTempoTransporte('presentation', 10));
document.getElementById('pp-btn-announ-back10')?.addEventListener('click', () => pularTempoTransporte('announcement', -10));
document.getElementById('pp-btn-announ-fwd10')?.addEventListener('click', () => pularTempoTransporte('announcement', 10));

async function loadAudioPlaylists() {
  const raw = await apiRequest('/v1/audio/playlists');
  const playlists = flattenPlaylistTree(raw);
  const tabsEl = document.getElementById('pp-audio-tabs');
  if (!tabsEl) return;
  tabsEl.innerHTML = '';
  playlists.forEach(pl => {
    const id = pl.id.uuid || pl.id.name;
    const btn = document.createElement('button');
    btn.className = 'pp-btn pp-btn-sm' + (id === audioState.activeId ? ' primary' : '');
    btn.textContent = pl.id.name;
    btn.addEventListener('click', () => selectAudioPlaylist(id, pl.id.name));
    tabsEl.appendChild(btn);
  });
  if (!audioState.activeId && playlists[0]) selectAudioPlaylist(playlists[0].id.uuid || playlists[0].id.name, playlists[0].id.name);
}

function selectAudioPlaylist(id, name) {
  audioState.activeId = id;
  audioState.activeName = name;
  loadAudioPlaylists();
  loadAudioTracks(id);
}

function formatarDuracao(seg) {
  if (!seg || isNaN(seg) || seg <= 0) return '--:--';
  const m = Math.floor(seg / 60), s = Math.floor(seg % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function loadAudioTracks(id) {
  const list = document.getElementById('pp-audio-list');
  if (!list) return;
  const data = await apiRequest(`/v1/audio/playlist/${encodeURIComponent(id)}`);
  const tracks = (data && Array.isArray(data.items)) ? data.items : [];
  audioState.tracks = tracks;
  if (tracks.length === 0) { list.innerHTML = '<div class="pp-item-card">Nenhuma faixa nesta playlist</div>'; return; }
  list.innerHTML = '';
  tracks.forEach((tr, idx) => {
    const uuid = tr.id?.uuid || tr.id?.index || idx;
    const row = document.createElement('div');
    row.className = 'pp-item-row';
    row.dataset.uuid = uuid;
    row.innerHTML = `<span class="pp-item-idx">${idx + 1}</span><span class="pp-item-name">${escapeHtml(tr.id?.name || 'Faixa')}</span><span class="pp-item-tag">${formatarDuracao(tr.duration)}</span>`;
    row.addEventListener('click', () => triggerAudioTrack(id, uuid, tr.id?.name));
    list.appendChild(row);
  });
  atualizarDestaqueAudio();
}

async function triggerAudioTrack(playlistId, trackUuid, nome) {
  lastUserActionTime = Date.now();
  await apiRequest(`/v1/audio/playlist/${encodeURIComponent(playlistId)}/${encodeURIComponent(trackUuid)}/trigger`);
  audioState.playing = true;
  audioState.currentTrackUuid = trackUuid;
  atualizarDestaqueAudio();
  checarAudioAtual();
}

function atualizarDestaqueAudio() {
  document.querySelectorAll('#pp-audio-list .pp-item-row').forEach(row => {
    row.classList.toggle('live', audioState.playing && row.dataset.uuid === String(audioState.currentTrackUuid));
  });
}

// Transporte real do áudio (Tocar/Pausar/Anterior/Próxima) — a posição real vem de
// /v1/transport/audio/time (confirmado ao vivo contra o ProPresenter real, junto com a
// mídia/vídeo), por isso dá pra montar a barra de progresso de verdade.
function atualizarPainelAudio() {
  const card = document.getElementById('pp-audio-current');
  const nomeEl = document.getElementById('pp-audio-transport-name');
  const subEl = document.getElementById('pp-audio-transport-sub');
  const btnPlay = document.getElementById('pp-audio-btn-playpause');
  const fill = document.getElementById('pp-audio-bar-fill');
  const timeEl = document.getElementById('pp-audio-time');
  if (!card) return;
  if (!audioState.currentTrackUuid && !audioState.currentTrackName) { card.classList.add('hidden'); return; }
  card.classList.remove('hidden');
  nomeEl.textContent = audioState.currentTrackName || '—';
  subEl.textContent = (audioState.activeName || 'Áudio') + (audioState.playing ? '' : ' • Pausado');
  btnPlay.textContent = audioState.playing ? '⏸' : '▶';
  if (fill) fill.style.width = (audioState.duration > 0 ? Math.min(100, (audioState.currentTime / audioState.duration) * 100) : 0) + '%';
  if (timeEl) timeEl.textContent = `${formatarTempo(audioState.currentTime)} / ${formatarTempo(audioState.duration)}`;
}

async function checarAudioAtual() {
  const cur = await apiRequest('/v1/transport/audio/current');
  if (cur && (cur.name || cur.id?.name)) {
    audioState.currentTrackName = cur.name || cur.id?.name;
    audioState.playing = cur.is_playing !== false;
    audioState.duration = Number(cur.duration) || 0;
    if (cur.uuid || cur.id?.uuid) audioState.currentTrackUuid = cur.uuid || cur.id.uuid;
    const tempo = await apiRequest('/v1/transport/audio/time');
    audioState.currentTime = Number(tempo) || 0;
  } else {
    audioState.currentTrackName = '';
    audioState.playing = false;
    audioState.duration = 0;
    audioState.currentTime = 0;
  }
  atualizarDestaqueAudio();
  atualizarPainelAudio();
}

document.getElementById('pp-audio-btn-playpause')?.addEventListener('click', async () => {
  lastUserActionTime = Date.now();
  await apiRequest(`/v1/transport/audio/${audioState.playing ? 'pause' : 'play'}`);
  audioState.playing = !audioState.playing;
  atualizarPainelAudio();
  atualizarDestaqueAudio();
});
document.getElementById('pp-audio-btn-prev')?.addEventListener('click', async () => {
  lastUserActionTime = Date.now();
  await apiRequest('/v1/trigger/audio/previous');
  checarAudioAtual();
});
document.getElementById('pp-audio-btn-next')?.addEventListener('click', async () => {
  lastUserActionTime = Date.now();
  await apiRequest('/v1/trigger/audio/next');
  checarAudioAtual();
});

// ==========================================================================
// TEMPORIZADORES
// ==========================================================================
async function loadTimers() {
  const list = document.getElementById('pp-timers-list');
  if (!list) return;
  const timers = await apiRequest('/v1/timers/current');
  if (!Array.isArray(timers) || timers.length === 0) { list.innerHTML = '<div class="pp-item-card">Nenhum cronômetro configurado</div>'; return; }
  const mesma = list.children.length === timers.length && [...list.children].every((el, i) => el.dataset.id === String(timers[i].id?.index ?? timers[i].id?.uuid ?? i));
  if (mesma) {
    timers.forEach((t, i) => {
      const el = list.children[i];
      const st = (t.state || 'stopped').toLowerCase();
      const rodando = st === 'running', estourou = st === 'overrunning' || st === 'overran';
      el.querySelector('.pp-timer-time').textContent = t.time || '00:00';
      el.querySelector('.pp-timer-state').textContent = rodando ? '● Rodando' : (estourou ? '● Estourado' : '○ Parado');
    });
    return;
  }
  list.innerHTML = '';
  timers.forEach((t, i) => {
    const id = t.id?.index ?? t.id?.uuid ?? i;
    const st = (t.state || 'stopped').toLowerCase();
    const rodando = st === 'running', estourou = st === 'overrunning' || st === 'overran';
    const card = document.createElement('div');
    card.className = 'pp-item-card';
    card.dataset.id = id;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <strong>${escapeHtml(t.id?.name || 'Cronômetro')}</strong>
        <span class="pp-timer-state">${rodando ? '● Rodando' : (estourou ? '● Estourado' : '○ Parado')}</span>
      </div>
      <div class="pp-timer-time" style="font-size:22px;font-variant-numeric:tabular-nums;margin-bottom:6px">${t.time || '00:00'}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button class="pp-btn pp-btn-sm" data-op="start">▶ Iniciar</button>
        <button class="pp-btn pp-btn-sm" data-op="stop">⏸ Pausar</button>
        <button class="pp-btn pp-btn-sm" data-op="reset">↺ Reiniciar</button>
        <button class="pp-btn pp-btn-sm" data-inc="60">+1 min</button>
        <button class="pp-btn pp-btn-sm" data-inc="300">+5 min</button>
      </div>`;
    card.querySelectorAll('[data-op]').forEach(btn => btn.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest(`/v1/timer/${encodeURIComponent(id)}/${btn.dataset.op}`); loadTimers(); }));
    card.querySelectorAll('[data-inc]').forEach(btn => btn.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest(`/v1/timer/${encodeURIComponent(id)}/increment/${btn.dataset.inc}`); loadTimers(); }));
    list.appendChild(card);
  });
}

// ==========================================================================
// MENSAGENS
// ==========================================================================
let messagesCache = [];
async function loadMessages() {
  const sel = document.getElementById('pp-msg-select');
  if (!sel) return;
  const data = await apiRequest('/v1/messages');
  messagesCache = Array.isArray(data) ? data : (Array.isArray(data?.value) ? data.value : []);
  sel.innerHTML = messagesCache.map(m => `<option value="${escapeHtml(m.id?.uuid || m.id?.index)}">${escapeHtml(m.id?.name || 'Mensagem')}${m.is_active ? ' ● NO TELÃO' : ''}</option>`).join('');
  if (messagesCache.length) renderMessageBody(messagesCache[0]);
  else document.getElementById('pp-msg-body').innerHTML = '<div class="pp-item-card">Nenhum modelo de mensagem configurado</div>';
}
document.getElementById('pp-msg-select')?.addEventListener('change', (e) => {
  const m = messagesCache.find(x => String(x.id?.uuid || x.id?.index) === e.target.value);
  if (m) renderMessageBody(m);
});

function renderMessageBody(msg) {
  const body = document.getElementById('pp-msg-body');
  const tokens = msg.tokens || [];
  body.innerHTML = `
    <div class="pp-item-card">
      ${tokens.filter(t => t.text).map(t => `<div class="pp-field-row"><label>${escapeHtml(t.name)} — Value:</label><input data-token="${escapeHtml(t.name)}" value="${escapeHtml(t.text?.text || '')}"></div>`).join('') || '<div style="font-size:12px;color:var(--text-dim)">Mensagem de texto fixo (sem variáveis)</div>'}
      <div style="text-align:right;margin-top:6px;display:flex;gap:6px;justify-content:flex-end">
        <button class="pp-btn pp-btn-sm" id="pp-msg-clear">Limpar</button>
        <button class="pp-btn primary pp-btn-sm" id="pp-msg-show">Mostrar</button>
      </div>
    </div>`;
  document.getElementById('pp-msg-show').addEventListener('click', () => triggerMessage(msg));
  document.getElementById('pp-msg-clear').addEventListener('click', () => clearMessage(msg));
}

async function triggerMessage(msg) {
  lastUserActionTime = Date.now();
  const msgId = msg.id?.uuid || msg.id?.index;
  const inputs = document.querySelectorAll('#pp-msg-body [data-token]');
  const valores = {}; inputs.forEach(inp => { valores[inp.dataset.token] = inp.value; });
  const tokensLimpos = (msg.tokens || []).map(t => t.timer || t.clock ? t : { name: t.name, text: { text: valores[t.name] ?? (t.text?.text || '') } });
  await apiRequest(`/v1/message/${encodeURIComponent(msgId)}`, 'PUT', Object.assign({}, msg, { tokens: tokensLimpos, visible_on_network: true }));
  await apiRequest(`/v1/message/${encodeURIComponent(msgId)}/trigger`, 'POST', tokensLimpos);
}

async function clearMessage(msg) {
  lastUserActionTime = Date.now();
  const msgId = msg.id?.uuid || msg.id?.index;
  await apiRequest(`/v1/message/${encodeURIComponent(msgId)}/clear`);
  await apiRequest('/v1/clear/layer/messages');
}

// ==========================================================================
// PROPS
// ==========================================================================
async function loadProps() {
  const grid = document.getElementById('pp-props-grid');
  if (!grid) return;
  const props = await apiRequest('/v1/props');
  const lista = Array.isArray(props) ? props : [];
  if (lista.length === 0) { grid.innerHTML = '<div class="pp-item-card pp-vazio">Nenhum Prop configurado</div>'; return; }
  grid.innerHTML = '';
  lista.forEach((p, idx) => {
    const id = p.id?.uuid ?? p.id?.index ?? idx;
    const nome = p.id?.name || `Prop ${idx + 1}`;
    const card = document.createElement('div');
    card.className = 'pp-item-card';
    card.style.gridColumn = 'span 2';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <span>${escapeHtml(nome)}${p.is_active ? ' <span style="color:#22c55e;font-size:11px">● ATIVO</span>' : ''}</span>
      <span style="display:flex;gap:4px"><button class="pp-btn pp-btn-sm" data-a="trigger">Ativar</button><button class="pp-btn pp-btn-sm" data-a="clear">Desativar</button></span>
    </div>`;
    card.querySelector('[data-a="trigger"]').addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest(`/v1/prop/${encodeURIComponent(id)}/trigger`); loadProps(); });
    card.querySelector('[data-a="clear"]').addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest(`/v1/prop/${encodeURIComponent(id)}/clear`); loadProps(); });
    grid.appendChild(card);
  });
}

// ==========================================================================
// ENTRADAS DE VÍDEO
// ==========================================================================
async function loadVideoInputs() {
  const list = document.getElementById('pp-video-list');
  if (!list) return;
  const inputs = await apiRequest('/v1/video_inputs');
  const lista = Array.isArray(inputs) ? inputs : [];
  if (lista.length === 0) { list.innerHTML = '<div class="pp-item-card pp-vazio">Nenhuma entrada de vídeo configurada</div>'; return; }
  list.innerHTML = '';
  lista.forEach((item, idx) => {
    const id = item.uuid ?? item.id?.uuid ?? item.index ?? idx;
    const nome = item.name || item.id?.name || `Entrada ${idx + 1}`;
    const card = document.createElement('div');
    card.className = 'pp-item-card';
    card.style.display = 'flex'; card.style.justifyContent = 'space-between'; card.style.alignItems = 'center';
    card.innerHTML = `<span>${escapeHtml(nome)}</span><button class="pp-btn pp-btn-sm">Disparar</button>`;
    card.querySelector('button').addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest(`/v1/video_inputs/${encodeURIComponent(id)}/trigger`); });
    list.appendChild(card);
  });
  const limparBtn = document.createElement('button');
  limparBtn.className = 'pp-btn pp-btn-sm'; limparBtn.style.marginTop = '8px'; limparBtn.textContent = 'Limpar Entrada de Vídeo';
  limparBtn.addEventListener('click', async () => { await apiRequest('/v1/clear/layer/video_input'); });
  list.appendChild(limparBtn);
}

// ==========================================================================
// CAPTURA
// ==========================================================================
async function loadCaptureStatus() {
  const el = document.getElementById('pp-captura-status');
  if (!el) return;
  const data = await apiRequest('/v1/capture/status');
  const st = (data?.status || 'inactive').toLowerCase();
  const rotulo = st === 'error' ? '● Erro na captura' : st === 'caution' ? '● Gravando (atenção)' : st === 'active' ? '● Gravando/Transmitindo' : '○ Captura Inativa';
  el.textContent = `${rotulo}  ${data?.capture_time || ''}`;
}
document.getElementById('pp-btn-iniciar-gravacao')?.addEventListener('click', async () => { await apiRequest('/v1/capture/start'); loadCaptureStatus(); });
document.getElementById('pp-btn-parar-gravacao')?.addEventListener('click', async () => { await apiRequest('/v1/capture/stop'); loadCaptureStatus(); });

// ==========================================================================
// MACROS
// ==========================================================================
// Ícone por tipo de ação (o que o macro realmente faz por dentro) — mesma linguagem visual
// dos outros ícones do app. Tipo desconhecido vira uma bolinha genérica (nunca inventa um
// ícone específico pra algo que não sabemos identificar).
const MACRO_ACTION_ICONS = {
  audience_look: '<circle cx="6.5" cy="13" r="3.2"/><circle cx="17.5" cy="13" r="3.2"/><path d="M9.7 13h4.6"/>',
  clear: '<circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  stage_layout: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/>',
  prop: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
};
function iconeAcaoMacro(tipo) {
  const inner = MACRO_ACTION_ICONS[tipo] || '<circle cx="12" cy="12" r="3"/>';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${inner}</svg>`;
}

// Lista (não grade de quadrados) — igual ao painel oficial: numero/cor + nome completo do
// macro + os icones das acoes reais que ele dispara (vem da propria API, /v1/macros).
async function loadMacros() {
  const grid = document.getElementById('pp-macro-grid');
  if (!grid) return;
  const macros = await apiRequest('/v1/macros');
  const lista = Array.isArray(macros) ? macros : [];
  if (lista.length === 0) { grid.innerHTML = '<div class="pp-item-card pp-vazio">Nenhum macro configurado</div>'; return; }
  grid.innerHTML = '';
  lista.forEach((m, idx) => {
    const id = m.id?.uuid ?? idx;
    const nome = m.id?.name || `Macro ${idx + 1}`;
    const cor = m.color ? `rgb(${Math.round((m.color.red || 0) * 255)},${Math.round((m.color.green || 0) * 255)},${Math.round((m.color.blue || 0) * 255)})` : '#2563eb';
    const acoes = Array.isArray(m.actions) ? m.actions : [];
    const row = document.createElement('div');
    row.className = 'pp-macro-row';
    row.innerHTML = `
      <span class="pp-macro-idx" style="background:${cor}">${idx + 1}</span>
      <span class="pp-macro-name" title="${escapeHtml(nome)}">${escapeHtml(nome)}</span>
      <span class="pp-macro-actions">${acoes.map(a => iconeAcaoMacro(a.type)).join('')}</span>
    `;
    row.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest(`/v1/macro/${encodeURIComponent(id)}/trigger`); });
    grid.appendChild(row);
  });
}

// ==========================================================================
// LOOK / APARÊNCIA (mesma função do mobile: troca o "Look" ativo no ProPresenter)
// ==========================================================================
const lookState = { looks: [], current: null };

async function loadLooks() {
  const [looks, current] = await Promise.all([apiRequest('/v1/looks'), apiRequest('/v1/look/current')]);
  if (!Array.isArray(looks)) return;
  lookState.looks = looks;
  lookState.current = (current && current.id) ? current.id : (looks[0]?.id || null);
  document.getElementById('pp-look-label').textContent = lookState.current?.name || 'Look';
  renderLookMenu();
}

// O Look pode mudar por FORA do nosso app (macro, outro controle, o próprio ProPresenter) —
// testado ao vivo: um macro trocou o Look real pra "LOUVOR" e o rótulo aqui ficou com o nome
// antigo até essa checagem rodar. Só confere o atual (leve), não recarrega a lista toda.
async function checarLookAtual() {
  const current = await apiRequest('/v1/look/current');
  const novoId = (current && current.id) ? current.id : null;
  if (!novoId) return;
  if (lookState.current && lookState.current.uuid === novoId.uuid) return;
  lookState.current = novoId;
  document.getElementById('pp-look-label').textContent = novoId.name || 'Look';
  renderLookMenu();
}

// Blackout de verdade (liga/desliga a tela da audiência) — achado no spec oficial da API
// (GET/PUT /v1/status/audience_screens, devolve/aceita um booleano puro). Confere o estado
// real a cada 2s pra nunca mostrar "ligado" quando alguém desligou por fora do app.
async function checarBlackout() {
  const btn = document.getElementById('pp-btn-blackout');
  if (!btn) return;
  const ligado = await apiRequest('/v1/status/audience_screens');
  if (typeof ligado !== 'boolean') return;
  btn.classList.toggle('is-active', !ligado);
  btn.title = ligado ? 'Blackout — liga/desliga a tela da audiência' : 'Telas da audiência DESLIGADAS — clique para religar';
}
document.getElementById('pp-btn-blackout')?.addEventListener('click', async () => {
  lastUserActionTime = Date.now();
  const ligadoAgora = !document.getElementById('pp-btn-blackout').classList.contains('is-active');
  await apiRequest('/v1/status/audience_screens', 'PUT', !ligadoAgora);
  await checarBlackout();
});

// Contador de vídeo pronto da própria API (achado no spec oficial) — mostra "0:00" quando
// não há nada a contar, então só aparece quando o valor não é zerado.
async function checarVideoCountdown() {
  const el = document.getElementById('pp-video-countdown');
  if (!el) return;
  const valor = await apiRequest('/v1/timer/video_countdown');
  const temValor = typeof valor === 'string' && valor.trim() && !/^0?:0?0?:0?0?$/.test(valor.trim());
  el.classList.toggle('hidden', !temValor);
  if (temValor) el.textContent = `⏳ ${valor}`;
}

function renderLookMenu() {
  const list = document.getElementById('pp-look-menu-list');
  if (!list) return;
  if (lookState.looks.length === 0) { list.innerHTML = '<div class="pp-look-menu-item pp-vazio" style="opacity:.6">Nenhum Look configurado</div>'; return; }
  list.innerHTML = '';
  lookState.looks.forEach(look => {
    const isCurrent = lookState.current && (lookState.current.uuid === look.id.uuid || lookState.current.name === look.id.name);
    const item = document.createElement('div');
    item.className = 'pp-look-menu-item' + (isCurrent ? ' active' : '');
    item.innerHTML = `<span>${escapeHtml(look.id.name)}</span>${isCurrent ? '<span>✓</span>' : ''}`;
    item.addEventListener('click', () => triggerLook(look));
    list.appendChild(item);
  });
}

async function triggerLook(look) {
  lastUserActionTime = Date.now();
  const lookId = look.id.uuid || look.id.name;
  await apiRequest(`/v1/look/${encodeURIComponent(lookId)}/trigger`);
  lookState.current = look.id;
  document.getElementById('pp-look-label').textContent = look.id.name || 'Look';
  renderLookMenu();
  document.getElementById('pp-look-menu').classList.add('hidden');
}

document.getElementById('pp-btn-look')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('pp-look-menu').classList.toggle('hidden');
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.pp-look-wrap')) document.getElementById('pp-look-menu')?.classList.add('hidden');
});

// ==========================================================================
// Instalar como app (PWA) — mesma lógica do mobile: some sozinho se já estiver
// instalado, e usa o prompt nativo do navegador quando disponível.
// ==========================================================================
let deferredInstallPrompt = null;
(function setupPwaInstallDesktop() {
  const btn = document.getElementById('pp-btn-install-pwa');
  if (!btn) return;
  const jaInstalado = window.matchMedia('(display-mode: standalone)').matches;
  if (jaInstalado) return; // continua escondido

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    btn.classList.remove('hidden');
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    btn.classList.add('hidden');
  });
  btn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      alert('Para instalar, clique no ícone de instalação (⊕) ao lado da barra de endereços do Chrome/Edge.');
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') btn.classList.add('hidden');
    deferredInstallPrompt = null;
  });
})();

// ==========================================================================
// Configurações (IP/porta do ProPresenter + idioma deste aparelho)
// ==========================================================================
document.getElementById('pp-btn-config')?.addEventListener('click', async () => {
  const overlay = document.getElementById('pp-config-overlay');
  overlay.classList.remove('hidden');
  const info = await apiRequest('/server-info');
  if (info) {
    document.getElementById('pp-cfg-host').value = info.proHost || '';
    document.getElementById('pp-cfg-port').value = info.proPort || '';
    if (info.ips && info.ips.length) {
      document.getElementById('pp-cfg-ips').innerHTML = 'Acesse no iPad/celular:<br>' + info.ips.map(n => `<code>http://${n.ip}:${info.port}/</code>`).join('<br>');
    }
  }
  document.getElementById('pp-cfg-idioma').value = localStorage.getItem(I18N.CHAVE_LOCAL) || '';
});
document.getElementById('pp-config-close')?.addEventListener('click', () => document.getElementById('pp-config-overlay').classList.add('hidden'));
document.getElementById('pp-cfg-salvar')?.addEventListener('click', async () => {
  const host = document.getElementById('pp-cfg-host').value.trim();
  const port = document.getElementById('pp-cfg-port').value.trim();
  const idioma = document.getElementById('pp-cfg-idioma').value;
  const res = await fetch('/api/set-pro-host', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host, port }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { alert('Erro ao salvar: ' + (data.error || 'falha na API')); return; }
  I18N.definirEscolhaUsuario(idioma);
  document.getElementById('pp-config-overlay').classList.add('hidden');
  location.reload();
});

// ==========================================================================
// Idioma (compartilhado com a pele mobile — ver js/i18n.js)
// ==========================================================================
let idiomaAtual = 'pt-BR';

// ==========================================================================
// Inicialização
// ==========================================================================
(async function init() {
  const info = await apiRequest('/server-info');
  idiomaAtual = I18N.detectar(info);
  I18N.aplicar(idiomaAtual);
  await loadLibraries();
  await loadPlaylists();
  await loadMediaPlaylists();
  await loadStageData();
  await loadAudioPlaylists();
  await checarAudioAtual();
  await loadTimers();
  await loadMessages();
  await loadProps();
  await loadVideoInputs();
  await loadCaptureStatus();
  await loadMacros();
  await loadLooks();
  await loadClearGroups();
  setInterval(pollLiveStatus, 1000);
  setInterval(loadTimers, 1000);
  setInterval(loadCaptureStatus, 1000);
  setInterval(checarAudioAtual, 1000);
  setInterval(() => checarTransporte('presentation'), 1000);
  setInterval(() => checarTransporte('announcement'), 1000);
  setInterval(checarLookAtual, 2000);
  setInterval(checarVideoCountdown, 1000);
  setInterval(checarBlackout, 2000);
  setInterval(atualizarContadorMedia, 1000);
  setInterval(atualizarVuMeter, 160);
  setInterval(recarregarPaineisVaziosSeNecessario, 6000);
})();
