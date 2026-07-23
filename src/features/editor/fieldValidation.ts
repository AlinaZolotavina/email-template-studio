import { isHexColor, validateEmailUrl } from '../../email/core';
import type { EmailFieldValue, ImageValue, TemplateField } from '../../email/types';

export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | undefined {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return 'Choose a PNG, JPEG, WebP, or GIF image.';
  }
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 5 MB or smaller.';
  return undefined;
}

export function validateFieldValue(
  field: TemplateField,
  value: EmailFieldValue | undefined,
): string[] {
  switch (field.type) {
    case 'text':
    case 'textarea': {
      if (typeof value !== 'string') return ['Enter text.'];
      return value.length > field.maxLength
        ? [`Use ${field.maxLength} characters or fewer.`]
        : [];
    }
    case 'color':
      return typeof value === 'string' && isHexColor(value)
        ? []
        : ['Use a six-digit HEX color, for example #2563EB.'];
    case 'url': {
      if (typeof value !== 'string' || value.trim() === '') return ['Enter a URL.'];
      return validateEmailUrl(value, 'link').valid ? [] : ['Enter an absolute HTTP, HTTPS, mailto, or tel URL.'];
    }
    case 'link': {
      if (typeof value !== 'object' || value === null || !('label' in value)) {
        return ['Enter a link label and URL.'];
      }
      const errors: string[] = [];
      if (value.label.trim() === '') errors.push('Link label is required.');
      if (!validateEmailUrl(value.url, 'link').valid) errors.push('Enter a valid absolute link URL.');
      return errors;
    }
    case 'image': {
      if (typeof value !== 'object' || value === null || !('remoteUrl' in value)) {
        return ['Image data is invalid.'];
      }
      const image: ImageValue = value;
      const errors: string[] = [];
      if (image.alt.trim() === '') errors.push('Alt text is required.');
      if (image.remoteUrl.trim() !== '' && !validateEmailUrl(image.remoteUrl, 'image').valid) {
        errors.push('Enter an absolute HTTP or HTTPS image URL.');
      }
      if (image.localPreviewUrl && !validateEmailUrl(image.remoteUrl, 'image').valid) {
        errors.push('Add a public image URL before export.');
      }
      return errors;
    }
    case 'toggle':
      return typeof value === 'boolean' ? [] : ['Choose enabled or disabled.'];
  }
}
