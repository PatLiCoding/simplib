import { createRouter, createWebHistory } from 'vue-router'
import BooklistView from '@/views/BooklistView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'booklist',
      component: BooklistView,
    },
  ],
})

export default router
