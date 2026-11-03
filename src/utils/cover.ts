const TIMEOUT_MS = 8000

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
    `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`,
  ].filter((url): url is string => !!url)

  for (const url of urls) {
    const dataUrl = await toDataUrl(url)
    if (dataUrl) return dataUrl
  }
  return preferred
}
