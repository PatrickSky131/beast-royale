import axios from 'axios'
import config from '../config/index.js'
import ngrokService from './NgrokService.js'

class ApiService {
  constructor() {
    this.baseURL = config.getApiBase()
    this.apiClient = null
    this.ngrokUrl = null
    this.isInitialized = false
    
    this.initApiClient()
  }

  // 初始化API客户端
  async initApiClient() {
    console.log('🔧 ApiService初始化开始')
    console.log('📋 配置的baseURL:', config.getApiBase())
    console.log('📋 当前this.baseURL:', this.baseURL)
    
    // 如果配置了自动检测ngrok，则尝试检测
    if (config.api.ngrok.autoDetect) {
      try {
        this.ngrokUrl = await ngrokService.detectNgrokUrl()
        if (this.ngrokUrl) {
          console.log('使用检测到的ngrok URL:', this.ngrokUrl)
          this.baseURL = this.ngrokUrl
        }
      } catch (error) {
        console.log('ngrok自动检测失败，使用本地代理:', error.message)
      }
    } else {
      // 使用配置的固定ngrok URL
      if (config.api.ngrok.fixedUrl) {
        this.ngrokUrl = config.api.ngrok.fixedUrl
        this.baseURL = this.ngrokUrl
        console.log('使用配置的固定ngrok URL:', this.ngrokUrl)
      }
    }

    console.log('📋 最终baseURL:', this.baseURL)

    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      withCredentials: true, // 支持跨域cookie
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('📋 axios实例创建完成，baseURL:', this.apiClient.defaults.baseURL)

    // 请求拦截器
    this.apiClient.interceptors.request.use(
      (config) => {
        if (config.app && config.app.isDevMode) {
          console.log('API请求:', config.method?.toUpperCase(), config.url, config.data)
        }
        return config
      },
      (error) => {
        console.error('API请求错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.apiClient.interceptors.response.use(
      (response) => {
        if (config.app && config.app.isDevMode) {
          console.log('API响应:', response.status, response.data)
        }
        return response
      },
      (error) => {
        console.error('API响应错误:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )

    this.isInitialized = true
    console.log('✅ ApiService初始化完成')
  }

  // 重新检测ngrok URL并更新API客户端
  async refreshNgrokUrl() {
    if (!config.api.ngrok.autoDetect) {
      return false
    }

    try {
      const newUrl = await ngrokService.detectNgrokUrl()
      if (newUrl && newUrl !== this.ngrokUrl) {
        this.ngrokUrl = newUrl
        this.baseURL = newUrl
        
        // 重新创建API客户端
        this.apiClient = axios.create({
          baseURL: this.baseURL,
          timeout: 10000,
          withCredentials: true, // 支持跨域cookie
          headers: {
            'Content-Type': 'application/json',
          },
        })

        console.log('ngrok URL已更新:', newUrl)
        return true
      }
    } catch (error) {
      console.log('刷新ngrok URL失败:', error.message)
    }
    
    return false
  }

  // 获取当前使用的API基础URL
  getCurrentApiBase() {
    return this.baseURL
  }

  // 获取当前ngrok URL（如果有）
  getCurrentNgrokUrl() {
    return this.ngrokUrl
  }

  // 统一API调用方法
  async callApi(action, params = {}) {
    // 确保API客户端已初始化
    if (!this.isInitialized) {
      await this.initApiClient()
    }

    try {
      const requestData = {
        Action: action,
        ...params,
      }

      console.log('🚀 发起API请求:', {
        action,
        baseURL: this.apiClient.defaults.baseURL,
        url: '/api',
        fullURL: this.apiClient.defaults.baseURL + '/api'
      })

      const response = await this.apiClient.post('/api', requestData)
      
      // 适配新的Action-based API响应格式
      if (response.data.RetCode === 0) {
        return {
          success: true,
          data: response.data,
          message: response.data.Message,
        }
      } else {
        return {
          success: false,
          error: response.data.Error || response.data.Message,
          message: response.data.Message,
        }
      }
    } catch (error) {
      console.error('❌ API请求失败:', {
        action,
        baseURL: this.apiClient.defaults.baseURL,
        error: error.message,
        response: error.response?.data
      })
      
      // 如果是网络错误且启用了ngrok自动检测，尝试刷新URL
      if (config.api.ngrok.autoDetect && 
          (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.response?.status >= 500)) {
        console.log('检测到网络错误，尝试刷新ngrok URL...')
        const refreshed = await this.refreshNgrokUrl()
        if (refreshed) {
          // 重试请求
          return await this.callApi(action, params)
        }
      }

      return {
        success: false,
        error: error.response?.data?.Error || error.message,
        message: '网络请求失败',
      }
    }
  }

  // 连接钱包
  async connectWallet(address) {
    return await this.callApi('ConnectWallet', {
      Address: address,
    })
  }

  // 验证签名
  async verifySignature(address, signature, nonce) {
    return await this.callApi('VerifySignature', {
      Address: address,
      Signature: signature,
      Nonce: nonce,
    })
  }

  // 获取用户信息
  async getUserInfo(address) {
    return await this.callApi('GetUserInfo', {
      Address: address,
    })
  }

  // 获取用户档案
  async getUserProfile() {
    return await this.callApi('GetUserProfile', {})
  }

  // 更新用户档案
  async updateUserProfile(profileData) {
    return await this.callApi('UpdateUserProfile', profileData)
  }

  // 健康检查
  async healthCheck() {
    return await this.callApi('HealthCheck')
  }
}

// 创建单例实例
const apiService = new ApiService()

export default apiService 