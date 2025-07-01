# Beast Royale Frontend

这是一个基于Vue 3的前端应用，提供MetaMask钱包连接和游戏界面。

## 项目结构

```
frontend/
├── src/
│   ├── components/          # Vue组件
│   ├── views/              # 页面组件
│   │   ├── Home.vue        # 首页
│   │   └── Game.vue        # 游戏页面
│   ├── stores/             # Pinia状态管理
│   │   └── wallet.js       # 钱包状态
│   ├── router/             # Vue Router
│   │   └── index.js        # 路由配置
│   ├── App.vue             # 根组件
│   ├── main.js             # 应用入口
│   └── style.css           # 全局样式
├── public/                 # 静态资源
├── index.html              # HTML模板
├── package.json            # 项目配置
├── vite.config.js          # Vite配置
└── README.md              # 项目说明
```

## 功能特性

- MetaMask钱包连接
- 以太坊签名验证
- 响应式设计
- 现代化UI界面
- 状态管理

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

3. 构建生产版本：
```bash
npm run build
```

## 技术栈

- Vue 3
- Vue Router
- Pinia
- Vite
- Ethers.js
- Axios

## 开发

项目使用Vue 3 Composition API和现代前端工具链。 