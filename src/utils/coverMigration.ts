/**
 * @file coverMigration.ts
 * @description Manages throttling checks for background cover migration routines using local storage persistence.
 */

const KEY = 'simplib:cover-migration'
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Determines whether a cover migration run is due (more than a day since the last run),
 * updating the last run timestamp if so.
 */
export function migrationDue(): boolean {
  try {
    const last = Number(localStorage.getItem(KEY) ?? 0)
    if (Date.now() - last < DAY_MS) return false
    localStorage.setItem(KEY, String(Date.now()))
  } catch {
    // storage unavailable: just run
  }
  return true
}
