import { ref } from 'vue'

// Module-wide state: Header and HomeView open the same dialog
const isOpen = ref(false)

export function useSettingsDialog() {
  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return { isOpen, open, close }
}
