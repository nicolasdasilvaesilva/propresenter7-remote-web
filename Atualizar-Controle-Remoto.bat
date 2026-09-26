@echo off
title Atualizar - ProPresenter 7 Remote
color 0b
echo ================================================================
echo   ATUALIZAR O CONTROLE REMOTO (baixa, reinicia e confere)
echo ================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Atualizar.ps1"
echo.
pause
