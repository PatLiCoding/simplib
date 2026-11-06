/**
 * @file useSettingsDialog.ts
 * @description Manages global module-wide state for the settings dialog, allowing both
 * the header and home view to control a single shared modal instance.
 */

import { ref } from 'vue'

const isOpen = ref(false)

export function useSettingsDialog() {
  /** Opens the settings dialog */
  function open() {
    isOpen.value = true
  }

  /** Closes the settings dialog */
  function close() {
    isOpen.value = false
  }

  return { isOpen, open, close }
}
