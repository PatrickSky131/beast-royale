import { ethers } from 'ethers'
import walletConnectConfig, { validateWalletConnectConfig } from '../config/walletconnect.js'
import config from '../config/index.js'
import { walletStore } from '../stores/wallet'

class WalletConnectService {
  constructor() {
    this.provider = null
    this.ethersProvider = null
    this.isConnected = false
    this.account = null
    this.chainId = null
    this.isConnecting = false  // 添加连接状态锁
    
    // 验证配置
    this.configValid = validateWalletConnectConfig()
    
    // 尝试恢复现有连接
    this.tryRestoreConnection()
  }

  // 尝试恢复现有连接
  async tryRestoreConnection() {
    try {
      if (config.app.isDevMode) {
        console.log('尝试恢复WalletConnect连接...')
      }
      
      // 动态加载WalletConnect
      const { EthereumProvider } = await this.loadWalletConnect()
      
      // 尝试初始化provider（这会自动恢复现有会话）
      this.provider = await EthereumProvider.init({
        projectId: walletConnectConfig.projectId,
        chains: walletConnectConfig.chains,
        showQrModal: false, // 不显示二维码，只是检查现有连接
        metadata: walletConnectConfig.metadata
      })
      
      if (config.app.isDevMode) {
        console.log('WalletConnect provider初始化完成')
        console.log('provider.connected:', this.provider.connected)
        console.log('provider.accounts:', this.provider.accounts)
        console.log('provider.chainId:', this.provider.chainId)
      }
      
      // 检查是否有现有连接
      if (this.provider.connected && this.provider.accounts && this.provider.accounts.length > 0) {
        if (config.app.isDevMode) {
          console.log('检测到现有WalletConnect连接')
        }
        
        this.account = this.provider.accounts[0]
        this.chainId = this.provider.chainId
        this.isConnected = true
        this.ethersProvider = new ethers.BrowserProvider(this.provider)
        
        if (config.app.isDevMode) {
          console.log('WalletConnect连接已恢复:', {
            account: this.account,
            chainId: this.chainId,
            isConnected: this.isConnected
          })
        }
        
        // 设置事件监听器
        this.setupEventListeners()
      } else {
        if (config.app.isDevMode) {
          console.log('没有检测到现有WalletConnect连接')
          console.log('provider.connected:', this.provider.connected)
          console.log('provider.accounts:', this.provider.accounts)
        }
        
        // 如果没有现有连接，清理provider以避免会话冲突
        if (this.provider) {
          try {
            await this.provider.disconnect()
          } catch (e) {
            // 忽略断开连接的错误
          }
          this.provider = null
        }
      }
    } catch (error) {
      if (config.app.isDevMode) {
        console.log('恢复WalletConnect连接失败:', error)
      }
      
      // 如果恢复失败，清理所有状态
      this.provider = null
      this.ethersProvider = null
      this.isConnected = false
      this.account = null
      this.chainId = null
      
      // 静默处理，不影响正常流程
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    if (!this.provider) return
    
    this.provider.on('display_uri', (uri) => {
      console.log('WalletConnect URI:', uri)
    })

    this.provider.on('connect', (connectInfo) => {
      console.log('WalletConnect连接成功:', connectInfo)
      this.isConnected = true
      this.chainId = connectInfo.chainId
      if (walletStore) {
        walletStore.isConnected = true
        walletStore.chainId = connectInfo.chainId
      }
    })

    this.provider.on('disconnect', (disconnectInfo) => {
      console.log('WalletConnect断开连接:', disconnectInfo)
      this.handleDisconnection(disconnectInfo)
    })

    this.provider.on('accountsChanged', (accounts) => {
      console.log('账户变更:', accounts)
      this.account = accounts.length > 0 ? accounts[0] : null
      if (walletStore) {
        walletStore.address = this.account
      }
    })

    this.provider.on('chainChanged', (chainId) => {
      console.log('链变更:', chainId)
      this.chainId = chainId
      if (walletStore) {
        walletStore.chainId = chainId
      }
    })

    // 添加会话过期监听
    this.provider.on('session_expire', (sessionExpireInfo) => {
      console.log('WalletConnect会话过期:', sessionExpireInfo)
      this.handleSessionExpire(sessionExpireInfo)
    })

    // 设置自动恢复机制
    this.setupAutoRecovery()
  }

  // 处理断开连接
  handleDisconnection(disconnectInfo) {
    console.log('处理WalletConnect断开连接:', disconnectInfo)
    
    // 清理状态
    this.isConnected = false
    this.account = null
    this.chainId = null
    if (walletStore) {
      walletStore.isConnected = false
      walletStore.address = null
      walletStore.chainId = null
    }
    
    // 尝试自动恢复连接
    this.attemptAutoRecovery()
  }

  // 处理会话过期
  handleSessionExpire(sessionExpireInfo) {
    console.log('处理WalletConnect会话过期:', sessionExpireInfo)
    
    // 清理状态
    this.handleDisconnection(sessionExpireInfo)
  }

  // 设置自动恢复机制
  setupAutoRecovery() {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('页面重新可见，检查连接状态')
        this.checkAndRecoverConnection()
      }
    })

    // 监听网络状态变化
    window.addEventListener('online', () => {
      console.log('网络已连接，尝试恢复WalletConnect连接')
      this.checkAndRecoverConnection()
    })

    // 定期检查连接状态
    this.recoveryInterval = setInterval(() => {
      this.checkAndRecoverConnection()
    }, 10000) // 每10秒检查一次
  }

  // 检查并恢复连接
  async checkAndRecoverConnection() {
    if (this.isConnecting) {
      return // 如果正在连接中，跳过
    }

    try {
      // 检查是否有现有连接
      if (this.provider && this.provider.connected) {
        console.log('WalletConnect连接正常')
        return
      }

      // 尝试恢复连接
      console.log('尝试自动恢复WalletConnect连接...')
      await this.attemptAutoRecovery()
    } catch (error) {
      console.log('自动恢复连接失败:', error)
    }
  }

  // 尝试自动恢复连接
  async attemptAutoRecovery() {
    if (this.isConnecting) {
      return
    }

    try {
      console.log('开始自动恢复WalletConnect连接...')
      
      // 检查配置
      if (!this.configValid) {
        console.log('配置无效，无法自动恢复')
        return
      }

      // 动态加载WalletConnect
      const { EthereumProvider } = await this.loadWalletConnect()

      // 尝试初始化provider（这会自动恢复现有会话）
      this.provider = await EthereumProvider.init({
        projectId: walletConnectConfig.projectId,
        chains: walletConnectConfig.chains,
        showQrModal: false, // 不显示二维码，只是尝试恢复
        metadata: walletConnectConfig.metadata
      })

      // 设置事件监听器
      this.setupEventListeners()

      // 检查是否有现有连接
      if (this.provider.connected && this.provider.accounts && this.provider.accounts.length > 0) {
        console.log('自动恢复WalletConnect连接成功')
        
        this.account = this.provider.accounts[0]
        this.chainId = this.provider.chainId
        this.isConnected = true
        this.ethersProvider = new ethers.BrowserProvider(this.provider)
        
        // 更新store
        if (walletStore) {
          walletStore.isConnected = true
          walletStore.address = this.account
          walletStore.chainId = this.chainId
        }
        
        console.log('WalletConnect连接已自动恢复:', {
          account: this.account,
          chainId: this.chainId,
          isConnected: this.isConnected
        })
      } else {
        console.log('没有可恢复的WalletConnect会话')
        // 清理无效的provider
        if (this.provider) {
          try {
            await this.provider.disconnect()
          } catch (e) {
            // 忽略断开连接的错误
          }
          this.provider = null
        }
      }
    } catch (error) {
      console.log('自动恢复WalletConnect连接失败:', error)
      // 清理状态
      this.provider = null
      this.ethersProvider = null
      this.isConnected = false
      this.account = null
      this.chainId = null
    }
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

      // 检查是否正在连接中
      if (this.isConnecting) {
        console.log('WalletConnect正在连接中，请等待...')
        throw new Error('WalletConnect正在连接中，请等待当前连接完成')
      }

      // 设置连接锁
      this.isConnecting = true

      // 检查配置
      if (!this.configValid) {
        this.isConnecting = false
        throw new Error('WalletConnect配置无效，请检查控制台日志')
      }

      if (walletConnectConfig.projectId === 'YOUR_PROJECT_ID_HERE') {
        this.isConnecting = false
        throw new Error('请先配置WalletConnect Project ID。访问 https://cloud.walletconnect.com 获取')
      }

      // 如果已经有provider且已连接，直接返回
      if (this.provider && this.provider.connected && this.account) {
        console.log('WalletConnect已连接，直接返回现有连接')
        this.isConnecting = false
        return {
          account: this.account,
          chainId: this.chainId,
          isConnected: this.isConnected,
          walletType: 'walletconnect'
        }
      }

      // 如果有provider（无论是否连接），先完全清理
      if (this.provider) {
        console.log('清理现有provider...')
        try {
          await this.provider.disconnect()
        } catch (e) {
          console.log('断开连接时出错（可忽略）:', e)
        }
        this.provider = null
        this.ethersProvider = null
        this.isConnected = false
        this.account = null
        this.chainId = null
        
        // 等待一小段时间确保清理完成
        await new Promise(resolve => setTimeout(resolve, 100))
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

      // 设置事件监听器
      this.setupEventListeners()

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

      // 释放连接锁
      this.isConnecting = false

      return {
        account: this.account,
        chainId: this.chainId,
        isConnected: this.isConnected,
        walletType: 'walletconnect'
      }

    } catch (error) {
      if (config.app.isDevMode) {
        console.error('WalletConnect连接失败:', error)
      }
      
      // 连接失败时清理状态
      this.provider = null
      this.ethersProvider = null
      this.isConnected = false
      this.account = null
      this.chainId = null
      this.isConnecting = false  // 释放连接锁
      
      // 安全地检查错误消息
      let errorMessage = 'Unknown error'
      try {
        if (error && typeof error === 'object') {
          errorMessage = error.message || error.toString() || 'Unknown error'
        } else if (typeof error === 'string') {
          errorMessage = error
        }
      } catch (e) {
        if (config.app.isDevMode) {
          console.error('解析错误消息失败:', e)
        }
        errorMessage = 'Unknown error'
      }
      
      // 提供更友好的错误信息
      if (errorMessage.includes('Project ID')) {
        throw new Error('WalletConnect项目ID配置错误，请访问 https://cloud.walletconnect.com 获取有效的Project ID')
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        throw new Error('用户取消了连接请求')
      } else if (errorMessage.includes('User denied') || errorMessage.includes('user denied')) {
        throw new Error('用户拒绝了连接请求')
      } else if (errorMessage.includes('No wallet')) {
        throw new Error('未找到支持WalletConnect的钱包，请确保已安装MetaMask或其他兼容钱包')
      } else if (errorMessage.includes('session topic doesn\'t exist')) {
        throw new Error('WalletConnect会话已过期，请重新连接')
      } else {
        throw new Error(`WalletConnect连接失败: ${errorMessage}`)
      }
    }
  }

  // 签名消息
  async signMessage(message) {
    if (config.app.isDevMode) {
      console.log('=== WalletConnect signMessage 开始 ===')
      console.log('输入参数 message:', message)
      console.log('this.provider:', this.provider)
      console.log('this.account:', this.account)
    }
    
    try {
      if (!this.provider || !this.account) {
        if (config.app.isDevMode) {
          console.error('检查失败: provider或account不存在')
        }
        throw new Error('请先连接WalletConnect')
      }

      // 检查provider的状态
      if (config.app.isDevMode) {
        console.log('检查provider状态...')
        console.log('provider.connected:', this.provider.connected)
        console.log('provider.chainId:', this.provider.chainId)
        console.log('provider.accounts:', this.provider.accounts)
      }
      
      // 宽松检查：只要有provider和account就允许签名
      // 不再强制要求provider.connected为true，因为移动端外部浏览器状态同步有延迟
      if (!this.provider.accounts || this.provider.accounts.length === 0) {
        if (config.app.isDevMode) {
          console.log('Provider账户无效')
        }
        throw new Error('WalletConnect账户无效，请重新连接')
      }

      if (config.app.isDevMode) {
        console.log('开始WalletConnect签名...')
        console.log('准备调用 provider.request，参数:', {
          method: 'personal_sign',
          params: [message, this.account]
        })
      }
      
      // 直接使用provider.request进行签名
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.account]
      })

      if (config.app.isDevMode) {
        console.log('签名成功，返回结果:', signature)
      }
      
      const result = {
        message,
        signature,
        address: this.account
      }
      
      if (config.app.isDevMode) {
        console.log('=== WalletConnect signMessage 成功完成 ===')
      }
      return result
    } catch (error) {
      if (config.app.isDevMode) {
        console.log('=== WalletConnect signMessage 出现错误 ===')
        console.log('错误对象:', error)
        console.log('错误类型:', typeof error)
        console.log('错误构造函数:', error.constructor.name)
        
        // 强制显示更多错误信息
        console.log('错误名称:', error.name)
        console.log('错误消息:', error.message)
        console.log('错误堆栈:', error.stack)
        
        // 尝试JSON序列化错误对象
        try {
          console.log('错误JSON:', JSON.stringify(error, null, 2))
        } catch (e) {
          console.log('JSON序列化失败:', e)
        }
        
        // 尝试toString
        try {
          console.log('错误toString:', error.toString())
        } catch (e) {
          console.log('toString失败:', e)
        }
        
        if (error && typeof error === 'object') {
          console.log('错误对象属性:')
          for (let key in error) {
            try {
              console.log(`  ${key}:`, error[key])
            } catch (e) {
              console.log(`  ${key}: [无法访问]`)
            }
          }
        }
        
        console.error('WalletConnect签名失败:', error)
      }
      
      // 检查是否是会话相关的错误
      let errorInfo = '未知错误'
      try {
        if (error && error.message) {
          errorInfo = error.message
        } else if (error && error.toString) {
          errorInfo = error.toString()
        } else if (typeof error === 'string') {
          errorInfo = error
        } else {
          errorInfo = '无法获取错误信息'
        }
      } catch (e) {
        errorInfo = '错误信息解析失败'
      }
      
      // 确保errorInfo是字符串类型
      errorInfo = String(errorInfo || '未知错误')
      
      // 如果是会话相关错误，清理状态
      if (errorInfo.includes('session topic doesn\'t exist') || 
          errorInfo.includes('No matching key') ||
          errorInfo.includes('session expired')) {
        
        if (config.app.isDevMode) {
          console.log('检测到会话错误，清理WalletConnect状态')
        }
        
        // 清理状态
        this.provider = null
        this.ethersProvider = null
        this.isConnected = false
        this.account = null
        this.chainId = null
        
        throw new Error('WalletConnect会话已过期，请重新连接')
      }
      
      throw new Error(`WalletConnect签名失败: ${errorInfo}`)
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
      this.isConnecting = false  // 释放连接锁
      
      // 清理恢复间隔
      if (this.recoveryInterval) {
        clearInterval(this.recoveryInterval)
        this.recoveryInterval = null
      }
      
      if (config.app.isDevMode) {
        console.log('WalletConnect已断开连接')
      }
    } catch (error) {
      if (config.app.isDevMode) {
        console.error('断开WalletConnect连接失败:', error)
      }
      throw error
    }
  }

  // 获取连接状态
  getConnectionStatus() {
    // 如果有provider，直接从provider获取最新状态
    if (this.provider) {
      const isConnected = this.provider.connected
      const account = this.provider.accounts && this.provider.accounts.length > 0 ? this.provider.accounts[0] : null
      const chainId = this.provider.chainId
      
      if (config.app.isDevMode) {
        console.log('从provider获取连接状态:', {
          isConnected,
          account,
          chainId,
          providerConnected: this.provider.connected,
          providerAccounts: this.provider.accounts
        })
      }
      
      return {
        isConnected,
        account,
        chainId,
        walletType: 'walletconnect',
        configValid: this.configValid
      }
    }
    
    // 如果没有provider，返回当前状态
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
      if (config.app.isDevMode) {
        console.error('获取余额失败:', error)
      }
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
      if (config.app.isDevMode) {
        console.error('获取网络信息失败:', error)
      }
      throw error;
    }
  }

  // 检查是否支持当前网络
  isSupportedChain(chainId) {
    return walletConnectConfig.chains.includes(Number(chainId));
  }

  // 获取支持的网络列表
  getSupportedChains() {
    return walletConnectConfig.chains;
  }
}

// 创建单例实例
var walletConnectService = new WalletConnectService();

export default walletConnectService; 