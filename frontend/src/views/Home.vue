<template>
  <div class="home">
    <div class="hero">
      <h1 class="hero-title">欢迎来到 Beast Royale</h1>
      <p class="hero-subtitle">一个基于区块链的史诗级游戏体验</p>
      
      <div class="hero-actions">
        <router-link to="/game" class="btn btn-primary">
          登录
        </router-link>
        <router-link 
          v-if="isDevMode" 
          to="/metamask-test" 
          class="btn btn-secondary"
        >
          🦊 MetaMask 测试
        </router-link>
        <button class="btn btn-secondary" @click="learnMore">
          了解更多
        </button>
      </div>
    </div>

    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">🎮</div>
        <h3>沉浸式游戏体验</h3>
        <p>体验前所未有的游戏玩法，在区块链世界中展开冒险。</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🔐</div>
        <h3>安全可靠</h3>
        <p>使用MetaMask钱包确保您的资产和身份安全。</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">💎</div>
        <h3>数字资产</h3>
        <p>拥有真正的数字资产，在游戏中获得独特的收藏品。</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h3>移动端支持</h3>
        <p>支持移动设备访问，随时随地享受游戏乐趣。</p>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../config/index.js'

export default {
  name: 'Home',
  computed: {
    isDevMode() {
      return config.app.isDevMode
    }
  },
  methods: {
    learnMore() {
      alert('更多功能正在开发中...')
    }
  }
}
</script>

<style scoped>
.home {
  text-align: center;
}

.hero {
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  margin-bottom: 4rem;
}

.hero-title {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 800px;
  margin: 0 auto;
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
}

.btn-primary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
  color: white;
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  
  .btn {
    width: 100%;
    max-width: 280px;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 2rem 1rem;
  }
  
  .hero-title {
    font-size: 1.8rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
}
</style> 