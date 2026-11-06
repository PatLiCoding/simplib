<script setup lang="ts">
/**
 * @file Header.vue
 * @description Displays the application header including the brand logo, title navigation link,
 * and settings dialog toggle button.
 */

import { useI18n } from 'vue-i18n'
import { useSettingsDialog } from '@/composables/useSettingsDialog'

const { t } = useI18n()
const { open: openSettings } = useSettingsDialog()
</script>

<template>
  <header class="header">
    <RouterLink :to="{ name: 'home' }" class="logo" :aria-label="t('header.home')">
      <img src="@/assets/img/logo.png" :alt="t('header.logoAlt')" />
      <h1 id="heading">SimpLib</h1>
    </RouterLink>

    <div class="header-actions">
      <button
        type="button"
        class="settingsBtn"
        :aria-label="t('settings.open')"
        @click="openSettings"
      >
        ⚙
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(12px, 2vw, 24px);
  background-color: #b23a3a;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

img {
  height: 120px;
  object-fit: contain;
  cursor: pointer;
}

#heading {
  margin: 0;
  font-weight: 700;
  font-size: 42px;
  line-height: 1.1;
  letter-spacing: 0;
  color: #f3f2f1;
  cursor: pointer;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settingsBtn {
  border: none;
  border-radius: 25px;
  padding: 4px 12px;
  font-size: 28px;
  background: #f3f2f1;
  color: #2b2c2f;

  &:hover {
    cursor: pointer;
    background: #2b2c2f;
    color: #f3f2f1;
    box-shadow: 0 0 0 1px #f3f2f1;
  }
}

/* Tablet */
@media (max-width: 1024px) {
  .header {
    padding: 8px 20px;
  }

  img {
    height: 100px;
    object-fit: contain;
  }

  #heading {
    display: none;
  }

  .settingsBtn {
    font-size: 24px;
  }
}

/* Phone */
@media (max-width: 640px) {
  img {
    height: 80px;
    object-fit: contain;
  }
}
</style>
