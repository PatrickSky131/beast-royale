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

// 添加全局错误处理，防止Vite连接问题导致页面崩溃
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error)
  // 如果是Vite连接错误，不显示错误覆盖层
  if (event.error && event.error.message && 
      (event.error.message.includes('server connection lost') || 
       event.error.message.includes('Polling for restart'))) {
    console.log('检测到Vite连接问题，忽略错误')
    event.preventDefault()
  }
})

// 处理未捕获的Promise错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise错误:', event.reason)
  // 如果是Vite连接错误，忽略
  if (event.reason && event.reason.message && 
      (event.reason.message.includes('server connection lost') || 
       event.reason.message.includes('Polling for restart'))) {
    console.log('检测到Vite连接问题，忽略Promise错误')
    event.preventDefault()
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app') 