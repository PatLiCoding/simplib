import { ref, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useBookStore } from '@/stores/books'
import {
  downloadBackup,
  MAX_BACKUP_BYTES,
  parseBackup,
  type BackupError,
  type ParseResult,
} from '@/utils/backup'
import type { Book } from '@/types/book'

type Mode = 'merge' | 'replace'

// State and actions for export, import and "delete all" in the settings dialog
export function useLibraryTransfer() {
  const store = useBookStore()
  const { books } = storeToRefs(store)

  const exportedCount = ref(0)
  const pending = shallowRef<{ books: Book[]; skipped: number } | null>(null)
  const importError = ref<BackupError | ''>('')
  const importResult = ref<{ mode: Mode; added: number; skipped: number } | null>(null)
  const importOpen = ref(false)
  const cleared = ref(false)
  const deleteFailed = ref(false)
  const confirmDeleteOpen = ref(false)

  function reset() {
    exportedCount.value = 0
    pending.value = null
    importError.value = ''
    importResult.value = null
    importOpen.value = false
    cleared.value = false
    deleteFailed.value = false
    confirmDeleteOpen.value = false
  }

  function exportBooks() {
    downloadBackup(books.value)
    exportedCount.value = books.value.length
  }

  function stageImport(result: ParseResult) {
    if (!result.ok) {
      importError.value = result.error
      return
    }
    pending.value = { books: result.books, skipped: result.skipped }
    importOpen.value = true
  }

  async function pickFile(file: File | undefined) {
    if (!file) return
    reset()
    if (file.size > MAX_BACKUP_BYTES) {
      importError.value = 'tooLarge'
      return
    }
    stageImport(parseBackup(await file.text()))
  }

  async function runImport(mode: Mode) {
    if (!pending.value) return
    const { books: incoming, skipped: invalid } = pending.value
    importOpen.value = false
    try {
      const { added, skipped } = await store.importBooks(incoming, mode)
      reset()
      importResult.value = { mode, added, skipped: skipped + invalid }
    } catch (e) {
      console.error('Import failed:', e)
      reset()
      importError.value = 'failed'
    }
  }

  function closeImport() {
    importOpen.value = false
    pending.value = null
  }

  async function runDeleteAll() {
    confirmDeleteOpen.value = false
    try {
      await store.clear()
      reset()
      cleared.value = true
    } catch (e) {
      console.error('Delete failed:', e)
      reset()
      deleteFailed.value = true
    }
  }

  return {
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
  }
}
