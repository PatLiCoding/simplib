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
  if (!entry?.title) return null

  return {
    title: entry.title,
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

export const isbnSources = [fromOpenLibrary, fromGoogleBooks]
