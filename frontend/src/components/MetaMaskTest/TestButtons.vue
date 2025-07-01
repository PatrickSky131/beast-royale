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
import { computed } from 'vue'
import axios from 'axios'

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
        emit('log', 'MetaMask 未安装', 'error')
        showResult('basic', '❌ MetaMask 未安装', 'error')
        return
      }
      
      emit('log', 'MetaMask 已安装', 'success')
      showResult('basic', '✅ MetaMask 已安装<br>', 'success')
      emit('log', '请点击"测试连接"按钮来连接账户', 'info')
    }
    
    async function testConnection() {
      emit('update:activeButton', 'connection')
      emit('log', '测试连接...', 'info')
      
      if (!window.ethereum) {
        emit('log', 'MetaMask 未安装', 'error')
        showResult('connection', '❌ MetaMask 未安装', 'error')
        return
      }
      
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
        
        if (accounts.length > 0) {
          emit('update:currentAccount', accounts[0])
          emit('log', `连接成功: ${accounts[0]}`, 'success')
          showResult('connection', `✅ 连接成功: ${accounts[0]}`, 'success')
        } else {
          emit('log', '没有找到账户', 'error')
          showResult('connection', '❌ 没有找到账户', 'error')
        }
      } catch (error) {
        emit('log', `连接失败: ${error.message}`, 'error')
        showResult('connection', `❌ 连接失败: ${error.message}`, 'error')
      }
    }
    
    async function getAccountInfo() {
      emit('update:activeButton', 'account')
      if (!props.currentAccount) {
        showResult('account', '❌ 请先连接账户', 'error')
        return
      }
      
      emit('log', '获取账户信息...', 'info')
      
      try {
        // 获取当前网络信息
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        })
        
        // 获取余额
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [props.currentAccount, 'latest']
        })
        
        // 简化余额显示，不显示代币符号
        const balanceWei = BigInt(balance)
        const balanceEth = balanceWei / BigInt(10 ** 18)
        const balanceRemainder = balanceWei % BigInt(10 ** 18)
        
        let balanceFormatted
        if (balanceRemainder === 0n) {
          balanceFormatted = balanceEth.toString()
        } else {
          const remainderStr = balanceRemainder.toString().padStart(18, '0')
          const trimmedRemainder = remainderStr.replace(/0+$/, '')
          balanceFormatted = `${balanceEth}.${trimmedRemainder}`
        }
        
        emit('log', `账户信息获取成功: ${balanceFormatted}`, 'success')
        
        showResult('account', 
          `✅ 账户信息:<br>
          地址: ${props.currentAccount}<br>
          网络ID: ${chainId}<br>
          余额: ${balanceFormatted}`, 
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
      
      if (!window.ethereum) {
        showResult('network', '❌ MetaMask 未安装', 'error')
        return
      }
      
      try {
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        })
        
        // 简化网络名称显示
        const networkName = getSimpleNetworkName(chainId)
        
        emit('log', `网络信息: ${chainId} - ${networkName}`, 'success')
        
        showResult('network', 
          `✅ 网络信息:<br>
          网络ID: ${chainId}<br>
          网络名称: ${networkName}`, 
          'success'
        )
      } catch (error) {
        emit('log', `获取网络信息失败: ${error.message}`, 'error')
        showResult('network', `❌ 获取网络信息失败: ${error.message}`, 'error')
      }
    }
    
    function getSimpleNetworkName(chainId) {
      const networks = {
        '0x1': 'Ethereum Mainnet',
        '0x5': 'Goerli Testnet',
        '0x89': 'Polygon Mainnet',
        '0x13881': 'Mumbai Testnet',
        '0x38': 'BSC Mainnet',
        '0x61': 'BSC Testnet',
        '0xa': 'Optimism',
        '0xa4b1': 'Arbitrum One',
        '0x2105': 'Base',
        '0x14a33': 'Base Goerli',
        '0xaa36a7': 'Sepolia'
      }
      return networks[chainId] || `自定义网络 (${chainId})`
    }
    
    async function testFullFlow() {
      emit('update:activeButton', 'fullFlow')
      emit('log', '开始跳转签名测试...', 'info')
      
      if (!window.ethereum) {
        showResult('fullFlow', '❌ MetaMask 未安装', 'error')
        return
      }
      
      try {
        // 1. 连接钱包
        emit('log', '步骤1: 连接钱包...', 'info')
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
        
        if (accounts.length === 0) {
          showResult('fullFlow', '❌ 没有找到账户', 'error')
          return
        }
        
        const address = accounts[0]
        emit('log', `钱包地址: ${address}`, 'success')
        
        // 2. 获取nonce
        emit('log', '步骤2: 获取nonce...', 'info')
        const nonceResponse = await axios.post('/rpc', {
          method: 'wallet.connect',
          params: {
            address: address
          },
          id: 1
        })
        
        if (!nonceResponse.data.result?.success) {
          showResult('fullFlow', `❌ 获取nonce失败: ${nonceResponse.data.error?.message || nonceResponse.data.result?.message}`, 'error')
          return
        }
        
        const nonce = nonceResponse.data.result.nonce
        emit('log', `获取到nonce: ${nonce}`, 'success')
        
        // 3. 创建签名消息
        const message = `连接Beast Royale游戏\n\nNonce: ${nonce}\n\n点击签名以验证您的身份。`
        emit('log', `签名消息: ${message}`, 'info')
        
        // 4. 请求签名
        emit('log', '步骤3: 请求签名...', 'info')
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address]
        })
        
        emit('log', `获取到签名: ${signature}`, 'success')
        
        // 5. 验证签名
        emit('log', '步骤4: 验证签名...', 'info')
        const verifyResponse = await axios.post('/rpc', {
          method: 'wallet.verify',
          params: {
            address: address,
            signature: signature,
            message: message
          },
          id: 1
        })
        
        if (verifyResponse.data.result?.success) {
          emit('log', `验证成功，token: ${verifyResponse.data.result.token}`, 'success')
          showResult('fullFlow', 
            `✅ 跳转签名测试成功！<br>
            地址: ${address}<br>
            Nonce: ${nonce}<br>
            签名: ${signature.slice(0, 20)}...<br>
            Token: ${verifyResponse.data.result.token}`, 
            'success'
          )
        } else {
          showResult('fullFlow', `❌ 验证失败: ${verifyResponse.data.error?.message || verifyResponse.data.result?.message}`, 'error')
        }
        
      } catch (error) {
        emit('log', `跳转签名测试失败: ${error.message}`, 'error')
        showResult('fullFlow', `❌ 跳转签名测试失败: ${error.message}`, 'error')
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