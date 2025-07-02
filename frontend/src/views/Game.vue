<template>
  <div class="game">
    <div class="game-header">
      <h1>Beast Royale 游戏</h1>
      <p>连接您的MetaMask钱包开始游戏</p>
    </div>

    <div class="wallet-section">
      <h2>🦊 连接钱包</h2>
      
      <!-- 钱包选择 -->
      <div v-if="!walletStore.isConnected && !walletStore.isAddressObtained" class="wallet-options">
        <h3>选择连接方式</h3>
        
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
            <p><strong>钱包类型:</strong> {{ walletStore.getWalletTypeName() }}</p>
            <p v-if="walletStore.chainId"><strong>网络ID:</strong> {{ walletStore.chainId }}</p>
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
              <span v-else>🔐 完成签名验证</span>
            </button>
            
            <button 
              class="btn btn-secondary" 
              @click="disconnectWallet"
            >
              🔌 断开连接
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

    <div v-if="walletStore.token" class="game-content">
      <div class="game-card">
        <h3>游戏功能</h3>
        <p>更多游戏功能正在开发中...</p>
        <div class="game-features">
          <div class="feature">🎯 战斗系统</div>
          <div class="feature">🏆 排行榜</div>
          <div class="feature">💎 奖励系统</div>
          <div class="feature">👥 多人对战</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useWalletStore } from '@/stores/wallet'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Game',
  setup() {
    const walletStore = useWalletStore()
    const router = useRouter()

    // 可用的钱包列表
    const availableWallets = ref([])

    // 初始化时检测可用钱包
    onMounted(() => {
      availableWallets.value = walletStore.detectWallets()
      console.log('可用钱包:', availableWallets.value)
      
      // 初始检查连接状态
      walletStore.manualCheckConnection()
    })

    const connectWallet = async (walletType = 'auto') => {
      console.log('=== 开始连接钱包 ===', walletType)
      console.log('walletStore:', walletStore)
      console.log('window.ethereum:', window.ethereum)
      console.log('window.ethereum类型:', typeof window.ethereum)
      console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask)
      console.log('是否为移动设备:', walletStore.isMobile)
      console.log('是否在MetaMask浏览器中:', walletStore.isInMetaMaskBrowser)
      
      // 检查MetaMask是否已连接
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          console.log('当前已连接的账户:', accounts)
        } catch (error) {
          console.log('获取当前账户失败:', error)
        }
      }
      
      try {
        const result = await walletStore.connectWallet(walletType)
        console.log('连接结果:', result)
        return result
      } catch (error) {
        console.error('连接钱包时发生错误:', error)
        return false
      }
    }

    // WalletConnect专用连接方法
    const connectWithWalletConnect = async () => {
      console.log('使用WalletConnect连接钱包...')
      return await connectWallet('walletconnect')
    }

    const disconnectWallet = async () => {
      try {
        await walletStore.disconnect()
        console.log('钱包已断开连接')
      } catch (error) {
        console.error('断开连接失败:', error)
      }
    }

    const startGame = () => {
      // 确保只有完成签名验证后才能开始游戏
      if (walletStore.isConnected && walletStore.token) {
        // 跳转到游戏主页面
        router.push('/game-main')
      } else if (walletStore.isAddressObtained && !walletStore.isConnected) {
        // 如果已获取地址但未完成签名验证，提示用户完成签名
        alert('请先完成签名验证后再开始游戏')
      } else {
        alert('请先连接钱包后再开始游戏')
      }
    }

    // 清除错误信息
    const clearError = () => {
      walletStore.error = null
    }

    // 专门进行签名验证
    const signMessageOnly = async () => {
      try {
        const result = await walletStore.signMessageOnly()
        console.log('签名验证结果:', result)
        return result
      } catch (error) {
        console.error('签名验证失败:', error)
        return false
      }
    }

    return {
      walletStore,
      availableWallets,
      connectWallet,
      connectWithWalletConnect,
      disconnectWallet,
      startGame,
      clearError,
      signMessageOnly
    }
  }
}
</script>

<style scoped>
.game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
}

.hero-section h1 {
  font-size: 3rem;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.hero-section p {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 钱包选择界面 */
.wallet-options {
  margin-bottom: 30px;
}

.wallet-options h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.4rem;
}

.wallet-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.wallet-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  min-height: 120px;
  position: relative;
}

.wallet-btn:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,123,255,0.15);
}

.wallet-btn.primary {
  border-color: #007bff;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.wallet-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,123,255,0.3);
}

.wallet-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.wallet-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.wallet-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.wallet-desc {
  font-size: 0.9rem;
  opacity: 0.7;
  flex-shrink: 0;
  min-height: 1.2em;
}

/* 自动连接区域 */
.auto-connect {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.btn-large {
  padding: 15px 40px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.btn-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(40,167,69,0.3);
}

.auto-connect-desc {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

/* 连接状态显示 */
.connection-info {
  margin-top: 30px;
}

.status-card {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.status-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 1.2rem;
  font-weight: 600;
}

.status-icon {
  font-size: 1.5rem;
  margin-right: 10px;
}

.wallet-details {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.wallet-details p {
  margin: 8px 0;
  color: #495057;
}

.connection-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

/* 错误信息样式 */
.error-message {
  margin: 20px 0;
}

.error-card {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-content h4 {
  color: #721c24;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.error-content p {
  color: #721c24;
  margin: 0 0 15px 0;
}

.error-suggestions {
  background: rgba(255,255,255,0.5);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 15px;
}

.error-suggestions p {
  margin: 0 0 8px 0;
  font-weight: 600;
}

.error-suggestions ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.error-suggestions li {
  margin: 4px 0;
  color: #721c24;
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.9rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-small:hover {
  background: #c82333;
}

/* 移动端样式优化 */
.mobile-notice {
  margin-bottom: 30px;
}

.notice-card {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.mobile-notice-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  grid-column: 1 / -1;
  margin-top: 15px;
}

.mobile-notice-card .notice-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.mobile-notice-card h4 {
  color: #495057;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.mobile-notice-card p {
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* 游戏开始区域 */
.game-start {
  text-align: center;
  margin-top: 40px;
}

.game-start-card {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  border-radius: 20px;
  padding: 40px 20px;
  box-shadow: 0 8px 25px rgba(255,107,107,0.3);
}

.game-start h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.game-start p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.start-game-btn {
  padding: 15px 40px;
  font-size: 1.3rem;
  font-weight: 600;
  background: white;
  color: #ff6b6b;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.start-game-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-container {
    padding: 15px;
  }
  
  .hero-section h1 {
    font-size: 2rem;
  }
  
  .wallet-buttons {
    grid-template-columns: 1fr;
  }
  
  .connection-actions {
    flex-direction: column;
  }
  
  .game-start h2 {
    font-size: 2rem;
  }
  
  .wallet-btn {
    min-height: 100px;
    padding: 15px;
  }
  
  .wallet-icon {
    font-size: 1.8rem;
    margin-bottom: 6px;
  }
  
  .wallet-name {
    font-size: 1rem;
    margin-bottom: 2px;
  }
  
  .wallet-desc {
    font-size: 0.8rem;
  }
  
  /* 移动端外部浏览器WalletConnect按钮特殊样式 */
  .mobile-walletconnect {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    min-height: 100px !important;
    padding: 20px 15px !important;
    text-align: center !important;
  }
  
  .mobile-walletconnect .wallet-icon {
    font-size: 2rem !important;
    margin-bottom: 10px !important;
    display: block !important;
  }
  
  .mobile-walletconnect .wallet-name {
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    margin: 0 !important;
    text-align: center !important;
    display: block !important;
  }
}

/* 基础按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  background: #007bff;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,123,255,0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn:disabled:hover {
  transform: none;
  box-shadow: none;
}
</style> 