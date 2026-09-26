# Inicia o servidor (usado pela tarefa agendada e pelo Iniciar-Segundo-Plano.vbs).
# Fica esperando o node terminar e devolve o mesmo codigo de saida, para a tarefa reiniciar em caso de falha.
. "$PSScriptRoot\_comum.ps1"

$dir   = Get-PastaApp
$porta = Get-PortaConfigurada $dir
$logs  = Join-Path $dir 'logs'
New-Item -ItemType Directory -Force -Path $logs | Out-Null
$saida = Join-Path $logs 'server.log'
$erro  = Join-Path $logs 'server-erro.log'

# Ja esta rodando? Entao nao inicia outra copia.
if (Get-ProcessosServidor $dir $porta) { exit 0 }

# Guarda o log anterior (so 1) e comeca um novo
foreach ($f in @($saida, $erro)) {
    if (Test-Path $f) { Move-Item -Force $f ($f -replace '\.log$', '.anterior.log') }
}

$node = Get-NodePath
if (-not $node) {
    "[$(Get-Date -Format s)] Node.js nao encontrado. Rode Configurar-Inicio-Automatico.bat ou instale o Node.js LTS." | Set-Content $erro -Encoding UTF8
    exit 2
}

$p = Start-Process -FilePath $node -ArgumentList 'server.js' -WorkingDirectory $dir -WindowStyle Hidden `
        -RedirectStandardOutput $saida -RedirectStandardError $erro -PassThru -Wait
exit $p.ExitCode
