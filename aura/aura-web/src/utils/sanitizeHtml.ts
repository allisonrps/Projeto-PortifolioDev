const BLOCKED_TAGS = new Set([
  'SCRIPT',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'APPLET',
  'FORM',
  'META',
  'BASE',
  'LINK',
]);

export function escapeHtml(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeHtml(dirtyHtml?: string | null): string {
  if (!dirtyHtml) return '';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return dirtyHtml
      .replace(/<\s*(script|iframe|object|embed|applet|form|meta|base|link)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
      .replace(/<\s*\/?\s*(script|iframe|object|embed|applet|form|meta|base|link)\b[^>]*>/gi, '')
      .replace(/\s+on[a-z0-9_]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  const elements = Array.from(doc.body.querySelectorAll('*'));
  for (const el of elements) {
    if (BLOCKED_TAGS.has(el.tagName)) {
      el.remove();
      continue;
    }

    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();

      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }

      if (
        (name === 'href' || name === 'src' || name === 'action' || name === 'formaction' || name === 'xlink:href') &&
        (val.startsWith('javascript:') || val.startsWith('vbscript:') || val.startsWith('data:text/html'))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }

  return doc.body.innerHTML;
}
