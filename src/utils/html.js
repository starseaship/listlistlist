export function escapeHtml(value = '') {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function escapeAttr(value = '') {
  return escapeHtml(value);
}

export function nl2br(value = '') {
  return escapeHtml(value).replaceAll('\n', '<br>');
}
