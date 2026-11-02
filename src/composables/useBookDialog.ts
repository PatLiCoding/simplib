import { ref } from 'vue'

// Module-wide state: Header and BooklistView share the same dialog state
const isOpen = ref(false)
const editId = ref<string | null>(null)

export function useBookDialog() {
  function openNew() {
    editId.value = null
    isOpen.value = true
  }

  function openEdit(id: string) {
    editId.value = id
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return { isOpen, editId, openNew, openEdit, close }
}
