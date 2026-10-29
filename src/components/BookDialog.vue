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

function onSubmit() {
  emit('save', { ...form.value })
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
        <input v-model.trim="form.title" type="text" required />
      </label>

      <label>
        Author
        <input v-model.trim="form.author" type="text" required />
      </label>

      <label>
        Category
        <input v-model.trim="form.category" type="text" />
      </label>

      <label>
        ISBN
        <input v-model.trim="form.isbn" type="text" />
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
        <input v-model="form.price" type="text" inputmode="decimal" />
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
