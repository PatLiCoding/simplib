/**
 * @file seed.ts
 * @description Manages example library seeding state via local storage persistence
 * and generates initial example book records.
 */

import data from '@/assets/data/example.json'
import type { Book } from '@/types/book'
import { toStatus } from '@/utils/status'

const SEEDED_KEY = 'simplib:seeded'

/** Checks whether the library has already been seeded with example books */
export function wasSeeded(): boolean {
  try {
    return localStorage.getItem(SEEDED_KEY) === '1'
  } catch {
    return false
  }
}

/** Marks the library as seeded in local storage */
export function markSeeded() {
  try {
    localStorage.setItem(SEEDED_KEY, '1')
  } catch {
    // storage unavailable: examples may reappear on an empty library
  }
}

/** Generates a list of example book records with unique IDs and timestamps */
export function createExampleBooks(now = Date.now()): Book[] {
  return data.books.map((book, i) => ({
    ...book,
    id: crypto.randomUUID(),
    createdAt: now + i,
    status: toStatus(book.status),
    releaseDate: book.releaseDate ?? '',
  }))
}
