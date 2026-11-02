import { computed, ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import data from '@/assets/data/example.json'
import type { Book, BookStatus } from '@/interface/book'
import { getAllBooks, putBook, putBooks } from '@/db/booksDb'

const statuses: BookStatus[] = ['finish', 'unread', 'wish']

export function toStatus(value: string): BookStatus | '' {
  return statuses.includes(value as BookStatus) ? (value as BookStatus) : ''
}

// lokal Date as "YYYY-MM-DD"
const today = () => new Date().toLocaleDateString('sv-SE')

export const useBookStore = defineStore('books', () => {
  const books = ref<Book[]>([])

  async function init() {
    let stored = await getAllBooks()

    if (stored.length === 0) {
      const now = Date.now()
      stored = data.books.map((book, i) => ({
        ...book,
        id: crypto.randomUUID(),
        createdAt: now + i,
        status: toStatus(book.status),
        releaseDate: book.releaseDate ?? '',
      }))
      await putBooks(stored)
    }

    books.value = stored.sort((a, b) => a.createdAt - b.createdAt)
  }

  function isAvailable(book: Book): boolean {
    return book.status === 'wish' && (book.releaseDate === '' || book.releaseDate <= today())
  }

  const stats = computed(() => ({
    wish: books.value.filter((b) => b.status === 'wish').length,
    available: books.value.filter(isAvailable).length,
    finish: books.value.filter((b) => b.status === 'finish').length,
    unread: books.value.filter((b) => b.status === 'unread').length,
    favorites: books.value.filter((b) => b.favorite).length,
  }))

  async function save(book: Book) {
    const plain: Book = { ...toRaw(book) }
    await putBook(plain)

    const i = books.value.findIndex((b) => b.id === plain.id)
    if (i === -1) books.value.push(plain)
    else books.value[i] = plain
  }

  async function toggleFavorite(id: string) {
    const book = books.value.find((b) => b.id === id)
    if (!book) return
    book.favorite = !book.favorite
    await putBook({ ...toRaw(book) })
  }

  return { books, stats, init, isAvailable, save, toggleFavorite }
})
