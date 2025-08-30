<template>
  <div class="profile-page">
    <div class="container">
      <h1>个人档案</h1>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
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
                用户名24小时内只能修改一次，请{{ usernameUpdateRemainingTime }}后再试
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
              @click="goToGame" 
              class="btn btn-game"
            >
              🎮 返回游戏大厅
            </button>
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

    <!-- 底部提示 -->
    <div v-if="success" class="toast toast-success">
      {{ success }}
    </div>
    <div v-if="error" class="toast toast-error">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useWalletStore } from '../stores/wallet.js'
import apiService from '../services/ApiService.js'
import { useRouter } from 'vue-router'
import config from '../config/index.js'

export default {
  name: 'Profile',
  setup() {
    const walletStore = useWalletStore()
    const router = useRouter()
    
    const loading = ref(false)
    const saving = ref(false)
    const error = ref('')
    const success = ref('')
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
             new Date() - new Date(profile.value.lastUsernameUpdate) > config.app.usernameUpdateInterval
    })

    const usernameUpdateRemainingTime = computed(() => {
      if (!profile.value || !profile.value.lastUsernameUpdate) return null
      
      const lastUpdate = new Date(profile.value.lastUsernameUpdate)
      const now = new Date()
      const timeDiff = config.app.usernameUpdateInterval - (now - lastUpdate)
      
      if (timeDiff <= 0) return null
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`
      } else {
        return `${minutes}分钟`
      }
    })

    const hasChanges = computed(() => {
      if (!profile.value) return false
      
      // 检查用户名变化（只有在可以更新时才考虑）
      const usernameChanged = canUpdateUsername.value && formData.username !== profile.value.username
      
      // 检查其他字段变化
      const otherFieldsChanged = formData.bio !== profile.value.bio ||
             formData.avatarURL !== profile.value.avatarURL ||
             formData.discordUsername !== profile.value.discordUsername ||
             formData.discordURL !== profile.value.discordURL ||
             formData.xUsername !== profile.value.xUsername ||
             formData.xURL !== profile.value.xURL
      
      return usernameChanged || otherFieldsChanged
    })

    // 方法
    const loadProfile = async () => {
      loading.value = true
      error.value = ''
      success.value = ''
      
      try {
        const result = await apiService.getUserProfile()
        if (result.success) {
          profile.value = result.data
          resetForm()
        } else {
          // 检查是否是认证错误
          if (result.retCode === 401) {
            throw new Error('请先连接钱包')
          } else {
            throw new Error('获取个人档案失败，请稍后重试')
          }
        }
      } catch (err) {
        console.error('加载个人档案失败:', err)
        // 根据错误类型显示不同的用户友好信息
        if (err.message.includes('网络') || err.message.includes('连接')) {
          throw new Error('网络连接失败，请检查网络后重试')
        } else if (err.message.includes('钱包')) {
          throw new Error('请先连接钱包')
        } else {
          throw new Error('获取个人档案失败，请稍后重试')
        }
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
      success.value = ''
      
      try {
        const updateData = {}
        
        // 发送所有有变化的字段，让后端处理用户名更新限制
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

        // 如果没有需要更新的字段，直接返回
        if (Object.keys(updateData).length === 0) {
          success.value = '没有需要更新的内容'
          setTimeout(() => {
            success.value = ''
            // 刷新页面
            window.location.reload()
          }, 2000)
          return
        }

        console.log('发送更新数据:', updateData) // 添加调试信息
        const result = await apiService.updateUserProfile(updateData)
        console.log('API响应:', result) // 添加调试信息
        
        if (result.success) {
          profile.value = result.data
          // 根据后端返回码显示不同的成功信息
          if (result.retCode === 206) {
            // 部分成功：用户名未更新，其他字段更新成功
            success.value = '个人档案更新成功！（用户名未更新，仍在限制期内）'
          } else if (result.retCode === 0) {
            // 完全成功
            success.value = '个人档案更新成功！'
          } else {
            // 其他成功情况
            success.value = '个人档案更新成功！'
          }
          // 2秒后自动清除成功信息并刷新页面
          setTimeout(() => {
            success.value = ''
            // 刷新页面
            window.location.reload()
          }, 2000)
        } else {
          console.log('API返回错误:', result) // 添加调试信息
          // 根据返回码显示不同的用户友好信息
          if (result.retCode === 401) {
            error.value = '请先连接钱包'
          } else if (result.retCode === 400) {
            // 根据具体错误类型显示不同信息
            if (result.message && result.message.includes('Username already taken')) {
              error.value = '用户名已被使用，请选择其他用户名'
            } else if (result.message && result.message.includes('24 hours')) {
              error.value = '用户名24小时内只能修改一次'
            } else {
              error.value = '请求参数错误，请检查输入'
            }
          } else if (result.retCode === 500) {
            error.value = '服务器错误，请稍后重试'
          } else {
            error.value = '更新失败，请稍后重试'
          }
          // 2秒后自动清除错误信息并刷新页面
          setTimeout(() => {
            error.value = ''
            // 刷新页面
            window.location.reload()
          }, 2000)
        }
      } catch (err) {
        console.error('更新个人档案失败:', err)
        console.log('错误详情:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        })
        
        // 根据错误类型显示不同的用户友好信息
        if (err.message && err.message.includes('网络')) {
          error.value = '网络连接失败，请检查网络后重试'
        } else if (err.message && err.message.includes('连接')) {
          error.value = '网络连接失败，请检查网络后重试'
        } else if (err.message && err.message.includes('用户名')) {
          error.value = '用户名更新失败，请稍后重试'
        } else if (err.message) {
          // 使用错误的具体信息
          error.value = err.message
        } else {
          error.value = '更新失败，请稍后重试'
        }
        // 2秒后自动清除错误信息并刷新页面
        setTimeout(() => {
          error.value = ''
          // 刷新页面
          window.location.reload()
        }, 2000)
      } finally {
        saving.value = false
      }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '未知'
      return new Date(dateStr).toLocaleString('zh-CN')
    }

    const goToGame = () => {
      router.push('/game-main')
    }

    // 生命周期
    onMounted(async () => {
      loading.value = true
      error.value = ''
      success.value = ''
      
      try {
        // 直接加载用户档案数据
        await loadProfile()
      } catch (err) {
        error.value = err.message || '获取用户数据失败，请重新登录'
        console.error('获取用户数据失败:', err)
      } finally {
        loading.value = false
      }
    })

    return {
      loading,
      saving,
      error,
      success,
      profile,
      formData,
      canUpdateUsername,
      usernameUpdateRemainingTime,
      hasChanges,
      loadProfile,
      resetForm,
      saveProfile,
      formatDate,
      goToGame
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

.btn-game {
  background: #28a745;
  color: white;
}

.btn-game:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
}

/* Toast提示样式 */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.toast-error {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes slideUpMobile {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  
  .toast {
    bottom: 10px;
    left: 10px;
    right: 10px;
    transform: none;
    text-align: center;
    animation: slideUpMobile 0.3s ease-out;
  }
}
</style> 