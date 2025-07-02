# Beast Royale 项目命令指南
# 使用方法：复制粘贴以下命令到终端执行

# ========================================
# 🚀 启动服务
# ========================================

# 1. 启动ngrok隧道（获取公网地址）
./start-ngrok.sh

# 2. 启动后端服务
cd backend && ./start.sh

# 3. 启动前端服务
cd frontend && ./start.sh

# ========================================
# 🛑 停止服务
# ========================================

# 1. 停止前端服务
cd frontend && ./stop.sh

# 2. 停止后端服务
cd backend && ./stop.sh

# 3. 停止ngrok隧道
./stop-ngrok.sh

# ========================================
# ⚡ 一键操作
# ========================================

# 一键启动所有服务
./start-ngrok.sh && cd backend && ./start.sh && cd ../frontend && ./start.sh

# 一键停止所有服务
cd frontend && ./stop.sh && cd ../backend && ./stop.sh && cd .. && ./stop-ngrok.sh

# ========================================
# 📊 检查服务状态
# ========================================

# 检查端口占用
lsof -i :5173  # 前端端口
lsof -i :8080  # 后端端口
lsof -i :4040  # ngrok端口

# 检查进程
ps aux | grep ngrok
ps aux | grep "npm run dev"
ps aux | grep "go run"

# 查看所有相关进程
ps aux | grep -E "(ngrok|vite|go run|main.go)"

# ========================================
# 🌐 访问地址
# ========================================

# 前端本地地址
open http://localhost:5173

# 后端API地址
open http://localhost:8080

# ngrok管理界面
open http://localhost:4040

# ========================================
# 🔧 开发调试
# ========================================

# 查看ngrok日志
tail -f ngrok.log

# 查看前端环境变量
cat frontend/.env

# 查看后端配置
cat backend/config.yaml

# 重新构建前端
cd frontend && npm run build

# 重新构建后端
cd backend && go build -o beast-royale-backend main.go

# ========================================
# 🧹 清理操作
# ========================================

# 清理所有PID文件
rm -f .ngrok.pid backend/.backend.pid frontend/.frontend.pid

# 清理日志文件
rm -f ngrok.log

# 强制停止所有相关进程
pkill -f ngrok
pkill -f "npm run dev"
pkill -f "go run"
pkill -f "main.go"

# ========================================
# 📝 常用组合命令
# ========================================

# 重启前端（保持后端运行）
cd frontend && ./stop.sh && ./start.sh

# 重启后端（保持前端运行）
cd backend && ./stop.sh && ./start.sh

# 重启ngrok（保持前后端运行）
./stop-ngrok.sh && ./start-ngrok.sh

# 检查所有服务状态
echo "=== 服务状态检查 ===" && \
echo "前端端口5173:" && lsof -i :5173 && \
echo "后端端口8080:" && lsof -i :8080 && \
echo "ngrok端口4040:" && lsof -i :4040 