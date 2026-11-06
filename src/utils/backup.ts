import type { Book } from '@/types/book'
import { toStatus } from '@/utils/status'
import { toCategoryValue } from '@/utils/category'
import { stripIsbn } from '@/utils/isbn'

export const BACKUP_APP = 'simplib'
export const BACKUP_VERSION = 1
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024

export type BackupError =
  'notJson' | 'notSimplib' | 'newerVersion' | 'noBooks' | 'empty' | 'tooLarge' | 'failed'

export type ParseResult =
  { ok: true; books: Book[]; skipped: number } | { ok: false; error: BackupError }

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  books: Book[]
}

type Raw = Record<string, unknown>
type Meta = Pick<Book, 'id' | 'createdAt' | 'cover' | 'favorite' | 'status'>
type Details = Omit<Book, keyof Meta>

// ---------- Export ----------

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

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadBackup(books: Book[]) {
  const json = JSON.stringify(createBackup(books), null, 2)
  saveBlob(new Blob([json], { type: 'application/json' }), backupFileName())
}

// ---------- Import: single fields ----------

const str = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const toId = (v: unknown) => (typeof v === 'string' && v ? v : crypto.randomUUID())

const toCreatedAt = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? v : Date.now()

const toCover = (v: unknown) =>
  typeof v === 'string' && /^(data:image\/|https?:\/\/)/.test(v) ? v : null

const toReleaseDate = (v: unknown) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''

const toPrice = (v: unknown) => (typeof v === 'number' ? String(v) : str(v, 9))

// ---------- Import: one book ----------

function sanitizeMeta(r: Raw): Meta {
  return {
    id: toId(r.id),
    createdAt: toCreatedAt(r.createdAt),
    cover: toCover(r.cover),
    favorite: r.favorite === true,
    status: toStatus(str(r.status, 10)),
  }
}

function sanitizeDetails(r: Raw): Details {
  return {
    title: str(r.title, 150),
    author: str(r.author, 80),
    isbn: stripIsbn(str(r.isbn, 17)),
    category: toCategoryValue(str(r.category, 30)),
    price: toPrice(r.price),
    releaseDate: toReleaseDate(r.releaseDate),
  }
}

function sanitizeBook(raw: unknown): Book | null {
  if (!raw || typeof raw !== 'object') return null
  const details = sanitizeDetails(raw as Raw)
  if (!details.title) return null
  return { ...sanitizeMeta(raw as Raw), ...details }
}

// ---------- Import: whole file ----------

function sanitizeAll(rawBooks: unknown[]): { books: Book[]; skipped: number } {
  const byId = new Map<string, Book>()
  let skipped = 0
  for (const raw of rawBooks) {
    const book = sanitizeBook(raw)
    if (!book || byId.has(book.id)) skipped++
    else byId.set(book.id, book)
  }
  return { books: [...byId.values()], skipped }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function checkFile(data: unknown): BackupError | null {
  const file = data as Partial<BackupFile> | null
  if (!file || typeof file !== 'object') return 'notSimplib'
  if (file.app !== BACKUP_APP || typeof file.version !== 'number') return 'notSimplib'
  if (file.version > BACKUP_VERSION) return 'newerVersion'
  return Array.isArray(file.books) ? null : 'noBooks'
}

export function parseBackup(text: string): ParseResult {
  const data = safeParse(text)
  if (data === undefined) return { ok: false, error: 'notJson' }

  const error = checkFile(data)
  if (error) return { ok: false, error }

  const { books, skipped } = sanitizeAll((data as BackupFile).books)
  if (books.length === 0) return { ok: false, error: 'empty' }
  return { ok: true, books, skipped }
}
