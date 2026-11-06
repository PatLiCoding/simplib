/**
 * @file price.ts
 * @description Provides price input cleaning, validation, and normalization utilities
 * for handling currency and decimal formatting.
 */

/** Removes everything except digits and one decimal separator, restricting to a maximum of two decimal places */
export function cleanPrice(value: string): string {
  return value
    .replace(/[^0-9.,]/g, '')
    .replace(/^([^.,]*[.,][^.,]*).*$/, '$1')
    .replace(/([.,]\d{2})\d+$/, '$1')
}

/** Validates whether a price string is well-formed or empty */
export const isValidPrice = (price: string) => !price || /^\d+([.,]\d{1,2})?$/.test(price)

/** Normalizes price strings by replacing comma separators with periods for storage */
export const normalizePrice = (price: string) => price.replace(',', '.')
