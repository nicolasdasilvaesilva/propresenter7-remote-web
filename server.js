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
      const libData = await fetchProJson('/v1/library/' + lib.uuid);
      if (libData && Array.isArray(libData.items)) {
        libData.items.forEach(item => {
          allItems.push({
            uuid: item.uuid,
            name: item.name,
            index: item.index,
            libraryName: lib.name,
            libraryUuid: lib.uuid,
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const hostHeader = req.headers.host || ('localhost:' + PORT);
  const parsedUrl = new URL(req.url, 'http://' + hostHeader);
  const pathname = parsedUrl.pathname;

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
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.host) PROPRESENTER_HOST = data.host;
        if (data.port) PROPRESENTER_PORT = data.port;
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
      const headers = Object.assign({}, proxyRes.headers, {
        'Access-Control-Allow-Origin': '*'
      });
      res.writeHead(proxyRes.statusCode, headers);
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
