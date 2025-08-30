import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import GameMain from '../views/GameMain.vue'
import MetaMaskTest from '../views/MetaMaskTest.vue'
import Profile from '../views/Profile.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/game-main',
    name: 'GameMain',
    component: GameMain
  },
  {
    path: '/metamask-test',
    name: 'MetaMaskTest',
    component: MetaMaskTest
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  // 保持向后兼容，将 /game 重定向到 /login
  {
    path: '/game',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 