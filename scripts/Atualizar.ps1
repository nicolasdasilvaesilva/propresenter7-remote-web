# Atualiza o controle remoto para a versao mais recente do GitHub, sem deixar cache antigo e conferindo no fim.
# Ordem: pre-checagens -> baixar -> backup -> parar SO nosso servidor -> atualizar -> reaplicar inicio automatico
#        -> iniciar -> conferir. Se a conferencia falhar, VOLTA para a versao anterior sozinho.
param(
    [string]$Dir = (Split-Path -Parent $PSScriptRoot),
    [int]$Porta = 0,
    [string]$Ramo = 'main',
    [string]$Remoto = 'origin',
    [string]$NomeTarefa = 'ProPresenter-Remote',
    [switch]$Forcar,      # guarda (stash) alteracoes locais em arquivos versionados e segue
    [switch]$Sempre,      # refaz o ciclo completo mesmo sem versao nova
    [switch]$SemBackup
)
. "$PSScriptRoot\_comum.ps1"

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments)]$a)
    # O git escreve mensagens normais no stderr; no PowerShell 5.1 isso viraria erro fatal, entao relaxamos aqui
    $ea = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    $out = & git -C $Dir @a 2>&1 | ForEach-Object { "$_" }
    $script:GitCodigo = $LASTEXITCODE
    $ErrorActionPreference = $ea
    return $out
}
if ($Porta -le 0) { $Porta = Get-PortaConfigurada $Dir }
$inicio = Get-Date

Write-Host "Atualizando o ProPresenter 7 Remote em: $Dir" -ForegroundColor Cyan

# ---- 0. Pre-checagens (nada e alterado ainda)
Write-Passo '1/8  Pre-checagens'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Falha 'Git nao esta instalado (winget install Git.Git).'; exit 2 }
if (-not (Test-Path (Join-Path $Dir '.git'))) { Write-Falha "Esta pasta nao e um repositorio Git. Clone de novo: git clone https://github.com/nicolasdasilvaesilva/propresenter7-remote-web.git"; exit 2 }
$tarefaAtual = Get-ScheduledTask -TaskName $NomeTarefa -ErrorAction SilentlyContinue
if ($tarefaAtual -and $tarefaAtual.Principal.UserId -match 'SYSTEM' -and -not (Test-Administrador)) {
    Write-Falha 'A tarefa roda como SYSTEM (instalacao para todos os usuarios): abra o PowerShell como ADMINISTRADOR e rode de novo. Nada foi alterado.'
    exit 2
}
$antes = (Invoke-Git rev-parse --short HEAD | Select-Object -First 1)
$ramoAtual = (Invoke-Git rev-parse --abbrev-ref HEAD | Select-Object -First 1)
Write-Ok "Versao atual: $antes (ramo $ramoAtual)"
$mudancas = @(Invoke-Git status --porcelain --untracked-files=no)
if ($mudancas.Count -gt 0 -and -not $Forcar) {
    Write-Falha 'Ha alteracoes locais em arquivos do projeto (isso bloquearia a atualizacao):'
    $mudancas | ForEach-Object { Write-Host "         $_" }
    Write-Host '  Nada foi alterado. Rode com -Forcar para guarda-las (git stash) e seguir.'
    exit 2
}
$vAntiga = $null
$rv = Invoke-Http "http://127.0.0.1:$Porta/api/version" 3
if ($rv.Ok) { $vAntiga = ($rv.Corpo | ConvertFrom-Json).version }
Write-Ok ("Servidor atual: {0}" -f $(if ($rv.Ok) { "no ar, versao dos arquivos $vAntiga" } else { 'fora do ar (ou versao antiga sem /api/version)' }))

# ---- 1. Baixar (ainda sem mexer nos arquivos)
Write-Passo '2/8  Buscando a versao nova no GitHub'
$null = Invoke-Git fetch $Remoto $Ramo
if ($GitCodigo -ne 0) { Write-Falha 'Nao consegui falar com o GitHub (internet?). Nada foi alterado.'; exit 2 }
$novos = [int](Invoke-Git rev-list --count "HEAD..$Remoto/$Ramo" | Select-Object -First 1)
if ($novos -eq 0 -and -not $Sempre) {
    Write-Ok 'Ja esta na versao mais recente. Conferindo se esta tudo funcionando...'
    & "$PSScriptRoot\Verificar.ps1" -Dir $Dir -Porta $Porta -NomeTarefa $NomeTarefa
    exit $LASTEXITCODE
}
Write-Ok "$novos alteracao(oes) nova(s) disponivel(is)"

# ---- 2. Backup
Write-Passo '3/8  Backup da versao atual'
$backupRaiz = Join-Path (Split-Path -Parent $Dir) 'ProPresenter-Remote-backups'
$destino = $null
if ($SemBackup) { Write-Host '  (pulado por -SemBackup)' }
else {
    $destino = Join-Path $backupRaiz (Get-Date -Format 'yyyyMMdd-HHmmss')
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    & robocopy $Dir $destino /E /XD .git logs node_modules /XF *.log /NFL /NDL /NJH /NJS /NP | Out-Null
    Write-Ok "Copia em $destino"
    Get-ChildItem $backupRaiz -Directory | Sort-Object Name -Descending | Select-Object -Skip 3 | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

# ---- 3. Parar SO o nosso servidor
Write-Passo '4/8  Parando o servidor (somente o controle remoto)'
if (Stop-Servidor $Dir $Porta $NomeTarefa) { Write-Ok 'Servidor parado' } else { Write-Ok 'Ja estava parado' }
if (Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue) {
    Write-Falha "A porta $Porta continua ocupada por outro programa. Cancelando (nada foi alterado)."; exit 3
}

function Voltar-Atras([string]$motivo) {
    Write-Falha "$motivo  -> VOLTANDO para a versao anterior ($antes)"
    Stop-Servidor $Dir $Porta $NomeTarefa | Out-Null
    $null = Invoke-Git reset --hard $antes
    & "$PSScriptRoot\Instalar-Servico.ps1" -Dir $Dir -Porta $Porta -NomeTarefa $NomeTarefa -SemFirewall -SemIniciar | Out-Null
    Start-ScheduledTask -TaskName $NomeTarefa -ErrorAction SilentlyContinue
    if (Wait-Servidor $Porta 25) { Write-Aviso "Servidor da versao anterior ($antes) esta no ar de novo." } else { Write-Falha "O servidor anterior tambem nao subiu. Backup em: $destino  |  logs\server-erro.log" }
    exit 1
}

# ---- 4. Atualizar arquivos
Write-Passo '5/8  Atualizando os arquivos'
if ($mudancas.Count -gt 0) { $null = Invoke-Git stash push -m "auto-antes-da-atualizacao $(Get-Date -Format s)"; Write-Aviso 'Alteracoes locais guardadas em git stash' }
if ($ramoAtual -ne $Ramo) { $null = Invoke-Git checkout $Ramo; if ($GitCodigo -ne 0) { Voltar-Atras "Nao consegui trocar para o ramo $Ramo" } }
$saida = Invoke-Git merge --ff-only "$Remoto/$Ramo"
if ($GitCodigo -ne 0) { Write-Host ($saida -join "`n"); Voltar-Atras 'A atualizacao nao pode ser aplicada sem conflito' }
$depois = (Invoke-Git rev-parse --short HEAD | Select-Object -First 1)
Write-Ok "Versao nova: $depois"
Invoke-Git log --format='         - %s' "$antes..$depois" | ForEach-Object { Write-Host $_ }
# Restos do metodo antigo
foreach ($sobra in 'iniciar_em_segundo_plano.vbs') { $p = Join-Path $Dir $sobra; if (Test-Path $p) { Remove-Item $p -Force } }
Get-ChildItem (Join-Path $Dir 'logs') -Filter *.log -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force -ErrorAction SilentlyContinue

# ---- 5. Reaplicar inicio automatico (caminho certo, migra o inicializador antigo)
Write-Passo '6/8  Reaplicando o inicio automatico com o Windows'
# -SemFirewall: atualizar nunca deve travar esperando permissao de administrador (o Verificar avisa se faltar a regra)
& "$PSScriptRoot\Instalar-Servico.ps1" -Dir $Dir -Porta $Porta -NomeTarefa $NomeTarefa -SemIniciar -SemFirewall
if ($LASTEXITCODE -ne 0) { Voltar-Atras 'Falha ao reaplicar o inicio automatico' }

# ---- 6. Iniciar
Write-Passo '7/8  Iniciando o servidor atualizado'
Start-ScheduledTask -TaskName $NomeTarefa
$v = Wait-Servidor $Porta 30
if (-not $v) { Voltar-Atras 'O servidor novo nao respondeu' }
Write-Ok "No ar. Versao dos arquivos: $($v.version)"

# ---- 7. Conferir (inclui: a pagina servida usa a versao nova = nada de cache antigo)
Write-Passo '8/8  Conferindo'
& "$PSScriptRoot\Verificar.ps1" -Dir $Dir -Porta $Porta -NomeTarefa $NomeTarefa
if ($LASTEXITCODE -ne 0) { Voltar-Atras 'A conferencia final encontrou falhas' }

$seg = [int]((Get-Date) - $inicio).TotalSeconds
Write-Host ""
Write-Host "ATUALIZADO: $antes -> $depois em ${seg}s." -ForegroundColor Green
if ($vAntiga -and $vAntiga -ne $v.version) { Write-Host "Cache: versao dos arquivos $vAntiga -> $($v.version). Os aparelhos apagam o cache antigo sozinhos ao abrir." }
Write-Host 'Nos iPads/celulares: feche o app e abra de novo (ou recarregue 2 vezes). Se algo antigo insistir: remova o icone da Tela de Inicio, limpe os dados do site e adicione de novo.'
if ($destino) { Write-Host "Backup da versao anterior: $destino" }
exit 0
