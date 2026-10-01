---
name: propresenter-https-ssl
description: Configura HTTPS opcional no controle remoto do ProPresenter 7 (computador do ProPresenter), usando win-acme + certificado real da Let's Encrypt via desafio DNS da Cloudflare, para liberar o botão "Instalar aplicativo" (PWA) no Chrome do celular/iPad sem expor nada à internet. Funciona no Claude Code e no Google Antigravity. Use quando pedirem para "instalar certificado", "configurar SSL/HTTPS", "o Chrome não deixa instalar o app", "gerar certificado com win-acme" ou "renovar certificado".
---

# ProPresenter Remote — HTTPS opcional (win-acme + Cloudflare DNS)

> **Compatível com Claude Code e Antigravity** (mesmo formato `SKILL.md`; instale com `Instalar-Skill.bat`). Esta skill cuida só do **certificado e da configuração HTTPS**. Instalação/atualização do servidor em si é a skill `propresenter-remote-install`; conhecimento da API é a `propresenter-expert`.

## 1. Por que isso existe

O Android/Chrome só mostra o botão **"Instalar aplicativo"** (PWA) em páginas servidas por HTTPS. O controle remoto roda em HTTP puro na rede da igreja (`http://10.0.21.145:3000`), e o Chrome recusa instalar o app nesse endereço. Esta skill resolve isso com um certificado SSL **de verdade** (emitido pela Let's Encrypt), **sem expor nada à internet**.

## 2. A técnica (entenda antes de mexer)

```
control.SEUDOMINIO.com.br  →  DNS tipo A, proxy do Cloudflare DESLIGADO  →  10.0.21.145 (IP interno)
```

Um domínio público aponta pra um **IP privado**. De fora da rede da igreja, o domínio resolve mas não conecta (IP privado não é roteável pela internet) — só funciona pra quem está no Wi-Fi/rede local. O certificado em si é público e confiável, então o navegador não reclama de "site não seguro". Isso é **diferente** de expor o app à internet: o app principal (Blackout/Clear/playlist) nunca teve login, então NUNCA deve ficar acessível de fora da rede local — só o certificado é "real", o acesso continua só local.

**Nunca confunda com o acesso público do "Enviar Aviso"** (`mensagens-publico.js`, servidor Linux separado, com login e Cloudflare Tunnel de verdade) — são arquiteturas diferentes para necessidades diferentes. Se o pedido for "quero acessar de fora da rede", isso é outro projeto (servidor isolado com login), não esta skill.

## 3. Pré-requisitos

* Registro DNS no Cloudflare: `control.SEUDOMINIO.com.br` → tipo **A** → IP interno do computador do ProPresenter, com o proxy (nuvem laranja) **desligado** ("Apenas DNS"). Se o IP for privado/reservado, o Cloudflare geralmente desliga o proxy sozinho.
* Um **Token de API do Cloudflare** com permissão **só de editar DNS** da zona do domínio (perfil → API Tokens → Create Token → modelo "Edit zone DNS", restrito à zona). **Nunca** peça esse token pro usuário em texto no chat nem grave em arquivo do projeto — ele cola direto no prompt do win-acme, que guarda criptografado (DPAPI do Windows).
* O servidor (`server.js`) precisa ter suporte a HTTPS — isso já está no repositório desde a v1.5.7 (listener HTTPS opcional, só liga se `httpsCertDir` existir no `config.json`). Se a produção estiver numa versão anterior, rode a skill `propresenter-remote-install` primeiro (`Atualizar-Controle-Remoto.bat`).

## 4. Passo a passo

1. **Instalar o win-acme**: baixar em <https://www.win-acme.com/> (zip "trimmed, no self-upgrade"), extrair pra `C:\win-acme\`, abrir PowerShell **como Administrador** nessa pasta, rodar `.\wacs.exe`.
2. **Pedir o certificado** (assistente interativo): `N` (Create certificate — full options) → **Manual input** → digitar `control.SEUDOMINIO.com.br` → validação **DNS** → **Cloudflare** (aceitar instalar o plugin se pedir) → colar o **token** quando pedir (única vez) → **Store**: `PemFiles` → escolher uma pasta fixa (ex. `C:\ProPresenter-Remote\certs`) → aceitar os padrões do resto.
3. **Renovação automática**: o win-acme já cria sua própria Tarefa Agendada (renova sozinho a cada ~60 dias). Adicionar um passo **Script** no mesmo assistente (`wacs.exe` → `M` → Manage renewals → Edit → Installation) rodando `Restart-ScheduledTask -TaskName "ProPresenter-Remote"` — sem isso, o app não vai perceber um certificado renovado em segundo plano (só lê o certificado quando liga).
4. **Configurar o `config.json`** do controle remoto:
   ```json
   {
     "httpsPort": 443,
     "httpsCertDir": "C:\\ProPresenter-Remote\\certs"
   }
   ```
   (mantenha as chaves já existentes, como `proHost`/`proPort` — só adicione estas duas.) Rodar `Atualizar-Controle-Remoto.bat` (ou reiniciar o serviço) pra aplicar.
5. **Conferir o log de início**: deve aparecer `[HTTPS] Também disponível em https://control.SEUDOMINIO:443...`. Se aparecer "mas não achei os arquivos de certificado lá ainda", confirme se `httpsCertDir` é exatamente a mesma pasta escolhida no Passo 2.
6. **Testar de dentro da rede da igreja**: `https://control.SEUDOMINIO.com.br` deve abrir com cadeado, sem aviso. O Chrome deve oferecer "Instalar aplicativo"; o Safari do iPhone aceita "Adicionar à Tela de Início" com ícone cheio.

O endereço antigo (`http://10.0.21.145:3000`) continua funcionando normalmente — isso só **adiciona** HTTPS, nunca tira o que já existia.

## 5. Armadilhas já encontradas (leia antes de debugar do zero)

* **`config.json` com JSON inválido falha CALADO**: o `loadConfig()` do `server.js` engole qualquer erro de `JSON.parse` e volta pros valores padrão, sem avisar nada. Se o log não mostrar a linha `[HTTPS]` mesmo com as chaves configuradas, a primeira suspeita é um JSON mal formado (vírgula sobrando, barra invertida sem escapar) — valide o arquivo num validador de JSON antes de desconfiar do resto.
* **MSYS2/Git Bash reescreve caminhos**: se for gerar um certificado de teste com `openssl req -subj "/CN=..."` nesse terminal, prefixe com `MSYS_NO_PATHCONV=1` — senão o Git Bash converte `/CN=...` num caminho de arquivo do Windows.
* **Nome dos arquivos do certificado varia por ferramenta**: o `server.js` procura por substring (`fullchain`/`chain`/`crt`/`cert` pro certificado, `privkey`/`key` pra chave), não por nome exato — então não assuma uma convenção fixa se for inspecionar a pasta manualmente.
* **Porta 443 exige execução com privilégio** (a tarefa agendada do controle remoto já roda como `SYSTEM`/Administrador, então normalmente não é problema). Pra testar numa porta alternativa sem Admin, use algo como `8443` em `httpsPort` antes de ir pra 443 definitivo.
* **Nunca envie o token do Cloudflare em texto** (chat, commit, arquivo de config) — só no prompt interativo do win-acme.
* **Isso não é acesso remoto**: depois de configurado, o domínio `control.SEUDOMINIO.com.br` continua só acessível de dentro da rede da igreja (IP privado, não roteável). Se alguém pedir acesso de fora, isso é outro projeto — ver seção 2.
