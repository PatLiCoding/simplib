/**
 * @file isbn.ts
 * @description Provides ISBN manipulation, sanitization, validation, and check-digit algorithm utilities
 * shared across the book dialog, scanner, and backup import modules.
 */

/** Removes hyphens and whitespace characters from an ISBN string */
export const stripIsbn = (value: string) => value.replace(/[-\s]/g, '')

/** Removes every character that can never be part of an ISBN and converts to uppercase */
export const cleanIsbnInput = (value: string) => value.replace(/[^0-9\-\sXx]/g, '').toUpperCase()

/** Returns the translation error key below "bookDialog.errors", or an empty string if valid or empty */
export function isbnErrorKey(isbn: string): string {
  if (!isbn) return ''
  if (isbn.length !== 10 && isbn.length !== 13) return 'isbnLength'
  if (!/^(\d{13}|\d{9}[\dX])$/.test(isbn)) return 'isbnInvalid'
  return ''
}

/** Validates whether a code is a valid ISBN-13 (EAN-13 with 978/979 prefix and a valid check digit) */
export function isValidIsbn13(code: string): boolean {
  if (!/^97[89]\d{10}$/.test(code)) return false
  const sum = [...code].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  return sum % 10 === 0
}
