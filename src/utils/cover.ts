const TIMEOUT_MS = 8000

export const isRemoteCover = (cover: string | null): cover is string =>
  !!cover && /^https?:\/\//.test(cover)

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

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

// Tries the lookup's cover first, then Open Library's cover-by-ISBN.
// If no download works, the plain link is kept (it then only shows online).
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

// Own photo: scale down and re-encode so it stays small in IndexedDB
export async function imageToCoverDataUrl(
  file: Blob,
  maxSide = 600,
  quality = 0.8,
): Promise<string> {
  const bitmap = await createImageBitmap(file)

  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not available')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    bitmap.close()
  }
}
