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

    // 简化的推荐连接方式
    recommendedWalletType: (state) => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isInMetaMaskBrowser = navigator.userAgent.toLowerCase().includes('metamask')
      
      if (isMobile) {
        if (isInMetaMaskBrowser) {
          return 'metamask'  // MetaMask内置浏览器，只支持插件连接
        } else {
          return 'walletconnect'  // 外部浏览器，支持WalletConnect扫码
        }
      } else {
        return 'metamask'  // 桌面端使用MetaMask插件
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
        
        // 根据设备类型选择连接方式
        if (walletType === 'auto') {
          walletType = this.recommendedWalletType
        }
        
        let result = false
        
        switch (walletType) {
          case 'metamask':
            result = await this.connectWithMetaMask()
            break
            
          case 'walletconnect':
            result = await this.connectWithWalletConnect()
            break
            
          default:
            // 默认根据设备类型选择
            if (this.isMobileDevice) {
              if (this.isInMetaMaskBrowser) {
                result = await this.connectWithMetaMask()
              } else {
                result = await this.connectWithWalletConnect()
              }
            } else {
              result = await this.connectWithMetaMask()
            }
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
          this.walletType = 'metamask'
          this.chainId = web3Service.chainId
          this.error = null
          
          // 连接成功后，进行签名验证
          const signResult = await this.getNonceAndSign(this.address)
          if (signResult) {
            this.isAddressObtained = true
            this.isConnected = true
            return true
          } else {
            // 签名验证失败，不设置连接状态
            return false
          }
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
          this.walletType = 'walletconnect'
          this.chainId = web3Service.chainId
          this.error = null
          
          // 连接成功后，进行签名验证
          const signResult = await this.getNonceAndSign(this.address)
          if (signResult) {
            this.isAddressObtained = true
            this.isConnected = true
            return true
          } else {
            // 签名验证失败，不设置连接状态
            return false
          }
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

    // 专门进行签名验证（不重新连接钱包）
    async signMessageOnly() {
      if (!this.address) {
        throw new Error('没有钱包地址，请先连接钱包')
      }
      
      try {
        console.log('开始签名验证...')
        const signResult = await this.getNonceAndSign(this.address)
        if (signResult) {
          this.isAddressObtained = true
          this.isConnected = true
          return true
        } else {
          return false
        }
      } catch (error) {
        console.error('签名验证失败:', error)
        this.error = error.message
        return false
      }
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
      const isInMetaMaskBrowser = this.isInMetaMaskBrowser
      
      if (isInMetaMaskBrowser) {
        return {
          type: 'metamask_browser',
          message: '✅ 检测到您在 MetaMask 内置浏览器中，可以直接连接',
          action: 'connect',
          hasMetaMask: true,
          hasWalletConnect: false,
          recommendedWallet: 'metamask'
        }
      } else {
        return {
          type: 'external_browser',
          message: '📱 您在外部浏览器中，可以使用WalletConnect扫码连接',
          action: 'connect',
          hasWalletConnect: true,
          recommendedWallet: 'walletconnect'
        }
      }
    },

    // 手动检查连接状态 - 修改为支持深链接返回检测
    async manualCheckConnection() {
      console.log('手动检查连接状态...')
      
      try {
        // 检查是否为移动端外部浏览器
        const isMobile = this.isMobileDevice
        const isInMetaMaskBrowser = this.isInMetaMaskBrowser
        const isExternalBrowser = isMobile && !isInMetaMaskBrowser
        
        // 如果是移动端外部浏览器，不进行钱包检测，直接返回
        if (isExternalBrowser) {
          console.log('移动端外部浏览器，跳过钱包检测')
          this.error = null
          return true
        }
        
        // 检查是否有 ethereum 对象
        if (typeof window.ethereum !== 'undefined') {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
              console.log('检测到已连接账户:', accounts[0])
              // 只设置地址，不设置连接状态，等待用户手动连接
              this.address = accounts[0]
              this.walletType = 'metamask'
              this.error = null
              
              console.log('检测到钱包已连接，等待用户手动进行连接和签名验证')
              return true
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
          // 只有在桌面端才显示"未检测到钱包"的错误
          if (!isMobile) {
            this.error = '未检测到钱包，请确保已安装兼容的钱包插件'
          } else {
            // 移动端MetaMask内置浏览器但没有ethereum对象的情况
            this.error = 'MetaMask内置浏览器中未检测到钱包，请确保MetaMask已正确安装'
          }
          return false
        }
      } catch (error) {
        console.error('手动检查连接失败:', error)
        this.error = error.message
        return false
      }
    },

    // 获取钱包类型显示名称
    getWalletTypeName(type = null) {
      const walletType = type || this.walletType
      const types = {
        'metamask': 'MetaMask',
        'metamask_mobile': 'MetaMask Mobile',
        'walletconnect': 'WalletConnect',
        'coinbase': 'Coinbase Wallet',
        'trust': 'Trust Wallet',
        'mobile': 'Mobile Wallet'
      }
      return types[walletType] || walletType || 'Unknown'
    }
  }
}) 