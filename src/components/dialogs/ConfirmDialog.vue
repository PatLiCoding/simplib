<script setup lang="ts">
/**
 * @file ConfirmDialog.vue
 * @description A generic confirmation dialog component for handling user confirmation actions
 * with customizable messages and button labels.
 */

import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Component props definition.
 */
const props = defineProps<{
  /** Determines whether the confirmation dialog is open */
  open: boolean
  /** Dialog header title */
  title: string
  /** Detailed confirmation message body */
  message: string
  /** Custom label for the confirmation button */
  confirmLabel?: string
  /** Custom label for the cancellation button */
  cancelLabel?: string
}>()

const { t } = useI18n()

/**
 * Component emitted events.
 */
const emit = defineEmits<{
  /** Emitted when the user confirms the action */
  confirm: []
  /** Emitted when the dialog is closed or cancelled */
  close: []
}>()

/** Reference to the native HTML dialog element */
const dialogEl = ref<HTMLDialogElement | null>(null)

/**
 * Watches the open prop to synchronize modal visibility state.
 */
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) dialogEl.value?.showModal()
    else if (dialogEl.value?.open) dialogEl.value.close()
  },
)

/**
 * Closes the dialog if the user clicks directly on the backdrop element.
 */
function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogEl.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="confirm-dialog"
    :aria-label="title"
    @close="emit('close')"
    @click="onBackdropClick"
  >
    <div class="confirm-body">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>

      <div class="actions">
        <button type="button" class="btn primary" @click="emit('confirm')">
          {{ confirmLabel ?? t('common.confirm') }}
        </button>
        <button type="button" class="btn secondary" @click="emit('close')">
          {{ cancelLabel ?? t('common.cancel') }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.confirm-dialog {
  width: min(360px, calc(100% - 32px));
  padding: 0;
  margin: auto;
  border: 1px solid #c7c7c9;
  border-radius: 10px;
  background-color: #f3f2f1;
  color: #2b2c2f;
  box-shadow: 0 4px 16px #00000040;
}

.confirm-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
}

h3 {
  margin: 0;
  color: #b23a3a;
}

p {
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
</style>
