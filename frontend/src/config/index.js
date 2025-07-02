// 应用配置文件
const config = {
  // API配置
  api: {
    // 使用相对路径，让Vite代理处理
    // 这样无论是本地开发还是通过ngrok访问，都能正常工作
    base: ''
  },
  
  // 获取当前环境的API地址
  getApiBase() {
    // 使用相对路径，让Vite代理处理API请求
    return this.api.base
  },
  
  // 应用配置
  app: {
    name: 'Beast Royale',
    version: '1.0.0',
    description: '区块链游戏平台',
    // 开发者模式
    // true: 显示详细错误信息、调试日志、vConsole等
    // false: 隐藏错误信息，不显示vConsole，只显示用户友好的提示
    isDevMode: false
  },
  
  // 钱包配置
  wallet: {
    // 支持的链ID
    supportedChains: [1, 5, 11155111, 137, 56], // Ethereum, Goerli, Sepolia, Polygon, BSC
    // 默认链ID
    defaultChainId: 1,
    // 连接后是否自动进行签名验证
    // true: 连接成功后自动进行签名验证（一步完成）
    // false: 连接成功后需要用户手动点击"完成签名验证"按钮（两步完成）
    autoSignAfterConnect: true
  }
}

export default config 