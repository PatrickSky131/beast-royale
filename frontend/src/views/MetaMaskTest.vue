<template>
  <div class="metamask-test">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1>🔧 MetaMask 连接测试</h1>
        <p>测试 MetaMask 钱包连接和签名功能</p>
      </div>
      
      <!-- 测试功能区域 -->
      <div class="test-area">
        <!-- 设备信息组件 -->
        <DeviceInfo />
        
        <!-- 功能测试组件 -->
        <TestButtons 
          :current-account="currentAccount"
          :results="results"
          :active-button="activeButton"
          @update:results="updateResults"
          @update:active-button="updateActiveButton"
          @update:current-account="updateCurrentAccount"
          @log="handleLog"
        />
        
        <!-- 调试日志组件 -->
        <DebugLog 
          ref="debugLogRef"
          @clear-all-results="clearAllResults"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import DeviceInfo from '@/components/MetaMaskTest/DeviceInfo.vue'
import TestButtons from '@/components/MetaMaskTest/TestButtons.vue'
import DebugLog from '@/components/MetaMaskTest/DebugLog.vue'

export default {
  name: 'MetaMaskTest',
  components: {
    DeviceInfo,
    TestButtons,
    DebugLog
  },
  setup() {
    const currentAccount = ref(null)
    const debugLogRef = ref(null)
    const activeButton = ref('')
    
    const results = reactive({
      basic: '',
      connection: '',
      account: '',
      network: '',
      fullFlow: '',
      openMetaMask: ''
    })
    
    function updateResults(newResults) {
      Object.assign(results, newResults)
    }
    
    function updateActiveButton(button) {
      activeButton.value = button
    }
    
    function updateCurrentAccount(account) {
      currentAccount.value = account
    }
    
    function handleLog(message, type = 'info') {
      if (debugLogRef.value) {
        debugLogRef.value.log(message, type)
      }
    }
    
    function clearAllResults() {
      // 清除所有测试结果
      Object.keys(results).forEach(key => {
        results[key] = ''
      })
      
      // 重置账户状态
      currentAccount.value = null
      activeButton.value = ''
      
      handleLog('已清除所有测试结果', 'info')
    }
    
    onMounted(() => {
      handleLog('页面加载完成，开始基础检查...', 'info')
      
      // 监听账户变化
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', function (accounts) {
          handleLog(`账户变化: ${accounts[0] || '未连接'}`, 'info')
          if (accounts.length > 0) {
            currentAccount.value = accounts[0]
            // 清除之前的测试结果
            results.connection = ''
            results.account = ''
            results.network = ''
            results.fullFlow = ''
          } else {
            currentAccount.value = null
            // 清除所有测试结果
            Object.keys(results).forEach(key => {
              results[key] = ''
            })
          }
        })
        
        window.ethereum.on('chainChanged', function (chainId) {
          handleLog(`网络变化: ${chainId}`, 'info')
          // 清除网络相关的测试结果
          results.network = ''
        })
      }
    })
    
    return {
      currentAccount,
      debugLogRef,
      results,
      activeButton,
      updateResults,
      updateActiveButton,
      updateCurrentAccount,
      handleLog,
      clearAllResults
    }
  }
}
</script>

<style scoped>
.metamask-test {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.page-header p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}

/* 测试区域 */
.test-area {
  padding: 30px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metamask-test {
    padding: 8px;
  }
  
  .container {
    border-radius: 12px;
    margin: 0 5px;
  }
  
  .page-header {
    padding: 20px 12px;
  }
  
  .page-header h1 {
    font-size: 1.6rem;
    margin-bottom: 8px;
  }
  
  .page-header p {
    font-size: 0.9rem;
  }
  
  .test-area {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .metamask-test {
    padding: 5px;
  }
  
  .container {
    border-radius: 10px;
    margin: 0 2px;
  }
  
  .page-header {
    padding: 15px 10px;
  }
  
  .page-header h1 {
    font-size: 1.4rem;
  }
  
  .page-header p {
    font-size: 0.85rem;
  }
  
  .test-area {
    padding: 10px;
  }
}

@media (max-width: 360px) {
  .metamask-test {
    padding: 3px;
  }
  
  .container {
    border-radius: 8px;
    margin: 0 1px;
  }
  
  .page-header {
    padding: 12px 8px;
  }
  
  .page-header h1 {
    font-size: 1.2rem;
  }
  
  .page-header p {
    font-size: 0.8rem;
  }
  
  .test-area {
    padding: 8px;
  }
}
</style> 