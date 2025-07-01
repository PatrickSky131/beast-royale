#!/bin/bash

# Beast Royale 服务停止脚本
# 一键停止前端、后端和ngrok服务

echo "🛑 停止 Beast Royale 服务..."

# 创建logs目录（如果不存在）
mkdir -p logs

# 停止后端服务
echo "📡 停止后端服务..."
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ 后端服务已停止 (PID: $BACKEND_PID)"
    else
        echo "⚠️  后端服务进程不存在"
    fi
    rm -f logs/backend.pid
else
    # 如果没有PID文件，尝试通过进程名停止
    pkill -f "go run main.go" 2>/dev/null
    echo "✅ 后端服务已停止"
fi

# 停止前端服务
echo "🎮 停止前端服务..."
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止 (PID: $FRONTEND_PID)"
    else
        echo "⚠️  前端服务进程不存在"
    fi
    rm -f logs/frontend.pid
else
    # 如果没有PID文件，尝试通过进程名停止
    pkill -f "vite" 2>/dev/null
    echo "✅ 前端服务已停止"
fi

# 停止ngrok服务
echo "🌐 停止ngrok服务..."
if [ -f logs/ngrok.pid ]; then
    NGROK_PID=$(cat logs/ngrok.pid)
    if kill -0 $NGROK_PID 2>/dev/null; then
        kill $NGROK_PID
        echo "✅ ngrok服务已停止 (PID: $NGROK_PID)"
    else
        echo "⚠️  ngrok服务进程不存在"
    fi
    rm -f logs/ngrok.pid
else
    # 如果没有PID文件，尝试通过进程名停止
    pkill -f "ngrok" 2>/dev/null
    echo "✅ ngrok服务已停止"
fi

# 清理可能的残留进程
echo "🧹 清理残留进程..."
pkill -f "go run main.go" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "ngrok" 2>/dev/null

# 检查端口是否已释放
echo "🔍 检查端口状态..."
sleep 2

if lsof -i :8080 > /dev/null 2>&1; then
    echo "⚠️  端口8080仍被占用"
else
    echo "✅ 端口8080已释放"
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  端口3000仍被占用"
else
    echo "✅ 端口3000已释放"
fi

if lsof -i :4040 > /dev/null 2>&1; then
    echo "⚠️  端口4040仍被占用"
else
    echo "✅ 端口4040已释放"
fi

echo ""
echo "🎉 所有服务已停止！"
echo "=================================="
echo "📝 日志文件保留在 logs/ 目录中"
echo "🚀 使用 './start-services.sh' 重新启动服务"
echo "=================================="
echo "" 