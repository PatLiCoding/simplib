import { ref } from 'vue'

// Module-wide state: Header and BooklistView share the same dialog state
const isOpen = ref(false)
const editIndex = ref<number | null>(null)

export function useBookDialog() {
  function openNew() {
    editIndex.value = null
    isOpen.value = true
  }

  function openEdit(index: number) {
    editIndex.value = index
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return { isOpen, editIndex, openNew, openEdit, close }
}
