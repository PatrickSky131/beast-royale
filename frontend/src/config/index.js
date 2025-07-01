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
    description: '区块链游戏平台'
  },
  
  // 钱包配置
  wallet: {
    // 支持的链ID
    supportedChains: [1, 5, 11155111, 137, 56], // Ethereum, Goerli, Sepolia, Polygon, BSC
    // 默认链ID
    defaultChainId: 1
  }
}

export default config 