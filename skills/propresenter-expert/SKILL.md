---
name: propresenter-expert
description: Especialista em automação, integração e controle remoto do ProPresenter 7 via OpenAPI v1 REST API. Guia completo de endpoints (Looks, Mídia/ProContent, Playlists de Culto, Slides, Miniaturas, Triggers, Clear), arquitetura web remota responsiva para iPad/celular, inicialização automática em segundo plano no Windows e PWA.
---

# ProPresenter 7 Expert Skill

Esta skill fornece conhecimento avançado sobre a integração, automação, desenvolvimento e implantação de controladores remotos para o **ProPresenter 7** através da **OpenAPI v1 REST API** oficial.

---

## 1. Conexão e Portas Padrão

* **API REST Oficial (OpenAPI v1):** Porta padrão `50820` (ou configurável no ProPresenter em *Preferências -> Rede*).
* **Documentação Swagger Local:** `http://<IP_DO_PROPRESENTER>:50820/v1/doc/index.html#/`
* **Especificação Swagger JSON:** `http://<IP_DO_PROPRESENTER>:50820/v1/doc/swagger.json` (atribuído como `var openapi_spec = {...}`).
* **Protocolo de Rede:** HTTP simples local (não requer SSL/HTTPS internamente).
* **Regra de CORS:** Navegadores móveis (Safari no iPad, Chrome) bloqueiam requisições diretas de portas diferentes (`Cross-Origin Request Blocked`). Por isso, **sempre utilize um servidor intermediário (Node.js) como Proxy Reverso** para expor a interface web e redirecionar `/api/v1/...` ao ProPresenter com os headers `Access-Control-Allow-Origin: *`.

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
* `GET /v1/presentation/slide_index`: Retorna o slide atualmente no ar (`index`, `presentation_id`, `total_cues`).
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

## 4. Inicialização Automática com o Windows em Segundo Plano (Backend / Silencioso)

Quando o usuário solicitar para a aplicação **iniciar junto com o Windows em segundo plano**, você deve configurar um inicializador **VBScript silencioso** (sem janela preta aberta):

1. **Localização da pasta Inicializar do Windows:**
   `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`
2. **Criação do Script de Inicialização Silenciosa:**
   Criar um arquivo `ProPresenter-Remote-AutoStart.vbs` dentro da pasta `Startup`:
   ```vbscript
   Set WshShell = CreateObject("WScript.Shell")
   WshShell.CurrentDirectory = "C:\caminho\para\propresenter-remote"
   WshShell.Run "node server.js", 0, False
   ```
   *Nota: O parâmetro `0` faz com que o Node.js rode 100% invisível em segundo plano, sem janela de CMD atrapalhando os operadores da igreja.*
3. **Controle Manual:**
   * Iniciar em segundo plano manualmente: `Iniciar-Segundo-Plano.vbs`.
   * Parar o servidor: `taskkill /f /im node.exe` (ou via `Parar-Controle-Remoto.bat`).

---

## 5. Como o Antigravity Deve Configurar uma Nova Máquina

Ao ser acionado em um computador novo onde roda o ProPresenter 7, o agente Antigravity deve executar o seguinte fluxo de forma autônoma:

1. **Instalar Node.js se ausente:**
   ```powershell
   winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent
   ```
2. **Instalar esta Skill globalmente:**
   Copiar este arquivo `SKILL.md` para `%USERPROFILE%\.gemini\config\skills\propresenter-expert\SKILL.md`.
3. **Configurar inicialização automática com o Windows:**
   Executar `Configurar-Inicio-Automatico.bat` ou injetar o VBS na pasta Startup do usuário.
4. **Iniciar o serviço e fornecer o link de rede:**
   Executar `node server.js` ou `Iniciar-Segundo-Plano.vbs` e exibir o endereço IP local (ex.: `http://10.0.21.145:3000`) para o operador abrir no iPad ou smartphone.
