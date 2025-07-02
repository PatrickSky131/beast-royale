#!/bin/bash

# 重启ngrok服务脚本
# 使用方法: ./restart-ngrok.sh

echo "🔄 重启ngrok服务..."

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

# 1. 停止ngrok
print_status "停止ngrok服务..."
if pgrep -f ngrok >/dev/null; then
    pkill -f ngrok
    sleep 2
    
    # 检查是否成功停止
    if pgrep -f ngrok >/dev/null; then
        print_warning "ngrok进程仍在运行，尝试强制停止..."
        pkill -9 -f ngrok
        sleep 1
    fi
    
    if [ -f ".ngrok.pid" ]; then
        rm .ngrok.pid
    fi
    
    print_success "ngrok已停止"
else
    print_warning "ngrok进程未运行"
fi

# 2. 启动ngrok
print_status "启动ngrok服务..."

# 检查前端服务是否运行
if ! lsof -i :5173 >/dev/null 2>&1; then
    print_warning "前端服务未运行在端口5173"
    print_status "请先启动前端服务"
    exit 1
fi

# 启动ngrok
ngrok http 5173 &
NGROK_PID=$!

# 保存PID
echo "$NGROK_PID" > .ngrok.pid
print_success "ngrok已启动 (PID: $NGROK_PID)"

# 等待ngrok启动
print_status "等待ngrok隧道建立..."
sleep 5

# 获取ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
    print_success "ngrok隧道已建立: $NGROK_URL"
    
    # 更新前端环境变量
    if [ -f "frontend/package.json" ]; then
        print_status "更新前端环境变量..."
        cd frontend
        echo "VITE_WALLETCONNECT_PROJECT_ID=2ef4bc0023aa46a876ae676fd622b125" > .env
        echo "VITE_APP_URL=$NGROK_URL" >> .env
        print_success "环境变量已更新: VITE_APP_URL=$NGROK_URL"
        cd ..
    fi
else
    print_warning "无法获取ngrok URL，请手动检查"
fi

print_success "ngrok服务重启完成！"
print_status "访问地址: $NGROK_URL"
print_warning "记得在WalletConnect Cloud中添加域名: $NGROK_URL" 