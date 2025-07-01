<template>
  <div class="test-section">
    <h3>📱 设备信息</h3>
    <div class="device-info-grid">
      <div class="info-item">
        <span class="label">设备类型:</span>
        <span class="value">{{ deviceInfo.type }}</span>
      </div>
      <div class="info-item">
        <span class="label">浏览器:</span>
        <span class="value">{{ deviceInfo.browser }}</span>
      </div>
      <div class="info-item">
        <span class="label">操作系统:</span>
        <span class="value">{{ deviceInfo.os }}</span>
      </div>
      <div class="info-item">
        <span class="label">MetaMask环境:</span>
        <span class="value" :class="{ 'yes': isInMetaMaskBrowser, 'no': !isInMetaMaskBrowser }">
          {{ isInMetaMaskBrowser ? '✅ 内置浏览器' : '📱 外部浏览器' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'DeviceInfo',
  setup() {
    // 设备信息计算属性
    const deviceInfo = computed(() => {
      const ua = navigator.userAgent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      
      let browser = '未知'
      let os = '未知'
      
      if (ua.includes('Chrome')) browser = 'Chrome'
      else if (ua.includes('Safari')) browser = 'Safari'
      else if (ua.includes('Firefox')) browser = 'Firefox'
      else if (ua.includes('Edge')) browser = 'Edge'
      
      if (ua.includes('Android')) os = 'Android'
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
      else if (ua.includes('Windows')) os = 'Windows'
      else if (ua.includes('Mac')) os = 'macOS'
      else if (ua.includes('Linux')) os = 'Linux'
      
      return {
        type: isMobile ? '移动设备' : '桌面设备',
        browser,
        os,
        userAgent: ua.substring(0, 100) + '...'
      }
    })

    // 检测是否在MetaMask内置浏览器中
    const isInMetaMaskBrowser = computed(() => {
      const userAgent = navigator.userAgent.toLowerCase()
      return userAgent.includes('metamask') || userAgent.includes('web3')
    })

    return {
      deviceInfo,
      isInMetaMaskBrowser
    }
  }
}
</script>

<style scoped>
.test-section {
  margin-bottom: 40px;
}

.test-section h3 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

/* 设备信息网格 */
.device-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.info-item .label {
  font-weight: 600;
  color: #495057;
}

.info-item .value {
  font-family: monospace;
  color: #333;
  font-weight: 500;
}

.info-item .value.yes {
  color: #28a745;
}

.info-item .value.no {
  color: #dc3545;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-section h3 {
    font-size: 1.2rem;
    margin-bottom: 12px;
  }
  
  .device-info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .info-item {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .info-item .label {
    font-size: 0.9rem;
  }
  
  .info-item .value {
    font-size: 0.85rem;
  }
}
</style> 