#!/bin/bash

# Beast Royale 服务启动脚本
# 一键启动前端、后端和ngrok服务

echo "🚀 启动 Beast Royale 服务..."

# 检查是否已经有服务在运行
if pgrep -f "go run main.go" > /dev/null; then
    echo "⚠️  检测到后端服务已在运行"
fi

if pgrep -f "vite" > /dev/null; then
    echo "⚠️  检测到前端服务已在运行"
fi

if pgrep -f "ngrok" > /dev/null; then
    echo "⚠️  检测到ngrok服务已在运行"
    echo "📊 当前ngrok URL:"
    curl -s http://localhost:4040/api/tunnels | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data['tunnels']:
    print(f'  {data[\"tunnels\"][0][\"public_url\"]}')
else:
    print('  获取失败')
"
    echo ""
    read -p "是否要重启ngrok服务？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 重启ngrok服务..."
        pkill -f "ngrok"
        sleep 2
    else
        echo "✅ 保持ngrok服务运行"
        NGROK_RESTARTED=false
    fi
fi

# 启动后端服务
echo "📡 启动后端服务..."
cd backend
make dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎮 启动前端服务..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"

# 等待前端启动
sleep 5

# 启动ngrok服务（如果需要）
if [ "$NGROK_RESTARTED" != "false" ]; then
    echo "🌐 启动ngrok隧道..."
    ngrok http 3000 > logs/ngrok.log 2>&1 &
    NGROK_PID=$!
    echo "✅ ngrok服务已启动 (PID: $NGROK_PID)"
    
    # 等待ngrok启动
    sleep 3
fi

# 保存PID到文件
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

# 如果ngrok是新启动的，保存PID
if [ "$NGROK_RESTARTED" != "false" ]; then
    echo $NGROK_PID > logs/ngrok.pid
fi

# 获取ngrok公共URL
echo "🔍 获取ngrok公共URL..."
sleep 2
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data['tunnels']:
    print(data['tunnels'][0]['public_url'])
else:
    print('获取失败')
")

# 显示服务状态
echo ""
echo "🎉 所有服务启动完成！"
echo "=================================="
echo "📡 后端服务: http://localhost:8080"
echo "🎮 前端服务: http://localhost:3000"
echo "🌐 公网访问: $NGROK_URL"
echo "📊 ngrok管理: http://localhost:4040"
echo "=================================="
echo ""
echo "📝 日志文件位置:"
echo "   后端日志: logs/backend.log"
echo "   前端日志: logs/frontend.log"
echo "   ngrok日志: logs/ngrok.log"
echo ""
echo "🛑 使用 './stop-services.sh' 停止所有服务"
echo "🔄 使用 './restart-ngrok.sh' 单独重启ngrok"
echo "" 