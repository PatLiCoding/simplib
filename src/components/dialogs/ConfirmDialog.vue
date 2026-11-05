<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}>()

const { t } = useI18n()

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const dialogEl = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) dialogEl.value?.showModal()
    else if (dialogEl.value?.open) dialogEl.value.close()
  },
)

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

.confirm-dialog::backdrop {
  background: #00000070;
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

.btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #b23a3a;
  font-size: 16px;
  cursor: pointer;
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

.secondary:hover {
  background: #b23a3a20;
}
</style>
