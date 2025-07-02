<template>
  <div class="test-section">
    <h3>🧪 功能测试</h3>
    <div class="button-results-container">
      <!-- 基础检查 -->
      <div class="button-result-group">
        <button @click="checkBasic" :class="['test-btn', { active: activeButton === 'basic' }]">
          <span class="btn-icon">🔍</span>
          <span class="btn-text">基础检查</span>
        </button>
        <div v-if="results.basic" :class="['result-content', results.basic.type]" v-html="results.basic.message"></div>
      </div>

      <!-- 测试连接 -->
      <div class="button-result-group">
        <button @click="testConnection" :class="['test-btn', { active: activeButton === 'connection' }]">
          <span class="btn-icon">🔗</span>
          <span class="btn-text">测试连接</span>
        </button>
        <div v-if="results.connection" :class="['result-content', results.connection.type]" v-html="results.connection.message"></div>
      </div>

      <!-- 账户信息 -->
      <div class="button-result-group">
        <button @click="getAccountInfo" :class="['test-btn', { active: activeButton === 'account' }]">
          <span class="btn-icon">👤</span>
          <span class="btn-text">账户信息</span>
        </button>
        <div v-if="results.account" :class="['result-content', results.account.type]" v-html="results.account.message"></div>
      </div>

      <!-- 网络信息 -->
      <div class="button-result-group">
        <button @click="getNetworkInfo" :class="['test-btn', { active: activeButton === 'network' }]">
          <span class="btn-icon">🌐</span>
          <span class="btn-text">网络信息</span>
        </button>
        <div v-if="results.network" :class="['result-content', results.network.type]" v-html="results.network.message"></div>
      </div>

      <!-- 跳转签名 -->
      <div class="button-result-group">
        <button @click="testFullFlow" :class="['test-btn', { active: activeButton === 'fullFlow' }]">
          <span class="btn-icon">🚀</span>
          <span class="btn-text">跳转签名</span>
        </button>
        <div v-if="results.fullFlow" :class="['result-content', results.fullFlow.type]" v-html="results.fullFlow.message"></div>
      </div>

      <!-- 打开MetaMask应用 - 只在移动设备外部浏览器中显示 -->
      <div v-if="shouldShowOpenMetaMask" class="button-result-group">
        <button @click="openMetaMask" :class="['test-btn', { active: activeButton === 'openMetaMask' }]">
          <span class="btn-icon">📱</span>
          <span class="btn-text">打开MetaMask</span>
        </button>
        <div v-if="results.openMetaMask" :class="['result-content', results.openMetaMask.type]" v-html="results.openMetaMask.message"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import web3Service from '../../services/Web3Service.js'
import apiService from '../../services/ApiService.js'
import config from '../../config/index.js'

export default {
  name: 'TestButtons',
  props: {
    currentAccount: {
      type: String,
      default: null
    },
    results: {
      type: Object,
      required: true
    },
    activeButton: {
      type: String,
      default: ''
    }
  },
  emits: ['update:results', 'update:activeButton', 'update:currentAccount', 'log'],
  setup(props, { emit }) {
    // MetaMask深度链接URL
    const metamaskUrl = computed(() => {
      const baseUrl = 'https://metamask.app.link/dapp/'
      const currentUrl = window.location.href.replace(/^https?:\/\//, '')
      return baseUrl + currentUrl
    })

    // 检测是否在MetaMask内置浏览器中
    const isInMetaMaskBrowser = computed(() => {
      const userAgent = navigator.userAgent.toLowerCase()
      return userAgent.includes('metamask') || userAgent.includes('web3')
    })

    // 判断是否应该显示打开MetaMask按钮
    const shouldShowOpenMetaMask = computed(() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      return isMobile && !isInMetaMaskBrowser.value
    })

    function showResult(key, message, type = 'info') {
      const className = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'
      emit('update:results', { ...props.results, [key]: { message, type } })
    }

    function checkBasic() {
      emit('update:activeButton', 'basic')
      emit('log', '开始基础检查...', 'info')
      
      if (!window.ethereum) {
        emit('log', '钱包 未安装', 'error')
        showResult('basic', '❌ 钱包 未安装', 'error')
        return
      }
      
      emit('log', '钱包 已安装', 'success')
      showResult('basic', '✅ 钱包 已安装<br>', 'success')
      emit('log', '请点击"测试连接"按钮来连接账户', 'info')
    }
    
    async function testConnection() {
      emit('update:activeButton', 'connection')
      emit('log', '开始测试连接...', 'info')
      
      if (!window.ethereum) {
        showResult('connection', '❌ 钱包 未安装', 'error')
        return
      }
      
      try {
        // 使用新的Web3Service连接
        const result = await web3Service.connect()
        
        emit('update:currentAccount', result.account)
        emit('log', `连接成功: ${result.account}`, 'success')
        
        showResult('connection', 
          `✅ 连接成功！<br>
          地址: ${result.account}<br>
          网络ID: ${result.chainId}<br>
          钱包类型: ${result.walletType}`, 
          'success'
        )
      } catch (error) {
        emit('log', `连接失败: ${error.message}`, 'error')
        showResult('connection', `❌ 连接失败: ${error.message}`, 'error')
      }
    }
    
    async function getAccountInfo() {
      emit('update:activeButton', 'account')
      emit('log', '获取账户信息...', 'info')
      
      if (!web3Service.isConnected) {
        showResult('account', '❌ 请先连接钱包', 'error')
        return
      }
      
      try {
        const status = web3Service.getConnectionStatus()
        const balance = await web3Service.getBalance()
        
        emit('log', `账户信息: ${status.account}, 余额: ${balance} ETH`, 'success')
        
        showResult('account', 
          `✅ 账户信息:<br>
          地址: ${status.account}<br>
          余额: ${balance} ETH<br>
          网络ID: ${status.chainId}<br>
          钱包类型: ${status.walletType}<br>
          是否移动设备: ${status.isMobile ? '是' : '否'}`, 
          'success'
        )
      } catch (error) {
        emit('log', `获取账户信息失败: ${error.message}`, 'error')
        showResult('account', `❌ 获取账户信息失败: ${error.message}`, 'error')
      }
    }
    
    async function getNetworkInfo() {
      emit('update:activeButton', 'network')
      emit('log', '获取网络信息...', 'info')
      
      if (!web3Service.isConnected) {
        showResult('network', '❌ 请先连接钱包', 'error')
        return
      }
      
      try {
        const network = await web3Service.getNetwork()
        
        emit('log', `网络信息: ${network.chainId} - ${network.name}`, 'success')
        
        showResult('network', 
          `✅ 网络信息:<br>
          网络ID: ${network.chainId}<br>
          网络名称: ${network.name}`, 
          'success'
        )
      } catch (error) {
        emit('log', `获取网络信息失败: ${error.message}`, 'error')
        showResult('network', `❌ 获取网络信息失败: ${error.message}`, 'error')
      }
    }
    
    async function testFullFlow() {
      emit('update:activeButton', 'fullFlow')
      emit('log', '开始完整流程测试...', 'info')
      
      try {
        // 检查连接状态
        const status = web3Service.getConnectionStatus()
        const address = status.account
        
        // 使用配置文件获取API地址
        const apiBase = config.getApiBase()
        emit('log', `使用API地址: ${apiBase}`, 'info')
        
        // 1. 获取nonce
        emit('log', '步骤1: 获取nonce...', 'info')
        const nonceResult = await apiService.connectWallet(address)
        
        if (!nonceResult.success) {
          showResult('fullFlow', `❌ 获取nonce失败: ${nonceResult.error}`, 'error')
          return
        }
        
        const nonce = nonceResult.data.nonce
        emit('log', `获取到nonce: ${nonce}`, 'success')
        
        // 2. 创建签名消息
        const message = `连接Beast Royale游戏\n\n点击签名以验证您的身份。\n\nNonce: ${nonce}`
        emit('log', `签名消息: ${message}`, 'info')
        
        // 3. 请求签名
        emit('log', '步骤2: 请求签名...', 'info')
        const signatureResult = await web3Service.signMessage(message)
        
        emit('log', `获取到签名: ${signatureResult.signature}`, 'success')
        
        // 4. 验证签名
        emit('log', '步骤3: 验证签名...', 'info')
        const verifyResult = await apiService.verifySignature(address, signatureResult.signature, message)
        
        if (verifyResult.success) {
          emit('log', `验证成功，token: ${verifyResult.data.token}`, 'success')
          showResult('fullFlow', 
            `✅ 完整流程测试成功！<br>
            地址: ${address}<br>
            Nonce: ${nonce}<br>
            签名: ${signatureResult.signature.slice(0, 20)}...<br>
            Token: ${verifyResult.data.token}`, 
            'success'
          )
        } else {
          showResult('fullFlow', `❌ 验证失败: ${verifyResult.error}`, 'error')
        }
        
      } catch (error) {
        emit('log', `完整流程测试失败: ${error.message}`, 'error')
        showResult('fullFlow', `❌ 完整流程测试失败: ${error.message}`, 'error')
      }
    }

    // 打开MetaMask应用
    function openMetaMask() {
      emit('update:activeButton', 'openMetaMask')
      emit('log', '尝试打开 MetaMask 应用...', 'info')
      
      try {
        // 尝试直接唤起MetaMask进行签名
        const message = '连接Beast Royale游戏\n\n点击签名以验证您的身份。'
        const metamaskSignUrl = `metamask://sign?message=${encodeURIComponent(message)}`
        
        emit('log', `尝试直接唤起MetaMask签名: ${metamaskSignUrl}`, 'info')
        
        // 尝试直接唤起
        window.location.href = metamaskSignUrl
        
        // 如果直接唤起失败，回退到原来的深度链接
        setTimeout(() => {
          emit('log', '直接唤起失败，使用深度链接...', 'warning')
          window.location.href = metamaskUrl.value
        }, 2000)
        
        showResult('openMetaMask', 
          `📱 尝试直接唤起MetaMask签名<br>
          如果失败，将跳转到MetaMask应用<br>
          直接唤起链接: ${metamaskSignUrl}<br>
          深度链接: ${metamaskUrl.value}`, 
          'info'
        )
        
      } catch (error) {
        emit('log', `打开 MetaMask 失败: ${error.message}`, 'error')
        showResult('openMetaMask', `❌ 打开 MetaMask 失败: ${error.message}`, 'error')
      }
    }

    return {
      checkBasic,
      testConnection,
      getAccountInfo,
      getNetworkInfo,
      testFullFlow,
      openMetaMask,
      shouldShowOpenMetaMask
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

/* 按钮结果容器 */
.button-results-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.button-result-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.test-btn {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  width: 100%;
  min-height: 80px;
  justify-content: center;
  /* 触摸设备优化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

.test-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

.test-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.test-btn.active:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 1.5rem;
}

.btn-text {
  font-size: 0.9rem;
}

/* 结果内容 */
.result-content {
  padding: 15px;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  overflow-x: auto;
  width: 100%;
  margin-top: 5px;
}

.result-content.success {
  background: #d4edda;
  border-left: 4px solid #28a745;
  color: #155724;
}

.result-content.error {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
  color: #721c24;
}

.result-content.warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  color: #856404;
}

.result-content.info {
  background: #d1ecf1;
  border-left: 4px solid #17a2b8;
  color: #0c5460;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-section h3 {
    font-size: 1.2rem;
    margin-bottom: 12px;
  }
  
  .button-results-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .test-btn {
    padding: 12px 8px;
    gap: 6px;
    min-height: 65px;
    border-radius: 10px;
    font-size: 0.9rem;
  }
  
  .btn-icon {
    font-size: 1.2rem;
  }
  
  .btn-text {
    font-size: 0.75rem;
  }
  
  .result-content {
    padding: 10px;
    font-size: 0.8rem;
    border-radius: 6px;
    word-break: break-all;
    overflow-wrap: break-word;
  }
}

@media (max-width: 480px) {
  .button-results-container {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .test-btn {
    padding: 15px 10px;
    min-height: 60px;
    border-radius: 8px;
    font-size: 0.85rem;
  }
  
  .btn-icon {
    font-size: 1.1rem;
  }
  
  .btn-text {
    font-size: 0.8rem;
  }
  
  .result-content {
    padding: 8px;
    font-size: 0.75rem;
    border-radius: 5px;
  }
}

@media (max-width: 360px) {
  .test-btn {
    padding: 12px 8px;
    min-height: 55px;
  }
  
  .btn-icon {
    font-size: 1rem;
  }
  
  .btn-text {
    font-size: 0.75rem;
  }
  
  .result-content {
    padding: 6px;
    font-size: 0.7rem;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .test-btn {
    min-height: 70px;
    padding: 15px 12px;
  }
  
  .test-btn:active {
    transform: scale(0.98);
  }
  
  /* 确保按钮有足够的点击区域 */
  .button-result-group {
    min-height: 120px;
  }
}
</style> 