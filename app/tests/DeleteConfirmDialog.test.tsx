/**
 * DeleteConfirmDialog (Notes) Tests
 *
 * Tests the note deletion confirmation dialog.
 */

import { render, screen, fireEvent, waitFor } from '@/app/tests/utils';
import DeleteConfirmDialog from '@/app/components/notes/DeleteConfirmDialog';

const defaultProps = {
  open: true,
  title: 'ملاحظة تجريبية',
  onClose: vi.fn(),
  onConfirm: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.clearAllMocks();
  defaultProps.onConfirm.mockResolvedValue(undefined);
});

describe('DeleteConfirmDialog', () => {
  it('renders dialog with note title', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    expect(screen.getByText(/ملاحظة تجريبية/)).toBeInTheDocument();
  });

  it('shows confirmation heading', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    expect(screen.getByText('تأكيد الحذف')).toBeInTheDocument();
  });

  it('has cancel and delete buttons', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    expect(screen.getByText('إلغاء')).toBeInTheDocument();
    expect(screen.getByText('حذف')).toBeInTheDocument();
  });

  it('calls onClose when cancel clicked', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('إلغاء'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when delete clicked', async () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('حذف'));

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose after successful confirm', async () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('حذف'));

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('shows loading state during confirm', async () => {
    let resolveConfirm: () => void;
    const slowConfirm = new Promise<void>((resolve) => { resolveConfirm = resolve; });
    const props = { ...defaultProps, onConfirm: vi.fn().mockReturnValue(slowConfirm) };

    render(<DeleteConfirmDialog {...props} />);
    fireEvent.click(screen.getByText('حذف'));

    expect(screen.getByText(/جارٍ الحذف/)).toBeInTheDocument();
    resolveConfirm!();
    await waitFor(() => expect(props.onConfirm).toHaveBeenCalled());
  });

  it('does not render when open=false', () => {
    render(<DeleteConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('تأكيد الحذف')).not.toBeInTheDocument();
  });

  it('warns that action cannot be undone', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    expect(screen.getByText(/لا يمكن التراجع/)).toBeInTheDocument();
  });
});
