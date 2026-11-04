import en from '@/i18n/locales/en.json'
import de from '@/i18n/locales/de.json'

export type CategoryKey = keyof typeof en.bookDialog.categories

export const categoryKeys = Object.keys(en.bookDialog.categories) as CategoryKey[]

const normalize = (value: string) => value.trim().toLocaleLowerCase()

// Matches the English and German label as well as the key itself
const byLabel = new Map<string, CategoryKey>()
for (const key of categoryKeys) {
  byLabel.set(normalize(key), key)
  byLabel.set(normalize(en.bookDialog.categories[key]), key)
  byLabel.set(normalize(de.bookDialog.categories[key]), key)
}

function isCategoryKey(value: string): value is CategoryKey {
  return (categoryKeys as string[]).includes(value)
}

// Text typed by the user -> value that gets stored
export function toCategoryValue(input: string): string {
  const trimmed = input.trim()
  return byLabel.get(normalize(trimmed)) ?? trimmed
}

// Stored value -> text shown in the current language
export function categoryLabel(value: string, t: (key: string) => string): string {
  return isCategoryKey(value) ? t(`bookDialog.categories.${value}`) : value
}
