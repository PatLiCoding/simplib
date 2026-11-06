/**
 * @file useBookDialog.ts
 * @description Composable function managing book dialog visibility and tracking editing states
 * for creating or modifying specific book entries.
 */

import { ref } from 'vue'

const isOpen = ref(false)
const editId = ref<string | null>(null)

export function useBookDialog() {
  /** Opens the dialog in creation mode for a new book entry */
  function openNew() {
    editId.value = null
    isOpen.value = true
  }

  /** Opens the dialog in edit mode for an existing book identified by ID */
  function openEdit(id: string) {
    editId.value = id
    isOpen.value = true
  }

  /** Closes the book dialog */
  function close() {
    isOpen.value = false
  }

  return { isOpen, editId, openNew, openEdit, close }
}
