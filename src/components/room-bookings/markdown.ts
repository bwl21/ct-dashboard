/**
 * Markdown helper for conflict mail templates.
 *
 * Tiny, dependency-free Markdown subset:
 *   - Paragraphs (blank-line separated)
 *   - Single line breaks inside a paragraph → <br>
 *   - Hard line break: line ending in `\` → <br>
 *   - **bold** → <strong>
 *   - [text](url) → <a href="url" target="_blank" rel="noopener">
 *   - Unordered lists: lines starting with "- " or "* " → <ul><li>…</li></ul>
 *     A list item may span multiple lines: indented continuation lines
 *     (or lines ending with `\`) are appended to the previous item with <br>.
 *
 * All user text is HTML-escaped to be safe by default.
 *
 * IMPORTANT: This module is the single point of conversion from Markdown to
 * HTML for outgoing mails / previews. If ChurchTools ever ships its own
 * Markdown infrastructure (e.g. a shared renderer or a richer editor), the
 * implementation of `renderMarkdown()` can be replaced here without touching
 * any caller (templates, modal, composable).
 */

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Apply inline transformations (escape first, then bold + links). */
const renderInline = (text: string): string => {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}

const LIST_LINE = /^\s*[-*]\s+(.*)$/

/** Render one block (already trimmed) as either a <ul> or a <p>. */
const renderBlock = (block: string): string => {
  const lines = block.split('\n')
  const firstIsList = LIST_LINE.test(lines[0])

  if (firstIsList) {
    // Group lines into items; non-list (continuation) lines belong to the
    // previous item and render as <br> within the same <li>.
    const items: string[][] = []
    for (const line of lines) {
      const match = line.match(LIST_LINE)
      if (match) {
        items.push([match[1]])
      } else if (items.length > 0) {
        items[items.length - 1].push(line.trim())
      }
    }
    const html = items
      .map((parts) => `  <li>${parts.map(renderInline).join('<br>')}</li>`)
      .join('\n')
    return `<ul>\n${html}\n</ul>`
  }

  return `<p>${lines.map(renderInline).join('<br>')}</p>`
}

/**
 * Convert a Markdown subset (paragraphs + **bold** + unordered lists)
 * to safe HTML. Supports `\` at end of line as a hard line break.
 */
export const renderMarkdown = (markdown: string): string => {
  if (!markdown) return ''

  // Treat a trailing backslash as an explicit line break: split the line
  // there so the renderer turns it into a <br> via its normal line-break logic.
  const normalized = markdown.replace(/\\\n/g, '\n')

  return normalized
    .trim()
    .split(/\n\s*\n/)
    .map((block) => renderBlock(block.trim()))
    .join('\n')
}
