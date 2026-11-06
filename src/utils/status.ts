/**
 * @file status.ts
 * @description Provides status validation and sanitization utilities for book reading statuses.
 */

import type { BookStatus } from '@/types/book'

const statuses: BookStatus[] = ['finish', 'unread', 'wish']

/** Sanitizes and converts a status string into a valid BookStatus type or empty string */
export function toStatus(value: string): BookStatus | '' {
  return statuses.includes(value as BookStatus) ? (value as BookStatus) : ''
}
