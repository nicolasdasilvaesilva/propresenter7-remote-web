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

const server = http.createServer((req, res) => {
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
});
