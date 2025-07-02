#!/bin/bash

# 停止前后端服务脚本
# 使用方法: ./stop-services.sh

echo "🛑 停止前后端服务..."

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

# 1. 通过端口停止进程（最直接的方法）
print_status "通过端口停止进程..."

# 停止端口5173的进程（前端）
FRONTEND_PORT_PID=$(lsof -ti :5173 2>/dev/null)
if [ -n "$FRONTEND_PORT_PID" ]; then
    print_status "发现端口5173进程 (PID: $FRONTEND_PORT_PID)，正在停止..."
    kill $FRONTEND_PORT_PID
    sleep 2
    
    # 检查是否成功停止
    if lsof -ti :5173 >/dev/null 2>&1; then
        print_warning "端口5173进程仍在运行，强制停止..."
        kill -9 $FRONTEND_PORT_PID 2>/dev/null
        sleep 1
    fi
    
    if lsof -ti :5173 >/dev/null 2>&1; then
        print_error "无法停止端口5173进程"
    else
        print_success "端口5173进程已停止"
    fi
else
    print_warning "端口5173无进程运行"
fi

# 停止端口8080的进程（后端）
BACKEND_PORT_PID=$(lsof -ti :8080 2>/dev/null)
if [ -n "$BACKEND_PORT_PID" ]; then
    print_status "发现端口8080进程 (PID: $BACKEND_PORT_PID)，正在停止..."
    kill $BACKEND_PORT_PID
    sleep 2
    
    # 检查是否成功停止
    if lsof -ti :8080 >/dev/null 2>&1; then
        print_warning "端口8080进程仍在运行，强制停止..."
        kill -9 $BACKEND_PORT_PID 2>/dev/null
        sleep 1
    fi
    
    if lsof -ti :8080 >/dev/null 2>&1; then
        print_error "无法停止端口8080进程"
    else
        print_success "端口8080进程已停止"
    fi
else
    print_warning "端口8080无进程运行"
fi

# 2. 通过进程名停止（备用方法）
print_status "通过进程名停止相关进程..."

# 停止所有vite相关进程
VITE_PIDS=$(pgrep -f "vite" 2>/dev/null)
if [ -n "$VITE_PIDS" ]; then
    print_status "发现vite进程 (PID: $VITE_PIDS)，正在停止..."
    pkill -f "vite"
    sleep 2
    pkill -9 -f "vite" 2>/dev/null
    print_success "vite进程已停止"
fi

# 停止所有Go相关进程
GO_PIDS=$(pgrep -f "go run\|main.go\|beast-royale-server" 2>/dev/null)
if [ -n "$GO_PIDS" ]; then
    print_status "发现Go进程 (PID: $GO_PIDS)，正在停止..."
    pkill -f "go run"
    pkill -f "main.go"
    pkill -f "beast-royale-server"
    sleep 2
    pkill -9 -f "go run" 2>/dev/null
    pkill -9 -f "main.go" 2>/dev/null
    pkill -9 -f "beast-royale-server" 2>/dev/null
    print_success "Go进程已停止"
fi

# 3. 删除PID文件
print_status "清理PID文件..."

if [ -f ".frontend.pid" ]; then
    rm .frontend.pid
    print_success "已删除前端PID文件"
fi

if [ -f ".backend.pid" ]; then
    rm .backend.pid
    print_success "已删除后端PID文件"
fi

# 4. 最终检查端口占用
print_status "最终检查端口占用情况..."

check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        print_warning "端口 $1 仍被占用"
        return 1
    else
        print_success "端口 $1 已释放"
        return 0
    fi
}

check_port 5173
check_port 8080

print_success "前后端服务停止完成！" 