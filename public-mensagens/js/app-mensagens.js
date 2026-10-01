// ==========================================================================
// ENVIAR AVISO — pele exclusiva pra mandar mensagem pro telão, sem acesso a
// playlist/mídia/Blackout/Clear geral. Feita pra quem NÃO é o operador
// treinado (zeladores, segurança do estacionamento etc.) usar no próprio
// celular. Reaproveita os mesmos endpoints do popup "Mensagens no Telão" do
// app principal (/v1/messages, /v1/message/{id}, /trigger, /clear).
// ==========================================================================

const els = {
  content: document.getElementById('msg-content'),
  connDot: document.getElementById('msg-conn-dot'),
  confirmOverlay: document.getElementById('msg-confirm-overlay'),
  confirmPreview: document.getElementById('msg-confirm-preview'),
  confirmCancel: document.getElementById('msg-confirm-cancel'),
  confirmOk: document.getElementById('msg-confirm-ok'),
};

const st = {
  list: [],
  activeUuid: null,
  activeTemplate: null,
  tokenValues: {},
  // Lista de nomes de modelo que este login pode ver/usar (ex.: ["CARROS"]), ou null
  // quando não há restrição (uso normal, na rede local, como o operador treinado).
  // Quem define isso é o servidor (via /api/session-info) — nunca o navegador.
  modelosPermitidos: null,
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setConnected(ok) {
  if (!els.connDot) return;
  els.connDot.classList.toggle('disconnected', !ok);
  els.connDot.title = ok ? 'Conectado ao ProPresenter' : 'Sem conexão com o ProPresenter';
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = { method };
    if (body !== null && body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`/api${endpoint}`, options);
    setConnected(res.status !== 502 && res.status !== 503);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return await res.json();
    return res;
  } catch (err) {
    setConnected(false);
    return null;
  }
}

async function carregarModelos() {
  // Só existe em servidores restritos (ex.: o público, atrás do Caddy); no servidor
  // normal da rede local essa rota não existe, a resposta vem null e nada muda.
  const sessao = await apiRequest('/session-info');
  st.modelosPermitidos = Array.isArray(sessao?.allowedTemplates) ? sessao.allowedTemplates : null;

  const data = await apiRequest('/v1/messages');
  let list = Array.isArray(data) ? data : (Array.isArray(data?.value) ? data.value : []);
  if (st.modelosPermitidos) {
    list = list.filter(m => st.modelosPermitidos.includes((m.id?.name || '').toUpperCase()));
  }
  st.list = list;

  if (list.length === 0) {
    els.content.innerHTML = `
      <div class="slides-empty-notice">
        <p>Nenhum modelo de mensagem disponível pra este login.</p>
      </div>
    `;
    return;
  }

  const selected = list.find(m => (m.id?.uuid ?? m.id?.index) === st.activeUuid)
    || list.find(m => m.is_active)
    || list[0];
  selecionarModelo(selected);
}

function selecionarModelo(msg) {
  if (!msg) return;
  st.activeUuid = msg.id?.uuid ?? msg.id?.index;
  st.activeTemplate = msg;

  const msgName = msg.id?.name || 'Mensagem';
  const rawMessage = msg.message || '';
  const tokens = msg.tokens || [];
  const isOnScreen = !!msg.is_active;

  tokens.forEach(tok => {
    if (st.tokenValues[tok.name] === undefined) {
      st.tokenValues[tok.name] = tok.text?.text || '';
    }
  });

  const tokensRowsHtml = tokens.length > 0
    ? tokens.map(tok => {
        const val = st.tokenValues[tok.name] !== undefined ? st.tokenValues[tok.name] : (tok.text?.text || '');
        return `
          <div class="pro-token-row">
            <div class="pro-token-header">${escapeHtml(tok.name)}</div>
            <div class="pro-token-value-row">
              <span class="pro-token-value-label">Valor:</span>
              <input type="text" class="pro-token-input" data-token-name="${escapeHtml(tok.name)}" value="${escapeHtml(val)}" placeholder="Digite ${escapeHtml(tok.name)}...">
            </div>
          </div>
        `;
      }).join('')
    : `<div style="font-size:12px;color:var(--text-dim);padding:12px 14px;background:#1e1e1e;">Esta mensagem é de texto fixo (sem variáveis).</div>`;

  // Só mostra o seletor (o "↕" pra trocar de modelo) quando há mais de um modelo
  // disponível pra este login — um login restrito a um só modelo (ex.: "kids") nem
  // sabe que existem outros.
  const podeTrocarModelo = st.list.length > 1;

  els.content.innerHTML = `
    <div class="pro-messages-container" id="pro-messages-card">
      <div class="pro-msg-header">
        <div class="pro-msg-select-trigger" id="pro-msg-select-trigger" title="${podeTrocarModelo ? 'Selecionar modelo de mensagem' : ''}" style="${podeTrocarModelo ? '' : 'cursor:default'}">
          <svg class="pro-msg-send-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          <span class="pro-msg-current-name">${escapeHtml(msgName)}</span>
          ${podeTrocarModelo ? '<span class="pro-msg-chevron">↕</span>' : ''}
        </div>

        <div class="pro-msg-dropdown-list hidden" id="pro-msg-dropdown-list">
          ${st.list.map(t => {
            const tUuid = t.id?.uuid ?? t.id?.index;
            const isSel = tUuid === st.activeUuid;
            const tName = t.id?.name || 'Mensagem';
            return `
              <button class="pro-msg-dropdown-item ${isSel ? 'selected' : ''}" data-msg-uuid="${escapeHtml(tUuid)}">
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

      <div class="pro-msg-template-box">${escapeHtml(rawMessage)}</div>

      <div class="pro-msg-tokens-container">${tokensRowsHtml}</div>

      <div class="pro-msg-footer">
        <div class="pro-msg-status" id="pro-msg-status">
          ${isOnScreen ? '<span class="status-live">● Exibindo no telão</span>' : '<span>Pronto para enviar</span>'}
        </div>
        <div class="pro-msg-btn-group">
          <button class="pro-btn-dark btn-pro-clear" id="btn-pro-clear" title="Tirar mensagem do telão">Limpar do Telão</button>
          <button class="pro-btn-dark btn-pro-show ${isOnScreen ? 'active' : ''}" id="btn-pro-show" title="Mostrar mensagem no telão">
            ${isOnScreen ? 'No Telão ✓' : 'Enviar para o Telão'}
          </button>
        </div>
      </div>
    </div>
  `;

  const triggerBtn = document.getElementById('pro-msg-select-trigger');
  const dropdownList = document.getElementById('pro-msg-dropdown-list');
  if (triggerBtn && dropdownList && podeTrocarModelo) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownList.classList.toggle('hidden');
    });
    dropdownList.querySelectorAll('.pro-msg-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownList.classList.add('hidden');
        const targetUuid = item.dataset.msgUuid;
        const target = st.list.find(t => String(t.id?.uuid ?? t.id?.index) === targetUuid);
        if (target) selecionarModelo(target);
      });
    });
    document.addEventListener('click', (e) => {
      if (!triggerBtn.contains(e.target) && !dropdownList.contains(e.target)) {
        dropdownList.classList.add('hidden');
      }
    }, { once: true });
  }

  els.content.querySelectorAll('.pro-token-input').forEach(input => {
    input.addEventListener('input', () => {
      st.tokenValues[input.dataset.tokenName] = input.value;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        abrirConfirmacao();
      }
    });
  });

  document.getElementById('btn-pro-show')?.addEventListener('click', abrirConfirmacao);
  document.getElementById('btn-pro-clear')?.addEventListener('click', limparMensagemAtual);
}

// Monta um preview com os valores digitados no lugar dos {TOKENS}, pra quem não é o
// operador conferir exatamente o que vai aparecer no telão antes de confirmar.
function montarPreview(msg) {
  let texto = msg.message || '';
  (msg.tokens || []).forEach(tok => {
    if (tok.timer || tok.clock) return;
    const val = st.tokenValues[tok.name] !== undefined ? st.tokenValues[tok.name] : (tok.text?.text || '');
    texto = texto.split(`{${tok.name}}`).join(val || `{${tok.name}}`);
  });
  return texto;
}

function abrirConfirmacao() {
  if (!st.activeTemplate) return;
  els.confirmPreview.textContent = montarPreview(st.activeTemplate);
  els.confirmOverlay.classList.remove('hidden');
}

function fecharConfirmacao() {
  els.confirmOverlay.classList.add('hidden');
}

els.confirmCancel?.addEventListener('click', fecharConfirmacao);
els.confirmOk?.addEventListener('click', () => {
  fecharConfirmacao();
  enviarMensagemAtual();
});
els.confirmOverlay?.addEventListener('click', (e) => {
  if (e.target === els.confirmOverlay) fecharConfirmacao();
});

async function enviarMensagemAtual() {
  if (!st.activeTemplate) return;

  const msg = st.activeTemplate;
  const msgUuid = msg.id?.uuid ?? msg.id?.index;
  const tokens = msg.tokens || [];
  const statusEl = document.getElementById('pro-msg-status');
  const btnShow = document.getElementById('btn-pro-show');

  if (statusEl) statusEl.innerHTML = '<span style="color:#38bdf8;">Enviando para o telão...</span>';
  if (btnShow) btnShow.textContent = 'Enviando...';

  // Tokens de timer e relógio voltam como vieram; só os de texto recebem o valor digitado
  const cleanTokens = tokens.map(tok => {
    if (tok.timer || tok.clock) return tok;
    return {
      name: tok.name,
      uuid: tok.uuid,
      text: { text: st.tokenValues[tok.name] !== undefined ? String(st.tokenValues[tok.name]) : (tok.text?.text || '') }
    };
  });

  try {
    await apiRequest(`/v1/message/${msgUuid}`, 'PUT', Object.assign({}, msg, { tokens: cleanTokens, visible_on_network: true }));
    const res = await fetch(`/api/v1/message/${msgUuid}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanTokens)
    });

    if (res.ok || res.status === 204) {
      msg.is_active = true;
      if (statusEl) statusEl.innerHTML = '<span class="status-live">● Exibindo no telão!</span>';
      if (btnShow) { btnShow.className = 'pro-btn-dark btn-pro-show active'; btnShow.textContent = 'No Telão ✓'; }
      const badge = els.content.querySelector('.message-template-status-badge');
      if (badge) { badge.className = 'message-template-status-badge active'; badge.textContent = '● NO TELÃO'; }
    } else {
      if (statusEl) statusEl.innerHTML = '<span style="color:#ef4444;">Erro ao enviar mensagem.</span>';
      if (btnShow) btnShow.textContent = 'Enviar para o Telão';
    }
  } catch (err) {
    if (statusEl) statusEl.innerHTML = '<span style="color:#ef4444;">Falha de comunicação com o ProPresenter.</span>';
    if (btnShow) btnShow.textContent = 'Enviar para o Telão';
  }
}

async function limparMensagemAtual() {
  if (!st.activeTemplate) return;

  const msg = st.activeTemplate;
  const msgUuid = msg.id?.uuid ?? msg.id?.index;
  const statusEl = document.getElementById('pro-msg-status');
  const btnShow = document.getElementById('btn-pro-show');

  if (statusEl) statusEl.innerHTML = '<span style="color:#f87171;">Removendo do telão...</span>';

  try {
    await apiRequest(`/v1/message/${msgUuid}/clear`);
    await apiRequest('/v1/clear/layer/messages');

    msg.is_active = false;
    if (statusEl) statusEl.innerHTML = '<span>Mensagem removida do telão.</span>';
    if (btnShow) { btnShow.className = 'pro-btn-dark btn-pro-show'; btnShow.textContent = 'Enviar para o Telão'; }
    const badge = els.content.querySelector('.message-template-status-badge');
    if (badge) { badge.className = 'message-template-status-badge inactive'; badge.textContent = 'PRONTO'; }
  } catch (err) {
    if (statusEl) statusEl.innerHTML = '<span style="color:#ef4444;">Falha ao remover do telão.</span>';
  }
}

carregarModelos();
