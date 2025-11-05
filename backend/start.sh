#!/bin/bash

echo "🚀 启动后端服务..."

# 检查端口占用
if lsof -i :7000 >/dev/null 2>&1; then
    echo "⚠️ 端口7000已被占用，正在停止现有进程..."
    lsof -ti :8080 | xargs kill -9
    sleep 2
fi

# 启动后端服务
cd "$(dirname "$0")"
echo "使用go run启动后端..."
go run main.go run --config config.yaml &

BACKEND_PID=$!
echo "$BACKEND_PID" > .backend.pid
echo "✅ 后端已启动 (PID: $BACKEND_PID)"
echo "🌐 后端服务地址: http://localhost:7000" 
