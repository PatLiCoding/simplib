import { ref } from 'vue'

export interface IsbnResult {
  title: string
  author: string
  cover: string | null
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
      const key = `ISBN:${isbn}`
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=${key}&format=json&jscmd=data`,
        { signal: AbortSignal.timeout(8000) },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      const entry = json[key]

      if (!entry) {
        error.value = 'No book found for this ISBN.'
        return null
      }

      return {
        title: entry.title ?? '',
        author: (entry.authors ?? []).map((a: { name: string }) => a.name).join(', '),
        cover: entry.cover?.medium ?? null,
      }
    } catch {
      error.value = navigator.onLine
        ? 'Lookup failed. Please try again later.'
        : 'You are offline. Lookup needs an internet connection.'
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, lookup, reset }
}
