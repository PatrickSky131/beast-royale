#!/bin/bash

# ngrok 重启脚本
# 单独重启ngrok服务，保持URL不变或获取新URL

echo "🔄 重启 ngrok 服务..."

# 创建logs目录（如果不存在）
mkdir -p logs

# 检查ngrok是否在运行
if pgrep -f "ngrok" > /dev/null; then
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
    read -p "确定要重启ngrok服务吗？这将生成新的URL (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 取消重启"
        exit 0
    fi
    
    # 停止ngrok服务
    echo "🛑 停止ngrok服务..."
    if [ -f logs/ngrok.pid ]; then
        NGROK_PID=$(cat logs/ngrok.pid)
        if kill -0 $NGROK_PID 2>/dev/null; then
            kill $NGROK_PID
            echo "✅ ngrok服务已停止 (PID: $NGROK_PID)"
        else
            echo "⚠️  ngrok进程不存在，强制停止..."
            pkill -f "ngrok"
        fi
        rm -f logs/ngrok.pid
    else
        pkill -f "ngrok"
        echo "✅ ngrok服务已停止"
    fi
    
    # 等待进程完全停止
    sleep 3
else
    echo "ℹ️  ngrok服务未运行"
fi

# 启动ngrok服务
echo "🌐 启动ngrok隧道..."
ngrok http 3000 > logs/ngrok.log 2>&1 &
NGROK_PID=$!
echo "✅ ngrok服务已启动 (PID: $NGROK_PID)"

# 保存PID
echo $NGROK_PID > logs/ngrok.pid

# 等待ngrok启动
echo "⏳ 等待ngrok启动..."
sleep 5

# 获取新的ngrok公共URL
echo "🔍 获取新的ngrok公共URL..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data['tunnels']:
    print(data['tunnels'][0]['public_url'])
else:
    print('获取失败')
")

# 显示结果
echo ""
echo "🎉 ngrok服务重启完成！"
echo "=================================="
echo "🌐 新的公网访问地址: $NGROK_URL"
echo "📊 ngrok管理界面: http://localhost:4040"
echo "=================================="
echo ""
echo "📝 ngrok日志: logs/ngrok.log"
echo "" 