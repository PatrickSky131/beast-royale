#!/bin/bash

echo "🛑 停止后端服务..."

# 通过端口停止进程
BACKEND_PID=$(lsof -ti :7000 2>/dev/null)
if [ -n "$BACKEND_PID" ]; then
    echo "发现端口7000进程 (PID: $BACKEND_PID)，正在停止..."
    kill $BACKEND_PID
    sleep 2
    
    # 强制停止如果还在运行
    if lsof -ti :7000 >/dev/null 2>&1; then
        echo "强制停止进程..."
        kill -9 $BACKEND_PID 2>/dev/null
    fi
    
    echo "✅ 后端进程已停止"
else
    echo "⚠️ 端口7000无进程运行"
fi

# 删除PID文件
if [ -f ".backend.pid" ]; then
    rm .backend.pid
    echo "✅ 已删除后端PID文件"
fi

echo "✅ 后端服务停止完成！" 
