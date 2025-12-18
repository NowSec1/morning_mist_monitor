#!/bin/bash

# 晨雾监测系统 - Docker Compose 快速启动脚本
# 用法: ./start.sh [up|down|restart|logs|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目名称
PROJECT_NAME="morning_mist_monitor"

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 和 Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_success "Docker 和 Docker Compose 已安装"
}

# 检查环境变量
check_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env 文件不存在，正在从 .env.example 创建..."
        cp .env.example .env
        print_warning "请编辑 .env 文件，配置必要的环境变量"
    fi
}

# 启动服务
start_services() {
    print_info "正在启动 $PROJECT_NAME 服务..."
    docker-compose up -d
    
    # 等待服务启动
    print_info "等待服务启动..."
    sleep 5
    
    # 检查服务状态
    print_info "检查服务状态..."
    docker-compose ps
    
    print_success "服务已启动！"
    print_info "应用地址: http://localhost:80"
    print_info "查看日志: docker-compose logs -f app"
}

# 停止服务
stop_services() {
    print_info "正在停止 $PROJECT_NAME 服务..."
    docker-compose down
    print_success "服务已停止"
}

# 重启服务
restart_services() {
    print_info "正在重启 $PROJECT_NAME 服务..."
    docker-compose restart
    print_success "服务已重启"
}

# 查看日志
show_logs() {
    print_info "显示应用日志（按 Ctrl+C 退出）..."
    docker-compose logs -f app
}

# 显示服务状态
show_status() {
    print_info "服务状态："
    docker-compose ps
    
    print_info ""
    print_info "健康检查："
    
    # 检查应用健康状态
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "应用服务: 正常"
    else
        print_error "应用服务: 异常"
    fi
    
    # 检查 Nginx 健康状态
    if curl -s http://localhost > /dev/null 2>&1; then
        print_success "Nginx 服务: 正常"
    else
        print_error "Nginx 服务: 异常"
    fi
    
    # 检查数据库连接
    if docker-compose exec -T mysql mysqladmin ping -h localhost -u app_user -papp_password > /dev/null 2>&1; then
        print_success "MySQL 服务: 正常"
    else
        print_error "MySQL 服务: 异常"
    fi
}

# 显示帮助信息
show_help() {
    echo "晨雾监测系统 - Docker Compose 快速启动脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  up        启动所有服务"
    echo "  down      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  logs      查看应用日志"
    echo "  status    显示服务状态"
    echo "  help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 up       # 启动服务"
    echo "  $0 down     # 停止服务"
    echo "  $0 status   # 查看服务状态"
}

# 主函数
main() {
    # 检查 Docker
    check_docker
    
    # 检查环境变量
    check_env
    
    # 处理命令
    case "${1:-up}" in
        up)
            start_services
            ;;
        down)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        help)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
