<script setup lang="ts">
import { useBookDialog } from '@/composables/useBookDialog'

const { openNew } = useBookDialog()
</script>

<template>
  <header class="header">
    <div class="logo">
      <img src="../assets/img/logo.png" alt="Logo" />
      <h1 id="heading">SimpLib</h1>
    </div>

    <div>
      <button type="button" class="addBtn" aria-label="Add new book" @click="openNew">+</button>
    </div>
  </header>
</template>

<style scoped>
.header {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(12px, 2vw, 24px);
  background-color: #b23a3a;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

img {
  height: 120px;
  object-fit: contain;
}

#heading {
  margin: 0;
  font-weight: 700;
  font-size: 42px;
  line-height: 1.1;
  letter-spacing: 0;
  color: #f3f2f1;
}

.addBtn {
  border: none;
  border-radius: 25px;
  padding: 4px 12px;
  font-size: 28px;
  background: #f3f2f1;
  color: #2b2c2f;

  &:hover {
    cursor: pointer;
    background: #2b2c2f;
    color: #f3f2f1;
    box-shadow: 0 0 0 1px #f3f2f1;
  }
}

/* Tablet */
@media (max-width: 1024px) {
  .header {
    padding: 8px 20px;
  }

  img {
    height: 100px;
    object-fit: contain;
  }

  #heading {
    display: none;
  }

  .addBtn {
    font-size: 24px;
  }
}

/* Phone */
@media (max-width: 640px) {
  img {
    height: 80px;
    object-fit: contain;
  }
}
</style>
