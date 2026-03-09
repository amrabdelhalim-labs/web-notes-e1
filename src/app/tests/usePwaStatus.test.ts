/**
 * usePwaStatus — trust-gate + install-flow + pwa-enabled gate integration tests
 *
 * Verifies:
 *   - installState gated by device trust AND pwa-enabled flag
 *   - triggerInstall lifecycle (prompt → accept/dismiss → state reset)
 *   - appinstalled event clears deferred prompt
 *   - visibilitychange syncs trust from localStorage
 *   - pwa:activation-changed event resets states on deactivation
 */

import { renderHook, act } from '@testing-library/react';
import { usePwaStatus } from '@/app/hooks/usePwaStatus';
import { PWA_ENABLED_KEY, PWA_ACTIVATION_EVENT } from '@/app/context/PwaActivationContext';

// Mock ServiceWorker API
const mockGetRegistration = vi.fn();
Object.defineProperty(navigator, 'serviceWorker', {
  configurable: true,
  value: {
    getRegistration: mockGetRegistration,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

beforeEach(() => {
  localStorage.clear();
  // Most tests need PWA activated to test SW / install behaviour.
  localStorage.setItem(PWA_ENABLED_KEY, 'true');
  mockGetRegistration.mockResolvedValue(undefined);
});

// ─── pwa-enabled gate ─────────────────────────────────────────────────────────

describe('pwa-enabled gate', () => {
  it('returns inactive swState when pwa-enabled is not set', () => {
    localStorage.removeItem(PWA_ENABLED_KEY);
    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.swState).toBe('inactive');
  });

  it('returns not-installable installState when pwa-enabled is not set', () => {
    localStorage.removeItem(PWA_ENABLED_KEY);
    localStorage.setItem('device-trusted', 'true');
    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    expect(result.current.installState).toBe('not-installable');
  });

  it('isReady is false when pwa-enabled is not set even if SW is active', async () => {
    localStorage.removeItem(PWA_ENABLED_KEY);
    localStorage.setItem('device-trusted', 'true');
    mockGetRegistration.mockResolvedValue({
      active: { state: 'activated', addEventListener: vi.fn() },
      installing: null,
      waiting: null,
      addEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.isReady).toBe(false);
  });

  it('resets all states when pwa:activation-changed fires with activated=false', () => {
    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      localStorage.setItem('device-trusted', 'true');
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    // Deactivation event
    act(() => {
      window.dispatchEvent(
        new CustomEvent(PWA_ACTIVATION_EVENT, { detail: { activated: false } }),
      );
    });

    expect(result.current.swState).toBe('inactive');
    expect(result.current.installState).toBe('not-installable');
    expect(result.current.triggerInstall).toBeNull();
  });
});

describe('usePwaStatus trust gate', () => {
  it('defaults to not-installable when not standalone', () => {
    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.installState).toBe('not-installable');
  });

  it('stays not-installable on beforeinstallprompt when device is not trusted', () => {
    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    expect(result.current.installState).toBe('not-installable');
  });

  it('becomes installable on beforeinstallprompt when device is trusted', () => {
    localStorage.setItem('device-trusted', 'true');
    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    expect(result.current.installState).toBe('installable');
  });

  it('becomes installable when trust is added after prompt already fired', async () => {
    const { result } = renderHook(() => usePwaStatus());

    // Browser reported install capability first while the device is untrusted.
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    expect(result.current.installState).toBe('not-installable');

    // User trusts device later; hook should promote state without waiting for another prompt.
    act(() => {
      localStorage.setItem('device-trusted', 'true');
      window.dispatchEvent(new CustomEvent('device-trust-changed', { detail: { trusted: true } }));
    });

    await vi.waitFor(() => {
      expect(result.current.installState).toBe('installable');
    });
  });

  it('returns swState based on ServiceWorker registration', async () => {
    mockGetRegistration.mockResolvedValue({
      active: { state: 'activated', addEventListener: vi.fn() },
      installing: null,
      waiting: null,
      addEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePwaStatus());

    // Wait for promise to resolve
    await vi.waitFor(() => {
      expect(result.current.swState).toBe('active');
    });
  });

  it('marks swState as inactive when no registration exists', async () => {
    mockGetRegistration.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePwaStatus());

    await vi.waitFor(() => {
      expect(result.current.swState).toBe('inactive');
    });
  });

  it('isReady is true when SW is active and installState is not not-installable', async () => {
    localStorage.setItem('device-trusted', 'true');
    mockGetRegistration.mockResolvedValue({
      active: { state: 'activated', addEventListener: vi.fn() },
      installing: null,
      waiting: null,
      addEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    await vi.waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
  });
});

// ─── triggerInstall ───────────────────────────────────────────────────────────

describe('triggerInstall', () => {
  it('is null when installState is not-installable', () => {
    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.triggerInstall).toBeNull();
  });

  it('is null when standalone (already installed)', () => {
    // Simulate standalone mode
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList);

    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.triggerInstall).toBeNull();

    vi.restoreAllMocks();
  });

  it('is a function when installState is installable', async () => {
    localStorage.setItem('device-trusted', 'true');
    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      const e = new Event('beforeinstallprompt');
      Object.assign(e, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      });
      window.dispatchEvent(e);
    });

    await vi.waitFor(() => expect(result.current.installState).toBe('installable'));
    expect(typeof result.current.triggerInstall).toBe('function');
  });

  it('calls prompt() and returns true when user accepts', async () => {
    localStorage.setItem('device-trusted', 'true');
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const userChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      const e = new Event('beforeinstallprompt');
      Object.assign(e, { prompt: mockPrompt, userChoice });
      window.dispatchEvent(e);
    });

    await vi.waitFor(() => expect(result.current.installState).toBe('installable'));

    let accepted = false;
    await act(async () => {
      accepted = await result.current.triggerInstall!();
    });

    expect(mockPrompt).toHaveBeenCalledOnce();
    expect(accepted).toBe(true);
    // After accepting, installState should revert to not-installable
    expect(result.current.installState).toBe('not-installable');
  });

  it('calls prompt() and returns false when user dismisses', async () => {
    localStorage.setItem('device-trusted', 'true');
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const userChoice = Promise.resolve({ outcome: 'dismissed' as const, platform: 'web' });

    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      const e = new Event('beforeinstallprompt');
      Object.assign(e, { prompt: mockPrompt, userChoice });
      window.dispatchEvent(e);
    });

    await vi.waitFor(() => expect(result.current.installState).toBe('installable'));

    let dismissed = true;
    await act(async () => {
      dismissed = await result.current.triggerInstall!();
    });

    expect(dismissed).toBe(false);
    // Prompt reference kept so user can try again — installState stays installable
    expect(result.current.installState).toBe('installable');
  });

  it('returns false safely when no deferred prompt is available', async () => {
    localStorage.setItem('device-trusted', 'true');
    const { result } = renderHook(() => usePwaStatus());

    // Force installState to installable by firing the event, but then
    // simulate prompt already used by accepting
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const userChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

    act(() => {
      const e = new Event('beforeinstallprompt');
      Object.assign(e, { prompt: mockPrompt, userChoice });
      window.dispatchEvent(e);
    });

    await vi.waitFor(() => expect(result.current.installState).toBe('installable'));

    // Accept first time — clears the prompt
    await act(async () => {
      await result.current.triggerInstall!();
    });

    // installState now not-installable, triggerInstall is null — no second call possible
    expect(result.current.triggerInstall).toBeNull();
  });
});

// ─── appinstalled event ───────────────────────────────────────────────────────

describe('appinstalled event', () => {
  it('clears canInstall so installState becomes not-installable', async () => {
    localStorage.setItem('device-trusted', 'true');
    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      const e = new Event('beforeinstallprompt');
      Object.assign(e, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      });
      window.dispatchEvent(e);
    });

    await vi.waitFor(() => expect(result.current.installState).toBe('installable'));

    // Browser fires appinstalled after user installs from another UI entry point
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.installState).toBe('not-installable');
    expect(result.current.triggerInstall).toBeNull();
  });
});

// ─── visibilitychange trust sync ─────────────────────────────────────────────

describe('visibilitychange trust sync', () => {
  it('re-reads trust from localStorage when tab becomes visible', async () => {
    // Start without trust
    const { result } = renderHook(() => usePwaStatus());
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    expect(result.current.installState).toBe('not-installable');

    // Another session grants trust and writes to localStorage
    localStorage.setItem('device-trusted', 'true');

    // Simulate tab coming back into focus
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await vi.waitFor(() => expect(result.current.installState).toBe('installable'));
  });

  it('does not change state when tab becomes hidden', async () => {
    localStorage.setItem('device-trusted', 'true');
    const { result } = renderHook(() => usePwaStatus());
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    await vi.waitFor(() => expect(result.current.installState).toBe('installable'));

    // Tab hides — should not re-read or change anything
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.installState).toBe('installable');
  });
});

// ─── standalone-untrusted state ───────────────────────────────────────────────
// Covers the scenario where the user installs the PWA via the browser UI (e.g.
// the address-bar install icon) BEFORE the device has been trusted in the app.

describe('standalone-untrusted state', () => {
  const standaloneMedia = vi.fn();

  /** Spy on matchMedia so only the standalone query returns matches=true */
  function mockStandalone() {
    standaloneMedia.mockReturnValue({
      matches: true,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList);
    vi.spyOn(window, 'matchMedia').mockImplementation(standaloneMedia);
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('installState is standalone-untrusted when standalone and not trusted', () => {
    mockStandalone();
    // localStorage has no 'device-trusted' key (cleared in beforeEach)
    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.installState).toBe('standalone-untrusted');
  });

  it('isReady is false for standalone-untrusted even when SW is active', async () => {
    mockStandalone();
    mockGetRegistration.mockResolvedValue({
      active: { state: 'activated', addEventListener: vi.fn() },
      installing: null,
      waiting: null,
      addEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePwaStatus());

    await vi.waitFor(() => expect(result.current.swState).toBe('active'));
    expect(result.current.installState).toBe('standalone-untrusted');
    expect(result.current.isReady).toBe(false);
  });

  it('triggerInstall is null for standalone-untrusted (already installed)', () => {
    mockStandalone();
    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.installState).toBe('standalone-untrusted');
    expect(result.current.triggerInstall).toBeNull();
  });

  it('upgrades to standalone when trust is granted while in standalone mode', async () => {
    mockStandalone();
    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.installState).toBe('standalone-untrusted');

    // Simulate the user going to Profile → trusting the device → tab regains focus
    localStorage.setItem('device-trusted', 'true');

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await vi.waitFor(() => expect(result.current.installState).toBe('standalone'));
    // (isReady also requires swState === 'active', tested separately)
  });
});
