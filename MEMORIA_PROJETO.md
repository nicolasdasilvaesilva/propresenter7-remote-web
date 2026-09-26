# 🧠 Memória Persistente do Projeto: ProPresenter 7 Remote

**Última atualização:** 24/09/2026  
**Status:** Concluído para validação amanhã.

---

## 📌 Contexto Geral
- **Aplicação:** Controle Remoto PWA Web para ProPresenter 7.
- **Ambiente:** Node.js Nativo (sem dependências externas) na porta `3000`.
- **IP ProPresenter:** `10.0.21.145:50820`.
- **IP Servidor Local:** `10.0.21.208:3000`.

---

## 🚀 O Que Foi Implementado Hoje (24/09/2026)

### 1. Módulo de Mensagens no Telão (Padrão Oficial ProPresenter 7)
- **Design Nativo:** Replicado fielmente o painel de mensagens do ProPresenter (`/v1/control`):
  - Cabeçalho Dropdown: `[ ➤ CARROS ↕ ]` com marcas de seleção `✓`.
  - Caixa de template com variáveis (`{MARCA}`, `{COR}`, `{PLACA}`).
  - Linhas de Tokens no formato oficial com etiqueta `Value: [ input ]`.
  - Tecla `Enter` envia diretamente de qualquer campo.
  - Botões `Clear` e `Show`.
- **Comunicação Dupla via API:**
  - `PUT /v1/message/${uuid}` para salvar os tokens no ProPresenter.
  - `POST /v1/message/${uuid}/trigger` com payload `[{ name, text: { text } }]` para acionar imediatamente a projeção.
  - `GET /v1/message/${uuid}/clear` e `GET /v1/clear/layer/messages` para limpar.
- **Configuração de Telas da Igreja:**
  - `Screen 0 (APHA-ATEM)`: camada de mensagens está desligada nos Looks do ProPresenter.
  - `Screen 1 e 2 (RESOLUME NDI 1 e 2)`: camada de mensagens ativa (é aqui que o teste deve ser conferido).

### 2. PWA Universal (iPad, iPhone, Android e Desktop)
- Modal com abas inteligentes que detectam o sistema operacional do usuário:
  - **iPad/iOS:** Instruções para tocar em *Compartilhar* (`⎋`) e *Adicionar à Tela de Início* (`➕`).
  - **Android:** Instruções para tocar nos 3 pontinhos (`⋮`) e *Instalar aplicativo*.
  - **Desktop:** Botão de instalação direta.
- Botão de instalação presente tanto no menu superior quanto na barra de navegação mobile.
- Ajuste de `z-index` (999999) para evitar sobreposição ou cortes no iPad Safari.

### 3. Usabilidade
- Barra de espaço liberada para digitação livre na pesquisa de músicas (sem passar slides acidentalmente).
- Reposicionamento via portal/fixed dos menus suspensos de Looks e Clear.

---

## ⏳ Pendências para Amanhã (Primeira Coisa ao Iniciar)

1. **Testar no iPad físico:**
   - Abrir no Safari: `http://10.0.21.208:3000`
   - Testar o fluxo de "Adicionar à Tela de Início".
2. **Testar Envio de Mensagem:**
   - Abrir pop-up, preencher dados do carro e clicar em `Show`.
   - Verificar nos telões (Resolume NDI 1 e 2).
   - Clicar em `Clear` e conferir a remoção da mensagem.
3. **Git Push:**
   - Ir até `scratch/ProPresenter-Remote-Deploy` e executar:
     ```bash
     git add .
     git commit -m "feat: native message modal and universal PWA installation"
     git push origin main
     ```


---
## Retomada 27/09/2026
Ler primeiro: `PAUSA-26-09-2026-CORRECOES-E-SKILL-INSTALACAO.md` (correcoes feitas, teste no servidor real e skill de instalacao a criar).
