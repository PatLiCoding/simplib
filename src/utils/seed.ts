import data from '@/assets/data/example.json'
import type { Book } from '@/types/book'
import { toStatus } from '@/utils/status'

const SEEDED_KEY = 'simplib:seeded'

export function wasSeeded(): boolean {
  try {
    return localStorage.getItem(SEEDED_KEY) === '1'
  } catch {
    return false
  }
}

export function markSeeded() {
  try {
    localStorage.setItem(SEEDED_KEY, '1')
  } catch {
    // storage unavailable: examples may reappear on an empty library
  }
}

export function createExampleBooks(now = Date.now()): Book[] {
  return data.books.map((book, i) => ({
    ...book,
    id: crypto.randomUUID(),
    createdAt: now + i,
    status: toStatus(book.status),
    releaseDate: book.releaseDate ?? '',
  }))
}
