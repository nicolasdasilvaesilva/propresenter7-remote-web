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
  1. Certifique-se de que o **ProPresenter 7** está aberto com a rede habilitada (*Preferências -> Rede*, porta padrão `50820`).
  2. Dê dois cliques em **`Iniciar-Controle-Remoto.bat`** (ou execute no terminal: `node server.js`).
  3. Uma janela exibirá o endereço IP local da máquina (ex.: `http://10.0.21.145:3000`).

### 2. No iPad, Tablet ou Celular:
1. Conecte o dispositivo no **mesmo Wi-Fi** do computador.
2. Abra o navegador (Safari ou Chrome) e acesse o endereço IP exibido (ex.: `http://10.0.21.145:3000`).
3. **Dica:** Toque em *"Adicionar à Tela de Início"* para usar o controle em tela cheia como se fosse um aplicativo nativo!

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
