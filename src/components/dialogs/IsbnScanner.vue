<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { decodeIsbnFromFile, detectIsbns } from '@/utils/barcode'
import { enableContinuousFocus, openCamera, stopStream } from '@/utils/camera'

const { t } = useI18n()

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

let stream: MediaStream | null = null
let stopped = false
let done = false
let lastRead = ''
let hintTimer: ReturnType<typeof setTimeout> | undefined

function stop() {
  stopped = true
  clearTimeout(hintTimer)
  stopStream(stream)
  stream = null
}

function finish(code: string) {
  if (done) return
  done = true
  stop()
  emit('detected', code)
}

// ---------- Live camera ----------

// A code counts once it was read in two consecutive frames
async function readFrame(video: HTMLVideoElement) {
  const codes = await detectIsbns(video)
  const confirmed = codes.find((code) => code === lastRead)

  if (confirmed) finish(confirmed)
  else lastRead = codes[0] ?? lastRead
}

async function tick(video: HTMLVideoElement) {
  if (stopped) return
  try {
    if (video.readyState >= 2) await readFrame(video)
  } catch (e) {
    console.error('Barcode detection failed:', e)
    stop()
    error.value = 'loadFailed'
    return
  }
  if (!stopped) setTimeout(() => tick(video), 100)
}

async function attachStream(s: MediaStream, video: HTMLVideoElement) {
  stream = s
  await enableContinuousFocus(s)
  video.srcObject = s
  await video.play()
  status.value = 'hold'
  void tick(video)
  hintTimer = setTimeout(() => {
    if (!done) hint.value = 'hintSlow'
  }, 8000)
}

async function play(s: MediaStream) {
  const video = videoEl.value
  if (stopped || !video) return stopStream(s)
  try {
    await attachStream(s, video)
  } catch {
    error.value = 'cantStart'
  }
}

async function start() {
  const result = await openCamera()
  if (typeof result === 'string') error.value = result
  else await play(result)
}

// ---------- Photo ----------

async function decodePhoto(file: File) {
  decoding.value = true
  hint.value = ''
  try {
    const code = await decodeIsbnFromFile(file)
    if (code) finish(code)
    else hint.value = 'hintNone'
  } catch (e) {
    console.error('Photo decoding failed:', e)
    hint.value = 'hintUnreadable'
  } finally {
    decoding.value = false
  }
}

async function onPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) await decodePhoto(file)
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
