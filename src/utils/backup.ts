import type { Book } from '@/interface/book'

export const BACKUP_APP = 'simplib'
export const BACKUP_VERSION = 1

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
