/**
 * @file useLibraryTransfer.ts
 * @description Manages state and asynchronous actions for data export, backup file imports,
 * merge/replace handling, and bulk deletion of book records.
 */

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

/**
 * Composable providing state and actions for export, import, and data clearance operations.
 */
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

  /** Resets all transfer states, errors, and modal visibility flags */
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

  /** Triggers the backup file download and updates export counts */
  function exportBooks() {
    downloadBackup(books.value)
    exportedCount.value = books.value.length
  }

  /** Stages parsed backup records for review and opens the import modal */
  function stageImport(result: ParseResult) {
    if (!result.ok) {
      importError.value = result.error
      return
    }
    pending.value = { books: result.books, skipped: result.skipped }
    importOpen.value = true
  }

  /** Validates backup file size and processes text content for import staging */
  async function pickFile(file: File | undefined) {
    if (!file) return
    reset()
    if (file.size > MAX_BACKUP_BYTES) {
      importError.value = 'tooLarge'
      return
    }
    stageImport(parseBackup(await file.text()))
  }

  /** Executes the import operation using the specified merge or replace mode */
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

  /** Closes the import dialog and clears pending import data */
  function closeImport() {
    importOpen.value = false
    pending.value = null
  }

  /** Deletes all book records from the data store */
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
