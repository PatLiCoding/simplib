const KEY = 'simplib:cover-migration'
const DAY_MS = 24 * 60 * 60 * 1000

// True if the last run was more than a day ago; remembers this run
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
