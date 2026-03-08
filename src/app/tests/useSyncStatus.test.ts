/**
 * useSyncStatus Hook Tests
 *
 * Verifies pending-operation tracking: counts, hasFailures flag,
 * the refresh function, periodic polling, and clean-up on unmount.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useSyncStatus } from '@/app/hooks/useSyncStatus';

vi.mock('@/app/lib/db', () => ({
  hasPendingOps: vi.fn(),
  getPendingOps: vi.fn(),
}));

import { hasPendingOps, getPendingOps } from '@/app/lib/db';

const mockHasPendingOps = vi.mocked(hasPendingOps);
const mockGetPendingOps = vi.mocked(getPendingOps);

beforeEach(() => {
  vi.clearAllMocks();
  mockHasPendingOps.mockResolvedValue(false);
  mockGetPendingOps.mockResolvedValue([]);
});

// ─── Initial state ───────────────────────────────────────────────────────────

describe('initial state', () => {
  it('starts with zero pending count, hasPending false, hasFailures false', async () => {
    const { result } = renderHook(() => useSyncStatus());

    // Wait for the initial async check to complete
    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.pendingCount).toBe(0);
    expect(result.current.hasPending).toBe(false);
    expect(result.current.hasFailures).toBe(false);
  });

  it('calls hasPendingOps on mount', async () => {
    renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(mockHasPendingOps).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call getPendingOps when hasPendingOps returns false', async () => {
    mockHasPendingOps.mockResolvedValue(false);
    renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(mockHasPendingOps).toHaveBeenCalled();
    });

    expect(mockGetPendingOps).not.toHaveBeenCalled();
  });
});

// ─── hasPending ──────────────────────────────────────────────────────────────

describe('hasPending', () => {
  it('becomes true when pending ops exist', async () => {
    mockHasPendingOps.mockResolvedValue(true);
    mockGetPendingOps.mockResolvedValue([
      { id: 1, type: 'create', payload: {}, timestamp: Date.now() },
      { id: 2, type: 'update', noteId: 'n1', payload: {}, timestamp: Date.now() },
    ]);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.hasPending).toBe(true);
    expect(result.current.pendingCount).toBe(2);
  });

  it('reflects the exact count of pending ops', async () => {
    mockHasPendingOps.mockResolvedValue(true);
    mockGetPendingOps.mockResolvedValue([
      { id: 1, type: 'create', payload: {}, timestamp: Date.now() },
      { id: 2, type: 'delete', noteId: 'n2', timestamp: Date.now() },
      { id: 3, type: 'update', noteId: 'n3', payload: {}, timestamp: Date.now() },
    ]);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.pendingCount).toBe(3);
  });
});

// ─── hasFailures ─────────────────────────────────────────────────────────────

describe('hasFailures', () => {
  it('becomes true when any op has failureCount > 0', async () => {
    mockHasPendingOps.mockResolvedValue(true);
    mockGetPendingOps.mockResolvedValue([
      { id: 1, type: 'create', payload: {}, timestamp: Date.now(), failureCount: 2 },
    ]);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.hasFailures).toBe(true);
  });

  it('stays false when failureCount is 0 for all ops', async () => {
    mockHasPendingOps.mockResolvedValue(true);
    mockGetPendingOps.mockResolvedValue([
      { id: 1, type: 'create', payload: {}, timestamp: Date.now(), failureCount: 0 },
      { id: 2, type: 'update', noteId: 'n1', payload: {}, timestamp: Date.now() },
    ]);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.hasFailures).toBe(false);
  });

  it('stays false when failureCount is undefined for all ops', async () => {
    mockHasPendingOps.mockResolvedValue(true);
    mockGetPendingOps.mockResolvedValue([
      { id: 1, type: 'create', payload: {}, timestamp: Date.now() },
    ]);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.hasFailures).toBe(false);
  });

  it('becomes true when at least one op has failureCount > 0 among multiple', async () => {
    mockHasPendingOps.mockResolvedValue(true);
    mockGetPendingOps.mockResolvedValue([
      { id: 1, type: 'create', payload: {}, timestamp: Date.now(), failureCount: 0 },
      { id: 2, type: 'update', noteId: 'n1', payload: {}, timestamp: Date.now(), failureCount: 1 },
      { id: 3, type: 'delete', noteId: 'n2', timestamp: Date.now() },
    ]);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.hasFailures).toBe(true);
  });
});

// ─── refresh ─────────────────────────────────────────────────────────────────

describe('refresh', () => {
  it('re-runs checkPendingOps when called', async () => {
    mockHasPendingOps.mockResolvedValue(false);
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    const callsAfterMount = mockHasPendingOps.mock.calls.length;

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockHasPendingOps.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });

  it('updates pendingCount after refresh reveals new ops', async () => {
    // Initially no ops
    mockHasPendingOps.mockResolvedValue(false);
    const { result } = renderHook(() => useSyncStatus());
    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.pendingCount).toBe(0);

    // Now ops appear
    mockHasPendingOps.mockResolvedValue(true);
    mockGetPendingOps.mockResolvedValue([
      { id: 1, type: 'create', payload: {}, timestamp: Date.now() },
    ]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.pendingCount).toBe(1);
    expect(result.current.hasPending).toBe(true);
  });

  it('resetting to zero after refresh when queue is cleared', async () => {
    mockHasPendingOps.mockResolvedValue(true);
    mockGetPendingOps.mockResolvedValue([
      { id: 1, type: 'create', payload: {}, timestamp: Date.now() },
    ]);

    const { result } = renderHook(() => useSyncStatus());
    await waitFor(() => expect(result.current.pendingCount).toBe(1));

    // Queue cleared
    mockHasPendingOps.mockResolvedValue(false);
    mockGetPendingOps.mockResolvedValue([]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.pendingCount).toBe(0);
    expect(result.current.hasPending).toBe(false);
  });
});

// ─── Polling interval ────────────────────────────────────────────────────────

describe('polling interval', () => {
  it('polls checkPendingOps every 10 seconds', async () => {
    vi.useFakeTimers();
    mockHasPendingOps.mockResolvedValue(false);

    renderHook(() => useSyncStatus());

    // Flush initial call
    await act(async () => {
      await Promise.resolve();
    });
    const callsAfterMount = mockHasPendingOps.mock.calls.length;

    // Advance by one polling interval
    await act(async () => {
      vi.advanceTimersByTime(10000);
      await Promise.resolve();
    });

    expect(mockHasPendingOps.mock.calls.length).toBeGreaterThan(callsAfterMount);

    vi.useRealTimers();
  });

  it('clears the polling interval on unmount', async () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useSyncStatus());

    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    vi.useRealTimers();
    clearIntervalSpy.mockRestore();
  });
});

// ─── Error resilience ────────────────────────────────────────────────────────

describe('error resilience', () => {
  it('handles db errors gracefully and resets pendingCount to 0', async () => {
    mockHasPendingOps.mockRejectedValue(new Error('IndexedDB error'));
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));

    expect(result.current.pendingCount).toBe(0);
    expect(result.current.hasPending).toBe(false);
  });
});
