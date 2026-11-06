<script setup lang="ts">
/**
 * @file IsbnField.vue
 * @description Provides an ISBN input field with inline validation, lookup request triggers,
 * and integrated barcode scanner modal toggling.
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import IsbnScanner from '@/components/dialogs/IsbnScanner.vue'
import { cleanIsbnInput, isbnErrorKey, stripIsbn } from '@/utils/isbn'

/**
 * Component props definition.
 */
defineProps<{
  /** Indicates whether an external lookup operation is currently in progress */
  loading: boolean
  /** Error message string returned from lookup attempts */
  lookupError: string
}>()

/** Two-way model binding for the ISBN input string value */
const isbn = defineModel<string>({ required: true })

/**
 * Component emitted events.
 */
const emit = defineEmits<{
  /** Emitted when requesting an ISBN metadata lookup */
  lookup: []
}>()

const { t } = useI18n()
/** Stores active validation error key */
const error = ref('')
/** Tracks whether the barcode scanner interface is open */
const scanning = ref(false)

/**
 * Sets or clears the localized error message based on an error code key.
 */
function setError(key: string) {
  error.value = key ? t(`bookDialog.errors.${key}`) : ''
}

/**
 * Cleans user input characters, updates value bindings, and validates formatting constraints.
 */
function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const cleaned = cleanIsbnInput(input.value)
  const removed = cleaned.length !== input.value.length

  input.value = cleaned
  isbn.value = cleaned
  setError(removed ? 'isbnChars' : '')
}

/**
 * Validates the ISBN string, displaying errors and returning whether the value is usable.
 */
function validate(): boolean {
  setError(isbnErrorKey(stripIsbn(isbn.value)))
  return !error.value
}

/**
 * Triggers an ISBN lookup if the value is non-empty and passes local validation checks.
 */
function requestLookup() {
  if (!stripIsbn(isbn.value)) setError('isbnEmpty')
  else if (validate()) emit('lookup')
}

/**
 * Handles barcode data detected by the scanner, closing the scanner and triggering a lookup.
 */
function onScanned(code: string) {
  scanning.value = false
  isbn.value = code
  error.value = ''
  emit('lookup')
}

defineExpose({ validate })
</script>

<template>
  <div class="isbn-field">
    <label>
      {{ t('bookDialog.isbn') }}
      <div class="isbn-row">
        <input
          :value="isbn"
          type="text"
          maxlength="17"
          :placeholder="t('bookDialog.isbnPlaceholder')"
          :class="{ invalid: error }"
          :aria-invalid="!!error"
          aria-describedby="isbn-error lookup-error"
          @input="onInput"
          @blur="validate"
          @keydown.enter.prevent="requestLookup"
        />
        <button
          type="button"
          class="btn secondary lookup"
          :disabled="loading"
          @click="requestLookup"
        >
          {{ loading ? t('bookDialog.lookupBusy') : t('bookDialog.lookup') }}
        </button>
        <button
          type="button"
          class="btn secondary lookup"
          :aria-label="t('bookDialog.scan')"
          @click="scanning = !scanning"
        >
          <img src="@/assets/icon/barcode_scanner.png" :alt="t('bookDialog.scanAlt')" />
        </button>
      </div>
      <span v-if="error" id="isbn-error" class="error" role="alert">{{ error }}</span>
      <span v-if="lookupError" id="lookup-error" class="error" role="alert">{{ lookupError }}</span>
    </label>

    <IsbnScanner v-if="scanning" @detected="onScanned" @close="scanning = false" />
  </div>
</template>

<style scoped>
.isbn-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.isbn-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.isbn-row input {
  flex: 1;
  min-width: 0;
}

.isbn-row img {
  height: 18px;
  object-fit: contain;
  cursor: pointer;
}

.lookup {
  padding: 0 8px;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lookup:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
