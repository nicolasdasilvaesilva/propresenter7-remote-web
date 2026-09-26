@echo off
title Verificar - ProPresenter 7 Remote
color 0b
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Verificar.ps1"
echo.
pause
