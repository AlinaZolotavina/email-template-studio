import { parse } from 'parse5';

import { MALICIOUS_ATTRIBUTE, MALICIOUS_TEXT, MALICIOUS_URLS } from './fixtures/malicious';
import {
  bulletproofButton,
  emailDocument,
  emailImage,
  emailLink,
  emailText,
  exportRenderContext,
  joinHtml,
  presentationTable,
  previewRenderContext,
  serializeInlineStyle,
  spacer,
  tableCell,
  validateEmailUrl,
} from './index';

function sampleBody() {
  return presentationTable({
    width: 600,
    className: 'email-container',
    children: joinHtml([
      tableCell({
        children: emailText({
          text: MALICIOUS_TEXT,
          tag: 'h1',
          style: { color: '#112233', fontSize: 28, lineHeight: 34 },
        }),
        style: { padding: [24, 20], backgroundColor: '#FFFFFF' },
      }),
      spacer(16),
      tableCell({
        children: bulletproofButton({
          label: 'Open & continue',
          url: 'https://example.com/path?a=1&b=2',
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          fontFamily: 'Arial',
        }),
      }),
    ]),
  });
}

describe('email rendering core', () => {
  it('creates a parseable full document with email shell contracts', () => {
    const html = emailDocument({
      body: sampleBody(),
      title: 'A title & update',
      preheader: 'Hidden preview text',
      backgroundColor: '#F3F4F6',
      contentWidth: 600,
    });
    const document = parse(html);

    expect(document.nodeName).toBe('#document');
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain('x-apple-disable-message-reformatting');
    expect(html).toContain('class="email-container"');
    expect(html).toContain('@media screen and (max-width:620px)');
    expect(html).toContain('role="presentation"');
    expect(html).toContain('<!--[if mso]>');
    expect(html).toContain('<v:roundrect');
  });

  it('escapes malicious text and attributes without producing raw script markup', () => {
    const image = emailImage({
      value: { remoteUrl: 'https://example.com/logo.png?a=1&b=2', alt: MALICIOUS_ATTRIBUTE },
      context: exportRenderContext,
      width: 240,
    });
    const html = emailDocument({
      body: joinHtml([sampleBody(), image]),
      title: MALICIOUS_TEXT,
      preheader: MALICIOUS_TEXT,
      backgroundColor: '#FFFFFF',
      contentWidth: 600,
    });

    parse(html);
    expect(html).not.toMatch(/<script[\s>]/i);
    expect(html).not.toContain('onerror="alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('alt="logo&quot; onerror=&quot;alert(1)&lt;script&gt;"');
    expect(html).toContain('a=1&amp;b=2');
  });

  it('enforces protocol allowlists for export and preview', () => {
    for (const url of MALICIOUS_URLS) {
      expect(validateEmailUrl(url, 'link').valid).toBe(false);
      expect(validateEmailUrl(url, 'image', 'preview').valid).toBe(false);
    }
    expect(validateEmailUrl('mailto:hello@example.com', 'link').valid).toBe(true);
    expect(validateEmailUrl('blob:https://studio.example/id', 'image', 'preview').valid).toBe(true);
    expect(validateEmailUrl('blob:https://studio.example/id', 'image', 'export').valid).toBe(false);
    expect(() =>
      emailImage({
        value: { remoteUrl: 'blob:https://studio.example/id', alt: 'Logo' },
        context: exportRenderContext,
        width: 200,
      }),
    ).toThrow(/Protocol blob:/);
    expect(() =>
      emailImage({
        value: { remoteUrl: '', localPreviewUrl: 'blob:https://studio.example/id', alt: 'Logo' },
        context: previewRenderContext,
        width: 200,
      }),
    ).not.toThrow();
  });

  it('renders escaped text links and aligns the button table', () => {
    const link = emailLink({
      label: 'Read <now>',
      url: 'https://example.com/read?a=1&b=2',
      style: { color: '#2563EB', textDecoration: 'underline' },
    });
    const button = bulletproofButton({
      label: 'Continue',
      url: 'https://example.com/continue',
      backgroundColor: '#2563EB',
      textColor: '#FFFFFF',
      fontFamily: 'Arial',
      align: 'right',
    });

    expect(link).toContain('Read &lt;now&gt;');
    expect(link).toContain('a=1&amp;b=2');
    expect(() => emailLink({ label: 'Unsafe', url: 'javascript:alert(1)' })).toThrow(
      /not allowed/,
    );
    expect(button).toContain('<table role="presentation"');
    expect(button).toContain('align="right"');
  });

  it('serializes only validated inline style values', () => {
    expect(serializeInlineStyle({ color: '#abcdef', padding: [12, 24], width: '100%' })).toBe(
      'color:#ABCDEF;padding:12px 24px;width:100%',
    );
    expect(() => serializeInlineStyle({ color: 'red;display:none' })).toThrow(/hexadecimal color/);
    expect(() => serializeInlineStyle({ padding: -1 })).toThrow(/between 0 and 2000/);
  });
});
