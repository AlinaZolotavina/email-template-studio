declare const safeEmailHtml: unique symbol;

export type EmailHtml = string & { readonly [safeEmailHtml]: true };

export function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function escapeAttribute(value: string): string {
  const withoutControls = [...value]
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join('');

  return escapeText(withoutControls)
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function joinHtml(parts: readonly (EmailHtml | null | undefined | false)[]): EmailHtml {
  return parts.filter((part): part is EmailHtml => Boolean(part)).join('') as EmailHtml;
}

// The only constructor for trusted structural markup. It stays internal to the core.
export function trustedHtml(value: string): EmailHtml {
  return value as EmailHtml;
}
