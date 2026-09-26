---
name: propresenter-remote-install
description: Instala, atualiza, confere, repara e desinstala o controle remoto web do ProPresenter 7 no computador do ProPresenter (Windows). Faz o app iniciar sozinho quando o Windows liga (para o operador leigo so abrir no iPad/celular), atualiza pelo GitHub sem deixar cache antigo, reinicia e confere no fim, e volta atras sozinho se algo falhar. Funciona no Claude Code e no Google Antigravity. Use quando pedirem para instalar, atualizar, subir versao nova, "o servidor nao iniciou", "o iPad nao abre", "ainda aparece a versao antiga" ou configurar inicio automatico.
---

# ProPresenter Remote — Instalação, Atualização e Reparo

> **Compatível com Claude Code e Antigravity** (mesmo formato `SKILL.md`; instale com `Instalar-Skill.bat`). Nos dois, para instalar para todos os usuários / subir ao ligar o Windows, abra o terminal (ou o próprio Claude Code/Antigravity) **como Administrador**.

Esta skill cuida do **servidor Node.js** do controle remoto (repositório `nicolasdasilvaesilva/propresenter7-remote-web`). O conhecimento da API e da interface está na skill `propresenter-expert`.

## 1. Onde as coisas rodam (importante)

* **Produção:** o computador do próprio ProPresenter, IP `10.0.21.145` (ProPresenter em `127.0.0.1:50820`). O servidor do controle remoto roda **nesse mesmo computador**, na porta **`3000` (padrão; troque com `-Porta` na instalação)**. Os iPads/celulares abrem `http://10.0.21.145:3000`.
* **Desenvolvimento:** outro computador (`10.0.21.208`). Lá só se desenvolve e testa; **nunca atualize a produção pela máquina de desenvolvimento** — os scripts rodam NO computador onde o app está instalado.
* O objetivo é o **operador leigo não precisar fazer nada**: ligou o Windows, o servidor sobe sozinho, o iPad abre.

## 2. Regras de ouro (leia antes de agir)

1. **Sempre use os scripts** da pasta `scripts\` (ou os `.bat` da raiz). Não improvise `taskkill`, não rode `node server.js` em primeiro plano, não edite arquivos versionados no computador de produção.
2. **NUNCA** `taskkill /f /im node.exe`: isso mata **todos** os programas Node da máquina (inclusive as ferramentas do Claude Code / Antigravity). Use `scripts\Parar-Servidor.ps1` (encerra só este servidor).
3. **Para todos os usuários e subir ao ligar o PC, rode o PowerShell como Administrador.** Sem administrador a tarefa só sobe depois do login de UM usuário.
4. Não há cache para "limpar à mão": a **versão dos arquivos é calculada pelo servidor** (hash) e vai no `?v=` do `index.html` e no nome do cache do service worker. Toda atualização muda a versão sozinha. Não incremente números em arquivos.
5. Nunca reinicie o Windows sem pedir autorização do dono (pode ter culto/ensaio).
6. Depois de qualquer ação, **rode a verificação** e mostre o resultado ao dono. Só diga "pronto" com `RESULTADO: tudo certo`.
7. Se a atualização falhar, o script **volta sozinho** para a versão anterior; informe isso e o motivo (`logs\server-erro.log`).

## 3. Os scripts

| Arquivo (raiz) | Faz |
|---|---|
| `Configurar-Inicio-Automatico.bat` → `scripts\Instalar-Servico.ps1` | Node, `config.json`, tarefa agendada, remove o inicializador antigo, firewall, inicia e confere |
| `Atualizar-Controle-Remoto.bat` → `scripts\Atualizar.ps1` | Atualiza pelo GitHub com backup, reinício, conferência e volta atrás automática |
| `Verificar-Controle-Remoto.bat` → `scripts\Verificar.ps1` | Confere tudo (servidor, versão, ProPresenter, início automático, firewall) |
| `Parar-Controle-Remoto.bat` → `scripts\Parar-Servidor.ps1` | Para só o servidor do controle remoto |
| `Desinstalar-Inicio-Automatico.bat` → `scripts\Desinstalar-Servico.ps1` | Remove tarefa, inicializador antigo e regra de firewall (mantém arquivos) |
| `Iniciar-Controle-Remoto.bat` | Roda em primeiro plano (só para teste manual) |

Modo **Administrador**: a tarefa `ProPresenter-Remote` roda como `SYSTEM` **ao ligar o Windows** (atraso de 30 s para a rede), para todos os usuários, sem janela, reiniciando até 5 vezes se cair; cria a regra de firewall `ProPresenter Remote (TCP 3000)` (redes Privada e Domínio) e limpa o inicializador antigo da pasta Inicializar de **todos** os usuários.
Modo **usuário comum**: tarefa só para aquele usuário, ao entrar no Windows.

## 4. Fluxos

### 4.1 Instalação nova (computador do ProPresenter)

Pré-requisitos: Windows 10/11, Git e Node.js 18+ (o script tenta instalar o Node com `winget`; para o Git: `winget install --id Git.Git`).

No **PowerShell como Administrador**:
```powershell
git clone https://github.com/nicolasdasilvaesilva/propresenter7-remote-web.git C:\ProPresenter-Remote
powershell -ExecutionPolicy Bypass -File C:\ProPresenter-Remote\scripts\Instalar-Servico.ps1
```
O **local padrão é sempre `C:\ProPresenter-Remote`**: se o script for rodado de outra pasta ele **move a instalação para lá sozinho** (clona do mesmo GitHub, leva o `config.json` e continua a partir do destino; a pasta antiga não é apagada). Opções: `-Destino <pasta>` (outro local) e `-NaoMover` (instala onde está). O script detecta o ProPresenter neste computador (porta 50820) e grava `127.0.0.1` no `config.json`. Para outro IP/porta: `-ProHost 10.0.21.145 -ProPorta 50820`. Outra porta do servidor: `-Porta 3000`.
Termina rodando a verificação e mostrando os endereços para o iPad.

### 4.2 Migrar uma instalação ANTIGA (pasta `ProPresenter-Remote-Deploy`, VBS na pasta Inicializar)

Na pasta existente, **como Administrador**:
```powershell
cd "<pasta do projeto>"
git pull origin main
powershell -ExecutionPolicy Bypass -File .\scripts\Instalar-Servico.ps1
```
Isso: **move a instalação para `C:\ProPresenter-Remote`**, para o servidor antigo (o `node` da porta 3000), remove o `ProPresenter-Remote-AutoStart.vbs` de todos os usuários, cria a tarefa nova e sobe o servidor. Depois instale as skills novas: `Instalar-Skill.bat`.

### 4.3 Atualização (o que o dono pede: sem cache antigo, reiniciar e conferir)

**Primeira vez após a migração** (a pasta ainda tem os scripts antigos): `git pull origin main` e então o comando abaixo.
Sempre, como Administrador quando a tarefa roda como SYSTEM:
```powershell
powershell -ExecutionPolicy Bypass -File "<pasta>\scripts\Atualizar.ps1"
```
O que o script faz (8 passos, nada é alterado antes da conferência de pré-requisitos):
1. **Pré-checagens** — Git presente, é um repositório, sem alterações locais em arquivos versionados (se houver, para e avisa; `-Forcar` guarda em `git stash`), guarda a versão atual.
2. **Busca no GitHub** (`git fetch`) — se não há versão nova, só confere e sai (`-Sempre` força o ciclo).
3. **Backup** em `..\ProPresenter-Remote-backups\<data-hora>` (mantém 3).
4. **Para só o servidor** do controle remoto.
5. **Atualiza** (`git merge --ff-only`; nunca sobrescreve `config.json`, que fica fora do Git) e apaga restos do método antigo.
6. **Reaplica o início automático** (caminho certo; migra o inicializador antigo).
7. **Inicia** o servidor novo e espera responder.
8. **Confere** tudo. Se qualquer verificação falhar → **volta sozinho** para a versão anterior e sobe o servidor antigo.

**Sobre o cache (o ponto que o dono mais pede):**
* O servidor injeta a versão (hash dos arquivos) no `index.html` (`app.js?v=<hash>`, `style.css?v=<hash>`) e no nome do cache do `service-worker.js`. Versão nova ⇒ o navegador baixa tudo de novo e o service worker **apaga os caches antigos** sozinho.
* A verificação **falha** se a página servida não trouxer a versão atual (ou seja: nenhum cache/arquivo antigo passa despercebido).
* O servidor reinicia, então o índice de músicas em memória também é refeito.
* **Nos aparelhos:** feche o app e abra de novo (ou recarregue 2 vezes). Só se algo antigo insistir: remova o ícone da Tela de Início, limpe os dados do site e adicione de novo pelo endereço `http://10.0.21.145:3000`. Em HTTP puro o service worker não existe (só em HTTPS/localhost), então no iPad/celular o que vale é o `?v=` novo — que já força o download.

### 4.4 Verificação

```powershell
powershell -ExecutionPolicy Bypass -File "<pasta>\scripts\Verificar.ps1"
```
Confere: Node 18+, arquivos, servidor escutando na porta (e sendo **este** servidor), versão dos arquivos, página com a versão atual, service worker com cache atual, ProPresenter alcançável (`/version`), proxy `/api/v1`, `config.json`, tarefa agendada (ao ligar / ao entrar), inicializador antigo, regra de firewall, perfil de rede **Público** (bloqueia conexões de entrada) e imprime os endereços para o iPad. Saída `0` = ok (avisos permitidos), `1` = falha.

### 4.5 Teste "ligou o computador e funcionou"

Só com autorização do dono, num horário livre: reinicie o Windows do computador do ProPresenter, espere ~2 minutos e, de outro aparelho, abra `http://10.0.21.145:3000`. Depois rode a verificação. (Instalação como Administrador sobe **sem login**; sem Administrador só depois do login — nesse caso configure o login automático do Windows, `netplwiz`, com autorização do dono.)

### 4.6 Reparo (sintoma → causa → ação)

| Sintoma | Provável causa | Ação |
|---|---|---|
| iPad não abre a página | Servidor parado, firewall, rede como Pública, IP do PC mudou | `Verificar.ps1`; `Configurar-Inicio-Automatico` como Admin; conferir IP (`ipconfig`), reservar IP fixo no roteador |
| Página abre mas "sem conexão" (bolinha vermelha) | ProPresenter fechado / API desligada / IP/porta errados | Abrir o ProPresenter; Preferências > Rede (API ligada, porta 50820); ajustar em Configurações do app (grava no `config.json`) |
| Versão antiga aparece | Aparelho com cache | Fechar/abrir o app; recarregar 2x; remover atalho e adicionar de novo. No servidor: `Verificar.ps1` deve mostrar "página usa a versão atual" |
| `A porta 3000 já está em uso` | Outra cópia ou outro programa | `Parar-Servidor.ps1`; se persistir, ver quem usa: `Get-NetTCPConnection -LocalPort 3000` |
| Não sobe depois de reiniciar o Windows | Instalado sem Administrador (só sobe após login) ou tarefa ausente | Rodar `Configurar-Inicio-Automatico.bat` como Administrador |
| Atualização "voltou atrás" | A versão nova não subiu/verificou | Ler `logs\server-erro.log`; backup em `..\ProPresenter-Remote-backups` |
| `Ha alteracoes locais` ao atualizar | Alguém editou arquivo versionado | Ver `git status`; `-Forcar` guarda em stash |
| Node não encontrado | Não instalado | O instalador tenta `winget`; senão https://nodejs.org (LTS) |

Logs: `logs\server.log` e `logs\server-erro.log` (o anterior fica em `*.anterior.log`).

### 4.7 Desinstalar / voltar versão

* Desinstalar o início automático: `Desinstalar-Inicio-Automatico.bat` (mantém arquivos e `config.json`).
* Voltar manualmente: parar (`Parar-Servidor.ps1`), copiar o backup mais recente de `..\ProPresenter-Remote-backups\` sobre a pasta (sem apagar `.git` nem `config.json`) e iniciar (`Start-ScheduledTask -TaskName ProPresenter-Remote`).

## 5. Como o servidor guarda a configuração

`config.json` (na pasta do app, **fora do Git**): `{ "port": 3000, "proHost": "127.0.0.1", "proPort": 50820 }`. Prioridade: variável de ambiente (`PORT`, `PRO_HOST`, `PRO_PORT`) > `config.json` > padrão. Mudar o IP/porta do ProPresenter no ícone de engrenagem do app **grava** no `config.json` (sobrevive a reinícios e atualizações). O arquivo precisa ser JSON válido (o servidor aceita com ou sem BOM).

## 6. Endpoints de apoio do servidor

* `GET /api/version` → `{ version, startedAt, pid, node }` (usado na verificação).
* `GET /api/server-info` → `{ proHost, proPort, port, version, ips }`.

## 7. Ao terminar, responda ao dono com

* Versão anterior → nova (commit), o que mudou (assuntos dos commits).
* Resultado da verificação (`tudo certo` ou as falhas).
* Endereço para os aparelhos: `http://10.0.21.145:3000`.
* O que fazer nos aparelhos (fechar/abrir o app).
* Onde está o backup.
