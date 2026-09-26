@echo off
title Instalador das Skills do ProPresenter Remote (Antigravity)
color 0a
echo ================================================================
echo   INSTALADOR DAS SKILLS DO PROPRESENTER REMOTE (ANTIGRAVITY)
echo ================================================================
echo.
echo Skills que serao instaladas (a antiga e substituida pela nova):
echo   - propresenter-expert         (API, interface, armadilhas)
echo   - propresenter-remote-install (instalar, atualizar, reparar)
echo.

set "DEST=%USERPROFILE%\.gemini\config\skills"
set "ERRO=0"

for /d %%S in ("%~dp0skills\*") do (
    if exist "%%S\SKILL.md" (
        if not exist "%DEST%\%%~nxS" mkdir "%DEST%\%%~nxS"
        copy /Y "%%S\SKILL.md" "%DEST%\%%~nxS\SKILL.md" >nul
        if errorlevel 1 (
            echo [ERRO] Nao foi possivel instalar: %%~nxS
            set "ERRO=1"
        ) else (
            echo [OK] %%~nxS
        )
    )
)

echo.
if "%ERRO%"=="0" (
    echo [SUCESSO] Skills instaladas em: %DEST%
    echo Feche e abra o Antigravity para ele reconhecer as skills.
) else (
    echo [ATENCAO] Alguma skill nao foi copiada. Verifique as permissoes.
)
echo.
pause
