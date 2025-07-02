#!/bin/bash

echo "🛑 停止前端服务..."

# 通过端口停止进程
FRONTEND_PID=$(lsof -ti :5173 2>/dev/null)
if [ -n "$FRONTEND_PID" ]; then
    echo "发现端口5173进程 (PID: $FRONTEND_PID)，正在停止..."
    kill $FRONTEND_PID
    sleep 2
    
    # 强制停止如果还在运行
    if lsof -ti :5173 >/dev/null 2>&1; then
        echo "强制停止进程..."
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    
    echo "✅ 前端进程已停止"
else
    echo "⚠️ 端口5173无进程运行"
fi

# 删除PID文件
if [ -f ".frontend.pid" ]; then
    rm .frontend.pid
    echo "✅ 已删除前端PID文件"
fi

echo "✅ 前端服务停止完成！" 