#!/bin/bash

# 停止ngrok服务脚本
# 使用方法: ./stop-ngrok.sh

echo "🛑 停止ngrok服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查ngrok进程
print_status "检查ngrok进程..."

if pgrep -f ngrok >/dev/null; then
    print_status "发现ngrok进程，正在停止..."
    
    # 获取ngrok进程ID
    NGROK_PIDS=$(pgrep -f ngrok)
    print_status "ngrok进程ID: $NGROK_PIDS"
    
    # 停止ngrok进程
    pkill -f ngrok
    
    # 等待进程停止
    sleep 2
    
    # 检查是否成功停止
    if pgrep -f ngrok >/dev/null; then
        print_warning "ngrok进程仍在运行，尝试强制停止..."
        pkill -9 -f ngrok
        sleep 1
        
        if pgrep -f ngrok >/dev/null; then
            print_error "无法停止ngrok进程"
            exit 1
        else
            print_success "ngrok进程已强制停止"
        fi
    else
        print_success "ngrok进程已停止"
    fi
    
    # 删除ngrok PID文件
    if [ -f ".ngrok.pid" ]; then
        rm .ngrok.pid
        print_success "已删除ngrok PID文件"
    fi
    
else
    print_warning "未发现ngrok进程"
fi

print_success "ngrok服务停止完成！" 