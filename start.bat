@echo off
chcp 65001 >nul
title 效率教练
echo.
echo   ⚡  效率教练 — 启动中...
echo.

cd /d "%~dp0"

REM Check if node_modules exists, if not install
if not exist "node_modules" (
    echo   首次运行，正在安装依赖...
    call npm install --no-audit --no-fund
    echo.
)

echo   构建前端...
call npx vite build >nul 2>&1

echo   启动服务器（前端 + API + AI）
echo   访问地址：http://localhost:3002
echo   按 Ctrl+C 停止
echo.
node server/index.js
pause
