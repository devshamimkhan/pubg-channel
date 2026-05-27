'use client';

import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Shared DOMPurify config — mirrors the server-side isomorphic-dompurify config
 * in src/lib/sanitize.js so both layers apply identical rules.
 */
const PURIFY_CONFIG = {
  FORCE_BODY: true,
  WHOLE_DOCUMENT: false,

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

  ADD_ATTR: [
    'controls', 'autoplay', 'muted', 'loop', 'poster', 'preload',
    'loading', 'srcset', 'sizes', 'decoding',
    'colspan', 'rowspan', 'scope', 'align', 'valign',
    'datetime', 'download', 'rel', 'lang', 'dir',
  ],

  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data|blob):)|(?:^[^a-z]|[a-z+\-.]+(?:[^a-z+\-.]|$))/i,

  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'ondblclick', 'onmousedown', 'onmouseup',
    'onmouseover', 'onmouseout', 'onmousemove', 'onkeydown', 'onkeyup',
    'onkeypress', 'onfocus', 'onblur', 'onsubmit', 'onreset', 'onchange',
    'oninput', 'onselect', 'ondrag', 'ondrop', 'onscroll', 'onwheel',
    'oncontextmenu', 'onpointerdown', 'onpointerup', 'ontouchstart', 'ontouchend',
  ],
};

/**
 * Client-side safe HTML renderer.
 * Already-sanitized content from the server is sanitized again here (defense in depth).
 *
 * Props:
 *  - html      (string)  – HTML string to render
 *  - style     (object)  – optional inline styles for the wrapper div
 *  - className (string)  – optional CSS class for the wrapper div
 */
export default function SafeHtml({ html, style = {}, className = '' }) {
  const clean = useMemo(() => {
    if (!html) return '';
    return DOMPurify.sanitize(html, PURIFY_CONFIG);
  }, [html]);

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
