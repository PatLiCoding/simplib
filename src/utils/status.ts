import type { BookStatus } from '@/types/book'

const statuses: BookStatus[] = ['finish', 'unread', 'wish']

export function toStatus(value: string): BookStatus | '' {
  return statuses.includes(value as BookStatus) ? (value as BookStatus) : ''
}
