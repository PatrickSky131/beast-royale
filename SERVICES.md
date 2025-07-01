# Beast Royale 服务管理

这个项目包含了便捷的shell脚本，用于管理前端、后端和ngrok服务。

## 📁 文件说明

- `start-services.sh` - 一键启动所有服务
- `stop-services.sh` - 一键停止所有服务
- `restart-ngrok.sh` - 单独重启ngrok服务
- `ngrok-status.sh` - 查看ngrok状态和URL
- `logs/` - 日志文件目录

## 🚀 使用方法

### 启动所有服务
```bash
./start-services.sh
```

这个脚本会：
1. 检查是否有服务已在运行
2. 启动后端服务（Go + Gin）
3. 启动前端服务（Vue + Vite）
4. **智能启动ngrok**：
   - 如果ngrok已在运行，会询问是否重启
   - 如果选择不重启，会保持现有URL
   - 如果选择重启，会生成新的URL
5. 显示所有服务的访问地址
6. 保存进程PID到logs目录

### 停止所有服务
```bash
./stop-services.sh
```

### 单独管理ngrok

#### 查看ngrok状态
```bash
./ngrok-status.sh
```
- 显示ngrok是否在运行
- 显示当前的公网URL
- 自动复制URL到剪贴板（macOS）
- 显示进程信息

#### 重启ngrok服务
```bash
./restart-ngrok.sh
```
- 显示当前URL
- 询问确认后重启
- 生成新的公网URL
- 保持其他服务运行

## 🌐 服务地址

启动成功后，您可以通过以下地址访问服务：

- **本地前端**: http://localhost:3000
- **公网前端**: https://[ngrok-url].ngrok-free.app
- **本地后端API**: http://localhost:8080
- **ngrok管理界面**: http://localhost:4040

## 📝 日志文件

所有服务的日志都会保存在 `logs/` 目录中：

- `backend.log` - 后端服务日志
- `frontend.log` - 前端服务日志
- `ngrok.log` - ngrok隧道日志
- `*.pid` - 进程PID文件

## 🔄 ngrok URL管理

### 保持URL稳定
- 默认情况下，启动脚本会保持ngrok运行
- 只有在明确选择时才会重启ngrok
- 这样可以保持公网URL稳定，方便分享

### 需要新URL时
- 使用 `./restart-ngrok.sh` 单独重启
- 或者启动时选择重启ngrok

### 快速获取URL
- 使用 `./ngrok-status.sh` 快速查看当前URL
- 支持自动复制到剪贴板

## ⚠️ 注意事项

1. **首次使用前**，确保已安装必要的依赖：
   ```bash
   # 后端依赖
   cd backend && go mod download
   
   # 前端依赖
   cd frontend && npm install
   ```

2. **ngrok配置**：确保已安装并配置ngrok（需要免费账户）

3. **端口占用**：确保端口3000、8080、4040没有被其他程序占用

4. **权限问题**：如果遇到权限错误，请确保脚本有执行权限：
   ```bash
   chmod +x start-services.sh stop-services.sh restart-ngrok.sh ngrok-status.sh
   ```

## 🔧 故障排除

### 服务启动失败
1. 检查日志文件：`logs/backend.log`、`logs/frontend.log`、`logs/ngrok.log`
2. 确认依赖已安装
3. 检查端口是否被占用

### 服务停止失败
1. 手动检查进程：`ps aux | grep -E "(go|vite|ngrok)"`
2. 手动停止：`pkill -f "进程名"`

### ngrok连接问题
1. 检查ngrok是否已登录：`ngrok config check`
2. 查看ngrok日志：`tail -f logs/ngrok.log`
3. 使用 `./ngrok-status.sh` 检查状态

### URL管理
1. 使用 `./ngrok-status.sh` 查看当前URL
2. 使用 `./restart-ngrok.sh` 获取新URL
3. 访问 http://localhost:4040 查看ngrok管理界面

## 📋 手动操作

如果脚本无法正常工作，您也可以手动启动服务：

```bash
# 启动后端
cd backend && make dev

# 启动前端（新终端）
cd frontend && npm run dev

# 启动ngrok（新终端）
ngrok http 3000
```

## 🎯 使用场景

### 日常开发
```bash
./start-services.sh  # 启动所有服务，保持ngrok URL
```

### 需要新URL
```bash
./restart-ngrok.sh   # 重启ngrok获取新URL
```

### 快速查看URL
```bash
./ngrok-status.sh    # 查看当前URL并复制到剪贴板
```

### 停止所有服务
```bash
./stop-services.sh   # 停止所有服务
``` 