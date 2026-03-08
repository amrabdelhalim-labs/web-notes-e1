/**
 * useDeviceId Hook Tests
 *
 * Validates:
 *   - Generates and persists a UUID in localStorage
 *   - Returns the same ID across re-renders
 *   - Detects browser and OS from navigator.userAgent
 *   - Builds a name string from browser + OS
 */

import { renderHook } from '@testing-library/react';
import { useDeviceId } from '@/app/hooks/useDeviceId';

const STORAGE_KEY = 'device-id';

beforeEach(() => {
  localStorage.clear();
});

describe('useDeviceId', () => {
  // ── ID generation ─────────────────────────────────────────────────────────

  it('generates a UUID and stores it in localStorage', () => {
    const { result } = renderHook(() => useDeviceId());

    expect(result.current.deviceId).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(result.current.deviceId);
  });

  it('returns the same ID on subsequent renders', () => {
    const { result, rerender } = renderHook(() => useDeviceId());
    const first = result.current.deviceId;

    rerender();
    expect(result.current.deviceId).toBe(first);
  });

  it('reuses an existing ID from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'pre-existing-id');
    const { result } = renderHook(() => useDeviceId());
    expect(result.current.deviceId).toBe('pre-existing-id');
  });

  // ── Browser detection ─────────────────────────────────────────────────────

  it('detects Chrome browser', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36',
    });
    const { result } = renderHook(() => useDeviceId());
    expect(result.current.browser).toBe('Chrome');
  });

  it('detects Edge browser', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 Chrome/120.0.0.0 Edg/120.0.0.0',
    });
    const { result } = renderHook(() => useDeviceId());
    expect(result.current.browser).toBe('Edge');
  });

  it('detects Firefox browser', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; rv:121.0) Gecko/20100101 Firefox/121.0',
    });
    const { result } = renderHook(() => useDeviceId());
    expect(result.current.browser).toBe('Firefox');
  });

  // ── OS detection ──────────────────────────────────────────────────────────

  it('detects Windows OS', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
    });
    const { result } = renderHook(() => useDeviceId());
    expect(result.current.os).toBe('Windows');
  });

  it('detects Android OS', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile Safari/537.36',
    });
    const { result } = renderHook(() => useDeviceId());
    expect(result.current.os).toBe('Android');
  });

  it('detects macOS', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Mac OS X 14_0) Safari/605.1.15',
    });
    const { result } = renderHook(() => useDeviceId());
    expect(result.current.os).toBe('macOS');
  });

  // ── Name derivation ───────────────────────────────────────────────────────

  it('builds name as "browser — os"', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36',
    });
    const { result } = renderHook(() => useDeviceId());
    expect(result.current.name).toBe('Chrome — Windows');
  });

  it('returns "Unknown" for unrecognized user agents', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'CustomBot/1.0',
    });
    const { result } = renderHook(() => useDeviceId());
    expect(result.current.browser).toBe('Unknown');
    expect(result.current.os).toBe('Unknown');
  });
});
