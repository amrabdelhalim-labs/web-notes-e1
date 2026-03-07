'use client';

/**
 * RichTextEditor — Tiptap-based rich text editor with MUI toolbar.
 *
 * Features:
 * - Bold, Italic, Underline, Strikethrough
 * - Headings (H1-H3)
 * - Bullet list, Ordered list
 * - Text alignment (right, center, left)
 * - Highlight
 * - RTL by default
 *
 * Content is stored as HTML string which fits the existing `content` field.
 */

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import HighlightIcon from '@mui/icons-material/Highlight';
import TitleIcon from '@mui/icons-material/Title';
import FormatTextdirectionRToLIcon from '@mui/icons-material/FormatTextdirectionRToL';
import FormatTextdirectionLToRIcon from '@mui/icons-material/FormatTextdirectionLToR';
import type { Editor } from '@tiptap/react';

interface RichTextEditorProps {
  /** HTML content to initialize with */
  content: string;
  /** Called whenever content changes */
  onChange: (html: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum editor content height in pixels */
  minHeight?: number;
  /**
   * Maximum editor content height before internal scroll kicks in.
   * Pass a CSS value (e.g. '60vh', '400px') so the editor scrolls
   * internally instead of pushing the page down.
   */
  maxHeight?: number | string;
  /** Editor is read-only */
  readOnly?: boolean;
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

interface EditorToolbarProps {
  editor: Editor | null;
  contentDir: 'rtl' | 'ltr';
  onDirChange: (dir: 'rtl' | 'ltr') => void;
}

function EditorToolbar({ editor, contentDir, onDirChange }: EditorToolbarProps) {
  const t = useTranslations('RichTextEditor');
  if (!editor) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5,
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {/* Content direction toggle: lets users write Arabic (RTL) or English (LTR) */}
      <Tooltip title={contentDir === 'rtl' ? t('switchToLTR') : t('switchToRTL')}>
        <ToggleButton
          value="dir"
          size="small"
          selected={contentDir === 'rtl'}
          onChange={() => onDirChange(contentDir === 'rtl' ? 'ltr' : 'rtl')}
          aria-label={contentDir === 'rtl' ? t('switchToLTR') : t('switchToRTL')}
        >
          {contentDir === 'rtl'
            ? <FormatTextdirectionRToLIcon fontSize="small" />
            : <FormatTextdirectionLToRIcon fontSize="small" />}
        </ToggleButton>
      </Tooltip>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

      {/* Inline styles */}
      <ToggleButtonGroup size="small">
        <Tooltip title={t('bold')}>
          <ToggleButton
            value="bold"
            selected={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('italic')}>
          <ToggleButton
            value="italic"
            selected={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('underline')}>
          <ToggleButton
            value="underline"
            selected={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('strikethrough')}>
          <ToggleButton
            value="strike"
            selected={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <StrikethroughSIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('highlight')}>
          <ToggleButton
            value="highlight"
            selected={editor.isActive('highlight')}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <HighlightIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

      {/* Headings */}
      <ToggleButtonGroup size="small">
        <Tooltip title={t('heading1')}>
          <ToggleButton
            value="h2"
            selected={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <TitleIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('heading2')}>
          <ToggleButton
            value="h3"
            selected={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <TitleIcon sx={{ fontSize: 16 }} />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

      {/* Lists */}
      <ToggleButtonGroup size="small">
        <Tooltip title={t('bulletList')}>
          <ToggleButton
            value="bulletList"
            selected={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <FormatListBulletedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('orderedList')}>
          <ToggleButton
            value="orderedList"
            selected={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <FormatListNumberedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

      {/* Alignment */}
      <ToggleButtonGroup size="small">
        <Tooltip title={t('alignRight')}>
          <ToggleButton
            value="right"
            selected={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <FormatAlignRightIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('alignCenter')}>
          <ToggleButton
            value="center"
            selected={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <FormatAlignCenterIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('alignLeft')}>
          <ToggleButton
            value="left"
            selected={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <FormatAlignLeftIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  );
}

// ─── Editor Component ────────────────────────────────────────────────────────

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'ابدأ بالكتابة...',
  minHeight = 200,
  maxHeight,
  readOnly = false,
}: RichTextEditorProps) {
  const locale = useLocale();
  // Content direction: defaults to the app locale's natural direction.
  // The user can toggle it in the toolbar to write English inside an Arabic note
  // or vice-versa. This state is local to the note session and is NOT persisted.
  const [contentDir, setContentDir] = useState<'rtl' | 'ltr'>(
    () => (locale === 'ar' ? 'rtl' : 'ltr'),
  );

  // Stable ref for onChange so the editor closure never goes stale
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  const editor = useEditor({
    immediatelyRender: false,   // SSR-safe: prevents Tiptap hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: contentDir === 'rtl' ? 'right' : 'left',
      }),
      Placeholder.configure({ placeholder }),
      Highlight,
    ],
    content,
    editable: !readOnly,
    // The HTML `dir` attribute drives cursor placement and caret direction.
    // It is set to the current contentDir state on init; subsequent changes
    // are applied via a useEffect that mutates the DOM attribute directly
    // (Tiptap does not re-run editorProps when options change after mount).
    editorProps: {
      attributes: {
        dir: contentDir,
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(e.getHTML());
    },
  });

  // Sync content from parent ONLY when it genuinely differs.
  // Tiptap's getHTML() returns '<p></p>' for an empty doc, so we
  // normalise both sides before comparing to avoid infinite loops.
  const prevContentRef = useRef(content);
  useEffect(() => {
    if (!editor) return;
    // Skip if content prop hasn't changed since last time
    if (content === prevContentRef.current) return;
    prevContentRef.current = content;

    const editorHtml = editor.getHTML();
    const isEmpty = (h: string) => !h || h === '<p></p>';

    if (isEmpty(content) && isEmpty(editorHtml)) return;
    if (content === editorHtml) return;

    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  // Sync the HTML dir attribute on the editor element when content direction
  // changes. A boolean ref prevents the initial mount from resetting alignments
  // that are already stored in the loaded content.
  const isFirstDirSync = useRef(true);
  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute('dir', contentDir);
    if (isFirstDirSync.current) {
      isFirstDirSync.current = false;
      return; // skip on mount — let stored content alignments stand
    }
    // On explicit user switch, apply the matching default alignment to the
    // current selection so newly typed text starts in the right direction.
    editor.commands.setTextAlign(contentDir === 'rtl' ? 'right' : 'left');
  }, [contentDir, editor]);

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderWidth: '1.5px',
        '&:focus-within': {
          borderColor: 'primary.main',
          borderWidth: '2px',
        },
      }}
    >
      {!readOnly && (
        <EditorToolbar
          editor={editor}
          contentDir={contentDir}
          onDirChange={setContentDir}
        />
      )}
      <Box
        sx={(theme) => ({
          '& .tiptap': {
            minHeight,
            // When maxHeight is set the editor area scrolls internally so the
            // rest of the page (title, toolbar, buttons) stays in view even
            // when writing long notes.
            ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}),
            p: 2,
            outline: 'none',
            // NOTE: do NOT set `direction: rtl` here. The HTML `dir="rtl"`
            // attribute (set via editorProps above) handles cursor/caret
            // direction. stylis-plugin-rtl also already flips all physical
            // CSS properties globally, so adding CSS direction here causes
            // double-flip issues on properties like float and padding.
            fontFamily: 'inherit',
            fontSize: '1rem',
            lineHeight: 1.8,
            color: theme.palette.text.primary,

            // ── Placeholder ────────────────────────────────────────────────
            // Tiptap adds .is-empty to empty nodes and sets data-placeholder.
            // stylis-plugin-rtl flips `float: left` → `float: right`.
            // Write `float: 'left'` so the final CSS has `float: right`
            // (inline-start in RTL), matching where the cursor appears.
            '& p.is-empty:first-of-type::before': {
              content: 'attr(data-placeholder)',
              color: theme.palette.text.disabled,
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },

            // ── Headings ───────────────────────────────────────────────────
            '& h2': { fontSize: '1.5rem', fontWeight: 700, mt: 2, mb: 1 },
            '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 1.5, mb: 0.5 },

            // ── Lists ──────────────────────────────────────────────────────
            // In RTL the bullet marker appears on the RIGHT (inline-start).
            // stylis flips `padding-left` → `padding-right`, so write `pl`
            // here so the final compiled CSS gets `padding-right: 24px`.
            '& ul, & ol': { pl: 3, pr: 0 },
            '& li': { mb: 0.25 },

            // ── Blockquote ─────────────────────────────────────────────────
            // RTL accent border should be on the RIGHT (inline-start side).
            // stylis flips `border-left` → `border-right`, so write
            // `borderLeft` here so the final CSS gets `border-right`.
            // Same logic applies to the inner padding.
            '& blockquote': {
              borderLeft: `4px solid ${theme.palette.divider}`,
              pl: 2,
              ml: 0,
              color: theme.palette.text.secondary,
            },

            // ── Highlight mark ─────────────────────────────────────────────
            '& mark': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,213,79,0.30)'
                  : 'rgba(255,213,79,0.55)',
              color: theme.palette.text.primary,
              borderRadius: '2px',
              padding: '0 2px',
            },
          },
        })}
      >
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
}
