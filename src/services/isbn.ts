/**
 * @file isbn.ts
 * @description Provides remote ISBN lookup and metadata fetching utilities using Open Library
 * and Google Books APIs with timeout and response sanitization.
 */

export interface IsbnResult {
  /** Book title */
  title: string
  /** Book author(s) */
  author: string
  /** Cover image URL or null if unavailable */
  cover: string | null
}

const TIMEOUT_MS = 8000

/**
 * Fetches JSON from a given URL with an enforced abort signal timeout.
 */
async function fetchJson<T>(url: string, source: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`${source}: HTTP ${res.status}`)
  return res.json()
}

/** Joins an array of author names into a single comma-separated string */
const joinNames = (names: string[] = []) => names.join(', ')

// ---------- Open Library ----------

interface OpenLibraryEntry {
  title?: string
  authors?: { name: string }[]
  cover?: { medium?: string }
}

/**
 * Queries the Open Library API for book metadata using an ISBN.
 */
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

/** Cleans thumbnail URLs by ensuring secure HTTPS and stripping curl edge parameters */
const cleanThumbnail = (url: string) => url.replace('http://', 'https://').replace('&edge=curl', '')

/**
 * Selects the volume that explicitly matches the requested ISBN, falling back to the first hit.
 */
function pickVolume(items: GoogleVolume[], isbn: string) {
  const matches = (item: GoogleVolume) =>
    item.volumeInfo?.industryIdentifiers?.some((id) => id.identifier === isbn)
  return (items.find(matches) ?? items[0])?.volumeInfo
}

/**
 * Queries the Google Books API for book metadata using an ISBN.
 */
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
