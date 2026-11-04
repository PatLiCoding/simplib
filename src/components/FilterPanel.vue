<script setup lang="ts">
import type { BookStatus } from '@/interface/book'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  categories: string[]
}>()

const status = defineModel<BookStatus | 'all'>('status', { required: true })
const category = defineModel<string>('category', { required: true })

const emit = defineEmits<{
  reset: []
}>()

const statusOptions: { value: BookStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'common.all' },
  { value: 'wish', label: 'status.wish' },
  { value: 'unread', label: 'status.unread' },
  { value: 'finish', label: 'status.finish' },
]

const availableOnly = defineModel<boolean>('available', { required: true })

const favoritesOnly = defineModel<boolean>('favorites', { required: true })
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

    <button
      type="button"
      class="chip"
      :class="{ active: availableOnly }"
      :aria-pressed="availableOnly"
      @click="availableOnly = !availableOnly"
    >
      {{ t('home.available') }}
    </button>

    <label class="category-filter">
      {{ t('filter.category') }}
      <select v-model="category">
        <option value="all">{{ t('common.all') }}</option>
        <option v-for="item in categories" :key="item" :value="item">
          {{ item }}
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
  padding: 12px;
}

.chip-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 16px;
  border: 1px solid #b23a3a;
  border-radius: 20px;
  background: transparent;
  color: #b23a3a;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background: #b23a3a20;
  }
}

.chip.active {
  background: #b23a3a;
  color: #f3f2f1;
}

.chip.active:hover {
  background: #2b2c2f;
  color: #f3f2f1;
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

select,
select::picker(select) {
  appearance: base-select;
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
</style>
