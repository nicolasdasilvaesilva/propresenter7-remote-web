# ProPresenter 7 Remote Web & Antigravity Skill

Controle remoto web profissional e responsivo para o **ProPresenter 7**, projetado sob medida para operação ao vivo durante cultos e eventos em **tablets (iPadOS / Android)**, **smartphones (iOS / Android)** e **computadores (Windows / macOS)** através da rede Wi-Fi local.

Acompanha a **Skill Especialista em ProPresenter 7** para o assistente de IA **Google Antigravity**, permitindo configuração, automação e suporte contínuo.

---

## 🌟 Todas as Funcionalidades

### 1. 💬 Módulo de Mensagens no Telão (Design 100% Nativo ProPresenter 7)
* **Interface idêntica ao ProPresenter Control Oficial (`/v1/control`):**
  * **Seletor Dropdown no Topo:** `[ ➤ MODELO ↕ ]` com ícone de envio e marcação `✓` no modelo selecionado (ex.: *CARROS*, *KIDS*, etc.).
  * **Card Visual do Template:** Exibição destacada do texto base com as tags dinâmicas (`{MARCA}`, `{COR}`, `{PLACA}`, `{Nome}`).
  * **Linhas de Tokens Oficiais:** Título da variável no topo e campo de edição na linha abaixo com etiqueta `Value: [ input ]`.
  * **Atalho Enter:** Permite disparar a mensagem pressionando a tecla `Enter` em qualquer campo de texto.
  * **Controles Show e Clear:** Botão **Show** para projetar no telão e **Clear** para ocultar imediatamente.
  * **Comunicação Dupla via API:** Executa `PUT /v1/message/{id}` para persistir os tokens no banco interno do ProPresenter e `POST /v1/message/{id}/trigger` para exibição instantânea.
  * **Roteamento de Telas da Igreja:** A camada de mensagens é projetada diretamente nos telões de audiência configurados (*Resolume NDI 1 e 2*).

### 2. 🎵 Módulo de Playlists de Áudio (Pop-up Modal)
* **Acesso Rápido:** Pop-up dedicado acionado pelo botão **Áudio** no cabeçalho ou menu móvel.
* **Navegação de Playlists:** Seleção de pastas de áudio do ProPresenter.
* **Controles de Reprodução Completa:** Play, Pause, Próxima Faixa, Faixa Anterior e status do áudio atual no ar.
* **Limpeza Rápida:** Botão para limpar/interromper a camada de áudio com um clique.

### 3. 📱 PWA Universal & Modal Inteligente de Instalação
* **Compatibilidade Total:**
  * **iPad / iPhone (Apple Safari):** Modal instrutivo passo a passo ensinando a tocar no botão de Compartilhar (`⎋`), rolar e tocar em **"Adicionar à Tela de Início"** (`➕`) para rodar em modo standalone sem barras de navegação.
  * **Android (Google Chrome / Samsung Internet / Edge):** Guia visual ensinando o toque no menu de 3 pontinhos (`⋮`) e seleção de **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
  * **Desktop (PC Windows / Mac):** Botão direto para instalação nativa pelo navegador Chromium.
* **Acesso Mobile:** Botão dedicado de instalação disponível tanto no topo quanto na barra inferior de ações rápidas para celulares.

### 4. 📖 Apresentações & Culto (Split View para Tablets)
* **Layout em Duas Colunas (Split View para iPad e Tablets >= 768px):**
  * **Coluna Esquerda:** *Preview* ao vivo em 16:9, controles de transporte (`<<` e `>>`) e lista vertical de itens da pasta selecionada.
  * **Coluna Direita:** Grade completa de **todos os slides** da apresentação com miniaturas renderizadas em tempo real pela API oficial e indicador **`AO VIVO`**.
* **Letras Limpas em Alta Legibilidade:** Para slides de músicas que contêm texto, a aplicação renderiza o texto em HTML puro com tipografia grande, nítida e centralizada em fundo preto absoluto, eliminando imagens rasterizadas borradas.

### 5. 🎬 Mídia / ProContent (Área Inferior do ProPresenter)
* **Navegação Completa de Pastas de Mídia:** Acesso direto a todas as playlists de mídia (Pregações, Fundos, Vídeos, Entradas ao Vivo).
* **Grade Visual Limpa:** Miniaturas de mídias e artes gráficas sem textos sobrepostos, mantendo a legibilidade total das artes de sermões e versículos.

### 6. 🎨 Seletor de Looks / Telas
* **Troca Instantânea de Looks:** Menu suspenso com todos os Looks configurados no ProPresenter (*LOUVOR*, *VHT/VÍDEOS*, *AVANTE*, *Bíblia*), permitindo reconfigurar saídas de telão e transmissão em segundos.

### 7. 🧹 Camadas de Limpeza (Clear Layers) & Blackout
* **Menu Suspenso na Ordem Oficial do ProPresenter:**
  1. Áudio
  2. Mensagens
  3. Props
  4. Anúncios
  5. Slide
  6. Mídia
  7. Entrada de Vídeo
* **Ações Globais:** Botão de **Clear All** (limpar todas as camadas) e **Blackout** (corte total de emergência).

### 8. 🔍 Pesquisa Global Instantânea
* **Índice Local Ultrarrápido:** Busca instantânea entre mais de 4.500 apresentações e músicas indexadas localmente.
* **Digitação Livre:** A barra de espaço e as setas funcionam normalmente durante a digitação na busca, sem passar slides acidentalmente.

### 9. 🎯 Seletor de Playlist ao Adicionar Música da Biblioteca
* **Escolha Livre de Playlist:** Ao encontrar uma música na busca global, o botão **"+ Add à Playlist"** abre um modal elegante listando **todas** as playlists de culto disponíveis no ProPresenter (incluindo playlists dentro de pastas e grupos).
* **Adição Sem Interferência:** A música é adicionada silenciosamente à playlist escolhida, sem disparar a letra ao vivo nem alterar o preview atual.
* **Toast de Confirmação:** Exibe notificação visual confirmando *"Adicionada à playlist [Nome] com sucesso!"*.

### 10. 🔄 Sincronismo Multi-Dispositivo de Mídia (Grid de Thumbnails)
* **Coluna Direita Sincronizada:** Quando qualquer dispositivo (tablet, celular, ou o próprio ProPresenter) altera a mídia ativa, o grid de thumbnails na coluna direita destaca automaticamente o item ao vivo com badge pulsante **"AO VIVO"** e rolagem suave.
* **Sincronismo Bidirecional:** Tanto a coluna esquerda (lista vertical) quanto a coluna direita (grade visual) acompanham mudanças em tempo real, mantendo todos os operadores sincronizados.

### 11. ⚡ Inicialização Silenciosa em Segundo Plano no Windows
* **Sobe sozinho quando o Windows liga:** tarefa agendada (`ProPresenter-Remote`) que inicia o servidor **sem janela**, **para todos os usuários** e **antes do login** (quando instalada como Administrador), reiniciando se cair. O operador só abre `http://IP:3000` no iPad.
* **Atualização segura:** `Atualizar-Controle-Remoto.bat` faz backup, baixa do GitHub, reinicia, **confere** e **volta sozinho** para a versão anterior se algo falhar.
* **Sem cache antigo:** a versão dos arquivos é calculada pelo servidor (hash) e vai no `?v=` do `index.html` e no cache do service worker — toda atualização invalida o cache dos aparelhos automaticamente.
* **Configuração que não se perde:** IP/porta do ProPresenter ficam em `config.json` (fora do Git), sobrevivem a reinícios e atualizações.

### 12. 🛡️ Zero Dependências Externas (Pure Node.js)
* **Sem `npm install`:** Funciona usando apenas as bibliotecas nativas do Node.js (`http`, `fs`, `path`, `os`).
* **Proxy Reverso Embutido:** O app é servido pelo próprio servidor e ele repassa `/api/v1/...` ao ProPresenter (mesma origem, sem CORS aberto), com funcionamento estável no Safari do iPad e no Chrome. Escritas vindas de outra origem são bloqueadas.

---

## 📁 Estrutura de Arquivos

```text
├── server.js                        # Servidor HTTP e proxy reverso local (porta 3000)
├── config.json                      # (gerado) IP/porta do ProPresenter — fora do Git
├── Configurar-Inicio-Automatico.bat # Instala/reaplica o início automático (Executar como Administrador)
├── Atualizar-Controle-Remoto.bat    # Atualiza pelo GitHub, reinicia, confere e volta atrás se falhar
├── Verificar-Controle-Remoto.bat    # Confere servidor, versão, ProPresenter, firewall e início automático
├── Parar-Controle-Remoto.bat        # Encerra SÓ o servidor do controle remoto
├── Desinstalar-Inicio-Automatico.bat# Remove o início automático (mantém os arquivos)
├── Iniciar-Controle-Remoto.bat      # Inicia exibindo o console (teste manual)
├── Iniciar-Segundo-Plano.vbs        # Inicia o servidor invisível (usado pela tarefa agendada)
├── scripts/                         # Instalar-Servico, Atualizar, Verificar, Parar, Firewall (PowerShell)
├── 1-Instalar-NodeJS.bat            # Instalador automático do Node.js LTS
├── Instalar-Skill.bat               # Instala as skills no Antigravity automaticamente
├── PROMPT-PARA-ANTIGRAVITY.txt      # Prompt para carregar no Antigravity
├── COMO-INSTALAR.txt                # Manual rápido de instrução
├── MEMORIA_PROJETO.md               # Registro técnico e memória do projeto
├── README.md                        # Documentação completa da aplicação
├── public/
│   ├── index.html                   # Estrutura HTML da interface e modais
│   ├── css/
│   │   └── style.css                # Estilização completa Dark Mode ProPresenter
│   ├── js/
│   │   └── app.js                   # Lógica de controle, API, PWA e mensagens
│   ├── manifest.json                # Manifesto PWA com suporte a standalone
│   ├── sw.js                        # Service Worker de cache e estabilidade
│   └── icons/                       # Ícones oficiais do ProPresenter em alta resolução
└── skills/
    ├── propresenter-expert/
    │   └── SKILL.md                 # Skill especialista (API, interface, armadilhas do ProPresenter real)
    └── propresenter-remote-install/
        └── SKILL.md                 # Skill de instalação, atualização e reparo
```

---

## 🚀 Como Usar no Dia a Dia

### 1. No Computador do ProPresenter:
* **Instalação (uma vez, como Administrador):** `git clone https://github.com/nicolasdasilvaesilva/propresenter7-remote-web.git C:\ProPresenter-Remote` e depois, no PowerShell como Administrador: `powershell -ExecutionPolicy Bypass -File C:\ProPresenter-Remote\scripts\Instalar-Servico.ps1`. A partir daí o servidor **sobe sozinho quando o Windows liga**.
* **Atualizar:** botão direito em **`Atualizar-Controle-Remoto.bat`** → *Executar como administrador*.
* **Conferir:** **`Verificar-Controle-Remoto.bat`** (mostra também os endereços para o iPad).
* Para testar com a janela de logs: **`Iniciar-Controle-Remoto.bat`**.
* Guia completo: `COMO-INSTALAR.txt`.

### 2. No iPad, Tablet ou Smartphone:
1. Conecte o dispositivo na mesma rede Wi-Fi do computador do ProPresenter.
2. Abra o navegador e acesse o endereço IP informado (ex.: `http://10.0.21.208:3000`).
3. Toque no botão **"Instalar App"** para ver as instruções de fixação na Tela Inicial:
   * **iPad / iPhone:** Toque no ícone de Compartilhar (`⎋`) e escolha **"Adicionar à Tela de Início"**.
   * **Android:** Toque no menu de 3 pontinhos (`⋮`) e escolha **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
4. Abra pelo novo ícone do ProPresenter gerado na sua tela para usar em tela cheia com resposta imediata!

---

## 📡 Endpoints Oficiais do ProPresenter Utilizados (OpenAPI v1)

* `GET /v1/stage/screens` & `GET /v1/stage/screen/{id}/layout/{layout_id}` — Gerenciamento e troca de layout das telas de retorno de palco (individual e em massa).
* `GET /v1/stage/message`, `PUT /v1/stage/message`, `DELETE /v1/stage/message` — Mensagens e avisos exclusivos para os retornos de palco.
* `GET /v1/timers/current` & `GET /v1/timer/{id}/{start|stop|reset|increment}` — Cronômetros de culto em tempo real com controle e acréscimo de tempo.
* `GET /v1/video_inputs` & `GET /v1/video_inputs/{id}/trigger` — Disparo de entradas de vídeo ao vivo (Bíblia Holyrics, iPad, câmeras).
* `GET /v1/props` & `GET /v1/prop/{id}/trigger` — Overlays e adereços de culto (Dízimos, Ofertas, Campanhas).
* `GET /v1/capture/status` & `GET /v1/capture/{start|stop}` — Monitoramento e controle de gravação e transmissão ao vivo.
* `GET /v1/messages` — Lista os templates de mensagens configurados (ex.: CARROS, KIDS).
* `PUT /v1/message/{id}` — Atualiza os tokens e salva os dados no ProPresenter.
* `POST /v1/message/{id}/trigger` — Dispara a mensagem com os tokens preenchidos para os telões.
* `GET /v1/message/{id}/clear` e `GET /v1/clear/layer/messages` — Oculta a mensagem do telão.
* `GET /v1/audio/playlists` & `GET /v1/audio/playlist/{id}` — Navegação de áudio.
* `GET /v1/audio/playlist/{id}/{item_id}/trigger` — Disparo de faixas de áudio.
* `GET /v1/looks` & `GET /v1/look/{id}/trigger` — Gerenciamento e troca de Looks de tela.
* `GET /v1/media/playlists` & `GET /v1/media/playlist/{id}/{media_id}/trigger` — Disparo de mídias e vídeos.
* `GET /v1/playlists` & `GET /v1/presentation/{uuid}/{index}/trigger` — Disparo de cultos e slides.
* `GET /v1/presentation/{uuid}/thumbnail/{index}` — Miniaturas em alta definição dos slides.
* `GET /v1/media/{uuid}/thumbnail` — Miniaturas das mídias.
* `GET /v1/presentation/slide_index` — Sincronização em tempo real do slide ativo no ar.
* `GET /v1/clear/layer/{layer}` & `GET /v1/clear/group/0/trigger` — Limpeza seletiva e blackout.

---

## 🧠 Antigravity Skill
Para carregar esta skill no assistente **Google Antigravity**:
* Execute `Instalar-Skill.bat` (instala as duas skills: `propresenter-expert` e `propresenter-remote-install`), ou
* Copie cada `skills/<nome>/SKILL.md` para `%USERPROFILE%\.gemini\config\skills\<nome>\SKILL.md`.

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

