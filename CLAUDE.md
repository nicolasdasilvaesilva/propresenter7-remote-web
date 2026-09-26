# ProPresenter 7 Remote Web — guia para o Claude Code (e outros agentes)

Controle remoto web (iPad/celular/PC) para o **ProPresenter 7**. Servidor Node.js **sem dependências** (`server.js`, porta padrão **3000**) que serve o app (`public/`) e repassa `/api/v1/...` à API oficial do ProPresenter (porta 50820).

## Skills deste projeto (leia antes de agir)
* `skills/propresenter-remote-install/SKILL.md` — **instalar, atualizar, verificar, reparar e desinstalar** (início automático com o Windows, atualização sem cache antigo). Use SEMPRE os scripts de `scripts\`.
* `skills/propresenter-expert/SKILL.md` — API, interface e as **armadilhas confirmadas no ProPresenter real**.
* Para instalar como skills do Claude Code / Antigravity: `Instalar-Skill.bat` (copia para `%USERPROFILE%\.claude\skills` e `%USERPROFILE%\.gemini\config\skills`).

## Local de instalação
Padrão: **`C:\ProPresenter-Remote`**. O `Instalar-Servico.ps1` move a instalação para lá sozinho quando rodado de outra pasta (`-NaoMover` desativa; `-Destino` troca).

## Ambientes
* **Produção:** o próprio computador do ProPresenter (`10.0.21.145`). O servidor roda lá, na porta 3000; os aparelhos abrem `http://10.0.21.145:3000`.
* **Desenvolvimento:** outro computador. Nunca atualize/instale a produção a partir dele: os scripts rodam **no computador onde o app está instalado**.

## Comandos
```powershell
node server.js                                   # roda em primeiro plano (teste)
node --check server.js; node --check public\js\app.js   # checagem de sintaxe (não há testes automatizados)
powershell -ExecutionPolicy Bypass -File scripts\Verificar.ps1   # confere tudo
```
Variáveis: `PORT`, `PRO_HOST`, `PRO_PORT` (ou `config.json`, fora do Git).

## Regras que não podem ser quebradas
1. **Nunca** `taskkill /f /im node.exe` (mata todos os Node). Use `scripts\Parar-Servidor.ps1`.
2. **Stage Display:** enderece as telas **sempre pelo UUID**; a leitura por índice troca as telas 1 e 2 no ProPresenter 21.4.2. Trocas de layout precisam de fila (≥400 ms), leitura de volta e nova tentativa — trocas coladas são ignoradas em silêncio.
3. **Nada de CORS aberto.** O app é servido pelo próprio servidor (mesma origem).
4. **Cache:** a versão dos arquivos é calculada pelo servidor (hash) no `?v=` e no cache do service worker. Não incremente números à mão.
5. Não edite arquivos versionados no computador de produção (bloqueia `git merge --ff-only` da atualização). Configuração local vai em `config.json`.
6. **Testes no ProPresenter real:** comece só com leituras (`GET` sem `trigger`). Nada que mude a saída ao vivo (slide, mídia, look, layout, clear, mensagem, captura, áudio) sem o operador avisar que os telões estão livres.
7. Scripts `.ps1` com acentos precisam de **UTF-8 com BOM** (PowerShell 5.1); JSON gravado pelo PowerShell deve ser **sem BOM**.
8. Instalação para todos os usuários / subir ao ligar o Windows exige terminal **como Administrador**. Não reinicie o Windows sem autorização.
9. Só faça commit/push/release quando o dono pedir.

## Estrutura
`server.js` (servidor, proxy, `config.json`, versão) · `public/` (app: `index.html`, `js/app.js`, `css/style.css`, `service-worker.js`, `manifest.json`) · `scripts/` (PowerShell) · `*.bat` (atalhos para o operador) · `skills/` (skills) · `README.md` (documentação completa).
