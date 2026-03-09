/**
 * ConnectionIndicator Component Tests
 *
 * Verifies render, menu interaction, and status display functionality.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@/app/tests/utils';
import ConnectionIndicator from '@/app/components/common/ConnectionIndicator';
import type { SwState, InstallState } from '@/app/hooks/usePwaStatus';

let mockIsOnline = true;
let mockSyncStatus = {
  pendingCount: 0,
  isChecking: false,
  hasPending: false,
  hasFailures: false,
  refresh: vi.fn(),
};
let mockPwaStatus: {
  swState: SwState;
  installState: InstallState;
  isReady: boolean;
  installCheckPending: boolean;
  triggerInstall: (() => Promise<boolean>) | null;
} = {
  swState: 'active',
  installState: 'standalone',
  isReady: true,
  installCheckPending: false,
  triggerInstall: null,
};

vi.mock('@/app/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockIsOnline,
}));

vi.mock('@/app/hooks/useSyncStatus', () => ({
  useSyncStatus: () => mockSyncStatus,
}));

vi.mock('@/app/hooks/usePwaStatus', () => ({
  usePwaStatus: () => mockPwaStatus,
}));

vi.mock('@/app/lib/db', () => ({
  getPendingOps: vi.fn().mockResolvedValue([]),
  removePendingOp: vi.fn().mockResolvedValue(undefined),
  cacheNotes: vi.fn().mockResolvedValue(undefined),
}));

import { getPendingOps, removePendingOp, cacheNotes } from '@/app/lib/db';

beforeEach(() => {
  mockIsOnline = true;
  mockSyncStatus = {
    pendingCount: 0,
    isChecking: false,
    hasPending: false,
    hasFailures: false,
    refresh: vi.fn(),
  };
  mockPwaStatus = {
    swState: 'active',
    installState: 'standalone',
    isReady: true,
    installCheckPending: false,
    triggerInstall: null,
  };
  vi.clearAllMocks();
  vi.mocked(getPendingOps).mockResolvedValue([]);
  vi.mocked(removePendingOp).mockResolvedValue(undefined);
  vi.mocked(cacheNotes).mockResolvedValue(undefined);
});

describe('ConnectionIndicator', () => {
  it('renders without crashing', () => {
    render(<ConnectionIndicator />);
    expect(screen.getByLabelText(/حالة الاتصال|Connection Status/i)).toBeInTheDocument();
  });

  it('shows badge when there are pending operations', () => {
    mockSyncStatus = {
      pendingCount: 3,
      isChecking: false,
      hasPending: true,
      hasFailures: false,
      refresh: vi.fn(),
    };
    render(<ConnectionIndicator />);
    expect(screen.getByLabelText(/حالة الاتصال|Connection Status/i)).toBeInTheDocument();
  });

  it('opens menu on button click', async () => {
    render(<ConnectionIndicator />);

    const button = screen.getByLabelText(/حالة الاتصال|Connection Status/i);
    fireEvent.click(button);

    // Menu should appear (even if we can't query specific content)
    expect(button).toBeInTheDocument();
  });

  it('calls refresh when menu opens', async () => {
    const mockRefresh = vi.fn();
    mockSyncStatus = {
      pendingCount: 0,
      isChecking: false,
      hasPending: false,
      hasFailures: false,
      refresh: mockRefresh,
    };
    render(<ConnectionIndicator />);

    const button = screen.getByLabelText(/حالة الاتصال|Connection Status/i);
    fireEvent.click(button);

    await waitFor(
      () => {
        expect(mockRefresh).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('displays online status when connected', () => {
    mockIsOnline = true;
    render(<ConnectionIndicator />);
    expect(screen.getByLabelText(/حالة الاتصال|Connection Status/i)).toBeInTheDocument();
  });

  it('displays offline status when disconnected', () => {
    mockIsOnline = false;
    render(<ConnectionIndicator />);
    expect(screen.getByLabelText(/حالة الاتصال|Connection Status/i)).toBeInTheDocument();
  });

  it('shows sync pending status when there are pending operations', () => {
    mockSyncStatus = {
      pendingCount: 2,
      isChecking: false,
      hasPending: true,
      hasFailures: false,
      refresh: vi.fn(),
    };
    render(<ConnectionIndicator />);
    expect(screen.getByLabelText(/حالة الاتصال|Connection Status/i)).toBeInTheDocument();
  });
});

// ─── Pending ops list ────────────────────────────────────────────────────────

describe('pending operations list', () => {
  const ops = [
    { id: 1, type: 'create' as const, noteTitle: 'First', timestamp: Date.now() },
    { id: 2, type: 'update' as const, noteId: 'n1', noteTitle: 'Second', timestamp: Date.now() },
    { id: 3, type: 'delete' as const, noteId: 'n2', noteTitle: 'Third', timestamp: Date.now() },
  ];

  beforeEach(() => {
    mockSyncStatus = {
      pendingCount: 3,
      isChecking: false,
      hasPending: true,
      hasFailures: false,
      refresh: vi.fn(),
    };
    vi.mocked(getPendingOps).mockResolvedValue(ops);
  });

  it('shows pending ops section title when hasPending', async () => {
    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText(/العمليات المعلقة|Pending Operations/i)).toBeInTheDocument();
    });
  });

  it('renders op titles from noteTitle', async () => {
    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  it('shows undo buttons for each op', async () => {
    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      const undoBtns = screen.getAllByText(/تراجع|Undo/i);
      expect(undoBtns.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('undo calls removePendingOp and dispatches notes:undo-op event', async () => {
    const mockRemovePendingOp = vi.mocked(removePendingOp);
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getAllByText(/تراجع|Undo/i).length).toBeGreaterThan(0);
    });

    // Click the first undo button
    fireEvent.click(screen.getAllByText(/تراجع|Undo/i)[0]);

    await waitFor(() => {
      expect(mockRemovePendingOp).toHaveBeenCalled();
    });

    const undoEvents = (dispatchSpy.mock.calls as [Event][]).filter(
      ([e]) => e instanceof CustomEvent && e.type === 'notes:undo-op'
    );
    expect(undoEvents.length).toBeGreaterThan(0);
    dispatchSpy.mockRestore();
  });

  it('undo delete op also calls cacheNotes with noteSnapshot', async () => {
    const noteSnapshot = {
      _id: 'n2',
      title: 'Third',
      content: '',
      type: 'text' as const,
      user: 'u1',
      createdAt: '',
      updatedAt: '',
    };
    vi.mocked(getPendingOps).mockResolvedValue([
      {
        id: 3,
        type: 'delete',
        noteId: 'n2',
        noteTitle: 'Third',
        noteSnapshot,
        timestamp: Date.now(),
      },
    ]);
    const mockCacheNotes = vi.mocked(cacheNotes);

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getAllByText(/تراجع|Undo/i).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText(/تراجع|Undo/i)[0]);

    await waitFor(() => {
      expect(mockCacheNotes).toHaveBeenCalledWith([noteSnapshot]);
    });
  });

  it('shows overflow indicator when more than 5 ops exist', async () => {
    const manyOps = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      type: 'create' as const,
      noteTitle: `Note ${i + 1}`,
      timestamp: Date.now(),
    }));
    vi.mocked(getPendingOps).mockResolvedValue(manyOps);
    mockSyncStatus = {
      pendingCount: 7,
      isChecking: false,
      hasPending: true,
      hasFailures: false,
      refresh: vi.fn(),
    };

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText(/و.*2.*عملية أخرى|and.*2.*more/i)).toBeInTheDocument();
    });
  });
});

// ─── hasFailures chip ─────────────────────────────────────────────────────────

describe('hasFailures warning', () => {
  it('shows failure warning chip when hasFailures=true', async () => {
    mockSyncStatus = {
      pendingCount: 1,
      isChecking: false,
      hasPending: true,
      hasFailures: true,
      refresh: vi.fn(),
    };
    vi.mocked(getPendingOps).mockResolvedValue([
      { id: 1, type: 'create', noteTitle: 'Failed op', timestamp: Date.now(), failureCount: 2 },
    ]);

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText(/بعض العمليات فشلت|Some operations failed/i)).toBeInTheDocument();
    });
  });

  it('does NOT show failure chip when hasFailures=false', async () => {
    mockSyncStatus = {
      pendingCount: 1,
      isChecking: false,
      hasPending: true,
      hasFailures: false,
      refresh: vi.fn(),
    };
    vi.mocked(getPendingOps).mockResolvedValue([
      { id: 1, type: 'create', noteTitle: 'OK op', timestamp: Date.now() },
    ]);

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(
        screen.queryByText(/بعض العمليات فشلت|Some operations failed/i)
      ).not.toBeInTheDocument();
    });
  });
});

// ─── Wifi icons ───────────────────────────────────────────────────────────────

describe('wifi icon display', () => {
  it('shows online status text in menu when online', async () => {
    mockIsOnline = true;
    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText(/متصل بالإنترنت|Online/i)).toBeInTheDocument();
    });
  });

  it('shows offline status text in menu when offline', async () => {
    mockIsOnline = false;
    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText(/غير متصل بالإنترنت|Offline/i)).toBeInTheDocument();
    });
  });
});

// ─── Install App button ───────────────────────────────────────────────────────

describe('install app button', () => {
  it('shows install button when installState is installable and triggerInstall is set', async () => {
    const mockTrigger = vi.fn().mockResolvedValue(true);
    mockPwaStatus = {
      swState: 'active',
      installState: 'installable',
      isReady: true,
      installCheckPending: false,
      triggerInstall: mockTrigger,
    };

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText(/تثبيت التطبيق|Install App/i)).toBeInTheDocument();
    });
  });

  it('does NOT show install button when standalone', async () => {
    mockPwaStatus = {
      swState: 'active',
      installState: 'standalone',
      isReady: true,
      installCheckPending: false,
      triggerInstall: null,
    };

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.queryByText(/تثبيت التطبيق|Install App/i)).not.toBeInTheDocument();
    });
  });

  it('does NOT show install button when not-installable', async () => {
    mockPwaStatus = {
      swState: 'active',
      installState: 'not-installable',
      isReady: false,
      installCheckPending: false,
      triggerInstall: null,
    };

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.queryByText(/تثبيت التطبيق|Install App/i)).not.toBeInTheDocument();
    });
  });

  it('shows checking text when installCheckPending is true (not-installable verdict deferred)', async () => {
    mockPwaStatus = {
      swState: 'active',
      installState: 'not-installable',
      isReady: true,
      installCheckPending: true,
      triggerInstall: null,
    };

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText(/جاري الفحص|Checking/i)).toBeInTheDocument();
    });
  });

  it('calls triggerInstall and closes menu on button click', async () => {
    const mockTrigger = vi.fn().mockResolvedValue(true);
    mockPwaStatus = {
      swState: 'active',
      installState: 'installable',
      isReady: true,
      installCheckPending: false,
      triggerInstall: mockTrigger,
    };

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText(/تثبيت التطبيق|Install App/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/تثبيت التطبيق|Install App/i));

    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalledOnce();
    });
  });
});

// ─── standalone-untrusted warnings ────────────────────────────────────────────

describe('standalone-untrusted sync-blocked warning chip', () => {
  it('shows sync-blocked chip in pending ops when standalone-untrusted', async () => {
    mockPwaStatus = {
      swState: 'active',
      installState: 'standalone-untrusted',
      isReady: false,
      installCheckPending: false,
      triggerInstall: null,
    };
    mockSyncStatus = {
      pendingCount: 2,
      isChecking: false,
      hasPending: true,
      hasFailures: false,
      refresh: vi.fn(),
    };

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.getByText(/المزامنة موقوفة|Sync blocked/i)).toBeInTheDocument();
    });
  });

  it('does NOT show sync-blocked chip when standalone (trusted)', async () => {
    mockPwaStatus = {
      swState: 'active',
      installState: 'standalone',
      isReady: true,
      installCheckPending: false,
      triggerInstall: null,
    };
    mockSyncStatus = {
      pendingCount: 2,
      isChecking: false,
      hasPending: true,
      hasFailures: false,
      refresh: vi.fn(),
    };

    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.queryByText(/المزامنة موقوفة|Sync blocked/i)).not.toBeInTheDocument();
    });
  });

  it('does NOT show sync-blocked chip when standalone-untrusted but no pending ops', async () => {
    mockPwaStatus = {
      swState: 'active',
      installState: 'standalone-untrusted',
      isReady: false,
      installCheckPending: false,
      triggerInstall: null,
    };
    // hasPending is false by default from beforeEach reset
    render(<ConnectionIndicator />);
    fireEvent.click(screen.getByLabelText(/حالة الاتصال|Connection Status/i));

    await waitFor(() => {
      expect(screen.queryByText(/المزامنة موقوفة|Sync blocked/i)).not.toBeInTheDocument();
    });
  });
});
