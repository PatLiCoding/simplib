import { computed, ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import data from '@/assets/data/example.json'
import type { Book } from '@/types/book'
import { deleteBook, getAllBooks, putBook, putBooks, replaceBooks } from '@/db/booksDb'
import { fetchCover, isRemoteCover } from '@/utils/cover'
import { toCategoryValue } from '@/utils/category'
import { toStatus } from '@/utils/status'

const COVER_MIGRATION_KEY = 'simplib:cover-migration'
const SEEDED_KEY = 'simplib:seeded'

const wasSeeded = () => {
  try {
    return localStorage.getItem(SEEDED_KEY) === '1'
  } catch {
    return false
  }
}

const markSeeded = () => {
  try {
    localStorage.setItem(SEEDED_KEY, '1')
  } catch {
    // storage unavailable: examples may reappear on an empty library
  }
}

const today = () => new Date().toLocaleDateString('sv-SE')

const byCreated = (a: Book, b: Book) => a.createdAt - b.createdAt

export const useBookStore = defineStore('books', () => {
  const books = ref<Book[]>([])

  async function init() {
    let stored = await getAllBooks()

    if (stored.length === 0 && !wasSeeded()) {
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
    const changed = stored.filter((book) => {
      const value = toCategoryValue(book.category)
      if (value === book.category) return false
      book.category = value
      return true
    })
    if (changed.length) await putBooks(changed)
    markSeeded()
    books.value = stored.sort((a, b) => a.createdAt - b.createdAt)
    void migrateCovers()
  }

  async function migrateCovers() {
    if (!navigator.onLine) return

    const remote = books.value.filter((b) => isRemoteCover(b.cover))
    if (remote.length === 0) return

    try {
      const last = Number(localStorage.getItem(COVER_MIGRATION_KEY) ?? 0)
      if (Date.now() - last < 24 * 60 * 60 * 1000) return
      localStorage.setItem(COVER_MIGRATION_KEY, String(Date.now()))
    } catch {
      // storage unavailable: just run
    }

    for (const book of remote) {
      const local = await fetchCover(book.isbn, book.cover)
      if (local && !isRemoteCover(local)) {
        book.cover = local
        await putBook({ ...toRaw(book) })
      }
    }
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

  async function remove(id: string) {
    await deleteBook(id)
    const i = books.value.findIndex((b) => b.id === id)
    if (i !== -1) books.value.splice(i, 1)
  }

  async function importBooks(incoming: Book[], mode: 'merge' | 'replace') {
    const plain: Book[] = incoming.map((book) => ({ ...toRaw(book) }))

    if (mode === 'replace') {
      await replaceBooks(plain)
      books.value = [...plain].sort(byCreated)
      return { added: plain.length, skipped: 0 }
    }

    const existing = new Set(books.value.map((b) => b.id))
    const fresh = plain.filter((b) => !existing.has(b.id))
    await putBooks(fresh)
    books.value = [...books.value, ...fresh].sort(byCreated)
    return { added: fresh.length, skipped: plain.length - fresh.length }
  }

  async function clear() {
    await replaceBooks([])
    books.value = []
  }

  return { books, stats, init, isAvailable, save, toggleFavorite, remove, importBooks, clear }
})
