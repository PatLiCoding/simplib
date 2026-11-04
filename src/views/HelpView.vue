<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// id = key in the locale files, paragraphs = number of keys p1..pN
const sections = [
  { id: 'add', paragraphs: 3 },
  { id: 'scan', paragraphs: 4 },
  { id: 'wish', paragraphs: 2 },
  { id: 'find', paragraphs: 2 },
  { id: 'offline', paragraphs: 2 },
  { id: 'backup', paragraphs: 3 },
  { id: 'privacy', paragraphs: 2 },
] as const
</script>

<template>
  <section class="help">
    <div class="help-headline">
      <h2>{{ t('help.title') }}</h2>
      <RouterLink :to="{ name: 'booklist' }" class="back">{{ t('help.back') }}</RouterLink>
    </div>

    <article v-for="section in sections" :key="section.id" class="help-section">
      <h3>{{ t(`help.${section.id}.title`) }}</h3>
      <p v-for="n in section.paragraphs" :key="n">
        {{ t(`help.${section.id}.p${n}`) }}
      </p>
    </article>
  </section>
</template>

<style scoped>
.help {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 24px;
}

.help-headline {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid #8b8d9240;
}

h2 {
  font-size: 42px;
  color: #8b8d92;
}

.back {
  font-size: 20px;
  color: #8b8d92;
  text-decoration: none;
  cursor: pointer;
}

.back:hover {
  color: #b23a3a;
  text-decoration: underline;
}

.help-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid #c7c7c9;
  border-radius: 10px;
  background-color: #f3f2f1;
  box-shadow: 0 1px 4px #c7c7c9;
}

h3 {
  color: #b23a3a;
}

p {
  line-height: 1.5;
  overflow-wrap: anywhere;
}
</style>
