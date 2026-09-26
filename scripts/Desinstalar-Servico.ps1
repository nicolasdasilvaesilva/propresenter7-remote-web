# Remove o inicio automatico (tarefa agendada, inicializador antigo e regra de firewall). Nao apaga os arquivos.
param([string]$Dir = (Split-Path -Parent $PSScriptRoot), [int]$Porta = 0, [string]$NomeTarefa = 'ProPresenter-Remote')
. "$PSScriptRoot\_comum.ps1"
if ($Porta -le 0) { $Porta = Get-PortaConfigurada $Dir }

Stop-Servidor $Dir $Porta $NomeTarefa | Out-Null
if (Get-ScheduledTask -TaskName $NomeTarefa -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName $NomeTarefa -Confirm:$false; Write-Ok "Tarefa '$NomeTarefa' removida" }
$legado = Join-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup" 'ProPresenter-Remote-AutoStart.vbs'
if (Test-Path $legado) { Remove-Item $legado -Force; Write-Ok 'Inicializador antigo removido' }
if (Get-NetFirewallRule -DisplayName "ProPresenter Remote (TCP $Porta)" -ErrorAction SilentlyContinue) {
    $fw = Join-Path $PSScriptRoot 'Firewall.ps1'
    try {
        if (Test-Administrador) { & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $fw -Acao remove -Porta $Porta }
        else { Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$fw`" -Acao remove -Porta $Porta" }
        Write-Ok 'Regra de firewall removida'
    } catch { Write-Aviso 'Nao removi a regra de firewall (permissao negada).' }
}
Write-Host 'Pronto. Os arquivos e o config.json foram mantidos.'
