@echo off
title Instalador das Skills do ProPresenter Remote (Claude Code e Antigravity)
color 0a
echo ================================================================
echo   INSTALADOR DAS SKILLS DO PROPRESENTER REMOTE
echo   (Claude Code e Google Antigravity)
echo ================================================================
echo.
echo Skills: propresenter-expert (API, interface, armadilhas)
echo         propresenter-remote-install (instalar, atualizar, reparar)
echo.
echo Uso:  Instalar-Skill.bat             (instala nos DOIS)
echo       Instalar-Skill.bat claude      (so Claude Code)
echo       Instalar-Skill.bat antigravity (so Antigravity)
echo.

set "ALVO=%~1"
if "%ALVO%"=="" set "ALVO=ambos"
set "ERRO=0"

if /i "%ALVO%"=="ambos" goto :dois
if /i "%ALVO%"=="claude" goto :so_claude
if /i "%ALVO%"=="antigravity" goto :so_antigravity
echo Opcao invalida: %ALVO%
goto :fim

:dois
call :instalar "%USERPROFILE%\.gemini\config\skills" "Antigravity"
call :instalar "%USERPROFILE%\.claude\skills" "Claude Code"
goto :fim

:so_claude
call :instalar "%USERPROFILE%\.claude\skills" "Claude Code"
goto :fim

:so_antigravity
call :instalar "%USERPROFILE%\.gemini\config\skills" "Antigravity"
goto :fim

:instalar
set "DEST=%~1"
echo [%~2] %DEST%
for /d %%S in ("%~dp0skills\*") do (
    if exist "%%S\SKILL.md" (
        if not exist "%DEST%\%%~nxS" mkdir "%DEST%\%%~nxS"
        copy /Y "%%S\SKILL.md" "%DEST%\%%~nxS\SKILL.md" >nul
        if errorlevel 1 (
            echo    [ERRO] %%~nxS
            set "ERRO=1"
        ) else (
            echo    [OK] %%~nxS
        )
    )
)
echo.
exit /b

:fim
if "%ERRO%"=="0" (
    echo [SUCESSO] Feche e abra o Claude Code / Antigravity para reconhecer as skills.
) else (
    echo [ATENCAO] Alguma skill nao foi copiada. Verifique as permissoes.
)
echo.
pause
