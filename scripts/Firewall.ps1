# Cria/remove a regra de firewall da porta do controle remoto. PRECISA de administrador.
# Chamado pelo Instalar-Servico.ps1 (que pede a permissao do Windows quando necessario).
param([ValidateSet('add', 'remove')][string]$Acao = 'add', [int]$Porta = 3000)
$ErrorActionPreference = 'Stop'
$nome = "ProPresenter Remote (TCP $Porta)"

$adm = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $adm) { Write-Host 'Precisa executar como Administrador.'; exit 5 }

Get-NetFirewallRule -DisplayName $nome -ErrorAction SilentlyContinue | Remove-NetFirewallRule
if ($Acao -eq 'add') {
    New-NetFirewallRule -DisplayName $nome -Direction Inbound -Protocol TCP -LocalPort $Porta -Action Allow -Profile Private, Domain | Out-Null
    Write-Host "Regra criada: $nome (redes Privada e de Dominio)"
} else {
    Write-Host "Regra removida: $nome"
}
exit 0
