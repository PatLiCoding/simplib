/**
 * @file main.ts
 * @description Application entry point initializing Vue, Pinia, Vue Router, internationalization,
 * database seeding, and mounting the root application to the DOM.
 */

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useBookStore } from '@/stores/books'
import { i18n } from './i18n'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

useBookStore()
  .init()
  .catch(console.error)
  .finally(() => app.mount('#app'))
