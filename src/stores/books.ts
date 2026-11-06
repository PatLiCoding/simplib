import { computed, ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import type { Book } from '@/types/book'
import { deleteBook, getAllBooks, putBook, putBooks, replaceBooks } from '@/db/booksDb'
import { fetchCover, isRemoteCover } from '@/utils/cover'
import { migrationDue } from '@/utils/coverMigration'
import { toCategoryValue } from '@/utils/category'
import { createExampleBooks, markSeeded, wasSeeded } from '@/utils/seed'

const today = () => new Date().toLocaleDateString('sv-SE')

const byCreated = (a: Book, b: Book) => a.createdAt - b.createdAt

// Older entries may hold a translated category: store the key instead
async function normalizeCategories(list: Book[]) {
  const changed = list.filter((book) => {
    const value = toCategoryValue(book.category)
    if (value === book.category) return false
    book.category = value
    return true
  })
  if (changed.length) await putBooks(changed)
}

export const useBookStore = defineStore('books', () => {
  const books = ref<Book[]>([])

  async function init() {
    let stored = await getAllBooks()

    if (stored.length === 0 && !wasSeeded()) {
      stored = createExampleBooks()
      await putBooks(stored)
    }
    await normalizeCategories(stored)
    markSeeded()
    books.value = stored.sort(byCreated)
    void migrateCovers()
  }

  async function localizeCover(book: Book) {
    const local = await fetchCover(book.isbn, book.cover)
    if (!local || isRemoteCover(local)) return
    book.cover = local
    await putBook({ ...toRaw(book) })
  }

  async function migrateCovers() {
    if (!navigator.onLine) return

    const remote = books.value.filter((b) => isRemoteCover(b.cover))
    if (remote.length === 0 || !migrationDue()) return

    for (const book of remote) await localizeCover(book)
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

  async function replaceAll(plain: Book[]) {
    await replaceBooks(plain)
    books.value = [...plain].sort(byCreated)
    return { added: plain.length, skipped: 0 }
  }

  async function mergeIn(plain: Book[]) {
    const existing = new Set(books.value.map((b) => b.id))
    const fresh = plain.filter((b) => !existing.has(b.id))
    await putBooks(fresh)
    books.value = [...books.value, ...fresh].sort(byCreated)
    return { added: fresh.length, skipped: plain.length - fresh.length }
  }

  async function importBooks(incoming: Book[], mode: 'merge' | 'replace') {
    const plain: Book[] = incoming.map((book) => ({ ...toRaw(book) }))
    return mode === 'replace' ? replaceAll(plain) : mergeIn(plain)
  }

  async function clear() {
    await replaceBooks([])
    books.value = []
  }

  return { books, stats, init, isAvailable, save, toggleFavorite, remove, importBooks, clear }
})
