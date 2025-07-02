# 🚀 Beast Royale 服务管理指南

## 📋 脚本概览

本项目提供了6个独立的服务管理脚本，分别管理ngrok隧道和前后端服务：

### 🌐 ngrok服务管理
- `stop-ngrok.sh` - 停止ngrok服务
- `start-ngrok.sh` - 启动ngrok服务
- `restart-ngrok.sh` - 重启ngrok服务

### 🖥️ 前后端服务管理
- `stop-services.sh` - 停止前后端服务
- `start-services.sh` - 启动前后端服务
- `restart-services.sh` - 重启前后端服务

## 🎯 推荐操作流程

### 首次启动（推荐流程）
```bash
# 1. 启动ngrok隧道并配置环境变量
./start-ngrok.sh

# 2. 启动前后端服务
./start-services.sh
```

### 开发调试流程
```bash
# 代码更新后重启前后端（保持ngrok不变）
./restart-services.sh

# 需要新的公网地址时重启ngrok
./restart-ngrok.sh
```

### 完全停止
```bash
# 停止所有服务
./stop-services.sh
./stop-ngrok.sh
```

## 🔧 脚本功能详解

### start-ngrok.sh
- ✅ 检查ngrok是否已运行
- ✅ 启动ngrok隧道到端口5173
- ✅ 自动获取公网URL
- ✅ 自动配置前端环境变量 `VITE_APP_URL`
- ✅ 提示下一步操作

### start-services.sh
- ✅ 检查前端环境变量配置
- ✅ 检查ngrok运行状态
- ✅ 自动更新环境变量（如果ngrok URL变化）
- ✅ 智能检测服务运行状态
- ✅ 启动Go后端和Vite前端
- ✅ 端口占用检查

### restart-services.sh
- ✅ 停止前后端服务
- ✅ 重启前后端服务
- ✅ 保持ngrok隧道运行
- ✅ 自动更新环境变量

### restart-ngrok.sh
- ✅ 重启ngrok隧道
- ✅ 获取新的公网URL
- ✅ 更新前端环境变量
- ✅ 需要前端服务运行

## ⚠️ 重要注意事项

### 环境变量配置
- `start-ngrok.sh` 会自动配置 `frontend/.env` 文件
- 包含 `VITE_WALLETCONNECT_PROJECT_ID` 和 `VITE_APP_URL`
- 如果环境变量与ngrok URL不匹配，`start-services.sh` 会自动更新

### WalletConnect配置
- 每次ngrok重启后，需要在 [WalletConnect Cloud](https://cloud.walletconnect.com/) 中添加新的域名
- 域名格式：`https://xxxx-xx-xx-xxx-xx.ngrok.io`

### 端口使用
- 前端服务：5173
- 后端服务：8080
- ngrok管理界面：4040

## 🛠️ 故障排除

### 端口被占用
```bash
# 检查端口占用
lsof -i :5173
lsof -i :8080
lsof -i :4040

# 强制停止占用进程
pkill -9 -f "vite"
pkill -9 -f "go run"
pkill -9 -f "ngrok"
```

### 环境变量问题
```bash
# 手动检查环境变量
cat frontend/.env

# 手动配置环境变量
cd frontend
echo "VITE_WALLETCONNECT_PROJECT_ID=2ef4bc0023aa46a876ae676fd622b125" > .env
echo "VITE_APP_URL=https://your-ngrok-url.ngrok.io" >> .env
cd ..
```

### ngrok连接问题
```bash
# 检查ngrok状态
curl http://localhost:4040/api/tunnels

# 重启ngrok
./restart-ngrok.sh
```

## 📝 日志和状态

### 进程ID文件
- `.ngrok.pid` - ngrok进程ID
- `.frontend.pid` - 前端进程ID
- `.backend.pid` - 后端进程ID

### 服务状态检查
```bash
# 检查所有服务状态
ps aux | grep -E "(ngrok|vite|go run)"

# 检查端口占用
netstat -tulpn | grep -E "(5173|8080|4040)"
```

## 🎉 快速开始

1. **确保依赖已安装**
   ```bash
   # 检查ngrok
   ngrok version
   
   # 检查Node.js
   node --version
   
   # 检查Go
   go version
   ```

2. **启动完整服务**
   ```bash
   ./start-ngrok.sh
   ./start-services.sh
   ```

3. **访问应用**
   - 本地访问：http://localhost:5173
   - 公网访问：ngrok提供的URL
   - ngrok管理：http://localhost:4040

4. **开发调试**
   ```bash
   # 代码更新后
   ./restart-services.sh
   
   # 需要新公网地址
   ./restart-ngrok.sh
   ```

## 🔄 自动化脚本

如果需要一键启动所有服务，可以创建组合脚本：

```bash
#!/bin/bash
# start-all.sh
echo "🚀 启动所有服务..."
./start-ngrok.sh
sleep 3
./start-services.sh
```

```bash
#!/bin/bash
# stop-all.sh
echo "🛑 停止所有服务..."
./stop-services.sh
./stop-ngrok.sh
```

---

**提示**：建议按照推荐流程操作，先启动ngrok配置环境变量，再启动前后端服务，这样可以确保WalletConnect正常工作。 