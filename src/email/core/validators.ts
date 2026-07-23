import type { RenderContext } from '../types';

export type UrlPurpose = 'link' | 'image';

export interface UrlValidationResult {
  valid: boolean;
  normalized?: string;
  reason?: string;
}

const HEX_COLOR = /^#[0-9A-F]{6}$/i;
function containsControlOrSpace(value: string): boolean {
  return [...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= 32 || code === 127;
  });
}

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

export function assertHexColor(value: string, name = 'color'): string {
  if (!isHexColor(value)) {
    throw new TypeError(`${name} must be a six-digit hexadecimal color.`);
  }
  return value.toUpperCase();
}

export function validateEmailUrl(
  value: string,
  purpose: UrlPurpose,
  mode: RenderContext['mode'] = 'export',
): UrlValidationResult {
  const candidate = value.trim();
  if (candidate === '') {
    return { valid: false, reason: 'URL is empty.' };
  }
  if (containsControlOrSpace(candidate)) {
    return { valid: false, reason: 'URL contains whitespace or control characters.' };
  }
  if (
    purpose === 'image' &&
    mode === 'preview' &&
    /^(?:\.\/|\/)[a-z0-9/_-]+\.(?:png|jpe?g|webp|gif)$/i.test(candidate)
  ) {
    return { valid: true, normalized: candidate };
  }

  let protocol: string;
  try {
    protocol = new URL(candidate).protocol.toLowerCase();
  } catch {
    return { valid: false, reason: 'URL must be absolute.' };
  }

  const allowed =
    purpose === 'image'
      ? mode === 'preview'
        ? new Set(['https:', 'http:', 'blob:', 'data:'])
        : new Set(['https:', 'http:'])
      : new Set(['https:', 'http:', 'mailto:', 'tel:']);

  if (!allowed.has(protocol)) {
    return { valid: false, reason: `Protocol ${protocol} is not allowed for ${purpose}.` };
  }
  if (
    protocol === 'data:' &&
    !/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(candidate)
  ) {
    return { valid: false, reason: 'Only supported base64 image data is allowed.' };
  }
  return { valid: true, normalized: candidate };
}

export function assertEmailUrl(
  value: string,
  purpose: UrlPurpose,
  mode: RenderContext['mode'] = 'export',
): string {
  const result = validateEmailUrl(value, purpose, mode);
  if (!result.valid || result.normalized === undefined) {
    throw new TypeError(result.reason ?? 'Invalid email URL.');
  }
  return result.normalized;
}
