<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '@/interface/book'

const props = defineProps<{
  book: Book
  defaultCover: string
  big: boolean
}>()

const emit = defineEmits<{
  toggleFavorite: []
  open: []
}>()

const coverSrc = computed(() => props.book.cover ?? props.defaultCover)
</script>

<template>
  <section
    class="book-card"
    tabindex="0"
    role="button"
    :aria-label="`Open details for ${book.title}`"
    @click="emit('open')"
    @keydown.enter="emit('open')"
  >
    <div class="book-info">
      <p class="title">{{ book.title }}</p>
      <p class="author">{{ book.author }}</p>

      <template v-if="big">
        <img class="cover" :src="coverSrc" :alt="`Cover from ${book.title}`" />
        <p class="category">
          Category: <span>{{ book.category }}</span>
        </p>
        <p class="isbn">
          ISBN: <span>{{ book.isbn }}</span>
        </p>
      </template>

      <p class="status">
        Status: <span>{{ book.status }}</span>
      </p>
      <template v-if="book.status === 'wish' && big">
        <p class="price">
          Price: <span>{{ book.price }} €</span>
        </p>
      </template>
    </div>

    <button
      type="button"
      class="favorite"
      :class="{ active: book.favorite }"
      :aria-pressed="book.favorite"
      :aria-label="book.favorite ? 'Remove favorite' : 'Mark as favorite'"
      @click.stop="emit('toggleFavorite')"
    >
      ★
    </button>
  </section>
</template>

<style scoped>
.book-card {
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  width: 240px;
  min-width: 0;
  border: 1px solid #c7c7c9;
  border-radius: 10px;
  background-color: #f3f2f1;
  box-shadow: 0 1px 4px #c7c7c9;
  position: relative;
  cursor: pointer;
}

.cover {
  width: 100%;
  max-height: 120px;
  object-fit: contain;
  border-radius: 6px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.book-info {
  display: flex;
  flex-direction: column;
  font-size: 18px;
}

.title,
.author,
.category,
.isbn,
.status {
  background-color: #ffffff;
  padding: 4px;
  border-radius: 4px;
}

.title {
  font-weight: 800;
  padding-right: 18px;
}

.status {
  color: #8b8d92;
  margin-top: 12px;
  font-weight: 600;
}

.price {
  color: #8b8d92;
  font-weight: 600;
  background-color: #ffffff;
  padding: 4px;
  border-radius: 4px;
}

.favorite {
  position: absolute;
  top: 16px;
  right: 10px;
  padding: 0;
  border: none;
  background: none;
  font-size: 24px;
  line-height: 1;
  color: inherit;
  cursor: pointer;
  color: #8b8d92;
}

.favorite.active {
  color: #b23a3a;
}
</style>
