# ngrok 自动检测配置

## 功能概述

前端现在支持自动检测本地运行的 ngrok 隧道，无需手动配置 ngrok URL。

## 配置选项

### 1. 自动检测模式（推荐）

在 `frontend/src/config/index.js` 中设置：

```javascript
api: {
  ngrok: {
    autoDetect: true,  // 启用自动检测
    fixedUrl: '',      // 自动检测时忽略此字段
    checkInterval: 5000 // 检测间隔（毫秒）
  }
}
```

**优点：**
- 自动检测本地运行的 ngrok
- 支持多个隧道（优先选择 HTTPS）
- 自动重试和错误恢复
- 无需手动更新 URL

### 2. 手动配置模式

```javascript
api: {
  ngrok: {
    autoDetect: false, // 禁用自动检测
    fixedUrl: 'https://your-ngrok-url.ngrok-free.app',
    checkInterval: 5000
  }
}
```

**适用场景：**
- 生产环境使用固定的 ngrok URL
- 需要精确控制 API 端点

## 使用方法

### 1. 启动 ngrok

```bash
# 启动 ngrok 隧道到后端服务
ngrok http 8080
```

### 2. 启动前端服务

```bash
cd frontend
npm run dev
```

### 3. 查看配置状态

在开发者模式下，页面会显示 ngrok 配置组件，包含：
- 当前检测模式
- ngrok 运行状态
- 当前使用的 API 地址
- 手动刷新和测试连接功能

## 开发者模式

开发者模式会在以下情况下自动启用：
- `config.app.isDevMode` 设置为 `true`
- 访问 localhost 或 127.0.0.1
- 通过 ngrok 域名访问

## 工作原理

1. **初始化检测**：前端启动时自动检测 ngrok 隧道
2. **API 调用**：使用检测到的 URL 进行 API 请求
3. **错误恢复**：网络错误时自动重新检测并重试
4. **缓存机制**：避免频繁检测，提高性能

## 故障排除

### ngrok 未检测到

1. 确保 ngrok 正在运行：`http://localhost:4040`
2. 检查 ngrok API 是否可访问
3. 查看浏览器控制台日志

### API 请求失败

1. 检查后端服务是否运行在端口 8080
2. 确认 ngrok 隧道配置正确
3. 使用配置组件中的"测试连接"功能

### 手动刷新

如果自动检测失败，可以：
1. 点击"刷新 ngrok 检测"按钮
2. 检查 ngrok 状态
3. 重新启动 ngrok 隧道

## 配置示例

### 开发环境配置

```javascript
// frontend/src/config/index.js
const config = {
  api: {
    ngrok: {
      autoDetect: true,
      checkInterval: 3000
    }
  },
  app: {
    isDevMode: true
  }
}
```

### 生产环境配置

```javascript
const config = {
  api: {
    ngrok: {
      autoDetect: false,
      fixedUrl: 'https://your-production-ngrok.ngrok-free.app'
    }
  },
  app: {
    isDevMode: false
  }
}
```

## 注意事项

1. ngrok 免费版有连接数限制
2. 生产环境建议使用付费版或固定域名
3. 自动检测功能仅在开发者模式下可用
4. 检测间隔不宜过短，避免影响性能 