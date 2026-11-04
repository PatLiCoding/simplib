<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import type { Book, BookStatus } from '@/interface/book'
import BookCard from '@/components/BookCard.vue'
import BookDialog from '@/components/BookDialog.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import SearchBar from '@/components/SearchBar.vue'
import { useBookDialog } from '@/composables/useBookDialog'
import { toStatus, useBookStore } from '@/stores/books'
import defaultCover from '@/assets/img/bookcover_default.png'

const { t } = useI18n()
const store = useBookStore()
const { books } = storeToRefs(store)
const route = useRoute()
const { isOpen, editId, openEdit, close } = useBookDialog()

const bigView = ref(true)
const selectedBook = computed(() => books.value.find((b) => b.id === editId.value) ?? null)

const statusFilter = ref<BookStatus | 'all'>(toStatus(String(route.query.status ?? '')) || 'all')
const availableOnly = ref(route.query.available === '1')
const favoritesOnly = ref(route.query.favorites === '1')
const categoryFilter = ref('all')
const searchQuery = ref('')
const filterOpen = ref(statusFilter.value !== 'all' || availableOnly.value || favoritesOnly.value)

const baseFiltered = computed(() =>
  books.value.filter(
    (book) =>
      (statusFilter.value === 'all' || book.status === statusFilter.value) &&
      (!favoritesOnly.value || book.favorite) &&
      (!availableOnly.value || store.isAvailable(book)) &&
      matchesSearch(book),
  ),
)

const categories = computed(() => {
  const unique = new Set(baseFiltered.value.map((book) => book.category.trim()).filter(Boolean))
  return [...unique].sort((a, b) => a.localeCompare(b))
})

const filteredBooks = computed(() =>
  categoryFilter.value === 'all'
    ? baseFiltered.value
    : baseFiltered.value.filter((book) => book.category.trim() === categoryFilter.value),
)

watch(categories, (list) => {
  if (categoryFilter.value !== 'all' && !list.includes(categoryFilter.value)) {
    categoryFilter.value = 'all'
  }
})

function resetFilter() {
  statusFilter.value = 'all'
  favoritesOnly.value = false
  availableOnly.value = false
  categoryFilter.value = 'all'
}

function matchesSearch(book: Book): boolean {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return true

  const isbnQuery = query.replace(/[-\s]/g, '')

  return (
    book.title.toLowerCase().includes(query) ||
    book.author.toLowerCase().includes(query) ||
    (isbnQuery !== '' && book.isbn.includes(isbnQuery))
  )
}

async function saveBook(book: Book) {
  await store.save(book)
  close()
}

function toggleView() {
  bigView.value = !bigView.value
}

async function deleteBook(id: string) {
  await store.remove(id)
  close()
}
</script>

<template>
  <section class="booklist-content">
    <div class="list-headline">
      <h2>{{ t('list.title') }}</h2>
      <p class="book-view" @click="toggleView">
        {{ t('list.view') }}: <span>{{ bigView ? t('list.viewBig') : t('list.viewSmall') }}</span>
      </p>
      <p
        class="filter"
        role="button"
        tabindex="0"
        :aria-expanded="filterOpen"
        @click="filterOpen = !filterOpen"
        @keydown.enter="filterOpen = !filterOpen"
      >
        {{ t('list.filter') }} <span class="arrow">{{ filterOpen ? '↑' : '↓' }}</span>
      </p>
    </div>

    <FilterPanel
      v-if="filterOpen"
      v-model:status="statusFilter"
      v-model:favorites="favoritesOnly"
      v-model:available="availableOnly"
      v-model:category="categoryFilter"
      :categories="categories"
      @reset="resetFilter"
    />

    <SearchBar v-model="searchQuery" />

    <div id="booklist" class="booklist">
      <BookCard
        v-for="book in filteredBooks"
        :key="book.id"
        :book="book"
        :default-cover="defaultCover"
        :big="bigView"
        @toggle-favorite="store.toggleFavorite(book.id)"
        @open="openEdit(book.id)"
      />
      <p v-if="!filteredBooks.length" class="empty">{{ t('list.empty') }}</p>
    </div>

    <BookDialog
      :open="isOpen"
      :book="selectedBook"
      :default-cover="defaultCover"
      @close="close"
      @save="saveBook"
      @delete="deleteBook"
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
