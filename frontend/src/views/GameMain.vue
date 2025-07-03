<template>
  <div class="game-main">
    <div class="game-header">
      <h1>🎮 Beast Royale 游戏大厅</h1>
      <p>欢迎来到区块链游戏世界！</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <p>正在加载用户数据...</p>
      </div>
    </div>

    <!-- 游戏功能区域 -->
    <div v-else class="game-content">
      <!-- 玩家信息卡片 -->
      <div class="player-card">
        <div class="card-header">
          <h3>👤 玩家信息</h3>
        </div>
        <div class="card-content">
          <div class="info-row">
            <span class="label">地址:</span>
            <span class="value">{{ userProfile.address || walletStore.address || '未获取' }}</span>
          </div>
          <div class="info-row">
            <span class="label">用户名:</span>
            <span class="value">{{ userProfile.username || '未设置' }}</span>
          </div>
          <div class="info-row">
            <span class="label">积分:</span>
            <span class="value">{{ userProfile.points || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="label">代币:</span>
            <span class="value">{{ userProfile.tokens || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="label">注册时间:</span>
            <span class="value">{{ formatDate(userProfile.created_at) }}</span>
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
            <span class="activity-text">获得新手奖励：{{ userProfile.tokens || 1000 }}代币</span>
          </div>
          <div class="activity-item">
            <span class="activity-time">2分钟前</span>
            <span class="activity-text">完成新手教程</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-buttons">
      <button class="bottom-btn logout-btn" @click="logout">
        🚪 退出登录
      </button>
      <button class="bottom-btn profile-btn" @click="goProfile">
        👤 个人资料
      </button>
      <button class="bottom-btn home-btn" @click="goHome">
        🏠 返回首页
      </button>
    </div>
  </div>
</template>

<script>
import { useWalletStore } from '../stores/wallet'
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import apiService from '../services/ApiService.js'

export default {
  name: 'GameMain',
  setup() {
    const walletStore = useWalletStore()
    const router = useRouter()
    const loading = ref(true)
    const userProfile = ref({})

    // 页面加载时自动检查登录状态和获取用户数据
    onMounted(async () => {
      try {
        // 检查是否为移动端外部浏览器
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const isInMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent)
        const isExternalBrowser = isMobile && !isInMetaMaskBrowser
        
        // 如果是移动端外部浏览器，直接跳转到登录页面
        if (isExternalBrowser) {
          console.log('移动端外部浏览器，跳过session检查，直接跳转到登录页面')
          router.push('/login')
          return
        }
        
        // 检查后端session状态并自动恢复登录状态
        const hasSession = await walletStore.checkSessionStatus()
        
        if (!hasSession) {
          // 没有session，跳转到登录页面
          router.push('/login')
          return
        }

        // 获取用户档案数据
        await fetchUserProfile()
      } catch (error) {
        console.error('检查登录状态失败:', error)
        router.push('/login')
      } finally {
        loading.value = false
      }
    })

    const fetchUserProfile = async () => {
      try {
        const result = await apiService.callApi('GetUserProfile', {
          RequestUUID: Date.now().toString()
        })

        if (result.success) {
          userProfile.value = result.data
        } else {
          console.error('获取用户档案失败:', result.message)
        }
      } catch (error) {
        console.error('获取用户档案失败:', error)
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '未知'
      return new Date(dateString).toLocaleString('zh-CN')
    }

    const disconnectWallet = () => {
      walletStore.disconnect()
      router.push('/')
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
      router.push('/profile')
    }

    // 导航方法
    const goHome = () => {
      router.push('/')
    }

    const goProfile = () => {
      router.push('/profile')
    }

    const logout = async () => {
      try {
        // 调用后端清除session
        await apiService.callApi('Logout', {
          RequestUUID: Date.now().toString()
        })
        
        // 清除前端钱包状态
        walletStore.disconnect()
        
        // 跳转到首页
        router.push('/')
      } catch (error) {
        console.error('退出登录失败:', error)
        // 即使后端调用失败，也清除前端状态并跳转
        walletStore.disconnect()
        router.push('/')
      }
    }

    return {
      walletStore,
      loading,
      userProfile,
      formatDate,
      startBattle,
      viewLeaderboard,
      openShop,
      openInventory,
      openGuild,
      openSettings,
      goHome,
      goProfile,
      logout
    }
  }
}
</script>

<style scoped>
.game-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.game-header {
  text-align: center;
  margin-bottom: 2rem;
}

.game-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.game-header p {
  font-size: 1.2rem;
  color: #666;
}

.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-card {
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.game-content {
  display: grid;
  gap: 2rem;
}

.player-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.card-content {
  padding: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-weight: 600;
  color: #666;
}

.info-row .value {
  font-weight: 500;
  color: #333;
}

.game-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
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
  font-weight: 600;
  transition: all 0.3s ease;
}

.feature-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.recent-activity {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.recent-activity h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-time {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.activity-text {
  color: #333;
  font-weight: 500;
}

.bottom-buttons {
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  padding: 1rem 1rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}

.bottom-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border-radius: 8px;
  min-width: 100px;
  flex: 1;
  margin: 0 0.5rem;
}

.bottom-btn:first-child {
  margin-left: 0;
}

.bottom-btn:last-child {
  margin-right: 0;
}

.bottom-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.bottom-btn.home-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.bottom-btn.home-btn:hover {
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.bottom-btn.profile-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bottom-btn.profile-btn:hover {
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.bottom-btn.logout-btn {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.bottom-btn.logout-btn:hover {
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
}

@media (max-width: 768px) {
  .game-main {
    padding: 1rem;
  }
  
  .game-header h1 {
    font-size: 2rem;
  }
  
  .game-features {
    grid-template-columns: 1fr;
  }
  
  .bottom-buttons {
    padding: 1rem;
  }
  
  .bottom-btn {
    font-size: 0.8rem;
    padding: 0.75rem 1rem;
    min-width: 100px;
  }
}
</style> 