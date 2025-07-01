<template>
  <div class="game">
    <div class="game-header">
      <h1>Beast Royale 游戏</h1>
      <p>连接您的MetaMask钱包开始游戏</p>
    </div>

    <!-- 移动设备提示 -->
    <div v-if="walletStore.isMobile" class="mobile-notice">
      <div class="notice-card">
        <div class="notice-icon">📱</div>
        <h3>移动设备连接</h3>
        
        <!-- 连接状态检测 -->
        <div class="connection-status">
          <div v-if="connectionAdvice.type === 'metamask_browser'" class="status-success">
            <span class="status-icon">✅</span>
            <span>MetaMask 内置浏览器</span>
          </div>
          <div v-else class="status-info">
            <span class="status-icon">📱</span>
            <span>外部浏览器</span>
          </div>
        </div>
        
        <p>{{ connectionAdvice.message }}</p>
        
        <!-- 移动端特殊按钮 -->
        <div class="mobile-actions">
          <button 
            v-if="connectionAdvice.type === 'metamask_browser'"
            class="btn mobile-btn primary" 
            @click="connectWallet"
          >
            🔗 直接连接 MetaMask
          </button>
          
          <button class="btn mobile-btn" @click="openMetaMask">
            🔗 在 MetaMask 中打开
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

    <div class="wallet-section">
      <div v-if="!walletStore.isConnected" class="connect-wallet">
        <div class="wallet-card">
          <div class="wallet-icon">🦊</div>
          <h3>连接 MetaMask</h3>
          <p v-if="walletStore.isMobile">
            点击下方按钮连接您的MetaMask移动应用并完成签名验证
          </p>
          <p v-else>
            点击下方按钮连接您的MetaMask钱包并完成签名验证
          </p>
          
          <button 
            class="btn connect-btn" 
            @click="connectWallet"
            :disabled="walletStore.isConnecting"
          >
            <span v-if="walletStore.isConnecting">连接中...</span>
            <span v-else-if="walletStore.isMobile">连接 MetaMask 移动应用</span>
            <span v-else>连接 MetaMask</span>
          </button>
          
          <div v-if="walletStore.error" class="error-message">
            {{ walletStore.error }}
          </div>
        </div>
      </div>

      <div v-else class="wallet-connected">
        <div class="wallet-card connected">
          <div class="wallet-icon">✅</div>
          <h3>钱包已连接</h3>
          <p class="address">地址: {{ walletStore.shortAddress }}</p>
          <p v-if="walletStore.walletType" class="wallet-type">
            钱包类型: {{ getWalletTypeName(walletStore.walletType) }}
          </p>
          
          <div class="verified-section">
            <div class="success-icon">🎉</div>
            <h4>验证成功！</h4>
            <p>您现在可以开始游戏了</p>
            <button class="btn start-game-btn" @click="startGame">
              开始游戏
            </button>
          </div>
          
          <button class="btn disconnect-btn" @click="disconnectWallet">
            断开连接
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Game',
  setup() {
    const walletStore = useWalletStore()
    const router = useRouter()

    // 计算连接建议
    const connectionAdvice = computed(() => {
      return walletStore.getMobileConnectionAdvice()
    })

    const connectWallet = async () => {
      console.log('=== 开始连接钱包 ===')
      console.log('walletStore:', walletStore)
      console.log('window.ethereum:', window.ethereum)
      console.log('window.ethereum类型:', typeof window.ethereum)
      console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask)
      console.log('是否为移动设备:', walletStore.isMobile)
      console.log('是否在MetaMask浏览器中:', walletStore.isInMetaMaskBrowser())
      
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
        const result = await walletStore.connectWallet()
        console.log('连接结果:', result)
      } catch (error) {
        console.error('连接钱包时发生错误:', error)
      }
    }

    const disconnectWallet = () => {
      walletStore.disconnect()
    }

    const startGame = () => {
      if (walletStore.isConnected) {
        // 跳转到游戏主页面
        router.push('/game-main')
      } else {
        alert('请先连接钱包后再开始游戏')
      }
    }

    const getWalletTypeName = (type) => {
      const types = {
        'metamask': 'MetaMask 浏览器插件',
        'mobile': 'MetaMask 移动应用',
        'walletconnect': 'WalletConnect'
      }
      return types[type] || type
    }

    // 移动端方法
    const openMetaMask = () => {
      console.log('打开 MetaMask 应用...')
      const metamaskUrl = walletStore.buildMetaMaskUrl()
      if (metamaskUrl) {
        window.location.href = metamaskUrl
      } else {
        alert('无法生成 MetaMask 链接')
      }
    }

    const checkConnection = async () => {
      console.log('检查连接状态...')
      try {
        const result = await walletStore.manualCheckConnection()
        if (result) {
          console.log('连接检查成功')
        } else {
          console.log('连接检查失败')
        }
      } catch (error) {
        console.error('检查连接状态时发生错误:', error)
      }
    }

    const manualSign = async () => {
      console.log('手动签名...')
      try {
        const result = await walletStore.manualSign()
        if (result) {
          console.log('手动签名成功')
        } else {
          console.log('手动签名失败')
        }
      } catch (error) {
        console.error('手动签名时发生错误:', error)
      }
    }

    return {
      walletStore,
      connectWallet,
      disconnectWallet,
      startGame,
      getWalletTypeName,
      openMetaMask,
      checkConnection,
      manualSign,
      connectionAdvice
    }
  }
}
</script>

<style scoped>
.game {
  max-width: 800px;
  margin: 0 auto;
}

.game-header {
  text-align: center;
  margin-bottom: 3rem;
}

.game-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-header p {
  font-size: 1.2rem;
  color: #666;
}

.mobile-notice {
  margin-bottom: 2rem;
}

.notice-card {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  padding: 1.5rem;
  border-radius: 15px;
  border: 2px solid #ffa726;
  text-align: center;
}

.notice-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.notice-card h3 {
  color: #e65100;
  margin-bottom: 1rem;
}

.notice-card li {
  margin: 0.5rem 0;
}

.connection-status {
  margin: 1rem 0;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
}

.status-success {
  background: #e8f5e8;
  color: #2e7d32;
  border: 2px solid #4caf50;
}

.status-info {
  background: #e3f2fd;
  color: #1976d2;
  border: 2px solid #2196f3;
}

.status-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.mobile-actions {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mobile-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.mobile-btn.primary {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}

.mobile-btn:hover {
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  transform: translateY(-2px);
}

.mobile-btn.primary:hover {
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.mobile-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.mobile-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: left;
}

.mobile-info h4 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.connection-methods {
  display: grid;
  gap: 1rem;
}

.method {
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #2196F3;
}

.method h5 {
  color: #1976d2;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.method p {
  color: #666;
  font-size: 0.85rem;
  margin: 0;
}

.wallet-section {
  margin-bottom: 3rem;
}

.wallet-card {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
}

.wallet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.wallet-card.connected {
  border: 2px solid #4CAF50;
}

.wallet-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.wallet-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.wallet-card p {
  color: #666;
  margin-bottom: 2rem;
}

.address {
  font-family: monospace;
  background: #f5f5f5;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.wallet-type {
  font-size: 0.9rem;
  color: #888;
  font-style: italic;
}

.connect-btn, .start-game-btn {
  width: 100%;
  max-width: 300px;
  margin-bottom: 1rem;
}

.disconnect-btn {
  background: #f44336;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.disconnect-btn:hover {
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid #ffcdd2;
}

.verified-section {
  margin: 2rem 0;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.verified-section h4 {
  color: #4CAF50;
  margin-bottom: 1rem;
}

.game-content {
  margin-top: 3rem;
}

.game-card {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.game-card h3 {
  margin-bottom: 1rem;
  color: #333;
}

.game-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.feature {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  font-weight: 500;
}

@media (max-width: 768px) {
  .game-header h1 {
    font-size: 2rem;
  }
  
  .wallet-card {
    padding: 2rem;
  }
  
  .game-features {
    grid-template-columns: 1fr;
  }
  
  .notice-card {
    padding: 1rem;
  }
}
</style> 