<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import type { Book, BookStatus } from '@/interface/book'
import BookCard from '@/components/booklist/BookCard.vue'
import BookDialog from '@/components/dialogs/BookDialog.vue'
import FilterPanel from '@/components/booklist/FilterPanel.vue'
import SearchBar from '@/components/booklist/SearchBar.vue'
import { useBookDialog } from '@/composables/useBookDialog'
import { toStatus, useBookStore } from '@/stores/books'
import defaultCover from '@/assets/img/bookcover_default.png'
import { categoryLabel } from '@/utils/category'

const { t, locale } = useI18n()
const store = useBookStore()
const { books } = storeToRefs(store)
const route = useRoute()
const { isOpen, editId, openEdit, close } = useBookDialog()
const { openNew } = useBookDialog()

const bigView = ref(true)
const selectedBook = computed(() => books.value.find((b) => b.id === editId.value) ?? null)

const statusFilter = ref<BookStatus | 'all'>(toStatus(String(route.query.status ?? '')) || 'all')
const availableOnly = ref(route.query.available === '1')
const favoritesOnly = ref(route.query.favorites === '1')
const categoryFilter = ref('all')
const searchQuery = ref('')
const filterOpen = ref(statusFilter.value !== 'all' || availableOnly.value || favoritesOnly.value)

const PAGE_SIZE_BIG = 24
const PAGE_SIZE_SMALL = 60
const pageSize = computed(() => (bigView.value ? PAGE_SIZE_BIG : PAGE_SIZE_SMALL))
const visibleCount = ref(pageSize.value)

const visibleBooks = computed(() => filteredBooks.value.slice(0, visibleCount.value))
const hasMore = computed(() => filteredBooks.value.length > visibleCount.value)

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
  return [...unique].sort((a, b) =>
    categoryLabel(a, t).localeCompare(categoryLabel(b, t), locale.value),
  )
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

function showMore() {
  visibleCount.value += pageSize.value
}

watch([statusFilter, availableOnly, favoritesOnly, categoryFilter, searchQuery, bigView], () => {
  visibleCount.value = pageSize.value
})
</script>

<template>
  <section class="booklist-content">
    <div class="list-headline">
      <h2>{{ t('list.title') }}</h2>
      <p class="book-view" @click="toggleView">
        {{ t('list.view') }}: <span>{{ bigView ? t('list.viewBig') : t('list.viewSmall') }}</span>
      </p>
      <button
        v-if="route.name === 'booklist'"
        type="button"
        class="addBtn"
        :aria-label="t('header.addBook')"
        @click="openNew"
      >
        +
      </button>
    </div>

    <div class="search-filter-wrapper">
      <div class="search-filter-bar">
        <SearchBar v-model="searchQuery" />
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
    </div>

    <div id="booklist" class="booklist">
      <BookCard
        v-for="book in visibleBooks"
        :key="book.id"
        :book="book"
        :default-cover="defaultCover"
        :big="bigView"
        @toggle-favorite="store.toggleFavorite(book.id)"
        @open="openEdit(book.id)"
      />
      <p v-if="!filteredBooks.length" class="empty">{{ t('list.empty') }}</p>
    </div>

    <div v-if="filteredBooks.length" class="list-footer">
      <p class="count" role="status">
        {{ t('list.shown', { shown: visibleBooks.length, total: filteredBooks.length }) }}
      </p>
      <button v-if="hasMore" type="button" class="more" @click="showMore">
        {{ t('list.showMore') }}
      </button>
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
  border-bottom: 1px solid #8b8d9280;
}

h2 {
  font-size: 42px;
  color: #8b8d92;
}

.addBtn {
  margin: 4px;
  padding: 0 8px;
  border-radius: 50px;
  background-color: #f3f2f1;
  font-size: 26px;
  border: 1px solid #2b2c2f;
  color: #2b2c2f;

  &:hover {
    color: #b23a3a;
    border: 1px solid #b23a3a;
    cursor: pointer;
  }
}

.search-filter-wrapper {
  display: flex;
  flex-direction: column;
}

.search-filter-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  padding-top: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #8b8d9240;
}

.filter {
  white-space: nowrap;
  user-select: none;
  display: flex;
  align-items: flex-start;
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
  transform: translateY(-4px);
}

.booklist {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px;
}

.empty {
  padding: 24px;
  color: #8b8d92;
}

.list-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 24px;
}

.count {
  color: #8b8d92;
}

.more {
  padding: 8px 32px;
  border: 1px solid #b23a3a;
  border-radius: 20px;
  background: transparent;
  color: #b23a3a;
  font-size: 18px;
  cursor: pointer;

  &:hover {
    background: #b23a3a20;
  }

  &:focus-visible {
    outline: 2px solid #b23a3a;
    outline-offset: 2px;
  }
}

@media (max-width: 768px) {
  .list-headline {
    flex-wrap: wrap;
    gap: 8px;
  }

  h2 {
    flex: 1 1 100%;
    font-size: 38px;
  }

  .addBtn {
    font-size: 24px;
  }

  .search-filter-bar {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 0;
    border-bottom: 1px solid #8b8d9240;
  }
}
</style>
