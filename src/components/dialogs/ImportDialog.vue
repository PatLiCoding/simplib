<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  open: boolean
  count: number
  invalid: number
  current: number
}>()

const emit = defineEmits<{
  merge: []
  replace: []
  close: []
}>()

const { t } = useI18n()
const dialogEl = ref<HTMLDialogElement | null>(null)
const view = ref<'choose' | 'confirm'>('choose')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      view.value = 'choose'
      dialogEl.value?.showModal()
    } else if (dialogEl.value?.open) {
      dialogEl.value.close()
    }
  },
)

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogEl.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="import-dialog"
    :aria-label="t('settings.import')"
    @close="emit('close')"
    @click="onBackdropClick"
  >
    <div v-if="view === 'choose'" class="import-body">
      <h3>{{ t('settings.import') }}</h3>
      <p>{{ t('settings.importFound', { n: count }, count) }}</p>
      <p v-if="invalid" class="note">
        {{ t('settings.importInvalid', { n: invalid }, invalid) }}
      </p>
      <p class="note">{{ t('settings.importChoice') }}</p>

      <div class="actions">
        <button type="button" class="btn primary" @click="emit('merge')">
          {{ t('settings.importMerge') }}
        </button>
        <button type="button" class="btn secondary" @click="view = 'confirm'">
          {{ t('settings.importReplace') }}
        </button>
        <button type="button" class="btn secondary" @click="emit('close')">
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>

    <div v-else class="import-body">
      <h3>{{ t('settings.replaceTitle') }}</h3>
      <p>{{ t('settings.replaceWarning') }}</p>

      <dl class="compare">
        <div>
          <dt>{{ t('settings.replaceCurrent') }}</dt>
          <dd>{{ current }}</dd>
        </div>
        <div>
          <dt>{{ t('settings.replaceIncoming') }}</dt>
          <dd>{{ count }}</dd>
        </div>
      </dl>

      <p class="note">{{ t('settings.replaceTip') }}</p>

      <div class="actions">
        <button type="button" class="btn primary" @click="emit('replace')">
          {{ t('settings.importReplace') }}
        </button>
        <button type="button" class="btn secondary" @click="view = 'choose'">
          {{ t('common.back') }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.import-dialog {
  width: min(360px, calc(100% - 32px));
  padding: 0;
  margin: auto;
  border: 1px solid #c7c7c9;
  border-radius: 10px;
  background-color: #f3f2f1;
  color: #2b2c2f;
  box-shadow: 0 4px 16px #00000040;
}

.import-body {
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
  line-height: 1.5;
}

.compare {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid #c7c7c9;
  border-radius: 10px;
  background: #ffffff;
}

.compare div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.compare div:last-child {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #c7c7c9;
}

dt {
  color: #8b8d92;
}

dd {
  margin: 0;
  font-weight: 700;
}

.note {
  font-size: 14px;
  color: #8b8d92;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #b23a3a;
  font-size: 16px;
  cursor: pointer;
  min-width: 160px;
}
</style>
