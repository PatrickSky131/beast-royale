# 重启脚本使用说明

## 🚀 两个重启脚本

我们提供了两个智能重启脚本，满足不同的使用场景：

### 1. `restart-all.sh` - 重启所有服务（包括ngrok）

**功能**：
- ✅ 停止所有服务（ngrok、前端、后端）
- ✅ 重新启动所有服务
- ✅ 自动获取新的ngrok URL
- ✅ 自动更新环境变量
- ✅ 保存进程ID

**使用场景**：
- 首次启动项目
- 需要新的ngrok隧道
- 完全重置所有服务

**使用方法**：
```bash
./restart-all.sh
```

### 2. `restart-services.sh` - 重启前后端服务（保留ngrok）

**功能**：
- ✅ 检查ngrok状态
- ✅ 只重启前后端服务
- ✅ 保留现有ngrok隧道
- ✅ 自动更新环境变量
- ✅ 保存进程ID

**使用场景**：
- 代码修改后重启
- 保持ngrok隧道不变
- 快速重启开发服务

**使用方法**：
```bash
./restart-services.sh
```

## 📋 脚本特性

### 🎯 智能检测
- 自动检测项目结构（Go后端、Vue前端）
- 智能端口检测和分配
- ngrok状态检查和URL获取

### 🛡️ 安全停止
- 精确的进程识别和停止
- 等待进程完全退出
- 端口占用检查

### 🔄 自动配置
- 自动更新前端环境变量
- 保存进程ID到文件
- 显示详细的服务状态

### 🎨 友好界面
- 彩色输出和状态提示
- 详细的操作日志
- 错误处理和警告

## 🚀 使用流程

### 首次启动（推荐使用 `restart-all.sh`）
```bash
# 1. 确保在项目根目录
cd /path/to/Beast\ Royale

# 2. 执行重启所有服务
./restart-all.sh

# 3. 等待所有服务启动完成
# 4. 复制显示的ngrok URL
# 5. 在WalletConnect Cloud中添加域名
```

### 开发过程中重启（推荐使用 `restart-services.sh`）
```bash
# 1. 修改代码后重启服务
./restart-services.sh

# 2. 服务会保持相同的ngrok URL
# 3. 无需重新配置WalletConnect
```

## 📊 输出示例

### restart-all.sh 输出
```
🔄 重启所有服务（包括ngrok）...
[14:30:15] 停止所有相关进程...
[14:30:15] 停止ngrok进程...
✅ ngrok已停止
[14:30:16] 停止前端Vite进程...
✅ 前端Vite已停止
[14:30:17] 停止后端进程...
✅ 后端Go进程已停止
[14:30:20] 检查端口占用情况...
✅ 端口 5173 可用
✅ 端口 8080 可用
[14:30:21] 启动后端服务...
✅ 后端已启动 (PID: 12345)
[14:30:26] 启动前端服务...
✅ 前端已启动 (PID: 12346)
[14:30:31] 启动ngrok隧道...
✅ ngrok已启动 (PID: 12347)
[14:30:39] 等待ngrok隧道建立...
✅ ngrok隧道已建立: https://abc123.ngrok.io
✅ 环境变量已更新: VITE_APP_URL=https://abc123.ngrok.io

=== 服务状态 ===
后端服务: http://localhost:8080
前端服务: http://localhost:5173
ngrok隧道: https://abc123.ngrok.io

✅ 所有服务重启完成！
访问地址: https://abc123.ngrok.io
⚠️ 记得在WalletConnect Cloud中添加域名: https://abc123.ngrok.io
```

### restart-services.sh 输出
```
🔄 重启前后端服务（保留ngrok）...
[14:35:15] 检查ngrok状态...
✅ ngrok进程正在运行
✅ 当前ngrok隧道: https://abc123.ngrok.io
[14:35:16] 停止前后端进程...
✅ 前端Vite已停止
✅ 后端Go进程已停止
[14:35:19] 检查端口占用情况...
✅ 端口 5173 可用
✅ 端口 8080 可用
[14:35:20] 启动后端服务...
✅ 后端已启动 (PID: 12348)
[14:35:25] 启动前端服务...
✅ 前端已启动 (PID: 12349)
✅ 环境变量已更新: VITE_APP_URL=https://abc123.ngrok.io

=== 服务状态 ===
后端服务: http://localhost:8080
前端服务: http://localhost:5173
ngrok隧道: https://abc123.ngrok.io (保持运行)

✅ 前后端服务重启完成！
访问地址: https://abc123.ngrok.io
```

## ⚠️ 注意事项

### 1. 权限要求
```bash
# 确保脚本有执行权限
chmod +x restart-all.sh restart-services.sh
```

### 2. 依赖检查
- 确保已安装 `ngrok`
- 确保已安装 `go` 和 `npm`
- 确保项目结构正确

### 3. 端口配置
- 后端默认端口：8080
- 前端默认端口：5173
- ngrok默认端口：5173

### 4. 环境变量
- 脚本会自动更新 `frontend/.env` 文件
- 包含WalletConnect Project ID和ngrok URL

## 🛠️ 故障排除

### 脚本无法执行
```bash
# 检查权限
ls -la restart-*.sh

# 重新添加权限
chmod +x restart-all.sh restart-services.sh
```

### 端口被占用
```bash
# 查看端口占用
lsof -i :5173
lsof -i :8080

# 手动停止进程
pkill -f vite
pkill -f "go run"
```

### ngrok连接问题
```bash
# 检查ngrok状态
curl http://localhost:4040/api/tunnels

# 重启ngrok
pkill -f ngrok
ngrok http 5173
```

## 📁 生成的文件

脚本运行后会生成以下文件：
- `.backend.pid` - 后端进程ID
- `.frontend.pid` - 前端进程ID
- `.ngrok.pid` - ngrok进程ID（仅restart-all.sh）
- `frontend/.env` - 更新的环境变量

这些文件可以用于进程管理和调试。 