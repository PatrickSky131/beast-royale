# WalletConnect 设置指南

## 🔧 快速设置

### 1. 获取 WalletConnect Project ID

1. 访问 [WalletConnect Cloud](https://cloud.walletconnect.com)
2. 创建账户并登录
3. 点击 **"Create Project"** 创建新项目
4. 填写项目信息：
   - **Project Name**: Beast Royale
   - **Project Description**: Beast Royale - 区块链游戏平台
   - **Project URL**: 您的应用URL（如：https://yourdomain.com）
5. 创建完成后，复制生成的 **Project ID**

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# frontend/.env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_APP_URL=your_app_url_here
```

**配置说明：**
- `VITE_WALLETCONNECT_PROJECT_ID`: 从WalletConnect Cloud获取的Project ID
- `VITE_APP_URL`: 您的应用访问URL

**URL配置示例：**
```bash
# 本地开发
VITE_APP_URL=http://localhost:5173

# ngrok测试
VITE_APP_URL=https://abc123.ngrok.io

# 生产环境
VITE_APP_URL=https://yourdomain.com
```

将 `your_project_id_here` 和 `your_app_url_here` 替换为实际值。

### 3. 配置允许的域名（重要！）

**如果您使用ngrok进行移动端测试：**

1. 访问 [WalletConnect Cloud](https://cloud.walletconnect.com)
2. 进入您的项目设置
3. 在 **"Allowed Domains"** 中添加：
   - `http://localhost:5173` (本地开发)
   - `https://your-ngrok-url.ngrok.io` (ngrok域名)
   - 您的生产域名

**示例ngrok域名配置：**
```
http://localhost:5173
https://abc123.ngrok.io
https://yourdomain.com
```

### 4. 验证配置

启动应用后，打开浏览器控制台，应该看到：
```
✅ WalletConnect配置验证通过
```

如果看到错误消息，请检查Project ID是否正确设置。

## 📱 使用方法

### 移动端外部浏览器
1. 在Safari、Chrome等外部浏览器中访问应用
2. 系统会自动检测并推荐使用WalletConnect
3. 点击 **"🔗 WalletConnect连接"** 按钮
4. 使用手机钱包扫描二维码
5. 在钱包中确认连接
6. 完成签名验证

### 桌面端
1. 点击 **"WalletConnect"** 连接选项
2. 扫描二维码或使用钱包应用的WalletConnect功能
3. 在移动钱包中确认连接
4. 完成签名验证

## 🔍 故障排除

### ❌ "未设置WalletConnect Project ID"
- 检查 `.env` 文件是否存在
- 确认环境变量名称正确：`VITE_WALLETCONNECT_PROJECT_ID`
- 重启开发服务器

### ❌ "WalletConnect连接失败"
- 确保Project ID有效且未过期
- 检查网络连接
- 尝试刷新页面

### ❌ "未找到支持WalletConnect的钱包"
- 确保手机上已安装MetaMask、Trust Wallet等兼容钱包
- 确保钱包应用支持WalletConnect v2

## 🎯 支持的钱包

WalletConnect支持200+钱包，包括：

- **MetaMask** (推荐)
- **Trust Wallet**
- **Coinbase Wallet**
- **Rainbow**
- **imToken**
- **TokenPocket**
- **Math Wallet**
- 以及更多...

## 🔒 安全注意事项

1. **保护Project ID**: 虽然Project ID不是敏感信息，但建议不要在公开代码中硬编码
2. **验证域名**: 在WalletConnect Cloud中正确设置允许的域名
3. **用户教育**: 提醒用户只在信任的网站上连接钱包

## 📚 更多资源

- [WalletConnect官方文档](https://docs.walletconnect.com/)
- [WalletConnect Cloud](https://cloud.walletconnect.com)
- [支持的钱包列表](https://explorer.walletconnect.com/)

## 🐛 问题反馈

如果遇到问题，请提供以下信息：
- 浏览器类型和版本
- 操作系统
- 使用的钱包应用
- 控制台错误信息 