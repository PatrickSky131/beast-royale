#!/bin/bash

# ngrok 状态查看脚本

echo "📊 ngrok 服务状态"

# 检查ngrok是否在运行
if pgrep -f "ngrok" > /dev/null; then
    echo "✅ ngrok服务正在运行"
    
    # 获取ngrok URL
    echo "🔍 获取ngrok URL..."
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data['tunnels']:
    print(data['tunnels'][0]['public_url'])
else:
    print('获取失败')
")
    
    if [ "$NGROK_URL" != "获取失败" ]; then
        echo "🌐 公网访问地址: $NGROK_URL"
        echo "📊 管理界面: http://localhost:4040"
        
        # 复制URL到剪贴板（如果支持）
        if command -v pbcopy > /dev/null; then
            echo "$NGROK_URL" | pbcopy
            echo "📋 URL已复制到剪贴板"
        fi
    else
        echo "❌ 无法获取ngrok URL"
    fi
    
    # 显示进程信息
    echo ""
    echo "📋 进程信息:"
    ps aux | grep ngrok | grep -v grep
    
else
    echo "❌ ngrok服务未运行"
    echo ""
    echo "💡 启动选项:"
    echo "  ./start-services.sh    - 启动所有服务"
    echo "  ./restart-ngrok.sh     - 单独启动ngrok"
fi

echo "" 