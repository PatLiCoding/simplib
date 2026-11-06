<script setup lang="ts">
/**
 * @file CoverPicker.vue
 * @description Allows users to upload, preview, change, or remove book cover images,
 * converting uploaded files into data URLs.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { imageToCoverDataUrl } from '@/utils/cover'

/**
 * Component props definition.
 */
defineProps<{
  /** Book title used for image alt text descriptions */
  title: string
  /** Default cover image source fallback */
  defaultCover: string
  /** Flag to determine whether to force cover preview visibility */
  showPreview: boolean
}>()

/** Two-way model binding for the cover image data URL or null */
const cover = defineModel<string | null>({ required: true })

const { t } = useI18n()
/** Reference to the hidden file input element */
const inputEl = ref<HTMLInputElement | null>(null)
/** Tracks whether a cover file is currently being processed */
const busy = ref(false)
/** Stores cover processing error messages */
const error = ref('')

/**
 * Computed button label reflecting the current busy state and whether a cover exists.
 */
const buttonLabel = computed(() => {
  if (busy.value) return t('bookDialog.coverBusy')
  return cover.value ? t('bookDialog.coverChange') : t('bookDialog.coverAdd')
})

/**
 * Reads an uploaded file and converts it into a cover data URL.
 */
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

/**
 * Handles file selection change events from the file input element.
 */
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
      <button type="button" class="btn secondary small" :disabled="busy" @click="inputEl?.click()">
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
