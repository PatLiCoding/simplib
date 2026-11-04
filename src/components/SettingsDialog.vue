<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsDialog } from '@/composables/useSettingsDialog'
import { setLocale, type Locale } from '@/i18n'
import { storeToRefs } from 'pinia'
import { useBookStore } from '@/stores/books'
import { downloadBackup } from '@/utils/backup'

const { t, locale } = useI18n()
const { isOpen, close } = useSettingsDialog()

const dialogEl = ref<HTMLDialogElement | null>(null)

const languages: { value: Locale; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
]

const { books } = storeToRefs(useBookStore())
const exportedCount = ref(0)

watch(isOpen, (open) => {
  if (open) {
    exportedCount.value = 0
    dialogEl.value?.showModal()
  } else if (dialogEl.value?.open) {
    dialogEl.value.close()
  }
})

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogEl.value) close()
}

function onExport() {
  downloadBackup(books.value)
  exportedCount.value = books.value.length
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="settings-dialog"
    :aria-label="t('settings.title')"
    @close="close"
    @click="onBackdropClick"
  >
    <div class="settings-body">
      <h2>{{ t('settings.title') }}</h2>

      <section class="group">
        <h3>{{ t('settings.language') }}</h3>
        <div class="chip-group" role="group" :aria-label="t('settings.language')">
          <button
            v-for="lang in languages"
            :key="lang.value"
            type="button"
            class="chip"
            :class="{ active: locale === lang.value }"
            :aria-pressed="locale === lang.value"
            @click="setLocale(lang.value)"
          >
            {{ lang.label }}
          </button>
        </div>
      </section>

      <section class="group">
        <h3>{{ t('settings.data') }}</h3>
        <button type="button" class="btn secondary" :disabled="!books.length" @click="onExport">
          {{ t('settings.export') }}
        </button>
        <p class="hint">{{ t('settings.exportHint') }}</p>
        <p v-if="exportedCount" class="hint success" role="status">
          {{ t('settings.exported', { n: exportedCount }, exportedCount) }}
        </p>
      </section>

      <div class="actions">
        <button type="button" class="btn primary" @click="close">
          {{ t('settings.close') }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.settings-dialog {
  width: min(420px, calc(100% - 32px));
  padding: 0;
  margin: auto;
  border: 1px solid #c7c7c9;
  border-radius: 10px;
  background-color: #f3f2f1;
  color: #2b2c2f;
  box-shadow: 0 4px 16px #00000040;
}

.settings-dialog::backdrop {
  background: #00000070;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

h2 {
  margin: 0;
  color: #b23a3a;
}

h3 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #8b8d92;
}

.chip-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 16px;
  border: 1px solid #b23a3a;
  border-radius: 20px;
  background: transparent;
  color: #b23a3a;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background: #b23a3a20;
  }
}

.chip.active {
  background: #b23a3a;
  color: #f3f2f1;
}

.chip.active:hover {
  background: #2b2c2f;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #b23a3a;
  font-size: 16px;
  cursor: pointer;
}

.primary {
  background: #b23a3a;
  color: #f3f2f1;
}

.primary:hover {
  background: #2b2c2f;
  border-color: #2b2c2f;
}

.secondary {
  background: transparent;
  color: #b23a3a;
}

.secondary:hover:not(:disabled) {
  background: #b23a3a20;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  margin-top: 8px;
  font-size: 14px;
  color: #8b8d92;
}

.hint.success {
  color: #2b2c2f;
}
</style>
