<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Book } from '@/interface/book'
import { categoryLabel } from '@/utils/category'

const props = defineProps<{
  book: Book
  defaultCover: string
  big: boolean
}>()

const emit = defineEmits<{
  toggleFavorite: []
  open: []
}>()

const { t, locale } = useI18n()

const dateLocale = computed(() => (locale.value === 'de' ? 'de-DE' : 'en-GB'))

const releaseLabel = computed(() =>
  props.book.releaseDate
    ? new Date(`${props.book.releaseDate}T00:00:00`).toLocaleDateString(dateLocale.value)
    : '',
)

const priceLabel = computed(() => {
  const price = Number(props.book.price)
  return Number.isFinite(price) && props.book.price !== ''
    ? price.toLocaleString(dateLocale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : props.book.price
})

const coverFailed = ref(false)
const coverSrc = computed(() =>
  coverFailed.value ? props.defaultCover : (props.book.cover ?? props.defaultCover),
)
</script>

<template>
  <section
    class="book-card"
    tabindex="0"
    role="button"
    :aria-label="t('book.open', { title: book.title })"
    @click="emit('open')"
    @keydown.enter="emit('open')"
  >
    <div class="book-info">
      <p class="title">{{ book.title }}</p>
      <p class="author">{{ book.author }}</p>

      <template v-if="big">
        <img
          class="cover"
          :src="coverSrc"
          :alt="t('book.coverAlt', { title: book.title })"
          @error="coverFailed = true"
        />
        <p class="category">
          {{ t('book.category') }}: <span>{{ categoryLabel(book.category, t) }}</span>
        </p>
        <p class="isbn">
          {{ t('book.isbn') }}: <span>{{ book.isbn }}</span>
        </p>
      </template>

      <p class="status">
        {{ t('book.status') }}: <span>{{ book.status ? t(`status.${book.status}`) : '' }}</span>
      </p>
      <template v-if="book.status === 'wish' && big">
        <p class="price">
          {{ t('book.price') }}: <span>{{ priceLabel }} €</span>
        </p>
        <p v-if="releaseLabel" class="release">
          {{ t('book.release') }}: <span>{{ releaseLabel }}</span>
        </p>
      </template>
    </div>

    <button
      type="button"
      class="favorite"
      :class="{ active: book.favorite }"
      :aria-pressed="book.favorite"
      :aria-label="book.favorite ? t('book.favoriteRemove') : t('book.favoriteAdd')"
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

.title {
  font-weight: 800;
  padding-right: 18px;
}

.status {
  color: #8b8d92;
  margin-top: 12px;
  font-weight: 600;
}

.price,
.release {
  color: #8b8d92;
  font-weight: 600;
  background-color: #ffffff;
  padding: 4px;
  border-radius: 4px;
}

.title,
.author,
.category,
.isbn,
.status {
  background-color: #ffffff;
  padding: 4px;
  border-radius: 4px;
  overflow-wrap: anywhere;
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
