<script setup lang="ts"></script>

<template>
  <section class="booklist-content">
    <div class="list-headline">
      <h2>My Lib</h2>
      <p class="book-view">View: <span>Small</span></p>
      <p class="filter">Filter <span class="arrow">&darr;</span></p>
    </div>

    <div id="booklist" class="booklist"></div>
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
.book-view {
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
</style>
