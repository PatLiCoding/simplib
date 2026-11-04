import type { Book } from '@/interface/book'
import { toStatus } from '@/stores/books'
import { toCategoryValue } from '@/utils/category'

export const BACKUP_APP = 'simplib'
export const BACKUP_VERSION = 1
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024

export type BackupError =
  'notJson' | 'notSimplib' | 'newerVersion' | 'noBooks' | 'empty' | 'tooLarge' | 'failed'

export type ParseResult =
  { ok: true; books: Book[]; skipped: number } | { ok: false; error: BackupError }

const str = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  books: Book[]
}

export function createBackup(books: Book[]): BackupFile {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    books,
  }
}

export function backupFileName(date = new Date()): string {
  return `simplib-backup-${date.toLocaleDateString('sv-SE')}.json`
}

export function downloadBackup(books: Book[]) {
  const json = JSON.stringify(createBackup(books), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = backupFileName()
  document.body.appendChild(link)
  link.click()
  link.remove()

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function sanitizeBook(raw: unknown): Book | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const title = str(r.title, 150)
  if (!title) return null

  const cover =
    typeof r.cover === 'string' && /^(data:image\/|https?:\/\/)/.test(r.cover) ? r.cover : null
  const releaseDate =
    typeof r.releaseDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.releaseDate)
      ? r.releaseDate
      : ''

  return {
    id: typeof r.id === 'string' && r.id ? r.id : crypto.randomUUID(),
    createdAt:
      typeof r.createdAt === 'number' && Number.isFinite(r.createdAt) ? r.createdAt : Date.now(),
    title,
    author: str(r.author, 80),
    cover,
    isbn: str(r.isbn, 17).replace(/[-\s]/g, ''),
    category: toCategoryValue(str(r.category, 30)),
    price: typeof r.price === 'number' ? String(r.price) : str(r.price, 9),
    releaseDate,
    status: toStatus(str(r.status, 10)),
    favorite: r.favorite === true,
  }
}

export function parseBackup(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'notJson' }
  }

  const file = data as Partial<BackupFile> | null
  if (
    !file ||
    typeof file !== 'object' ||
    file.app !== BACKUP_APP ||
    typeof file.version !== 'number'
  ) {
    return { ok: false, error: 'notSimplib' }
  }
  if (file.version > BACKUP_VERSION) return { ok: false, error: 'newerVersion' }
  if (!Array.isArray(file.books)) return { ok: false, error: 'noBooks' }

  const byId = new Map<string, Book>()
  let skipped = 0
  for (const raw of file.books) {
    const book = sanitizeBook(raw)
    if (!book || byId.has(book.id)) {
      skipped++
      continue
    }
    byId.set(book.id, book)
  }

  if (byId.size === 0) return { ok: false, error: 'empty' }
  return { ok: true, books: [...byId.values()], skipped }
}
