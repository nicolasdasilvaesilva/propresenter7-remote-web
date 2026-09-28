// Mock local do ProPresenter 7 (API v1), usado quando não há uma instância real disponível
// para testar (ex.: o ProPresenter travou e foi desinstalado da máquina de dev). Cobre os
// endpoints que o app mobile (public/js/app.js) e o desktop (public-desktop/js/app-desktop.js)
// realmente usam, com dados e comportamento equivalentes ao que já foi validado no real.
//
// Uso: node tools/mock-propresenter.js [porta=50999]
// Depois aponte o server.js para cá: PRO_HOST=127.0.0.1 PRO_PORT=50999 node server.js

const http = require('http');
const PORT = Number(process.argv[2] || 50999);

const id = (name, uuid) => ({ uuid, name, index: 0 });

// --- Playlists de apresentação (culto) --------------------------------------------------
// "Culto Domingo" tem 2 itens de propósito, para poder testar reordenar (▲▼) no desktop.
const presentations = {
  'P-GrandeESenhor': 'Grande é o Senhor',
  'P-Oceanos': 'Oceanos',
  'P-DignoCordeiro': 'Digno é o Cordeiro',
};

function presItem(uuid, index) {
  return { id: { uuid, name: presentations[uuid], index }, target_uuid: uuid, type: 'presentation' };
}

const playlists = {
  'PL-CultoDomingo': { name: 'Culto Domingo', items: [presItem('P-GrandeESenhor', 0), presItem('P-Oceanos', 1)] },
  'PL-Casamento': { name: 'Casamento', items: [presItem('P-DignoCordeiro', 0)] },
  'PL-Quarta': { name: 'Quarta', items: [] },
};

const slides = {
  'P-GrandeESenhor': { groups: [{ name: 'Letra', slides: [0, 1, 2].map(i => ({ text: 'Grande é o Senhor — slide ' + (i + 1), enabled: true })) }] },
  'P-Oceanos': { groups: [{ name: 'Letra', slides: [0, 1].map(i => ({ text: 'Oceanos — slide ' + (i + 1), enabled: true })) }] },
  'P-DignoCordeiro': { groups: [{ name: 'Letra', slides: [0, 1].map(i => ({ text: 'Digno é o Cordeiro — slide ' + (i + 1), enabled: true })) }] },
};

let live = { presUuid: 'P-GrandeESenhor', idx: 0 };
let pending = null; // simula pequeno atraso no trigger, igual ao ProPresenter real
let liveMedia = null; // { playlistUuid, uuid, name } — mídia realmente "no ar" (camada Media)

function currentLive() {
  if (pending && Date.now() < pending.at) return pending.old;
  if (pending) { live = pending.next; pending = null; }
  return live;
}

// --- Mídia / ProContent ------------------------------------------------------------------
const mediaPlaylists = { 'MP-Fotos': { name: 'Fotos do Culto', items: [{ id: id('foto1.jpg', 'M-1'), type: 'image' }, { id: id('foto2.jpg', 'M-2'), type: 'image' }] } };

// --- Áudio ---------------------------------------------------------------------------------
const audioPlaylists = { 'AP-Trilhas': { name: 'Trilhas', items: [{ id: id('Trilha 1', 'A-1'), duration: 180 }, { id: id('Trilha 2', 'A-2'), duration: 210 }] } };
let audioTransport = { is_playing: false, uuid: 'A-1', name: 'Trilha 1', artist: '', duration: 180 };

// --- Mensagens / Props / Video inputs / Macros --------------------------------------------
const messages = [{ id: id('Aviso', 'MSG-1') }];
const messageTokens = { 'MSG-1': { text: { tokens: [{ key: 'Texto', value: 'Bem-vindos!' }] } } };
const props = [{ id: id('Cronômetro', 'PR-1') }];
const videoInputs = [{ id: id('Câmera 1', 'V-1') }];
const macros = [{ id: id('Macro Luzes', 'MC-1') }];

// --- Palco (Stage) -------------------------------------------------------------------------
const layouts = [id('Letra', 'LY-0'), id('Acordes', 'LY-1'), id('Relógio', 'LY-2')];
const screens = [{ uuid: 'S-0', name: 'Retorno R', index: 0 }, { uuid: 'S-1', name: 'Retorno L', index: 1 }, { uuid: 'S-2', name: 'iPad-PCA', index: 2 }];
const screenLayout = { 'S-0': 'LY-0', 'S-1': 'LY-0', 'S-2': 'LY-0' };

// --- Timers, capture, looks ----------------------------------------------------------------
const timers = [{ id: id('Pregação', 'T-1'), time: '00:12:00', state: 'running' }];
let captureStatus = 'inactive';
const looks = [{ id: id('Look A', 'LK-1') }];

const log = [];
// PNG 4x4 roxo sólido, só para o teste conseguir mostrar uma imagem de verdade por trás da letra
// (metade dos casos reais o ProPresenter recusa a thumbnail com 500 — simulado abaixo como 404).
const FAKE_THUMB_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEUlEQVR42mNkYPhfz0AEYBxVAABgYQPnQgp8ZQAAAABJRU5ErkJggg==', 'base64');

http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    log.push(req.method + ' ' + req.url);
    const json = (o, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    const none = (code = 204) => { res.writeHead(code); res.end(); };
    let m;

    if (p === '/__log') return json(log.slice(-60));

    // Biblioteca
    if (p === '/v1/libraries') return json([{ uuid: 'L-0', name: 'Músicas', index: 0 }]);
    if (p === '/v1/library/L-0') return json({ updateType: 'all', items: Object.keys(presentations).map((uuid, i) => ({ uuid, name: presentations[uuid], index: i })) });
    if ((m = p.match(/^\/v1\/library\/L-0\/([^/]+)\/trigger$/))) {
      const uuid = decodeURIComponent(m[1]);
      pending = { old: { ...live }, next: { presUuid: uuid, idx: 0 }, at: Date.now() + 400 };
      return none(204);
    }

    // Playlists de apresentação
    if (p === '/v1/playlists') {
      return json(Object.entries(playlists).map(([uuid, pl]) => ({ id: { uuid, name: pl.name, index: 0 }, type: 'playlist' })));
    }
    if ((m = p.match(/^\/v1\/playlist\/([^/]+)$/))) {
      const key = decodeURIComponent(m[1]);
      if (!(key in playlists)) return none(404);
      if (req.method === 'PUT') { playlists[key].items = JSON.parse(body || '[]'); return none(204); }
      return json({ id: { uuid: key, name: playlists[key].name, index: 0 }, items: playlists[key].items });
    }
    if ((m = p.match(/^\/v1\/playlist\/([^/]+)\/(\d+)\/trigger$/))) {
      const key = decodeURIComponent(m[1]); const idx = Number(m[2]);
      const item = playlists[key] && playlists[key].items[idx];
      if (!item) return none(404);
      pending = { old: { ...live }, next: { presUuid: item.target_uuid, idx: 0 }, at: Date.now() + 400 };
      return none(204);
    }

    // Apresentação / slides
    if (p === '/v1/presentation/slide_index') {
      const c = currentLive();
      return json({ presentation_index: { index: c.idx, presentation_id: { uuid: c.presUuid, name: presentations[c.presUuid], index: 0 } } });
    }
    if ((m = p.match(/^\/v1\/presentation\/([^/]+)\/(\d+)\/trigger$/))) {
      const uuid = decodeURIComponent(m[1]);
      pending = { old: { ...live }, next: { presUuid: uuid, idx: Number(m[2]) }, at: Date.now() + 400 };
      return none(204);
    }
    if ((m = p.match(/^\/v1\/presentation\/([^/]+)$/))) {
      const uuid = decodeURIComponent(m[1]);
      if (!(uuid in slides)) return none(404);
      return json(slides[uuid]);
    }
    // Thumbnail: só "Oceanos" devolve imagem de verdade (testa a camada de fundo real);
    // as outras 404 igual o ProPresenter real faz na maioria dos casos (testa o ícone de fallback).
    if ((m = p.match(/^\/v1\/presentation\/([^/]+)\/thumbnail\/(\d+)$/))) {
      if (decodeURIComponent(m[1]) === 'P-Oceanos') { res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(FAKE_THUMB_PNG); }
      return none(404);
    }

    // Mídia
    if (p === '/v1/media/playlists') return json(Object.entries(mediaPlaylists).map(([uuid, pl]) => ({ id: { uuid, name: pl.name, index: 0 }, type: 'playlist' })));
    if ((m = p.match(/^\/v1\/media\/playlist\/([^/]+)$/))) {
      const key = decodeURIComponent(m[1]);
      if (!(key in mediaPlaylists)) return none(404);
      return json({ id: { uuid: key, name: mediaPlaylists[key].name, index: 0 }, items: mediaPlaylists[key].items });
    }
    if ((m = p.match(/^\/v1\/media\/playlist\/([^/]+)\/([^/]+)\/trigger$/))) {
      const key = decodeURIComponent(m[1]); const mediaUuid = decodeURIComponent(m[2]);
      const pl = mediaPlaylists[key];
      const item = pl && pl.items.find(it => it.id.uuid === mediaUuid);
      if (item) liveMedia = { playlistUuid: key, uuid: item.id.uuid, name: item.id.name };
      return none(204);
    }
    if (p === '/v1/media/playlist/active') {
      if (!liveMedia) return json(null);
      return json({ playlist: { uuid: liveMedia.playlistUuid }, item: { uuid: liveMedia.uuid, name: liveMedia.name, index: 0 } });
    }
    if ((m = p.match(/^\/v1\/media\/([^/]+)\/thumbnail$/))) {
      if (decodeURIComponent(m[1]) === 'M-1') { res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(FAKE_THUMB_PNG); }
      return none(404);
    }

    // Áudio
    if (p === '/v1/audio/playlists') return json(Object.entries(audioPlaylists).map(([uuid, pl]) => ({ id: { uuid, name: pl.name, index: 0 }, type: 'playlist' })));
    if ((m = p.match(/^\/v1\/audio\/playlist\/([^/]+)$/))) {
      const key = decodeURIComponent(m[1]);
      if (!(key in audioPlaylists)) return none(404);
      return json({ id: { uuid: key, name: audioPlaylists[key].name, index: 0 }, items: audioPlaylists[key].items });
    }
    if ((m = p.match(/^\/v1\/audio\/playlist\/([^/]+)\/([^/]+)\/trigger$/))) {
      const key = decodeURIComponent(m[1]); const trackUuid = decodeURIComponent(m[2]);
      const pl = audioPlaylists[key];
      const track = pl && pl.items.find(it => it.id.uuid === trackUuid);
      if (track) { audioTransport.uuid = track.id.uuid; audioTransport.name = track.id.name; audioTransport.duration = track.duration || 0; }
      audioTransport.is_playing = true;
      return none(204);
    }
    if (p === '/v1/transport/audio/current') return json(audioTransport);
    if (p === '/v1/transport/audio/play') { audioTransport.is_playing = true; return none(204); }
    if (p === '/v1/transport/audio/pause') { audioTransport.is_playing = false; return none(204); }
    if (p === '/v1/trigger/audio/next' || p === '/v1/trigger/audio/previous') return none(204);

    // Look
    if (p === '/v1/looks') return json(looks);
    if (p === '/v1/look/current') return json(looks[0]);
    if ((m = p.match(/^\/v1\/look\/([^/]+)\/trigger$/))) return none(204);

    // Mensagens
    if (p === '/v1/messages') return json(messages);
    if ((m = p.match(/^\/v1\/message\/([^/]+)$/))) { const k = decodeURIComponent(m[1]); return messageTokens[k] ? json(messageTokens[k]) : none(404); }
    if ((m = p.match(/^\/v1\/message\/([^/]+)\/trigger$/))) return req.method === 'PUT' ? none(204) : none(204);
    if ((m = p.match(/^\/v1\/message\/([^/]+)\/clear$/))) return none(204);

    // Props
    if (p === '/v1/props') return json(props);
    if ((m = p.match(/^\/v1\/prop\/([^/]+)\/trigger$/))) return none(204);
    if ((m = p.match(/^\/v1\/prop\/([^/]+)\/clear$/))) return none(204);

    // Video inputs
    if (p === '/v1/video_inputs') return json(videoInputs);
    if ((m = p.match(/^\/v1\/video_inputs\/([^/]+)\/trigger$/))) return none(204);

    // Macros
    if (p === '/v1/macros') return json(macros);
    if ((m = p.match(/^\/v1\/macro\/([^/]+)\/trigger$/))) return none(204);

    // Timers
    if (p === '/v1/timers/current') return json(timers);
    if ((m = p.match(/^\/v1\/timer\/([^/]+)\/(start|pause|stop|reset)$/))) {
      const t = timers.find(t => t.id.uuid === decodeURIComponent(m[1]));
      if (t) t.state = m[2] === 'start' ? 'running' : m[2] === 'pause' ? 'stopped' : t.state;
      return none(204);
    }
    if ((m = p.match(/^\/v1\/timer\/([^/]+)\/increment\/(-?\d+)$/))) return none(204);

    // Palco
    if (p === '/v1/stage/screens') return json(screens);
    if (p === '/v1/stage/layouts') return json(layouts.map(l => ({ id: l })));
    if ((m = p.match(/^\/v1\/stage\/screen\/([^/]+)\/layout$/))) {
      const s = decodeURIComponent(m[1]);
      const lyUuid = screenLayout[s];
      const ly = layouts.find(l => l.uuid === lyUuid);
      return ly ? json({ id: ly }) : none(404);
    }
    if ((m = p.match(/^\/v1\/stage\/screen\/([^/]+)\/layout\/([^/]+)$/))) {
      const s = decodeURIComponent(m[1]); const ly = decodeURIComponent(m[2]);
      if (!screens.find(sc => sc.uuid === s) || !layouts.find(l => l.uuid === ly)) return none(404);
      screenLayout[s] = ly; return none(204);
    }
    if (p === '/v1/stage/message') return none(204);

    // Captura
    if (p === '/v1/capture/status') return json({ status: captureStatus, capture_time: '00:00:00', status_description: '' });
    if (p === '/v1/capture/start') { captureStatus = 'active'; return none(204); }
    if (p === '/v1/capture/stop') { captureStatus = 'inactive'; return none(204); }

    // Clear (limpar camadas / tudo)
    if ((m = p.match(/^\/v1\/clear\/layer\/[^/]+$/))) return none(204);
    if (p === '/v1/clear/group/0/trigger') return none(204);

    // Transporte de slides (setas próximo/anterior globais)
    if (p === '/v1/trigger/next' || p === '/v1/trigger/previous') return none(204);

    // Qualquer /trigger ou /clear não mapeado especificamente: aceita, para não travar telas
    // ainda não usadas no teste de hoje (ex.: variações que a UI não exercita neste roteiro).
    if (/\/(trigger|clear)$/.test(p)) return none(204);

    none(404);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log('Mock do ProPresenter rodando em http://127.0.0.1:' + PORT);
});
