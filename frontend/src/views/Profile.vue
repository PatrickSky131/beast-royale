<template>
  <div class="profile-page">
    <div class="container">
      <h1>个人档案</h1>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- 个人档案表单 -->
      <div v-if="!loading && profile" class="profile-form">
        <form @submit.prevent="saveProfile">
          <!-- 基本信息 -->
          <div class="form-section">
            <h2>基本信息</h2>
            
            <div class="form-group">
              <label for="address">钱包地址</label>
              <input 
                id="address" 
                type="text" 
                :value="profile.address" 
                readonly 
                class="readonly"
              />
            </div>

            <div class="form-group">
              <label for="username">用户名 *</label>
              <input 
                id="username" 
                v-model="formData.username" 
                type="text" 
                placeholder="输入用户名"
                :disabled="!canUpdateUsername"
              />
              <small v-if="!canUpdateUsername" class="warning">
                用户名24小时内只能修改一次
              </small>
            </div>

            <div class="form-group">
              <label for="bio">个人简介</label>
              <textarea 
                id="bio" 
                v-model="formData.bio" 
                placeholder="介绍一下自己..."
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="avatar">头像URL</label>
              <input 
                id="avatar" 
                v-model="formData.avatarURL" 
                type="url" 
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          <!-- 社交链接 -->
          <div class="form-section">
            <h2>社交链接</h2>
            
            <div class="form-group">
              <label for="discord">Discord用户名</label>
              <input 
                id="discord" 
                v-model="formData.discordUsername" 
                type="text" 
                placeholder="Discord用户名"
              />
            </div>

            <div class="form-group">
              <label for="discord-url">Discord链接</label>
              <input 
                id="discord-url" 
                v-model="formData.discordURL" 
                type="url" 
                placeholder="https://discord.gg/..."
              />
            </div>

            <div class="form-group">
              <label for="x-username">X (Twitter) 用户名</label>
              <input 
                id="x-username" 
                v-model="formData.xUsername" 
                type="text" 
                placeholder="X用户名"
              />
            </div>

            <div class="form-group">
              <label for="x-url">X (Twitter) 链接</label>
              <input 
                id="x-url" 
                v-model="formData.xURL" 
                type="url" 
                placeholder="https://x.com/..."
              />
            </div>
          </div>

          <!-- 游戏数据 -->
          <div class="form-section">
            <h2>游戏数据</h2>
            
            <div class="stats-grid">
              <div class="stat-item">
                <label>积分</label>
                <span class="stat-value">{{ profile.points }}</span>
              </div>
              <div class="stat-item">
                <label>代币</label>
                <span class="stat-value">{{ profile.tokens }}</span>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <label>注册时间</label>
                <span>{{ formatDate(profile.createdAt) }}</span>
              </div>
              <div class="info-item">
                <label>最后更新</label>
                <span>{{ formatDate(profile.updatedAt) }}</span>
              </div>
              <div v-if="profile.lastUsernameUpdate" class="info-item">
                <label>上次修改用户名</label>
                <span>{{ formatDate(profile.lastUsernameUpdate) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button 
              type="button" 
              @click="resetForm" 
              class="btn btn-secondary"
              :disabled="saving"
            >
              重置
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="saving || !hasChanges"
            >
              {{ saving ? '保存中...' : '保存更改' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useWalletStore } from '../stores/wallet.js'
import apiService from '../services/ApiService.js'

export default {
  name: 'Profile',
  setup() {
    const walletStore = useWalletStore()
    
    const loading = ref(false)
    const saving = ref(false)
    const error = ref('')
    const profile = ref(null)
    
    const formData = reactive({
      username: '',
      bio: '',
      avatarURL: '',
      discordUsername: '',
      discordURL: '',
      xUsername: '',
      xURL: ''
    })

    // 计算属性
    const canUpdateUsername = computed(() => {
      if (!profile.value) return false
      return !profile.value.lastUsernameUpdate || 
             new Date() - new Date(profile.value.lastUsernameUpdate) > 24 * 60 * 60 * 1000
    })

    const hasChanges = computed(() => {
      if (!profile.value) return false
      return formData.username !== profile.value.username ||
             formData.bio !== profile.value.bio ||
             formData.avatarURL !== profile.value.avatarURL ||
             formData.discordUsername !== profile.value.discordUsername ||
             formData.discordURL !== profile.value.discordURL ||
             formData.xUsername !== profile.value.xUsername ||
             formData.xURL !== profile.value.xURL
    })

    // 方法
    const loadProfile = async () => {
      loading.value = true
      error.value = ''
      
      try {
        const result = await apiService.getUserProfile()
        if (result.success) {
          profile.value = result.data
          resetForm()
        } else {
          error.value = result.error || '获取个人档案失败'
        }
      } catch (err) {
        error.value = '网络错误，请稍后重试'
        console.error('加载个人档案失败:', err)
      } finally {
        loading.value = false
      }
    }

    const resetForm = () => {
      if (profile.value) {
        formData.username = profile.value.username || ''
        formData.bio = profile.value.bio || ''
        formData.avatarURL = profile.value.avatarURL || ''
        formData.discordUsername = profile.value.discordUsername || ''
        formData.discordURL = profile.value.discordURL || ''
        formData.xUsername = profile.value.xUsername || ''
        formData.xURL = profile.value.xURL || ''
      }
    }

    const saveProfile = async () => {
      saving.value = true
      error.value = ''
      
      try {
        const updateData = {}
        
        // 只发送有变化的字段
        if (formData.username !== profile.value.username) {
          updateData.Username = formData.username
        }
        if (formData.bio !== profile.value.bio) {
          updateData.Bio = formData.bio
        }
        if (formData.avatarURL !== profile.value.avatarURL) {
          updateData.AvatarURL = formData.avatarURL
        }
        if (formData.discordUsername !== profile.value.discordUsername) {
          updateData.DiscordUsername = formData.discordUsername
        }
        if (formData.discordURL !== profile.value.discordURL) {
          updateData.DiscordURL = formData.discordURL
        }
        if (formData.xUsername !== profile.value.xUsername) {
          updateData.XUsername = formData.xUsername
        }
        if (formData.xURL !== profile.value.xURL) {
          updateData.XURL = formData.xURL
        }

        const result = await apiService.updateUserProfile(updateData)
        if (result.success) {
          profile.value = result.data
          alert('个人档案更新成功！')
        } else {
          error.value = result.error || '更新个人档案失败'
        }
      } catch (err) {
        error.value = '网络错误，请稍后重试'
        console.error('更新个人档案失败:', err)
      } finally {
        saving.value = false
      }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '未知'
      return new Date(dateStr).toLocaleString('zh-CN')
    }

    // 生命周期
    onMounted(async () => {
      loading.value = true
      error.value = ''
      
      try {
        // 检查后端session状态并自动恢复登录状态
        const isLoggedIn = await walletStore.checkSessionStatus()
        if (isLoggedIn) {
          // 已登录，加载用户档案
          await loadProfile()
        } else {
          // 未登录，提示连接钱包
          error.value = '请先连接钱包'
        }
      } catch (err) {
        error.value = '请先连接钱包'
        console.error('检测登录状态失败:', err)
      } finally {
        loading.value = false
      }
    })

    return {
      loading,
      saving,
      error,
      profile,
      formData,
      canUpdateUsername,
      hasChanges,
      loadProfile,
      resetForm,
      saveProfile,
      formatDate
    }
  }
}
</script>

<style scoped>
.profile-page {
  padding: 2rem 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 700;
}

.loading {
  text-align: center;
  color: white;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff4444;
  color: #ff4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
}

.profile-form {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.form-section h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input.readonly {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.form-group small.warning {
  color: #ffc107;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.stat-item label {
  display: block;
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  color: #6c757d;
  font-size: 0.875rem;
}

.info-item span {
  color: #333;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

@media (max-width: 768px) {
  .container {
    padding: 0 0.5rem;
  }
  
  .profile-form {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .stats-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style> 