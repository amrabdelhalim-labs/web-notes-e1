/**
 * NoteEditorForm Component Tests
 *
 * Tests create/edit modes, validation, type toggle, and form submission.
 */

import { render, screen, fireEvent, waitFor } from '@/app/tests/utils';
import NoteEditorForm from '@/app/components/notes/NoteEditorForm';

// Mock RichTextEditor and VoiceRecorder (complex components with browser APIs)
vi.mock('@/app/components/notes/RichTextEditor', () => ({
  default: ({
    content,
    onChange,
    placeholder,
  }: {
    content: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      data-testid="rich-text-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('@/app/components/notes/VoiceRecorder', () => ({
  default: ({ onRecorded }: { onRecorded: (b64: string, dur: number) => void }) => (
    <div data-testid="voice-recorder">
      <button onClick={() => onRecorded('base64audio', 30)}>Record</button>
    </div>
  ),
}));

vi.mock('@/app/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => true,
}));

const defaultProps = {
  mode: 'create' as const,
  onSubmit: vi.fn().mockResolvedValue(undefined),
  onCancel: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  defaultProps.onSubmit.mockResolvedValue(undefined);
});

// ─── Create mode ────────────────────────────────────────────────────────────

describe('create mode', () => {
  it('renders type toggle (text and voice)', () => {
    render(<NoteEditorForm {...defaultProps} />);
    expect(screen.getByText('نصية')).toBeInTheDocument();
    expect(screen.getByText('صوتية')).toBeInTheDocument();
  });

  it('renders title field', () => {
    render(<NoteEditorForm {...defaultProps} />);
    expect(screen.getByLabelText(/العنوان/)).toBeInTheDocument();
  });

  it('shows rich text editor for text type', () => {
    render(<NoteEditorForm {...defaultProps} />);
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('shows voice recorder when voice type selected', () => {
    render(<NoteEditorForm {...defaultProps} />);
    // Click the voice toggle button
    fireEvent.click(screen.getByText('صوتية'));
    expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
  });

  it('shows create button text', () => {
    render(<NoteEditorForm {...defaultProps} />);
    expect(screen.getByText('إنشاء الملاحظة')).toBeInTheDocument();
  });

  it('shows cancel button', () => {
    render(<NoteEditorForm {...defaultProps} />);
    expect(screen.getByText('إلغاء')).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked', () => {
    render(<NoteEditorForm {...defaultProps} />);
    fireEvent.click(screen.getByText('إلغاء'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});

// ─── Validation ─────────────────────────────────────────────────────────────

describe('validation', () => {
  it('shows error when title is empty', async () => {
    render(<NoteEditorForm {...defaultProps} />);
    fireEvent.click(screen.getByText('إنشاء الملاحظة'));

    await waitFor(() => {
      expect(screen.getByText(/عنوان الملاحظة مطلوب/)).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('shows error when text content is empty', async () => {
    render(<NoteEditorForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: 'Title' } });
    fireEvent.click(screen.getByText('إنشاء الملاحظة'));

    await waitFor(() => {
      expect(screen.getByText(/محتوى الملاحظة مطلوب/)).toBeInTheDocument();
    });
  });

  it('shows error when voice note has no recording', async () => {
    render(<NoteEditorForm {...defaultProps} />);
    fireEvent.click(screen.getByText('صوتية'));
    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: 'Title' } });
    fireEvent.click(screen.getByText('إنشاء الملاحظة'));

    await waitFor(() => {
      expect(screen.getByText(/تسجيل مقطع صوتي/)).toBeInTheDocument();
    });
  });
});

// ─── Successful submission ──────────────────────────────────────────────────

describe('submission', () => {
  it('submits text note with correct data', async () => {
    render(<NoteEditorForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: 'My Note' } });
    fireEvent.change(screen.getByTestId('rich-text-editor'), { target: { value: 'Note content' } });
    fireEvent.click(screen.getByText('إنشاء الملاحظة'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Note',
          type: 'text',
          content: 'Note content',
        })
      );
    });
  });

  it('submits voice note with recorded audio', async () => {
    render(<NoteEditorForm {...defaultProps} />);

    fireEvent.click(screen.getByText('صوتية'));
    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: 'Voice Note' } });
    fireEvent.click(screen.getByText('Record'));
    fireEvent.click(screen.getByText('إنشاء الملاحظة'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Voice Note',
          type: 'voice',
          audioData: 'base64audio',
          audioDuration: 30,
        })
      );
    });
  });

  it('shows error alert on API failure', async () => {
    defaultProps.onSubmit.mockRejectedValueOnce(new Error('Server error'));
    render(<NoteEditorForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: 'Title' } });
    fireEvent.change(screen.getByTestId('rich-text-editor'), { target: { value: 'Content' } });
    fireEvent.click(screen.getByText('إنشاء الملاحظة'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});

// ─── Edit mode ──────────────────────────────────────────────────────────────

describe('edit mode', () => {
  const editProps = {
    ...defaultProps,
    mode: 'edit' as const,
    initialData: {
      title: 'Existing Note',
      type: 'text' as const,
      content: '<p>Existing content</p>',
    },
  };

  it('does not show type toggle in edit mode', () => {
    render(<NoteEditorForm {...editProps} />);
    // Should not have the type toggle group
    expect(screen.queryByText('نوع الملاحظة')).not.toBeInTheDocument();
  });

  it('populates title from initialData', () => {
    render(<NoteEditorForm {...editProps} />);
    expect(screen.getByLabelText(/العنوان/)).toHaveValue('Existing Note');
  });

  it('shows save button text for edit mode', () => {
    render(<NoteEditorForm {...editProps} />);
    expect(screen.getByText('حفظ التعديلات')).toBeInTheDocument();
  });

  it('submits with update data', async () => {
    render(<NoteEditorForm {...editProps} />);
    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: 'Updated Title' } });
    fireEvent.click(screen.getByText('حفظ التعديلات'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated Title' })
      );
    });
  });
});
