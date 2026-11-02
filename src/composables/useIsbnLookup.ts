import { ref } from 'vue'

export interface IsbnResult {
  title: string
  author: string
  cover: string | null
}

const TIMEOUT_MS = 8000

async function fromOpenLibrary(isbn: string): Promise<IsbnResult | null> {
  const key = `ISBN:${isbn}`
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=${key}&format=json&jscmd=data`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  )
  if (!res.ok) throw new Error(`Open Library: HTTP ${res.status}`)

  const entry = (await res.json())[key]
  if (!entry) return null

  return {
    title: entry.title ?? '',
    author: (entry.authors ?? []).map((a: { name: string }) => a.name).join(', '),
    cover: entry.cover?.medium ?? null,
  }
}

interface GoogleVolume {
  volumeInfo?: {
    title?: string
    authors?: string[]
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    industryIdentifiers?: { identifier: string }[]
  }
}

async function fromGoogleBooks(isbn: string): Promise<IsbnResult | null> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=5`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  )
  if (!res.ok) throw new Error(`Google Books: HTTP ${res.status}`)

  const json: { items?: GoogleVolume[] } = await res.json()
  const items = json.items ?? []

  const match =
    items.find((item) =>
      item.volumeInfo?.industryIdentifiers?.some((id) => id.identifier === isbn),
    ) ?? items[0]

  const info = match?.volumeInfo
  if (!info?.title) return null

  const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail

  return {
    title: info.title,
    author: (info.authors ?? []).join(', '),
    cover: thumbnail ? thumbnail.replace('http://', 'https://').replace('&edge=curl', '') : null,
  }
}

const sources = [fromOpenLibrary, fromGoogleBooks]

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

      for (const source of sources) {
        try {
          const result = await source(isbn)
          if (result) return result
        } catch (e) {
          failures++
          console.warn('ISBN lookup source failed:', e)
        }
      }

      if (failures === sources.length) {
        error.value = navigator.onLine
          ? 'Lookup failed. Please try again later.'
          : 'You are offline. Lookup needs an internet connection.'
      } else {
        error.value =
          failures > 0
            ? 'No book found. One source was unavailable, please try again later.'
            : 'No book found for this ISBN.'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, lookup, reset }
}
