<script setup lang="ts">
/**
 * @file SettingsDialog.vue
 * @description Manages application settings, language switching, data export and import
 * operations, and library deletion actions within a modal dialog interface.
 */

import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsDialog } from '@/composables/useSettingsDialog'
import { useLibraryTransfer } from '@/composables/useLibraryTransfer'
import { setLocale, type Locale } from '@/i18n'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue'
import ImportDialog from '@/components/dialogs/ImportDialog.vue'

const { t, locale } = useI18n()
const { isOpen, close } = useSettingsDialog()

const {
  books,
  exportedCount,
  pending,
  importError,
  importResult,
  importOpen,
  cleared,
  deleteFailed,
  confirmDeleteOpen,
  reset,
  exportBooks,
  pickFile,
  runImport,
  closeImport,
  runDeleteAll,
} = useLibraryTransfer()

/** Reference to the native HTML dialog element */
const dialogEl = ref<HTMLDialogElement | null>(null)
/** Reference to the hidden file input element */
const fileEl = ref<HTMLInputElement | null>(null)

/**
 * Predefined configuration options for supported interface languages.
 */
const languages: { value: Locale; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
]

/**
 * Watches dialog open state to synchronize modal visibility and reset transfer state.
 */
watch(isOpen, (open) => {
  if (open) {
    reset()
    dialogEl.value?.showModal()
  } else if (dialogEl.value?.open) {
    dialogEl.value.close()
  }
})

/**
 * Closes the settings dialog if the user clicks directly on the backdrop element.
 */
function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogEl.value) close()
}

/**
 * Handles file selection change events for importing library JSON files.
 */
function onFilePicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  void pickFile(file)
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="app-dialog"
    :aria-label="t('settings.title')"
    @close="close"
    @click="onBackdropClick"
  >
    <div class="settings-body">
      <h2>{{ t('settings.title') }}</h2>

      <section class="group">
        <RouterLink :to="{ name: 'help' }" class="help-link" @click="close">
          {{ t('settings.help') }}
        </RouterLink>
      </section>

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

        <p class="hint">{{ t('settings.exportHint') }}</p>
        <p class="hint">{{ t('settings.importHint') }}</p>

        <div class="data-actions">
          <button
            type="button"
            class="btn secondary"
            :disabled="!books.length"
            @click="exportBooks"
          >
            {{ t('settings.export') }}
          </button>
          <button type="button" class="btn secondary" @click="fileEl?.click()">
            {{ t('settings.import') }}
          </button>
        </div>
        <input
          ref="fileEl"
          type="file"
          accept="application/json,.json"
          hidden
          @change="onFilePicked"
        />

        <p v-if="exportedCount" class="hint success" role="status">
          {{ t('settings.exported', { n: exportedCount }, exportedCount) }}
        </p>

        <ImportDialog
          :open="importOpen"
          :count="pending?.books.length ?? 0"
          :invalid="pending?.skipped ?? 0"
          :current="books.length"
          @merge="runImport('merge')"
          @replace="runImport('replace')"
          @close="closeImport"
        />

        <p v-if="importError" class="hint error" role="alert">
          {{ t(`settings.importErrors.${importError}`) }}
        </p>
        <p v-if="importResult" class="hint success" role="status">
          {{
            importResult.mode === 'merge'
              ? t('settings.importedMerge', {
                  added: importResult.added,
                  skipped: importResult.skipped,
                })
              : t('settings.importedReplace', { n: importResult.added }, importResult.added)
          }}
        </p>
      </section>

      <div class="danger">
        <button
          type="button"
          class="btn danger-btn"
          :disabled="!books.length"
          @click="confirmDeleteOpen = true"
        >
          {{ t('settings.deleteAll') }}
        </button>
        <p class="hint">{{ t('settings.deleteHint') }}</p>
        <p v-if="cleared" class="hint success" role="status">{{ t('settings.deleted') }}</p>
        <p v-if="deleteFailed" class="hint error" role="alert">{{ t('settings.deleteFailed') }}</p>
      </div>

      <div class="actions">
        <button type="button" class="btn secondary" @click="close">
          {{ t('settings.close') }}
        </button>
      </div>
    </div>
  </dialog>

  <ConfirmDialog
    :open="confirmDeleteOpen"
    :title="t('settings.deleteTitle')"
    :message="t('settings.deleteMessage', { n: books.length })"
    :confirm-label="t('settings.deleteConfirm')"
    @confirm="runDeleteAll"
    @close="confirmDeleteOpen = false"
  />
</template>

<style scoped>
.settings-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

h2 {
  margin: 0;
  color: #b23a3a;
  font-size: 28px;
}

h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #8b8d92;
  border-top: 1px solid #8b8d92;
  margin-top: 4px;
  padding-top: 24px;
}

.chip-group,
.data-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.hint {
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #8b8d92;
}

.hint.success {
  color: #2b2c2f;
}

.hint.error {
  color: #b23a3a;
}

.help-link {
  color: #b23a3a;
  font-size: 20px;
}

.help-link:hover {
  color: #2b2c2f;
  cursor: pointer;
}

.danger {
  padding-top: 12px;
  border-top: 1px solid #8b8d9240;
}

.danger-btn {
  background: transparent;
  color: #b23a3a;
}

.danger-btn:hover:not(:disabled) {
  background: #b23a3a;
  color: #f3f2f1;
}
</style>
