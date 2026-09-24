@echo off
title Configurar Inicializacao Automatica com o Windows
color 0a
echo ================================================================
echo   CONFIGURANDO INICIALIZACAO AUTOMATICA COM O WINDOWS
echo ================================================================
echo.

set "PROJECT_DIR=%~dp0"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%PROJECT_DIR%iniciar_em_segundo_plano.vbs"

echo Criando inicializador silencioso (sem janela preta)...
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%PROJECT_DIR:~0,-1%"
echo WshShell.Run "node server.js", 0, False
) > "%VBS_FILE%"

echo Criando atalho na pasta Inicializar do Windows:
echo   -> "%STARTUP_DIR%\ProPresenter-Remote-AutoStart.vbs"
echo.

copy /Y "%VBS_FILE%" "%STARTUP_DIR%\ProPresenter-Remote-AutoStart.vbs" >nul

if %errorlevel% equ 0 (
    echo [SUCESSO] Inicializacao automatica configurada com sucesso!
    echo Toda vez que o computador for ligado, o controle remoto subira
    echo automaticamente em segundo plano, sem atrapalhar a tela.
) else (
    echo [ERRO] Nao foi possivel copiar para a pasta Startup.
)

echo.
pause
