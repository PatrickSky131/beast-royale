<template>
  <div class="login">
    <div class="login-header">
      <h1>🔐 登录验证</h1>
      <p>连接您的钱包以进入游戏</p>
    </div>

    <div class="wallet-section">
      <h2>🦊 连接钱包</h2>
      
      <!-- 钱包选择 -->
      <div v-if="!walletStore.isConnected && !walletStore.isAddressObtained" class="wallet-options">
        
        <!-- 桌面端连接选项 -->
        <div v-if="!walletStore.isMobileDevice" class="desktop-options">
          <div class="wallet-buttons">
            <!-- MetaMask连接 -->
            <button 
              class="btn wallet-btn primary" 
              @click="connectWallet('metamask')"
              :disabled="walletStore.isConnecting"
            >
              <span class="wallet-icon">🦊</span>
              <span class="wallet-name">MetaMask</span>
              <span class="wallet-desc">浏览器插件</span>
            </button>
            
            <!-- WalletConnect连接 -->
            <button 
              class="btn wallet-btn" 
              @click="connectWallet('walletconnect')"
              :disabled="walletStore.isConnecting"
            >
              <span class="wallet-icon">🔗</span>
              <span class="wallet-name">WalletConnect</span>
              <span class="wallet-desc">扫码连接</span>
            </button>
          </div>
        </div>
        
        <!-- 移动端连接选项 -->
        <div v-else class="mobile-options">
          <div class="wallet-buttons">
            <!-- MetaMask内置浏览器中的选项 -->
            <template v-if="walletStore.isInMetaMaskBrowser">
              <!-- MetaMask连接 -->
              <button 
                class="btn wallet-btn primary" 
                @click="connectWallet('metamask')"
                :disabled="walletStore.isConnecting"
              >
                <span class="wallet-icon">🦊</span>
                <span class="wallet-name">MetaMask</span>
                <span class="wallet-desc">直接连接</span>
              </button>
            </template>
            
            <!-- 外部浏览器中的选项 -->
            <template v-else>
              <!-- WalletConnect连接 -->
              <button 
                class="btn wallet-btn primary mobile-walletconnect" 
                @click="connectWallet('walletconnect')"
                :disabled="walletStore.isConnecting"
                style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100px; padding: 20px 15px; text-align: center;"
              >
                <span style="display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 600;">
                  <span style="font-size: 1.5rem; margin-right: 8px;">🔗</span>
                  <span>WalletConnect连接</span>
                </span>
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- 连接状态显示 -->
      <div v-if="walletStore.isAddressObtained || walletStore.isConnected" class="connection-info">
        <div class="status-card">
          <div class="status-header">
            <span class="status-icon">
              {{ walletStore.isConnected ? '✅' : '⏳' }}
            </span>
            <span class="status-text">
              {{ walletStore.isConnected ? '已连接' : '等待签名验证' }}
            </span>
          </div>
          
          <div class="wallet-details">
            <p><strong>钱包地址:</strong> {{ walletStore.shortAddress }}</p>
          </div>
          
          <!-- 重新连接按钮 -->
          <div class="connection-actions">
            <button 
              v-if="!walletStore.isConnected" 
              class="btn" 
              @click="signMessageOnly"
              :disabled="walletStore.isConnecting"
            >
              <span v-if="walletStore.isConnecting">验证中...</span>
              <span v-else>🔐 签名验证</span>
            </button>
            
            <button 
              v-if="walletStore.isConnected && walletStore.token"
              class="btn btn-large start-game-btn" 
              @click="startGame"
            >
              🚀 进入游戏
            </button>
            
            <button 
              class="btn btn-secondary" 
              @click="disconnectWallet"
            >
              🚪 退出登录
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误信息显示 -->
    <div v-if="walletStore.error" class="error-message">
      <div class="error-card">
        <span class="error-icon">⚠️</span>
        <div class="error-content">
          <h4>连接出现问题</h4>
          <p>{{ walletStore.error }}</p>
          
          <!-- 错误处理建议 -->
          <div class="error-suggestions">
            <p><strong>解决建议：</strong></p>
            <ul v-if="walletStore.error.includes('WalletConnect')">
              <li>确保您的钱包应用已安装并支持WalletConnect</li>
              <li>检查网络连接是否正常</li>
              <li>尝试刷新页面后重新连接</li>
            </ul>
            <ul v-else-if="walletStore.error.includes('MetaMask')">
              <li>确保MetaMask已安装并已解锁</li>
              <li>检查是否在MetaMask中允许了此网站</li>
              <li>尝试刷新页面后重新连接</li>
            </ul>
            <ul v-else>
              <li>检查钱包是否已正确安装</li>
              <li>确保钱包已解锁并授权此网站</li>
              <li>尝试使用其他连接方式</li>
            </ul>
          </div>
          
          <button class="btn btn-small" @click="clearError">
            关闭错误信息
          </button>
        </div>
      </div>
    </div>

    <!-- 返回首页按钮 -->
    <div class="back-to-home">
      <router-link to="/" class="btn btn-secondary">
        ← 返回首页
      </router-link>
    </div>
  </div>
</template>

<script>
import { useWalletStore } from '@/stores/wallet'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Login',
  setup() {
    const walletStore = useWalletStore()
    const router = useRouter()

    // 可用的钱包列表
    const availableWallets = ref([])

    // 初始化时检测可用钱包
    onMounted(async () => {
      availableWallets.value = walletStore.detectWallets()
      console.log('可用钱包:', availableWallets.value)
      
      // 检查是否为移动端外部浏览器
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isInMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent)
      const isExternalBrowser = isMobile && !isInMetaMaskBrowser
      
      console.log('设备检测结果:', {
        isMobile,
        isInMetaMaskBrowser,
        isExternalBrowser
      })
      
      // 自动检查机制：解决移动端外部浏览器WalletConnect连接状态恢复问题
      if (isExternalBrowser) {
        console.log('移动端外部浏览器，启动自动检查WalletConnect连接状态')
        
        // 多次检查机制，确保连接状态完全恢复
        // 原因：用户从MetaMask应用返回浏览器时，WalletConnect连接状态可能延迟恢复
        const checkConnection = async (attempt = 1, maxAttempts = 50) => {
          console.log(`第${attempt}次检查WalletConnect连接状态...`)
          
          const result = await walletStore.manualCheckConnection()
          
          if (result && walletStore.isConnected) {
            console.log('✅ WalletConnect连接状态已恢复并完成签名验证')
            return
          } else if (attempt < maxAttempts) {
            // 如果还没成功且未达到最大尝试次数，继续延迟检查
            const delay = 2000 // 递增延迟：1秒、2秒、3秒...
            console.log(`⏳ ${delay}ms后进行第${attempt + 1}次检查...`)
            setTimeout(() => checkConnection(attempt + 1, maxAttempts), delay)
          } else {
            console.log('❌ 达到最大检查次数，停止自动检查')
          }
        }
        
        // 开始第一次检查（延迟2秒，给用户足够时间从MetaMask返回）
        console.log('⏰ 2秒后开始自动检查WalletConnect连接状态...')
        setTimeout(() => checkConnection(1, 5), 2000)
      } else {
        // 非移动端外部浏览器，立即检查一次
        console.log('非移动端外部浏览器，执行一次连接状态检查')
        await walletStore.manualCheckConnection()
      }
    })

    const connectWallet = async (walletType = 'auto') => {
      console.log('=== 开始连接钱包 ===', walletType)
      console.log('walletStore:', walletStore)
      console.log('window.ethereum:', window.ethereum)
      
      try {
        await walletStore.connectWallet(walletType)
        console.log('钱包连接成功')
      } catch (error) {
        console.error('钱包连接失败:', error)
      }
    }

    const signMessageOnly = async () => {
      try {
        await walletStore.signMessage()
        console.log('签名验证成功')
      } catch (error) {
        console.error('签名验证失败:', error)
      }
    }

    const startGame = () => {
      if (walletStore.isConnected && walletStore.token) {
        router.push('/game-main')
      } else {
        console.log('无法进入游戏，状态:', {
          isConnected: walletStore.isConnected,
          token: walletStore.token
        })
      }
    }

    const disconnectWallet = () => {
      walletStore.disconnect()
    }

    const clearError = () => {
      walletStore.clearError()
    }

    return {
      walletStore,
      availableWallets,
      connectWallet,
      signMessageOnly,
      startGame,
      disconnectWallet,
      clearError
    }
  }
}
</script>

<style scoped>
.login {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-header {
  text-align: center;
  margin-bottom: 3rem;
}

.login-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.login-header p {
  font-size: 1.2rem;
  color: #666;
}

.wallet-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.wallet-section h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.wallet-options {
  margin-bottom: 2rem;
}

.wallet-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.wallet-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
  text-decoration: none;
  color: #333;
}

.wallet-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.wallet-btn.primary {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.wallet-btn.primary:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.wallet-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.wallet-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.wallet-desc {
  font-size: 0.9rem;
  opacity: 0.8;
}

.connection-info {
  margin-top: 2rem;
}

.status-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid #28a745;
}

.status-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.status-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.status-text {
  font-weight: 600;
  color: #333;
}

.wallet-details {
  margin-bottom: 1.5rem;
}

.wallet-details p {
  margin: 0.5rem 0;
  color: #666;
}

.connection-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  min-width: 140px;
  text-align: center;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.start-game-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  font-weight: 700;
}

.start-game-btn:hover {
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
}

.error-message {
  margin-top: 2rem;
}

.error-card {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-content h4 {
  margin: 0 0 0.5rem 0;
  color: #856404;
}

.error-content p {
  margin: 0 0 1rem 0;
  color: #856404;
}

.error-suggestions {
  margin-bottom: 1rem;
}

.error-suggestions ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.error-suggestions li {
  margin: 0.25rem 0;
  color: #856404;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  min-width: auto;
}

.back-to-home {
  text-align: center;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .login {
    padding: 1rem;
  }
  
  .login-header h1 {
    font-size: 2rem;
  }
  
  .wallet-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .wallet-btn {
    width: 100%;
    max-width: 300px;
  }
  
  .connection-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
  }
}
</style> 