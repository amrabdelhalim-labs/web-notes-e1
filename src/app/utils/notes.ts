/**
 * Note Utilities
 *
 * Shared helpers for note display — used by NoteCard, NoteList,
 * notes/[id]/page and any future note-related component.
 *
 * Keeping these here avoids copy-pasting logic across components and
 * means a single place to fix if the Arabic locale or format ever changes.
 */

/**
 * Strip HTML tags and return plain text suitable for card previews.
 *
 * IMPORTANT: A naive `textContent` read on `<p>A</p><p>B</p>` gives `"AB"`.
 * We insert a space before every closing block tag so adjacent paragraphs,
 * headings and list items are separated by whitespace in the preview.
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  // Add a space before each closing block element so paragraphs don't merge.
  const spaced = html.replace(/<\/(p|h[1-6]|li|dt|dd|div|tr|td|th|blockquote)>/gi, ' ');

  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = spaced;
    return (tmp.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  // SSR fallback: strip all tags then collapse whitespace
  return spaced.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Format an ISO date string for display in Arabic (short form used on cards).
 * Example: "٦ مارس ٢٠٢٦، ٠٩:٣٠ م"
 */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format an ISO date string for display in Arabic (long form used on detail pages).
 * Example: "السبت، ٦ مارس ٢٠٢٦، ٠٩:٣٠ م"
 */
export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
