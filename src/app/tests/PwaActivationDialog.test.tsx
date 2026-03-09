/**
 * PwaActivationDialog — unit tests
 *
 * Verifies:
 *   - Info phase is shown on open
 *   - Three feature list items are rendered
 *   - Cancel closes the dialog and resets state
 *   - Activate button triggers the activation flow
 *   - Stepper is shown during 'activating' phase
 *   - Success alert is shown after activation completes
 *   - Error alert is shown when activation fails
 *   - Retry re-triggers the activation
 *   - Dialog cannot be closed during activation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/app/tests/utils';
import PwaActivationDialog from '@/app/components/common/PwaActivationDialog';

const mockActivate = vi.fn();
const mockDeactivate = vi.fn();

vi.mock('@/app/context/PwaActivationContext', () => ({
  usePwaActivation: () => ({
    isActivated: false,
    isDeactivating: false,
    activate: mockActivate,
    deactivate: mockDeactivate,
  }),
  PwaActivationProvider: ({ children }: { children: React.ReactNode }) => children,
  PWA_ENABLED_KEY: 'pwa-enabled',
  PWA_ACTIVATION_EVENT: 'pwa:activation-changed',
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: activation succeeds instantly
  mockActivate.mockResolvedValue(undefined);
});

describe('PwaActivationDialog', () => {
  it('renders in info phase by default', () => {
    render(<PwaActivationDialog {...defaultProps} />);
    expect(screen.getByText(/Activate Offline Mode|تفعيل وضع عدم الاتصال/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Activate$|^تفعيل$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Cancel$|^إلغاء$/i })).toBeInTheDocument();
  });

  it('shows three feature list items in info phase', () => {
    render(<PwaActivationDialog {...defaultProps} />);
    expect(screen.getByText(/App identity|هوية التطبيق/i)).toBeInTheDocument();
    expect(screen.getByText(/Service Worker|عامل الخدمة/i)).toBeInTheDocument();
    expect(screen.getByText(/Local database|قاعدة البيانات/i)).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked in info phase', () => {
    render(<PwaActivationDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$|^إلغاء$/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows Stepper immediately when activation starts', async () => {
    render(<PwaActivationDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^Activate$|^تفعيل$/i }));

    // Stepper step labels are rendered as soon as phase changes to 'activating'
    expect(screen.getByText(/Registering app identity|تسجيل هوية/i)).toBeInTheDocument();

    // Wait for the activation flow to fully complete so the background timer
    // doesn't leak into subsequent tests and inflate mockActivate call counts.
    await waitFor(() => screen.getByRole('button', { name: /^Done$|^تم$/i }), { timeout: 3000 });
  }, 8000);

  it('calls activate() and shows success after all steps complete', async () => {
    render(<PwaActivationDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^Activate$|^تفعيل$/i }));

    // Wait for the "Done" button — appears only when phase === 'done'
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /^Done$|^تم$/i })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(mockActivate).toHaveBeenCalledTimes(1);
    // Success alert text contains the succesTitle translation
    expect(screen.getByText(/تم تفعيل|Offline mode activated/i)).toBeInTheDocument();
  }, 10000);

  it('shows error alert when activation fails', async () => {
    mockActivate.mockRejectedValue(new Error('SW registration failed'));
    render(<PwaActivationDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^Activate$|^تفعيل$/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/Activation failed|فشل التفعيل/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(screen.getByText('SW registration failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Retry$|^إعادة/i })).toBeInTheDocument();
  });

  it('retries activation when Retry is clicked', async () => {
    mockActivate.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(undefined);

    render(<PwaActivationDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^Activate$|^تفعيل$/i }));

    // Wait for error state
    await waitFor(() => screen.getByRole('button', { name: /^Retry$|^إعادة/i }), { timeout: 2000 });

    // Retry
    fireEvent.click(screen.getByRole('button', { name: /^Retry$|^إعادة/i }));

    await waitFor(
      () => {
        // ar.json successTitle: "تم تفعيل وضع عدم الاتصال!" (note: تم تفعيل, not تم التفعيل)
        expect(screen.getByText(/Offline mode activated|تم تفعيل/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(mockActivate).toHaveBeenCalledTimes(2);
  }, 10000);

  it('shows disabled activating button while activation is in progress', async () => {
    // Make activate() hang so we can observe the 'activating' phase
    let resolveActivate: (() => void) | undefined;
    mockActivate.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveActivate = resolve;
        })
    );

    render(<PwaActivationDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^Activate$|^تفعيل$/i }));

    // The "Activating..." button appears IMMEDIATELY after click (setPhase('activating')
    // is called synchronously before the first await inside handleActivate).
    const activatingBtn = screen.getByRole('button', { name: /Activating|جاري التفعيل/i });
    expect(activatingBtn).toBeInTheDocument();
    expect(activatingBtn).toBeDisabled();

    // Wait until step 0 delay (400 ms) finishes and activate() is actually invoked,
    // so resolveActivate is properly assigned before we call it.
    await waitFor(
      () => {
        expect(resolveActivate).toBeDefined();
      },
      { timeout: 3000 }
    );

    // Cleanup: let the activate() promise resolve so no async work leaks out.
    resolveActivate!();
    await waitFor(() => {}, { timeout: 500 });
  }, 10000);
});
