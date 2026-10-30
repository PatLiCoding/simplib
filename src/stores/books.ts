import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import data from '@/assets/data/example.json'
import type { Book, BookStatus } from '@/interface/book'

const statuses: BookStatus[] = ['finish', 'unread', 'wish']

export function toStatus(value: string): BookStatus | '' {
  return statuses.includes(value as BookStatus) ? (value as BookStatus) : ''
}

// lokal Date as "YYYY-MM-DD"
const today = () => new Date().toLocaleDateString('sv-SE')

export const useBookStore = defineStore('books', () => {
  const books = ref<Book[]>(
    data.books.map((book) => ({
      ...book,
      status: toStatus(book.status),
      releaseDate: book.releaseDate ?? '',
    })),
  )

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

  function save(book: Book, index: number | null) {
    if (index === null) books.value.push(book)
    else books.value[index] = book
  }

  function toggleFavorite(index: number) {
    const book = books.value[index]
    if (book) book.favorite = !book.favorite
  }

  return { books, stats, isAvailable, save, toggleFavorite }
})
