<script setup lang="ts">
/**
 * @file FilterPanel.vue
 * @description Provides a filtering interface for book collections, enabling status chips,
 * availability toggling, favorites filtering, and category selection.
 */

import type { BookStatus } from '@/types/book'
import { useI18n } from 'vue-i18n'
import { categoryLabel } from '@/utils/category'

const { t } = useI18n()

/**
 * Component props definition.
 */
defineProps<{
  /** List of available categories for the dropdown select */
  categories: string[]
}>()

/** Two-way model binding for the active book status filter */
const status = defineModel<BookStatus | 'all'>('status', { required: true })

/** Two-way model binding for the active category filter */
const category = defineModel<string>('category', { required: true })

/** Two-way model binding for the availability toggle */
const availableOnly = defineModel<boolean>('available', { required: true })

/** Two-way model binding for the favorites-only toggle */
const favoritesOnly = defineModel<boolean>('favorites', { required: true })

/**
 * Component emitted events.
 */
const emit = defineEmits<{
  /** Emitted when the user triggers a filter reset */
  reset: []
}>()

/**
 * Predefined configuration options for book status filter chips.
 */
const statusOptions: { value: BookStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'common.all' },
  { value: 'finish', label: 'status.finish' },
  { value: 'unread', label: 'status.unread' },
  { value: 'wish', label: 'status.wish' },
]
</script>

<template>
  <div class="filter-panel">
    <div class="chip-group" role="group" :aria-label="t('filter.byStatus')">
      <button
        v-for="option in statusOptions"
        :key="option.value"
        type="button"
        class="chip"
        :class="{ active: status === option.value }"
        :aria-pressed="status === option.value"
        @click="status = option.value"
      >
        {{ t(option.label) }}
      </button>
      <span>&rarr;</span>
      <button
        type="button"
        class="chip"
        :class="{ active: availableOnly }"
        :aria-pressed="availableOnly"
        @click="availableOnly = !availableOnly"
      >
        {{ t('home.available') }}
      </button>
    </div>

    <button
      type="button"
      class="chip"
      :class="{ active: favoritesOnly }"
      :aria-pressed="favoritesOnly"
      @click="favoritesOnly = !favoritesOnly"
    >
      ★ {{ t('common.favorites') }}
    </button>

    <label class="category-filter">
      {{ t('filter.category') }}
      <select v-model="category">
        <option value="all">{{ t('common.all') }}</option>
        <option v-for="item in categories" :key="item" :value="item">
          {{ categoryLabel(item, t) }}
        </option>
      </select>
    </label>

    <button type="button" class="chip" @click="emit('reset')">{{ t('common.reset') }}</button>
  </div>
</template>

<style scoped>
.filter-panel {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 0 12px 12px 12px;
  margin-top: -1px;
  border-bottom: 1px solid #8b8d9240;
  border-top: 1px solid #ffffff;
}

.chip-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.chip-group span {
  font-size: 28px;
  color: #8b8d92;
  margin-left: -10px;
  margin-right: -10px;
  text-align: center;
}

.category-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-weight: 600;
  color: #8b8d92;
}

.category-filter select {
  padding: 6px 8px;
  border: 1px solid #c7c7c9;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  background: #ffffff;
  color: #2b2c2f;
  cursor: pointer;
  width: 150px;
}
</style>
