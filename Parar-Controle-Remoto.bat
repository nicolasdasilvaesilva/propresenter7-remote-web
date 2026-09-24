@echo off
title Parar Controle Remoto ProPresenter
color 0c
echo ================================================================
echo   ENCERRANDO CONTROLE REMOTO PROPRESENTER 7
echo ================================================================
echo.

taskkill /f /im node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] O servidor do controle remoto foi encerrado com sucesso!
) else (
    echo [i] O servidor ja nao estava em execucao.
)

echo.
timeout /t 3 >nul
