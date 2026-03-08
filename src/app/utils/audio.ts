/**
 * Audio Utilities
 *
 * Helpers for converting audio between Blob and Base64 formats.
 */

/** Convert a Blob (from MediaRecorder) to a Base64 string. */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:audio/webm;base64,")
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Convert a Base64 string back to a Blob. */
export function base64ToBlob(base64: string, mimeType = 'audio/webm'): Blob {
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return new Blob([buffer], { type: mimeType });
}

/** Create a temporary object URL from a Base64 string for playback. */
export function createAudioUrl(base64: string, mimeType = 'audio/webm'): string {
  const blob = base64ToBlob(base64, mimeType);
  return URL.createObjectURL(blob);
}

/** Format seconds to mm:ss display. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
