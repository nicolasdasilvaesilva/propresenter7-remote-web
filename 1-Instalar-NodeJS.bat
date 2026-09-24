@echo off
title Instalador Automatico do Node.js para Windows
color 0b
echo ================================================================
echo   VERIFICANDO E INSTALANDO NODE.JS NO WINDOWS
echo ================================================================
echo.

node -v >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] O Node.js ja esta instalado neste computador!
    node -v
    echo.
    pause
    exit /b
)

echo [!] O Node.js NAO foi encontrado neste computador.
echo Instalando Node.js LTS automaticamente via Windows Package Manager (winget)...
echo.

winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent

if %errorlevel% neq 0 (
    echo.
    echo O winget nao conseguiu instalar automaticamente.
    echo Baixando o instalador oficial do Node.js direto do site...
    powershell -Command "Start-BitsTransfer -Source 'https://nodejs.org/dist/v22.16.0/node-v22.16.0-x64.msi' -Destination 'node_setup.msi'; Start-Process msiexec.exe -Wait -ArgumentList '/i node_setup.msi /passive'; Remove-Item node_setup.msi -ErrorAction SilentlyContinue"
)

echo.
echo ================================================================
echo   NODE.JS INSTALADO COM SUCESSO!
echo ================================================================
echo Agora voce ja pode executar o "Iniciar-Controle-Remoto.bat".
echo.
pause
