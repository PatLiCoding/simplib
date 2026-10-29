export type BookStatus = 'finish' | 'unread' | 'wish'

export interface Book {
  title: string
  author: string
  cover: string | null
  isbn: string
  category: string
  price: string
  status: BookStatus | ''
  favorite: boolean
}
