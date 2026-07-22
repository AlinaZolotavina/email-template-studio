import { parse } from 'parse5';

import { exportRenderContext, previewRenderContext } from '../../core';
import type { ImageValue, TemplateId } from '../../types';
import { getTemplate, getTemplateDefaults } from '../../../features/templates/templateRegistry';

interface TemplateCase {
  id: TemplateId;
  titleField: string;
  expectedTitle: string;
  footerField: string;
}

const templateCases: readonly TemplateCase[] = [
  {
    id: 'newsletter-digest',
    titleField: 'heading',
    expectedTitle: 'The Weekly Brief',
    footerField: 'footerText',
  },
  {
    id: 'newsletter-promo',
    titleField: 'heading',
    expectedTitle: 'Make your next project happen',
    footerField: 'footerText',
  },
  {
    id: 'welcome-simple',
    titleField: 'greeting',
    expectedTitle: 'Welcome aboard!',
    footerField: 'footerText',
  },
  {
    id: 'welcome-onboarding',
    titleField: 'greeting',
    expectedTitle: 'Let us get you set up',
    footerField: 'footerText',
  },
];

describe.each(templateCases)('$id renderer', ({ id, titleField, expectedTitle, footerField }) => {
  it('renders the default full email document and matches its snapshot', () => {
    const definition = getTemplate(id);
    const draft = getTemplateDefaults(id);
    const result = definition.render(draft, exportRenderContext);

    expect(result.errors).toEqual([]);
    expect(parse(result.html).nodeName).toBe('#document');
    expect(result.html).toMatch(/^<!doctype html>/i);
    expect(result.html).toContain('<html ');
    expect(result.html).toContain('<head>');
    expect(result.html).toContain('<body ');
    expect(result.html).toContain('role="presentation"');
    expect(result.html).toContain('<!--[if mso]>');
    expect(result.html).toContain('<v:roundrect');
    expect(result.html).toContain(expectedTitle);
    const footerText = draft.fields[footerField];
    expect(typeof footerText).toBe('string');
    expect(result.html).toContain(typeof footerText === 'string' ? footerText : '');
    expect(result.html).not.toMatch(/(?:blob:|data:|<script[\s>])/i);
    expect(result.html).toMatchSnapshot();
  });

  it('escapes user text and never emits executable markup', () => {
    const definition = getTemplate(id);
    const draft = getTemplateDefaults(id);
    draft.fields[titleField] = '<script>alert("template")</script> & update';

    const result = definition.render(draft, exportRenderContext);

    expect(result.errors).toEqual([]);
    expect(result.html).toContain('&lt;script&gt;alert("template")&lt;/script&gt; &amp; update');
    expect(result.html).not.toMatch(/<script[\s>]/i);
  });

  it('uses a local logo only in preview and omits unsafe export image sources', () => {
    const definition = getTemplate(id);
    const draft = getTemplateDefaults(id);
    const logo: ImageValue = {
      remoteUrl: '',
      localPreviewUrl: `blob:https://studio.example/${id}`,
      alt: 'Local preview logo',
    };
    draft.fields.logo = logo;

    const preview = definition.render(draft, previewRenderContext);
    const exported = definition.render(draft, exportRenderContext);

    expect(preview.errors).toEqual([]);
    expect(preview.html).toContain(`blob:https://studio.example/${id}`);
    expect(exported.errors).toEqual([]);
    expect(exported.html).not.toMatch(/(?:blob:|data:)/i);

    logo.remoteUrl = 'data:image/png;base64,unsafe';
    const unsafeExport = definition.render(draft, exportRenderContext);
    expect(unsafeExport.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'invalid_image_url', fieldKey: 'logo' })]),
    );
    expect(unsafeExport.html).not.toMatch(/(?:blob:|data:|<script[\s>])/i);
  });

  it('reports invalid draft and CTA URL errors instead of throwing', () => {
    const definition = getTemplate(id);
    const wrongDraft = getTemplateDefaults(id === 'welcome-simple' ? 'newsletter-digest' : 'welcome-simple');
    expect(() => definition.render(wrongDraft, exportRenderContext)).not.toThrow();
    expect(definition.render(wrongDraft, exportRenderContext).errors[0]?.code).toBe(
      'template_mismatch',
    );

    const draft = getTemplateDefaults(id);
    draft.fields.primaryCta = { label: 'Unsafe', url: 'javascript:alert(1)' };
    const result = definition.render(draft, exportRenderContext);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'invalid_button_url', fieldKey: 'primaryCta' }),
      ]),
    );
    expect(result.html).not.toContain('javascript:');
  });
});
