import type { TemplateField } from '../../email/types';
import { validateFieldValue } from './fieldValidation';

describe('editor field validation', () => {
  it('validates maximum length, URLs, required link labels, and local-only images', () => {
    const text = { key: 'title', type: 'text', label: 'Title', group: 'content', maxLength: 4 } as const satisfies TemplateField;
    const url = { key: 'url', type: 'url', label: 'URL', group: 'footer' } as const satisfies TemplateField;
    const link = { key: 'cta', type: 'link', label: 'CTA', group: 'buttons' } as const satisfies TemplateField;
    const image = { key: 'image', type: 'image', label: 'Image', group: 'images', recommendedSize: '600 x 300 px' } as const satisfies TemplateField;

    expect(validateFieldValue(text, 'Too long')).toContain('Use 4 characters or fewer.');
    expect(validateFieldValue(url, 'relative/path')).toContain('Enter an absolute HTTP, HTTPS, mailto, or tel URL.');
    expect(validateFieldValue(link, { label: '', url: 'https://example.com' })).toContain('Link label is required.');
    expect(validateFieldValue(image, { remoteUrl: '', localPreviewUrl: 'blob:preview', alt: 'Preview' })).toContain('Add a public image URL before export.');
  });
});
