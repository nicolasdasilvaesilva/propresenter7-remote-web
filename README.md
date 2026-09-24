# ProPresenter 7 Remote Web & Antigravity Skill

Controle remoto web responsivo para **ProPresenter 7**, projetado sob medida para operação ao vivo em tablets (iPad / Android) e smartphones (iPhone / Android) através da rede Wi-Fi local, acompanhado de uma **Skill especialista em ProPresenter** para o assistente de IA **Antigravity**.

---

## 🌟 Funcionalidades

* **Layout Otimizado para Tablets (iPad / Android):**
  * **Duas Colunas (Split View):**
    * **Coluna da Esquerda:** *Preview* ao vivo em 16:9, controles de transporte (`<<` e `>>`) e lista de itens da pasta selecionada.
    * **Coluna da Direita:** Grade/lista completa de **todos os slides ou mídias** da pasta em cartões grandes de alta definição, com badge **`AO VIVO`** e disparo imediato por toque na tela.
* **Layout Otimizado para Smartphones:** Coluna única responsiva com preview grande no topo e lista vertical de navegação rápida.
* **Seletor de Looks / Aparência:** Alternância instantânea de Looks do ProPresenter 7 (ex.: *VHT/VÍDEOS*, *LOUVOR*, *AVANTE*, *Bíblia*) diretamente pelo menu no topo da aplicação.
* **Foco em Mídia / ProContent:** Navegação e disparo de entradas ao vivo (ex.: *EasyWorship*), vídeos, fundos e imagens de pregação da área inferior do ProPresenter.
* **Playlists de Culto:** Suporte a letras de músicas e apresentações de culto slide por slide com miniaturas em JPEG renderizadas pela API oficial.
* **Ações Rápidas de Emergência:** Botões *Blackout* (corta saída) e *Clear* (limpa slides e mídias).
* **Zero Dependências Externas:** Backend construído em **Node.js nativo** com **Proxy Reverso transparente**, eliminando qualquer bloqueio de CORS no Safari ou Chrome mobile.

---

## 📁 Estrutura do Repositório

```text
├── server.js                      # Servidor HTTP leve e proxy reverso local (porta 3000)
├── Iniciar-Controle-Remoto.bat    # Inicializador de 1 clique para Windows
├── Instalar-Skill.bat             # Instalador automático da skill para o Antigravity
├── PROMPT-PARA-ANTIGRAVITY.txt    # Prompt pronto para colar no Antigravity
├── COMO-INSTALAR.txt              # Guia rápido de instalação
├── public/
│   ├── index.html                 # Interface web do controle remoto
│   ├── css/
│   │   └── style.css              # Design System Dark Mode (estilo ProPresenter)
│   └── js/
│       └── app.js                 # Lógica de controle, disparos e polling de status
└── skills/
    └── propresenter-expert/
        └── SKILL.md               # Skill especialista para o Antigravity
```

---

## 🚀 Como Executar

### 1. No computador onde roda o ProPresenter 7:

* **Se for um computador novo (sem nada instalado):**
  * Você só precisa do **Node.js** (não precisa de Python nem de Docker!).
  * Dê 2 cliques no arquivo **`1-Instalar-NodeJS.bat`** incluído neste projeto — ele baixa e instala o Node.js LTS automaticamente para você!
  * Ou, se estiver usando o terminal com o **Antigravity**, basta pedir para ele instalar ou rodar `winget install OpenJS.NodeJS.LTS`.

* **Iniciando o Controle:**
  * **Modo Silencioso em Segundo Plano (Recomendado):** Dê dois cliques em **`Iniciar-Segundo-Plano.vbs`** — o servidor sobe 100% invisível em background, sem abrir janela preta do CMD.
  * **Modo com Janela de Logs:** Dê dois cliques em **`Iniciar-Controle-Remoto.bat`** (exibe o IP local da máquina na tela).
  * **Para Parar o Servidor:** Dê dois cliques em **`Parar-Controle-Remoto.bat`**.

### 2. No iPad, Tablet ou Celular (Instalação do PWA na Tela Inicial):

Como o acesso local ocorre via rede interna (`http://IP_DO_PC:3000`), siga o procedimento abaixo para criar o atalho com o ícone oficial em tela cheia:

* **No iPad / iPhone (Safari):**
  1. Abra o Safari e digite o IP (ex.: `http://10.0.21.208:3000`).
  2. Toque no botão de **Compartilhar** (quadrado com seta para cima).
  3. Escolha **"Adicionar à Tela de Início"**.
  4. O ícone oficial do ProPresenter será fixado na tela inicial e abrirá em **tela cheia** (sem barras do navegador).

* **No Tablet Android (Google Chrome / Firefox):**
  1. Abra o navegador e acesse o endereço (ex.: `http://10.0.21.208:3000`).
  2. Toque no menu de **3 pontinhos** no canto superior direito.
  3. Selecione **"Adicionar à tela inicial"** (ou "Instalar aplicativo").
  4. Pronto! O atalho nativo será instalado na área de trabalho do tablet.

---

## 🧠 Instalando a Skill no Antigravity

Se você utiliza o **Google Antigravity**, você pode torná-lo um especialista no ProPresenter 7:

* **Opção 1 (Automática):** Dê 2 cliques no arquivo `Instalar-Skill.bat`.
* **Opção 2 (Manual):** Copie a pasta `skills/propresenter-expert` para o diretório de skills globais do Antigravity:
  `%USERPROFILE%\.gemini\config\skills\propresenter-expert\SKILL.md`
* **Opção 3 (Conversacional):** Abra o arquivo `PROMPT-PARA-ANTIGRAVITY.txt` e cole o conteúdo no chat do Antigravity.

---

## 📡 API do ProPresenter 7 (OpenAPI v1)

Este projeto foi construído utilizando a **OpenAPI v1 REST API** oficial do ProPresenter 7.

Principais endpoints utilizados:
* `GET /v1/looks` & `GET /v1/look/{id}/trigger` — Gestão e disparo de Looks de tela.
* `GET /v1/media/playlists` & `GET /v1/media/playlist/{id}/{media_id}/trigger` — Disparo de mídias e entradas ao vivo.
* `GET /v1/playlists` & `GET /v1/presentation/{uuid}/{index}/trigger` — Disparo de apresentações e slides de culto.
* `GET /v1/presentation/{uuid}/thumbnail/{index}` — Miniaturas em alta definição dos slides.
* `GET /v1/media/{uuid}/thumbnail` — Miniaturas das mídias.
* `GET /v1/presentation/slide_index` — Sincronização em tempo real do slide ativo no ar.
* `GET /v1/clear/layer/{layer}` & `GET /v1/clear/group/0/trigger` — Limpeza de camadas e blackout.

---

## 📄 Licença
Distribuído sob a licença MIT. Sinta-se livre para utilizar e personalizar para os cultos e transmissões da sua igreja ou evento!
