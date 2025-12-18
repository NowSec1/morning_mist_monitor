@echo off
REM 晨雾监测系统 - Docker Compose 快速启动脚本 (Windows)
REM 用法: start.bat [up|down|restart|logs|status]

setlocal enabledelayedexpansion

set PROJECT_NAME=morning_mist_monitor

REM 检查 Docker 和 Docker Compose
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker 未安装，请先安装 Docker
    exit /b 1
)

where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose 未安装，请先安装 Docker Compose
    exit /b 1
)

echo [INFO] Docker 和 Docker Compose 已安装

REM 检查 .env 文件
if not exist ".env" (
    echo [WARNING] .env 文件不存在，正在从 .env.example 创建...
    copy .env.example .env
    echo [WARNING] 请编辑 .env 文件，配置必要的环境变量
)

REM 处理命令
if "%1"=="" (
    set COMMAND=up
) else (
    set COMMAND=%1
)

if "%COMMAND%"=="up" (
    echo [INFO] 正在启动 %PROJECT_NAME% 服务...
    docker-compose up -d
    echo [INFO] 等待服务启动...
    timeout /t 5 /nobreak
    echo [INFO] 检查服务状态...
    docker-compose ps
    echo [SUCCESS] 服务已启动！
    echo [INFO] 应用地址: http://localhost:80
    echo [INFO] 查看日志: docker-compose logs -f app
) else if "%COMMAND%"=="down" (
    echo [INFO] 正在停止 %PROJECT_NAME% 服务...
    docker-compose down
    echo [SUCCESS] 服务已停止
) else if "%COMMAND%"=="restart" (
    echo [INFO] 正在重启 %PROJECT_NAME% 服务...
    docker-compose restart
    echo [SUCCESS] 服务已重启
) else if "%COMMAND%"=="logs" (
    echo [INFO] 显示应用日志（按 Ctrl+C 退出）...
    docker-compose logs -f app
) else if "%COMMAND%"=="status" (
    echo [INFO] 服务状态：
    docker-compose ps
) else if "%COMMAND%"=="help" (
    echo 晨雾监测系统 - Docker Compose 快速启动脚本
    echo.
    echo 用法: start.bat [命令]
    echo.
    echo 命令:
    echo   up        启动所有服务
    echo   down      停止所有服务
    echo   restart   重启所有服务
    echo   logs      查看应用日志
    echo   status    显示服务状态
    echo   help      显示帮助信息
    echo.
    echo 示例:
    echo   start.bat up       # 启动服务
    echo   start.bat down     # 停止服务
    echo   start.bat status   # 查看服务状态
) else (
    echo [ERROR] 未知命令: %COMMAND%
    echo 请使用 start.bat help 查看帮助信息
    exit /b 1
)

endlocal
