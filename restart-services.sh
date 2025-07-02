#!/bin/bash

# 重启前后端服务脚本
# 使用方法: ./restart-services.sh

echo "🔄 重启前后端服务..."

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

# 1. 停止前后端服务
print_status "停止前后端服务..."

# 直接调用停止脚本
./stop-services.sh

# 等待进程完全停止
print_status "等待进程完全停止..."
sleep 3

# 2. 检查端口占用
print_status "检查端口占用情况..."

check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        print_warning "端口 $1 仍被占用"
        return 1
    else
        print_success "端口 $1 可用"
        return 0
    fi
}

check_port 5173
check_port 8080

# 3. 启动后端服务
print_status "启动后端服务..."
cd backend
if [ -f "go.mod" ]; then
    print_status "检测到Go项目，启动后端..."
    go mod tidy
    
    # 使用make dev命令启动后端（开发模式）
    if [ -f "Makefile" ]; then
        print_status "使用Makefile启动后端..."
        make dev &
        BACKEND_PID=$!
        print_success "后端已启动 (PID: $BACKEND_PID)"
    else
        print_status "使用go run启动后端..."
        go run main.go &
        BACKEND_PID=$!
        print_success "后端已启动 (PID: $BACKEND_PID)"
    fi
    cd ..
else
    print_error "未找到后端Go项目"
    cd ..
    exit 1
fi

# 等待后端启动
print_status "等待后端服务启动..."
sleep 5

# 4. 启动前端服务
print_status "启动前端服务..."
cd frontend
if [ -f "package.json" ]; then
    print_status "检测到前端项目，启动开发服务器..."
    npm run dev:smart &
    FRONTEND_PID=$!
    print_success "前端已启动 (PID: $FRONTEND_PID)"
    cd ..
else
    print_error "未找到前端项目"
    cd ..
    exit 1
fi

# 等待前端启动
print_status "等待前端服务启动..."
sleep 5

# 5. 更新环境变量（如果ngrok URL存在）
if pgrep -f ngrok >/dev/null; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$NGROK_URL" ]; then
        print_status "检测到ngrok，更新前端环境变量..."
        cd frontend
        echo "VITE_WALLETCONNECT_PROJECT_ID=2ef4bc0023aa46a876ae676fd622b125" > .env
        echo "VITE_APP_URL=$NGROK_URL" >> .env
        print_success "环境变量已更新: VITE_APP_URL=$NGROK_URL"
        cd ..
    fi
fi

# 6. 保存进程ID到文件
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid
print_success "进程ID已保存到 .*.pid 文件"

# 7. 显示服务状态
echo ""
print_status "=== 服务状态 ==="
echo "后端服务: http://localhost:8080"
echo "前端服务: http://localhost:5173"
if [ -n "$NGROK_URL" ]; then
    echo "ngrok隧道: $NGROK_URL (保持运行)"
else
    echo "ngrok隧道: 未运行"
fi
echo ""
print_status "进程ID:"
echo "  后端: $BACKEND_PID"
echo "  前端: $FRONTEND_PID"
echo ""

print_success "前后端服务重启完成！" 