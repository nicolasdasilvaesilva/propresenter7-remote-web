# ProPresenter 7 Remote Web

Controle remoto web profissional e responsivo para o **ProPresenter 7**, feito para a operação ao vivo em cultos e eventos em **iPad/tablets**, **celulares** e **computadores**, pela rede Wi-Fi local. Acompanha **skills para o Claude Code e para o Google Antigravity** (instalação, atualização e suporte guiados por IA).

**Resumo:** um servidor Node.js (sem dependências, porta padrão **3000**) roda **no computador do ProPresenter**, sobe sozinho quando o Windows liga e serve o app. O operador só abre `http://IP-DO-COMPUTADOR:3000` no iPad/celular.

> Testado com o **ProPresenter 21.4.2** (API OpenAPI v1).

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
   *(o local padrão da instalação é sempre `C:ProPresenter-Remote`: se o script for rodado de outra pasta, ele **move a instalação para lá sozinho** — clona do mesmo GitHub, leva o `config.json` e continua a partir do novo local; a pasta antiga não é apagada)*
5. assume a porta (encerra uma cópia antiga do servidor), inicia e **confere tudo**, mostrando os endereços para o iPad.

Opções: `-Destino C:OutraPasta` (outro local) · `-NaoMover` (instala onde está) · `-Porta 3000` (porta do servidor) · `-ProHost 10.0.21.145 -ProPorta 50820` (ProPresenter em outro computador) · `-SemFirewall` · `-SemIniciar`.

**Já tenho a versão antiga (em outra pasta)?** Dentro dela (como Administrador): `git pull origin main` e `powershell -ExecutionPolicy Bypass -File .scriptsInstalar-Servico.ps1`. O instalador **move para `C:ProPresenter-Remote`**, encerra o servidor antigo e assume a porta; depois a pasta antiga pode ser apagada. Depois rode `Instalar-Skill.bat`.

> Sem Administrador funciona, mas a tarefa só sobe **depois que aquele usuário entra** no Windows (e o firewall pode precisar ser liberado à mão).

### No iPad, tablet ou celular
1. Conecte na **mesma rede** do computador do ProPresenter.
2. Abra `http://10.0.21.145:3000` (o instalador imprime o(s) endereço(s) certo(s)).
3. **iPad/iPhone (Safari):** Compartilhar `⎋` › **Adicionar à Tela de Início**. **Android (Chrome):** menu `⋮` › **Instalar aplicativo / Adicionar à tela inicial**. **PC:** ícone de instalar do navegador (só com HTTPS — veja [PWA](#-funcionalidades)).

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
* O servidor calcula a **versão dos arquivos (hash)** e a coloca no `?v=` do `index.html` e no nome do cache do service worker **a cada requisição**. Não há mais número para incrementar à mão.
* Versão nova ⇒ o navegador baixa `app.js`/`style.css` de novo; o service worker apaga os caches antigos.
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
* Mudar o **IP/porta do ProPresenter** pela engrenagem do app **grava** no `config.json` — sobrevive a reinícios e atualizações. (`set-pro-host` só aceita IP da rede local ou nome de computador.)
* Endpoints do servidor: `GET /api/server-info` (`proHost`, `proPort`, `port`, `version`, `ips`) e `GET /api/version` (`version`, `startedAt`, `pid`, `node`).

---

## 🌟 Funcionalidades

### 📖 Apresentações & Culto
* **iPad/tablet (largura ≥ 769 px):** duas colunas — **esquerda** com *preview* ao vivo 16:9, controles `<<` `>>` e a lista da playlist; **direita** com a grade de **todos os slides** (miniaturas reais e selo **AO VIVO**). No **celular** a tela é uma coluna (preview + lista + setas).
* **Letras limpas:** slides com texto são renderizados em HTML (grande, nítido, fundo preto) em vez de miniatura borrada.
* **Sem "pulo":** depois do seu toque o app ignora as respostas antigas do ProPresenter, então o destaque não volta para o slide/música anterior. O rótulo mostra "Slide N de M".
* Playlists **dentro de pastas** aparecem (com o nome da pasta); cabeçalhos/placeholders não tentam abrir slides.
* **Atenção:** tocar numa música já a **coloca no ar**.

### 🎬 Mídia / ProContent
Todas as playlists de mídia, com grade visual limpa (arte sem texto sobreposto) e sincronismo em tempo real: qualquer aparelho (ou o próprio ProPresenter) que mude a mídia ativa faz a lista e a grade destacarem o item com **AO VIVO** (só quando é a playlist aberta).

### 🔍 Pesquisa global e adicionar à playlist
* Busca instantânea entre mais de **4.500** músicas/apresentações indexadas localmente (espaço e setas funcionam normalmente ao digitar).
* **"+ Add à Playlist"** abre um modal com **todas** as playlists de culto (`Pasta › Playlist`) e grava **somente na playlist escolhida** — sem tocar ao vivo. Se a playlist não for encontrada, avisa e **não altera nada**.

### 🎨 Looks · 🧹 Clear · 🎯 Macros
* Troca de **Looks**; menu **Clear** por camada (Áudio, Mensagens, Props, Anúncios, Slide, Mídia, Entrada de Vídeo) e **Clear All**; cartões coloridos de **Macros** do ProPresenter.

### 💬 Mensagens no telão (idêntico ao painel oficial)
Seletor de modelo (`✓`), texto com `{TOKENS}`, campos `Value:`, `Enter` envia, **Show/Clear**. Salva os tokens (`PUT`) e dispara (`POST …/trigger`). Tokens de timer/relógio são preservados.

### 🔊 Áudio
Playlists de áudio, Play/Pause, faixa anterior/próxima, status do que está tocando (respeita pausado) e limpar a camada.

### 🛠️ Ferramentas
* **Stage Display:** troca o layout de cada tela de retorno ou de várias de uma vez ("Mudar Retornos Plataforma"). Cada tela tem o marcador **"Mudar em conjunto"** (iPad/NDI são independentes por padrão). As trocas entram numa **fila com conferência** (o ProPresenter ignora trocas coladas) e o app avisa qual tela falhou. Também envia/limpa a **mensagem de palco**.
* **Timers** (iniciar/pausar/reiniciar/+1/+5 min), **Entradas de vídeo**, **Props** (com indicador ATIVO) e **Captura** (gravar/parar).

### 📱 PWA e iPad
* Modal de instalação por sistema (iPad/iPhone, Android, PC). Em **HTTP puro** (rede local por `IP:3000`) o navegador **não registra service worker nem oferece "Instalar aplicativo"** — no iOS use *Adicionar à Tela de Início* (funciona como app em tela cheia). O app funciona normalmente sem instalar.
* Cabeçalho com **rolagem horizontal** (arrastar/passar o dedo); botões maiores em telas de toque; `Espaço`/setas não passam slide com um pop-up aberto; `Esc` fecha os pop-ups.

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
`GET /version` · `GET /v1/looks`, `/v1/look/{id}/trigger` · `GET /v1/macros`, `/v1/macro/{id}/trigger` · `GET /v1/playlists`, `/v1/playlist/{id}`, `/v1/playlist/{id}/{i}/trigger`, **`PUT /v1/playlist/{id}`** (adicionar música) · `GET /v1/presentation/{uuid}`, `/thumbnail/{i}`, `/{i}/trigger`, `/v1/presentation/slide_index`, `/v1/trigger/next|previous` · `GET /v1/libraries`, `/v1/library/{id}` · `GET /v1/media/playlists`, `/v1/media/playlist/{id}`, `/{media}/trigger`, `/v1/media/playlist/active`, `/v1/media/{uuid}/thumbnail` · `GET /v1/audio/playlists`, `/v1/audio/playlist/{id}`, `/{track}/trigger`, `/v1/transport/audio/{play|pause|current}` · `GET/PUT /v1/message*`, `POST /v1/message/{id}/trigger`, `GET /v1/message/{id}/clear` · `GET /v1/clear/layer/{layer}`, `/v1/clear/group/{id}/trigger` · `GET /v1/stage/screens`, `/v1/stage/layouts`, `/v1/stage/screen/{id}/layout[/{layout}]`, `GET|PUT|DELETE /v1/stage/message` · `GET /v1/timers/current`, `/v1/timer/{id}/{start|stop|reset|increment/{s}}` · `GET /v1/video_inputs`, `/{id}/trigger` · `GET /v1/props`, `/v1/prop/{id}/trigger|clear` · `GET /v1/capture/status`, **`GET /v1/capture/{start|stop}`**.

---

## ⚠️ Comportamentos do ProPresenter real (21.4.2)
Medidos no ProPresenter de produção (o spec oficial diverge em alguns pontos):
1. **Leitura do layout do Stage por índice troca as telas 1 e 2** → o app usa sempre o **UUID** da tela.
2. **Trocas de layout coladas (<~100 ms) são ignoradas** (responde 204 mas não aplica) → fila ≥400 ms + conferência + nova tentativa.
3. **Playlists:** `field_type:"playlist"` e filhos em `children` (o spec diz `type`/`playlists`); o app aceita os dois.
4. `GET /v1/presentation/{uuid}` vem embrulhado em `{presentation:{…}}`; `slide_index` **não** traz o total de slides e devolve `{presentation_index:null}` sem nada no ar.
5. **404 é normal** quando não há nada no ar: só 502/503 ou falha de rede significa "offline".
6. **Captura** é `GET` (não POST); áudio pausado ainda traz `name` (use `is_playing`).

---

## 🩺 Solução de problemas
Rode **`Verificar-Controle-Remoto.bat`**: ele diz o que está errado.

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| iPad não abre a página | Servidor parado, firewall, rede do Windows como **Pública**, IP do PC mudou | Verificar; rodar `Configurar-Inicio-Automatico.bat` como Admin; mudar a rede para **Privada**; reservar IP fixo no roteador |
| Abre, mas a bolinha fica vermelha | ProPresenter fechado / API desligada / IP ou porta errados | Abrir o ProPresenter; Preferências › Rede; ajustar na engrenagem do app |
| Aparece versão antiga | Cache do aparelho | Fechar/abrir o app; recarregar 2×; remover o ícone e adicionar de novo |
| `A porta 3000 já está em uso` | Outra cópia ou outro programa | `Parar-Controle-Remoto.bat`; ver quem usa: `Get-NetTCPConnection -LocalPort 3000` |
| Não sobe após reiniciar o Windows | Instalado sem Administrador (só sobe após login) | `Configurar-Inicio-Automatico.bat` como Administrador |
| Atualização "voltou atrás" | A versão nova não subiu/verificou | Ler `logs\server-erro.log`; backup em `..\ProPresenter-Remote-backups` |
| "Há alterações locais" ao atualizar | Arquivo versionado editado | `git status`; `Atualizar.ps1 -Forcar` guarda em stash |

---

## 📁 Estrutura de arquivos
```text
├── server.js                         # Servidor HTTP, proxy /api/v1, config.json, versão dos arquivos
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
├── public/
│   ├── index.html · manifest.json · service-worker.js
│   ├── css/style.css                 # Tema escuro estilo ProPresenter
│   ├── js/app.js                     # Lógica: API, polling, Stage, mensagens, PWA…
│   └── img/                          # Ícones (192/512, apple-touch, logo, favicon)
└── skills/
    ├── propresenter-expert/SKILL.md
    └── propresenter-remote-install/SKILL.md
```

---

## 🧪 Desenvolvimento
```powershell
node server.js                                          # http://localhost:3000 (PRO_HOST / PRO_PORT apontam o ProPresenter)
node --check server.js; node --check public\js\app.js   # sintaxe (sem testes automatizados)
```
* Sem `npm install` (só módulos nativos do Node). Node **18+** (usa `fetch`).
* Ao testar no ProPresenter real, comece só com leituras; **nada que mude a saída ao vivo** sem os telões livres.
* A versão dos arquivos é automática — não edite números de versão.
* Scripts `.ps1` em UTF-8 **com BOM**; JSON gravado pelo PowerShell **sem BOM**.

---

## 📦 Versões
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
