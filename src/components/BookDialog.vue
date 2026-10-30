<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Book } from '@/interface/book'

const props = defineProps<{
  open: boolean
  book: Book | null
  defaultCover: string
}>()

const emit = defineEmits<{
  close: []
  save: [book: Book]
}>()

const dialogEl = ref<HTMLDialogElement | null>(null)

const isbnError = ref('')
const priceError = ref('')

const emptyBook = (): Book => ({
  title: '',
  author: '',
  cover: null,
  category: '',
  price: '',
  isbn: '',
  status: '',
  favorite: false,
})

const form = ref<Book>(emptyBook())

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      isbnError.value = ''
      priceError.value = ''
      form.value = props.book
        ? { ...props.book, price: String(props.book.price ?? '') }
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

function validateIsbn(isbn: string): string {
  if (!isbn) return ''
  if (isbn.length !== 10 && isbn.length !== 13) {
    return 'An ISBN must have 10 or 13 characters.'
  }
  if (!/^(\d{13}|\d{9}[\dX])$/.test(isbn)) {
    return 'Invalid ISBN. "X" is only allowed as the last character of a 10-digit ISBN.'
  }
  return ''
}

function onIsbnInput(event: Event) {
  const input = event.target as HTMLInputElement
  const cleaned = input.value.replace(/[^0-9\-\sXx]/g, '').toUpperCase()
  const removedChars = cleaned.length !== input.value.length

  input.value = cleaned
  form.value.isbn = cleaned
  isbnError.value = removedChars ? 'Only digits, hyphens, spaces and "X" are allowed.' : ''
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

  priceError.value = cleaned !== input.value ? 'Please enter a valid price, e.g. 12.99' : ''
  input.value = cleaned
  form.value.price = cleaned
}

function validatePrice(price: string): string {
  if (!price) return ''
  if (!/^\d+([.,]\d{1,2})?$/.test(price)) return 'Please enter a valid price, e.g. 12.99'
  return ''
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
    price: form.value.price.replace(',', '.'),
  })
}
</script>

<template>
  <dialog ref="dialogEl" class="book-dialog" @close="emit('close')" @click="onBackdropClick">
    <form class="dialog-form" @submit.prevent="onSubmit">
      <div class="dialog-head">
        <h2>{{ book ? 'Book details' : 'New book' }}</h2>
        <button
          type="button"
          class="favorite"
          :class="{ active: form.favorite }"
          :aria-pressed="form.favorite"
          :aria-label="form.favorite ? 'Remove favorite' : 'Mark as favorite'"
          @click="form.favorite = !form.favorite"
        >
          ★
        </button>
      </div>

      <img
        v-if="book"
        class="cover"
        :src="form.cover ?? defaultCover"
        :alt="`Cover von ${form.title}`"
      />

      <label>
        Title
        <input v-model.trim="form.title" type="text" maxlength="150" required />
      </label>

      <label>
        Author
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
        ISBN
        <input
          :value="form.isbn"
          type="text"
          maxlength="17"
          placeholder="e.g. 978-3-16-148410-0"
          :class="{ invalid: isbnError }"
          :aria-invalid="!!isbnError"
          aria-describedby="isbn-error"
          @input="onIsbnInput"
          @blur="onIsbnBlur"
        />
        <span v-if="isbnError" id="isbn-error" class="error" role="alert">
          {{ isbnError }}
        </span>
      </label>

      <label>
        Status
        <select id="status" v-model="form.status" required>
          <option value="" disabled>Please select</option>
          <option value="finish">Finish</option>
          <option value="unread">Unread</option>
          <option value="wish">Wish</option>
        </select>
      </label>

      <label v-show="form.status === 'wish'">
        Price
        <input
          :value="form.price"
          type="text"
          inputmode="decimal"
          maxlength="9"
          placeholder="e.g. 12.99"
          :class="{ invalid: priceError }"
          :aria-invalid="!!priceError"
          aria-describedby="price-error"
          @input="onPriceInput"
        />
        <span v-if="priceError" id="price-error" class="error" role="alert">
          {{ priceError }}
        </span>
      </label>

      <div class="actions">
        <button type="button" class="btn secondary" @click="emit('close')">Cancel</button>
        <button type="submit" class="btn primary">Save</button>
      </div>
    </form>
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
