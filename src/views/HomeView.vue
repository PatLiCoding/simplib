<script setup lang="ts">
/**
 * @file HomeView.vue
 * @description Renders the application landing page featuring library overview statistics tiles,
 * navigation links, and settings dialog controls.
 */

import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBookStore } from '@/stores/books'
import { useI18n } from 'vue-i18n'
import { useSettingsDialog } from '@/composables/useSettingsDialog'
import logo from '@/assets/img/logo.png'

const router = useRouter()
const { stats } = storeToRefs(useBookStore())

const { t } = useI18n()
const { open: openSettings } = useSettingsDialog()

/** Navigates to the book list view with optional URL query parameters */
function openList(query: Record<string, string> = {}) {
  router.push({ name: 'booklist', query })
}
</script>

<template>
  <section class="home">
    <button
      type="button"
      class="settings-btn"
      :aria-label="t('settings.open')"
      @click="openSettings"
    >
      ⚙
    </button>

    <div class="logo-circle">
      <img :src="logo" :alt="t('home.logoAlt')" />
    </div>
    <h1>SimpLib</h1>

    <button type="button" class="start" @click="openList()">{{ t('home.start') }}</button>

    <hr class="border" />

    <h2>{{ t('home.overview') }}</h2>
    <div class="tile wide">
      <button type="button" class="row-layout" @click="openList({ status: 'wish' })">
        <span>{{ t('home.wishlist') }}</span
        ><strong>{{ stats.wish }}</strong>
      </button>
      <hr class="border" />
      <button type="button" class="row-layout" @click="openList({ available: '1' })">
        <span>{{ t('home.available') }}</span
        ><strong>{{ stats.available }}</strong>
      </button>
    </div>

    <div class="tile-row">
      <button type="button" class="row-layout row-color" @click="openList({ status: 'finish' })">
        <span>{{ t('status.finish') }}</span
        ><strong>{{ stats.finish }}</strong>
      </button>
      <button type="button" class="row-layout row-color" @click="openList({ status: 'unread' })">
        <span>{{ t('status.unread') }}</span
        ><strong>{{ stats.unread }}</strong>
      </button>
    </div>

    <div class="tile wide">
      <button type="button" class="row-layout" @click="openList({ favorites: '1' })">
        <span>★ {{ t('common.favorites') }}</span
        ><strong>{{ stats.favorites }}</strong>
      </button>
    </div>
  </section>
</template>

<style scoped>
.home {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 40px 24px;
  position: relative;
}

.logo-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background-color: #b23a3a;
}

.logo-circle img {
  width: 88%;
  object-fit: contain;
}

h1 {
  font-size: 42px;
  color: #b23a3a;
}

h2 {
  color: #b23a3a;
  margin-bottom: -10px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px;
  border: 1px solid #c7c7c9;
  border-radius: 10px;
  background-color: #f3f2f1;
  box-shadow: 0 1px 4px #c7c7c9;
  color: #2b2c2f;
  font-size: 24px;
  cursor: pointer;
}

.row-layout {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px 4px;
  border: none;
  background: none;
  font-size: 28px;
  color: #2b2c2f;
  cursor: pointer;
}

.row-color {
  padding: 16px;
  border: 1px solid #c7c7c9;
  border-radius: 10px;
  background-color: #f3f2f1;
  box-shadow: 0 1px 4px #c7c7c9;
}

.row-layout:hover {
  color: #b23a3a;
}

.tile:hover,
.row-color:hover {
  color: #b23a3a;
  border-color: #b23a3a;
}

.row-layout span,
.row-layout strong,
.tile span,
.tile strong {
  cursor: pointer;
}

.wide {
  width: min(420px, 100%);
  padding: 8px 16px;
  cursor: default;
}

.border {
  border: none;
  height: 1px;
  background-color: #c7c7c9;
  width: min(420px, 100%);
}

.tile-row {
  display: flex;
  gap: 16px;
  width: min(420px, 100%);
}

.start {
  padding: 10px 40px;
  border: 1px solid #b23a3a;
  border-radius: 25px;
  background: #b23a3a;
  color: #f3f2f1;
  font-size: 22px;
  cursor: pointer;
}

.start:hover {
  background: #2b2c2f;
  border-color: #2b2c2f;
}

.row-layout:focus-visible,
.start:focus-visible {
  outline: 2px solid #b23a3a;
  outline-offset: 2px;
}

.settings-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  border: none;
  border-radius: 25px;
  background: transparent;
  font-size: 28px;
  color: #8b8d92;
  cursor: pointer;
}

.settings-btn:hover {
  color: #b23a3a;
}

.settings-btn:focus-visible {
  outline: 2px solid #b23a3a;
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .row-layout {
    font-size: 22px;
  }
}
</style>
