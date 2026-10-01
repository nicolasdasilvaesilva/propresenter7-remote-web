# ProPresenter 7 Remote Web

🇧🇷 Português | 🇺🇸 [English](README.en.md) | 🇪🇸 [Español](README.es.md)

Controle remoto web **profissional, completo e gratuito** para o **ProPresenter 7** — **duas telas num só app**: uma para **iPad/tablet/celular** e outra para **computador**, com o visual do painel oficial. Opera cultos e eventos ao vivo pela rede Wi-Fi local, sem instalar nada no aparelho de quem está operando. Acompanha **skills para o Claude Code e para o Google Antigravity** (instalação, atualização e suporte guiados por IA).

**Resumo:** um servidor Node.js (**sem nenhuma dependência**, porta padrão **3000**) roda **no computador do ProPresenter**, sobe sozinho quando o Windows liga e serve as duas telas do app. O operador só abre `http://IP-DO-COMPUTADOR:3000` — o app **reconhece sozinho** se é um celular/tablet ou um computador e abre a tela certa.

> Testado com o **ProPresenter 21.4.2** (API OpenAPI v1) — incluindo contra o ProPresenter real de uma igreja em produção, ao vivo.

## ✨ Por que usar

* **Duas telas, um só backend:** a mesma instalação atende quem opera pelo iPad/celular durante o culto e quem prefere o computador com o visual do painel oficial do ProPresenter — sem duplicar servidor, sem duplicar configuração.
* **PGM ao vivo de verdade:** o monitor do desktop mostra a letra do slide **nítida** (renderizada em HTML, não uma miniatura borrada) sobre o fundo certo — vídeo/imagem em loop quando existe, ou fundo preto limpo quando é só texto — exatamente como no painel oficial, sem duplicar texto.
* **Arrastar para reordenar, com o dedo OU o mouse:** tanto no desktop quanto no celular/tablet, segure o item da playlist e arraste para a posição — sem setinha, sem popup, do jeito mais rápido possível.
* **Transporte de mídia de verdade:** tocar, pausar, voltar/avançar 10 segundos e ver a barra de progresso em tempo real de vídeos, mídias e do locutor de anúncios — não só do MP3.
* **VU meter honesto:** só "balança" quando existe áudio de verdade tocando (vídeo com som ou MP3); uma imagem estática nunca faz ele se mexer à toa.
* **Multilíngue:** Português, English e Español, com detecção automática e seleção manual por aparelho.
* **Instala como app** (PWA) no computador e no celular, com ícone próprio — nunca copia o logotipo do ProPresenter.
* **Sobe sozinho com o Windows**, atualiza sozinho com backup e volta atrás sozinho se algo falhar.

## Índice
1. [Início rápido](#-início-rápido)
2. [Atualizar, verificar, parar e desinstalar](#-atualizar-verificar-parar-e-desinstalar)
3. [Configuração](#️-configuração)
4. [Funcionalidades](#-funcionalidades)
5. [Skills para IA (Claude Code e Antigravity)](#-skills-para-ia-claude-code-e-antigravity)
6. [Segurança](#-segurança)
7. [Endpoints da API usados](#-endpoints-da-api-do-propresenter-usados)
8. [Comportamentos do ProPresenter real](#️-comportamentos-do-propresenter-real-2142)
9. [Solução de problemas](#-solução-de-problemas)
10. [Estrutura de arquivos](#-estrutura-de-arquivos)
11. [Desenvolvimento](#-desenvolvimento)
12. [Versões](#-versões) · [Autores](#-autores--créditos) · [Licença](#-licença)

---

## 🚀 Início rápido

### Ambientes
* **Produção:** o **próprio computador do ProPresenter** (ex.: `10.0.21.145`). O servidor roda lá, na porta **3000**.
* **Desenvolvimento:** qualquer outro computador. Os scripts de instalação/atualização rodam **no computador onde o app fica instalado**.

### Requisitos
Windows 10/11 · **Node.js 18+** (o instalador tenta instalar com `winget`) · **Git** (`winget install --id Git.Git`) · ProPresenter 7 com a **API de rede ligada** (Preferências › Rede, porta 50820).

### Instalação (PowerShell como **Administrador** no computador do ProPresenter)
```powershell
git clone https://github.com/nicolasdasilvaesilva/propresenter7-remote-web.git C:\ProPresenter-Remote
powershell -ExecutionPolicy Bypass -File C:\ProPresenter-Remote\scripts\Instalar-Servico.ps1
```
O script:
1. garante o Node.js e grava o `config.json` (detecta o ProPresenter no mesmo computador e usa `127.0.0.1`);
2. cria a tarefa agendada **`ProPresenter-Remote`** — como Administrador roda como `SYSTEM` **ao ligar o Windows, sem precisar de login, para todos os usuários**, sem janela e reiniciando até 5 vezes se cair;
3. remove o inicializador antigo (pasta *Inicializar*) de todos os usuários;
4. cria a regra de firewall `ProPresenter Remote (TCP 3000)` (redes Privada e de Domínio);
   *(o local padrão da instalação é sempre `C:\ProPresenter-Remote`: se o script for rodado de outra pasta, ele **move a instalação para lá sozinho** — clona do mesmo GitHub, leva o `config.json` e continua a partir do novo local; a pasta antiga não é apagada)*
5. assume a porta (encerra uma cópia antiga do servidor), inicia e **confere tudo**, mostrando os endereços para o iPad e para o computador.

Opções: `-Destino C:\OutraPasta` (outro local) · `-NaoMover` (instala onde está) · `-Porta 3000` (porta do servidor) · `-ProHost 10.0.21.145 -ProPorta 50820` (ProPresenter em outro computador) · `-SemFirewall` · `-SemIniciar`.

**Já tenho a versão antiga (em outra pasta)?** Dentro dela (como Administrador): `git pull origin main` e `powershell -ExecutionPolicy Bypass -File .\scripts\Instalar-Servico.ps1`. O instalador **move para `C:\ProPresenter-Remote`**, encerra o servidor antigo e assume a porta; depois a pasta antiga pode ser apagada. Depois rode `Instalar-Skill.bat`.

> Sem Administrador funciona, mas a tarefa só sobe **depois que aquele usuário entra** no Windows (e o firewall pode precisar ser liberado à mão).

### No iPad, tablet ou celular
1. Conecte na **mesma rede** do computador do ProPresenter.
2. Abra `http://10.0.21.145:3000` (o instalador imprime o(s) endereço(s) certo(s)) — o app **detecta sozinho** que é um aparelho de toque e abre a tela mobile.
3. **iPad/iPhone (Safari):** Compartilhar `⎋` › **Adicionar à Tela de Início**. **Android (Chrome):** menu `⋮` › **Instalar aplicativo / Adicionar à tela inicial**.

### No computador (operador de mesa)
Abra o **mesmo endereço** (`http://10.0.21.145:3000`) num navegador de computador — o app detecta que não é um aparelho de toque e abre sozinho a **tela Desktop**, com o visual do painel oficial do ProPresenter. Não precisa digitar `/desktop/`. Pra abrir a tela mobile num computador mesmo assim (teste), use `?mobile=1` no fim do endereço. O botão **Instalar App** do próprio menu (ou o ícone de instalar do navegador, com HTTPS) transforma a tela Desktop num app próprio, com ícone na área de trabalho.

### Porta padrão
O servidor usa a porta **3000**. Para outra porta: `Instalar-Servico.ps1 -Porta 3100` (o script grava no `config.json` e ajusta o firewall) ou defina `PORT`. Os aparelhos passam a abrir `http://IP:3100`.

---

## 🔁 Atualizar, verificar, parar e desinstalar

| Atalho (2 cliques) | Script | O que faz |
|---|---|---|
| `Atualizar-Controle-Remoto.bat` | `scripts\Atualizar.ps1` | Atualiza pelo GitHub com **backup**, para só o nosso servidor, reinicia, **confere** e **volta sozinho** para a versão anterior se falhar |
| `Verificar-Controle-Remoto.bat` | `scripts\Verificar.ps1` | Confere Node, arquivos, servidor, versão, ProPresenter, proxy, tarefa, firewall e perfil de rede; mostra os endereços |
| `Parar-Controle-Remoto.bat` | `scripts\Parar-Servidor.ps1` | Para **só** o controle remoto (nunca outros programas Node) |
| `Configurar-Inicio-Automatico.bat` | `scripts\Instalar-Servico.ps1` | Instala/reaplica o início automático |
| `Desinstalar-Inicio-Automatico.bat` | `scripts\Desinstalar-Servico.ps1` | Remove tarefa, inicializador antigo e regra de firewall (mantém arquivos e `config.json`) |
| `Iniciar-Controle-Remoto.bat` | — | Roda em primeiro plano com a janela de logs (teste manual) |

Execute os `.bat` **como Administrador** (botão direito › *Executar como administrador*) quando a instalação for para todos os usuários.

### Como a atualização evita cache antigo
* O servidor calcula a **versão dos arquivos (hash)** — incluindo as duas telas, mobile e desktop — e a coloca no `?v=` do `index.html` e no nome do cache do service worker **a cada requisição**. Não há número para incrementar à mão.
* Versão nova ⇒ o navegador baixa `app.js`/`app-desktop.js`/`style.css` de novo; o service worker apaga os caches antigos.
* A verificação **falha** se a página servida não trouxer a versão atual.
* **Nos aparelhos:** feche o app e abra de novo (ou recarregue 2 vezes). Último recurso: remover o ícone da Tela de Início, limpar os dados do site e adicionar de novo.
* Se a atualização falhar em qualquer etapa, o script **restaura a versão anterior** e sobe o servidor antigo. Backups ficam em `..\ProPresenter-Remote-backups\` (mantém 3).

Logs: `logs\server.log` e `logs\server-erro.log` (o anterior fica em `*.anterior.log`).

---

## ⚙️ Configuração

`config.json` (na pasta do app, **fora do Git**, gerado pelo instalador):
```json
{ "port": 3000, "proHost": "127.0.0.1", "proPort": 50820 }
```
* **Prioridade:** variável de ambiente (`PORT`, `PRO_HOST`, `PRO_PORT`) › `config.json` › padrão (3000 / `10.0.21.145` / 50820).
* Mudar o **IP/porta do ProPresenter** pela engrenagem do app (nas duas telas) **grava** no `config.json` — sobrevive a reinícios e atualizações. (`set-pro-host` só aceita IP da rede local ou nome de computador.)
* Endpoints do servidor: `GET /api/server-info` (`proHost`, `proPort`, `port`, `version`, `ips`) e `GET /api/version` (`version`, `startedAt`, `pid`, `node`).

---

## 🌟 Funcionalidades

### 🖥️ Duas telas, um só app
* **Mobile/Tablet** (`/`, celular ou iPad): uma coluna com preview ao vivo, setas `<<`/`>>` e a lista da playlist; em telas mais largas (tablet), vira duas colunas com a grade de todos os slides ao lado.
* **Desktop** (`/desktop/`, computador): visual redesenhado do zero para lembrar o painel oficial do ProPresenter (cores, ícones e layout **originais nossos**, sem copiar nenhum arquivo da Renewed Vision) — biblioteca, playlist, mídia/ProContent, monitor PGM, abas de Áudio/Palco/Temporizadores/Mensagens/Props/Entradas de Vídeo/Captura/Macros, tudo em painéis **redimensionáveis por divisórias visíveis**.
* **A detecção é automática**: o app olha se o aparelho tem toque (não confia só no nome do navegador — um iPad no Safari se identifica como "Macintosh", mas tem toque) e manda para a tela certa sozinho. `?mobile=1` força a tela mobile mesmo num computador, para testes.
* Mesmo backend, mesma instalação, mesma atualização — escolher uma tela não exige nada a mais.

### 📖 Apresentações, letras e playlist
* **Monitor PGM (Desktop) sempre 16:9**, do tamanho exato do espaço disponível, em qualquer posição das divisórias.
* **Letra sempre nítida:** quando o slide só tem texto, a letra é desenhada em HTML (grande, nítida, fundo preto) — nunca uma miniatura pequena esticada e borrada. Quando existe uma mídia em loop atrás (vídeo/imagem), o app mostra os dois juntos: o vídeo de fundo **e** a letra nítida por cima, sem duplicar texto nenhum.
* **Arrastar para reordenar** a playlist de apresentação, com o dedo **ou** o mouse (segure no ícone `⠿` e arraste) — nas duas telas, mobile e desktop. Reordenar playlist de **Mídia/ProContent não é possível**: a API oficial do ProPresenter só permite leitura dela, e o app nunca finge que salva uma ordem que não vai persistir.
* **Navegação pelo teclado** no desktop: setas `←`/`→`/`↑`/`↓`, `PageUp`/`PageDown` e espaço avançam/voltam o slide ou a mídia ao vivo, sem precisar clicar.
* **Sem "pulo":** depois do seu toque o app ignora por alguns instantes as respostas antigas do ProPresenter, então o destaque não volta sozinho para o slide/música anterior.
* Playlists **dentro de pastas** aparecem (com o nome da pasta); cabeçalhos/placeholders não tentam abrir slides.
* **Atenção:** tocar numa música da playlist (mobile) ou num slide específico do grid (desktop) **coloca no ar**.

### 🎬 Mídia / ProContent e transporte de vídeo
* Grade visual com miniaturas reais, sincronismo em tempo real (qualquer aparelho ou o próprio ProPresenter que mude a mídia ativa atualiza a lista e a grade com o selo **AO VIVO**).
* **Tocar, pausar, voltar 10s e avançar 10s de verdade** no vídeo/mídia em exibição, com **barra de progresso real** (posição atual / duração) — não é decoração, é a posição de reprodução de verdade lida da API. A mesma barra também existe para a camada de **Anúncios** e para o **Áudio** (MP3).
* **VU meter honesto** ao lado do monitor (Desktop): só reage quando existe áudio de verdade tocando (vídeo com som ou MP3) — uma imagem estática (PNG/JPEG) nunca faz ele se mexer, porque não tem som nenhum.
* Faixa de **limpar por camada** (Áudio, Mensagens, Props, Anúncios, Slide, Mídia, Entrada de Vídeo) direto ao lado do monitor, com um botão de **limpar tudo**.

### 🔍 Pesquisa global e adicionar à playlist
* Busca instantânea entre mais de **4.500** músicas/apresentações indexadas localmente.
* **Mobile:** popup com lupa, lista de resultados e preview da letra. **Desktop:** o mesmo popup, com "+ Adicionar à Playlist" e "Abrir".
* Grava **somente na playlist escolhida**, sem tocar ao vivo. Se a playlist não for encontrada, avisa e **não altera nada**.

### 🎨 Looks · 🧹 Clear · 🎯 Macros
* **Troca de Looks de verdade**, com o nome do Look ativo sempre sincronizado — mesmo que ele mude por fora do app (por um Macro, por outro controle, ou direto no ProPresenter), o rótulo se atualiza sozinho em poucos segundos.
* **Macros** aparecem como lista (igual ao painel oficial): nome completo de cada um (não só um número) e os **ícones das ações reais** que aquele macro dispara (trocar Look, limpar camada, mudar layout de palco, ativar prop) — direto da API, nunca inventado.
* Menu **Clear** por camada e **Clear All**.

### 💬 Mensagens no telão (idêntico ao painel oficial)
Seletor de modelo (`✓`), texto com `{TOKENS}`, campos `Value:`, `Enter` envia, **Show/Clear**. Salva os tokens (`PUT`) e dispara (`POST …/trigger`). Tokens de timer/relógio são preservados.

### 🛠️ Ferramentas
* **Stage Display:** troca o layout de cada tela de retorno ou de várias de uma vez ("Mudar Retornos Plataforma"). Cada tela tem o marcador **"Mudar em conjunto"** (iPad/NDI são independentes por padrão). As trocas entram numa **fila com conferência** (o ProPresenter ignora trocas coladas) e o app avisa qual tela falhou. Também envia/limpa a **mensagem de palco**.
* **Temporizadores** (iniciar/pausar/reiniciar/+1/+5 min), **Entradas de vídeo**, **Props** (com indicador ATIVO) e **Captura** (gravar/parar) — tudo com dados reais da API, sem nenhuma aba "de mentira".

### 🌍 Idiomas
Português, English e Español nas duas telas: detecta sozinho o idioma do aparelho na primeira vez, e cada pessoa pode escolher o seu nas Configurações (a escolha fica só naquele aparelho).

### 📱 PWA e instalação
* **Ícone próprio, original** (nunca o logotipo do ProPresenter — questão de direitos autorais, levada a sério neste projeto).
* **Mobile:** modal de instalação por sistema (iPad/iPhone, Android). Em **HTTP puro** (rede local por `IP:3000`) o navegador **não registra service worker nem oferece "Instalar aplicativo"** — no iOS use *Adicionar à Tela de Início* (funciona como app em tela cheia). O app funciona normalmente sem instalar.
* **Desktop:** botão **Instalar App** no menu (some sozinho assim que instalado, e não aparece de novo se o app já estiver rodando como programa separado).
* Botões maiores em telas de toque; `Espaço`/setas não passam slide com um pop-up aberto; `Esc` fecha os pop-ups. Barra de rolagem invisível nas duas telas.

---

## 🧠 Skills para IA (Claude Code e Antigravity)

Duas skills no formato `SKILL.md`, para o **Claude Code** e para o **Google Antigravity**:

| Skill | Para quê |
|---|---|
| `propresenter-remote-install` | **Instalar, atualizar, verificar, reparar e desinstalar** (início automático com o Windows, atualização sem cache antigo, volta atrás) |
| `propresenter-expert` | API, interface, arquitetura e as **armadilhas confirmadas no ProPresenter real** |

**Instalar as skills** (2 cliques em `Instalar-Skill.bat`, ou pela linha de comando):
```bat
Instalar-Skill.bat              :: Claude Code e Antigravity
Instalar-Skill.bat claude       :: só Claude Code   (%USERPROFILE%\.claude\skills)
Instalar-Skill.bat antigravity  :: só Antigravity   (%USERPROFILE%\.gemini\config\skills)
```
Depois feche e abra o assistente. Dentro deste repositório o Claude Code também lê o **`CLAUDE.md`** (regras do projeto). Para pedir a instalação a um assistente no computador do ProPresenter, cole o texto de `PROMPT-PARA-ANTIGRAVITY.txt` (vale para os dois).

---

## 🔒 Segurança
* O app é servido pelo próprio servidor (mesma origem): **sem CORS aberto**; escritas vindas de outra origem recebem **403**.
* `set-pro-host` só aceita IP da rede local / nome de computador e valida a porta; corpo das requisições limitado.
* **Limite conhecido:** em HTTP puro não há autenticação — qualquer dispositivo da rede local abre o controle, e comandos `GET` de outro site aberto na rede ainda seriam aceitos. Só senha/HTTPS resolveriam; use uma rede Wi-Fi de confiança.

---

## 📡 Endpoints da API do ProPresenter usados
`GET /version` · `GET /v1/looks`, `/v1/look/current`, `/v1/look/{id}/trigger` · `GET /v1/macros`, `/v1/macro/{id}/trigger` · `GET /v1/playlists`, `/v1/playlist/{id}`, `/v1/playlist/{id}/{i}/trigger`, **`PUT /v1/playlist/{id}`** (adicionar música e reordenar) · `GET /v1/presentation/{uuid}`, `/thumbnail/{i}`, `/{i}/trigger`, `/v1/presentation/slide_index`, `/v1/trigger/next|previous` · `GET /v1/libraries`, `/v1/library/{id}` · `GET /v1/media/playlists`, `/v1/media/playlist/{id}`, `/{media}/trigger`, `/v1/media/playlist/active`, `/v1/media/{uuid}/thumbnail` · `GET /v1/audio/playlists`, `/v1/audio/playlist/{id}`, `/{track}/trigger`, `/v1/trigger/audio/{next|previous}` · **`GET/PUT /v1/transport/{presentation|announcement|audio}/{current|time}`, `GET /v1/transport/{…}/{play|pause}`** (tocar/pausar/avançar/voltar e barra de progresso reais) · `GET/PUT /v1/message*`, `POST /v1/message/{id}/trigger`, `GET /v1/message/{id}/clear` · `GET /v1/clear/layer/{layer}`, `/v1/clear/group/{id}/trigger` · `GET /v1/stage/screens`, `/v1/stage/layouts`, `/v1/stage/screen/{id}/layout[/{layout}]`, `GET|PUT|DELETE /v1/stage/message`, `GET /v1/status/screens` · `GET /v1/timers/current`, `/v1/timer/{id}/{start|stop|reset|increment/{s}}` · `GET /v1/video_inputs`, `/{id}/trigger` · `GET /v1/props`, `/v1/prop/{id}/trigger|clear` · `GET /v1/capture/status`, **`GET /v1/capture/{start|stop}`**.

---

## ⚠️ Comportamentos do ProPresenter real (21.4.2)
Medidos no ProPresenter de produção (o spec oficial diverge ou é omisso em vários pontos):
1. **Leitura do layout do Stage por índice troca as telas 1 e 2** → o app usa sempre o **UUID** da tela.
2. **Trocas de layout coladas (<~100 ms) são ignoradas** (responde 204 mas não aplica) → fila ≥400 ms + conferência + nova tentativa.
3. **Playlists:** `field_type:"playlist"` e filhos em `children` (o spec diz `type`/`playlists`); o app aceita os dois.
4. `GET /v1/presentation/{uuid}` vem embrulhado em `{presentation:{…}}`; `slide_index` **não** traz o total de slides e devolve `{presentation_index:null}` sem nada no ar.
5. **404 é normal** quando não há nada no ar: só 502/503 ou falha de rede significa "offline".
6. **Captura** é `GET` (não POST); áudio pausado ainda traz `name` (use `is_playing`).
7. **`/v1/transport/{camada}/time` existe e não está documentado em nenhum lugar** — `GET` lê a posição atual de reprodução em segundos, `PUT` (com um número em JSON) muda a posição. Só funciona pras 3 camadas que o próprio erro 404 revela: `presentation` (cobre slide **e** mídia/vídeo, é a mesma camada internamente), `announcement` e `audio`. Não existe endpoint de marcador/bookmark (isso é só do editor do ProPresenter) nem de reordenar slides dentro de uma apresentação (só playlist inteira).
8. **Uma imagem estática (PNG/JPEG) também aparece em `/v1/transport/presentation/current` com uma "duração" residual** (ex.: `0.33`s) — não é áudio nenhum, é metadado interno; o app ignora durações menores que 1,5s pra decidir se tem mídia de verdade tocando.
9. `/v1/status/screens` lista **nomes** das telas configuradas (audiência/palco), mas **não existe nenhum endpoint que devolva uma imagem do que está sendo exibido** numa tela específica — só o feed NDI de cada uma resolveria isso, fora do escopo da API REST.

---

## 🩺 Solução de problemas
Rode **`Verificar-Controle-Remoto.bat`**: ele diz o que está errado.

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| iPad/computador não abre a página | Servidor parado, firewall, rede do Windows como **Pública**, IP do PC mudou | Verificar; rodar `Configurar-Inicio-Automatico.bat` como Admin; mudar a rede para **Privada**; reservar IP fixo no roteador |
| Abre, mas a bolinha fica vermelha | ProPresenter fechado / API desligada / IP ou porta errados | Abrir o ProPresenter; Preferências › Rede; ajustar na engrenagem do app |
| Abriu a tela errada (mobile num PC, ou vice-versa) | Detecção de toque do navegador | Use `?mobile=1` no fim do endereço para forçar a tela mobile num computador; num tablet híbrido, a tela mobile é a esperada (ele tem toque) |
| Aparece versão antiga | Cache do aparelho | Fechar/abrir o app; recarregar 2×; remover o ícone e adicionar de novo |
| `A porta 3000 já está em uso` | Outra cópia ou outro programa | `Parar-Controle-Remoto.bat`; ver quem usa: `Get-NetTCPConnection -LocalPort 3000` |
| Não sobe após reiniciar o Windows | Instalado sem Administrador (só sobe após login) | `Configurar-Inicio-Automatico.bat` como Administrador |
| Atualização "voltou atrás" | A versão nova não subiu/verificou | Ler `logs\server-erro.log`; backup em `..\ProPresenter-Remote-backups` |
| "Há alterações locais" ao atualizar | Arquivo versionado editado | `git status`; `Atualizar.ps1 -Forcar` guarda em stash |

---

## 📁 Estrutura de arquivos
```text
├── server.js                         # Servidor HTTP, proxy /api/v1, roteia / (mobile) e /desktop/, config.json, versão dos arquivos
├── config.json                       # (gerado) IP/porta — fora do Git
├── CLAUDE.md                         # Regras do projeto para o Claude Code
├── Configurar-Inicio-Automatico.bat  # Instala/reaplica o início automático (Executar como Administrador)
├── Atualizar-Controle-Remoto.bat     # Atualiza, reinicia, confere, volta atrás se falhar
├── Verificar-Controle-Remoto.bat     # Confere tudo e mostra os endereços
├── Parar-Controle-Remoto.bat         # Para só o controle remoto
├── Desinstalar-Inicio-Automatico.bat # Remove o início automático
├── Iniciar-Controle-Remoto.bat       # Primeiro plano (teste)
├── Iniciar-Segundo-Plano.vbs         # Inicia invisível (usado pela tarefa agendada)
├── Instalar-Skill.bat                # Instala as skills (Claude Code e/ou Antigravity)
├── 1-Instalar-NodeJS.bat             # Instalador do Node.js LTS
├── PROMPT-PARA-ANTIGRAVITY.txt       # Prompt para o assistente instalar tudo
├── COMO-INSTALAR.txt                 # Guia rápido
├── MEMORIA_PROJETO.md · PAUSA-*.md   # Registro técnico do projeto
├── scripts/                          # PowerShell: Instalar-Servico, Atualizar, Verificar, Parar-Servidor,
│                                     #   Desinstalar-Servico, Iniciar-Servidor, Firewall, _comum
├── public/                           # Tela MOBILE/TABLET (raiz "/")
│   ├── index.html · manifest.json · service-worker.js
│   ├── css/style.css                 # Tema escuro estilo ProPresenter
│   ├── js/app.js                     # Lógica: API, polling, arrastar playlist, Stage, mensagens, PWA…
│   ├── js/i18n.js                    # Dicionário pt-BR/en/es, compartilhado pelas duas telas
│   └── img/                          # Ícones originais (192/512, apple-touch, logo, favicon)
├── public-desktop/                   # Tela DESKTOP ("/desktop/"), visual do painel oficial
│   ├── index.html · manifest.json
│   ├── css/style.css                 # Toolbar em pílula, monitor PGM 16:9, clear-strip, VU meter…
│   └── js/app-desktop.js             # Lógica própria: PGM composto, transporte de mídia, macros, Look…
└── skills/
    ├── propresenter-expert/SKILL.md
    └── propresenter-remote-install/SKILL.md
```

---

## 🧪 Desenvolvimento
```powershell
node server.js                                                      # http://localhost:3000 (PRO_HOST / PRO_PORT apontam o ProPresenter)
node --check server.js
node --check public\js\app.js; node --check public-desktop\js\app-desktop.js  # sintaxe das duas telas (sem testes automatizados)
```
* Sem `npm install` (só módulos nativos do Node). Node **18+** (usa `fetch`).
* Ao testar no ProPresenter real, comece só com leituras; **nada que mude a saída ao vivo** sem os telões livres.
* A versão dos arquivos é automática — não edite números de versão.
* Scripts `.ps1` em UTF-8 **com BOM**; JSON gravado pelo PowerShell **sem BOM**.

---

## 📦 Versões
* **v1.5.5** — acesso público ao "Enviar Aviso" pela internet (4G, sem precisar do Wi-Fi da igreja): servidor isolado (`mensagens-publico.js`), login próprio por usuário/senha, painel admin pra criar/editar/remover usuários sem precisar de terminal, e guia completo pra rodar numa máquina Linux separada com túnel Cloudflare. Mesmo backend, zero mudança no app local.
* **v1.5.4** — mensagem no telão saía com `${uuid}` no lugar do valor digitado (ex.: `${05b2fedf-...}` em vez de "CRUZE") ao enviar pelo mobile, desktop ou pela pele "Enviar Aviso" — enviando direto pelo ProPresenter funcionava perfeito. Causa: ao reenviar a mensagem, a gente tirava o `uuid` de cada variável e mandava só o nome; o ProPresenter guarda o texto referenciando a variável pelo UUID, não pelo nome, então sem ele não conseguia casar o valor novo com o lugar certo. Corrigido nos três (mobile/desktop/mensagens) e confirmado ao vivo.
* **v1.5.3** — nova pele `/mensagens/`, pra mandar mensagem no telão sem ser o operador treinado (zeladores, segurança do estacionamento) — instalável no próprio celular, mostra todos os modelos já configurados no ProPresenter e pede confirmação antes de enviar de verdade.
* **v1.5.2** — o PGM (mobile) só mostrava "o que está ao vivo de verdade" quando o tipo de playlist aberto no aparelho (Mídia ou Apresentação) batia com o que estava realmente ao vivo no ProPresenter; navegando numa playlist de música enquanto um vídeo da Mídia tocava (ou o contrário), o PGM ficava sem mostrar nada. Agora o PGM sempre acompanha o que está realmente ao vivo, em qualquer combinação, sem trocar a playlist/pasta que o operador está navegando.
* **v1.5.1** — Macros, Looks, Palco, Áudio, Mensagens, Props e Entradas de Vídeo também ficavam presos vazios no Desktop se o ProPresenter não respondesse a tempo da conexão (achado em produção: Macros vazio mesmo com o ProPresenter ligado); agora todos se recuperam sozinhos, igual playlist/biblioteca/mídia. Corrigido também o cálculo da versão dos arquivos, que nunca detectava mudanças no JS do Desktop (procurava `app.js`, o arquivo certo é `app-desktop.js`) — podia deixar o navegador preso numa versão bem mais antiga mesmo depois de atualizar o servidor. No mobile, o Look também ganhou a mesma recuperação automática.
* **v1.5.0** — corrigido o arrastar-e-soltar da playlist no mobile: ao soltar perto de uma música vizinha, o cartão pulava pra posição errada (confirmado no iPad real); resolvido compensando o deslocamento de layout a cada troca. Sumiu o conteúdo de exemplo que ficava preso na tela do desktop (playlist/mídia fictícias) quando o ProPresenter ainda não tinha respondido na hora da conexão; agora playlist, biblioteca e mídia carregam sozinhas assim que aparecem no ProPresenter, sem precisar reiniciar o app (mobile e desktop).
* **v1.4.0** — Blackout, Grupos de Limpar e skip nativo (±segundos de verdade) de vídeo/áudio, contador regressivo de vídeo — tudo via API oficial do ProPresenter.
* **v1.3.1** — letra do PGM sempre nítida (HTML) e sem duplicar/sobrar texto atrás; fundo preto igual ao mobile.
* **v1.3.0** — transporte real (tocar/pausar/avançar-voltar 10s/barra de progresso) de mídia e anúncios; VU meter honesto; arrastar-e-soltar por toque/mouse no mobile; Macros em lista com nome e ações reais; menu do desktop redesenhado em pílula igual ao mobile; clear-strip fixo ao lado do monitor.
* **v1.2.0** — versão **Desktop** (visual do painel oficial), suporte a **3 idiomas** nas duas telas, reordenar playlist (setas), auto-detecção desktop/mobile.
* **v1.1.1** — instalador assume a porta e encerra o servidor antigo.
* **v1.1.0** — início automático com o Windows, atualização segura com volta atrás, versão automática dos arquivos, `config.json`, skills novas; correções do Stage (UUID + fila), do "pulo", playlists em pastas, captura, áudio e segurança.
* **v1.0.0** — primeira versão.

Releases: <https://github.com/nicolasdasilvaesilva/propresenter7-remote-web/releases>

---

## 👥 Autores & Créditos
* **Autor e developer:** **Nicolas da Silva e Silva**
* **Designer de funções:** **Marcelo Rocha**

---

## 📄 Licença
Distribuído sob a **Licença MIT** com **obrigatoriedade de atribuição dos créditos aos autores originais**.

É permitida a utilização, cópia, modificação, fusão e distribuição deste software, **desde que mantida obrigatoriamente a citação expressa dos autores**:
* **Autor e developer:** Nicolas da Silva e Silva
* **Designer de funções:** Marcelo Rocha

Para o termo legal completo, consulte o arquivo [`LICENSE`](./LICENSE).
