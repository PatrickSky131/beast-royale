import axios from 'axios'

class NgrokService {
  constructor() {
    this.ngrokApiUrl = 'http://localhost:4040/api/tunnels'
    this.detectedUrl = null
    this.lastCheck = 0
    this.checkInterval = 5000 // 5秒检查一次
  }

  // 检测ngrok是否运行并获取公共URL
  async detectNgrokUrl() {
    try {
      const now = Date.now()
      
      // 如果距离上次检查时间太短，直接返回缓存的结果
      if (this.detectedUrl && (now - this.lastCheck) < this.checkInterval) {
        return this.detectedUrl
      }

      const response = await axios.get(this.ngrokApiUrl, {
        timeout: 3000 // 3秒超时
      })

      if (response.data && response.data.tunnels && response.data.tunnels.length > 0) {
        // 优先选择HTTPS隧道
        const httpsTunnel = response.data.tunnels.find(tunnel => 
          tunnel.proto === 'https' && tunnel.public_url
        )
        
        if (httpsTunnel) {
          this.detectedUrl = httpsTunnel.public_url
          this.lastCheck = now
          console.log('检测到ngrok HTTPS隧道:', this.detectedUrl)
          return this.detectedUrl
        }

        // 如果没有HTTPS，使用HTTP隧道
        const httpTunnel = response.data.tunnels.find(tunnel => 
          tunnel.proto === 'http' && tunnel.public_url
        )
        
        if (httpTunnel) {
          this.detectedUrl = httpTunnel.public_url
          this.lastCheck = now
          console.log('检测到ngrok HTTP隧道:', this.detectedUrl)
          return this.detectedUrl
        }
      }

      // 没有检测到隧道
      this.detectedUrl = null
      this.lastCheck = now
      return null
    } catch (error) {
      // ngrok API不可用，说明ngrok没有运行
      this.detectedUrl = null
      this.lastCheck = now
      console.log('ngrok未运行或API不可用:', error.message)
      return null
    }
  }

  // 检查ngrok是否正在运行
  async isNgrokRunning() {
    const url = await this.detectNgrokUrl()
    return url !== null
  }

  // 获取当前检测到的ngrok URL
  getDetectedUrl() {
    return this.detectedUrl
  }

  // 清除缓存，强制重新检测
  clearCache() {
    this.detectedUrl = null
    this.lastCheck = 0
  }
}

// 创建单例实例
const ngrokService = new NgrokService()

export default ngrokService 