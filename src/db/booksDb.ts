/**
 * @file booksDb.ts
 * @description Provides IndexedDB database operations for storing, retrieving, updating,
 * and clearing book collection records using the `idb` wrapper.
 */

import { openDB, type DBSchema } from 'idb'
import type { Book } from '@/types/book'

interface SimpLibDB extends DBSchema {
  books: { key: string; value: Book }
}

const dbPromise = openDB<SimpLibDB>('simplib', 1, {
  upgrade(db) {
    db.createObjectStore('books', { keyPath: 'id' })
  },
})

/** Retrieves all book records from the database */
export async function getAllBooks(): Promise<Book[]> {
  return (await dbPromise).getAll('books')
}

/** Saves or updates a single book record in the database */
export async function putBook(book: Book) {
  await (await dbPromise).put('books', book)
}

/** Saves or updates multiple book records in a single database transaction */
export async function putBooks(books: Book[]) {
  const db = await dbPromise
  const tx = db.transaction('books', 'readwrite')
  await Promise.all([...books.map((b) => tx.store.put(b)), tx.done])
}

/** Deletes a specific book record by its ID */
export async function deleteBook(id: string) {
  await (await dbPromise).delete('books', id)
}

/** Safely aborts an active database transaction */
function abortQuietly(tx: { abort: () => void }) {
  try {
    tx.abort()
  } catch {
    // transaction already finished or aborted
  }
}

/** Clears all existing books and replaces them with a new set of records within a transaction */
export async function replaceBooks(books: Book[]) {
  const db = await dbPromise
  const tx = db.transaction('books', 'readwrite')

  try {
    await Promise.all([tx.store.clear(), ...books.map((b) => tx.store.put(b)), tx.done])
  } catch (e) {
    abortQuietly(tx)
    throw e
  }
}
