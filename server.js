const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
let PROPRESENTER_HOST = process.env.PRO_HOST || '10.0.21.145';
let PROPRESENTER_PORT = process.env.PRO_PORT || 50820;

const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function getLocalIPAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ name: name, ip: net.address });
      }
    }
  }
  return addresses;
}

// ========================================================================
// CACHE E BUSCA DE BIBLIOTECAS (4.500+ Músicas com resposta < 5ms)
// ========================================================================
let libraryCache = null;
let lastLibraryCacheTime = 0;
let isIndexing = false;

function fetchProJson(endpointPath) {
  return new Promise((resolve) => {
    const opts = {
      hostname: PROPRESENTER_HOST,
      port: PROPRESENTER_PORT,
      path: endpointPath,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

function normalizeText(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isAllowedProHost(h) {
  if (typeof h !== 'string') return false;
  h = h.trim();
  if (/^localhost$/i.test(h)) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b, c, d] = m.slice(1).map(Number);
    if ([a, b, c, d].some(n => n > 255)) return false;
    return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
  }
  return /^[a-z0-9-]+(\.local)?$/i.test(h);
}

// O ProPresenter aninha playlists em pastas (grupos). O spec usa "playlists"; a API de áudio usa "children".
// Devolve só as playlists de verdade (nunca as pastas), com o nome da pasta de origem.
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

function proFetch(p, opts = {}) {
  return fetch(`http://${PROPRESENTER_HOST}:${PROPRESENTER_PORT}${p}`, Object.assign({}, opts, { signal: AbortSignal.timeout(8000) }));
}

async function refreshLibraryCache() {
  if (isIndexing) return libraryCache;
  isIndexing = true;
  try {
    const libs = await fetchProJson('/v1/libraries');
    if (!libs || !Array.isArray(libs)) {
      isIndexing = false;
      return libraryCache || [];
    }

    const allItems = [];
    for (const lib of libs) {
      const libUuid = lib.uuid || (lib.id && lib.id.uuid);
      const libName = lib.name || (lib.id && lib.id.name);
      const libData = await fetchProJson('/v1/library/' + libUuid);
      if (libData && Array.isArray(libData.items)) {
        libData.items.forEach(item => {
          allItems.push({
            uuid: item.uuid,
            name: item.name,
            index: item.index,
            libraryName: libName,
            libraryUuid: libUuid,
            searchName: normalizeText(item.name)
          });
        });
      }
    }

    libraryCache = allItems;
    lastLibraryCacheTime = Date.now();
    console.log(`[Busca] ${libraryCache.length} apresentações indexadas com sucesso.`);
  } catch (e) {
    console.error('[Busca] Erro ao indexar bibliotecas:', e.message);
  } finally {
    isIndexing = false;
  }
  return libraryCache || [];
}

const server = http.createServer(async (req, res) => {
  // Sem CORS: o app é servido pelo próprio servidor (mesma origem). Assim, páginas de
  // outros sites abertas na rede não conseguem ler nem comandar a API.
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const hostHeader = req.headers.host || ('localhost:' + PORT);
  const parsedUrl = new URL(req.url, 'http://' + hostHeader);
  const pathname = parsedUrl.pathname;

  // Bloqueia requisições que alteram algo vindas de outra origem (ex.: outro site aberto no navegador)
  if (pathname.startsWith('/api/') && req.method !== 'GET' && req.method !== 'HEAD' && req.headers.origin) {
    let originHost = '';
    try { originHost = new URL(req.headers.origin).host; } catch (e) { /* origem inválida */ }
    if (originHost !== req.headers.host) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origem não permitida' }));
      return;
    }
  }

  if (pathname === '/api/server-info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      proHost: PROPRESENTER_HOST,
      proPort: PROPRESENTER_PORT,
      ips: getLocalIPAddresses()
    }));
    return;
  }

  if (pathname === '/api/set-pro-host' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { if (body.length < 4096) body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.host !== undefined && data.host !== '') {
          if (!isAllowedProHost(data.host)) throw new Error('Endereço do ProPresenter deve ser um IP da rede local ou nome de computador.');
          PROPRESENTER_HOST = String(data.host).trim();
        }
        if (data.port !== undefined && data.port !== '') {
          const port = Number(data.port);
          if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Porta inválida.');
          PROPRESENTER_PORT = port;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, host: PROPRESENTER_HOST, port: PROPRESENTER_PORT }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Endpoint de busca de músicas / apresentações
  if (pathname === '/api/search-songs') {
    const query = parsedUrl.searchParams.get('q') || '';
    const normQ = normalizeText(query.trim());

    if (!normQ) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ query: '', count: 0, results: [] }));
      return;
    }

    const now = Date.now();
    // Se cache tiver mais de 5 minutos ou for nulo, dispara atualização
    if (!libraryCache || (now - lastLibraryCacheTime > 5 * 60 * 1000)) {
      if (!libraryCache) {
        await refreshLibraryCache();
      } else {
        refreshLibraryCache(); // Atualiza em background
      }
    }

    const list = libraryCache || [];
    const results = [];
    const terms = normQ.split(/\s+/).filter(Boolean);

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const matchAll = terms.every(term => item.searchName.includes(term));
      if (matchAll) {
        results.push({
          uuid: item.uuid,
          name: item.name,
          libraryName: item.libraryName,
          libraryUuid: item.libraryUuid
        });
        if (results.length >= 40) break; // Limite de 40 resultados para rapidez
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      query,
      count: results.length,
      totalIndexed: list.length,
      results
    }));
    return;
  }

  if (pathname === '/api/reload-library-cache') {
    refreshLibraryCache().then(items => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: (items || []).length }));
    });
    return;
  }

  // Endpoint para listar todas as playlists de culto (apresentação) disponíveis
  if (pathname === '/api/list-culto-playlists') {
    try {
      const plRes = await proFetch('/v1/playlists');
      if (!plRes.ok) throw new Error('ProPresenter respondeu ' + plRes.status);
      const rawPlaylists = await plRes.json();

      const playlists = flattenPlaylistTree(rawPlaylists)
        .filter(p => p.id && p.id.name)
        .map(p => ({ uuid: p.id.uuid, name: p.id.name, index: p.id.index, group: p.groupName || '' }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ playlists }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, playlists: [] }));
    }
    return;
  }

  // Endpoint para adicionar música à playlist de culto sem tocar e sem sair da tela atual
  if (pathname === '/api/add-song-to-playlist' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { songUuid, songName } = payload;
        let { playlistId, playlistName } = payload;

        if (!songUuid) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'songUuid é obrigatório' }));
          return;
        }

        // 1. Busca as playlists de apresentação (Culto) disponíveis (com busca recursiva em pastas)
        const plRes = await proFetch('/v1/playlists');
        if (!plRes.ok) throw new Error('ProPresenter respondeu ' + plRes.status + ' ao listar playlists');
        const rawPlaylists = await plRes.json();

        const presPlaylists = flattenPlaylistTree(rawPlaylists);

        // Só grava numa playlist escolhida explicitamente: nunca "adivinha" outra
        let targetPl = null;
        if (playlistId !== undefined && playlistId !== null && playlistId !== '') {
          targetPl = presPlaylists.find(p => p.id?.uuid === playlistId || p.id?.name === playlistId);
        }
        if (!targetPl && playlistName) {
          const normPlName = String(playlistName).trim().toUpperCase();
          targetPl = presPlaylists.find(p => p.id?.name && p.id.name.trim().toUpperCase() === normPlName);
        }

        if (!targetPl || !targetPl.id) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Playlist escolhida não foi encontrada no ProPresenter. Nada foi alterado.' }));
          return;
        }

        const targetPlUuid = targetPl.id.uuid || targetPl.id.name;
        const targetPlName = targetPl.id.name || 'Playlist';

        // 2. Busca os itens existentes na playlist
        const curRes = await proFetch(`/v1/playlist/${encodeURIComponent(targetPlUuid)}`);
        if (!curRes.ok) throw new Error('ProPresenter respondeu ' + curRes.status + ' ao ler a playlist');
        const curData = await curRes.json();
        const existingItems = Array.isArray(curData?.items) ? curData.items : [];

        // 3. Monta o novo item com a estrutura 100% validada pelo ProPresenter 7
        const nextIdx = existingItems.length;
        const newItem = {
          id: {
            index: nextIdx,
            name: songName || 'Música',
            uuid: songUuid
          },
          is_hidden: false,
          is_pco: false,
          type: 'presentation',
          target_uuid: songUuid
        };

        const updatedList = [...existingItems, newItem];

        // 4. Envia o PUT com a lista completa para o ProPresenter
        const putRes = await proFetch(`/v1/playlist/${encodeURIComponent(targetPlUuid)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedList)
        });

        if (putRes.status === 204 || putRes.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            playlistId: targetPlUuid,
            playlistName: targetPlName,
            songName: songName,
            songUuid: songUuid,
            totalItems: updatedList.length
          }));
        } else {
          const errText = await putRes.text();
          res.writeHead(putRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Erro ao adicionar item na API do ProPresenter', details: errText }));
        }
      } catch (err) {
        console.error('Erro no /api/add-song-to-playlist:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Proxy reverso transparente para a API do ProPresenter (/api/v1/...)
  if (pathname.startsWith('/api/v1/')) {
    const targetPath = pathname.replace(/^\/api/, '') + (parsedUrl.search || '');
    const options = {
      hostname: PROPRESENTER_HOST,
      port: PROPRESENTER_PORT,
      path: targetPath,
      method: req.method,
      headers: Object.assign({}, req.headers, {
        host: PROPRESENTER_HOST + ':' + PROPRESENTER_PORT
      })
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error('Erro ao conectar no ProPresenter (' + PROPRESENTER_HOST + ':' + PROPRESENTER_PORT + '):', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Não foi possível conectar ao ProPresenter 7',
          details: err.message,
          target: PROPRESENTER_HOST + ':' + PROPRESENTER_PORT
        }));
      }
    });

    req.pipe(proxyReq, { end: true });
    return;
  }

  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Página não encontrada');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log('   PROPRESENTER 7 REMOTE CONTROLLER INICIADO!');
  console.log('======================================================');
  console.log('Conectado ao ProPresenter em: http://' + PROPRESENTER_HOST + ':' + PROPRESENTER_PORT);
  console.log('\nAcesse no seu computador:');
  console.log('  -> http://localhost:' + PORT);
  console.log('\nAcesse no iPad, Tablet ou Celular conectado no Wi-Fi:');
  const ips = getLocalIPAddresses();
  if (ips.length > 0) {
    ips.forEach(net => {
      console.log('  -> http://' + net.ip + ':' + PORT + '  (' + net.name + ')');
    });
  } else {
    console.log('  -> http://10.0.21.145:' + PORT);
  }
  console.log('======================================================\n');
  refreshLibraryCache().catch(() => {});
});
