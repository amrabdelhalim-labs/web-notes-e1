/**
 * sanitize.ts — Client-side HTML sanitizer for Rich Text note content.
 *
 * Uses the browser's built-in DOMParser to parse the HTML, then walks the
 * resulting DOM tree and removes any node or attribute that is not on the
 * explicit allow-lists.  No third-party dependencies required.
 *
 * Only call this function in 'use client' components — it depends on
 * `document` / `DOMParser` which are not available on the server.
 *
 * Allowed tags match the subset that Tiptap's StarterKit + extensions
 * produce:  block elements, inline formatting, lists, tables, and code.
 */

const ALLOWED_TAGS = new Set([
  // Block
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'code',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  // Inline
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'mark',
  'span',
  'a',
  // Media — allow img only if src is a data-URI or same-origin path
  'img',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['class', 'style', 'dir']),
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
  th: new Set(['colspan', 'rowspan']),
  td: new Set(['colspan', 'rowspan']),
  span: new Set(['style']),
  code: new Set(['class']), // for syntax-highlight class names
};

/** Protocols allowed in href / src attributes. */
const SAFE_PROTOCOLS = /^(https?|mailto|data):/i;
/** Deny javascript: and any other dangerous protocol. */
const FORBIDDEN_PROTOCOL = /^javascript:/i;

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (FORBIDDEN_PROTOCOL.test(trimmed)) return false;
  return SAFE_PROTOCOLS.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#');
}

function sanitizeNode(node: Element): void {
  const tag = node.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) {
    // Replace disallowed element with its text content only
    node.replaceWith(document.createTextNode(node.textContent ?? ''));
    return;
  }

  // Remove disallowed attributes
  const attrsToRemove: string[] = [];
  for (const attr of Array.from(node.attributes)) {
    const name = attr.name.toLowerCase();
    const globalAllowed = ALLOWED_ATTRS['*'] ?? new Set();
    const tagAllowed = ALLOWED_ATTRS[tag] ?? new Set();

    if (!globalAllowed.has(name) && !tagAllowed.has(name)) {
      attrsToRemove.push(attr.name);
      continue;
    }

    // Check URL safety for href / src
    if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) {
      attrsToRemove.push(attr.name);
    }

    // Strip event handlers (on*)
    if (name.startsWith('on')) {
      attrsToRemove.push(attr.name);
    }
  }
  for (const name of attrsToRemove) {
    node.removeAttribute(name);
  }

  // Add rel="noopener noreferrer" to external links
  if (tag === 'a') {
    const href = node.getAttribute('href') ?? '';
    if (href.startsWith('http')) {
      node.setAttribute('rel', 'noopener noreferrer');
      node.setAttribute('target', '_blank');
    }
  }

  // Recurse into children (iterate over a snapshot to avoid mutation issues)
  for (const child of Array.from(node.children)) {
    sanitizeNode(child as Element);
  }
}

/**
 * Sanitize a Rich HTML string produced by Tiptap before passing it to
 * `dangerouslySetInnerHTML`.
 *
 * @example
 * dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content ?? '') }}
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, 'text/html');

  for (const child of Array.from(doc.body.children)) {
    sanitizeNode(child as Element);
  }

  return doc.body.innerHTML;
}
