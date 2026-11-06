import { ref } from 'vue'
import { i18n } from '@/i18n'
import { isbnSources, type IsbnResult } from '@/services/isbn'

const t = i18n.global.t

export type { IsbnResult }

// Asks the sources one after another until one knows the book
async function trySources(isbn: string): Promise<{ result: IsbnResult | null; failures: number }> {
  let failures = 0
  for (const source of isbnSources) {
    try {
      const result = await source(isbn)
      if (result) return { result, failures }
    } catch (e) {
      failures++
      console.warn('ISBN lookup source failed:', e)
    }
  }
  return { result: null, failures }
}

function errorKey(failures: number): string {
  if (failures === isbnSources.length) {
    return navigator.onLine ? 'lookup.failed' : 'lookup.offline'
  }
  return failures > 0 ? 'lookup.partial' : 'lookup.notFound'
}

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
      const { result, failures } = await trySources(isbn)
      if (!result) error.value = t(errorKey(failures))
      return result
    } finally {
      loading.value = false
    }
  }

  return { loading, error, lookup, reset }
}
