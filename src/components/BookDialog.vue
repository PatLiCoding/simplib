<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Book } from '@/interface/book'
import { useIsbnLookup } from '@/composables/useIsbnLookup'
import IsbnScanner from '@/components/IsbnScanner.vue'
import { fetchCover, imageToCoverDataUrl } from '@/utils/cover'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { categoryKeys, categoryLabel, toCategoryValue } from '@/utils/category'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  book: Book | null
  defaultCover: string
}>()

const emit = defineEmits<{
  close: []
  save: [book: Book]
  delete: [id: string]
}>()

const { loading: lookupLoading, error: lookupError, lookup, reset: resetLookup } = useIsbnLookup()

const dialogEl = ref<HTMLDialogElement | null>(null)
const confirmOpen = ref(false)

const isbnError = ref('')
const priceError = ref('')
const scanning = ref(false)
const coverInput = ref<HTMLInputElement | null>(null)
const coverBusy = ref(false)
const coverError = ref('')

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

function confirmDelete() {
  confirmOpen.value = false
  emit('delete', form.value.id)
}

const form = ref<Book>(emptyBook())

watch(
  () => props.open,
  (isOpen) => {
    scanning.value = false
    confirmOpen.value = false

    if (isOpen) {
      isbnError.value = ''
      priceError.value = ''
      resetLookup()
      form.value = props.book
        ? {
            ...props.book,
            price: String(props.book.price ?? ''),
            category: categoryLabel(props.book.category, t),
          }
        : emptyBook()
      dialogEl.value?.showModal()
    } else if (dialogEl.value?.open) {
      dialogEl.value.close()
    }
  },
)

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogEl.value) emit('close')
}

async function onCoverPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const target = form.value
  coverBusy.value = true
  coverError.value = ''

  try {
    target.cover = await imageToCoverDataUrl(file)
  } catch {
    coverError.value = t('bookDialog.coverError')
  } finally {
    coverBusy.value = false
  }
}

function validateIsbn(isbn: string): string {
  if (!isbn) return ''
  if (isbn.length !== 10 && isbn.length !== 13) return t('bookDialog.errors.isbnLength')
  if (!/^(\d{13}|\d{9}[\dX])$/.test(isbn)) return t('bookDialog.errors.isbnInvalid')
  return ''
}

function onIsbnInput(event: Event) {
  const input = event.target as HTMLInputElement
  const cleaned = input.value.replace(/[^0-9\-\sXx]/g, '').toUpperCase()
  const removedChars = cleaned.length !== input.value.length

  input.value = cleaned
  form.value.isbn = cleaned
  isbnError.value = removedChars ? t('bookDialog.errors.isbnChars') : ''
}

function onIsbnBlur() {
  isbnError.value = validateIsbn(form.value.isbn.replace(/[-\s]/g, ''))
}

function onPriceInput(event: Event) {
  const input = event.target as HTMLInputElement
  const cleaned = input.value
    .replace(/[^0-9.,]/g, '')
    .replace(/^([^.,]*[.,][^.,]*).*$/, '$1')
    .replace(/([.,]\d{2})\d+$/, '$1')

  priceError.value = cleaned !== input.value ? t('bookDialog.errors.price') : ''
  input.value = cleaned
  form.value.price = cleaned
}

function validatePrice(price: string): string {
  if (!price) return ''
  if (!/^\d+([.,]\d{1,2})?$/.test(price)) return t('bookDialog.errors.price')
  return ''
}

async function onLookup() {
  const isbn = form.value.isbn.replace(/[-\s]/g, '')

  if (!isbn) {
    isbnError.value = isbnError.value = t('bookDialog.errors.isbnEmpty')
    return
  }
  isbnError.value = validateIsbn(isbn)
  if (isbnError.value) return

  const result = await lookup(isbn)
  if (!result) return

  const target = form.value
  target.title = result.title
  target.author = result.author
  target.cover = await fetchCover(isbn, result.cover)
}

async function onScanned(isbn: string) {
  scanning.value = false
  form.value.isbn = isbn
  isbnError.value = ''
  await onLookup()
}

function onSubmit() {
  const isbn = form.value.isbn.replace(/[-\s]/g, '')
  isbnError.value = validateIsbn(isbn)

  const isWish = form.value.status === 'wish'
  priceError.value = isWish ? validatePrice(form.value.price) : ''

  if (isbnError.value || priceError.value) return

  emit('save', {
    ...form.value,
    isbn,
    category: toCategoryValue(form.value.category),
    price: form.value.price.replace(',', '.'),
  })
}
</script>

<template>
  <dialog ref="dialogEl" class="book-dialog" @close="emit('close')" @click="onBackdropClick">
    <form class="dialog-form" @submit.prevent="onSubmit">
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

      <div class="cover-box">
        <img
          v-if="book || form.cover"
          class="cover"
          :src="form.cover ?? defaultCover"
          :alt="t('book.coverAlt', { title: form.title })"
        />

        <div class="cover-actions">
          <button
            type="button"
            class="btn secondary small"
            :disabled="coverBusy"
            @click="coverInput?.click()"
          >
            {{
              coverBusy
                ? t('bookDialog.coverBusy')
                : form.cover
                  ? t('bookDialog.coverChange')
                  : t('bookDialog.coverAdd')
            }}
          </button>
          <button
            v-if="form.cover"
            type="button"
            class="btn secondary small"
            @click="form.cover = null"
          >
            {{ t('bookDialog.coverRemove') }}
          </button>
        </div>
        <span v-if="coverError" class="error" role="alert">{{ coverError }}</span>

        <input ref="coverInput" type="file" accept="image/*" hidden @change="onCoverPicked" />
      </div>

      <label>
        {{ t('bookDialog.title') }}
        <input v-model.trim="form.title" type="text" maxlength="150" required />
      </label>

      <label>
        {{ t('bookDialog.author') }}
        <input v-model.trim="form.author" type="text" maxlength="80" required />
      </label>

      <label>
        Category
        <input
          v-model.trim="form.category"
          type="text"
          maxlength="30"
          list="category-suggestions"
          placeholder="e.g. Fantasy, Thriller, Non-Fiction..."
        />

        <datalist id="category-suggestions">
          <!-- Fiction -->
          <option value="Fantasy" />
          <option value="Science Fiction" />
          <option value="Thriller & Crime" />
          <option value="Romance" />
          <option value="Historical Fiction" />
          <option value="Horror & Mystery" />
          <option value="Literary Fiction" />

          <!-- Non-Fiction & Reference -->
          <option value="Non-Fiction" />
          <option value="Biography & Memoir" />
          <option value="Self-Help & Lifestyle" />
          <option value="History" />
          <option value="Computer Science & Tech" />
          <option value="Business & Economics" />

          <!-- Children & Young Adult -->
          <option value="Children's Books" />
          <option value="Young Adult" />

          <!-- Graphic Formats -->
          <option value="Comics & Graphic Novels" />
        </datalist>
      </label>

      <label>
        {{ t('bookDialog.isbn') }}
        <div class="isbn-row">
          <input
            :value="form.isbn"
            type="text"
            maxlength="17"
            :placeholder="t('bookDialog.isbnPlaceholder')"
            :class="{ invalid: isbnError }"
            :aria-invalid="!!isbnError"
            aria-describedby="isbn-error lookup-error"
            @input="onIsbnInput"
            @blur="onIsbnBlur"
          />
          <button
            type="button"
            class="btn secondary lookup"
            :disabled="lookupLoading"
            @click="onLookup"
          >
            {{ lookupLoading ? t('bookDialog.lookupBusy') : t('bookDialog.lookup') }}
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
        <span v-if="isbnError" id="isbn-error" class="error" role="alert">{{ isbnError }}</span>
        <span v-if="lookupError" id="lookup-error" class="error" role="alert">{{
          lookupError
        }}</span>
      </label>
      <IsbnScanner v-if="scanning" @detected="onScanned" @close="scanning = false" />

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
.book-dialog {
  width: min(420px, calc(100% - 32px));
  padding: 0;
  margin: auto;
  border: 1px solid #c7c7c9;
  border-radius: 10px;
  background-color: #f3f2f1;
  color: #2b2c2f;
  box-shadow: 0 4px 16px #00000040;
}

.book-dialog::backdrop {
  background: #00000070;
}

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
  padding: 0;
  border: none;
  background: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: #8b8d92;
  position: absolute;
  top: 0;
  right: 0;
}

.favorite.active {
  color: #b23a3a;
}

.cover {
  width: 100%;
  max-height: 160px;
  object-fit: contain;
  border-radius: 6px;
}

.cover-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 600;
  font-size: 14px;
  color: #8b8d92;
}

input {
  padding: 8px;
  border: 1px solid #c7c7c9;
  border-radius: 4px;
  font-size: 16px;
  background: #ffffff;
  color: #2b2c2f;
}

input:focus {
  outline: 2px solid #b23a3a;
  outline-offset: 0;
}

input.invalid {
  border-color: #b23a3a;
}

.error {
  font-size: 13px;
  font-weight: 500;
  color: #b23a3a;
}

input,
select {
  padding: 8px;
  border: 1px solid #c7c7c9;
  border-radius: 4px;
  font-size: 16px;
  background: #ffffff;
  color: #2b2c2f;
}

input:focus,
select:focus {
  outline: 2px solid #b23a3a;
  outline-offset: 0;
}

select,
select::picker(select) {
  appearance: base-select;
}

select {
  padding: 8px;
  border: 1px solid #c7c7c9;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  background: #ffffff;
  color: #2b2c2f;
  cursor: pointer;
}

select::picker(select) {
  border: 1px solid #8b8d92;
  border-radius: 4px;
  background: #ffffff;
  padding: 4px;
}

option {
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
}

option:hover {
  background: #f3f2f1;
}

option:checked {
  background: #b23a3a;
  color: #f3f2f1;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
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
  height: 20px;
  object-fit: contain;
}

.lookup {
  padding: 8px 12px;
  white-space: nowrap;
}

.lookup:disabled {
  opacity: 0.6;
  cursor: wait;
}

.btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #b23a3a;
  font-size: 16px;
  cursor: pointer;
}

.delete {
  margin-right: auto;
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
