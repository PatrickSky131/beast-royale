import { defineStore } from 'pinia'
import { ethers } from 'ethers'
import axios from 'axios'
import web3Service from '../services/Web3Service.js'
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
    walletType: null, // 'metamask', 'coinbase', 'trust', etc.
    chainId: null
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
    }
  },

  actions: {
    async connectWallet() {
      console.log('开始连接钱包...')
      this.isConnecting = true
      this.error = null
      this.isMobile = this.isMobileDevice

      try {
        // 使用新的Web3Service连接钱包
        const result = await web3Service.connect()
        
        console.log('钱包连接成功:', result)
        
        this.address = result.account
        this.walletType = result.walletType
        this.chainId = result.chainId
        this.isAddressObtained = true
        this.error = null

        // 获取nonce后立即请求签名
        await this.getNonceAndSign(result.account)

        return true
      } catch (error) {
        console.error('连接钱包失败:', error)
        console.error('错误详情:', {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack
        })
        
        // 处理特定的钱包错误
        if (error.code === 4001) {
          this.error = '用户拒绝了连接请求'
        } else if (error.code === -32002) {
          this.error = '钱包请求已在进行中，请检查钱包弹窗'
        } else {
          this.error = error.message
        }
        
        return false
      } finally {
        this.isConnecting = false
      }
    },

    async disconnectWallet() {
      try {
        web3Service.disconnect()
        this.address = null
        this.isConnected = false
        this.isAddressObtained = false
        this.nonce = null
        this.token = null
        this.walletType = null
        this.chainId = null
        this.error = null
        console.log('钱包已断开连接')
      } catch (error) {
        console.error('断开钱包连接失败:', error)
        this.error = error.message
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
        
        // 使用新的Web3Service签名
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

    async checkConnection() {
      try {
        const isConnected = await web3Service.checkConnection()
        
        if (isConnected) {
          const status = web3Service.getConnectionStatus()
          this.address = status.account
          this.isConnected = status.isConnected
          this.walletType = status.walletType
          this.chainId = status.chainId
          this.isAddressObtained = true
          this.error = null
          return true
        } else {
          this.address = null
          this.isConnected = false
          this.isAddressObtained = false
          return false
        }
      } catch (error) {
        console.error('检查连接状态失败:', error)
        this.error = error.message
        return false
      }
    },

    // 检测可用的钱包
    detectWallets() {
      return web3Service.detectWallets()
    },

    // 获取连接状态
    getConnectionStatus() {
      return web3Service.getConnectionStatus()
    },

    // 签名消息
    async signMessage(message) {
      try {
        return await web3Service.signMessage(message)
      } catch (error) {
        console.error('签名消息失败:', error)
        this.error = error.message
        throw error
      }
    },

    // 获取余额
    async getBalance(address = null) {
      try {
        return await web3Service.getBalance(address)
      } catch (error) {
        console.error('获取余额失败:', error)
        this.error = error.message
        throw error
      }
    },

    // 获取网络信息
    async getNetwork() {
      try {
        return await web3Service.getNetwork()
      } catch (error) {
        console.error('获取网络信息失败:', error)
        this.error = error.message
        throw error
      }
    },

    // 移动端连接建议
    getMobileConnectionAdvice() {
      if (this.isInMetaMaskBrowser) {
        return {
          type: 'metamask_browser',
          message: '✅ 检测到您在 MetaMask 内置浏览器中，可以直接连接',
          action: 'connect'
        }
      } else {
        return {
          type: 'external_browser',
          message: '📱 您在外部浏览器中，MetaMask无法直接检测到。\n\n推荐方案：\n1. 🦊 在MetaMask应用中打开此页面（推荐）\n2. 🔗 使用深链接跳转到MetaMask\n3. ✋ 手动输入钱包地址进行连接',
          action: 'manual',
          hasDeepLink: true,
          deepLinkUrl: this.buildMetaMaskUrl()
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

    // 手动检查连接状态 - 修改为不会自动触发连接流程
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
        
        // 检查是否有 ethereum 对象 - 但不自动连接
        if (typeof window.ethereum !== 'undefined') {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
              console.log('检测到已连接账户:', accounts[0])
              // 只设置地址，不自动触发连接流程
              this.address = accounts[0]
              this.isAddressObtained = true
              this.walletType = 'metamask'
              this.error = null
              
              // 不自动获取 nonce 和请求签名，等待用户手动点击连接按钮
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
          this.error = '未检测到钱包，请确保已安装兼容的钱包插件'
          return false
        }
      } catch (error) {
        console.error('手动检查连接失败:', error)
        this.error = error.message
        return false
      }
    },

    disconnect() {
      this.address = null
      this.isConnected = false
      this.isConnecting = false
      this.isAddressObtained = false
      this.nonce = null
      this.token = null
      this.error = null
      this.walletType = null
      this.chainId = null
    }
  }
}) 