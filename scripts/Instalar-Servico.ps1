# Instala/reaplica o inicio automatico do controle remoto.
#  - garante o Node.js, grava config.json (IP/porta), cria a tarefa agendada (inicia ao entrar no Windows,
#    sem janela, reinicia se falhar), remove o inicializador ANTIGO, libera o firewall e inicia + confere.
param(
    [string]$Dir = (Split-Path -Parent $PSScriptRoot),
    [int]$Porta = 0,
    [string]$ProHost = '',
    [int]$ProPorta = 0,
    [string]$NomeTarefa = 'ProPresenter-Remote',
    [switch]$SemFirewall,
    [switch]$SemIniciar,
    [string]$Destino = 'C:\ProPresenter-Remote',   # local padrao da instalacao
    [switch]$NaoMover                                # instala onde esta, sem mover para $Destino
)
. "$PSScriptRoot\_comum.ps1"

# 0. Local padrao: C:\ProPresenter-Remote. Se estiver em outra pasta, MOVE a instalacao para la
#    (clona do mesmo GitHub, leva o config.json) e continua a instalacao a partir do destino.
$dirCompleto  = [IO.Path]::GetFullPath($Dir).TrimEnd('\')
$destCompleto = [IO.Path]::GetFullPath($Destino).TrimEnd('\')
if (-not $NaoMover -and $dirCompleto -ine $destCompleto) {
    Write-Passo "Movendo a instalacao para $destCompleto"
    if (-not (Test-Path (Join-Path $destCompleto 'server.js'))) {
        $copiou = $false
        if ((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $dirCompleto '.git'))) {
            $ea = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
            $url = (& git -C $dirCompleto remote get-url origin 2>$null | Select-Object -First 1)
            if ($url) {
                & git clone --quiet $url $destCompleto 2>&1 | Out-Null
                $copiou = ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $destCompleto 'server.js')))
            }
            $ErrorActionPreference = $ea
        }
        if (-not $copiou) {
            Write-Aviso 'Nao consegui clonar do GitHub; copiando os arquivos desta pasta.'
            & robocopy $dirCompleto $destCompleto /E /XD logs node_modules /XF *.log /NFL /NDL /NJH /NJS /NP | Out-Null
            if (-not (Test-Path (Join-Path $destCompleto 'server.js'))) { Write-Falha "Nao consegui criar $destCompleto"; exit 6 }
        }
        Write-Ok "Instalacao criada em $destCompleto"
    } else { Write-Ok "Ja existe uma instalacao em $destCompleto; sera reaproveitada" }
    $cfgAntigo = Join-Path $dirCompleto 'config.json'; $cfgNovo = Join-Path $destCompleto 'config.json'
    if ((Test-Path $cfgAntigo) -and -not (Test-Path $cfgNovo)) { Copy-Item $cfgAntigo $cfgNovo; Write-Ok 'config.json copiado da pasta antiga' }
    Write-Host "  Continuando a instalacao a partir de $destCompleto ..."
    $args2 = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $destCompleto 'scripts\Instalar-Servico.ps1'),
               '-Dir', $destCompleto, '-Destino', $destCompleto, '-NaoMover', '-NomeTarefa', $NomeTarefa)
    if ($Porta -gt 0)     { $args2 += @('-Porta', $Porta) }
    if ($ProHost -ne '')  { $args2 += @('-ProHost', $ProHost) }
    if ($ProPorta -gt 0)  { $args2 += @('-ProPorta', $ProPorta) }
    if ($SemFirewall)     { $args2 += '-SemFirewall' }
    if ($SemIniciar)      { $args2 += '-SemIniciar' }
    & powershell.exe @args2
    $rc = $LASTEXITCODE
    if ($rc -eq 0) { Write-Host ''; Write-Host "A pasta antiga ($dirCompleto) nao e mais usada e pode ser apagada quando quiser." -ForegroundColor Yellow }
    exit $rc
}

Write-Host "Instalando o ProPresenter 7 Remote a partir de: $Dir" -ForegroundColor Cyan

# 1. Node.js
Write-Passo '1/6  Node.js'
$node = Get-NodePath
if (-not $node) {
    Write-Aviso 'Node.js nao encontrado. Tentando instalar (winget)...'
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent | Out-Null
        $node = Get-NodePath
    }
}
if (-not $node) { Write-Falha 'Node.js indisponivel. Instale o Node.js LTS (https://nodejs.org) e rode de novo.'; exit 2 }
Write-Ok "Node.js $(& $node -v) em $node"

# 2. Configuracao (config.json fica fora do Git e sobrevive as atualizacoes)
Write-Passo '2/6  Configuracao (config.json)'
if ($Porta -le 0) { $Porta = Get-PortaConfigurada $Dir }
Set-ConfigValor $Dir 'port' $Porta
$cfg = Get-Config $Dir
if ($ProHost -eq '' -and -not $cfg.proHost) {
    # Sem IP informado e sem config: se o ProPresenter responde NESTE computador, usa 127.0.0.1
    $tp = if ($ProPorta -gt 0) { $ProPorta } else { 50820 }
    if ((Invoke-Http "http://127.0.0.1:$tp/version" 3).Ok) { $ProHost = '127.0.0.1'; Write-Ok "ProPresenter encontrado NESTE computador (porta $tp): usando 127.0.0.1" }
}
if ($ProHost -ne '')  { Set-ConfigValor $Dir 'proHost' $ProHost }
if ($ProPorta -gt 0)  { Set-ConfigValor $Dir 'proPort' $ProPorta }
$cfg = Get-Config $Dir
Write-Ok ("Servidor na porta {0}; ProPresenter em {1}:{2}" -f $Porta, $(if ($cfg.proHost) { $cfg.proHost } else { '(padrao do servidor)' }), $(if ($cfg.proPort) { $cfg.proPort } else { 50820 }))

# 3. Inicializador antigo (pasta Inicializar) -> sai, a tarefa agendada assume
Write-Passo '3/6  Migrando o inicializador antigo'
$adm = Test-Administrador
$legados = @(Join-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup" 'ProPresenter-Remote-AutoStart.vbs')
if ($adm) {   # como Administrador limpa a pasta Inicializar de TODOS os usuarios e a comum
    $legados += Join-Path "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp" 'ProPresenter-Remote-AutoStart.vbs'
    Get-ChildItem 'C:\Users' -Directory -ErrorAction SilentlyContinue | ForEach-Object { $legados += Join-Path $_.FullName 'AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\ProPresenter-Remote-AutoStart.vbs' }
}
$removeu = $false
foreach ($l in ($legados | Select-Object -Unique)) { if (Test-Path $l) { Remove-Item $l -Force -ErrorAction SilentlyContinue; $removeu = $true; Write-Ok "Removido inicializador antigo: $l" } }
if (-not $removeu) { Write-Ok 'Nada antigo para remover' }
$sobra = Join-Path $Dir 'iniciar_em_segundo_plano.vbs'
if (Test-Path $sobra) { Remove-Item $sobra -Force }

# 4. Tarefa agendada
Write-Passo '4/6  Tarefa agendada (inicia sozinha ao entrar no Windows)'
$vbs = Join-Path $Dir 'Iniciar-Segundo-Plano.vbs'
if (-not (Test-Path $vbs)) { Write-Falha "Arquivo ausente: $vbs"; exit 2 }
$acao = New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\wscript.exe" -Argument "//B //Nologo `"$vbs`"" -WorkingDirectory $Dir
$ajustes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
    -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
if ($adm) {
    # ADMINISTRADOR: roda como SYSTEM assim que o Windows LIGA (nao precisa de login) e vale para todos os usuarios
    $gatilho = New-ScheduledTaskTrigger -AtStartup
    $gatilho.Delay = 'PT30S'   # espera a rede subir
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName $NomeTarefa -Action $acao -Trigger $gatilho -Settings $ajustes -Principal $principal `
        -Description 'Inicia o servidor do ProPresenter 7 Remote (controle remoto web) ao ligar o Windows, para todos os usuarios.' -Force | Out-Null
    Write-Ok "Tarefa '$NomeTarefa' criada: roda como SYSTEM ao LIGAR o Windows (sem precisar de login, para todos os usuarios), sem janela, reinicia ate 5 vezes se falhar"
} else {
    $gatilho = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask -TaskName $NomeTarefa -Action $acao -Trigger $gatilho -Settings $ajustes -Principal $principal `
        -Description 'Inicia o servidor do ProPresenter 7 Remote (controle remoto web) ao entrar no Windows.' -Force | Out-Null
    Write-Ok "Tarefa '$NomeTarefa' criada para $env:USERNAME (inicia ao ENTRAR no Windows, sem janela, reinicia ate 5 vezes se falhar)"
    Write-Aviso 'Sem Administrador a tarefa so sobe depois do login. Para subir ao LIGAR o PC para todos os usuarios, rode este script como Administrador.'
}

# 5. Firewall
Write-Passo '5/6  Firewall do Windows'
if ($SemFirewall) { Write-Host '  (pulado por -SemFirewall)' }
else {
    $regra = Get-NetFirewallRule -DisplayName "ProPresenter Remote (TCP $Porta)" -ErrorAction SilentlyContinue
    if ($regra) { Write-Ok 'Regra de firewall ja existe' }
    else {
        $fw = Join-Path $PSScriptRoot 'Firewall.ps1'
        try {
            if ($adm) { & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $fw -Acao add -Porta $Porta }
            else {
                Write-Host '  O Windows vai pedir permissao de Administrador para liberar a porta...'
                $p = Start-Process powershell.exe -Verb RunAs -Wait -PassThru -WindowStyle Hidden -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$fw`" -Acao add -Porta $Porta"
                if ($p.ExitCode -ne 0) { throw "codigo $($p.ExitCode)" }
            }
            Write-Ok "Porta $Porta liberada no firewall (redes Privada e de Dominio)"
        } catch {
            Write-Aviso "Nao foi possivel criar a regra de firewall ($($_.Exception.Message)). Se o iPad nao conectar, rode como Administrador: scripts\Firewall.ps1 -Acao add -Porta $Porta"
        }
    }
}

# 6. Iniciar e conferir
Write-Passo '6/6  Iniciar e conferir'
if ($SemIniciar) { Write-Host '  (pulado por -SemIniciar)'; exit 0 }
# Assume a porta: para uma copia ANTIGA do servidor (de qualquer pasta, ex.: a versao anterior iniciada pelo
# inicializador antigo) para que o servidor NOVO, desta pasta, seja o que fica no ar.
if (Stop-Servidor $Dir $Porta $NomeTarefa) { Write-Ok 'Servidor anterior encerrado para assumir a porta' }
if (Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue) { Write-Falha "A porta $Porta esta ocupada por outro programa (nao e o controle remoto) ou sem permissao para encerrar. Rode como Administrador."; exit 3 }
Start-ScheduledTask -TaskName $NomeTarefa
$v = Wait-Servidor $Porta 25
if (-not $v) { Write-Falha 'O servidor nao respondeu a tempo. Veja logs\server-erro.log'; exit 4 }
Write-Ok "Servidor no ar (versao dos arquivos $($v.version))"
& "$PSScriptRoot\Verificar.ps1" -Dir $Dir -Porta $Porta -NomeTarefa $NomeTarefa
exit $LASTEXITCODE
