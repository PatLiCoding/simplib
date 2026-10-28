<script setup lang="ts">
import Header from '@/components/Header.vue'
</script>

<template>
  <section class="body-content">
    <Header />
  </section>
</template>

<style scoped>
.body-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1440px;
  min-width: 0;
  min-height: 100vh;
  gap: 12px;
}
</style>
