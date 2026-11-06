import { BarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill'
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import { isValidIsbn13 } from '@/utils/isbn'
import { scaledSize } from '@/utils/image'

const MAX_SIDE = 2600
const THRESHOLDS = [80, 90, 100, 110, 120, 70, 130, 140]

// Serve the WASM file from our own bundle instead of a CDN (required for offline use)
const locateFile = (path: string, prefix: string) =>
  path.endsWith('.wasm') ? zxingWasmUrl : prefix + path

let detector: BarcodeDetector | null = null

function getDetector(): BarcodeDetector {
  if (!detector) {
    prepareZXingModule({ overrides: { locateFile } })
    detector = new BarcodeDetector({ formats: ['ean_13'] })
  }
  return detector
}

// All valid ISBN-13 codes found in an image, canvas or video frame
export async function detectIsbns(source: ImageBitmapSource): Promise<string[]> {
  const codes = await getDetector().detect(source)
  return codes.map((c) => c.rawValue).filter(isValidIsbn13)
}

async function firstIsbn(source: ImageBitmapSource): Promise<string | null> {
  return (await detectIsbns(source))[0] ?? null
}

function binarize(src: ImageData, threshold: number): ImageData {
  const out = new ImageData(src.width, src.height)
  const s = src.data
  const o = out.data
  for (let i = 0; i < s.length; i += 4) {
    const gray = 0.299 * (s[i] ?? 0) + 0.587 * (s[i + 1] ?? 0) + 0.114 * (s[i + 2] ?? 0)
    const v = gray < threshold ? 0 : 255
    o[i] = o[i + 1] = o[i + 2] = v
    o[i + 3] = 255
  }
  return out
}

function drawBitmap(bitmap: ImageBitmap): CanvasRenderingContext2D | null {
  const { width, height } = scaledSize(bitmap.width, bitmap.height, MAX_SIDE)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx?.drawImage(bitmap, 0, 0, width, height)
  return ctx
}

async function decodeThresholds(pixels: ImageData): Promise<string | null> {
  for (const threshold of THRESHOLDS) {
    const code = await firstIsbn(binarize(pixels, threshold))
    if (code) return code
  }
  return null
}

async function decodeCanvas(ctx: CanvasRenderingContext2D): Promise<string | null> {
  const { canvas } = ctx
  const plain = await firstIsbn(canvas)
  if (plain) return plain
  return decodeThresholds(ctx.getImageData(0, 0, canvas.width, canvas.height))
}

// Tries the photo as it is, then again with several black/white thresholds
export async function decodeIsbnFromFile(file: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(file)
  try {
    const ctx = drawBitmap(bitmap)
    return ctx ? await decodeCanvas(ctx) : null
  } finally {
    bitmap.close()
  }
}
