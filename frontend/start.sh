#!/bin/bash

echo "🚀 启动前端服务..."

# 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# 检查端口占用
if lsof -i :5173 >/dev/null 2>&1; then
    echo "⚠️ 端口5173已被占用，正在停止现有进程..."
    lsof -ti :5173 | xargs kill -9
    sleep 2
fi

# 使用 Node.js 20
nvm use 20

# 启动前端服务
cd "$(dirname "$0")"
if [ -f "package.json" ]; then
    echo "启动前端开发服务器..."
    npm run dev &
else
    echo "❌ 未找到package.json文件"
    exit 1
fi

FRONTEND_PID=$!
echo "$FRONTEND_PID" > .frontend.pid
echo "✅ 前端已启动 (PID: $FRONTEND_PID)"
echo "🌐 前端服务地址: http://localhost:5173" 
