<script setup lang="ts">
import Header from '@/components/Header.vue'
</script>

<template>
  <section class="body-content">
    <Header />
    <RouterView />
  </section>
</template>

<style scoped>
.body-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  border: 1px solid #c7c7c9;
  background-color: #ffffff;
  box-shadow: 0 6px 20px #c7c7c9;
}
</style>
