@echo off
title Remover Inicio Automatico - ProPresenter 7 Remote
color 0c
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Desinstalar-Servico.ps1"
echo.
pause
