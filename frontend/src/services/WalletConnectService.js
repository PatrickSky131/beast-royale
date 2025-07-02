import { ethers } from 'ethers'
import walletConnectConfig, { validateWalletConnectConfig } from '../config/walletconnect.js'

class WalletConnectService {
  constructor() {
    this.provider = null
    this.ethersProvider = null
    this.isConnected = false
    this.account = null
    this.chainId = null
    
    // 验证配置
    this.configValid = validateWalletConnectConfig()
  }

  // 检测是否在外部浏览器中
  isExternalBrowser() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const hasEthereum = typeof window.ethereum !== 'undefined'
    const isInMetaMaskBrowser = navigator.userAgent.toLowerCase().includes('metamask')
    
    return isMobile && !hasEthereum && !isInMetaMaskBrowser
  }

  // 动态加载WalletConnect v2
  async loadWalletConnect() {
    try {
      // 使用动态导入加载WalletConnect v2
      const { EthereumProvider } = await import('@walletconnect/ethereum-provider')
      return { EthereumProvider }
    } catch (error) {
      console.error('加载WalletConnect失败:', error)
      // 如果无法加载新版本，尝试从CDN加载
      try {
        const { EthereumProvider } = await import('@walletconnect/universal-provider')
        return { EthereumProvider }
      } catch (cdnError) {
        console.error('从CDN加载WalletConnect也失败:', cdnError)
        throw new Error('无法加载WalletConnect，请确保网络连接正常')
      }
    }
  }

  // 连接WalletConnect
  async connect() {
    try {
      console.log('开始WalletConnect连接...')

      // 检查配置
      if (!this.configValid) {
        throw new Error('WalletConnect配置无效，请检查控制台日志')
      }

      if (walletConnectConfig.projectId === 'YOUR_PROJECT_ID_HERE') {
        throw new Error('请先配置WalletConnect Project ID。访问 https://cloud.walletconnect.com 获取')
      }

      // 动态加载WalletConnect
      const { EthereumProvider } = await this.loadWalletConnect()

      // 创建WalletConnect provider
      this.provider = await EthereumProvider.init({
        projectId: walletConnectConfig.projectId,
        chains: walletConnectConfig.chains,
        showQrModal: true,
        metadata: walletConnectConfig.metadata
      })

      // 监听连接事件
      this.provider.on('display_uri', (uri) => {
        console.log('WalletConnect URI:', uri)
        // 可以自定义二维码显示
      })

      this.provider.on('connect', (connectInfo) => {
        console.log('WalletConnect连接成功:', connectInfo)
        this.isConnected = true
        this.chainId = connectInfo.chainId
      })

      this.provider.on('disconnect', (disconnectInfo) => {
        console.log('WalletConnect断开连接:', disconnectInfo)
        this.isConnected = false
        this.account = null
        this.chainId = null
      })

      this.provider.on('accountsChanged', (accounts) => {
        console.log('账户变更:', accounts)
        this.account = accounts.length > 0 ? accounts[0] : null
      })

      this.provider.on('chainChanged', (chainId) => {
        console.log('链变更:', chainId)
        this.chainId = chainId
      })

      // 启用连接
      const accounts = await this.provider.enable()
      
      if (accounts.length === 0) {
        throw new Error('没有连接到钱包账户')
      }

      this.account = accounts[0]
      this.isConnected = true

      // 创建ethers provider
      this.ethersProvider = new ethers.BrowserProvider(this.provider)

      // 获取网络信息
      const network = await this.ethersProvider.getNetwork()
      this.chainId = network.chainId

      return {
        account: this.account,
        chainId: this.chainId,
        isConnected: this.isConnected,
        walletType: 'walletconnect'
      }

    } catch (error) {
      console.error('WalletConnect连接失败:', error)
      
      // 安全地检查错误消息
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      
      // 提供更友好的错误信息
      if (errorMessage.includes('Project ID')) {
        throw new Error('WalletConnect项目ID配置错误，请访问 https://cloud.walletconnect.com 获取有效的Project ID')
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        throw new Error('用户取消了连接请求')
      } else if (errorMessage.includes('User denied') || errorMessage.includes('user denied')) {
        throw new Error('用户拒绝了连接请求')
      } else if (errorMessage.includes('No wallet')) {
        throw new Error('未找到支持WalletConnect的钱包，请确保已安装MetaMask或其他兼容钱包')
      } else {
        throw new Error(`WalletConnect连接失败: ${errorMessage}`)
      }
    }
  }

  // 签名消息
  async signMessage(message) {
    try {
      if (!this.ethersProvider || !this.account) {
        throw new Error('请先连接WalletConnect')
      }

      console.log('开始WalletConnect签名...')
      
      const signer = await this.ethersProvider.getSigner()
      const signature = await signer.signMessage(message)

      return {
        message,
        signature,
        address: this.account
      }
    } catch (error) {
      console.error('WalletConnect签名失败:', error)
      
      // 安全地检查错误消息
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        throw new Error('用户取消了签名请求')
      } else if (errorMessage.includes('User denied') || errorMessage.includes('user denied')) {
        throw new Error('用户拒绝了签名请求')
      } else {
        throw new Error(`WalletConnect签名失败: ${errorMessage}`)
      }
    }
  }

  // 断开连接
  async disconnect() {
    try {
      if (this.provider) {
        await this.provider.disconnect()
      }
      
      this.provider = null
      this.ethersProvider = null
      this.isConnected = false
      this.account = null
      this.chainId = null
      
      console.log('WalletConnect已断开连接')
    } catch (error) {
      console.error('断开WalletConnect连接失败:', error)
      throw error
    }
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId,
      walletType: 'walletconnect',
      configValid: this.configValid
    }
  }

  // 获取余额
  async getBalance(address = null) {
    try {
      if (!this.ethersProvider) {
        throw new Error('请先连接WalletConnect')
      }

      const targetAddress = address || this.account
      const balance = await this.ethersProvider.getBalance(targetAddress)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('获取余额失败:', error)
      throw error
    }
  }

  // 获取网络信息
  async getNetwork() {
    try {
      if (!this.ethersProvider) {
        throw new Error('请先连接WalletConnect')
      }

      return await this.ethersProvider.getNetwork()
    } catch (error) {
      console.error('获取网络信息失败:', error)
      throw error
    }
  }

  // 检查是否支持当前网络
  isSupportedChain(chainId) {
    return walletConnectConfig.chains.includes(Number(chainId))
  }

  // 获取支持的网络列表
  getSupportedChains() {
    return walletConnectConfig.chains
  }
}

// 创建单例实例
const walletConnectService = new WalletConnectService()

export default walletConnectService 