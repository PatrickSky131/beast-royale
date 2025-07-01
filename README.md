# Beast Royale 游戏项目

这是一个完整的区块链游戏demo项目，包含Go后端和Vue前端，实现MetaMask钱包连接和签名验证功能。

## 项目结构

```
Beast Royale/
├── backend/                 # Go后端服务
│   ├── cmd/
│   │   └── main.go         # 主程序入口
│   ├── internal/
│   │   ├── api/            # API处理器
│   │   ├── db/             # 数据库模块
│   │   ├── server/         # HTTP服务器
│   │   └── wallet/         # 钱包服务
│   ├── go.mod              # Go模块文件
│   └── README.md           # 后端说明
├── frontend/               # Vue前端应用
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── stores/         # 状态管理
│   │   ├── router/         # 路由配置
│   │   └── ...
│   ├── package.json        # 前端依赖
│   └── README.md           # 前端说明
└── README.md              # 项目总说明
```

## 功能特性

### 后端功能
- MetaMask钱包连接API
- 以太坊签名验证
- 用户管理
- SQLite数据库
- RESTful API
- CORS支持

### 前端功能
- MetaMask钱包连接界面
- 签名验证流程
- 响应式设计
- 现代化UI
- 状态管理

## 快速开始

### 1. 启动后端服务

```bash
cd backend
go mod tidy
go run cmd/main.go
```

后端服务将在 `http://localhost:8080` 启动。

### 2. 启动前端应用

```bash
cd frontend
npm install
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

### 3. 使用MetaMask连接

1. 确保已安装MetaMask浏览器插件
2. 访问 `http://localhost:3000/game`
3. 点击"连接MetaMask"按钮
4. 在MetaMask中确认连接
5. 签名验证消息
6. 完成连接

## 技术栈

### 后端
- Go 1.21+
- Gin Web框架
- GORM ORM
- SQLite数据库
- go-ethereum

### 前端
- Vue 3
- Vue Router
- Pinia状态管理
- Vite构建工具
- Ethers.js
- Axios

## API接口

### 钱包连接
- `POST /api/v1/wallet/connect` - 连接钱包
- `POST /api/v1/wallet/verify` - 验证签名

### 健康检查
- `GET /health` - 服务器状态

## 开发说明

这是一个完整的demo项目，展示了如何实现：
1. Go后端的标准项目结构
2. Vue前端的现代化开发
3. MetaMask钱包集成
4. 以太坊签名验证
5. 前后端通信

项目遵循最佳实践，代码结构清晰，易于扩展和维护。 