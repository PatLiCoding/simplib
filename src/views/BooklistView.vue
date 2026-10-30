<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import data from '@/assets/data/example.json'
import type { Book, BookStatus } from '@/interface/book'
import BookCard from '@/components/BookCard.vue'
import BookDialog from '@/components/BookDialog.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { useBookDialog } from '@/composables/useBookDialog'
import defaultCover from '@/assets/img/bookcover_default.png'

const statuses: BookStatus[] = ['finish', 'unread', 'wish']
const books = ref<Book[]>(data.books.map((book) => ({ ...book, status: toStatus(book.status) })))
const bigView = ref(true)
const selectedBook = computed(() =>
  editIndex.value === null ? null : (books.value[editIndex.value] ?? null),
)

const { isOpen, editIndex, openEdit, close } = useBookDialog()

const filterOpen = ref(false)
const statusFilter = ref<BookStatus | 'all'>('all')
const favoritesOnly = ref(false)
const categoryFilter = ref('all')

const baseFiltered = computed(() =>
  books.value
    .map((book, index) => ({ book, index }))
    .filter(
      ({ book }) =>
        (statusFilter.value === 'all' || book.status === statusFilter.value) &&
        (!favoritesOnly.value || book.favorite),
    ),
)

const categories = computed(() => {
  const unique = new Set(baseFiltered.value.map(({ book }) => book.category.trim()).filter(Boolean))
  return [...unique].sort((a, b) => a.localeCompare(b))
})

const filteredBooks = computed(() =>
  categoryFilter.value === 'all'
    ? baseFiltered.value
    : baseFiltered.value.filter(({ book }) => book.category.trim() === categoryFilter.value),
)

watch(categories, (list) => {
  if (categoryFilter.value !== 'all' && !list.includes(categoryFilter.value)) {
    categoryFilter.value = 'all'
  }
})

function resetFilter() {
  statusFilter.value = 'all'
  favoritesOnly.value = false
  categoryFilter.value = 'all'
}

function toStatus(value: string): BookStatus | '' {
  return statuses.includes(value as BookStatus) ? (value as BookStatus) : ''
}

function saveBook(book: Book) {
  if (editIndex.value === null) {
    books.value.push(book)
  } else {
    books.value[editIndex.value] = book
  }
  close()
}

function toggleView() {
  bigView.value = !bigView.value
}

function toggleFavorite(index: number) {
  const book = books.value[index]
  if (book) book.favorite = !book.favorite
}
</script>

<template>
  <section class="booklist-content">
    <div class="list-headline">
      <h2>My Lib</h2>
      <p class="book-view" @click="toggleView">
        View: <span>{{ bigView ? 'Big' : 'Small' }}</span>
      </p>
      <p
        class="filter"
        role="button"
        tabindex="0"
        :aria-expanded="filterOpen"
        @click="filterOpen = !filterOpen"
        @keydown.enter="filterOpen = !filterOpen"
      >
        Filter <span class="arrow">{{ filterOpen ? '↑' : '↓' }}</span>
      </p>
    </div>

    <FilterPanel
      v-if="filterOpen"
      v-model:status="statusFilter"
      v-model:favorites="favoritesOnly"
      v-model:category="categoryFilter"
      :categories="categories"
      @reset="resetFilter"
    />

    <div id="booklist" class="booklist">
      <BookCard
        v-for="{ book, index } in filteredBooks"
        :key="`${book.isbn}-${index}`"
        :book="book"
        :default-cover="defaultCover"
        :big="bigView"
        @toggle-favorite="toggleFavorite(index)"
        @open="openEdit(index)"
      />
      <p v-if="!filteredBooks.length" class="empty">No books match this filter.</p>
    </div>

    <BookDialog
      :open="isOpen"
      :book="selectedBook"
      :default-cover="defaultCover"
      @close="close"
      @save="saveBook"
    />
  </section>
</template>

<style scoped>
.booklist-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
  padding: 24px;
}
.list-headline {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  border-bottom: 1px solid #8b8d9240;
}

h2 {
  font-size: 42px;
  color: #8b8d92;
}

.filter,
.book-view,
.book-view span {
  font-size: 24px;
  color: #8b8d92;

  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
}

.arrow {
  display: inline-block;
  vertical-align: baseline;
  transform: translateY(-3px);
}

.booklist {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px;
}

@media (max-width: 768px) {
  .list-headline {
    flex-wrap: wrap;
    gap: 8px;
  }

  h2 {
    flex: 1 1 100%;
  }

  .filter,
  .book-view {
    flex: 1 1 calc(50% - 5px);
  }

  .filter {
    display: flex;
    justify-content: flex-end;
  }
}

.empty {
  padding: 24px;
  color: #8b8d92;
}
</style>
