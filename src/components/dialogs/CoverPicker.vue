<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { imageToCoverDataUrl } from '@/utils/cover'

defineProps<{
  title: string
  defaultCover: string
  showPreview: boolean
}>()

const cover = defineModel<string | null>({ required: true })

const { t } = useI18n()
const inputEl = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const error = ref('')

const buttonLabel = computed(() => {
  if (busy.value) return t('bookDialog.coverBusy')
  return cover.value ? t('bookDialog.coverChange') : t('bookDialog.coverAdd')
})

async function readCover(file: File) {
  busy.value = true
  error.value = ''
  try {
    cover.value = await imageToCoverDataUrl(file)
  } catch {
    error.value = t('bookDialog.coverError')
  } finally {
    busy.value = false
  }
}

function onPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) void readCover(file)
}
</script>

<template>
  <div class="cover-box">
    <img
      v-if="showPreview || cover"
      class="cover"
      :src="cover ?? defaultCover"
      :alt="t('book.coverAlt', { title })"
    />

    <div class="cover-actions">
      <button
        type="button"
        class="btn secondary small"
        :disabled="busy"
        @click="inputEl?.click()"
      >
        {{ buttonLabel }}
      </button>
      <button v-if="cover" type="button" class="btn secondary small" @click="cover = null">
        {{ t('bookDialog.coverRemove') }}
      </button>
    </div>
    <span v-if="error" class="error" role="alert">{{ error }}</span>

    <input ref="inputEl" type="file" accept="image/*" hidden @change="onPicked" />
  </div>
</template>

<style scoped>
.cover-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover {
  width: 100%;
  max-height: 160px;
  object-fit: contain;
  border-radius: 6px;
}

.cover-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.btn.small {
  padding: 2px 8px;
  font-size: 14px;
}
</style>
