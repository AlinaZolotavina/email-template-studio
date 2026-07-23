const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export function formatHtml(html: string): string {
  const lines = html.replace(/>\s*</g, '>\n<').split('\n');
  let depth = 0;

  return lines
    .map((line) => {
      const value = line.trim();
      const closingTag = /^<\/([a-z][\w:-]*)>/i.exec(value);
      if (closingTag !== null) depth = Math.max(0, depth - 1);

      const formatted = `${'  '.repeat(depth)}${value}`;
      const openingTag = /^<([a-z][\w:-]*)(?:\s[^>]*)?>$/i.exec(value);
      if (
        openingTag !== null &&
        !VOID_ELEMENTS.has(openingTag[1].toLowerCase()) &&
        !value.endsWith('/>')
      ) {
        depth += 1;
      }
      return formatted;
    })
    .join('\n');
}
