import { ref } from 'vue'
import { i18n } from '@/i18n'
import { isbnSources, type IsbnResult } from '@/services/isbn'

const t = i18n.global.t

export type { IsbnResult }

export function useIsbnLookup() {
  const loading = ref(false)
  const error = ref('')

  function reset() {
    error.value = ''
  }

  async function lookup(isbn: string): Promise<IsbnResult | null> {
    loading.value = true
    error.value = ''

    try {
      let failures = 0

      for (const source of isbnSources) {
        try {
          const result = await source(isbn)
          if (result) return result
        } catch (e) {
          failures++
          console.warn('ISBN lookup source failed:', e)
        }
      }

      if (failures === isbnSources.length) {
        error.value = navigator.onLine ? t('lookup.failed') : t('lookup.offline')
      } else {
        error.value = failures > 0 ? t('lookup.partial') : t('lookup.notFound')
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, lookup, reset }
}
