import { openDB, type DBSchema } from 'idb'
import type { Book } from '@/interface/book'

interface SimpLibDB extends DBSchema {
  books: { key: string; value: Book }
}

const dbPromise = openDB<SimpLibDB>('simplib', 1, {
  upgrade(db) {
    db.createObjectStore('books', { keyPath: 'id' })
  },
})

export async function getAllBooks(): Promise<Book[]> {
  return (await dbPromise).getAll('books')
}

export async function putBook(book: Book) {
  await (await dbPromise).put('books', book)
}

export async function putBooks(books: Book[]) {
  const db = await dbPromise
  const tx = db.transaction('books', 'readwrite')
  await Promise.all([...books.map((b) => tx.store.put(b)), tx.done])
}

export async function deleteBook(id: string) {
  await (await dbPromise).delete('books', id)
}
