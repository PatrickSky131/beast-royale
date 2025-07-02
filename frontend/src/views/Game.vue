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
        <h3>选择钱包类型</h3>
        
        <div class="wallet-buttons">
          <!-- MetaMask连接 -->
          <button 
            class="btn wallet-btn primary" 
            @click="connectWallet('metamask')"
            :disabled="walletStore.isConnecting"
            v-if="availableWallets.some(w => w.type === 'metamask')"
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
          
          <!-- 其他钱包 -->
          <button 
            v-for="wallet in availableWallets.filter(w => !['metamask', 'walletconnect'].includes(w.type))"
            :key="wallet.type"
            class="btn wallet-btn" 
            @click="connectWallet(wallet.type)"
            :disabled="walletStore.isConnecting"
          >
            <span class="wallet-icon">💼</span>
            <span class="wallet-name">{{ wallet.name }}</span>
            <span class="wallet-desc">{{ wallet.description || '其他钱包' }}</span>
          </button>
        </div>
        
        <!-- 自动连接按钮 -->
        <div class="auto-connect">
          <button 
            class="btn btn-large" 
            @click="connectWallet()"
            :disabled="walletStore.isConnecting"
          >
            <span v-if="walletStore.isConnecting">连接中...</span>
            <span v-else>🚀 智能连接（推荐）</span>
          </button>
          <p class="auto-connect-desc">
            系统将自动选择最适合您设备的连接方式
          </p>
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
              @click="connectWallet()"
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

    <!-- 移动设备提示 - 只在非MetaMask内置浏览器的移动设备中显示 -->
    <div v-if="walletStore.isMobile && connectionAdvice.type !== 'metamask_browser'" class="mobile-notice">
      <div class="notice-card">
        <div class="notice-icon">📱</div>
        <h3>移动设备连接</h3>
        
        <!-- 连接状态检测 -->
        <div class="connection-status">
          <div class="status-info">
            <span class="status-icon">📱</span>
            <span>{{ connectionAdvice.type === 'external_browser' ? '外部浏览器' : '移动设备' }}</span>
          </div>
        </div>
        
        <p>{{ connectionAdvice.message }}</p>
        
        <!-- 移动端特殊按钮 -->
        <div class="mobile-actions">
          <!-- WalletConnect连接 -->
          <button 
            v-if="connectionAdvice.hasWalletConnect"
            class="btn mobile-btn primary" 
            @click="connectWithWalletConnect"
            :disabled="walletStore.isConnecting"
          >
            <span v-if="walletStore.isConnecting">连接中...</span>
            <span v-else>🔗 WalletConnect连接</span>
          </button>
          
          <!-- MetaMask深链接 -->
          <button 
            v-if="connectionAdvice.hasDeepLink"
            class="btn mobile-btn" 
            @click="connectWithMetaMaskDeepLink"
            :disabled="walletStore.isConnecting"
          >
            🦊 MetaMask深链接
          </button>
          
          <!-- 在MetaMask中打开 -->
          <button class="btn mobile-btn" @click="openInMetaMask">
            🦊 在 MetaMask 中打开
          </button>
          
          <button class="btn mobile-btn" @click="tryConnectDirect">
            🔗 尝试直接连接
          </button>
          
          <button class="btn mobile-btn" @click="checkConnection">
            🔍 检查连接状态
          </button>
          
          <button 
            class="btn mobile-btn" 
            @click="manualSign"
            :disabled="!walletStore.address"
          >
            ✍️ 手动签名
          </button>
          
          <div class="mobile-help">
            <p><strong>💡 连接说明：</strong></p>
            <p v-if="connectionAdvice.recommendedWallet === 'walletconnect'">
              • <strong>推荐</strong>：使用WalletConnect，通过扫描二维码连接
            </p>
            <p v-if="connectionAdvice.hasDeepLink">
              • 或使用MetaMask深链接直接跳转到MetaMask应用
            </p>
            <p>• 或在MetaMask内置浏览器中打开此页面获得最佳体验</p>
          </div>
        </div>
        
        <!-- 移动端说明 -->
        <div class="mobile-info">
          <h4>连接方式说明：</h4>
          <div class="connection-methods">
            <div class="method">
              <h5>方式一：MetaMask 内置浏览器（推荐）</h5>
              <p>在 MetaMask 应用中打开此页面，可以直接连接和签名</p>
            </div>
            <div class="method">
              <h5>方式二：外部浏览器 + 手动连接</h5>
              <p>在普通浏览器中打开，使用手动连接功能输入地址</p>
            </div>
            <div class="method">
              <h5>方式三：WalletConnect（高级）</h5>
              <p>使用 WalletConnect 协议连接，需要额外配置</p>
            </div>
          </div>
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

    // 计算连接建议
    const connectionAdvice = computed(() => {
      return walletStore.getMobileConnectionAdvice()
    })

    // 初始化时检测可用钱包
    onMounted(() => {
      availableWallets.value = walletStore.detectWallets()
      console.log('可用钱包:', availableWallets.value)
      
      // 设置页面可见性监听器，用于检测从MetaMask返回
      walletStore.setupVisibilityListener()
      
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

    // MetaMask深链接专用连接方法
    const connectWithMetaMaskDeepLink = async () => {
      console.log('使用MetaMask深链接连接钱包...')
      
      try {
        // 显示详细的操作指引
        const userConfirmed = confirm(
          '🦊 MetaMask深链接连接流程：\n\n' +
          '第一步：点击"确定"跳转到MetaMask应用\n' +
          '第二步：在MetaMask中点击"连接"确认连接\n' +
          '第三步：连接完成后手动返回此浏览器页面\n' +
          '第四步：返回后会自动弹出签名请求\n\n' +
          '💡 注意：需要完成两个步骤（连接+签名）\n\n' +
          '点击"取消"使用WalletConnect一步完成'
        )
        
        if (!userConfirmed) {
          // 用户选择使用WalletConnect
          return await connectWithWalletConnect()
        }
        
        // 保存状态，标记正在进行深链接流程
        localStorage.setItem('beast_royale_deeplink_pending', JSON.stringify({
          timestamp: Date.now(),
          step: 'connecting'
        }))
        
        // 执行深链接连接
        return await connectWallet('metamask_deeplink')
        
      } catch (error) {
        if (error.message.includes('正在跳转')) {
          // 正常的跳转流程，显示返回提示
          walletStore.error = '已跳转到MetaMask应用。完成连接后请返回此页面完成签名验证。'
        } else {
          console.error('MetaMask深链接连接失败:', error)
        }
        return false
      }
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

    // 移动端方法
    const openInMetaMask = () => {
      console.log('打开 MetaMask 应用...')
      const metamaskUrl = walletStore.buildMetaMaskUrl()
      if (metamaskUrl) {
        window.location.href = metamaskUrl
      } else {
        alert('无法生成 MetaMask 链接')
      }
    }

    const tryConnectDirect = async () => {
      console.log('尝试直接连接...')
      
      try {
        // 检查是否有window.ethereum
        if (typeof window.ethereum === 'undefined') {
          alert(
            '❌ 未检测到钱包\n\n' +
            '这通常是因为：\n' +
            '• 您在外部浏览器中（Safari、Chrome等）\n' +
            '• 钱包应用未安装或未激活\n\n' +
            '解决方案：\n' +
            '1. 使用WalletConnect连接（推荐）\n' +
            '2. 在钱包应用内置浏览器中打开此页面\n' +
            '3. 或点击"MetaMask深链接"按钮'
          )
          return
        }
        
        // 尝试连接
        const result = await connectWallet('metamask')
        if (result) {
          console.log('直接连接成功')
        }
      } catch (error) {
        console.error('直接连接失败:', error)
        alert(`直接连接失败: ${error.message}\n\n建议尝试使用WalletConnect连接`)
      }
    }

    const checkConnection = async () => {
      console.log('检查连接状态...')
      
      try {
        const result = await walletStore.manualCheckConnection()
        if (result) {
          console.log('检查连接成功')
        } else {
          console.log('未检测到连接')
        }
      } catch (error) {
        console.error('检查连接失败:', error)
      }
    }

    const manualSign = async () => {
      if (!walletStore.address) {
        alert('请先连接钱包获取地址')
        return
      }
      
      try {
        const result = await walletStore.getNonceAndSign(walletStore.address)
        if (result) {
          console.log('手动签名成功')
        }
      } catch (error) {
        console.error('手动签名失败:', error)
      }
    }

    return {
      walletStore,
      availableWallets,
      connectionAdvice,
      connectWallet,
      connectWithWalletConnect,
      connectWithMetaMaskDeepLink,
      disconnectWallet,
      startGame,
      clearError,
      openInMetaMask,
      tryConnectDirect,
      checkConnection,
      manualSign
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
  padding: 20px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  min-height: 120px;
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
}

.wallet-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.wallet-desc {
  font-size: 0.9rem;
  opacity: 0.7;
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

.notice-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.notice-card h3 {
  color: #333;
  margin-bottom: 20px;
}

.connection-status {
  background: #e7f3ff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  color: #0066cc;
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.mobile-btn {
  padding: 12px 20px;
  border: 1px solid #007bff;
  border-radius: 8px;
  background: white;
  color: #007bff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.mobile-btn.primary {
  background: #007bff;
  color: white;
}

.mobile-btn:hover {
  background: #007bff;
  color: white;
}

.mobile-btn.primary:hover {
  background: #0056b3;
}

.mobile-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mobile-help {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  text-align: left;
  font-size: 0.9rem;
  color: #495057;
}

.mobile-help p {
  margin: 8px 0;
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