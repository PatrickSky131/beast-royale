import { defineStore } from 'pinia'
import { ethers } from 'ethers'
import axios from 'axios'
import web3Service from '../services/Web3Service.js'
import walletConnectService from '../services/WalletConnectService.js'
import config from '../config/index.js'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    address: null,
    isConnected: false,
    isConnecting: false,
    isAddressObtained: false,
    nonce: null,
    token: null,
    error: null,
    isMobile: false,
    walletType: null, // 'metamask', 'coinbase', 'trust', 'walletconnect', etc.
    chainId: null,
    availableWallets: []
  }),

  getters: {
    shortAddress: (state) => {
      if (!state.address) return ''
      return `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
    },
    
    needsSignature: (state) => {
      return state.isAddressObtained && !state.isConnected
    },

    // 检测是否为移动设备
    isMobileDevice: () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    },

    // 检测是否在MetaMask内置浏览器中
    isInMetaMaskBrowser: () => {
      const userAgent = navigator.userAgent.toLowerCase()
      return userAgent.includes('metamask') || userAgent.includes('web3')
    },

    // 检测是否在外部浏览器中
    isExternalBrowser: () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const hasEthereum = typeof window.ethereum !== 'undefined'
      const isInMetaMaskBrowser = navigator.userAgent.toLowerCase().includes('metamask')
      
      return isMobile && !hasEthereum && !isInMetaMaskBrowser
    },

    // 推荐的钱包连接方式
    recommendedWalletType: (state) => {
      if (state.isInMetaMaskBrowser) {
        return 'metamask'
      } else if (state.isExternalBrowser) {
        return 'walletconnect'
      } else if (state.isMobileDevice && typeof window.ethereum === 'undefined') {
        return 'walletconnect'
      } else {
        return 'metamask'
      }
    }
  },

  actions: {
    // 获取可用的钱包选项
    detectWallets() {
      this.availableWallets = web3Service.detectWallets()
      return this.availableWallets
    },

    // 连接钱包
    async connectWallet(walletType = 'auto') {
      this.isConnecting = true
      this.error = null
      
      try {
        console.log('开始连接钱包，类型:', walletType)
        
        // 根据设备类型和钱包类型选择连接方式
        if (walletType === 'auto') {
          walletType = this.recommendedWalletType
        }
        
        let result = false
        
        switch (walletType) {
          case 'metamask':
            result = await this.connectWithMetaMask()
            break
            
          case 'metamask_deeplink':
            result = await this.connectViaMobileDeepLink()
            break
            
          case 'walletconnect':
            result = await this.connectWithWalletConnect()
            break
            
          default:
            result = await this.connectWithMetaMask()
            break
        }
        
        return result
        
      } catch (error) {
        console.error('连接钱包失败:', error)
        this.error = error.message
        return false
      } finally {
        this.isConnecting = false
      }
    },

    // 专门用于MetaMask连接
    async connectWithMetaMask() {
      console.log('使用MetaMask连接...')
      try {
        // 直接调用web3Service连接，避免递归
        const result = await web3Service.connect('metamask')
        if (result) {
          this.address = web3Service.account
          this.isAddressObtained = true
          this.walletType = 'metamask'
          this.chainId = web3Service.chainId
          this.isConnected = true
          this.error = null
          return true
        }
        return false
      } catch (error) {
        console.error('MetaMask连接失败:', error)
        this.error = error.message
        return false
      }
    },

    // 专门用于WalletConnect连接
    async connectWithWalletConnect() {
      console.log('使用WalletConnect连接...')
      try {
        // 直接调用web3Service连接，避免递归
        const result = await web3Service.connect('walletconnect')
        if (result) {
          this.address = web3Service.account
          this.isAddressObtained = true
          this.walletType = 'walletconnect'
          this.chainId = web3Service.chainId
          this.isConnected = true
          this.error = null
          return true
        }
        return false
      } catch (error) {
        console.error('WalletConnect连接失败:', error)
        this.error = error.message
        return false
      }
    },

    // 专门用于MetaMask深链接连接
    async connectWithMetaMaskDeepLink() {
      console.log('使用MetaMask深链接连接...')
      return await this.connectWallet('metamask_deeplink')
    },

    async getNonceAndSign(address) {
      try {
        console.log('获取nonce并请求签名...')
        
        // 使用配置文件获取API地址
        const apiBase = config.getApiBase()
        console.log('当前页面URL:', window.location.href)
        console.log('使用API地址:', apiBase)
        
        // 获取nonce
        const nonceResponse = await axios.post(`/api/v1/wallet/connect`, {
          address: address
        })

        if (!nonceResponse.data.success) {
          throw new Error(nonceResponse.data.message || '获取nonce失败')
        }

        this.nonce = nonceResponse.data.nonce
        console.log('获取到nonce:', this.nonce)

        // 构造签名消息
        const message = `连接Beast Royale游戏\n\n点击签名以验证您的身份。\n\nNonce: ${this.nonce}`
        
        // 使用Web3Service签名（会自动处理不同的钱包类型）
        const signatureResult = await web3Service.signMessage(message)
        console.log('签名成功:', signatureResult)

        // 验证签名
        const verifyResponse = await axios.post(`/api/v1/wallet/verify`, {
          address: address,
          signature: signatureResult.signature,
          message: message
        })

        if (!verifyResponse.data.success) {
          throw new Error(verifyResponse.data.message || '签名验证失败')
        }

        this.token = verifyResponse.data.token
        this.isConnected = true
        this.error = null
        
        console.log('钱包连接和签名验证完成')
        return true

      } catch (error) {
        console.error('获取nonce或签名失败:', error)
        this.error = error.message
        return false
      }
    },

    // 断开连接
    async disconnect() {
      try {
        await web3Service.disconnect()
        
        this.address = null
        this.isConnected = false
        this.isAddressObtained = false
        this.nonce = null
        this.token = null
        this.error = null
        this.walletType = null
        this.chainId = null
        
        console.log('钱包已断开连接')
      } catch (error) {
        console.error('断开连接失败:', error)
        this.error = error.message
      }
    },

    // 移动端连接建议
    getMobileConnectionAdvice() {
      if (this.isInMetaMaskBrowser) {
        return {
          type: 'metamask_browser',
          message: '✅ 检测到您在 MetaMask 内置浏览器中，可以直接连接',
          action: 'connect',
          recommendedWallet: 'metamask'
        }
      } else if (this.isExternalBrowser) {
        return {
          type: 'external_browser',
          message: '📱 您在外部浏览器中，推荐使用以下方式连接：\n\n1. 🔗 WalletConnect（推荐）- 通过二维码连接\n2. 🦊 MetaMask深链接 - 跳转到MetaMask应用\n3. 🌐 在MetaMask内置浏览器中打开',
          action: 'choose',
          hasWalletConnect: true,
          hasDeepLink: true,
          deepLinkUrl: this.buildMetaMaskUrl(),
          recommendedWallet: 'walletconnect'
        }
      } else {
        return {
          type: 'desktop_or_mobile_with_wallet',
          message: '🔗 检测到钱包环境，可以直接连接',
          action: 'connect',
          recommendedWallet: 'metamask'
        }
      }
    },

    // 构建MetaMask深链接URL
    buildMetaMaskUrl() {
      try {
        const currentUrl = window.location.href
        return `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}${window.location.search}`
      } catch (error) {
        console.error('构建MetaMask URL失败:', error)
        return null
      }
    },

    // 手动检查连接状态 - 修改为支持深链接返回检测
    async manualCheckConnection() {
      console.log('手动检查连接状态...')
      
      try {
        // 检查 URL 参数中是否有钱包信息
        const urlParams = new URLSearchParams(window.location.search)
        const walletAddress = urlParams.get('wallet')
        
        if (walletAddress) {
          console.log('从 URL 参数获取到钱包地址:', walletAddress)
          this.address = walletAddress
          this.isAddressObtained = true
          this.walletType = 'mobile'
          
          // 获取 nonce
          await this.getNonceAndSign(walletAddress)
          return true
        }
        
        // 检查 localStorage 中是否有钱包信息
        const storedWallet = localStorage.getItem('beast_royale_wallet')
        if (storedWallet) {
          try {
            const walletData = JSON.parse(storedWallet)
            if (walletData.address && walletData.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
              console.log('从 localStorage 获取到钱包信息:', walletData)
              this.address = walletData.address
              this.isAddressObtained = true
              this.walletType = 'mobile'
              
              await this.getNonceAndSign(walletData.address)
              return true
            }
          } catch (error) {
            console.error('解析存储的钱包信息失败:', error)
          }
        }
        
        // 检查是否有 ethereum 对象
        if (typeof window.ethereum !== 'undefined') {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
              console.log('检测到已连接账户:', accounts[0])
              this.address = accounts[0]
              this.isAddressObtained = true
              this.walletType = 'metamask'
              this.error = null
              
              // 保存到localStorage，以便深链接返回时使用
              const walletData = {
                address: accounts[0],
                timestamp: Date.now()
              }
              localStorage.setItem('beast_royale_wallet', JSON.stringify(walletData))
              
              // 自动尝试完成签名验证
              try {
                await this.getNonceAndSign(accounts[0])
                return true
              } catch (signError) {
                console.log('自动签名失败，等待用户手动操作:', signError)
                return true // 仍然返回true，因为地址已获取
              }
            } else {
              this.error = '未检测到连接的钱包账户，请确保已在钱包中连接此网站'
              return false
            }
          } catch (error) {
            console.error('检查连接状态失败:', error)
            this.error = `检查连接状态失败: ${error.message}`
            return false
          }
        } else {
          this.error = '未检测到钱包，请确保已安装兼容的钱包插件'
          return false
        }
      } catch (error) {
        console.error('手动检查连接失败:', error)
        this.error = error.message
        return false
      }
    },

    // 添加页面可见性变化监听
    setupVisibilityListener() {
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', async () => {
          if (!document.hidden) {
            console.log('页面重新可见，检查是否从深链接返回...')
            
            // 检查是否有深链接待处理状态
            const pendingState = localStorage.getItem('beast_royale_deeplink_pending')
            const isActive = sessionStorage.getItem('metamask_deeplink_active')
            
            if (pendingState || isActive) {
              try {
                if (pendingState) {
                  const state = JSON.parse(pendingState)
                  const timeDiff = Date.now() - state.timestamp
                  
                  // 如果是最近5分钟内的深链接操作
                  if (timeDiff < 5 * 60 * 1000) {
                    console.log('检测到深链接返回，开始检查连接状态...')
                    
                    // 清除待处理状态
                    localStorage.removeItem('beast_royale_deeplink_pending')
                    
                    // 延迟检查，确保页面完全加载
                    setTimeout(async () => {
                      await this.handleDeepLinkReturn()
                    }, 2000)
                    
                    return
                  }
                } else if (isActive) {
                  console.log('检测到活跃的深链接会话，处理返回...')
                  
                  // 延迟检查，确保页面完全加载
                  setTimeout(async () => {
                    await this.handleDeepLinkReturn()
                  }, 2000)
                  
                  return
                }
              } catch (error) {
                console.error('解析深链接状态失败:', error)
                localStorage.removeItem('beast_royale_deeplink_pending')
                sessionStorage.removeItem('metamask_deeplink_active')
              }
            }
            
            // 常规的可见性检查
            if (this.isMobileDevice && !this.isConnected) {
              console.log('页面重新可见，常规检查连接状态...')
              setTimeout(async () => {
                await this.manualCheckConnection()
              }, 1000)
            }
          }
        })
        
        // 页面加载时也检查一次深链接返回状态
        setTimeout(async () => {
          const pendingState = localStorage.getItem('beast_royale_deeplink_pending')
          const isActive = sessionStorage.getItem('metamask_deeplink_active')
          
          if (pendingState || isActive) {
            await this.handleDeepLinkReturn()
          }
        }, 3000)
      }
    },

    // 改进移动端深链接连接
    async connectViaMobileDeepLink() {
      try {
        // 保存当前状态到localStorage，标记深链接流程开始
        const currentState = {
          timestamp: Date.now(),
          returnUrl: window.location.href,
          step: 'connecting',
          sessionId: Math.random().toString(36).substring(7)
        }
        localStorage.setItem('beast_royale_deeplink_pending', JSON.stringify(currentState))
        
        // 构建MetaMask深链接
        const metamaskDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}${window.location.search}`
        
        // 显示连接指引
        const userConfirmed = confirm(
          '🦊 MetaMask移动端连接流程：\n\n' +
          '1. 点击"确定"跳转到MetaMask应用\n' +
          '2. 在MetaMask中完成连接和签名\n' +
          '3. 完成后会自动返回此页面\n\n' +
          '💡 提示：整个流程会在MetaMask中完成，无需手动切换\n\n' +
          '点击"取消"使用WalletConnect连接'
        )
        
        if (userConfirmed) {
          // 设置一个标记，表示正在进行深链接流程
          sessionStorage.setItem('metamask_deeplink_active', 'true')
          
          // 尝试打开MetaMask应用
          window.location.href = metamaskDeepLink
          
          // 抛出特殊错误，告知用户正在跳转
          throw new Error('正在跳转到MetaMask应用，请在应用中完成连接和签名后返回此页面')
        } else {
          // 清除状态标记
          localStorage.removeItem('beast_royale_deeplink_pending')
          sessionStorage.removeItem('metamask_deeplink_active')
          
          // 用户选择使用WalletConnect
          return await this.connectWithWalletConnect()
        }
      } catch (error) {
        console.error('移动端深链接连接失败:', error)
        throw error
      }
    },

    // 处理深链接返回 - 优化版本
    async handleDeepLinkReturn() {
      console.log('处理深链接返回...')
      
      try {
        // 检查是否有活跃的深链接会话
        const isActive = sessionStorage.getItem('metamask_deeplink_active')
        if (!isActive) {
          console.log('没有活跃的深链接会话')
          return
        }
        
        // 清除活跃标记
        sessionStorage.removeItem('metamask_deeplink_active')
        
        // 检查连接状态
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          
          if (accounts.length > 0) {
            console.log('✅ 检测到MetaMask已连接:', accounts[0])
            
            this.address = accounts[0]
            this.isAddressObtained = true
            this.walletType = 'metamask_mobile'
            this.error = null
            
            // 显示成功连接消息
            const shouldContinue = confirm(
              '🎉 MetaMask连接成功！\n\n' +
              `钱包地址: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}\n\n` +
              '接下来将进行签名验证，请确保MetaMask应用保持打开状态。\n\n' +
              '点击"确定"继续签名验证\n' +
              '点击"取消"稍后手动验证'
            )
            
            if (shouldContinue) {
              // 自动触发签名验证
              try {
                const signResult = await this.getNonceAndSign(accounts[0])
                if (signResult) {
                  alert('✅ 签名验证成功！钱包连接完成。')
                }
              } catch (signError) {
                console.error('自动签名失败:', signError)
                this.error = `连接成功，但签名验证失败: ${signError.message}`
                
                // 提供手动签名选项
                const retrySign = confirm(
                  '连接成功，但签名验证失败。\n\n' +
                  '可能原因：\n' +
                  '• MetaMask应用未保持打开状态\n' +
                  '• 签名请求被取消\n' +
                  '• 网络连接问题\n\n' +
                  '点击"确定"重试签名验证\n' +
                  '点击"取消"稍后手动验证'
                )
                
                if (retrySign) {
                  try {
                    await this.getNonceAndSign(accounts[0])
                  } catch (retryError) {
                    this.error = `重试签名失败: ${retryError.message}`
                  }
                }
              }
            }
          } else {
            console.log('❌ MetaMask未连接')
            this.error = '在MetaMask中连接失败，请重试连接流程'
            
            // 提供重试选项
            const retry = confirm(
              '❌ 检测到MetaMask未连接\n\n' +
              '可能原因：\n' +
              '• 在MetaMask中取消了连接\n' +
              '• 连接过程被中断\n' +
              '• MetaMask应用未正确响应\n\n' +
              '点击"确定"重新连接\n' +
              '点击"取消"稍后重试'
            )
            
            if (retry) {
              // 重新发起连接流程
              await this.connectWallet('metamask_deeplink')
            }
          }
        } else {
          console.log('❌ 未检测到ethereum对象')
          this.error = '未检测到MetaMask，请确保已正确安装'
        }
      } catch (error) {
        console.error('处理深链接返回失败:', error)
        this.error = `处理返回状态失败: ${error.message}`
      }
    },

    // 获取钱包类型显示名称
    getWalletTypeName(type = null) {
      const walletType = type || this.walletType
      const types = {
        'metamask': 'MetaMask',
        'metamask_mobile': 'MetaMask Mobile',
        'metamask_deeplink': 'MetaMask DeepLink',
        'walletconnect': 'WalletConnect',
        'coinbase': 'Coinbase Wallet',
        'trust': 'Trust Wallet',
        'mobile': 'Mobile Wallet'
      }
      return types[walletType] || walletType || 'Unknown'
    }
  }
}) 