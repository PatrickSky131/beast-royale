import { defineStore } from 'pinia'
import { ethers } from 'ethers'
import axios from 'axios'

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
    walletType: null // 'metamask', 'walletconnect', 'mobile'
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
    }
  },

  actions: {
    async connectWallet() {
      console.log('开始连接钱包...')
      this.isConnecting = true
      this.error = null
      this.isMobile = this.isMobileDevice

      try {
        // 检测设备类型和可用的钱包
        const walletInfo = await this.detectWallet()
        console.log('检测到的钱包信息:', walletInfo)

        if (this.isMobile) {
          // 移动设备处理
          return await this.connectMobileWallet()
        } else {
          // 桌面设备处理
          return await this.connectDesktopWallet()
        }

      } catch (error) {
        console.error('连接钱包失败:', error)
        console.error('错误详情:', {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack
        })
        
        // 处理特定的MetaMask错误
        if (error.code === 4001) {
          this.error = '用户拒绝了连接请求'
        } else if (error.code === -32002) {
          this.error = 'MetaMask请求已在进行中，请检查MetaMask弹窗'
        } else {
          this.error = error.message
        }
        
        return false
      } finally {
        this.isConnecting = false
      }
    },

    async detectWallet() {
      const info = {
        hasEthereum: typeof window.ethereum !== 'undefined',
        isMetaMask: window.ethereum?.isMetaMask || false,
        isMobile: this.isMobileDevice,
        userAgent: navigator.userAgent
      }

      console.log('钱包检测结果:', info)
      return info
    },

    async connectDesktopWallet() {
      console.log('连接桌面钱包...')
      
      // 检查是否安装了MetaMask
      if (!window.ethereum) {
        throw new Error('请安装MetaMask钱包')
      }

      console.log('MetaMask已安装，请求连接...')
      console.log('window.ethereum对象:', window.ethereum)
      console.log('isMetaMask:', window.ethereum.isMetaMask)
      console.log('isConnected:', window.ethereum.isConnected?.())

      // 检查是否已经连接
      try {
        const currentAccounts = await window.ethereum.request({
          method: 'eth_accounts'
        })
        console.log('当前已连接的账户:', currentAccounts)
        
        if (currentAccounts.length > 0) {
          console.log('MetaMask已经连接，使用现有账户')
          this.address = currentAccounts[0]
          this.isAddressObtained = true
          this.walletType = 'metamask'
          // 获取nonce后立即请求签名
          await this.getNonceAndSign(currentAccounts[0])
          return true
        }
      } catch (error) {
        console.log('检查当前账户时出错:', error)
      }

      // 请求连接钱包
      console.log('请求连接MetaMask...')
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      console.log('获取到账户:', accounts)

      if (accounts.length === 0) {
        throw new Error('没有找到钱包账户')
      }

      const address = accounts[0]
      this.address = address
      this.isAddressObtained = true
      this.walletType = 'metamask'

      console.log('钱包地址:', address)

      // 获取nonce后立即请求签名
      await this.getNonceAndSign(address)

      return true
    },

    async connectMobileWallet() {
      console.log('连接移动钱包...')
      
      // 检查是否有 ethereum 对象
      if (typeof window.ethereum !== 'undefined') {
        console.log('检测到 ethereum 对象，尝试直接连接')
        return await this.connectDesktopWallet()
      }

      // 移动设备特殊处理 - 提供多种连接方式
      console.log('移动设备，使用特殊连接流程')
      
      // 显示移动端连接选项
      this.error = '移动设备连接选项：\n\n1. 在 MetaMask 内置浏览器中打开此页面（当前推荐）\n2. 使用手动连接功能输入地址\n3. 或使用 WalletConnect（需要额外配置）\n\n请选择适合您的连接方式。'
      
      // 存储移动端状态
      this.isMobile = true
      this.walletType = 'mobile'
      
      return true
    },

    // 新增：检测是否在 MetaMask 内置浏览器中
    isInMetaMaskBrowser() {
      const userAgent = navigator.userAgent.toLowerCase()
      return userAgent.includes('metamask') || userAgent.includes('web3')
    },

    // 新增：提供移动端连接建议
    getMobileConnectionAdvice() {
      if (this.isInMetaMaskBrowser()) {
        return {
          type: 'metamask_browser',
          message: '✅ 检测到您在 MetaMask 内置浏览器中，可以直接连接',
          action: 'connect'
        }
      } else {
        return {
          type: 'external_browser',
          message: '📱 您在外部浏览器中，建议：\n1. 在 MetaMask 中打开此页面\n2. 或使用手动连接功能',
          action: 'manual'
        }
      }
    },

    buildMetaMaskUrl() {
      // 构建 MetaMask 深度链接
      const baseUrl = 'https://metamask.app.link/dapp/'
      const currentUrl = window.location.href
      
      // 移除协议前缀
      const cleanUrl = currentUrl.replace(/^https?:\/\//, '')
      
      return baseUrl + cleanUrl
    },

    async checkMobileConnection() {
      console.log('检查移动端连接状态...')
      
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
      
      return false
    },

    // 新增：手动检查连接状态
    async manualCheckConnection() {
      console.log('手动检查连接状态...')
      
      // 移动端特殊处理
      if (this.isMobile) {
        console.log('移动端检测连接状态...')
        
        // 首先尝试检查是否有 ethereum 对象
        if (typeof window.ethereum !== 'undefined') {
          console.log('检测到 window.ethereum 对象')
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
              console.log('检测到已连接账户:', accounts[0])
              this.address = accounts[0]
              this.isAddressObtained = true
              this.walletType = 'mobile'
              this.error = null
              
              // 获取 nonce 并请求签名
              await this.getNonceAndSign(accounts[0])
              return true
            } else {
              this.error = 'MetaMask 已安装但未连接账户，请在 MetaMask 中连接此网站'
              return false
            }
          } catch (error) {
            console.error('检查连接状态失败:', error)
            this.error = `检查连接状态失败: ${error.message}`
            return false
          }
        } else {
          // 移动端没有 ethereum 对象的情况
          console.log('移动端未检测到 window.ethereum 对象')
          
          // 检查是否有其他钱包提供者
          const providers = this.detectWalletProviders()
          console.log('检测到的钱包提供者:', providers)
          
          if (providers.length > 0) {
            this.error = `检测到钱包提供者: ${providers.join(', ')}，但需要手动连接`
            return false
          } else {
            // 提供手动输入选项
            this.error = '移动端检测：\n\n1. MetaMask 应用已安装但未在浏览器中激活\n2. 请尝试以下方法：\n   - 在 MetaMask 中手动连接此网站\n   - 或使用手动连接功能输入地址'
            return false
          }
        }
      } else {
        // 桌面端处理
        if (typeof window.ethereum !== 'undefined') {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
              console.log('检测到已连接账户:', accounts[0])
              this.address = accounts[0]
              this.isAddressObtained = true
              this.walletType = 'metamask'
              this.error = null
              
              // 获取 nonce 并请求签名
              await this.getNonceAndSign(accounts[0])
              return true
            } else {
              this.error = '未检测到连接的 MetaMask 账户，请确保已在 MetaMask 中连接此网站'
              return false
            }
          } catch (error) {
            console.error('检查连接状态失败:', error)
            this.error = `检查连接状态失败: ${error.message}`
            return false
          }
        } else {
          this.error = '未检测到 MetaMask，请确保已安装 MetaMask 插件'
          return false
        }
      }
    },

    // 新增：检测钱包提供者
    detectWalletProviders() {
      const providers = []
      
      // 检查各种可能的钱包提供者
      if (typeof window.ethereum !== 'undefined') {
        providers.push('window.ethereum')
      }
      
      if (typeof window.web3 !== 'undefined') {
        providers.push('window.web3')
      }
      
      // 检查 MetaMask 特定的全局变量
      if (typeof window.metamask !== 'undefined') {
        providers.push('window.metamask')
      }
      
      // 检查其他常见的钱包提供者
      const commonProviders = [
        'walletConnect',
        'walletlink',
        'fortmatic',
        'portis',
        'torus'
      ]
      
      commonProviders.forEach(provider => {
        if (typeof window[provider] !== 'undefined') {
          providers.push(`window.${provider}`)
        }
      })
      
      return providers
    },

    // 新增：手动签名
    async manualSign() {
      console.log('手动签名...')
      
      if (!this.address) {
        this.error = '请先连接钱包'
        return false
      }

      try {
        // 获取 nonce
        await this.getNonceAndSign(this.address)
        return true
      } catch (error) {
        console.error('手动签名失败:', error)
        this.error = error.message
        return false
      }
    },

    async getNonceAndSign(address) {
      console.log('获取nonce并请求签名，地址:', address)
      try {
        // 使用RPC API格式
        const requestData = {
          method: 'wallet.connect',
          params: {
            address: address
          },
          id: 1
        }
        
        console.log('发送RPC请求:', requestData)
        
        const response = await axios.post('/rpc', requestData)
        
        console.log('RPC响应:', response.data)

        if (response.data.result && response.data.result.success) {
          this.nonce = response.data.result.nonce
          console.log('获取到nonce:', this.nonce)
          
          // 移动设备可能需要特殊处理
          if (this.isMobile) {
            await this.signMessageMobile()
          } else {
            // 立即请求签名
            await this.signMessage()
          }
        } else {
          throw new Error(response.data.error?.message || response.data.result?.message || '连接失败')
        }
      } catch (error) {
        console.error('获取nonce失败:', error)
        this.error = error.response?.data?.error?.message || error.message
        throw error
      }
    },

    async signMessageMobile() {
      console.log('移动端签名处理...')
      
      if (!this.address || !this.nonce) {
        throw new Error('请先连接钱包')
      }

      try {
        const message = `连接Beast Royale游戏\n\nNonce: ${this.nonce}\n\n点击签名以验证您的身份。`
        console.log('签名消息:', message)
        
        // 对于移动设备，可能需要使用不同的签名方法
        if (typeof window.ethereum !== 'undefined') {
          // 如果有 ethereum 对象，尝试正常签名
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, this.address]
          })
          
          console.log('获取到签名:', signature)
          await this.verifySignature(signature, message)
        } else {
          // 提示用户手动签名
          this.error = `请在 MetaMask 中手动签名以下消息：\n\n${message}`
          
          // 存储钱包信息到 localStorage
          localStorage.setItem('beast_royale_wallet', JSON.stringify({
            address: this.address,
            nonce: this.nonce,
            timestamp: Date.now()
          }))
        }

        return true
      } catch (error) {
        console.error('移动端签名失败:', error)
        this.error = error.message
        return false
      }
    },

    async signMessage() {
      console.log('开始签名...')
      if (!this.address || !this.nonce) {
        throw new Error('请先连接钱包')
      }

      try {
        const message = `连接Beast Royale游戏\n\nNonce: ${this.nonce}\n\n点击签名以验证您的身份。`
        console.log('签名消息:', message)
        
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, this.address]
        })

        console.log('获取到签名:', signature)

        // 验证签名
        await this.verifySignature(signature, message)

        return true
      } catch (error) {
        console.error('签名失败:', error)
        this.error = error.message
        return false
      }
    },

    async verifySignature(signature, message) {
      console.log('验证签名...')
      try {
        // 使用RPC API格式
        const requestData = {
          method: 'wallet.verify',
          params: {
            address: this.address,
            signature: signature,
            message: message
          },
          id: 1
        }
        
        console.log('发送验证请求:', requestData)
        
        const response = await axios.post('/rpc', requestData)
        
        console.log('验证响应:', response.data)

        if (response.data.result && response.data.result.success) {
          this.token = response.data.result.token
          this.isConnected = true
          console.log('验证成功，token:', this.token)
          return true
        } else {
          throw new Error(response.data.error?.message || response.data.result?.message || '验证失败')
        }
      } catch (error) {
        console.error('验证失败:', error)
        this.error = error.response?.data?.error?.message || error.message
        throw error
      }
    },

    disconnect() {
      console.log('断开连接')
      this.address = null
      this.isConnected = false
      this.isAddressObtained = false
      this.nonce = null
      this.token = null
      this.error = null
      this.isMobile = false
      this.walletType = null
      
      // 清除存储的钱包信息
      localStorage.removeItem('beast_royale_wallet')
    }
  }
}) 