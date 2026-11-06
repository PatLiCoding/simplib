/**
 * @file index.ts
 * @description Configures Vue Router routes for the application views including home,
 * book list, and help pages.
 */

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import BooklistView from '@/views/BooklistView.vue'
import HelpView from '@/views/HelpView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/list', name: 'booklist', component: BooklistView },
    { path: '/help', name: 'help', component: HelpView },
  ],
})

export default router
