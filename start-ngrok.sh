#!/bin/bash

# 启动ngrok服务脚本
# 使用方法: ./start-ngrok.sh

echo "🚀 启动ngrok服务..."

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

# 检查ngrok是否已运行
print_status "检查ngrok状态..."

if pgrep -f ngrok >/dev/null; then
    print_warning "ngrok进程已在运行"
    NGROK_PIDS=$(pgrep -f ngrok)
    print_status "ngrok进程ID: $NGROK_PIDS"
    
    # 获取当前ngrok URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$NGROK_URL" ]; then
        print_success "当前ngrok隧道: $NGROK_URL"
    else
        print_warning "无法获取ngrok URL"
    fi
    
    read -p "是否要重启ngrok？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "取消启动"
        exit 0
    fi
    
    # 停止现有ngrok进程
    print_status "停止现有ngrok进程..."
    pkill -f ngrok
    sleep 2
fi

# 检查前端服务是否运行
print_status "检查前端服务状态..."

if ! lsof -i :5173 >/dev/null 2>&1; then
    print_warning "前端服务未运行在端口5173"
    print_status "请先启动前端服务，或指定其他端口"
    
    read -p "是否继续启动ngrok？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "取消启动"
        exit 0
    fi
else
    print_success "前端服务正在端口5173运行"
fi

# 启动ngrok
print_status "启动ngrok隧道..."
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
        
        echo ""
        print_status "=== 下一步操作 ==="
        print_success "ngrok隧道已建立，环境变量已配置"
        print_status "现在可以启动前后端服务："
        echo "  ./start-services.sh"
        echo ""
        print_warning "记得在WalletConnect Cloud中添加域名: $NGROK_URL"
    else
        print_error "未找到前端项目，请手动配置环境变量"
        print_status "手动配置命令："
        echo "  cd frontend"
        echo "  echo 'VITE_WALLETCONNECT_PROJECT_ID=2ef4bc0023aa46a876ae676fd622b125' > .env"
        echo "  echo 'VITE_APP_URL=$NGROK_URL' >> .env"
        echo "  cd .."
    fi
else
    print_warning "无法获取ngrok URL，请手动检查"
fi

print_success "ngrok服务启动完成！"
print_status "访问地址: $NGROK_URL" 