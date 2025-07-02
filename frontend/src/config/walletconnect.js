// WalletConnect配置文件
// 要使用WalletConnect，您需要在 https://cloud.walletconnect.com 获取Project ID

export const walletConnectConfig = {
  // 在这里设置您的WalletConnect Project ID
  // 获取方式：
  // 1. 访问 https://cloud.walletconnect.com
  // 2. 创建账户并登录
  // 3. 创建新项目
  // 4. 复制Project ID到下面
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '2ef4bc0023aa46a876ae676fd622b125',
  
  // 支持的区块链网络
  chains: [
    1,        // Ethereum Mainnet
    11155111, // Sepolia Testnet
    137,      // Polygon Mainnet
    56,       // BSC Mainnet
  ],
  
  // 应用元数据
  metadata: {
    name: 'Beast Royale',
    description: 'Beast Royale - Web3游戏平台',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    icons: [`${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/favicon.ico`]
  },
  
  // 二维码模态框配置
  qrModalOptions: {
    themeMode: 'light',
    themeVariables: {
      '--wcm-font-family': '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      '--wcm-accent-color': '#007bff',
      '--wcm-background-color': '#ffffff',
    },
    enableExplorer: true,
    explorerRecommendedWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'  // Trust Wallet
    ],
    enableNetworkView: true,
    enableAccountView: true
  },
  
  // RPC端点配置（可选，用于备用连接）
  rpcUrls: {
    1: 'https://eth.llamarpc.com',
    11155111: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    137: 'https://polygon-rpc.com',
    56: 'https://bsc-dataseed.binance.org'
  }
}

// 验证配置是否正确
export function validateWalletConnectConfig() {
  const issues = []
  
  if (!walletConnectConfig.projectId || walletConnectConfig.projectId === 'YOUR_PROJECT_ID_HERE') {
    issues.push('❌ 未设置WalletConnect Project ID')
    issues.push('   请访问 https://cloud.walletconnect.com 获取Project ID')
    issues.push('   然后在 frontend/.env 文件中设置 VITE_WALLETCONNECT_PROJECT_ID')
  }
  
  if (walletConnectConfig.chains.length === 0) {
    issues.push('❌ 未配置支持的区块链网络')
  }
  
  if (!walletConnectConfig.metadata.name) {
    issues.push('❌ 未设置应用名称')
  }
  
  if (issues.length > 0) {
    console.warn('🔧 WalletConnect配置问题:')
    issues.forEach(issue => console.warn(issue))
    console.warn('')
    console.warn('💡 解决方案：')
    console.warn('1. 在 frontend/ 目录下创建 .env 文件')
    console.warn('2. 添加以下内容：')
    console.warn('   VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id')
    console.warn('   VITE_APP_URL=your_app_url')
    console.warn('3. 从 https://cloud.walletconnect.com 获取 Project ID')
    console.warn('')
    return false
  }
  
  console.log('✅ WalletConnect配置验证通过')
  console.log(`📋 Project ID: ${walletConnectConfig.projectId.slice(0, 8)}...`)
  console.log(`🌐 应用URL: ${walletConnectConfig.metadata.url}`)
  console.log(`🎯 图标URL: ${walletConnectConfig.metadata.icons[0]}`)
  
  return true
}

export default walletConnectConfig 