<template>
  <div id="app">
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useWalletStore } from './stores/wallet'

export default {
  name: 'App',
  setup() {
    const walletStore = useWalletStore()

    // 应用启动时自动检查登录状态
    onMounted(async () => {
      try {
        console.log('应用启动，检查登录状态...')
        await walletStore.checkSessionStatus()
      } catch (error) {
        console.error('应用启动时检查登录状态失败:', error)
      }
    })
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