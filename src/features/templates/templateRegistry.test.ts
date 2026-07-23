import { persistedSessionV1Schema, emailDraftSchema } from '../../email/schemas';
import { TEMPLATE_IDS, type ImageValue } from '../../email/types';
import { assertTemplateManifest } from '../../email/templates/validateManifest';
import {
  getTemplate,
  getTemplateDefaults,
  listTemplates,
  UnknownTemplateError,
} from './templateRegistry';

describe('template registry', () => {
  it('contains each supported template ID exactly once', () => {
    const ids = listTemplates().map(({ id }) => id);

    expect(ids).toHaveLength(TEMPLATE_IDS.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining([...TEMPLATE_IDS]));
    expect(listTemplates().every((template) => typeof template.render === 'function')).toBe(true);
  });

  it('has unique field keys and valid defaults for every manifest', () => {
    for (const manifest of listTemplates()) {
      const fieldKeys = manifest.fields.map(({ key }) => key);

      expect(new Set(fieldKeys).size).toBe(fieldKeys.length);
      expect(emailDraftSchema.safeParse(manifest.defaults).success).toBe(true);
      expect(() => assertTemplateManifest(manifest)).not.toThrow();
    }
  });

  it('uses editor groups and GitHub Pages-safe thumbnail paths', () => {
    for (const manifest of listTemplates()) {
      expect(manifest.thumbnailPath).not.toMatch(/^\//);
      expect(manifest.fields.some(({ group }) => group === 'brand')).toBe(true);
      expect(manifest.fields.some(({ group }) => group === 'footer')).toBe(true);
      expect(manifest.fields.some(({ group }) => group === 'buttons')).toBe(true);
    }
  });

  it('exposes complete editable brand and footer contracts', () => {
    for (const manifest of listTemplates()) {
      expect(manifest.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'preheader', type: 'text' }),
          expect.objectContaining({ key: 'logo', type: 'image' }),
        ]),
      );
      expect(
        manifest.fields.some(({ group, type }) => group === 'footer' && type === 'url'),
      ).toBe(false);
      for (const field of manifest.fields.filter(
        ({ group, type }) => group === 'footer' && type === 'link',
      )) {
        const value = manifest.defaults.fields[field.key];
        expect(typeof value).toBe('object');
        if (typeof value === 'object' && value !== null && 'label' in value) {
          expect(typeof value.label).toBe('string');
          expect(value.url).toMatch(/^(?:https:|mailto:)/);
        }
      }
    }

    for (const id of ['newsletter-digest', 'newsletter-promo'] as const) {
      expect(getTemplate(id).fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'unsubscribeLink', type: 'link' }),
        ]),
      );
    }
  });

  it('returns a deep copy of defaults', () => {
    const firstDraft = getTemplateDefaults('newsletter-digest');
    const originalAccent = firstDraft.theme.accentColor;
    const originalLogoUrl = (firstDraft.fields.logo as ImageValue).remoteUrl;

    firstDraft.theme.accentColor = '#000000';
    (firstDraft.fields.logo as ImageValue).remoteUrl = 'blob:changed';

    const secondDraft = getTemplateDefaults('newsletter-digest');
    expect(secondDraft).not.toBe(firstDraft);
    expect(secondDraft.theme).not.toBe(firstDraft.theme);
    expect(secondDraft.fields.logo).not.toBe(firstDraft.fields.logo);
    expect(secondDraft.theme.accentColor).toBe(originalAccent);
    expect((secondDraft.fields.logo as ImageValue).remoteUrl).toBe(originalLogoUrl);
  });

  it('throws a dedicated error for an unknown ID', () => {
    expect(() => getTemplate('does-not-exist')).toThrow(UnknownTemplateError);
    expect(() => getTemplateDefaults('does-not-exist')).toThrow(
      'Unknown email template',
    );
  });
});

describe('persisted session schema', () => {
  it('accepts a persisted draft whose key matches its templateId', () => {
    const draft = getTemplateDefaults('welcome-simple');

    expect(
      persistedSessionV1Schema.safeParse({
        version: 1,
        selectedTemplateId: 'welcome-simple',
        draftsByTemplateId: { 'welcome-simple': draft },
        previewViewport: 'desktop',
      }).success,
    ).toBe(true);
  });

  it('rejects local preview URLs and mismatched draft keys', () => {
    const draft = getTemplateDefaults('welcome-simple');
    draft.fields.logo = {
      remoteUrl: 'https://example.com/logo.png',
      localPreviewUrl: 'blob:temporary-logo',
      alt: 'Logo',
    };

    expect(
      persistedSessionV1Schema.safeParse({
        version: 1,
        selectedTemplateId: 'welcome-simple',
        draftsByTemplateId: { 'welcome-simple': draft },
        previewViewport: 'mobile',
      }).success,
    ).toBe(false);

    const cleanDraft = getTemplateDefaults('welcome-simple');
    expect(
      persistedSessionV1Schema.safeParse({
        version: 1,
        selectedTemplateId: 'newsletter-digest',
        draftsByTemplateId: { 'newsletter-digest': cleanDraft },
        previewViewport: 'desktop',
      }).success,
    ).toBe(false);
  });
});
