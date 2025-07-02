#!/bin/bash

echo "🚀 启动ngrok服务..."

# 检查ngrok是否已运行
if pgrep -f ngrok >/dev/null; then
    echo "⚠️ ngrok已在运行，正在停止..."
    pkill -f ngrok
    sleep 2
fi

# 检查端口4040是否被占用
if lsof -i :4040 >/dev/null 2>&1; then
    echo "⚠️ 端口4040已被占用，正在停止..."
    lsof -ti :4040 | xargs kill -9
    sleep 2
fi

# 启动ngrok
echo "启动ngrok隧道..."
ngrok http 5173 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# 保存PID
echo "$NGROK_PID" > .ngrok.pid

# 等待ngrok启动
echo "等待ngrok启动..."
sleep 5

# 获取ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
    echo "✅ ngrok已启动 (PID: $NGROK_PID)"
    echo "🌐 ngrok隧道地址: $NGROK_URL"
    echo "📊 ngrok管理界面: http://localhost:4040"
    
    # 更新前端环境变量（总是创建或更新）
    echo "更新前端环境变量..."
    cd frontend
    echo "VITE_WALLETCONNECT_PROJECT_ID=2ef4bc0023aa46a876ae676fd622b125" > .env
    echo "VITE_APP_URL=$NGROK_URL" >> .env
    cd ..
    echo "✅ 前端环境变量已更新"
else
    echo "❌ ngrok启动失败，请检查日志"
    exit 1
fi 