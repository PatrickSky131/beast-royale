#!/bin/bash

# 停止ngrok服务脚本
# 使用方法: ./stop-ngrok.sh

echo "🛑 停止ngrok服务..."

# 检查ngrok进程
if pgrep -f ngrok >/dev/null; then
    echo "发现ngrok进程，正在停止..."
    pkill -f ngrok
    sleep 2
    
    # 强制停止如果还在运行
    if pgrep -f ngrok >/dev/null; then
        echo "强制停止ngrok进程..."
        pkill -9 -f ngrok
    fi
    
    echo "✅ ngrok进程已停止"
else
    echo "⚠️ 未发现ngrok进程"
fi

# 删除PID文件
if [ -f ".ngrok.pid" ]; then
    rm .ngrok.pid
    echo "✅ 已删除ngrok PID文件"
fi

echo "✅ ngrok服务停止完成！" 