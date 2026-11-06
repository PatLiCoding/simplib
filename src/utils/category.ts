/**
 * @file category.ts
 * @description Manages book category key mapping, normalization across multiple languages (English and German),
 * and localized category label resolution.
 */

import en from '@/i18n/locales/en.json'
import de from '@/i18n/locales/de.json'

export type CategoryKey = keyof typeof en.bookDialog.categories

export const categoryKeys = Object.keys(en.bookDialog.categories) as CategoryKey[]

const normalize = (value: string) => value.trim().toLocaleLowerCase()

const byLabel = new Map<string, CategoryKey>()
for (const key of categoryKeys) {
  byLabel.set(normalize(key), key)
  byLabel.set(normalize(en.bookDialog.categories[key]), key)
  byLabel.set(normalize(de.bookDialog.categories[key]), key)
}

/** Checks whether a given string is a valid category key */
function isCategoryKey(value: string): value is CategoryKey {
  return (categoryKeys as string[]).includes(value)
}

/** Converts user-typed category input into a normalized internal storage value */
export function toCategoryValue(input: string): string {
  const trimmed = input.trim()
  return byLabel.get(normalize(trimmed)) ?? trimmed
}

/** Resolves a stored category value into a localized label using the provided translation function */
export function categoryLabel(value: string, t: (key: string) => string): string {
  return isCategoryKey(value) ? t(`bookDialog.categories.${value}`) : value
}
