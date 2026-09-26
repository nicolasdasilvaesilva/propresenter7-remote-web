@echo off
title Parar Controle Remoto ProPresenter
color 0c
echo Encerrando SOMENTE o controle remoto (outros programas Node nao sao afetados)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Parar-Servidor.ps1"
echo.
timeout /t 3 >nul
