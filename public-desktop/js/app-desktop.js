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
  isConnected: false,
};
let lastUserActionTime = 0;

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
    if (body) { options.headers = { 'Content-Type': 'application/json' }; options.body = JSON.stringify(body); }
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
    aoClicar: (item, idx) => triggerPlaylistItem(id, idx, item),
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
    aoClicar: (item) => triggerLibraryItem(id, item.id.uuid, item),
  });
}

async function triggerLibraryItem(libraryId, presentationUuid, item) {
  lastUserActionTime = Date.now();
  await apiRequest(`/v1/library/${encodeURIComponent(libraryId)}/${encodeURIComponent(presentationUuid)}/trigger`);
  state.livePresentationUuid = presentationUuid;
  state.currentPresentationUuid = presentationUuid;
  document.getElementById('pp-live-title').textContent = item?.id?.name || item?.name || '—';
  highlightActiveItem();
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
    row.innerHTML = `
      <span class="pp-item-idx">${idx + 1}</span>
      <span class="pp-item-name" title="${escapeHtml(nome)}">${escapeHtml(nome)}</span>
      <span class="pp-item-tag">${escapeHtml(item.type || '')}</span>
      ${podeReordenar && isPresentation ? `<span class="pp-reorder"><button title="${I18N.t('mover_cima', idiomaAtual)}" data-dir="up">▲</button><button title="${I18N.t('mover_baixo', idiomaAtual)}" data-dir="down">▼</button></span>` : ''}
    `;
    row.addEventListener('click', (e) => {
      if (e.target.closest('.pp-reorder')) return;
      aoClicar(item, idx);
    });
    if (podeReordenar && isPresentation) {
      row.querySelectorAll('.pp-reorder button').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); aoReordenar(idx, btn.dataset.dir); });
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

async function triggerPlaylistItem(playlistId, idx, item) {
  lastUserActionTime = Date.now();
  await apiRequest(`/v1/playlist/${encodeURIComponent(playlistId)}/${idx}/trigger`);
  const uuid = item?.presentation_info?.presentation_uuid || item?.id?.uuid;
  if (uuid) { state.livePresentationUuid = uuid; state.currentPresentationUuid = uuid; }
  document.getElementById('pp-live-title').textContent = item?.id?.name || item?.name || '—';
  highlightActiveItem();
}

async function reordenarItem(playlistId, itemIndex, direction) {
  lastUserActionTime = Date.now();
  const res = await apiRequest('/reorder-playlist-item', 'POST', { playlistId, itemIndex, direction });
  if (res && res.success) {
    await loadPlaylistItems(playlistId);
  } else {
    alert((res && res.error) || 'Não foi possível reordenar este item.');
  }
}

document.getElementById('pp-btn-prev')?.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest('/v1/trigger/previous'); });
document.getElementById('pp-btn-next')?.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest('/v1/trigger/next'); });
document.getElementById('pp-btn-show')?.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest('/v1/trigger/next'); });
document.getElementById('pp-btn-clear-preview')?.addEventListener('click', async () => {
  lastUserActionTime = Date.now();
  await apiRequest('/v1/clear/layer/slide');
  document.getElementById('pp-live-title').textContent = 'Nada no ar';
  document.getElementById('pp-live-subtitle').textContent = '—';
});
document.getElementById('pp-btn-clear-all')?.addEventListener('click', async () => {
  for (const camada of ['slide', 'media', 'audio', 'messages', 'props', 'announcements', 'video_input']) {
    await apiRequest(`/v1/clear/layer/${camada}`);
  }
});

// ==========================================================================
// Sincronismo ao vivo (mesma proteção contra o "pulo" da pele mobile):
// ignora respostas antigas por ~2,5s após um toque, e nunca roda 2 consultas juntas.
// ==========================================================================
let pollInFlight = false;
const POLL_QUIET_AFTER_CLICK_MS = 2500;

async function pollLiveStatus() {
  if (pollInFlight) return;
  if (Date.now() - lastUserActionTime < POLL_QUIET_AFTER_CLICK_MS) return;
  pollInFlight = true;
  const startedAt = Date.now();
  try {
    const isStale = () => lastUserActionTime > startedAt;
    const slideIndexData = await apiRequest('/v1/presentation/slide_index');
    if (!isStale() && slideIndexData && slideIndexData.presentation_index) {
      const pIndex = slideIndexData.presentation_index;
      const presUuid = pIndex.presentation_id?.uuid;
      const presName = pIndex.presentation_id?.name;
      if (pIndex.index !== state.liveSlideIndex || presUuid !== state.livePresentationUuid) {
        state.liveSlideIndex = pIndex.index;
        state.livePresentationUuid = presUuid;
        state.currentPresentationUuid = presUuid;
        document.getElementById('pp-live-title').textContent = presName || 'Nada no ar';
        document.getElementById('pp-live-subtitle').textContent = presName ? `Slide ${pIndex.index + 1}` : '—';
        highlightActiveItem();
      }
    }
    if (!isStale() && mediaState.activeId) {
      const activeMedia = await apiRequest('/v1/media/playlist/active');
      if (!isStale() && activeMedia && activeMedia.item && activeMedia.playlist?.uuid === mediaState.activeId) {
        if (activeMedia.item.uuid !== mediaState.liveUuid) {
          mediaState.liveUuid = activeMedia.item.uuid;
          document.getElementById('pp-live-title').textContent = activeMedia.item.name || '—';
          document.getElementById('pp-live-subtitle').textContent = mediaState.activeName;
          highlightLiveMedia();
        }
      }
    }
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

  if (stageScreensCache.length === 0) { list.innerHTML = '<div class="pp-item-card">Nenhuma tela de palco configurada.</div>'; return; }

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
})();

// ==========================================================================
// Mídia / ProContent (árvore esquerda + grade central). A API só permite
// LEITURA e DISPARO de playlists de mídia — nunca reordenar (ver /v1/media/playlist).
// ==========================================================================
const mediaState = { activeId: null, activeName: '', items: [], liveUuid: null };

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
      ? `<div class="pp-media-thumb" style="padding:0"><img src="/api/v1/media/${uuid}/thumbnail" style="width:100%;height:100%;object-fit:cover;border-radius:6px" onerror="this.style.display='none'"></div><div class="pp-media-caption"><span>${idx + 1}</span><span>${escapeHtml(nome)}</span></div>`
      : `<div class="pp-media-thumb">${escapeHtml(nome)}</div><div class="pp-media-caption"><span>${idx + 1}</span><span>${escapeHtml(nome)}</span></div>`;
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
  document.getElementById('pp-live-title').textContent = item.id?.name || item.name || '—';
  document.getElementById('pp-live-subtitle').textContent = mediaState.activeName;
  highlightLiveMedia();
}

function highlightLiveMedia() {
  document.querySelectorAll('#pp-media-grid .pp-media-card').forEach(card => {
    card.classList.toggle('live', Boolean(mediaState.liveUuid) && card.dataset.uuid === mediaState.liveUuid);
  });
}

// ==========================================================================
// Busca de músicas/apresentações + Adicionar à Playlist (mesma função da pele
// mobile: /api/search-songs, /api/list-culto-playlists, /api/add-song-to-playlist)
// ==========================================================================
let searchDebounce = null;
const searchInput = document.getElementById('pp-search-input');
searchInput?.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  const q = searchInput.value.trim();
  fecharResultadosBusca();
  if (!q) return;
  searchDebounce = setTimeout(() => executarBusca(q), 250);
});
searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharResultadosBusca(); });
document.addEventListener('click', (e) => {
  if (!e.target.closest('.pp-search-box')) fecharResultadosBusca();
});

function fecharResultadosBusca() {
  document.getElementById('pp-search-results')?.remove();
}

async function executarBusca(q) {
  const res = await fetch(`/api/search-songs?q=${encodeURIComponent(q)}`);
  const data = await res.json().catch(() => null);
  const results = (data && data.results) || [];
  fecharResultadosBusca();
  const box = document.createElement('div');
  box.className = 'pp-search-results';
  box.id = 'pp-search-results';
  if (results.length === 0) {
    box.innerHTML = '<div class="pp-search-empty">Nenhuma música encontrada</div>';
  } else {
    results.forEach(item => {
      const row = document.createElement('div');
      row.className = 'pp-search-result-row';
      row.innerHTML = `
        <div class="pp-search-result-info">
          <div class="pp-search-result-name">${escapeHtml(item.name)}</div>
          <div class="pp-search-result-lib">${escapeHtml(item.libraryName || '')}</div>
        </div>
        <button class="pp-search-add-btn" data-i18n="add_playlist">+ ${I18N.t('add_playlist', idiomaAtual)}</button>
      `;
      row.querySelector('.pp-search-add-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        abrirEscolhaPlaylist(item);
      });
      box.appendChild(row);
    });
  }
  searchInput.closest('.pp-search-box').appendChild(box);
}

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
  fecharResultadosBusca();
  searchInput.value = '';
}

document.getElementById('pp-picker-close')?.addEventListener('click', () => document.getElementById('pp-picker-overlay').classList.add('hidden'));

// ==========================================================================
// ÁUDIO
// ==========================================================================
const audioState = { activeId: null, activeName: '', tracks: [], playing: false, currentTrackUuid: null };

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

async function checarAudioAtual() {
  const cur = await apiRequest('/v1/transport/audio/current');
  const card = document.getElementById('pp-audio-current');
  if (!card) return;
  if (cur && (cur.name || cur.id?.name)) {
    const nome = cur.name || cur.id?.name;
    const tocando = cur.is_playing !== false;
    audioState.playing = tocando;
    if (cur.uuid || cur.id?.uuid) audioState.currentTrackUuid = cur.uuid || cur.id.uuid;
    card.style.display = '';
    card.textContent = `${tocando ? '▶' : '⏸'} ${nome}${cur.artist ? ' — ' + cur.artist : ''}`;
    atualizarDestaqueAudio();
  } else {
    card.style.display = 'none';
  }
}

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
  if (lista.length === 0) { grid.innerHTML = '<div class="pp-item-card">Nenhum Prop configurado</div>'; return; }
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
  if (lista.length === 0) { list.innerHTML = '<div class="pp-item-card">Nenhuma entrada de vídeo configurada</div>'; return; }
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
async function loadMacros() {
  const grid = document.getElementById('pp-macro-grid');
  if (!grid) return;
  const macros = await apiRequest('/v1/macros');
  const lista = Array.isArray(macros) ? macros : [];
  if (lista.length === 0) { grid.innerHTML = '<div class="pp-item-card">Nenhum macro configurado</div>'; return; }
  grid.innerHTML = '';
  lista.forEach((m, idx) => {
    const id = m.id?.uuid ?? idx;
    const nome = m.id?.name || `Macro ${idx + 1}`;
    const cor = m.color ? `rgb(${Math.round((m.color.red || 0) * 255)},${Math.round((m.color.green || 0) * 255)},${Math.round((m.color.blue || 0) * 255)})` : '#2563eb';
    const btn = document.createElement('div');
    btn.className = 'pp-macro-btn';
    btn.style.background = cor;
    btn.style.fontSize = '13px';
    btn.title = nome;
    btn.textContent = idx + 1;
    btn.addEventListener('click', async () => { lastUserActionTime = Date.now(); await apiRequest(`/v1/macro/${encodeURIComponent(id)}/trigger`); });
    grid.appendChild(btn);
  });
}

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
  setInterval(pollLiveStatus, 1000);
  setInterval(loadTimers, 1000);
  setInterval(loadCaptureStatus, 1000);
})();
