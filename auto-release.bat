@echo off
title Optimizer - Lancamento Automatico de Nova Versao
cd /d "%~dp0"

echo ======================================================================
echo    OPTIMIZER - LANCAMENTO AUTOMATICO DE NOVA VERSAO
echo ======================================================================
echo.
echo  Este processo vai:
echo    1. Incrementar a versao automaticamente (1.0 -> 1.1 ... 1.10 -> 2.0)
echo    2. Executar a suite de testes automatizados (43 testes)
echo    3. Compilar o executavel portatil atualizado
echo    4. Atualizar o executavel no Ambiente de Trabalho e na drive E:
echo    5. Criar o commit e a tag no Git
echo    6. Publicar a nova Release oficial no GitHub com o .exe anexado
echo.
echo ======================================================================
echo.

npm run release

echo.
echo Processo concluido! Pressione qualquer tecla para sair...
pause >nul
