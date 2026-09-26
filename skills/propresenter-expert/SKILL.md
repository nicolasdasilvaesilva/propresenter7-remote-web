---
name: propresenter-expert
description: Especialista em automação, integração e controle remoto do ProPresenter 7 via OpenAPI v1 REST API. Guia completo de endpoints (Looks, Mídia/ProContent, Playlists de Culto, Slides, Miniaturas, Triggers, Clear), arquitetura web remota responsiva para iPad/celular, PWA e as armadilhas já comprovadas no ProPresenter real. Funciona no Claude Code e no Google Antigravity. Instalação/atualização/início automático ficam na skill `propresenter-remote-install`.
---

# ProPresenter 7 Expert Skill

> **Compatível com Claude Code e Antigravity** (instale com `Instalar-Skill.bat`).

Esta skill fornece conhecimento avançado sobre a integração, automação, desenvolvimento e implantação de controladores remotos para o **ProPresenter 7** através da **OpenAPI v1 REST API** oficial.

---

## 1. Conexão e Portas Padrão

* **API REST Oficial (OpenAPI v1):** Porta padrão `50820` (ou configurável no ProPresenter em *Preferências -> Rede*).
* **Documentação Swagger Local:** `http://<IP_DO_PROPRESENTER>:50820/v1/doc/index.html#/`
* **Especificação Swagger JSON:** `http://<IP_DO_PROPRESENTER>:50820/v1/doc/swagger.json` (atribuído como `var openapi_spec = {...}`).
* **Protocolo de Rede:** HTTP simples local (não requer SSL/HTTPS internamente).
* **Servidor intermediário (Node.js):** o app web é servido pelo **próprio** servidor Node (mesma origem) e ele repassa `/api/v1/...` ao ProPresenter (proxy reverso). Assim o navegador nunca fala direto com a porta 50820. **Não use CORS aberto (`Access-Control-Allow-Origin: *`)**: o servidor atual não envia esses cabeçalhos, bloqueia escritas de outra origem (403) e só aceita IP da rede local em `set-pro-host`.

---

## 2. Mapeamento de Endpoints Essenciais

### A. Looks (Aparência das Telas)
* `GET /v1/looks`: Lista todos os Looks configurados (ex.: `LOUVOR`, `VHT/VÍDEOS`, `AVANTE`, `Bíblia`).
* `GET /v1/look/current`: Retorna o Look atualmente ativo e suas configurações por tela.
* `GET /v1/look/{id}/trigger`: Dispara o Look para torná-lo ativo imediatamente (onde `{id}` pode ser o UUID, o nome ou o índice do Look).

### B. Mídia / ProContent (Área Inferior do ProPresenter)
* `GET /v1/media/playlists`: Retorna a lista de todas as pastas/playlists de Mídia (ex.: `PREGAÇÃO`, `DOMINGO`, `FUNDOS`, etc.).
* `GET /v1/media/playlist/{playlist_id}`: Retorna todos os itens da playlist de mídia especificada com `id`, `name`, `type` (`video`, `image`, etc.) e `duration`.
* `GET /v1/media/playlist/{playlist_id}/{media_id}/trigger`: Dispara o item de mídia especificado na tela.
* `GET /v1/media/{uuid}/thumbnail`: Retorna a imagem em JPEG da miniatura da mídia.
* `GET /v1/trigger/media/next` e `GET /v1/trigger/media/previous`: Avança ou retrocede mídias.
* **Apresentação de Mídia:** Na interface do controle remoto, a pasta de mídia deve exibir a grade completa com todos os itens da pasta. As imagens de arte gráfica (títulos de sermão, versículos) devem aparecer **sem texto sobreposto**, mantendo a arte limpa e 100% legível.

### C. Playlists de Culto / Apresentações (Área Superior)
* `GET /v1/playlists`: Retorna a lista de playlists de apresentações de culto.
* `GET /v1/playlist/{playlist_id}`: Retorna as apresentações dentro da playlist com detalhes e UUID da apresentação (`presentation_info.presentation_uuid`).
* `GET /v1/playlist/{playlist_id}/{index}/trigger`: Dispara a apresentação no índice `{index}`.
* `GET /v1/playlist/{playlist_id}/{index}/{cue_index}/trigger`: Dispara um slide específico (`cue_index`) dentro da apresentação.

### D. Slides & Miniaturas de Alta Resolução
* `GET /v1/presentation/{uuid}`: Retorna a árvore completa da apresentação, incluindo grupos (Verso, Refrão, etc.) e todos os slides com texto, notas e dimensões.
* `GET /v1/presentation/{uuid}/thumbnail/{index}`: Retorna a imagem renderizada real em JPEG do slide no índice `{index}`.
* `GET /v1/presentation/{uuid}/{index}/trigger`: Dispara diretamente o slide `{index}` da apresentação.

### E. Status em Tempo Real & Navegação
* `GET /v1/presentation/slide_index`: Retorna o slide no ar: `{ presentation_index: { index, presentation_id } }` — **não traz o total de slides** (o total vem em `GET /v1/presentation/{uuid}` → `presentation.total_cues`, ou da contagem da grade carregada). Sem nada no ar devolve `{ "presentation_index": null }`.
* `GET /v1/status/slide`: Retorna o texto do slide atual e do próximo slide.
* `GET /v1/trigger/next`: Avança para o próximo slide da apresentação ativa.
* `GET /v1/trigger/previous`: Volta para o slide anterior da apresentação ativa.

### F. Clear & Blackout
* `GET /v1/clear/groups`: Lista os Clear Groups configurados (ex.: "Limpar tudo").
* `GET /v1/clear/group/{id}/trigger`: Executa o grupo de limpeza.
* `GET /v1/clear/layer/slide`: Limpa apenas a camada de slides/letras.
* `GET /v1/clear/layer/media`: Limpa a camada de vídeo/imagem de fundo.
* `GET /v1/clear/layer/video_input`: Limpa entradas ao vivo de captura.

---

## 3. Arquitetura do Controle Remoto Web & PWA

1. **Backend (Node.js Nativo):**
   * Servidor HTTP ultra-leve (`http`, `fs`, `path`, `os`), sem dependências externas (`npm install`).
   * Proxy reverso transparente embutido para `/api/v1/...`.
   * Detecção automática dos IPs locais da máquina.

2. **Frontend Responsivo (Mobile + iPad/Tablet):**
   * **Modo Celular (< 768px):** Coluna única vertical com *Preview* grande de 16:9, controles de transporte (`<<` e `>>`) e lista vertical.
   * **Modo Tablet / iPad (>= 768px):** Split View em 2 colunas:
     * Coluna Esquerda: Preview ao vivo e lista vertical da pasta.
     * Coluna Direita: Grade completa de todos os slides ou mídias individuais da pasta com miniaturas reais e badge `AO VIVO`.
   * **PWA (Progressive Web App):**
     * Manifest (`manifest.json`) com `display: standalone`.
     * Ícones oficiais do ProPresenter em alta resolução (192x192, 512x512, apple-touch-icon).
     * Service Worker para cache e estabilidade em Wi-Fi.

---

## 4. Inicialização Automática com o Windows

**Isto agora é responsabilidade da skill `propresenter-remote-install`.** Resumo do que ela faz (não refaça à mão):
* Tarefa agendada `ProPresenter-Remote` (não a pasta *Inicializar*, que só roda depois do login e não reinicia se cair).
* Como **Administrador**: roda como `SYSTEM` **ao ligar o Windows** (sem login), para todos os usuários, sem janela, reiniciando se falhar; libera a porta no firewall.
* IP/porta do ProPresenter ficam em `config.json` (fora do Git). O app **não** volta ao IP padrão depois de reiniciar.
* Nunca use `taskkill /f /im node.exe` (mata todos os Node); use `scripts\Parar-Servidor.ps1`.

---

## 5. Atualização (sem cache antigo)

**Use a skill `propresenter-remote-install`** (`scripts\Atualizar.ps1`, ou `Atualizar-Controle-Remoto.bat`). Ela faz backup, para só o nosso servidor, atualiza pelo GitHub (`--ff-only`), reaplica o início automático, reinicia, **confere** e volta atrás sozinha se falhar.

Como o cache é tratado (não faça nada à mão):
* O servidor calcula a **versão dos arquivos (hash)** e a coloca no `?v=` do `index.html` e no nome do cache do `service-worker.js` **a cada requisição**. Não existe mais "incrementar `CACHE_NAME`" nem "`?v=4.x`" no código: qualquer mudança nos arquivos muda a versão sozinha.
* Versão nova ⇒ o navegador baixa `app.js`/`style.css` de novo e o service worker apaga os caches antigos no `activate`.
* A verificação (`Verificar.ps1`) **falha** se a página servida não trouxer a versão atual.
* Em HTTP puro (rede local, `http://IP:3000`) o service worker **nem registra** (só existe em HTTPS/localhost); no iPad/celular vale o `?v=` novo. Se um aparelho insistir na versão antiga: fechar e abrir o app, recarregar 2 vezes; último recurso: remover o ícone da Tela de Início, limpar os dados do site e adicionar de novo.

---

## 6. Configurar uma máquina nova

Use a skill `propresenter-remote-install` (seção "Instalação nova"): clonar em `C:\ProPresenter-Remote` e rodar `scripts\Instalar-Servico.ps1` **como Administrador**. A produção é o computador do ProPresenter (`10.0.21.145`); o outro computador é só desenvolvimento.

---

## 7. Arquitetura para iPad / iOS Safari (Portals e Prevenção de Recorte)

No iPadOS / iOS com Safari, existem peculiaridades específicas do motor WebKit que devem ser rigorosamente seguidas na interface web:

1. **Prevenção de Recorte por Overflow no Header (Portals):**
   * O menu superior (`.app-header`) utiliza `overflow-x: auto; -webkit-overflow-scrolling: touch;`.
   * No WebKit, qualquer container com overflow cria um novo contexto de recorte e stacking.
   * **Regra Obrigatória:** Menus suspensos (`#look-dropdown-menu`, `#clear-dropdown-menu`) e caixas de busca (`#desktop-search-results`) **DEVEM ser teleportados para o `document.body`** via JavaScript (`document.body.appendChild(...)`) e renderizados com `position: fixed; z-index: 99999;`. Dessa forma, eles nunca ficam "por baixo" ou cortados fora do cabeçalho de 56px no iPad.
2. **Instalação PWA no iPad / iPhone:**
   * O Safari no iOS/iPadOS **NÃO suporta** o evento `beforeinstallprompt`.
   * O botão "Instalar App" deve permanecer visível em dispositivos Apple até que o aplicativo esteja rodando em modo standalone.
   * Ao clicar no botão em um iPad/iPhone, exibir um modal instrutivo guiando o usuário a tocar no ícone de **Compartilhar** do Safari e escolher **"Adicionar à Tela de Início"**.
3. **Barra de Espaço em Campos de Texto:**
   * O listener global de teclado (`keydown`) para avançar slides com Barra de Espaço ou Setas deve verificar `document.activeElement`. Se for `INPUT` ou `TEXTAREA`, o evento não pode ser interceptado para permitir digitação natural.

---

## 8. Módulos Avançados de Operação do ProPresenter

1. **Módulo de Mensagens no Telão (Design 100% Nativo ProPresenter 7):**
   * **Interface e Layout:** Replicar exatamente o painel oficial do ProPresenter (`/v1/control`):
     - Cabeçalho Dropdown: `[ ➤ NOME_DO_MODELO ↕ ]` abrindo menu suspenso com seleção `✓`.
     - Card escuro com visualização do template e suas tags `{TOKEN}` destacadas.
     - Linhas de Tokens no padrão nativo: Nome do token em cima e na linha abaixo `Value: [ input ]`.
     - Rodapé com status em tempo real e botões `Clear` e `Show`.
     - Suporte a tecla `Enter` para disparo imediato.
   * **Ciclo de API Recomendado:**
     - `PUT /v1/message/{id}`: Atualiza os tokens no ProPresenter garantindo persistência do modelo.
     - `POST /v1/message/{id}/trigger`: Dispara os tokens para exibição imediata com payload: `[{ "name": "...", "text": { "text": "..." } }]`.
     - `GET /v1/message/{id}/clear` e `GET /v1/clear/layer/messages`: Ocultam a mensagem do telão.
   * **Importante sobre Telas e Looks na Igreja:**
     - Ao inspecionar os Looks da igreja (`/v1/looks`), a camada de mensagens pode estar desativada em saídas de transmissão (`Screen 0: APHA-ATEM`).
     - A exibição ocorre nos telões de audiência configurados (ex.: `RESOLUME NDI 1` e `RESOLUME NDI 2`).
2. **PWA Universal (iOS, Android e Desktop):**
   * Em dispositivos móveis por HTTP local, o navegador não dispara o evento automático `beforeinstallprompt`.
   * A aplicação deve exibir um **Modal Universal de Instalação PWA** com abas dedicadas e detecção automática de sistema operacional:
     - **iOS / iPad (Safari):** Passo a passo visual ensinando a tocar no botão de Compartilhar (`⎋`), rolar e tocar em "Adicionar à Tela de Início" (`➕`).
     - **Android (Chrome/Edge):** Passo a passo ensinando a tocar no menu de 3 pontinhos (`⋮`) e selecionar "Instalar aplicativo" ou "Adicionar à tela inicial".
     - **Desktop:** Botão direto acionando `deferredPrompt.prompt()`.
3. **Sincronismo Bidirecional de Mídia e Culto:**
   * O polling periódico de 1 segundo deve verificar simultaneamente `/v1/media/playlist/active` (para quando o operador passar mídias no computador ProPresenter) e `/v1/presentation/slide_index` (para cultos/músicas).
   * Dessa forma, quando qualquer slide for disparado diretamente no PC do ProPresenter, o tablet acompanha em tempo real, atualizando o preview e destacando o item ativo com a tag `AO VIVO`.
   * **Coluna Direita (Grid de Thumbnails):** A função `highlightActiveMediaCard()` sincroniza o grid de mídia da coluna direita, com badge pulsante "AO VIVO" e rolagem automática suave até o item ativo.
4. **Seletor de Playlist ao Adicionar Música da Biblioteca:**
   * Ao clicar "Add à Playlist" nos resultados de busca, um modal overlay lista todas as playlists de culto disponíveis (incluindo dentro de pastas/grupos) via endpoint `GET /api/list-culto-playlists`.
   * O backend e o cliente achatam a árvore de playlists (`flattenPlaylistTree()`), aceitando `type` **ou** `field_type` e os filhos em `playlists` **ou** `children`, e **nunca** listam a pasta como se fosse playlist. A adição só grava na playlist **escolhida** (se não achar, devolve 404 e nada é alterado — nunca "adivinha" outra).
   * A adição usa `POST /api/add-song-to-playlist` com `playlistId` e `playlistName` específicos.
   * A música é adicionada silenciosamente sem disparar ao vivo nem alterar o preview.
5. **Exibição de Letras Limpas (Sem Imagem Borrada):**
   * Para slides de músicas que contêm texto, renderizar diretamente o texto em HTML (`.slide-lyrics-display`) com tipografia nítida, grande e centralizada em fundo preto puro, omitindo o thumbnail rasterizado em baixa resolução gerado pelo ProPresenter.

---

## 9. Status do Projeto (Atualizado)

* **Funcionalidades Completas:**
  - ✅ Módulo de Mensagens oficial com pop-up nativo e disparo direto via API.
  - ✅ PWA Universal com modal de instruções para iPad/iPhone, Android e Desktop.
  - ✅ Correção de atalho da barra de espaço na busca e z-index dos menus no iPad.
  - ✅ Seletor de Playlist: modal para escolher em qual playlist adicionar uma música da busca global.
  - ✅ Sincronismo Multi-Dispositivo de Mídia no grid de thumbnails (coluna direita) com badge "AO VIVO".
  - ✅ Módulo de Áudio (Play, Pause, Next, Previous).
  - ✅ Looks, Clear Layers, Blackout.
  - ✅ Pesquisa global instantânea com 4.500+ apresentações indexadas.
  - ✅ Deploy no GitHub: `https://github.com/nicolasdasilvaesilva/propresenter7-remote-web.git`.
  - ✅ ZIP de deploy em `C:\Users\nicol\Desktop\ProPresenter-Remote-Deploy.zip`.
  - ✅ Stage Display, pulo ao trocar slide, playlists em pastas, captura, áudio, segurança e toque corrigidos (v1.1.0).
  - ✅ Início automático com o Windows (tarefa agendada, SYSTEM ao ligar), atualização com backup/verificação/volta atrás e versão automática dos arquivos (v1.1.0).

---

## 10. Armadilhas CONFIRMADAS no ProPresenter real (21.4.2) — leia antes de mexer

O spec oficial (`swagger.json`) e o programa real divergem em vários pontos. Tudo abaixo foi medido no ProPresenter de produção.

1. **Leitura de layout do Stage por ÍNDICE troca as telas 1 e 2.** `GET /v1/stage/screen/1/layout` devolve o layout da tela de índice 2 e vice-versa (a tela 0 é certa). A **escrita** (`.../layout/{layout}`) e a leitura por **UUID ou nome** estão corretas. **Regra: enderece as telas sempre pelo UUID** (`stageScreenId()`), nunca pelo índice.
2. **Trocas de layout coladas são ignoradas em silêncio.** Duas trocas de layout com menos de ~100 ms de intervalo: a segunda responde `204` mas **não é aplicada**. Regra: fila com **≥400 ms** entre trocas, **ler de volta** o layout da tela e **repetir** (até 3x); avisar qual tela falhou. (`stageSetLayoutSafe()`.)
3. **Playlists:** `GET /v1/playlists` traz `field_type:"playlist"` (sem `type`) e filhos em `children`; o spec diz `type` e `playlists`. Áudio e mídia usam `type` e `children`. Trate os dois.
4. **Bibliotecas:** `/v1/libraries` é plano (`{uuid,name,index}`); `/v1/library/{id}` traz `update_type` e `items`.
5. **Apresentação:** `GET /v1/presentation/{uuid}` vem embrulhado em `{ presentation: {...} }` e traz `total_cues` ali dentro.
6. **Nada no ar:** muitos GET devolvem `404` ou `null` (ex.: `slide_index → {"presentation_index": null}`). Isso é **normal**: só `502/503` ou falha de rede é "offline".
7. **Captura:** `GET /v1/capture/start` e `/stop` (não POST); status com `capture_time` e estados `active|inactive|caution|error`.
8. **Áudio:** respeite `is_playing` em `/v1/transport/audio/current` (pausado ainda traz `name`).
9. **Polling ao vivo (1 s) vs toque do usuário:** logo após o toque o ProPresenter ainda devolve o slide/música ANTIGOS. Ignore o polling por ~2,5 s após o toque, descarte respostas iniciadas antes do toque e nunca rode duas consultas juntas (senão o destaque "pula" para o slide antigo e volta).
10. **Media playlist ativa:** `/v1/media/playlist/active` pode apontar outra playlist que a aberta na tela; só destaque o item se `playlist.uuid` for a playlist aberta.
11. **Mensagens:** ao reenviar (`PUT`/`trigger`), preserve tokens de timer e relógio como vieram; só os de texto recebem o valor digitado.
12. **Clique na música já a coloca no ar** (decisão do dono, não é bug).
13. **Cabeçalhos/placeholders** de playlist (`type: header|placeholder`) não têm slides; itens `media/audio/livevideo` não são apresentações.
