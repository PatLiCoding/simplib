/**
 * @file image.ts
 * @description Provides image dimension scaling utilities to constrain maximum side lengths
 * while maintaining aspect ratios.
 */

/** Calculates scaled dimensions so that the longer side does not exceed maxSide */
export function scaledSize(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}
