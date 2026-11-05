<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsDialog } from '@/composables/useSettingsDialog'
import { setLocale, type Locale } from '@/i18n'
import { storeToRefs } from 'pinia'
import { useBookStore } from '@/stores/books'
import { downloadBackup, MAX_BACKUP_BYTES, parseBackup, type BackupError } from '@/utils/backup'
import type { Book } from '@/interface/book'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue'
import ImportDialog from '@/components/dialogs/ImportDialog.vue'

const { t, locale } = useI18n()
const { isOpen, close } = useSettingsDialog()

const dialogEl = ref<HTMLDialogElement | null>(null)

const languages: { value: Locale; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
]

const store = useBookStore()
const { books } = storeToRefs(store)
const exportedCount = ref(0)
const fileEl = ref<HTMLInputElement | null>(null)
const pending = shallowRef<{ books: Book[]; skipped: number } | null>(null)
const importError = ref<BackupError | ''>('')
const importResult = ref<{ mode: 'merge' | 'replace'; added: number; skipped: number } | null>(null)
const cleared = ref(false)
const deleteFailed = ref(false)
const confirmDeleteOpen = ref(false)
const importOpen = ref(false)

watch(isOpen, (open) => {
  if (open) {
    exportedCount.value = 0
    resetImport()
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

function resetImport() {
  pending.value = null
  importError.value = ''
  importResult.value = null
  importOpen.value = false
  cleared.value = false
  deleteFailed.value = false
  confirmDeleteOpen.value = false
}

async function onFilePicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  resetImport()
  exportedCount.value = 0

  if (file.size > MAX_BACKUP_BYTES) {
    importError.value = 'tooLarge'
    return
  }

  const result = parseBackup(await file.text())
  if (!result.ok) {
    importError.value = result.error
    return
  }
  pending.value = { books: result.books, skipped: result.skipped }
  importOpen.value = true
}

async function runImport(mode: 'merge' | 'replace') {
  if (!pending.value) return
  const { books: incoming, skipped: invalid } = pending.value
  importOpen.value = false

  try {
    const { added, skipped } = await store.importBooks(incoming, mode)
    resetImport()
    importResult.value = { mode, added, skipped: skipped + invalid }
  } catch (e) {
    console.error('Import failed:', e)
    resetImport()
    importError.value = 'failed'
  }
}

async function runDeleteAll() {
  confirmDeleteOpen.value = false
  try {
    await store.clear()
    resetImport()
    exportedCount.value = 0
    cleared.value = true
  } catch (e) {
    console.error('Delete failed:', e)
    resetImport()
    deleteFailed.value = true
  }
}

function onImportClose() {
  importOpen.value = false
  pending.value = null
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
          <button type="button" class="btn secondary" :disabled="!books.length" @click="onExport">
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
          @close="onImportClose"
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

.btn:focus-visible,
.chip:focus-visible {
  outline: 2px solid #b23a3a;
  outline-offset: 2px;
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
  margin-bottom: 8px;
  font-size: 14px;
  color: #8b8d92;
}

.hint.success {
  color: #2b2c2f;
}

.help-link {
  color: #b23a3a;
  font-size: 20px;
}

.help-link:hover {
  color: #2b2c2f;
  cursor: pointer;
}

.data-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hint.error {
  color: #b23a3a;
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
