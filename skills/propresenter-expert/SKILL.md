---
name: propresenter-expert
description: Especialista em automação, integração e controle remoto do ProPresenter 7 via OpenAPI v1 REST API. Guia completo de endpoints (Looks, Mídia/ProContent, Playlists de Culto, Slides, Miniaturas, Triggers, Clear), arquitetura web remota responsiva para iPad/celular e solução de problemas.
---

# ProPresenter 7 Expert Skill

Esta skill fornece conhecimento avançado sobre a integração, automação e desenvolvimento de controladores remotos para o **ProPresenter 7** através da **OpenAPI v1 REST API** oficial.

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

## 3. Arquitetura Recomendada para o Controle Remoto Web

1. **Backend (Node.js Nativo):**
   * Servidor HTTP ultra-leve (`http`, `fs`, `path`, `os`), sem necessidade de `npm install`.
   * Proxy reverso transparente: todas as chamadas em `/api/v1/...` são encaminhadas internamente para `http://localhost:50820/v1/...`.
   * Detecção automática dos IPs locais da máquina para exibição fácil no terminal e no modal de configurações.

2. **Frontend Responsivo (Mobile + iPad/Tablet):**
   * **Modo Celular (< 768px):** Layout em coluna única com *Preview* de 16:9 no topo, botões de transporte grandes (`<<` e `>>`) e lista vertical de itens com destaque ativo em azul ProPresenter (`#2563eb`).
   * **Modo Tablet / iPad (>= 768px):** Layout Split View em duas colunas:
     * Coluna Esquerda: Preview grande ao vivo, transporte e lista de itens da playlist/pasta.
     * Coluna Direita: Grade/lista com todos os slides ou mídias individuais da pasta em alta definição, com badge `AO VIVO` e disparo por toque direto.
   * **Suporte a PWA / Tela Cheia:** Tags `apple-mobile-web-app-capable` para permitir "Adicionar à Tela de Início" no iPadOS e rodar sem barras de navegador.

---

## 4. Checklist para Instalação em Nova Máquina

1. **Pré-requisitos no computador:**
   * ProPresenter 7 instalado e rodando com a opção **Rede** ativada nas preferências (porta padrão `50820`).
   * Node.js instalado (v18 ou superior).
2. **Execução:**
   * Rodar `node server.js` ou dar dois cliques em `Iniciar-Controle-Remoto.bat`.
   * Acessar no navegador do PC em `http://localhost:3000` ou no iPad/tablet em `http://<IP_DO_PC>:3000`.
3. **Firewall do Windows:**
   * Permitir entrada na porta TCP `3000` na rede local para liberar o acesso de tablets e smartphones.
