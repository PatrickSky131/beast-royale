<template>
  <div id="app">
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { useWalletStore } from './stores/wallet'

export default {
  name: 'App',
  setup() {
    const walletStore = useWalletStore()
    
    // 移除自动检查session的逻辑，让各个页面自己处理
    // 这样可以避免在移动设备上从MetaMask返回时触发不必要的API调用
  }
}
</script>

<style scoped>
.main-content {
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}
</style> 