<script setup lang="ts">
const query = defineModel<string>({ required: true })
</script>

<template>
  <div class="search-bar" role="search">
    <input
      v-model="query"
      type="search"
      class="search-input"
      placeholder="Search by title, author or ISBN..."
      aria-label="Search books"
      maxlength="150"
    />
    <button v-if="query" type="button" class="clear" aria-label="Clear search" @click="query = ''">
      ✕
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #8b8d9240;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 12px;
  border: 1px solid #c7c7c9;
  border-radius: 20px;
  font-size: 16px;
  background: #ffffff;
  color: #2b2c2f;
  appearance: none;
  cursor: text;

  &:focus {
    outline: 2px solid #b23a3a;
    outline-offset: 0;
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
}

.clear {
  position: absolute;
  right: 24px;
  padding: 0;
  border: none;
  background: none;
  font-size: 16px;
  line-height: 1;
  color: #8b8d92;
  cursor: pointer;

  &:hover {
    color: #b23a3a;
  }
}
</style>
