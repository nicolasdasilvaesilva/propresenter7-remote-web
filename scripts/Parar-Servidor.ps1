# Para SO o servidor do ProPresenter 7 Remote (nao encerra outros programas Node da maquina).
param([string]$Dir = (Split-Path -Parent $PSScriptRoot), [int]$Porta = 0, [string]$NomeTarefa = 'ProPresenter-Remote')
. "$PSScriptRoot\_comum.ps1"

if ($Porta -le 0) { $Porta = Get-PortaConfigurada $Dir }

if (Stop-Servidor $Dir $Porta $NomeTarefa) {
    Write-Ok "Servidor do controle remoto encerrado (porta $Porta)."
} else {
    Write-Host "  O servidor ja nao estava em execucao (porta $Porta)."
}
if (Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue) {
    Write-Aviso "A porta $Porta ainda esta ocupada por outro programa (nao e o controle remoto). Nada foi encerrado."
    exit 1
}
exit 0
