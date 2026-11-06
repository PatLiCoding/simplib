/**
 * @file camera.ts
 * @description Provides utilities for managing device media streams, opening camera streams
 * with constraints, enabling continuous autofocus, and stopping media tracks.
 */

export type CameraError = 'noLive' | 'denied' | 'noCamera'

const CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
}

/**
 * Requests and opens a camera media stream, returning the stream or a specific camera error code.
 */
export async function openCamera(): Promise<MediaStream | CameraError> {
  if (!navigator.mediaDevices?.getUserMedia) return 'noLive'
  try {
    return await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
  } catch (e) {
    return (e as DOMException).name === 'NotAllowedError' ? 'denied' : 'noCamera'
  }
}

/**
 * Enables continuous focus mode on the video track of a media stream if supported.
 */
export async function enableContinuousFocus(stream: MediaStream) {
  try {
    await stream.getVideoTracks()[0]?.applyConstraints({
      advanced: [{ focusMode: 'continuous' }],
    } as unknown as MediaTrackConstraints)
  } catch {
    // Device does not support a focus mode
  }
}

/**
 * Stops all media tracks associated with the given media stream.
 */
export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}
