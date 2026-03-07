/**
 * Audio Utilities Tests
 *
 * Tests for formatDuration and base64ToBlob.
 * (blobToBase64 and createAudioUrl depend on FileReader/URL.createObjectURL
 * which require deeper mocking — tested indirectly via integration tests.)
 */

import { formatDuration, base64ToBlob } from '@/app/utils/audio';

// ─── formatDuration ─────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats 0 seconds as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('formats 5 seconds as 00:05', () => {
    expect(formatDuration(5)).toBe('00:05');
  });

  it('formats 60 seconds as 01:00', () => {
    expect(formatDuration(60)).toBe('01:00');
  });

  it('formats 90 seconds as 01:30', () => {
    expect(formatDuration(90)).toBe('01:30');
  });

  it('formats 3661 seconds as 61:01', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('handles decimal seconds by flooring', () => {
    expect(formatDuration(5.7)).toBe('00:05');
  });

  it('pads single digit minutes', () => {
    expect(formatDuration(65)).toBe('01:05');
  });
});

// ─── base64ToBlob ───────────────────────────────────────────────────────────

describe('base64ToBlob', () => {
  // "SGVsbG8=" is base64 for "Hello"
  const b64 = 'SGVsbG8=';

  it('creates a Blob from base64 string', () => {
    const blob = base64ToBlob(b64);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('creates blob with default mime type audio/webm', () => {
    const blob = base64ToBlob(b64);
    expect(blob.type).toBe('audio/webm');
  });

  it('creates blob with custom mime type', () => {
    const blob = base64ToBlob(b64, 'audio/mp3');
    expect(blob.type).toBe('audio/mp3');
  });

  it('decodes correct content length', () => {
    // "Hello" = 5 bytes
    const blob = base64ToBlob(b64);
    expect(blob.size).toBe(5);
  });
});
