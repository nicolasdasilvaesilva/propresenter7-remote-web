@echo off
title Instalador da Skill ProPresenter Expert para Antigravity
color 0a
echo ================================================================
echo   INSTALADOR DA SKILL PROPRESENTER EXPERT (ANTIGRAVITY)
echo ================================================================
echo.

set "TARGET_DIR=%USERPROFILE%\.gemini\config\skills\propresenter-expert"
echo Criando pasta da skill em:
echo   -> "%TARGET_DIR%"
echo.

if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%"
)

copy /Y "%~dp0skills\propresenter-expert\SKILL.md" "%TARGET_DIR%\SKILL.md" >nul

if %errorlevel% equ 0 (
    echo [SUCESSO] A Skill 'propresenter-expert' foi instalada com sucesso!
    echo O seu Antigravity nesta maquina agora e especialista em ProPresenter 7.
) else (
    echo [ERRO] Nao foi possivel copiar a skill. Verifique as permissoes.
)

echo.
pause
