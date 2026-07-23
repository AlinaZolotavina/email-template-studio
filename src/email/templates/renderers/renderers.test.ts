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
    expectedTitle: 'Weekly digest',
    footerField: 'footerText',
  },
  {
    id: 'newsletter-promo',
    titleField: 'heading',
    expectedTitle: '20% OFF SITEWIDE',
    footerField: 'footerText',
  },
  {
    id: 'welcome-simple',
    titleField: 'greeting',
    expectedTitle: 'Welcome!',
    footerField: 'footerText',
  },
  {
    id: 'welcome-onboarding',
    titleField: 'greeting',
    expectedTitle: 'Welcome aboard!',
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

describe('reference layout contracts', () => {
  it('renders the digest as image-and-copy rows with CTA, preheader, social links, and unsubscribe', () => {
    const draft = getTemplateDefaults('newsletter-digest');
    const result = getTemplate('newsletter-digest').render(draft, exportRenderContext);

    expect(result.errors).toEqual([]);
    expect(result.html).toContain('This week: product thinking, design systems, and growth.');
    expect(result.html).toContain('class="mobile-stack"');
    expect(result.html).toContain('width="180" height="135"');
    expect(result.html.indexOf("Read this week's top stories")).toBeLessThan(
      result.html.indexOf('digest-strategy.png'),
    );
    for (const label of ['X', 'in', 'Email', 'Update preferences', 'Unsubscribe']) {
      expect(result.html).toContain(`>${label}<`);
    }
  });

  it.each(templateCases.map(({ id }) => id))(
    '%s renders every editable footer link label',
    (id) => {
      const definition = getTemplate(id);
      const draft = getTemplateDefaults(id);
      const result = definition.render(draft, exportRenderContext);

      for (const field of definition.fields.filter(
        ({ group, type }) => group === 'footer' && type === 'link',
      )) {
        const value = draft.fields[field.key];
        expect(typeof value === 'object' && value !== null && 'label' in value).toBe(true);
        if (typeof value === 'object' && value !== null && 'label' in value) {
          expect(result.html).toContain(value.label.replace('->', '-&gt;'));
        }
      }
    },
  );
});
