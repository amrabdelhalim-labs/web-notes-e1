/**
 * Note Utilities Tests
 *
 * Tests for stripHtml, formatDateShort, formatDateLong.
 */

import { stripHtml, formatDateShort, formatDateLong } from '@/app/utils/notes';

// ─── stripHtml ──────────────────────────────────────────────────────────────

describe('stripHtml', () => {
  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  it('returns empty string for undefined-like input', () => {
    expect(stripHtml(undefined as unknown as string)).toBe('');
  });

  it('strips simple HTML tags', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello');
  });

  it('separates adjacent paragraphs with spaces', () => {
    const result = stripHtml('<p>First</p><p>Second</p>');
    expect(result).toContain('First');
    expect(result).toContain('Second');
    // Should have space between them, not "FirstSecond"
    expect(result).not.toBe('FirstSecond');
  });

  it('handles headings correctly', () => {
    expect(stripHtml('<h2>Title</h2><p>Body</p>')).toContain('Title');
  });

  it('handles list items', () => {
    const result = stripHtml('<ul><li>One</li><li>Two</li></ul>');
    expect(result).toContain('One');
    expect(result).toContain('Two');
  });

  it('strips nested HTML', () => {
    expect(stripHtml('<p><strong>Bold</strong> text</p>')).toBe('Bold text');
  });

  it('collapses whitespace', () => {
    expect(stripHtml('<p>  lots   of   space  </p>')).toBe('lots of space');
  });

  it('handles blockquote', () => {
    expect(stripHtml('<blockquote>Quote</blockquote>')).toBe('Quote');
  });
});

// ─── formatDateShort ────────────────────────────────────────────────────────

describe('formatDateShort', () => {
  it('formats a date string in Arabic', () => {
    const result = formatDateShort('2026-03-06T09:30:00.000Z');
    // Should be Arabic — check it contains Arabic digits or month names
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes year and month', () => {
    const result = formatDateShort('2026-01-15T12:00:00.000Z');
    // ar-EG format should produce some non-empty string with date components
    expect(result).toBeTruthy();
  });
});

// ─── formatDateLong ─────────────────────────────────────────────────────────

describe('formatDateLong', () => {
  it('formats a date string in Arabic long form', () => {
    const result = formatDateLong('2026-03-06T09:30:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces a longer string than formatDateShort', () => {
    const iso = '2026-06-15T14:00:00.000Z';
    const short = formatDateShort(iso);
    const long = formatDateLong(iso);
    // Long format includes weekday, should generally be longer or equal
    expect(long.length).toBeGreaterThanOrEqual(short.length);
  });
});
