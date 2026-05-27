import DOMPurify from 'isomorphic-dompurify';

/**
 * The shared DOMPurify configuration used on both server and client.
 * - FORCE_BODY: true  → automatically strips <html>/<head>/<body> wrappers
 *                        so full copy-pasted HTML documents render correctly.
 * - img / src are in DOMPurify's default allow-list and are NOT stripped.
 * - ADD_TAGS / ADD_ATTR extend the defaults to support video, audio, style, etc.
 * - ALLOWED_URI_REGEXP is broadened to include all http/https/data/mailto URLs.
 */
const PURIFY_CONFIG = {
  FORCE_BODY: true,          // strip outer html/head/body → return body content
  WHOLE_DOCUMENT: false,

  // Extra tags not in DOMPurify's defaults
  ADD_TAGS: [
    'style',
    'video', 'audio', 'source', 'track',
    'picture',
    'figure', 'figcaption',
    'details', 'summary',
    'article', 'aside', 'nav', 'section', 'header', 'footer', 'main',
    'time', 'address', 'abbr', 'cite', 'kbd', 'samp', 'var',
    'dl', 'dt', 'dd',
    'colgroup', 'col', 'caption',
  ],

  // Extra attributes not in DOMPurify's defaults
  ADD_ATTR: [
    // Media
    'controls', 'autoplay', 'muted', 'loop', 'poster', 'preload',
    // Images
    'loading', 'srcset', 'sizes', 'decoding',
    // Tables
    'colspan', 'rowspan', 'scope', 'align', 'valign',
    // Misc
    'datetime', 'download', 'rel', 'lang', 'dir',
  ],

  // Allow all common web URL schemes for src/href
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data|blob):)|(?:^[^a-z]|[a-z+\-.]+(?:[^a-z+\-.]|$))/i,

  // Block event handlers (belt-and-suspenders on top of DOMPurify's own checks)
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'ondblclick', 'onmousedown', 'onmouseup',
    'onmouseover', 'onmouseout', 'onmousemove', 'onkeydown', 'onkeyup',
    'onkeypress', 'onfocus', 'onblur', 'onsubmit', 'onreset', 'onchange',
    'oninput', 'onselect', 'ondrag', 'ondrop', 'onscroll', 'onwheel',
    'oncontextmenu', 'onpointerdown', 'onpointerup', 'ontouchstart', 'ontouchend',
  ],
};

/**
 * Sanitizes HTML server-side using isomorphic-dompurify.
 * Safe to call in Next.js Server Actions and API routes.
 *
 * Handles:
 *  - Plain text                    → returned as-is (wrapped in <p> by browser)
 *  - Partial HTML snippets         → sanitized and returned
 *  - Full HTML documents           → <head> stripped, <body> content returned
 */
export function sanitizeContent(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}
