import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import config from './config/index.js'

// 动态控制vConsole
const initVConsole = () => {
  // 只在开发者模式且移动端时启用vConsole
  if (config.app.isDevMode && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    if (typeof VConsole !== 'undefined') {
      const vConsole = new VConsole()
      console.log('vConsole已启用（开发者模式），点击右下角按钮查看控制台')
    } else {
      console.warn('VConsole未加载，请检查网络连接')
    }
  }
}

// 初始化vConsole
initVConsole()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app') 