export interface IsbnResult {
  title: string
  author: string
  cover: string | null
}

const TIMEOUT_MS = 8000

async function fetchJson<T>(url: string, source: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`${source}: HTTP ${res.status}`)
  return res.json()
}

const joinNames = (names: string[] = []) => names.join(', ')

// ---------- Open Library ----------

interface OpenLibraryEntry {
  title?: string
  authors?: { name: string }[]
  cover?: { medium?: string }
}

async function fromOpenLibrary(isbn: string): Promise<IsbnResult | null> {
  const key = `ISBN:${isbn}`
  const url = `https://openlibrary.org/api/books?bibkeys=${key}&format=json&jscmd=data`
  const entry = (await fetchJson<Record<string, OpenLibraryEntry>>(url, 'Open Library'))[key]
  if (!entry?.title) return null

  return {
    title: entry.title,
    author: joinNames(entry.authors?.map((a) => a.name)),
    cover: entry.cover?.medium ?? null,
  }
}

// ---------- Google Books ----------

interface GoogleVolume {
  volumeInfo?: {
    title?: string
    authors?: string[]
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    industryIdentifiers?: { identifier: string }[]
  }
}

const cleanThumbnail = (url: string) => url.replace('http://', 'https://').replace('&edge=curl', '')

// Prefers the volume that really lists this ISBN, otherwise the first hit
function pickVolume(items: GoogleVolume[], isbn: string) {
  const matches = (item: GoogleVolume) =>
    item.volumeInfo?.industryIdentifiers?.some((id) => id.identifier === isbn)
  return (items.find(matches) ?? items[0])?.volumeInfo
}

async function fromGoogleBooks(isbn: string): Promise<IsbnResult | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=5`
  const json = await fetchJson<{ items?: GoogleVolume[] }>(url, 'Google Books')
  const info = pickVolume(json.items ?? [], isbn)
  if (!info?.title) return null

  const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail
  return {
    title: info.title,
    author: joinNames(info.authors),
    cover: thumbnail ? cleanThumbnail(thumbnail) : null,
  }
}

export const isbnSources = [fromOpenLibrary, fromGoogleBooks]
