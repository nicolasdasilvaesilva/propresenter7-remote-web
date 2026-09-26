# Funcoes comuns dos scripts do ProPresenter 7 Remote (PowerShell 5.1 ou superior).
# Este arquivo e carregado pelos outros com:  . "$PSScriptRoot\_comum.ps1"

$ErrorActionPreference = 'Stop'
$script:NomeTarefaPadrao = 'ProPresenter-Remote'
$script:PortaPadrao      = 3000

function Get-PastaApp {
    # A pasta do app e a pasta acima de scripts\
    return (Split-Path -Parent $PSScriptRoot)
}

function Get-Config([string]$Dir) {
    $f = Join-Path $Dir 'config.json'
    if (Test-Path $f) {
        try { return (Get-Content $f -Raw -Encoding UTF8 | ConvertFrom-Json) } catch { }
    }
    return [pscustomobject]@{}
}

function Set-ConfigValor([string]$Dir, [string]$Chave, $Valor) {
    $f = Join-Path $Dir 'config.json'
    $obj = @{}
    if (Test-Path $f) {
        try { (Get-Content $f -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $obj[$_.Name] = $_.Value } } catch { }
    }
    $obj[$Chave] = $Valor
    # UTF-8 SEM BOM (o Node nao le JSON com BOM)
    [System.IO.File]::WriteAllText($f, ($obj | ConvertTo-Json), (New-Object System.Text.UTF8Encoding($false)))
}

function Get-PortaConfigurada([string]$Dir) {
    $c = Get-Config $Dir
    if ($c.port) { return [int]$c.port }
    return $script:PortaPadrao
}

function Get-NodePath {
    # Caminho COMPLETO do node.exe (no boot o PATH pode nao estar pronto)
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    foreach ($p in @("$env:ProgramFiles\nodejs\node.exe", "${env:ProgramFiles(x86)}\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe")) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

function Test-Administrador {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    return ([Security.Principal.WindowsPrincipal]$id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-ProcessosServidor([string]$Dir, [int]$Porta) {
    # Processos node.exe que ESCUTAM na porta E rodam o server.js DESTA pasta (nunca outros node)
    $achados = @()
    $donos = Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $donos) {
        $p = Get-CimInstance Win32_Process -Filter "ProcessId=$procId" -ErrorAction SilentlyContinue
        if ($p -and $p.Name -match '^node(\.exe)?$' -and $p.CommandLine -match 'server\.js') { $achados += $p }
    }
    return $achados
}

function Get-ProcessosSuporte([string]$Dir) {
    # Cadeia que inicia o servidor (wscript / powershell dos scripts desta pasta)
    $lista = @()
    $todos = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine }
    foreach ($p in $todos) {
        if ($p.CommandLine -like "*$Dir*" -and ($p.CommandLine -like '*Iniciar-Servidor.ps1*' -or $p.CommandLine -like '*Iniciar-Segundo-Plano.vbs*')) { $lista += $p }
    }
    return $lista
}

function Stop-Servidor([string]$Dir, [int]$Porta, [string]$NomeTarefa) {
    # Para SO o nosso servidor: tarefa agendada -> cadeia de inicio -> node da porta
    $parou = $false
    $t = Get-ScheduledTask -TaskName $NomeTarefa -ErrorAction SilentlyContinue
    if ($t -and $t.State -eq 'Running') { try { Stop-ScheduledTask -TaskName $NomeTarefa } catch { } }
    foreach ($p in (Get-ProcessosSuporte $Dir)) { try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop; $parou = $true } catch { } }
    foreach ($p in (Get-ProcessosServidor $Dir $Porta)) { try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop; $parou = $true } catch { } }
    for ($i = 0; $i -lt 20; $i++) {
        if (-not (Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue)) { break }
        Start-Sleep -Milliseconds 250
    }
    return $parou
}

function Invoke-Http([string]$Url, [int]$TimeoutSeg = 5) {
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeg
        return [pscustomobject]@{ Ok = $true; Status = [int]$r.StatusCode; Corpo = $r.Content }
    } catch {
        $st = 0
        if ($_.Exception.Response) { try { $st = [int]$_.Exception.Response.StatusCode } catch { } }
        return [pscustomobject]@{ Ok = $false; Status = $st; Corpo = $null; Erro = $_.Exception.Message }
    }
}

function Wait-Servidor([int]$Porta, [int]$TimeoutSeg = 20) {
    $fim = (Get-Date).AddSeconds($TimeoutSeg)
    while ((Get-Date) -lt $fim) {
        $r = Invoke-Http "http://127.0.0.1:$Porta/api/version" 2
        if ($r.Ok) { return ($r.Corpo | ConvertFrom-Json) }
        Start-Sleep -Milliseconds 500
    }
    return $null
}

function Get-IPsLocais {
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
        Select-Object -ExpandProperty IPAddress
}

function Write-Passo([string]$Texto) { Write-Host ""; Write-Host "==> $Texto" -ForegroundColor Cyan }
function Write-Ok([string]$Texto)    { Write-Host "  [OK]    $Texto" -ForegroundColor Green }
function Write-Aviso([string]$Texto) { Write-Host "  [AVISO] $Texto" -ForegroundColor Yellow }
function Write-Falha([string]$Texto) { Write-Host "  [FALHA] $Texto" -ForegroundColor Red }
