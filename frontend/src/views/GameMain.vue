<template>
  <div class="game-main">
    <div class="game-header">
      <h1>🎮 Beast Royale 游戏大厅</h1>
      <p>欢迎来到区块链游戏世界！</p>
    </div>

    <!-- 钱包状态栏 -->
    <div class="wallet-status-bar">
      <div class="status-item">
        <span class="label">钱包状态:</span>
        <span v-if="walletStore.isConnected" class="value connected">
          ✅ 已连接 ({{ walletStore.shortAddress }})
        </span>
        <span v-else class="value disconnected">
          ❌ 未连接
        </span>
      </div>
      <div class="status-item">
        <span class="label">钱包类型:</span>
        <span class="value">{{ getWalletTypeName(walletStore.walletType) }}</span>
      </div>
      <button v-if="walletStore.isConnected" class="btn disconnect-btn" @click="disconnectWallet">
        断开连接
      </button>
    </div>

    <!-- 游戏功能区域 -->
    <div class="game-content">
      <!-- 玩家信息卡片 -->
      <div class="player-card">
        <div class="card-header">
          <h3>👤 玩家信息</h3>
        </div>
        <div class="card-content">
          <div class="info-row">
            <span class="label">地址:</span>
            <span class="value">{{ walletStore.address || '未连接' }}</span>
          </div>
          <div class="info-row">
            <span class="label">等级:</span>
            <span class="value">1</span>
          </div>
          <div class="info-row">
            <span class="label">经验值:</span>
            <span class="value">0 / 100</span>
          </div>
          <div class="info-row">
            <span class="label">金币:</span>
            <span class="value">1000</span>
          </div>
        </div>
      </div>

      <!-- 游戏功能卡片 -->
      <div class="game-features">
        <div class="feature-card">
          <div class="feature-icon">⚔️</div>
          <h3>战斗系统</h3>
          <p>与其他玩家进行实时对战</p>
          <button class="btn feature-btn" @click="startBattle">
            开始战斗
          </button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🏆</div>
          <h3>排行榜</h3>
          <p>查看全球玩家排名</p>
          <button class="btn feature-btn" @click="viewLeaderboard">
            查看排行
          </button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">💎</div>
          <h3>商店</h3>
          <p>购买装备和道具</p>
          <button class="btn feature-btn" @click="openShop">
            进入商店
          </button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🎒</div>
          <h3>背包</h3>
          <p>管理您的装备和道具</p>
          <button class="btn feature-btn" @click="openInventory">
            查看背包
          </button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">👥</div>
          <h3>公会</h3>
          <p>加入或创建公会</p>
          <button class="btn feature-btn" @click="openGuild">
            公会系统
          </button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">⚙️</div>
          <h3>设置</h3>
          <p>游戏设置和账户管理</p>
          <button class="btn feature-btn" @click="openSettings">
            游戏设置
          </button>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="recent-activity">
        <h3>📊 最近活动</h3>
        <div class="activity-list">
          <div class="activity-item">
            <span class="activity-time">刚刚</span>
            <span class="activity-text">欢迎来到 Beast Royale！</span>
          </div>
          <div class="activity-item">
            <span class="activity-time">1分钟前</span>
            <span class="activity-text">获得新手奖励：1000金币</span>
          </div>
          <div class="activity-item">
            <span class="activity-time">2分钟前</span>
            <span class="activity-text">完成新手教程</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <button class="nav-btn" @click="goHome">
        🏠 首页
      </button>
      <button class="nav-btn active" @click="goGame">
        🎮 游戏
      </button>
      <button class="nav-btn" @click="goProfile">
        👤 个人
      </button>
      <button class="nav-btn" @click="goSettings">
        ⚙️ 设置
      </button>
    </div>
  </div>
</template>

<script>
import { useWalletStore } from '../stores/wallet'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

export default {
  name: 'GameMain',
  setup() {
    const walletStore = useWalletStore()
    const router = useRouter()

    // 页面加载时自动检查登录状态
    onMounted(async () => {
      try {
        // 检查后端session状态并自动恢复登录状态
        await walletStore.checkSessionStatus()
      } catch (error) {
        console.error('检查登录状态失败:', error)
      }
    })

    const getWalletTypeName = (type) => {
      const types = {
        'metamask': 'MetaMask 浏览器插件',
        'mobile': 'MetaMask 移动应用',
        'walletconnect': 'WalletConnect',
        'manual': '手动连接'
      }
      return types[type] || type
    }

    const disconnectWallet = () => {
      walletStore.disconnect()
      router.push('/game')
    }

    // 游戏功能方法
    const startBattle = () => {
      alert('战斗系统正在开发中...')
    }

    const viewLeaderboard = () => {
      alert('排行榜功能正在开发中...')
    }

    const openShop = () => {
      alert('商店功能正在开发中...')
    }

    const openInventory = () => {
      alert('背包功能正在开发中...')
    }

    const openGuild = () => {
      alert('公会系统正在开发中...')
    }

    const openSettings = () => {
      alert('设置功能正在开发中...')
    }

    // 导航方法
    const goHome = () => {
      router.push('/')
    }

    const goGame = () => {
      // 已经在游戏页面，可以显示提示或刷新页面
      alert('您已经在游戏页面了！')
    }

    const goProfile = () => {
      router.push('/profile')
    }

    const goSettings = () => {
      alert('设置功能正在开发中...')
    }

    return {
      walletStore,
      getWalletTypeName,
      disconnectWallet,
      startBattle,
      viewLeaderboard,
      openShop,
      openInventory,
      openGuild,
      openSettings,
      goHome,
      goGame,
      goProfile,
      goSettings
    }
  }
}
</script>

<style scoped>
.game-main {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  padding-bottom: 80px;
}

.game-header {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
}

.game-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.game-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.wallet-status-bar {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.status-item .label {
  font-weight: 600;
}

.status-item .value {
  font-family: monospace;
}

.value.connected {
  color: #4CAF50;
}

.value.disconnected {
  color: #f44336;
}

.disconnect-btn {
  background: rgba(244, 67, 54, 0.8);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.disconnect-btn:hover {
  background: rgba(244, 67, 54, 1);
}

.game-content {
  display: grid;
  gap: 2rem;
}

.player-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  text-align: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.card-content {
  padding: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-weight: 600;
  color: #333;
}

.info-row .value {
  font-family: monospace;
  color: #666;
}

.game-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: #333;
}

.feature-card p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.feature-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.feature-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.recent-activity {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.recent-activity h3 {
  margin-bottom: 1rem;
  color: #333;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-time {
  font-size: 0.8rem;
  color: #999;
  font-weight: 600;
}

.activity-text {
  color: #333;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.nav-btn {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  color: #666;
}

.nav-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.nav-btn.active:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

@media (max-width: 768px) {
  .game-header h1 {
    font-size: 2rem;
  }
  
  .wallet-status-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .game-features {
    grid-template-columns: 1fr;
  }
  
  .bottom-nav {
    padding: 0.75rem;
  }
  
  .nav-btn {
    font-size: 0.8rem;
    padding: 0.5rem;
  }
}
</style> 