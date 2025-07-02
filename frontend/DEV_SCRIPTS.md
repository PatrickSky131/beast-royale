# 开发脚本使用说明

## 🚀 智能开发服务器

为了避免影响ngrok服务，我们提供了智能的开发服务器管理脚本。

## 📋 可用命令

### 基础命令
```bash
npm run dev          # 标准启动（端口5173）
npm run dev:ngrok    # 专门为ngrok优化的启动
```

### 智能命令（推荐）
```bash
npm run dev:smart    # 智能启动，自动检测ngrok和端口占用
npm run restart:smart # 智能重启，不影响ngrok
```

### 安全命令
```bash
npm run dev:safe     # 安全启动，端口被占用时自动切换
npm run stop:safe    # 安全停止，只停止Vite进程
npm run restart      # 安全重启
```

## 🎯 推荐使用流程

### 1. 首次启动（配合ngrok）
```bash
# 1. 先启动ngrok（在另一个终端）
ngrok http 5173

# 2. 启动开发服务器
npm run dev:smart
```

### 2. 重启开发服务器（不影响ngrok）
```bash
npm run restart:smart
```

### 3. 停止开发服务器（保留ngrok）
```bash
npm run stop:safe
```

## 🔍 智能脚本功能

`npm run dev:smart` 会自动：

1. **检测ngrok进程**：如果发现ngrok运行，会优先使用端口5174
2. **检查端口占用**：自动选择可用端口
3. **智能端口分配**：
   - 有ngrok + 5173被占用 → 使用5174
   - 无ngrok + 5173被占用 → 尝试5173-5182
   - 5173可用 → 直接使用5173

## 📊 输出示例

```
🔍 检查开发环境...
✅ 检测到ngrok进程正在运行
⚠️ 端口5173被占用
💡 检测到ngrok正在运行，尝试使用端口5174
🎯 使用端口: 5174
🚀 启动Vite开发服务器，端口: 5174
```

## ⚠️ 注意事项

1. **ngrok配置**：如果使用端口5174，需要更新ngrok配置
2. **环境变量**：记得更新`.env`文件中的`VITE_APP_URL`
3. **防火墙**：确保新端口没有被防火墙阻止

## 🛠️ 故障排除

### 端口冲突
```bash
# 查看端口占用
lsof -i :5173
lsof -i :5174

# 强制停止所有Vite进程
pkill -f vite
```

### ngrok连接问题
```bash
# 检查ngrok状态
curl http://localhost:4040/api/tunnels

# 重启ngrok（如果需要）
pkill -f ngrok
ngrok http 5173  # 或 5174
``` 