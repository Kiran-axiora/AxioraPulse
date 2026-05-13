/**
 * Lightweight Markdown parser — no external deps.
 * Supports: bold, italic, inline code, code blocks,
 * unordered lists, ordered lists, and line breaks.
 */
export function parseMarkdown(raw = '') {
  if (!raw) return '';

  let html = raw
    // Escape HTML entities first to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Fenced code blocks ```lang\n...\n```
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="md-pre"><code>$1</code></pre>')

    // Bold **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')

    // Italic *text* or _text_
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')

    // Inline code `text`
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')

    // Unordered list lines: - item or * item
    .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')

    // Ordered list lines: 1. item
    .replace(/^\d+\. (.+)$/gm, '<li class="ordered">$1</li>')

    // Wrap consecutive <li> blocks in <ul>
    .replace(/(<li>[\s\S]*?<\/li>)(?=\s*<li>|$)/gm, (match) => match)

    // Line breaks — double newline = paragraph, single = br
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  // Wrap in paragraph if not starting with a block element
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li(?:\s[^>]*)?>[\s\S]*?<\/li>(?:\s*<li(?:\s[^>]*)?>[\s\S]*?<\/li>)*)/g, '<ul>$1</ul>');

  return html;
}
