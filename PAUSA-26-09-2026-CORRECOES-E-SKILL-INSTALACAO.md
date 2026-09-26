# PAUSA 26/09/2026 — Correções feitas, teste no servidor real e skill de instalação (amanhã)

> Leia este arquivo primeiro ao retomar. Retomada prevista: **27/09/2026**.
> Estado em uma linha: **correções escritas e testadas contra um ProPresenter FALSO; NADA foi testado no ProPresenter real e NADA foi enviado ao GitHub.**

---

## 1. Onde está cada coisa

| O quê | Onde |
|---|---|
| Código-fonte onde o servidor roda (já corrigido) | `C:\Users\nicol\.gemini\antigravity-ide\scratch\propresenter-remote` |
| Backup ANTES das correções | `...\scratch\propresenter-remote.backup-antes-das-correcoes` |
| Repositório Git (deploy) | `...\scratch\ProPresenter-Remote-Deploy` |
| Branch com as correções (SEM commit) | `fix/correcoes-api-e-layout` (parte de `main` = `62abba4`) |
| GitHub | `nicolasdasilvaesilva/propresenter7-remote-web` — release `v1.0.0` (Latest), 62abba4 |
| Spec oficial da API (o que foi usado na análise) | `https://openapi.propresenter.com/swagger.json` |

Arquivos alterados (nas duas pastas, idênticos): `server.js`, `public/js/app.js`, `public/css/style.css`, `public/index.html` (versão `?v=4.2`), `public/service-worker.js` (cache `v3.1`).

⚠️ O servidor que está rodando hoje no computador ainda pode estar com o código ANTIGO. Precisa **reiniciar** para valer.

---

## 2. O que foi corrigido (e como foi provado)

Provas feitas com um ProPresenter falso (mock) seguindo o spec — **não é o real**.

1. **"Pulo" ao trocar música/slide** — causa: o polling de 1 s recebia o estado ANTIGO do ProPresenter logo após o toque e voltava o destaque; a variável `lastUserActionTime` era gravada mas nunca lida. Agora o polling fica quieto 2,5 s após o toque, descarta respostas iniciadas antes do toque e não roda duas consultas juntas. Também: `currentPresentationUuid` é definido ao clicar, e cargas de slides antigas não sobrescrevem as novas.
   - Prova: versão antiga = destaque 4 → 1 → 4 com "Slide 4 de 1"; versão nova = 4 direto, "Slide 4 de 5".
2. **"Slide N de 1"** — a API não devolve `total_cues`; agora usa a contagem da grade carregada.
3. **Stage (marcador "mudar em conjunto")** — regra única `isStageScreenSynced()`; a chave da preferência passa a ser `nome#índice` (lê as chaves antigas como reserva); marcar/desmarcar atualiza o topo do modal na hora; depois de trocar, o app **relê o layout real** e avisa qual tela falhou (antes mostrava sucesso sem conferir); nomes com apóstrofo não quebram mais os botões (`jsArgs`).
4. **Playlists dentro de pastas** — o spec usa `playlists` (áudio usa `children`); agora `flattenPlaylistTree()` (servidor e cliente) aceita os dois e nunca lista a pasta como playlist.
5. **Adicionar música à playlist** — só grava na playlist ESCOLHIDA no modal; se não achar, 404 e nada é alterado (antes caía em "domingo/culto" ou na primeira). Modal mostra `Pasta › Playlist`. Timeout de 8 s e checagem de resposta.
6. **Captura** — agora `GET /v1/capture/start|stop` (era POST), campo `capture_time`, estados `caution`/`error`.
7. **Áudio** — respeita `is_playing` (pausado não aparece como tocando).
8. **Bolinha de conexão** — só fica vermelha em 502/503/falha de rede; 404 do ProPresenter é normal ("nada no ar").
9. **Itens de playlist** — cabeçalhos/placeholders não tentam abrir slides; itens `media/audio/livevideo` não são tratados como apresentação.
10. **Entrada de vídeo** (usa `uuid`/`name`/`index` planos), **timer** ("Estourado"), **props** (mostra ATIVO), **timers sem recriar botões a cada segundo**, **mensagens** preservam tokens de timer/relógio, **mensagem de palco** confere o resultado.
11. **Segurança** — sem CORS aberto; escritas de outra origem → 403; `set-pro-host` só aceita IP da rede local/nome de computador e valida a porta; limite de corpo. *Limite conhecido:* um site aberto na rede ainda consegue disparar comandos `GET` (em HTTP puro o navegador não envia identificação). Só senha/HTTPS resolvem.
12. **Toque/teclado** — botões do cabeçalho 40 px em telas de toque (`pointer: coarse`); Espaço/setas não passam slide com pop-up aberto; Escape fecha todos os pop-ups.

**Decidido NÃO mexer (continua como está):** o clique na música já a coloca no ar; a preferência do Stage é guardada em cada aparelho; o menu superior rola na horizontal (é proposital, o dono gosta assim); sem HTTPS (rede local, acesso por IP:3000).

---

## 3. Pendências do projeto (não são desta rodada, mas estão anotadas)

- [ ] **Persistir o IP/porta do ProPresenter.** `set-pro-host` só muda na memória; ao reiniciar o servidor volta para `10.0.21.145:50820` (ou `PRO_HOST`/`PRO_PORT`). Guardar em um `config.json`.
- [ ] Preferência do Stage guardada no **servidor** (valer para todos os aparelhos) — só se o dono quiser.
- [ ] Clique na música: "seleciona primeiro, coloca no ar depois" — só se o dono quiser.
- [ ] Ícone `maskable` do PWA é o mesmo do `any` (sem margem) → será cortado no Android.
- [ ] Texto da release/README: remover "Blackout de emergência" (não achei botão nem rota), trocar "≥ 768px" por "≥ 769px", e o "prompt nativo de instalação no Android/PC" não aparece em HTTP puro (no iOS "Adicionar à Tela de Início" funciona).
- [ ] Licença: o GitHub mostra `NOASSERTION` (arquivo `LICENSE` fora do padrão); repositório sem descrição/tópicos; release sem arquivos anexados (um ZIP pronto ajudaria).
- [ ] Decidir se publica como `v1.0.1`.

---

## 4. AMANHÃ (27/09) — Teste no servidor REAL, antes de subir para o Git

O plano é o Claude testar **desta máquina**, acessando o computador do ProPresenter pela rede (ProPresenter em `10.0.21.145:50820`, servidor do controle remoto em `10.0.21.208:3000`, conforme MEMORIA_PROJETO).

**Regras de segurança do teste (combinar antes):**
- Começar só com leituras (`GET` sem "trigger"): status, playlists, looks, timers, captura.
- **Nada que mude a saída ao vivo** (trigger de slide/mídia/look/clear/mensagem/prop/vídeo) sem o dono avisar que os telões estão livres. Escolher uma janela sem culto/ensaio.
- Não gravar/parar captura de verdade sem autorização.
- Para "adicionar música à playlist": usar uma playlist de TESTE e remover depois (o `PUT` reenvia a lista inteira).

**Checklist do teste real:**
1. Reiniciar o servidor com o código novo e confirmar que sobe (`/api/server-info`).
2. `GET /v1/playlists` real: ver se a árvore vem com `playlists` ou `children`, e se há pastas — confirma o achatamento.
3. `GET /v1/libraries`: formato plano (`uuid/name`) ou com `id`? (o código aceita os dois).
4. `GET /v1/presentation/{uuid}`: tem o invólucro `presentation`? (o código aceita com e sem).
5. `GET /v1/presentation/slide_index`: confirmar que NÃO traz `total_cues`.
6. `GET /v1/transport/audio/current` com áudio pausado → confirma o `is_playing`.
7. `GET /v1/capture/status` → campo `capture_time`; testar `start`/`stop` só com autorização.
8. `GET /v1/stage/screens`, `/v1/stage/layouts`, `/v1/stage/screen/{id}/layout` → formato real; testar troca de layout com autorização e conferir que o app relê o estado.
9. O "pulo": disparar slides e conferir (com o dono olhando) que o destaque não volta.
10. Modal de playlist: listar as playlists reais (inclusive dentro de pastas) e adicionar em uma de teste.
11. iPad físico: menu rolando, botões com toque confortável, instalar na Tela de Início, recarregar 2x para pegar o cache novo.
12. Só então: commit na branch `fix/correcoes-api-e-layout`, PR/merge, e decidir a `v1.0.1`. **Não fazer push sem o dono pedir.**

---

## 5. Análise da skill atual `skills/propresenter-expert/SKILL.md` (280 linhas)

**O que ela faz bem:** mapa dos endpoints, arquitetura, regras de iPad/Safari (portais, teclado), módulos avançados, e um roteiro de atualização com cache-bust (parar servidor → git pull → subir versão do Service Worker e dos `?v=` → reconfigurar autostart → reiniciar → limpar cache dos aparelhos).

**Pontos a corrigir (ficaram velhos ou arriscados):**
1. §1 manda "sempre `Access-Control-Allow-Origin: *`" — **contradiz a correção de segurança** (CORS foi removido; o app é servido pelo próprio servidor).
2. §2E diz que `slide_index` devolve `total_cues` — **não devolve** (era a causa do "Slide N de 1").
3. §8.4 cita `flattenPl()` — agora é `flattenPlaylistTree()` e aceita `playlists` e `children`.
4. §5 Passo 1 usa `taskkill /f /im node.exe` — **mata TODOS os processos Node da máquina** (inclusive ferramentas do próprio Antigravity). Trocar por: achar o PID que escuta a porta 3000 e encerrar só ele.
5. §5 Passo 6 roda `node server.js` em primeiro plano — trava o agente. Usar o modo silencioso.
6. Exemplos de versão (`v2.5`, `?v=4.0`) estão desatualizados (agora `v3.1` / `?v=4.2`). Melhor dizer "incremente o que estiver lá".
7. Mistura duas coisas: **conhecimento da API** e **procedimento de instalação/atualização**. Sugestão: separar em duas skills.
8. `Instalar-Skill.bat` copia para `%USERPROFILE%\.gemini\config\skills\...` — **conferir amanhã** se esse é mesmo o caminho onde o Antigravity lê skills.

**Lacunas nos scripts de inicialização (importantes para "ligou o PC, funcionou"):**
- `Configurar-Inicio-Automatico.bat` coloca um `.vbs` na pasta **Inicializar**, que só roda **depois do login do usuário** — se o Windows ligar e ficar na tela de senha, o servidor não sobe. Alternativas: Agendador de Tarefas ("ao iniciar o sistema" ou "ao fazer logon", com reinício em falha) ou login automático.
- Usa `node` do PATH; no boot o PATH pode não estar pronto → usar o caminho completo do `node.exe`.
- **Sem regra no Firewall do Windows** para a porta 3000 (Rede Privada). Sem ela o iPad pode não conseguir conectar, mesmo com o servidor no ar.
- Não verifica se a porta 3000 já está ocupada (segunda instância cai com `EADDRINUSE` sem avisar).
- Sem **log** (o `.vbs` roda invisível; se falhar, ninguém vê).
- IP fixo: o `Iniciar-Controle-Remoto.bat` mostra `10.0.21.145` escrito à mão, e o servidor usa esse IP como padrão do ProPresenter. Se o IP do computador mudar (DHCP), o endereço dos aparelhos muda → recomendar IP fixo/reserva no roteador.
- Não persiste a configuração (ver pendência da seção 3).

---

## 6. Skill NOVA a criar amanhã: `propresenter-remote-install`

Uma skill especializada **só em instalar/atualizar/reparar**, no mesmo formato da existente (`skills/<nome>/SKILL.md`, instalada por um `.bat` para a pasta de skills do Antigravity). Ela deve conduzir o agente a fazer tudo sozinho e **conferir no fim**.

**Fluxos que ela precisa cobrir:**
1. **Instalação nova:** Node.js (winget, com verificação de `node -v` e caminho completo), clonar o repositório numa pasta fixa, instalar a skill de especialista, criar a inicialização automática, abrir a porta no Firewall (Rede Privada), iniciar, conferir e mostrar o link para o iPad.
2. **Atualização (o que o dono pediu):**
   1. Parar **só** o servidor do controle remoto (pela porta 3000, sem matar outros `node`).
   2. Guardar a configuração (IP/porta do ProPresenter, `config.json`).
   3. `git pull` (ou baixar a versão nova) — sem sobrar arquivo antigo.
   4. Limpar caches antigos: incrementar `CACHE_NAME` do Service Worker e os `?v=` do `index.html`; garantir que nenhum arquivo antigo fique em cache no servidor.
   5. Reaplicar a inicialização automática (caminho correto).
   6. Reiniciar em segundo plano.
   7. **Conferir:** `/api/server-info` responde; `GET /` traz a versão nova (`?v=`); `curl` ao ProPresenter (`/version`) responde; a porta 3000 está escutando; a tarefa de inicialização existe.
   8. Orientar limpar o cache nos aparelhos (recarregar 2x; PWA: fechar e abrir).
3. **Teste de "ligou o PC":** reiniciar o Windows (com autorização do dono) e conferir que o servidor sobe sozinho; ou simular com o Agendador de Tarefas.
4. **Reparo:** servidor não sobe (porta ocupada, Node ausente, caminho errado), iPad não conecta (Firewall, IP mudou), ProPresenter inacessível (IP/porta na configuração).
5. **Desinstalação/rollback:** remover a tarefa de inicialização, a regra do Firewall e voltar à versão anterior (guardar um backup antes de atualizar).

**Entregáveis previstos:** `skills/propresenter-remote-install/SKILL.md`; ajuste do `Instalar-Skill.bat` para instalar as DUAS skills; scripts de apoio (`Atualizar.bat`/`.ps1`, `Verificar.ps1`) que a skill chama; atualizar `COMO-INSTALAR.txt` e `PROMPT-PARA-ANTIGRAVITY.txt`. Corrigir também os 8 pontos da skill atual (seção 5).

**Como validar amanhã:** rodar o fluxo de atualização neste computador (pasta `propresenter-remote`) e, se o dono autorizar, testar remotamente no computador do ProPresenter; só depois empacotar.

---

## 7. Ordem sugerida para amanhã
1. Reiniciar o servidor com o código novo e rodar a checklist da seção 4 (só leituras primeiro).
2. Combinar a janela para os testes que mexem na saída ao vivo.
3. Corrigir o que o teste real revelar.
4. Criar a skill `propresenter-remote-install` + scripts (seção 6) e testar a atualização de ponta a ponta.
5. Commit na branch, revisão do dono, e só então decidir merge/`v1.0.1`/push.

---

## 8. RESULTADO DO TESTE NO PROPRESENTER REAL (27/09/2026)

ProPresenter real: `10.0.21.145:50820`, versao **21.4.2**. Servidor do controle remoto: este computador (`10.0.21.208:3000`), ja com o codigo novo.

**Leituras (nada foi disparado; confirmado: zero requisicoes `trigger`):**
- Playlists reais: `field_type:"playlist"` e `children:[]` (sem `type`, sem pastas hoje). O achatador aceita `type`, `field_type`, `playlists` e `children`. 14 playlists listadas no modal e no menu.
- `/v1/library/{id}` real usa `update_type` (nao `updateType`); `/v1/libraries` e plano (`uuid/name`). 4.542 musicas indexadas.
- `/v1/presentation/{uuid}` real TEM o invólucro `presentation` e traz `total_cues` DENTRO dele (o `slide_index` nao traz).
- `/v1/presentation/slide_index` sem nada no ar: `{"presentation_index": null}` (o app trata).
- `/v1/stage/screen/{id}/layout` real e PLANO (`{uuid,name,index}`, sem `id`) — o app aceita os dois formatos.
- `/v1/capture/status` real: `status`, `capture_time`, `status_text`.
- `/v1/media/playlist/active` aponta a playlist ativa (ex.: DOMINGO) que pode ser diferente da aberta na tela: a guarda nova evita destacar o item errado.
- Todos os paineis (Stage, timers, props, entradas de video, captura, mensagens, audio, macros) abrem com dados reais e sem erro.
- Stage: regra padrao confirmada (RETORNO R e L mudam em conjunto; `iPad-PCA - NDI 4` independente).

**Escrita autorizada (so a playlist de teste "Teste API Remoto"):**
- Adicionar musica pelo modal escolhendo a playlist: **OK**. "Santo Pra Sempre" entrou em "Teste API Remoto" (nao em DOMINGO); os 2 itens originais ficaram intactos e na mesma ordem; DOMINGO continuou com 3 itens.
- Lista de teste **restaurada** ao original (`PUT` 204; conferido igual byte a byte).

**AINDA NAO TESTADO no real (dono nao autorizou):** disparar slides (o "pulo"), trocar layout do Stage, iniciar/parar captura, play/pause de audio. Fazer so com os teloes livres.

---

## 9. STAGE DISPLAY — causa achada no ProPresenter real (27/09/2026)

**Sintoma (dono):** o botao "Plataforma: <layout>" (mudar varias telas de uma vez) so mudava a tela R; L nao mudava; a independencia por tela tambem parecia so funcionar na R.

**Causa provada:** o ProPresenter **ignora em silencio** uma troca de layout de stage que chega menos de ~100 ms depois de outra e ainda responde `204`. O app mandava as trocas com 70 ms de intervalo, entao so a primeira (R) pegava.
Medido direto na API real (R e L recebendo o mesmo layout em sequencia): intervalo 0 ms e 70 ms -> so R mudou; 120, 180, 240, 250, 300 e 800 ms -> R e L mudaram. Enderecar por indice, UUID ou nome atinge a tela certa.

**Correcao (em `app.js`, `stageSetLayoutSafe`):** as trocas entram numa **fila**, com **400 ms** entre elas; depois de cada troca o app **le o layout da tela de volta** e **repete (ate 3x)** se o ProPresenter ignorou; se mesmo assim nao pegar, avisa "Falhou em: <tela>". Vale para o botao Plataforma e para os botoes de cada tela. Versao dos arquivos: `?v=4.3`, cache do service worker `v3.2`.

**Ainda por confirmar com o dono (NAO deu para separar da interferencia):** durante os testes de calibracao apareceram duas vezes resultados estranhos (a troca da tela L parecendo atingir a iPad; e a R aparecendo com layout diferente do restaurado). Nao reproduziu em testes isolados com a API direta nem pelo proxy, e coincidiu com o dono operando o Stage ao mesmo tempo. Se voltar a acontecer com NINGUEM mais mexendo: capturar as requisicoes do app (rede do navegador) e o estado das 3 telas depois de cada uma.

**Estado das telas ao fim dos testes:** R=LITURGIA, L=LITURGIA, iPad=LITURGIA (os testes trocaram layouts das telas por ~1 s cada e restauraram; a R terminou diferente do que eu tinha lido no inicio, o que indica troca feita pelo dono no meio).

**Confirmado pelo dono (27/09):** ele tinha mudado o layout da R durante os testes, o que explica a R diferente e provavelmente as trocas estranhas. Ao testar de novo, ninguem deve mexer no Stage ao mesmo tempo.

### 9.1 CAUSA RAIZ REAL do Stage (substitui a suposicao acima) — 27/09/2026

Havia DOIS problemas no ProPresenter 21.4.2, ambos provados na API real sem ninguem mexendo:

1. **Troca de layout colada e ignorada** (<~100 ms depois da anterior, responde 204 mas nao aplica). Corrigido com fila + 400 ms + conferencia + nova tentativa (`stageSetLayoutSafe`).
2. **LEITURA por indice esta com as telas 1 e 2 TROCADAS.** `GET /v1/stage/screen/1/layout` devolve o layout da iPad e `/screen/2/layout` o da L (R/indice 0 certo). A ESCRITA (`.../layout/{layout}`) e correta por indice, UUID ou nome; a leitura por UUID ou nome tambem e correta. Prova: L:=NDI4 por UUID -> leitura por UUID `L=NDI4`; leitura por indice `iPad=NDI4`.
   - Efeito no app: o cartao da L mostrava o layout da iPad (e vice-versa), a conferencia "falhava" e o app dizia "Falhou em L" mesmo com a troca feita. Parecia que so a R funcionava.
   - **Correcao:** as telas passam a ser enderecadas SEMPRE por UUID (`stageScreenId` = uuid; `stageScreenIndex` so para a preferencia antiga e exibicao). Versao `?v=4.4`, cache SW `v3.3`.
   - Regra para o futuro (skill): nunca ler layout de stage por indice; usar UUID.

Teste real final (app v4.4, nada mexendo): Mudar tudo -> NDI 4: R e L mudaram, iPad intacta, aviso de sucesso e cartoes corretos; idem -> LOUVOR; trocas individuais quase juntas (iPad e L) corretas; tudo restaurado a LITURGIA/LITURGIA/LITURGIA.

---

## 10. PARA AMANHA — idioma da interface e mock (anotado 26/09/2026)

**Pergunta do dono:** o app pode pegar o idioma nativo do ProPresenter?
**Resposta (provada):** NAO. O spec oficial nao tem campo/endpoint de idioma; `GET /version` so traz `name`, `platform`, `os_version`, `host_description`, `api_version`; `/v1/preferences`, `/v1/settings`, `/v1/status`, `/v1/version` dao 404 (ProPresenter 21.4.2). O idioma tem que ser decidido pelo proprio app (navegador do aparelho, escolha do usuario e padrao do servidor).

**Issues abertas no GitHub (repo propresenter7-remote-web):**
* #1 Internacionalizacao: idioma da interface (pt-BR, ingles, espanhol) — dicionarios, `t('chave')`, `lang` do `<html>`, nao traduzir nomes vindos do ProPresenter.
* #2 Seletor de idioma no app + idioma padrao do servidor (`config.json` -> `language`, `/api/server-info`, `Instalar-Servico.ps1 -Idioma`).
* #3 Mock do ProPresenter (`tools/mock-propresenter.js`) para desenvolver/testar sem o programa aberto.

**"Da para fazer sem o ProPresenter?" — SIM.** A internacionalizacao e 100% do lado do navegador; da para desenvolver e testar com o mock (rascunho ja guardado em `propresenter-remote\tools-rascunho\mock-propresenter.rascunho.js`, que reproduz playlists em `children`, Stage com leitura por indice trocada, trocas coladas ignoradas, atraso do "pulo", captura, timers etc.) e com o app vazio. A conferencia visual no ProPresenter real e opcional.

**Ordem sugerida:** #3 (mock no repo) -> #1 (i18n pt-BR/en/es) -> #2 (seletor + padrao do servidor) -> release v1.2.0 -> atualizar a producao com `Atualizar-Controle-Remoto.bat`.

**Producao (10.0.21.145) em 26/09 ~11:45:** ja responde `/api/version` (versao cee312e1, porta 3000, ProPresenter em 127.0.0.1:50820, pagina e service worker com a versao atual). NAO conferido: tarefa agendada, firewall e "ligou o PC e subiu sozinho" (rodar `Verificar-Controle-Remoto.bat` la e, com autorizacao, reiniciar o Windows uma vez).

### 10.1 Issue #4 — Android nao instala o app (registrada 26/09/2026)

Captura do dono (Chrome Android, `http://10.0.21.208:3000`): "Instalar e criar atalho" -> **Instalar: "Nao e possivel instalar o app."** / Criar atalho. Captura salva em `propresenter-remote\tools-rascunho\captura-android-nao-instala-pwa.jpg`.

**Causa:** acesso por **HTTP** (triangulo "nao seguro"). O Chrome so oferece instalar PWA em HTTPS/localhost e o service worker nem registra em HTTP. Manifest e icones ja atendem; falta HTTPS. iOS/iPad funciona (Adicionar a Tela de Inicio).

**Opcoes (na issue #4):** A) flag `chrome://flags/#unsafely-treat-insecure-origin-as-secure` com `http://10.0.21.145:3000` por aparelho; B) "Criar atalho" (ja existe); C) HTTPS com CA local (mkcert) — instalar a CA em cada aparelho; **D) HTTPS com dominio real + Let's Encrypt DNS-01 (recomendada)** — confiavel em todos os aparelhos sem configurar nada; E) Tailscale/Cloudflare Tunnel.
**Trabalho:** HTTPS opcional no `server.js` (`config.json` -> `https`), scripts de certificado + renovacao automatica + firewall, `Instalar-Servico.ps1 -Dominio/-HttpsPorta`, `Verificar.ps1` mostra validade, icone `maskable` separado, modal explicando o motivo em HTTP, docs/skills.
**Ordem sugerida amanha:** #3 mock -> #1 i18n -> #2 seletor -> #4 HTTPS (precisa decidir dominio) -> release v1.2.0.
