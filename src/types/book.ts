/**
 * @file book.ts
 * @description Defines TypeScript interfaces and types for book records and reading statuses.
 */

export type BookStatus = 'finish' | 'unread' | 'wish'

export interface Book {
  /** Unique book record identifier */
  id: string
  /** Creation timestamp */
  createdAt: number
  /** Book title */
  title: string
  /** Book author */
  author: string
  /** Cover image data URL or remote URL, or null */
  cover: string | null
  /** ISBN code */
  isbn: string
  /** Book category */
  category: string
  /** Price string */
  price: string
  /** Release date string (YYYY-MM-DD) */
  releaseDate: string
  /** Reading status */
  status: BookStatus | ''
  /** Favorite flag */
  favorite: boolean
}
