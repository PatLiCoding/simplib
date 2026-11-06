/**
 * @file cover.ts
 * @description Provides utilities for detecting remote covers, fetching and converting images to data URLs,
 * and scaling/re-encoding image files for database storage.
 */

import { scaledSize } from '@/utils/image'

const TIMEOUT_MS = 8000

/** Determines whether a cover URL is a remote HTTP(S) link */
export const isRemoteCover = (cover: string | null): cover is string =>
  !!cover && /^https?:\/\//.test(cover)

/** Converts a Blob into a base64 data URL string */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Fetches a remote URL and converts its response blob into a data URL */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return null

    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null

    return await blobToDataUrl(blob)
  } catch {
    // network error, timeout or the server does not allow cross-origin reads
    return null
  }
}

/**
 * Attempts to download a book cover from preferred sources or Open Library,
 * falling back to the original URL if downloads fail.
 */
export async function fetchCover(isbn: string, preferred: string | null): Promise<string | null> {
  const urls = [
    preferred,
    isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : null,
  ].filter((url): url is string => !!url)

  for (const url of urls) {
    const dataUrl = await toDataUrl(url)
    if (dataUrl) return dataUrl
  }
  return preferred
}

/** Draws and scales an image bitmap onto a white-background canvas */
function drawScaled(bitmap: ImageBitmap, maxSide: number): HTMLCanvasElement {
  const { width, height } = scaledSize(bitmap.width, bitmap.height, maxSide)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  return canvas
}

/** Scales down and re-encodes a user photo into a compressed JPEG data URL for IndexedDB storage */
export async function imageToCoverDataUrl(
  file: Blob,
  maxSide = 600,
  quality = 0.8,
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    return drawScaled(bitmap, maxSide).toDataURL('image/jpeg', quality)
  } finally {
    bitmap.close()
  }
}
