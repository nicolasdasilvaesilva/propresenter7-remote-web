# HTTPS no computador do ProPresenter (pra instalar o app no celular)

O Android/Chrome só mostra o botão "Instalar aplicativo" (PWA) em páginas servidas por HTTPS.
Hoje o controle remoto roda só em HTTP (`http://10.0.21.145:3000`), por isso o Chrome recusa
instalar. Este guia resolve isso com um certificado SSL **de verdade**, sem expor nada à
internet — o domínio só funciona de dentro da rede da igreja.

## Como fica

```
control.SEUDOMINIO.com.br  →  (DNS, "apenas DNS"/sem proxy)  →  10.0.21.145 (IP interno)
```

De fora da rede da igreja, esse domínio nem conecta (é um IP privado, não roteável pela
internet) — só funciona pra quem está no Wi-Fi/rede local. O certificado em si é público e
confiável (emitido pela Let's Encrypt), então o navegador não reclama de "site não seguro".

## Pré-requisito (já feito, se você seguiu os passos anteriores)

- Registro DNS no Cloudflare: `control.SEUDOMINIO.com.br` → tipo **A** → `10.0.21.145`, com o
  proxy (nuvem) **desligado** ("Apenas DNS"). Se o IP for privado, o Cloudflare geralmente já
  desliga sozinho e mostra "IP reservado".
- Um **Token de API do Cloudflare** com permissão só de **editar DNS** da zona do seu domínio
  (Perfil → API Tokens → Create Token → modelo "Edit zone DNS", restrito ao seu domínio).
  **Nunca** cole esse token num arquivo do projeto nem me envie — cole ele só quando o
  win-acme pedir, na hora, no passo abaixo (ele guarda criptografado, sozinho).

## Passo 1 — Instalar o win-acme

No computador do ProPresenter (como Administrador):

1. Baixe a versão mais recente em <https://www.win-acme.com/> (botão "Download", pegue o
   `.zip` "trimmed, no self-upgrade" — é o menor e já serve).
2. Extraia pra uma pasta fixa, ex.: `C:\win-acme\`.
3. Abra um PowerShell **como Administrador** nessa pasta e rode:
   ```powershell
   .\wacs.exe
   ```

## Passo 2 — Pedir o certificado (assistente interativo)

O `wacs.exe` abre um menu. Siga assim:

1. Digite **N** (Create certificate — full options).
2. **Manual input** — digite o host: `control.SEUDOMINIO.com.br` (troque pelo seu domínio
   real).
3. Quando perguntar o método de validação, escolha **DNS validation** → **Cloudflare**.
   - Se for a primeira vez, ele pede pra instalar o plugin da Cloudflare — aceite (`Y`).
   - Quando pedir a **API Token**, cole o token que você gerou no Passo 0. Essa é a única vez
     que você digita ele — o win-acme guarda criptografado (DPAPI do Windows), nunca em texto
     puro.
4. Quando perguntar onde **salvar o certificado** ("Store"), escolha **PEM encoded files**
   (`PemFiles`) e informe uma pasta, ex.: `C:\ProPresenter-Remote\certs`.
5. Pros passos seguintes (CSR, Private Key, Installation), pode aceitar os padrões (Enter).
6. Confirme no fim. Se der tudo certo, aparecem dois (ou mais) arquivos `.pem` na pasta que
   você escolheu — não precisa saber o nome exato, o `server.js` acha sozinho (procura por
   "fullchain/chain/cert" e "privkey/key" no nome do arquivo).

## Passo 3 — Configurar o renovar automático pra reiniciar o app

O win-acme já cria uma Tarefa Agendada própria que renova sozinho (a cada ~60 dias, antes do
certificado de 90 dias vencer). Só falta avisar o nosso app quando um certificado novo chegar
— ele só lê o certificado na hora que liga, não percebe sozinho uma renovação em segundo plano.

No mesmo assistente (ou rodando `wacs.exe` → **M** → Manage renewals → escolha o certificado
→ **Edit**), em **Installation**, adicione um passo **Script**, apontando pro
`Atualizar-Controle-Remoto.bat` do controle remoto (ou, mais simples, só reinicie o serviço):

```powershell
Restart-ScheduledTask -TaskName "ProPresenter-Remote"
```

> Se preferir, pode simplesmente lembrar de reiniciar o controle remoto manualmente a cada
> ~2 meses (`Parar-Controle-Remoto.bat` + `Iniciar-Controle-Remoto.bat`) — o certificado válido
> dura 90 dias, então tem folga.

## Passo 4 — Apontar o `config.json` pro certificado

Edite `config.json` (na pasta do controle remoto) e adicione:

```json
{
  "proHost": "10.0.21.145",
  "proPort": 50820,
  "httpsPort": 443,
  "httpsCertDir": "C:\\ProPresenter-Remote\\certs"
}
```

> `httpsPort: 443` é a porta HTTPS padrão (sem precisar digitar `:443` na URL) — como o
> controle remoto já roda com privilégio de Administrador (Tarefa Agendada), não tem problema
> usar essa porta. Se preferir testar numa porta alternativa antes, use algo como `8443`.

Rode `Atualizar-Controle-Remoto.bat` (ou reinicie o serviço) pra aplicar. No log de início,
deve aparecer uma linha:

```
[HTTPS] Também disponível em https://control.SEUDOMINIO:443 (porta 443, certificado em ...)
```

Se aparecer "mas não achei os arquivos de certificado lá ainda", confira se a pasta em
`httpsCertDir` é exatamente a mesma que você escolheu no Passo 2.

## Passo 5 — Testar e instalar no celular

De **dentro da rede da igreja**, no navegador do celular, acesse:

```
https://control.SEUDOMINIO.com.br
```

Deve abrir normal, com o cadeado de "conexão segura" (sem aviso nenhum). Agora o Chrome deve
oferecer "Instalar aplicativo" — e o Safari do iPhone também passa a aceitar "Adicionar à Tela
de Início" com ícone cheio (antes já funcionava, mas sem alguns recursos que dependem de
HTTPS).

**Importante:** o endereço antigo (`http://10.0.21.145:3000`) continua funcionando
exatamente igual — essa mudança só *adiciona* o acesso por HTTPS, não tira nada que já existia.
