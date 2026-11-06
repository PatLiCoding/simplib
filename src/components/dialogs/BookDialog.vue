<script setup lang="ts">
/**
 * @file BookDialog.vue
 * @description Manages the creation, editing, and deletion of a book entry within a modal dialog.
 * Handles ISBN lookup, price formatting validation, cover fetching, and form state synchronization.
 */

import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Book } from '@/types/book'
import { useIsbnLookup } from '@/composables/useIsbnLookup'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue'
import CoverPicker from '@/components/dialogs/CoverPicker.vue'
import IsbnField from '@/components/dialogs/IsbnField.vue'
import { fetchCover } from '@/utils/cover'
import { categoryKeys, categoryLabel, toCategoryValue } from '@/utils/category'
import { stripIsbn } from '@/utils/isbn'
import { cleanPrice, isValidPrice, normalizePrice } from '@/utils/price'

const { t } = useI18n()

/**
 * Component props definition.
 */
const props = defineProps<{
  /** Determines whether the dialog is open */
  open: boolean
  /** The book object to edit, or null if creating a new book */
  book: Book | null
  /** Default cover image source fallback */
  defaultCover: string
}>()

/**
 * Component emitted events.
 */
const emit = defineEmits<{
  /** Emitted when the dialog is requested to close */
  close: []
  /** Emitted with the saved book data upon successful form submission */
  save: [book: Book]
  /** Emitted with the book ID when the user confirms deletion */
  delete: [id: string]
}>()

const { loading: lookupLoading, error: lookupError, lookup, reset: resetLookup } = useIsbnLookup()

/** Reference to the native HTML dialog element */
const dialogEl = ref<HTMLDialogElement | null>(null)
/** Reference to the ISBN field child component */
const isbnField = ref<InstanceType<typeof IsbnField> | null>(null)
/** Tracks whether the delete confirmation dialog is visible */
const confirmOpen = ref(false)
/** Stores current price validation error message */
const priceError = ref('')

/**
 * Creates and returns a fresh, empty book object with default values.
 */
const emptyBook = (): Book => ({
  id: crypto.randomUUID(),
  createdAt: Date.now(),
  title: '',
  author: '',
  cover: null,
  category: '',
  price: '',
  releaseDate: '',
  isbn: '',
  status: '',
  favorite: false,
})

/** Form model containing the current book details being edited */
const form = ref<Book>(emptyBook())

/**
 * Maps an existing book entity to a localized form structure, or returns an empty book.
 */
function formFromBook(book: Book | null): Book {
  if (!book) return emptyBook()
  return { ...book, price: String(book.price ?? ''), category: categoryLabel(book.category, t) }
}

/**
 * Resets form error states, clears lookups, populates the form from props, and opens the modal.
 */
function openDialog() {
  priceError.value = ''
  resetLookup()
  form.value = formFromBook(props.book)
  dialogEl.value?.showModal()
}

/**
 * Watches the open prop to synchronize modal visibility state.
 */
watch(
  () => props.open,
  (isOpen) => {
    confirmOpen.value = false
    if (isOpen) openDialog()
    else if (dialogEl.value?.open) dialogEl.value.close()
  },
)

/**
 * Closes the dialog if the user clicks directly on the backdrop element.
 */
function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogEl.value) emit('close')
}

/**
 * Confirms deletion and emits the delete event with the current book ID.
 */
function confirmDelete() {
  confirmOpen.value = false
  emit('delete', form.value.id)
}

/**
 * Handles input on the price field, cleaning invalid characters and evaluating validation rules.
 */
function onPriceInput(event: Event) {
  const input = event.target as HTMLInputElement
  const cleaned = cleanPrice(input.value)

  priceError.value = cleaned !== input.value ? t('bookDialog.errors.price') : ''
  input.value = cleaned
  form.value.price = cleaned
}

/**
 * Performs an automatic ISBN lookup to fetch metadata and book cover images.
 */
async function onLookup() {
  const isbn = stripIsbn(form.value.isbn)
  const result = await lookup(isbn)
  if (!result) return

  const target = form.value
  target.title = result.title || target.title
  target.author = result.author || target.author
  target.cover = (await fetchCover(isbn, result.cover)) ?? target.cover
}

/**
 * Validates the entire form including ISBN fields and price constraints.
 */
function validateForm(): boolean {
  const isbnOk = isbnField.value?.validate() ?? true
  const invalidPrice = form.value.status === 'wish' && !isValidPrice(form.value.price)

  priceError.value = invalidPrice ? t('bookDialog.errors.price') : ''
  return isbnOk && !invalidPrice
}

/**
 * Submits the form data after successful validation, formatting fields appropriately.
 */
function onSubmit() {
  if (!validateForm()) return

  emit('save', {
    ...form.value,
    isbn: stripIsbn(form.value.isbn),
    category: toCategoryValue(form.value.category),
    price: normalizePrice(form.value.price),
  })
}
</script>

<template>
  <dialog ref="dialogEl" class="app-dialog" @close="emit('close')" @click="onBackdropClick">
    <form v-if="open" class="dialog-form" @submit.prevent="onSubmit">
      <div class="dialog-head">
        <h2>{{ book ? t('bookDialog.titleDetails') : t('bookDialog.titleNew') }}</h2>
        <button
          type="button"
          class="favorite"
          :class="{ active: form.favorite }"
          :aria-pressed="form.favorite"
          :aria-label="form.favorite ? t('book.favoriteRemove') : t('book.favoriteAdd')"
          @click="form.favorite = !form.favorite"
        >
          ★
        </button>
      </div>

      <CoverPicker
        v-model="form.cover"
        :title="form.title"
        :default-cover="defaultCover"
        :show-preview="!!book"
      />

      <label>
        {{ t('bookDialog.title') }}
        <input v-model.trim="form.title" type="text" maxlength="150" required />
      </label>

      <label>
        {{ t('bookDialog.author') }}
        <input v-model.trim="form.author" type="text" maxlength="80" required />
      </label>

      <label>
        {{ t('bookDialog.category') }}
        <input
          v-model.trim="form.category"
          type="text"
          maxlength="30"
          list="category-suggestions"
          :placeholder="t('bookDialog.categoryPlaceholder')"
        />

        <datalist id="category-suggestions">
          <option v-for="key in categoryKeys" :key="key" :value="categoryLabel(key, t)" />
        </datalist>
      </label>

      <IsbnField
        ref="isbnField"
        v-model="form.isbn"
        :loading="lookupLoading"
        :lookup-error="lookupError"
        @lookup="onLookup"
      />

      <label>
        {{ t('bookDialog.status') }}
        <select id="status" v-model="form.status" required>
          <option value="" disabled>{{ t('bookDialog.statusPlaceholder') }}</option>
          <option value="finish">{{ t('status.finish') }}</option>
          <option value="unread">{{ t('status.unread') }}</option>
          <option value="wish">{{ t('status.wish') }}</option>
        </select>
      </label>

      <label v-show="form.status === 'wish'">
        {{ t('bookDialog.price') }}
        <input
          :value="form.price"
          type="text"
          inputmode="decimal"
          maxlength="9"
          :placeholder="t('bookDialog.pricePlaceholder')"
          :class="{ invalid: priceError }"
          :aria-invalid="!!priceError"
          aria-describedby="price-error"
          @input="onPriceInput"
        />
        <span v-if="priceError" id="price-error" class="error" role="alert">
          {{ priceError }}
        </span>
      </label>

      <label v-show="form.status === 'wish'">
        {{ t('bookDialog.release') }}
        <input v-model="form.releaseDate" type="date" />
      </label>

      <div class="actions">
        <button v-if="book" type="button" class="btn secondary delete" @click="confirmOpen = true">
          {{ t('bookDialog.delete') }}
        </button>
        <button type="button" class="btn secondary" @click="emit('close')">
          {{ t('bookDialog.cancel') }}
        </button>
        <button type="submit" class="btn primary">{{ t('bookDialog.save') }}</button>
      </div>
    </form>

    <ConfirmDialog
      :open="confirmOpen"
      :title="t('bookDialog.deleteTitle')"
      :message="t('bookDialog.deleteMessage', { title: form.title })"
      :confirm-label="t('bookDialog.delete')"
      @confirm="confirmDelete"
      @close="confirmOpen = false"
    />
  </dialog>
</template>

<style scoped>
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
}

.dialog-head {
  position: relative;
}

h2 {
  margin: 0 0 4px;
  color: #b23a3a;
}

.favorite {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0;
  border: none;
  background: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: #8b8d92;
}

.favorite.active {
  color: #b23a3a;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.delete {
  margin-right: auto;
}
</style>
