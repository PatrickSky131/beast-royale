# Beast Royale 服务管理

这个项目包含了两个便捷的shell脚本，用于一键管理前端、后端和ngrok服务。

## 📁 文件说明

- `start-services.sh` - 一键启动所有服务
- `stop-services.sh` - 一键停止所有服务
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
4. 启动ngrok隧道（暴露前端到公网）
5. 显示所有服务的访问地址
6. 保存进程PID到logs目录

### 停止所有服务
```bash
./stop-services.sh
```

这个脚本会：
1. 停止后端服务
2. 停止前端服务
3. 停止ngrok服务
4. 清理残留进程
5. 检查端口释放状态

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
   chmod +x start-services.sh stop-services.sh
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