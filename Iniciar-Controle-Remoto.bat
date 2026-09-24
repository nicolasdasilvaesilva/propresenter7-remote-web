@echo off
title ProPresenter 7 - Controle Remoto Web
color 0b
echo ========================================================
echo   INICIANDO CONTROLE REMOTO PROPRESENTER 7 (WEB)
echo ========================================================
echo.
cd /d "%~dp0"
echo Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no sistema!
    pause
    exit /b
)

echo Iniciando servidor local na porta 3000...
echo.
echo Para abrir no seu computador:
echo   -> http://localhost:3000
echo.
echo Para abrir no iPad, Celular ou Tablet:
echo   -> http://10.0.21.145:3000
echo.
echo (Mantenha esta janela aberta enquanto estiver usando o controle)
echo.
node server.js
pause
