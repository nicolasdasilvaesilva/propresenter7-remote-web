@echo off
title ProPresenter 7 - Controle Remoto Web
color 0b
echo ========================================================
echo   INICIANDO CONTROLE REMOTO PROPRESENTER 7 (WEB)
echo ========================================================
echo.
cd /d "%~dp0"
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no sistema!
    pause
    exit /b
)
echo (Mantenha esta janela aberta enquanto estiver usando o controle.
echo  Para rodar em segundo plano e iniciar com o Windows: Configurar-Inicio-Automatico.bat)
echo.
node server.js
pause
