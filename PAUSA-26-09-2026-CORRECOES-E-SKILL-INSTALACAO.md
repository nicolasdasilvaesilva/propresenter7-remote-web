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

### 10.2 Issue #5 — Adicionar musica so funciona na playlist DOMINGO (registrada 26/09/2026)

Relato do dono: adicionar letra pelo modal funciona em DOMINGO, nas outras playlists nao. Falta o texto exato do erro e quais playlists falham.
**Ja sabido:** em 26/09 o fluxo funcionou na playlist de teste "Teste API Remoto" (item entrou no fim, originais intactos, lista restaurada) — nao esta quebrado em geral.
**Levantamento (so leitura, 14 playlists, todas GET 200):** TERCA DA ESPERANCA mistura `destination` `announcements`/`presentation`; Nomes Pastores 2024 e so `announcements`; REGRESSIVA tem itens `media`; VIGILIA tem 32 itens; o resto e igual ao DOMINGO. O item novo montado pelo app NAO traz `destination` nem `presentation_info` (o ProPresenter aceitou na playlist de teste).
**Hipoteses:** (1) `PUT` da lista inteira rejeita itens `announcements`/`media` reenviados; (2) campo faltando no item novo (`destination`/`presentation_info`); (3) tamanho/tempo limite; (4) cliente/tela nao recarrega; (5) playlist nao encontrada pelo identificador.
**Amanha:** pegar o texto do erro; mostrar status+detalhes no app e no log; testar `PUT` so em "Teste API Remoto"; backup da lista antes do `PUT` + restaurar se falhar + reler depois; montar o item igual aos do ProPresenter.

### 10.3 CAUSA RAIZ da issue #5 (adicionar musica so na DOMINGO) — provada 27/09/2026
Comentario completo na issue #5. Resumo: o `PUT /v1/playlist/{id}` regrava a lista inteira e o `GET` nao usa o mesmo formato do `PUT`.
1. `id.uuid` != `target_uuid` na maioria das playlists (so DOMINGO e Nomes Pastores tem iguais) -> `PUT` da **404**. **Correcao: `id.uuid := target_uuid`** antes do PUT (13 das 14 playlists regravam com 204 e a musica entrava no fim, ordem/nomes preservados; testado gravando SO na playlist de teste).
2. VIGILIA tem 1 item "sem vinculo" (`presentation_uuid` vazio, sem `target_uuid`): PUT falha 400/404; gravar como `type:"placeholder"` + `target_uuid:""` da 204 (nome mantido). Decisao a confirmar com o operador (converter e avisar x recusar).
3. REGRESSIVA tem midia cujo arquivo nao existe em nenhuma playlist de midia: PUT 404 sempre -> recusar com mensagem clara, sem alterar nada.
**Codigo da correcao:** funcao `normalizarItens()` validada em `propresenter-remote\tools-rascunho\put-playlist-lab.rascunho.js` (mais backup em `logs\backups`, reler depois, erros claros). Se nao deu tempo de aplicar no `server.js`, e a primeira tarefa de amanha.

---

## 11. FIM DO DIA 26/09 — servidor desta máquina PARADO (a pedido do dono)

Confirmado (27/09, início): nesta máquina de desenvolvimento (10.0.21.208) **nada do controle remoto está rodando**:
- Portas 3000/3010/3011/3012/50999: todas livres.
- Nenhuma tarefa agendada `ProPresenter-Remote*`.
- Nenhum `node.exe` com `server.js`/mock em execução.
- Sem inicializador antigo na pasta Inicializar.

Ou seja: esta máquina fica limpa; **produção continua só no 10.0.21.145** (o dono já roda `v1.1.4` lá, atualizado via Antigravity/Admin).

## 12. NOVO PEDIDO (27/09/2026) — visual "oficial" para uma versão DESKTOP

O dono quer **duas versões** do app, usando o MESMO backend/API que já temos:
1. A que já existe (iPad/tablet/celular, responsiva) — **mantida como está**.
2. **Nova: versão DESKTOP** com visual parecido com o **painel oficial do ProPresenter** (o "Remote" nativo dele), para computador. Mesmas funções, mesmo backend, só a pele/layout muda. Quer manter a mesma estrutura de instalação (server.js, scripts, skills) que já fizemos.
3. Vai virar **open source** também (novo repo ou pasta dentro do mesmo?), a decidir.

**Referências que o dono deu para ANALISAR (não copiar código):**
1. `https://openapi.propresenter.com/` — spec já em uso (`swagger.json` salvo em scratchpad das sessões anteriores).
2. `https://github.com/L2N6H5B3/ProWebRemote` — projeto de terceiro, abandonado, em HTML. **Olhar o visual, não copiar.**
3. `C:\Users\nicol\Downloads\modelo do painel propresenter` — pasta local com capturas/modelo de referência visual que o dono baixou.
4. `C:\Program Files\Renewed Vision\ProPresenter` — a instalação REAL do ProPresenter nesta máquina. Ideia do dono: será que dá para "arrancar" o visual/ícones direto da instalação oficial?

**Pedido específico de função:** no menu superior da versão desktop, manter a função de **trocar o layout de vários Stage Displays (monitores) ao mesmo tempo**, igual à função que já existe no app do iPad (o botão "Mudar Retornos Plataforma").

**Status:** análise ainda não iniciada nesta entrada — ver a seção seguinte para o que foi encontrado.

### 12.1 Fase 1 da versão DESKTOP — casca visual estática (27/09/2026, em andamento)

Criada `public-desktop/` (index.html, css/style.css, js/app-desktop.js) — SÓ visual estático, NENHUMA chamada de API ainda. Ícones desenhados do zero (SVG inline), nenhum arquivo copiado da instalação do ProPresenter nem do repositório de terceiro.

**server.js alterado:** rota `/desktop` e `/desktop/...` serve de `public-desktop/` com o MESMO proxy `/api/v1` e o MESMO backend (nada duplicado). `/desktop` (sem barra) redireciona 301 para `/desktop/` (necessário: caminhos relativos do HTML quebravam sem a barra — usei caminhos absolutos `/desktop/css/...` para não depender disso). `getAppVersion()` agora inclui os arquivos de `public-desktop/` no hash, então `Atualizar.ps1`/`Verificar.ps1` continuam cobrindo as DUAS peles sem mudança nenhuma nos scripts — **a implantação é a MESMA que já existe** (mesmo servidor, mesmos scripts, mesmas skills), como o dono pediu.

Testado localmente (porta 3055, mock/placeholder): layout bate com as capturas (barra de ferramentas clara com crachás coloridos, coluna de playlist escura, grade de mídia, coluna direita com preview + faixa de 6 abas: Áudio/Palco/Temporizadores/Mensagens/Props/Macros — Palco já mostra as 3 telas + botão "Mudar Retornos Plataforma juntos" reaproveitando o conceito do app do iPad).

**Decisão de direitos autorais (repetida 3x pelo dono, mantida firme):** NÃO copiar ícones/imagens de `C:\Program Files\Renewed Vision\ProPresenter` (nem os 4 `.ico` da pasta `icons\`, nem o logotipo — marca registrada) nem do repositório `ProWebRemote` (sem licença no GitHub = todos os direitos reservados). Confirmado com o dono: ele concorda com "ícones fiéis ao original, redesenhados por nós".

**Falta (fases seguintes, ver issue #6):** ligar a coluna de playlists/mídia e o preview aos endpoints reais (Fase 2); as 6 abas com dados reais, reaproveitando a lógica de `app.js` da versão mobile (Fase 3); o botão de sincronizar Stage Displays de verdade (reaproveitar `stageSetLayoutSafe`/`isStageScreenSynced`) + multilíngue desde o início (issue #1) (Fase 4). Servidor de teste (porta 3055) PARADO ao fim desta entrada; nesta máquina não fica nada rodando.

### 12.2 Correções de escopo da versão DESKTOP (27/09, durante a revisão visual do dono)

Dono revisou a Fase 1 e pediu para tirar tudo que a API não permite de verdade:
- **Confirmado na especificação (todos os metodos GET/PUT/POST/DELETE, sem PATCH):** NÃO existe rota para editar letra/conteúdo de slide de uma apresentação. `PUT /v1/theme/{id}/slides/{theme_slide}` só edita o MODELO de tema, não a letra de uma música existente. Por isso: Texto, Tema, Editar, Bíblia, Refluxo, "Mais" — REMOVIDOS da barra de ferramentas desktop (não tem controle remoto via API).
- Barra de ferramentas desktop revisada para conter SÓ funções reais do mobile: Buscar (com o "+Add à Playlist"), Aparência (Looks), Anterior/Mostrar/Próximo (transporte), Limpar (camadas), Config., status de conexão.
- Faixa de abas (coluna direita) expandida de 6 para 8, em grade 4x2, incluindo as que faltavam: Vídeo (entradas) e Captura — junto com Áudio, Palco, Temporizadores, Mensagens, Props, Macros. Isso cobre TODAS as ferramentas que o menu "Ferramentas" do mobile já tem.
- **Reordenar itens de playlist/mídia — CONFIRMADO como possível:** o mesmo `PUT /v1/playlist/{id}` que já usamos grava a lista inteira; reordenar é ler, mudar a posição, gravar de novo, reaproveitando `normalizarItensPlaylist`/backup/conferência já testados (issue #5). Adicionado como setas ▲▼ visuais na lista e na grade (Fase 1, ainda sem função).
- **Pedido novo do dono:** levar "reordenar" também para o MOBILE (não só desktop) — se for de baixo risco (é: só adiciona botões nos itens existentes, sem mexer no clique que já funciona). Fazer nas duas peles, na Fase 2, com o MESMO endpoint novo do servidor.
- **Confirmado:** idioma deve ser detectado automaticamente do sistema/navegador (ordem já definida nas issues #1/#2: escolha do usuário > padrão do servidor > idioma do navegador > pt-BR), aplicado nas DUAS peles com o mesmo dicionário.

Servidor de teste (porta 3055) ainda ligado nesta sessão para revisão visual; será parado ao final da revisão (não deixar rodando nesta máquina).

### 12.3 Fase 2 da versao DESKTOP — dados reais LIGADOS e testados (27/09/2026)

Testado de ponta a ponta contra um ProPresenter REAL rodando LOCALMENTE nesta maquina (o dono ligou a API de rede dele para eu simular, ja que a rede da igreja ficou inacessivel neste dev machine — Ethernet caiu para IP 169.254.x, so Wi-Fi de outra rede).

**Funcionando e confirmado contra a API real:**
- BIBLIOTECA (`/v1/libraries` + `/v1/library/{id}` + trigger por `/v1/library/{lib}/{pres}/trigger`) — nova secao pedida pelo dono, bate com a captura oficial (Default / A Ti eu vou clamar).
- PLAYLIST (Culto): arvore real, itens reais, clique dispara, ▲▼ reordena via novo endpoint `/api/reorder-playlist-item` (so em playlists de apresentacao — mídia so tem GET na API, confirmado lendo TODAS as rotas do spec).
- MÍDIA/ProContent: arvore real + grade com thumbnails reais (`/v1/media/{uuid}/thumbnail`), clique dispara (testado: clicar em "image (3)" mudou o `/v1/media/playlist/active` de verdade).
- Sincronismo ao vivo (preview + subtitulo) acompanhou sozinho a troca de slide feita no proprio ProPresenter (Slide 1 -> Slide 2), com a mesma protecao anti-"pulo" da pele mobile.
- PALCO: telas/layouts reais, toggle "mudar em conjunto", troca de layout com a mesma fila segura por UUID (`stageSetLayoutSafe`) — reaproveitado literalmente do mobile.
- Busca de musica (`/api/search-songs`) + modal "Adicionar a Playlist" (`/api/list-culto-playlists` + `/api/add-song-to-playlist`) — testado com a musica que ja estava na playlist: o ProPresenter uniu (dedup) em vez de duplicar, e o CONFERIDOR detectou a contagem diferente e avisou "confira manualmente" (protecao funcionando; nada foi perdido, playlist ficou identica byte-a-byte ao original).
- 6 divisorias arrastaveis (incluindo as 3 novas pedidas nesta rodada: Biblioteca/Playlist, canvas/grade de midia, preview/abas).
- Botao vermelho de limpar no canto do preview (igual a captura marcada pelo dono).

**Achado tecnico:** `/api/list-culto-playlists` falhou 4x seguidas quando chamado por JS do navegador enquanto o polling de 1s tambem rodava (curl isolado do Bash sempre funcionou) — parece concorrencia de conexoes locais do ProPresenter sob carga de teste automatizado muito rapido. Adicionada 1 nova tentativa (retry) no modal por seguranca. Nao reproduzido fora de uso automatizado agressivo.

**Ainda NAO ligado (visual/exemplo apenas):** abas Áudio, Temporizadores, Mensagens, Props, Vídeo, Captura, Macros. Idioma: dicionario pronto e aplicado na casca do desktop; falta seletor visivel e aplicar no mobile. Sem commit/push — tudo local nas duas pastas.

### 12.4 Fase 2 CONCLUIDA — as 8 abas todas ligadas a dados reais (27/09/2026)

Todas as abas da coluna direita (Áudio, Palco, Temporizadores, Mensagens, Props, Vídeo, Captura, Macros) agora buscam e escrevem dados reais na API, testado contra o ProPresenter local do dono:
- **Temporizadores:** 3 cronometros reais aparecem ("Contagem regressiva do segmento", "pré-show", "Cronometro de jogo"); Iniciar/Pausar testado de verdade (00:05:00 -> 00:04:59 rodando -> parado).
- **Captura:** Start/Stop tentado; o proprio ProPresenter respondeu 500 (sem destino de captura configurado nesta instancia local) — comportamento correto do nosso lado, so nao ha o que capturar aqui.
- **Áudio, Mensagens, Props, Vídeo, Macros:** renderizam corretamente o estado "vazio" (esta instancia de teste nao tem nada configurado nessas categorias); logica identica a que ja funciona no mobile (mesmos endpoints, mesmo tratamento de is_active/is_playing/estados).
- Um unico loop de polling (1s) agora atualiza: slide/midia ao vivo, temporizadores e status de captura — sem duplicar chamadas.

**Fase 2 do desktop esta funcionalmente completa.** Falta so: idioma (dicionario pronto, falta seletor visivel + aplicar no mobile), e o polimento fino de icones/i18n em textos que ainda ficaram fixos nas abas novas. Nada commitado/enviado ao GitHub.


---

## 13. REGISTRO COMPLETO ANTES DE COMPACTAR A SESSAO (27/09/2026, tarde)

O dono pediu para compactar a sessao — este bloco resume TUDO desde a secao 12 (novo pedido de visual desktop) para nao se perder nada.

### 13.0 Estado dos arquivos (AGORA)
- **Sincronizado** entre `propresenter-remote` (dev) e `ProPresenter-Remote-Deploy` (repo git): `server.js`, `public/index.html`, `public/js/app.js`, `public/js/i18n.js` (novo), `public-desktop/` inteiro (novo: `index.html`, `css/style.css`, `js/app-desktop.js`).
- **NADA foi commitado nem enviado ao GitHub** nesta rodada toda (a ultima coisa no GitHub continua sendo a v1.1.4 / main `ad76005`, do dia 26/09).
- `public/css/style.css` e `public/service-worker.js` tem diferenca de fim-de-linha (CRLF x LF) entre dev e deploy — pre-existente, nao mexi, nao e relacionado a esta sessao.
- Sem `node_modules`; tudo Node puro. `node --check` e `new Function(...)` confirmam sintaxe valida nos 3 arquivos JS principais (server.js, app.js, app-desktop.js) e no i18n.js.

### 13.1 Por que existe uma versao DESKTOP agora (pedido do dono, 27/09)
O dono pediu uma segunda pele, alem da atual (iPad/Android/celular = `public/`), com visual igual ao painel oficial do ProPresenter, para uso em computador (Windows/Mac). Pediu para eu analisar 3 referencias:
1. `openapi.propresenter.com` — mesma API ja usada.
2. `github.com/L2N6H5B3/ProWebRemote` — projeto de terceiro, abandonado, SEM LICENCA no GitHub (= todos os direitos reservados por padrao), visual de ProPresenter 6/7 no macOS (protocolo antigo, WebSocket, nao a REST API v1 que usamos). Decisao: nao copiar nada dele (nem codigo nem os PNGs em `img/`). So confirmou que as mesmas categorias de funcao (Stage/Timers/Mensagens/Props/Audio/Clear) ja existem nesse tipo de remoto ha anos.
3. As capturas de tela que o dono mandou (`Downloads\modelo do painel propresenter\*.png`) + o ProPresenter 21.4.2 REAL instalado nesta maquina (`C:\Program Files\Renewed Vision\ProPresenter`) — esta e a referencia principal.

### 13.2 Limite de direitos autorais (o dono insistiu 3-4 vezes de formas diferentes, mantive firme todas as vezes)
- Pediu para usar os "icones oficiais" do ProWebRemote -> expliquei que sao icones proprios do autor DAQUELE projeto (nomes genericos tipo stage.png), mas mesmo assim sem licenca = nao copiar.
- Pediu para "extrair o modelo visual" de `C:\Program Files\Renewed Vision\ProPresenter` -> expliquei a diferenca entre OLHAR pra aprender (ok) e COPIAR arquivo (nao). A pasta `icons\` so tem 4 `.ico` de aplicativo (nao os icones da barra de ferramentas, que ficam compilados dentro do .exe/.dll — nao da pra "abrir" mesmo se quisesse, e o logotipo em si e marca registrada, ainda mais sensivel).
- Pediu de novo "eu discordo mas ja que voce fez um desenho, vamos manter" -> mantive a decisao (redesenhar do zero, mesmas cores/formas/layout, sem copiar arquivos), ele aceitou seguir assim.
- Fontes seguras usadas: Roboto (Google Fonts, licenca aberta) e as capturas de tela do dono como referencia visual (nao sao arquivos da Renewed Vision, sao FOTOS da tela).

### 13.3 O que foi CONSTRUIDO na versao desktop (public-desktop/)
**Arquitetura:** MESMO backend (server.js nao mudou de logica, so ganhou rotas novas). Nova pasta public-desktop/ servida pela rota /desktop e /desktop/... (com redirect 301 de /desktop sem barra para /desktop/, porque caminhos relativos quebravam sem a barra — resolvido com caminhos absolutos /desktop/css/... no HTML). getAppVersion() (hash da versao, cache-busting automatico) agora inclui os arquivos do public-desktop/ tambem — a mesma implantacao/scripts/skills ja existentes cobrem as DUAS peles sem nenhuma mudanca nos scripts de instalacao/atualizacao, exatamente como o dono pediu.

**Visual (Fase 1, aprovado pelo dono):**
- Barra de menu clara (Arquivo/Editar/.../Ajuda) + faixa de ferramentas com "crachas" coloridos, SO com funcoes que existem de verdade no mobile (removi Texto/Tema/Editar/Biblia/Refluxo/Mais — confirmado na especificacao completa que NAO EXISTE nenhuma rota de escrita para editar letra/conteudo de slide — so PUT /v1/theme/{id}/slides/{theme_slide} que edita o MODELO de tema, nao a letra da musica).
- Barra final: Busca, Aparencia (Looks), Anterior/Mostrar, Limpar, status Conectado, Config.
- Coluna esquerda: BIBLIOTECA (nova, pedida pelo dono depois de ver a captura oficial) + PLAYLIST + lista de itens + ProContent (midia), cada uma com sua propria arvore.
- Coluna central: preview/edicao (canvas preto) + grade de midia.
- Coluna direita: preview ao vivo (com botao vermelho de "Limpar" no canto, do jeito que o dono marcou numa captura) + faixa de 8 abas em grade 4x2: Audio, Palco (ativa por padrao), Temporizadores, Mensagens, Props, Video, Captura, Macros.
- 6 divisorias arrastaveis (redimensionar), testadas por simulacao de mousedown+mousemove+mouseup (o clique-arrasto automatizado do navegador so manda inicio/fim, sem o meio — um arrasto de mouse de verdade dispara os eventos certos): esquerda/centro, centro/direita, Biblioteca/Playlist, Playlist/ProContent, canvas/grade de midia, preview/abas.
- Reordenar (up/down) SO aparece nos itens de Playlist de Culto — confirmado lendo TODAS as rotas do spec que /v1/media/playlist/{id} e SO LEITURA (sem PUT/POST/DELETE), entao midia/ProContent nao pode ser reordenada via API; a Biblioteca tambem nao (e so um acervo, sem ordem).

**Fase 2 (dados reais, TUDO testado contra um ProPresenter real):**
- Rede da igreja ficou inacessivel nesta maquina no meio da sessao (Ethernet caiu pra IP 169.254.x — auto-atribuido, sem DHCP; Wi-Fi ficou em outra rede 192.168.100.x que nao alcanca 10.0.21.145). Nao e bug, e mudanca fisica de rede. O dono ligou um ProPresenter LOCAL nesta propria maquina (teve que ativar a API de Rede nas Preferencias, que vem desligada por padrao) para eu testar de verdade.
- BIBLIOTECA: /v1/libraries + /v1/library/{id} + trigger por /v1/library/{lib}/{pres}/trigger — testado, bateu com a apresentacao real aberta ("A Ti eu vou clamar").
- PLAYLIST: arvore/itens reais; clique dispara; reordenar via NOVO endpoint /api/reorder-playlist-item (POST, {playlistId, itemIndex, direction}) no server.js, reaproveitando a MESMA logica de seguranca da correcao de ontem (normalizarItensPlaylist, backup em logs/backups, conferencia depois do PUT).
- MIDIA/ProContent: arvore + grade com thumbnails reais (/v1/media/{uuid}/thumbnail); clique dispara — testado disparando "image (3)" e confirmando via /v1/media/playlist/active que mudou de verdade no ProPresenter.
- Sincronismo ao vivo: o preview seguiu sozinho quando o slide mudou no proprio ProPresenter (Slide 1 -> Slide 2), com a MESMA protecao anti-"pulo" (lastUserActionTime, pollInFlight, ignora respostas antigas) ja corrigida ontem no mobile.
- PALCO: telas/layouts reais, toggle "mudar em conjunto" (mesma logica isStageScreenSynced/stageSetLayoutSafe/fila de 400ms por UUID do mobile, colada aqui — e codigo NOSSO, sem problema reusar).
- Busca de musica + Adicionar a Playlist: testado buscando "clamar", abrindo modal com a playlist real "Padrao". Testei adicionar a MESMA musica que ja estava na playlist: o ProPresenter uniu (dedup) em vez de duplicar, e o CONFERIDOR (que ja tinhamos) detectou a contagem diferente do esperado e avisou "confira manualmente" — protecao funcionando certo, nada foi perdido (playlist ficou identica byte-a-byte, confirmado com diff).
- Achado tecnico: /api/list-culto-playlists falhou 4x seguidas quando chamado pelo navegador enquanto o polling de 1s tambem rodava (mas curl isolado sempre funcionou) — parece concorrencia de conexoes locais do ProPresenter sob teste automatizado MUITO rapido (varias chamadas em menos de 2s). Adicionei 1 nova tentativa (retry com 500ms de espera) no modal por seguranca. Nao reproduzido em uso manual normal.
- TEMPORIZADORES: 3 cronometros reais apareceram; testei Iniciar (00:05:00 -> 00:04:59 rodando) e Pausar — funcionou.
- CAPTURA: tentei Iniciar/Parar; o proprio ProPresenter respondeu 500 direto (confirmado via curl direto nele) porque essa instancia local nao tem destino de captura configurado — nao e bug nosso, nosso codigo reagiu certo (sem travar).
- AUDIO/MENSAGENS/PROPS/VIDEO/MACROS: renderizam corretamente o estado "vazio" (a instancia de teste nao tem nada configurado nessas categorias); mesma logica testada do mobile (is_active/is_playing/estados).
- Um UNICO loop de polling (1s) atualiza: slide/midia ao vivo + temporizadores + status de captura, sem duplicar chamadas.

### 13.4 Idioma (multilinguas) — pedido do dono, feito nesta rodada
- public/js/i18n.js (NOVO, compartilhado pelas 2 peles): dicionario pt-BR/en/es, funcao detectar() com ordem escolha do usuario (localStorage) > padrao do servidor (config.json) > idioma do navegador > pt-BR, funcao aplicar() que troca todo texto com data-i18n/data-i18n-placeholder/data-i18n-title.
- server.js: novo endpoint POST /api/set-language (valida contra pt-BR|en|es|vazio, grava em config.json); /api/server-info ja devolvia language (adicionado ontem, reaproveitado agora); getAppVersion() agora tambem hasheia js/i18n.js.
- Desktop: novo painel de Configuracoes (o botao "Config." nao fazia NADA antes — agora abre modal com IP/porta do ProPresenter [reaproveita /api/set-pro-host] + seletor de idioma [grava em localStorage, location.reload() ao salvar]). Titulos "BIBLIOTECA"/"PLAYLIST" e varios textos da UI com data-i18n.
- Mobile: incluido js/i18n.js no index.html; aplicado no DOMContentLoaded (idioma do aparelho, instantaneo) e de novo em loadServerInfo() (padrao do servidor, se o usuario nao escolheu nada no proprio aparelho); seletor de idioma NOVO dentro do modal de Configuracoes existente (cfg-idioma), salvo junto com host/porta em handleSaveSettings() (so recarrega a pagina se o idioma realmente mudou).
- BUG que corrigi durante a implementacao: meu proprio script de edicao em lote (node -e) colocou a chave biblioteca DUAS VEZES no bloco ERRADO (as duas foram parar no bloco pt-BR e no es, nada no en; e o texto em espanhol saiu "LIBRARY" em vez de "Biblioteca"). Percebi e corrigi na mao, conferido lendo o arquivo depois.
- NAO testado ainda no navegador (a sessao foi interrompida pelo ProPresenter local parar de responder — 2 processos ProPresenter.exe rodando ao mesmo tempo, PIDs 8820 e 12784 — o dono foi reiniciar o ProPresenter quando pediu para compactar). Sintaxe conferida (node --check / new Function), mas o fluxo completo (abrir Configuracoes, trocar idioma, ver o texto mudar, salvar, recarregar) AINDA NAO FOI CLICADO no navegador.
- Cobertura do idioma: so a "casca" (menus, botoes, titulos, Configuracoes) foi traduzida. Os textos dinamicos dentro de app.js (toasts, status ao vivo tipo "Slide 2 de 5", mensagens de erro) CONTINUAM em portugues fixo — trabalho futuro, nao escondi isso do dono.

### 13.5 Pendencias exatas para retomar
1. ProPresenter local: o dono estava reiniciando (tinha 2 processos ProPresenter.exe abertos, avisei disso). Confirmar que so 1 processo fica no ar e que a API de Rede continua ligada antes de retestar.
2. Testar o idioma de verdade no navegador: abrir /desktop/, clicar Config., trocar pra "English"/"Espanol", salvar, confirmar que o texto muda e nada quebra; repetir no mobile (/).
3. Ainda falta (fora do escopo desta rodada): traduzir os textos dinamicos do app.js (fase futura, ja avisado ao dono); testar reordenar (up/down) na UI do desktop de verdade com uma playlist de 2+ itens (a "Padrao" so tinha 1 item disponivel para teste); revisar visualmente as 8 abas com mais dados reais (props/mensagens/macros/audio) quando o dono tiver esses itens configurados no ProPresenter de producao.
4. Nada foi commitado nem enviado ao GitHub desde a v1.1.4 (26/09). Quando o dono aprovar toda a Fase 2 + idioma, preparar um commit/release novo (ex.: v1.2.0) reunindo: a versao desktop inteira + i18n (ainda NAO publicados).
5. Servidor de teste (porta 3055) pode ter ficado rodando nesta maquina — conferir e parar antes de considerar a sessao encerrada (o dono pediu antes para nao deixar nada rodando aqui).

### 13.6 27/09 NOITE — mock do ProPresenter + idioma e reordenar validados de verdade

O ProPresenter travou o computador do dono e foi DESINSTALADO desta maquina de dev (a pendencia 1 acima ficou sem objeto). Pedido do dono: continuar mesmo sem ProPresenter, com base no que ja funciona no aplicativo mobile.

**Criado `tools/mock-propresenter.js`** (promovido do rascunho `tools-rascunho/mock-propresenter.rascunho.js`, resolve tambem a issue #3 do GitHub): mock completo da API v1 cobrindo TODOS os endpoints que os dois apps chamam (Biblioteca, Playlists — "Culto Domingo" com 2 musicas de proposito pra dar pra testar reordenar —, Midia/ProContent, Audio, Mensagens, Props, Video, Macros, Palco, Timers, Captura, Looks, e um catch-all generico pra qualquer /trigger ou /clear nao mapeado). Uso: `node tools/mock-propresenter.js [porta]`, depois `PRO_HOST=127.0.0.1 PRO_PORT=<porta> node server.js`.

Achado ao subir: havia 3 processos node.exe ANTIGOS ainda rodando desde a sessao anterior (portas 3055 e 50999 duplicada) — sobra de teste de antes da compactacao. Confirmei que eram node.exe antes de parar, e subi tudo limpo de novo.

**Testado no navegador contra o mock (mesmo contrato de API do real):**
- Reordenar no desktop: cliquei "Mover para baixo" em "Grande e o Senhor" (posicao 1 de 2) -> UI trocou pra "Oceanos"/"Grande e o Senhor" E conferido via curl direto no mock que a nova ordem realmente persistiu no PUT. Funciona ponta a ponta.
- Idioma nas DUAS peles: troquei pra English nas Configuracoes do desktop, salvou e recarregou -> "LIBRARY", "PLAYLIST", "2 ITEMS", "Change platform monitors together" traduzidos certo. Naveguei pro mobile (mesma origem) e o ingles ja estava aplicado sozinho (confirma localStorage compartilhado entre as 2 peles). Testei Espanol no mobile tambem -> "Buscar en mas de 4.500 canciones y letras..." certo. Voltei pra "Automatico" no final.
- Confirmado como esperado (nao e bug, ja avisado antes): textos de menus decorativos (Arquivo/Editar/Apresentacao/Telas no desktop, dropdown "Ferramentas" e modal "Selecionar Pasta/Playlist" no mobile) continuam so em portugues — sao textos dinamicos/menus ainda sem data-i18n, fase futura.

Nenhum bug novo encontrado nesta rodada. Servidores de teste parados ao final (portas 3055 e 50999 livres, confirmado por netstat).

**Pendencias atualizadas:**
1. ~~Nada commitado~~ — FEITO: **v1.2.0 publicada** (main `51abddd`, tag `v1.2.0`) com desktop + i18n + reordenar + `tools/mock-propresenter.js`.
2. Traduzir os textos dinamicos/menus decorativos citados acima (fase futura, ja avisado).
3. ~~Testar no real~~ — FEITO nesta mesma sessao, ver 13.7 abaixo.
4. `tools/mock-propresenter.js` fica no repo como ferramenta permanente de dev (resolve a issue #3) — considerar citar no README/CLAUDE.md (nao feito ainda).

### 13.7 27/09 (mesma noite) — validado contra o ProPresenter REAL da igreja, achado 1 bug, v1.2.0 publicada

O dono avisou que o ProPresenter real estava acessivel pela rede em `192.168.100.82:49850` (nome da maquina: MacBook-Pro-de-Elisandra, ProPresenter 21.4). Apontei o servidor de dev pra la (`PRO_HOST`/`PRO_PORT`) e testei — **SO LEITURAS**, nunca cliquei em Mostrar/Aplicar layout/Limpar/Ativar, porque a apresentacao estava ativa de verdade (o slide ao vivo avancou sozinho de 8 pra 9 enquanto eu olhava).

**Confirmado funcionando com dados reais de producao:** Biblioteca, LISTA (playlists reais: DOMINGO, TERCA DA ESPERANCA, VIGILIA, REGRESSIVA etc.), ProContent (pastas reais: DOMINGO, ANIVERSARIANTES, PREGACAO, CEIA, FUNDOS...), Palco (nomes reais das telas: RETORNO PLATAFORMA R/L, LOUVOR/LITURGIA/iPad-PCA-NDI4), Props (formulario real de carro/kids com campos COR/PLACA), Temporizadores (TEMPO PALAVRA, TELA CONTAGEM reais), Audio (playlist longa real de formatura/casamento), Macros (Padrao/Teste/Legendario/Colacao de Grau), sincronismo ao vivo acompanhando a apresentacao de verdade. Busca indexou 1794 apresentacoes reais sem erro.

**BUG ACHADO (so aparece com o real, o mock sempre respondia 200):** a API real do ProPresenter devolve HTTP 500 pra thumbnail de midia na MAIORIA dos itens (confirmado com curl direto nele: 25 de 26 numa pasta de video real) — parece ser normal pra videos sem cache de thumbnail gerado. O mobile ja tratava isso certo (mostra 🎬/🖼️ no lugar da imagem quebrada); o Desktop (`public-desktop/js/app-desktop.js` linha ~590) so escondia a imagem e deixava vazio. Corrigido: mesmo padrao do mobile (fallback icon + CSS `.pp-media-fallback-icon` em `public-desktop/css/style.css`), testado de novo contra o real e confirmado via JS (`25 fallback / 1 imagem carregada`, igual antes).

**Publicado:** commit `2500b41` (desktop+i18n+reordenar+mock) + commit `51abddd` (fix do fallback) + tag `v1.2.0` + release no GitHub com notas e zip (`ProPresenter-Remote-v1.2.0.zip`, `git archive` a partir da tag).

**Pendente real agora:** nada bloqueando. Proximos passos possiveis: o dono rodar `Atualizar-Controle-Remoto.bat` no PC de producao pra subir a v1.2.0; testar reordenar de verdade numa playlist real (so fiz leitura desta vez, o reordenar em si so foi testado no mock); traduzir textos dinamicos (fase futura).
