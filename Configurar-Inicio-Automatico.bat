@echo off
title Configurar Inicio Automatico - ProPresenter 7 Remote
color 0a
echo ================================================================
echo   INSTALAR / REAPLICAR O INICIO AUTOMATICO COM O WINDOWS
echo ================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Instalar-Servico.ps1"
echo.
pause
