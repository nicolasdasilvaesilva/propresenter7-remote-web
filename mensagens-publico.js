// ==========================================================================
// SERVIDOR ISOLADO — "Enviar Aviso" público (túnel Cloudflare na frente,
// SEM Caddy no meio — o login é feito aqui mesmo, com tela própria).
// ==========================================================================
// Este servidor NÃO TEM nenhum código de Blackout/Clear geral/playlist/mídia/
// macro — só os 4 comandos de mensagem. É por isso que ele é seguro de expor
// na internet: mesmo que alguém quebre o login, o pior que consegue fazer é
// mexer numa mensagem de telão, nunca em Blackout ou no culto.
//
// Cada usuário só vê e só consegue mexer no(s) modelo(s) de mensagem mapeados
// pra ele (mensagens-publico-config.json). Essa checagem é feita AQUI, no
// servidor — nunca confiar só no que o app mostra na tela.
//
// Senhas NUNCA ficam em texto puro no config: são um hash scrypt (salt:hash).
// Gere/troque uma senha com:
//   node mensagens-publico.js --gerar-senha "a-senha-nova"

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const CONFIG_FILE = path.join(ROOT, 'config.json');
const MENSAGENS_CONFIG_FILE = path.join(ROOT, 'mensagens-publico-config.json');
const MENSAGENS_DIR = path.join(ROOT, 'public-mensagens');
const PUBLIC_DIR = path.join(ROOT, 'public');

// ---- Utilitário de linha de comando: gerar hash de senha ----
if (process.argv[2] === '--gerar-senha') {
  const senha = process.argv[3];
  if (!senha) {
    console.error('Uso: node mensagens-publico.js --gerar-senha "a-senha"');
    process.exit(1);
  }
  console.log(gerarHashSenha(senha));
  process.exit(0);
}

// ---- Utilitário de linha de comando: criar/trocar a senha do admin (usuário fixo "admin") ----
if (process.argv[2] === '--criar-admin') {
  const senha = process.argv[3];
  if (!senha) {
    console.error('Uso: node mensagens-publico.js --criar-admin "a-senha"');
    process.exit(1);
  }
  const atual = lerJson(MENSAGENS_CONFIG_FILE, false);
  atual.admin = { senhaHash: gerarHashSenha(senha) };
  if (!atual.usuarios) atual.usuarios = {};
  if (!atual.port) atual.port = 3001;
  fs.writeFileSync(MENSAGENS_CONFIG_FILE, JSON.stringify(atual, null, 2));
  console.log('Admin configurado em ' + path.basename(MENSAGENS_CONFIG_FILE) + '. Usuário: admin');
  process.exit(0);
}

function gerarHashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function lerJson(arquivo, obrigatorio) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    if (obrigatorio) {
      console.error(`\n[ERRO] Não consegui ler ${path.basename(arquivo)}: ${e.message}`);
      if (arquivo === MENSAGENS_CONFIG_FILE) {
        console.error('Copie "mensagens-publico-config.exemplo.json" para "mensagens-publico-config.json", gere os hashes de senha com --gerar-senha e ajuste antes de rodar este servidor.\n');
      }
      process.exit(1);
    }
    return {};
  }
}

const CONFIG = lerJson(CONFIG_FILE, false);
const MSG_CONFIG = lerJson(MENSAGENS_CONFIG_FILE, true);

if (!MSG_CONFIG.usuarios || Object.keys(MSG_CONFIG.usuarios).length === 0) {
  console.error('\n[ERRO] Nenhum usuário configurado em "usuarios" no mensagens-publico-config.json.\n');
  process.exit(1);
}

const PORT = Number(MSG_CONFIG.port || 3001);
const PROPRESENTER_HOST = process.env.PRO_HOST || CONFIG.proHost || '10.0.21.145';
const PROPRESENTER_PORT = Number(process.env.PRO_PORT || CONFIG.proPort || 50820);
// { "estacionamento": { senhaHash, modelos: ["CARROS"] }, ... } — mutável: o painel admin
// adiciona/edita/remove direto aqui em memória, e regrava o arquivo a cada mudança.
const USUARIOS = MSG_CONFIG.usuarios;
const ADMIN = MSG_CONFIG.admin || null; // { senhaHash } — configurado via --criar-admin

function salvarUsuariosNoDisco() {
  const atual = lerJson(MENSAGENS_CONFIG_FILE, false);
  atual.usuarios = USUARIOS;
  fs.writeFileSync(MENSAGENS_CONFIG_FILE, JSON.stringify(atual, null, 2));
}

function salvarAdminNoDisco() {
  const atual = lerJson(MENSAGENS_CONFIG_FILE, false);
  atual.admin = ADMIN;
  fs.writeFileSync(MENSAGENS_CONFIG_FILE, JSON.stringify(atual, null, 2));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function proFetch(caminho, opts) {
  return fetch(`http://${PROPRESENTER_HOST}:${PROPRESENTER_PORT}${caminho}`, Object.assign({}, opts, { signal: AbortSignal.timeout(8000) }));
}

function enviarJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let dados = '';
    req.on('data', (c) => { dados += c; if (dados.length > 1e6) req.destroy(); });
    req.on('end', () => {
      if (!dados) return resolve(null);
      try { resolve(JSON.parse(dados)); } catch (e) { resolve(null); }
    });
    req.on('error', reject);
  });
}

function arquivoEstatico(res, caminhoAbsoluto) {
  fs.readFile(caminhoAbsoluto, (err, dados) => {
    if (err) { res.writeHead(404); res.end('Não encontrado'); return; }
    const ext = path.extname(caminhoAbsoluto).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store, no-cache, must-revalidate' });
    res.end(dados);
  });
}

function ehUuidValido(v) {
  return typeof v === 'string' && /^[0-9a-fA-F-]{8,64}$/.test(v);
}

function ipDoCliente(req) {
  // Atrás do túnel Cloudflare, o IP real do celular vem nesse cabeçalho.
  return req.headers['cf-connecting-ip'] || req.socket.remoteAddress || 'desconhecido';
}

// ==========================================================================
// LOGIN (usuário + senha, tela própria) e SESSÕES
// ==========================================================================
const sessoes = new Map(); // token -> { usuario, modelos, criadaEm }
const tentativasLogin = new Map(); // ip -> { falhas, bloqueadoAte }
const DURACAO_SESSAO_MS = 12 * 60 * 60 * 1000; // 12h

function podeTentarLogin(ip) {
  const info = tentativasLogin.get(ip);
  if (!info || !info.bloqueadoAte) return true;
  return Date.now() >= info.bloqueadoAte;
}
function registrarFalhaLogin(ip) {
  const info = tentativasLogin.get(ip) || { falhas: 0 };
  info.falhas++;
  if (info.falhas >= 5) { info.bloqueadoAte = Date.now() + 15 * 60 * 1000; info.falhas = 0; }
  tentativasLogin.set(ip, info);
}
function registrarSucessoLogin(ip) { tentativasLogin.delete(ip); }

function conferirSenha(senhaDigitada, senhaHashArmazenada) {
  const [salt, hashEsperado] = String(senhaHashArmazenada || '').split(':');
  if (!salt || !hashEsperado) return false;
  const hashDigitado = crypto.scryptSync(senhaDigitada, salt, 64).toString('hex');
  const a = Buffer.from(hashDigitado, 'hex');
  const b = Buffer.from(hashEsperado, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function lerCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(p => {
    const idx = p.indexOf('=');
    if (idx > -1) out[p.slice(0, idx).trim()] = decodeURIComponent(p.slice(idx + 1).trim());
  });
  return out;
}

function sessaoAtual(req) {
  const token = lerCookies(req).mensagens_sessao;
  if (!token) return null;
  const sessao = sessoes.get(token);
  if (!sessao) return null;
  if (Date.now() - sessao.criadaEm > DURACAO_SESSAO_MS) { sessoes.delete(token); return null; }
  return sessao;
}

// ==========================================================================
// PAINEL ADMIN — cookie e mapa de sessão SEPARADOS dos usuários normais de
// propósito: uma conta de venue nunca deve conseguir virar admin só porque
// tem um cookie válido, e vice-versa.
// ==========================================================================
const sessoesAdmin = new Map(); // token -> { criadaEm }

function sessaoAdminAtual(req) {
  const token = lerCookies(req).mensagens_admin_sessao;
  if (!token) return null;
  const sessao = sessoesAdmin.get(token);
  if (!sessao) return null;
  if (Date.now() - sessao.criadaEm > DURACAO_SESSAO_MS) { sessoesAdmin.delete(token); return null; }
  return sessao;
}

// Se a senha de um usuário muda ou ele é removido, qualquer sessão aberta dele deixa
// de valer imediatamente — sem isso, a sessão antiga continuaria funcionando até expirar.
function invalidarSessoesDoUsuario(usuario) {
  for (const [token, s] of sessoes) if (s.usuario === usuario) sessoes.delete(token);
}

// ==========================================================================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (pathname.startsWith('/img/')) return arquivoEstatico(res, path.join(PUBLIC_DIR, pathname));

  // manifest.json e service-worker.js ficam FORA do login de propósito: o Chrome busca o
  // manifest sem mandar o cookie de sessão (é o padrão da especificação, a não ser que a
  // página peça credenciais explicitamente) — atrás de login, a checagem de "isso é
  // instalável?" sempre falhava (caía no redirect pro /login), mesmo com o usuário logado
  // de verdade na aba. Nenhum dos dois arquivos tem informação sigilosa.
  if (pathname === '/service-worker.js') return arquivoEstatico(res, path.join(MENSAGENS_DIR, 'service-worker.js'));
  if (pathname === '/mensagens/manifest.json') {
    try {
      const manifesto = lerJson(path.join(MENSAGENS_DIR, 'manifest.json'), false);
      manifesto.start_url = '/';
      manifesto.scope = '/';
      manifesto.id = '/';
      const body = JSON.stringify(manifesto);
      res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate' });
      return res.end(body);
    } catch (e) {
      res.writeHead(404); return res.end();
    }
  }

  if (pathname === '/login' && req.method === 'GET') {
    return arquivoEstatico(res, path.join(MENSAGENS_DIR, 'login.html'));
  }

  if (pathname === '/login' && req.method === 'POST') {
    const ip = ipDoCliente(req);
    if (!podeTentarLogin(ip)) return enviarJson(res, 429, { error: 'Muitas tentativas. Aguarde uns minutos.' });

    const corpo = await lerCorpo(req);
    const usuario = String(corpo?.usuario || '').toLowerCase().trim();
    const senha = String(corpo?.senha || '');
    const dadosUsuario = USUARIOS[usuario];

    if (!dadosUsuario || !conferirSenha(senha, dadosUsuario.senhaHash)) {
      registrarFalhaLogin(ip);
      return enviarJson(res, 401, { error: 'Usuário ou senha incorretos.' });
    }

    registrarSucessoLogin(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessoes.set(token, { usuario, modelos: dadosUsuario.modelos.map(m => m.toUpperCase()), criadaEm: Date.now() });
    res.setHeader('Set-Cookie', `mensagens_sessao=${token}; HttpOnly; SameSite=Lax; Max-Age=${DURACAO_SESSAO_MS / 1000}; Path=/`);
    return enviarJson(res, 200, { ok: true });
  }

  if (pathname === '/logout' && req.method === 'POST') {
    const token = lerCookies(req).mensagens_sessao;
    if (token) sessoes.delete(token);
    res.setHeader('Set-Cookie', 'mensagens_sessao=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/');
    return enviarJson(res, 200, { ok: true });
  }

  // ==========================================================================
  // PAINEL ADMIN — cria/edita/remove os usuários que mandam mensagem, sem
  // precisar editar arquivo nem reiniciar o serviço. Conta separada dos
  // usuários normais (ver sessaoAdminAtual). Sem admin configurado ainda
  // (rode --criar-admin), essas rotas ficam desligadas.
  // ==========================================================================
  if (pathname === '/admin/login' && req.method === 'GET') {
    return arquivoEstatico(res, path.join(MENSAGENS_DIR, 'admin-login.html'));
  }

  if (pathname === '/admin/login' && req.method === 'POST') {
    if (!ADMIN) return enviarJson(res, 503, { error: 'Nenhum admin configurado (rode --criar-admin no servidor).' });
    const ip = ipDoCliente(req);
    if (!podeTentarLogin(ip)) return enviarJson(res, 429, { error: 'Muitas tentativas. Aguarde uns minutos.' });

    const corpo = await lerCorpo(req);
    const senha = String(corpo?.senha || '');
    if (!conferirSenha(senha, ADMIN.senhaHash)) {
      registrarFalhaLogin(ip);
      return enviarJson(res, 401, { error: 'Senha incorreta.' });
    }
    registrarSucessoLogin(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessoesAdmin.set(token, { criadaEm: Date.now() });
    res.setHeader('Set-Cookie', `mensagens_admin_sessao=${token}; HttpOnly; SameSite=Lax; Max-Age=${DURACAO_SESSAO_MS / 1000}; Path=/`);
    return enviarJson(res, 200, { ok: true });
  }

  if (pathname === '/admin/logout' && req.method === 'POST') {
    const token = lerCookies(req).mensagens_admin_sessao;
    if (token) sessoesAdmin.delete(token);
    res.setHeader('Set-Cookie', 'mensagens_admin_sessao=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/');
    return enviarJson(res, 200, { ok: true });
  }

  if (pathname.startsWith('/admin')) {
    const sessaoAdmin = sessaoAdminAtual(req);
    if (!sessaoAdmin) {
      if (req.method === 'GET' && pathname === '/admin') {
        res.writeHead(302, { Location: '/admin/login' });
        return res.end();
      }
      return enviarJson(res, 401, { error: 'Sessão de admin expirada. Entre de novo.' });
    }

    if (pathname === '/admin' && req.method === 'GET') {
      return arquivoEstatico(res, path.join(MENSAGENS_DIR, 'admin.html'));
    }

    if (pathname === '/admin/api/usuarios' && req.method === 'GET') {
      const lista = Object.entries(USUARIOS).map(([usuario, dados]) => ({ usuario, modelos: dados.modelos }));
      // Começa com os modelos que já estão em uso por algum usuário — assim dá pra editar
      // (trocar senha, ajustar quem usa o quê) mesmo se o ProPresenter estiver inalcançável
      // no momento (ex.: este servidor ainda não está na rede dele). Só criar um usuário com
      // um modelo totalmente novo exige a lista ao vivo.
      const modelosConhecidos = new Set();
      for (const dados of Object.values(USUARIOS)) for (const m of dados.modelos) modelosConhecidos.add(m);
      try {
        const r = await proFetch('/v1/messages');
        const data = await r.json();
        const msgs = Array.isArray(data) ? data : (Array.isArray(data?.value) ? data.value : []);
        msgs.map(m => m.id?.name).filter(Boolean).forEach(nome => modelosConhecidos.add(nome.toUpperCase()));
      } catch (e) { /* ProPresenter fora do ar — segue só com os modelos já conhecidos */ }
      return enviarJson(res, 200, { usuarios: lista, modelosDisponiveis: Array.from(modelosConhecidos) });
    }

    if (pathname === '/admin/api/senha' && req.method === 'PUT') {
      const corpo = await lerCorpo(req);
      const senhaAtual = String(corpo?.senhaAtual || '');
      const novaSenha = String(corpo?.novaSenha || '');
      if (!ADMIN || !conferirSenha(senhaAtual, ADMIN.senhaHash)) {
        return enviarJson(res, 401, { error: 'Senha atual incorreta.' });
      }
      if (novaSenha.length < 8) return enviarJson(res, 400, { error: 'A nova senha precisa ter pelo menos 8 caracteres.' });
      ADMIN.senhaHash = gerarHashSenha(novaSenha);
      salvarAdminNoDisco();
      // Troca a senha e derruba todas as sessões de admin abertas (inclusive esta) —
      // a pessoa precisa entrar de novo com a senha nova, igual qualquer troca de senha séria.
      sessoesAdmin.clear();
      res.setHeader('Set-Cookie', 'mensagens_admin_sessao=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/');
      return enviarJson(res, 200, { ok: true });
    }

    if (pathname === '/admin/api/usuarios' && req.method === 'POST') {
      const corpo = await lerCorpo(req);
      const usuario = String(corpo?.usuario || '').toLowerCase().trim();
      const senha = String(corpo?.senha || '');
      const modelos = Array.isArray(corpo?.modelos) ? corpo.modelos.filter(Boolean) : [];

      if (!/^[a-z0-9]{3,30}$/.test(usuario)) return enviarJson(res, 400, { error: 'Usuário deve ter só letras minúsculas e números (3 a 30 caracteres).' });
      if (senha.length < 8) return enviarJson(res, 400, { error: 'Senha precisa ter pelo menos 8 caracteres.' });
      if (modelos.length === 0) return enviarJson(res, 400, { error: 'Selecione pelo menos um modelo de mensagem.' });
      if (USUARIOS[usuario]) return enviarJson(res, 409, { error: 'Esse usuário já existe.' });

      USUARIOS[usuario] = { senhaHash: gerarHashSenha(senha), modelos };
      salvarUsuariosNoDisco();
      return enviarJson(res, 200, { ok: true });
    }

    const mUsuario = pathname.match(/^\/admin\/api\/usuarios\/([a-z0-9]{1,30})$/);
    if (mUsuario && req.method === 'PUT') {
      const usuario = mUsuario[1];
      if (!USUARIOS[usuario]) return enviarJson(res, 404, { error: 'Usuário não encontrado.' });
      const corpo = await lerCorpo(req);
      const modelos = Array.isArray(corpo?.modelos) ? corpo.modelos.filter(Boolean) : USUARIOS[usuario].modelos;
      if (modelos.length === 0) return enviarJson(res, 400, { error: 'Selecione pelo menos um modelo de mensagem.' });
      USUARIOS[usuario].modelos = modelos;
      if (corpo?.senha) {
        if (String(corpo.senha).length < 8) return enviarJson(res, 400, { error: 'Senha precisa ter pelo menos 8 caracteres.' });
        USUARIOS[usuario].senhaHash = gerarHashSenha(String(corpo.senha));
        invalidarSessoesDoUsuario(usuario);
      }
      salvarUsuariosNoDisco();
      return enviarJson(res, 200, { ok: true });
    }

    if (mUsuario && req.method === 'DELETE') {
      const usuario = mUsuario[1];
      if (!USUARIOS[usuario]) return enviarJson(res, 404, { error: 'Usuário não encontrado.' });
      delete USUARIOS[usuario];
      invalidarSessoesDoUsuario(usuario);
      salvarUsuariosNoDisco();
      return enviarJson(res, 200, { ok: true });
    }

    return enviarJson(res, 404, { error: 'Rota de admin não encontrada.' });
  }

  // ---- Tudo daqui pra baixo exige sessão válida (usuário normal) ----
  const sessao = sessaoAtual(req);
  if (!sessao) {
    if (req.method === 'GET' && !pathname.startsWith('/api/')) {
      res.writeHead(302, { Location: '/login' });
      return res.end();
    }
    return enviarJson(res, 401, { error: 'Sessão expirada. Entre de novo.' });
  }

  // O index.html é o MESMO arquivo servido pelo servidor principal em /mensagens/ —
  // ele referencia os caminhos com esse prefixo, então repetimos aqui pra bater certo.
  if (pathname === '/' || pathname === '/index.html') return arquivoEstatico(res, path.join(MENSAGENS_DIR, 'index.html'));
  if (pathname === '/mensagens/css/mensagens.css') return arquivoEstatico(res, path.join(MENSAGENS_DIR, 'css', 'mensagens.css'));
  if (pathname === '/mensagens/js/app-mensagens.js') return arquivoEstatico(res, path.join(MENSAGENS_DIR, 'js', 'app-mensagens.js'));
  if (pathname === '/css/style.css') return arquivoEstatico(res, path.join(PUBLIC_DIR, 'css', 'style.css'));

  if (pathname === '/api/session-info' && req.method === 'GET') {
    return enviarJson(res, 200, { usuario: sessao.usuario, allowedTemplates: sessao.modelos });
  }

  if (pathname === '/api/v1/messages' && req.method === 'GET') {
    try {
      const r = await proFetch('/v1/messages');
      const data = await r.json();
      const lista = Array.isArray(data) ? data : (Array.isArray(data?.value) ? data.value : []);
      const filtrada = lista.filter(m => sessao.modelos.includes((m.id?.name || '').toUpperCase()));
      return enviarJson(res, 200, filtrada);
    } catch (e) {
      return enviarJson(res, 502, { error: 'Sem conexão com o ProPresenter.' });
    }
  }

  // Confirma que o UUID pedido pertence de verdade a um modelo permitido pro usuário
  // (nunca confiar no que o navegador manda) antes de deixar escrever/disparar/limpar.
  const mUuid = pathname.match(/^\/api\/v1\/message\/([^/]+)(\/(trigger|clear))?$/);
  if (mUuid) {
    const uuid = decodeURIComponent(mUuid[1]);
    const acao = mUuid[3] || null;
    if (!ehUuidValido(uuid)) return enviarJson(res, 400, { error: 'UUID inválido.' });

    let mensagemAlvo;
    try {
      const r = await proFetch('/v1/messages');
      const data = await r.json();
      const lista = Array.isArray(data) ? data : (Array.isArray(data?.value) ? data.value : []);
      mensagemAlvo = lista.find(m => String(m.id?.uuid ?? m.id?.index) === uuid);
    } catch (e) {
      return enviarJson(res, 502, { error: 'Sem conexão com o ProPresenter.' });
    }
    if (!mensagemAlvo || !sessao.modelos.includes((mensagemAlvo.id?.name || '').toUpperCase())) {
      return enviarJson(res, 403, { error: 'Essa mensagem não pertence ao seu usuário.' });
    }

    if (!acao && req.method === 'PUT') {
      const corpo = await lerCorpo(req);
      try {
        const r = await proFetch(`/v1/message/${encodeURIComponent(uuid)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corpo),
        });
        return enviarJson(res, r.status, {});
      } catch (e) { return enviarJson(res, 502, { error: 'Falha ao salvar.' }); }
    }

    if (acao === 'trigger' && req.method === 'POST') {
      const corpo = await lerCorpo(req);
      try {
        const r = await proFetch(`/v1/message/${encodeURIComponent(uuid)}/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corpo),
        });
        return enviarJson(res, r.status, {});
      } catch (e) { return enviarJson(res, 502, { error: 'Falha ao enviar.' }); }
    }

    if (acao === 'clear' && req.method === 'GET') {
      // Só limpa a camada inteira se nada de OUTRO usuário estiver ao vivo agora —
      // sem essa checagem, "estacionamento" poderia apagar a mensagem do "kids".
      try {
        const r0 = await proFetch('/v1/messages');
        const data0 = await r0.json();
        const lista0 = Array.isArray(data0) ? data0 : (Array.isArray(data0?.value) ? data0.value : []);
        const outroAtivo = lista0.find(m => m.is_active && !sessao.modelos.includes((m.id?.name || '').toUpperCase()));
        if (outroAtivo) return enviarJson(res, 409, { error: 'Outra mensagem está no ar agora — não é sua, não foi limpa.' });

        await proFetch(`/v1/message/${encodeURIComponent(uuid)}/clear`);
        await proFetch('/v1/clear/layer/messages');
        return enviarJson(res, 200, {});
      } catch (e) { return enviarJson(res, 502, { error: 'Falha ao limpar.' }); }
    }
  }

  return enviarJson(res, 404, { error: 'Rota não permitida neste servidor.' });
});

server.listen(PORT, () => {
  console.log('\n======================================================');
  console.log('   ENVIAR AVISO (SERVIDOR ISOLADO) INICIADO!');
  console.log('======================================================');
  console.log(`Escutando na porta ${PORT}`);
  console.log(`ProPresenter: http://${PROPRESENTER_HOST}:${PROPRESENTER_PORT}`);
  console.log('Usuários configurados:', Object.keys(USUARIOS).join(', '));
  console.log('======================================================\n');
});
