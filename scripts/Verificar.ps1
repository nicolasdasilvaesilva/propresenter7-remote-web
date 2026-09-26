# Confere se o controle remoto esta 100% (servidor, versao, ProPresenter, inicio automatico, firewall).
# Codigo de saida: 0 = tudo certo (avisos permitidos), 1 = alguma FALHA.
param([string]$Dir = (Split-Path -Parent $PSScriptRoot), [int]$Porta = 0, [string]$NomeTarefa = 'ProPresenter-Remote', [switch]$SemTarefa)
. "$PSScriptRoot\_comum.ps1"

if ($Porta -le 0) { $Porta = Get-PortaConfigurada $Dir }
$falhas = 0; $avisos = 0
function Ok($t)    { Write-Ok $t }
function Aviso($t) { $script:avisos++; Write-Aviso $t }
function Falha($t) { $script:falhas++; Write-Falha $t }

Write-Host "Verificando o ProPresenter 7 Remote em: $Dir (porta $Porta)" -ForegroundColor Cyan

# 1. Node.js
$node = Get-NodePath
if ($node) {
    $v = (& $node -v)
    if ([int]($v.TrimStart('v').Split('.')[0]) -ge 18) { Ok "Node.js $v  ($node)" } else { Falha "Node.js $v e antigo (precisa 18 ou superior; o app usa fetch nativo)" }
} else { Falha 'Node.js nao encontrado' }

# 2. Arquivos
foreach ($f in 'server.js', 'public\index.html', 'public\js\app.js', 'public\service-worker.js') {
    if (-not (Test-Path (Join-Path $Dir $f))) { Falha "Arquivo ausente: $f" }
}
if ($falhas -eq 0) { Ok 'Arquivos do app presentes' }

# 3. Porta / processo
$procs = Get-ProcessosServidor $Dir $Porta
if ($procs) { Ok "Servidor rodando (PID $($procs[0].ProcessId)) e escutando na porta $Porta" }
elseif (Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue) { Falha "A porta $Porta esta ocupada por OUTRO programa (nao e este servidor)" }
else { Falha "Servidor NAO esta rodando (nada escutando na porta $Porta)" }

# 4. Versao e pagina
$ver = $null
$r = Invoke-Http "http://127.0.0.1:$Porta/api/version"
if ($r.Ok) {
    $ver = $r.Corpo | ConvertFrom-Json
    Ok "Servidor responde. Versao dos arquivos: $($ver.version) | iniciado em $($ver.startedAt)"
    $idx = Invoke-Http "http://127.0.0.1:$Porta/"
    if ($idx.Ok -and $idx.Corpo -match "app\.js\?v=$($ver.version)" -and $idx.Corpo -match "style\.css\?v=$($ver.version)") { Ok 'A pagina inicial usa a versao atual (nao serve cache antigo)' }
    else { Falha 'A pagina inicial NAO traz a versao atual dos arquivos (possivel cache/versao antiga)' }
    $sw = Invoke-Http "http://127.0.0.1:$Porta/service-worker.js"
    if ($sw.Ok -and $sw.Corpo -match "propresenter-remote-$($ver.version)") { Ok 'Service worker com cache da versao atual (caches antigos serao apagados nos aparelhos)' }
    else { Aviso 'Service worker sem o nome de cache da versao atual' }
} else { Falha "Nao consegui abrir http://127.0.0.1:$Porta/api/version" }

# 5. ProPresenter
if ($ver) {
    $info = (Invoke-Http "http://127.0.0.1:$Porta/api/server-info")
    if ($info.Ok) {
        $cfg = $info.Corpo | ConvertFrom-Json
        $pp = Invoke-Http "http://$($cfg.proHost):$($cfg.proPort)/version" 4
        if ($pp.Ok) { $j = $pp.Corpo | ConvertFrom-Json; Ok "ProPresenter alcancavel em $($cfg.proHost):$($cfg.proPort)  ($($j.host_description))" }
        else { Falha "ProPresenter NAO respondeu em $($cfg.proHost):$($cfg.proPort). Abra o ProPresenter e confira Preferencias > Rede (API ligada, porta)" }
        $px = Invoke-Http "http://127.0.0.1:$Porta/api/v1/looks" 6
        if ($px.Ok) { Ok 'O servidor consegue falar com o ProPresenter (proxy /api/v1 ok)' } else { Aviso "Proxy /api/v1/looks respondeu $($px.Status)" }
    }
}

# 6. Configuracao
if (Test-Path (Join-Path $Dir 'config.json')) { Ok 'config.json presente (IP/porta do ProPresenter ficam guardados)' } else { Aviso 'Sem config.json: o IP do ProPresenter volta ao padrao ao reiniciar (rode o Configurar-Inicio-Automatico)' }

# 7. Inicio automatico
if (-not $SemTarefa) {
    $t = Get-ScheduledTask -TaskName $NomeTarefa -ErrorAction SilentlyContinue
    if ($t) {
        $temBoot  = [bool]($t.Triggers | Where-Object { $_.CimClass.CimClassName -match 'Boot' })
        $temLogon = [bool]($t.Triggers | Where-Object { $_.CimClass.CimClassName -match 'Logon' })
        if ($temBoot) { Ok "Tarefa agendada '$NomeTarefa' existe: inicia ao LIGAR o Windows (sem login, todos os usuarios) e reinicia se falhar. Estado: $($t.State)" }
        elseif ($temLogon) { Ok "Tarefa agendada '$NomeTarefa' existe: inicia ao ENTRAR no Windows como $($t.Principal.UserId). Estado: $($t.State)"; Aviso 'So sobe depois do login. Rode Configurar-Inicio-Automatico como Administrador para subir ao ligar o PC.' }
        else { Aviso "Tarefa '$NomeTarefa' existe mas sem gatilho de inicio" }
    } else { Falha "Tarefa agendada '$NomeTarefa' NAO existe: o servidor nao sobe sozinho ao ligar o PC (rode Configurar-Inicio-Automatico.bat)" }
    $legado = Join-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup" 'ProPresenter-Remote-AutoStart.vbs'
    if (Test-Path $legado) { Aviso 'Existe o inicializador ANTIGO na pasta Inicializar (rode Configurar-Inicio-Automatico.bat para migrar)' }
}

# 8. Firewall e perfil de rede
$regra = Get-NetFirewallRule -Direction Inbound -Enabled True -Action Allow -ErrorAction SilentlyContinue | Where-Object {
    ($_ | Get-NetFirewallPortFilter -ErrorAction SilentlyContinue | Where-Object { $_.Protocol -eq 'TCP' -and ($_.LocalPort -eq "$Porta") }) -or
    ($_ | Get-NetFirewallApplicationFilter -ErrorAction SilentlyContinue | Where-Object { $_.Program -like '*\node.exe' })
}
if ($regra) { Ok 'Firewall do Windows permite conexoes de entrada para o servidor' }
else { Aviso "Nenhuma regra de firewall liberando a porta $Porta / node.exe: o iPad pode nao conectar (Configurar-Inicio-Automatico.bat cria a regra)" }
$perfis = Get-NetConnectionProfile -ErrorAction SilentlyContinue | Where-Object { $_.IPv4Connectivity -ne 'Disconnected' }
foreach ($p in $perfis) { if ($p.NetworkCategory -eq 'Public') { Aviso "A rede '$($p.Name)' esta como PUBLICA: o Windows bloqueia conexoes de entrada. Mude para Privada." } }

# 9. Enderecos
$ips = @(Get-IPsLocais)
if ($ips.Count) { Write-Host ""; Write-Host "  Abra no iPad/celular (mesma rede):" -ForegroundColor Cyan; foreach ($ip in $ips) { Write-Host "    http://${ip}:$Porta" } }

Write-Host ""
if ($falhas -gt 0) { Write-Host "RESULTADO: $falhas falha(s), $avisos aviso(s)." -ForegroundColor Red; exit 1 }
Write-Host "RESULTADO: tudo certo ($avisos aviso(s))." -ForegroundColor Green
exit 0
