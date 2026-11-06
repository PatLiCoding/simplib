export type CameraError = 'noLive' | 'denied' | 'noCamera'

const CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
}

// Returns the stream, or the reason why there is none
export async function openCamera(): Promise<MediaStream | CameraError> {
  if (!navigator.mediaDevices?.getUserMedia) return 'noLive'
  try {
    return await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
  } catch (e) {
    return (e as DOMException).name === 'NotAllowedError' ? 'denied' : 'noCamera'
  }
}

export async function enableContinuousFocus(stream: MediaStream) {
  try {
    await stream.getVideoTracks()[0]?.applyConstraints({
      advanced: [{ focusMode: 'continuous' }],
    } as unknown as MediaTrackConstraints)
  } catch {
    // Device does not support a focus mode
  }
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}
