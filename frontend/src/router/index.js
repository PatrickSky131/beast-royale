import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Game from '../views/Game.vue'
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
    path: '/game',
    name: 'Game',
    component: Game
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 