# Enviar Aviso — acesso público (servidor Linux)

Guia pra colocar o "Enviar Aviso" acessível pela internet (4G do estacionamento, sem precisar
estar no Wi-Fi da igreja), rodando numa máquina Linux (Ubuntu) **separada** do computador do
ProPresenter. O computador do ProPresenter não muda nada — continua só com ProPresenter +
mobile/desktop, sem tocar em nada disso.

## Como fica

```
Celular (4G) → Cloudflare (seu domínio) → cloudflared (túnel, no Ubuntu)
             → mensagens-publico.js (Ubuntu, porta 3001 — login + mensagem, tela própria)
                                     → API do ProPresenter (10.0.21.145:50820, pela rede)
```

Só uma peça nova no Ubuntu (o `mensagens-publico.js`) — sem Caddy, sem servidor web
separado. O próprio Node cuida do login (tela bonita, própria, não é o popup feio do
navegador) e das mensagens. Ele não tem NENHUM código de Blackout/Clear geral/playlist/mídia/
macro — só os 4 comandos de mensagem. É por isso que é seguro expor na internet: mesmo que
alguém quebre o login, o pior que consegue fazer é mexer numa mensagem de telão.

Cada usuário só vê e só consegue mexer no(s) modelo(s) de mensagem mapeados pra ele
(`mensagens-publico-config.json`) — testado e confirmado que um login não alcança a mensagem
de outro, mesmo tentando forçar a chamada direto na API.

## Pré-requisitos

- Um computador/servidor Ubuntu (ou Raspberry Pi com Ubuntu/Debian) **ligado o tempo todo** e
  na mesma rede da igreja (precisa alcançar `10.0.21.145:50820` pela rede local).
- Uma conta Cloudflare com um domínio seu já cadastrado lá.

## Passo 1 — Copiar os arquivos pro Ubuntu

Só precisa destes arquivos/pastas do repositório (não precisa do resto do projeto):

```
mensagens-publico.js
public-mensagens/
public/css/style.css
public/img/
config.json                      (só com proHost/proPort — copie do computador do ProPresenter)
mensagens-publico-config.json    (usuários e senhas — NUNCA commitar isso)
```

```bash
sudo mkdir -p /opt/propresenter-remote
sudo chown $USER:$USER /opt/propresenter-remote
# copie os arquivos acima pra /opt/propresenter-remote (scp, pendrive, git clone + copiar, etc.)
```

## Passo 2 — Instalar o Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # confirma que instalou
```

> Se o `apt update` reclamar de uma chave GPG do repositório do `cloudflared` (acontece se
> você já instalou o cloudflared antes por `.deb` avulso, sem o repositório oficial), ignore —
> não afeta a instalação do Node. O script do NodeSource pode cair pro Node da distro (18.x) se
> isso travar o `apt update`; tudo bem, o projeto funciona com Node 18+.

## Passo 3 — Criar o admin, as senhas e montar o config

**3.1 — Crie a senha do painel admin** (usuário fixo `admin` — é dali que você cria/edita/
remove os outros usuários depois, pelo navegador, sem precisar editar arquivo):

```bash
cd /opt/propresenter-remote
node mensagens-publico.js --criar-admin "uma-senha-forte-sua"
```

Isso já cria o `mensagens-publico-config.json` com a seção `admin` preenchida.

**3.2 — Gere as senhas dos usuários que mandam mensagem** (pode pular isso e criar todos pelo
painel admin depois — veja o Passo 4 — mas se preferir deixar pronto por aqui):

```bash
node mensagens-publico.js --gerar-senha "cs7ytVZXgrGJRt"    # estacionamento
node mensagens-publico.js --gerar-senha "YgmMsPnrTRY5bL"    # kids
node mensagens-publico.js --gerar-senha "C7zjteh6K4j29v"    # espacoconexao
```

Cada comando devolve um texto tipo `salt:hash`. Edite `mensagens-publico-config.json` e cole
cada hash no lugar de `senhaHash` do usuário correspondente (veja o formato em
`mensagens-publico-config.exemplo.json`).

> Pra trocar qualquer senha depois, o jeito mais fácil é pelo painel admin (`/admin`, botão
> "Editar" → "Nova senha" → "Gerar"). Também dá pra fazer na mão com `--gerar-senha` + editar o
> arquivo — nenhum dos dois precisa reiniciar o serviço.

## Passo 4 — Testar o servidor

```bash
node mensagens-publico.js
```

Deve aparecer "ENVIAR AVISO (SERVIDOR ISOLADO) INICIADO!" e os 3 usuários configurados. Abra
`http://IP-DO-UBUNTU:3001/login` num navegador na mesma rede — deve aparecer a tela de login
("Enviar Aviso", usuário e senha). Entre com um dos logins e confirme que só aparece o modelo
certo pra cada um. Pare com Ctrl+C quando confirmar.

## Passo 5 — Instalar como serviço permanente

**Importante:** crie um usuário **dedicado, sem sudo e sem senha** só pra rodar esse serviço —
nunca use seu próprio usuário de login (mesmo que ele pareça "só" ter acesso normal, se ele
tiver `sudo`, qualquer bug de segurança no código um dia poderia escalar pra root da máquina
inteira; com um usuário dedicado sem privilégio nenhum, o estrago fica limitado a mexer numa
mensagem de telão, o pior que esse código consegue fazer por design).

```bash
sudo useradd -r -s /usr/sbin/nologin mensagens-publico
sudo chown -R mensagens-publico:mensagens-publico /opt/propresenter-remote
sudo cp scripts/mensagens-publico.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mensagens-publico
sudo systemctl status mensagens-publico
```

O arquivo de serviço já vem com um hardening extra do systemd (`NoNewPrivileges`,
`ProtectSystem=strict`, `ProtectHome`, `PrivateTmp`) — reduz ainda mais o que o processo
consegue tocar no sistema, mesmo que seja comprometido. Testado e confirmado que não impede o
servidor de ler/gravar o próprio `mensagens-publico-config.json` (é por isso que
`ReadWritePaths` libera só a pasta do app).

Ver logs a qualquer momento: `sudo journalctl -u mensagens-publico -f`

## Passo 6 — Instalar e configurar o túnel Cloudflare

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

cloudflared tunnel login          # abre um link pra você autorizar no navegador
cloudflared tunnel create avisos-igreja
cloudflared tunnel route dns avisos-igreja avisos.SEUDOMINIO.com.br
```

Crie `/etc/cloudflared/config.yml`:

```yaml
tunnel: avisos-igreja
credentials-file: /root/.cloudflared/<ID-DO-TUNEL>.json

ingress:
  - hostname: avisos.SEUDOMINIO.com.br
    service: http://localhost:3001
  - service: http_status:404
```

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

## Passo 7 — Testar de fora, pelo 4G

Desligue o Wi-Fi do celular (deixe só o 4G) e acesse `https://avisos.SEUDOMINIO.com.br` — deve
aparecer a tela de login. Entre com o usuário/senha e confirme que só o modelo certo aparece.

## Gerenciando usuários pelo painel admin

Depois de criar o admin (Passo 3.1), acesse `https://SEUDOMINIO/admin` com a senha de admin.
De lá dá pra, sem precisar de SSH:
- Criar um usuário novo (login, senha — ou "Gerar" uma forte automática — e quais modelos ele
  pode enviar).
- Editar um usuário existente: trocar os modelos permitidos e/ou a senha.
- Remover um usuário (derruba a sessão dele na hora, se tiver alguma aberta).
- Trocar a sua própria senha de admin (botão "Trocar minha senha" no topo).

## Segurança — o que já está garantido e o que fica com você

- Senhas nunca ficam em texto puro — são guardadas como hash (scrypt), gerado com
  `--gerar-senha`/`--criar-admin` ou pelo próprio painel admin. O servidor bloqueia por 15
  minutos depois de 5 tentativas erradas seguidas do mesmo IP (login normal e admin).
- Cada login só alcança o(s) modelo(s) mapeado(s) pra ele — confirmado com teste automatizado
  que um login não consegue disparar/limpar a mensagem de outro, mesmo forçando a chamada.
- Login normal e login de admin são sessões **completamente separadas** (cookies diferentes) —
  uma nunca vira a outra. Trocar uma senha (via painel ou por `--gerar-senha`/`--criar-admin`)
  derruba na hora qualquer sessão aberta com a senha antiga.
- O serviço roda com um usuário **dedicado e sem sudo** (Passo 5) — mesmo no pior cenário
  (um bug de segurança no código), o estrago máximo possível é mexer numa mensagem de telão,
  nunca virar root da máquina. O hardening do systemd (`ProtectSystem=strict` e companhia)
  reduz ainda mais o que o processo consegue tocar no sistema.
- Troque as senhas geradas quando quiser. Nunca reaproveite uma senha de outro sistema aqui,
  já que essa fica exposta na internet.
- `config.json` e `mensagens-publico-config.json` NUNCA vão pro Git (já estão no
  `.gitignore`) — contêm dados sensíveis.
- **Pendências conhecidas, sem risco imediato:** não existe log de quem enviou qual mensagem e
  quando; o `/admin` fica no mesmo domínio público (exposto a qualquer um tentar a senha, ainda
  que com o bloqueio por tentativas).
