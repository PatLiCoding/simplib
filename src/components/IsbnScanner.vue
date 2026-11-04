<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { BarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill'
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Serve the WASM file from our own bundle instead of a CDN (required for offline use)
prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm') ? zxingWasmUrl : prefix + path,
  },
})

const emit = defineEmits<{
  detected: [isbn: string]
  close: []
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const fileEl = ref<HTMLInputElement | null>(null)
const status = ref('starting')
const error = ref('')
const hint = ref('')
const decoding = ref(false)

const detector = new BarcodeDetector({ formats: ['ean_13'] })

let stream: MediaStream | null = null
let stopped = false
let done = false
let hintTimer: ReturnType<typeof setTimeout> | undefined

// ISBN-13 = EAN-13 with a 978/979 prefix and a valid check digit
function isValidIsbn13(code: string): boolean {
  if (!/^97[89]\d{10}$/.test(code)) return false
  const sum = [...code].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  return sum % 10 === 0
}

function stop() {
  stopped = true
  clearTimeout(hintTimer)
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
}

function finish(code: string): boolean {
  if (done || !isValidIsbn13(code)) return false
  done = true
  stop()
  emit('detected', code)
  return true
}

// ---------- Live camera ----------

function scan(video: HTMLVideoElement) {
  let lastRead = ''

  const tick = async () => {
    if (stopped) return

    if (video.readyState >= 2) {
      try {
        const codes = await detector.detect(video)
        for (const c of codes) {
          if (!isValidIsbn13(c.rawValue)) continue
          if (c.rawValue === lastRead) {
            if (finish(c.rawValue)) return
          } else {
            lastRead = c.rawValue
          }
        }
      } catch (e) {
        console.error('Barcode detection failed:', e)
        stop()
        error.value = 'The scanner could not be loaded.'
        return
      }
    }
    setTimeout(tick, 100)
  }

  tick()
}

async function start() {
  if (!navigator.mediaDevices?.getUserMedia) {
    error.value = 'noLive'
    return
  }

  let s: MediaStream
  try {
    s = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    })
  } catch (e) {
    error.value = (e as DOMException).name === 'NotAllowedError' ? 'denied' : 'noCamera'
    return
  }

  if (stopped || !videoEl.value) {
    s.getTracks().forEach((t) => t.stop())
    return
  }

  stream = s

  try {
    await s.getVideoTracks()[0]?.applyConstraints({
      advanced: [{ focusMode: 'continuous' }],
    } as unknown as MediaTrackConstraints)
  } catch {
    // Device does not support a focus mode
  }

  const video = videoEl.value
  video.srcObject = s

  try {
    await video.play()
    status.value = 'hold'
    scan(video)

    hintTimer = setTimeout(() => {
      if (!done) hint.value = 'hintSlow'
    }, 8000)
  } catch {
    error.value = 'cantStart'
  }
}

// ---------- Photo ----------

const MAX_SIDE = 2600
const THRESHOLDS = [80, 90, 100, 110, 120, 70, 130, 140]

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

async function firstIsbn(source: HTMLCanvasElement | ImageData): Promise<string | null> {
  const codes = await detector.detect(source)
  return codes.map((c) => c.rawValue).find(isValidIsbn13) ?? null
}

async function decodeFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file)

  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const plain = await firstIsbn(canvas)
    if (plain) return plain

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (const threshold of THRESHOLDS) {
      const code = await firstIsbn(binarize(pixels, threshold))
      if (code) return code
    }
    return null
  } finally {
    bitmap.close()
  }
}

async function onPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  decoding.value = true
  hint.value = ''

  try {
    const code = await decodeFile(file)
    if (code) finish(code)
    else {
      hint.value = 'hintNone'
    }
  } catch (e) {
    console.error('Photo decoding failed:', e)
    hint.value = 'hintUnreadable'
  } finally {
    decoding.value = false
  }
}

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <div class="scanner">
    <div class="viewport">
      <video ref="videoEl" class="video" playsinline muted></video>
      <div v-if="!error" class="frame" aria-hidden="true"></div>
    </div>

    <p class="status" :class="{ failed: error }" role="status">
      {{ t(`scanner.msg.${error || status}`) }}
    </p>
    <p v-if="hint" class="status hint" role="status">{{ t(`scanner.msg.${hint}`) }}</p>

    <div class="actions">
      <button type="button" class="photo" :disabled="decoding" @click="fileEl?.click()">
        <template v-if="!decoding">
          <img src="@/assets/icon/add_a_photo.png" :alt="t('scanner.photoAlt')" />
          <span>{{ t('scanner.takePhoto') }}</span>
        </template>
        <template v-else>{{ t('scanner.reading') }}</template>
      </button>
      <button type="button" class="cancel" @click="emit('close')">{{ t('common.cancel') }}</button>
    </div>

    <input
      ref="fileEl"
      type="file"
      accept="image/*"
      capture="environment"
      hidden
      @change="onPhoto"
    />
  </div>
</template>

<style scoped>
.scanner {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.viewport {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  overflow: hidden;
  background: #2b2c2f;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.frame {
  position: absolute;
  inset: 25% 10%;
  border: 2px solid #b23a3a;
  border-radius: 6px;
  box-shadow: 0 0 0 100vmax #00000050;
  pointer-events: none;
}

.status {
  font-size: 14px;
  color: #8b8d92;
}

.status.failed,
.status.hint {
  color: #b23a3a;
}

.actions {
  display: flex;
  gap: 8px;
}

.photo,
.cancel {
  padding: 8px 16px;
  border: 1px solid #b23a3a;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
}

.photo {
  background: #b23a3a;
  color: #f3f2f1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;

  &:hover {
    background: #2b2c2f;
    border-color: #2b2c2f;
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
}

.photo img {
  height: 20px;
  object-fit: contain;
}

.cancel {
  background: transparent;
  color: #b23a3a;

  &:hover {
    background: #b23a3a20;
  }
}
</style>
