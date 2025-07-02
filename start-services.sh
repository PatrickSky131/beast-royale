#!/bin/bash

# 启动前后端服务脚本
# 使用方法: ./start-services.sh

echo "🚀 启动前后端服务..."

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

# 检查前端环境变量配置
print_status "检查前端环境变量配置..."

if [ -f "frontend/.env" ]; then
    VITE_APP_URL=$(grep "VITE_APP_URL=" frontend/.env | cut -d'=' -f2)
    if [ -n "$VITE_APP_URL" ]; then
        print_success "前端环境变量已配置: VITE_APP_URL=$VITE_APP_URL"
    else
        print_warning "前端环境变量文件存在但VITE_APP_URL未配置"
    fi
else
    print_warning "前端环境变量文件不存在"
fi

# 检查ngrok是否运行
if pgrep -f ngrok >/dev/null; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$NGROK_URL" ]; then
        print_success "ngrok隧道正在运行: $NGROK_URL"
        
        # 检查环境变量是否与ngrok URL匹配
        if [ "$VITE_APP_URL" != "$NGROK_URL" ]; then
            print_warning "环境变量与ngrok URL不匹配"
            print_status "更新环境变量..."
            cd frontend
            echo "VITE_WALLETCONNECT_PROJECT_ID=2ef4bc0023aa46a876ae676fd622b125" > .env
            echo "VITE_APP_URL=$NGROK_URL" >> .env
            print_success "环境变量已更新: VITE_APP_URL=$NGROK_URL"
            cd ..
        fi
    else
        print_warning "ngrok正在运行但无法获取URL"
    fi
else
    print_warning "ngrok未运行"
    if [ -z "$VITE_APP_URL" ]; then
        print_error "建议先启动ngrok配置环境变量"
        print_status "推荐操作流程："
        echo "  1. ./start-ngrok.sh    # 启动ngrok并配置环境变量"
        echo "  2. ./start-services.sh # 启动前后端服务"
        echo ""
        read -p "是否继续启动服务？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "取消启动"
            exit 0
        fi
    fi
fi

# 检查服务是否已运行
print_status "检查服务状态..."

# 检查前端服务（通过端口）
if lsof -i :5173 >/dev/null 2>&1; then
    print_warning "前端服务已在运行 (端口5173)"
    FRONTEND_PID=$(lsof -ti :5173)
    print_status "前端进程ID: $FRONTEND_PID"
fi

# 检查后端服务（通过端口）
if lsof -i :8080 >/dev/null 2>&1; then
    print_warning "后端服务已在运行 (端口8080)"
    BACKEND_PID=$(lsof -ti :8080)
    print_status "后端进程ID: $BACKEND_PID"
fi

# 如果服务已运行，询问是否重启
if lsof -i :5173 >/dev/null 2>&1 || lsof -i :8080 >/dev/null 2>&1; then
    read -p "服务已在运行，是否要重启？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "取消启动"
        exit 0
    fi
    
    # 停止现有服务
    print_status "停止现有服务..."
    ./stop-services.sh
    sleep 3
fi

# 检查端口占用
print_status "检查端口占用情况..."

check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        print_warning "端口 $1 被占用"
        return 1
    else
        print_success "端口 $1 可用"
        return 0
    fi
}

check_port 8080
check_port 5173

# 启动后端服务
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

# 启动前端服务
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

# 保存进程ID到文件
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid
print_success "进程ID已保存到 .*.pid 文件"

# 显示服务状态
echo ""
print_status "=== 服务状态 ==="
echo "后端服务: http://localhost:8080"
echo "前端服务: http://localhost:5173"
if [ -n "$NGROK_URL" ]; then
    echo "ngrok隧道: $NGROK_URL"
else
    echo "ngrok隧道: 未运行"
fi
echo ""
print_status "进程ID:"
echo "  后端: $BACKEND_PID"
echo "  前端: $FRONTEND_PID"
echo ""

print_success "前后端服务启动完成！" 