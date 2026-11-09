/**
 * @file version.ts
 * @description Provides date formatting utilities for displaying localized application build timestamps.
 */

/**
 * Formats an ISO date string into a localized medium date and short time representation.
 *
 * @param iso - The ISO timestamp string to format.
 * @param locale - The current application locale identifier ('de' or 'en').
 * @returns The formatted date and time string matching the specified locale format.
 */
export function formatBuildDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
