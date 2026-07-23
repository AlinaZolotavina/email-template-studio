import { parse, type ParserError } from 'parse5';

import { exportRenderContext } from '../core';
import type { TemplateId } from '../types';
import {
  getTemplate,
  getTemplateDefaults,
} from '../../features/templates/templateRegistry';
import newsletterDigestFixture from './fixtures/newsletter-digest.html?raw';
import newsletterPromoFixture from './fixtures/newsletter-promo.html?raw';
import welcomeOnboardingFixture from './fixtures/welcome-onboarding.html?raw';
import welcomeSimpleFixture from './fixtures/welcome-simple.html?raw';

interface ParsedNode {
  nodeName: string;
  tagName?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: ParsedNode[];
  parentNode?: ParsedNode;
}

const fixtures = {
  'newsletter-digest': newsletterDigestFixture,
  'newsletter-promo': newsletterPromoFixture,
  'welcome-onboarding': welcomeOnboardingFixture,
  'welcome-simple': welcomeSimpleFixture,
} satisfies Record<TemplateId, string>;

function collectNodes(node: ParsedNode, tagName: string): ParsedNode[] {
  const matches = node.tagName === tagName ? [node] : [];
  return [
    ...matches,
    ...(node.childNodes ?? []).flatMap((child) => collectNodes(child, tagName)),
  ];
}

function attribute(node: ParsedNode, name: string): string | undefined {
  return node.attrs?.find((item) => item.name === name)?.value;
}

function hasAncestor(node: ParsedNode, tagName: string): boolean {
  let parent = node.parentNode;
  while (parent !== undefined) {
    if (parent.tagName === tagName) return true;
    parent = parent.parentNode;
  }
  return false;
}

describe.each(Object.entries(fixtures) as [TemplateId, string][])(
  '%s default email compatibility fixture',
  (templateId, fixture) => {
    it('is deterministic and matches the current default renderer output', () => {
      const result = getTemplate(templateId).render(
        getTemplateDefaults(templateId),
        exportRenderContext,
      );

      expect(result.errors).toEqual([]);
      expect(fixture).toBe(`${result.html}\n`);
    });

    it('is a parseable document with required email metadata', () => {
      const parseErrors: ParserError[] = [];
      const document = parse(fixture, {
        onParseError: (error) => parseErrors.push(error),
      }) as unknown as ParsedNode;

      expect(parseErrors).toEqual([]);
      expect(document.nodeName).toBe('#document');
      expect(document.childNodes?.[0]?.nodeName).toBe('#documentType');
      expect(collectNodes(document, 'html')).toHaveLength(1);
      expect(collectNodes(document, 'head')).toHaveLength(1);
      expect(collectNodes(document, 'body')).toHaveLength(1);
      expect(fixture).toMatch(/^<!doctype html>/);
      expect(fixture).toContain('<meta charset="utf-8">');
      expect(fixture).toContain(
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
      );
      expect(fixture).toContain(
        '<meta name="x-apple-disable-message-reformatting">',
      );
    });

    it('uses presentation tables for layout and inline visual styles', () => {
      const document = parse(fixture) as unknown as ParsedNode;
      const tables = collectNodes(document, 'table');
      const rows = collectNodes(document, 'tr');
      const cells = collectNodes(document, 'td');

      expect(tables.length).toBeGreaterThan(1);
      for (const table of tables) {
        expect(attribute(table, 'role')).toBe('presentation');
        expect(attribute(table, 'border')).toBe('0');
        expect(attribute(table, 'cellpadding')).toBe('0');
        expect(attribute(table, 'cellspacing')).toBe('0');
      }
      expect(
        tables.some(
          (table) =>
            attribute(table, 'width') === '100%' &&
            attribute(table, 'style')?.includes('background-color:'),
        ),
      ).toBe(true);
      expect(rows.every((row) => hasAncestor(row, 'table'))).toBe(true);
      expect(cells.every((cell) => hasAncestor(cell, 'tr'))).toBe(true);

      for (const tagName of ['h1', 'h2', 'h3', 'p', 'span', 'img']) {
        for (const node of collectNodes(document, tagName)) {
          expect(attribute(node, 'style')).toBeTruthy();
          expect(hasAncestor(node, 'td')).toBe(true);
        }
      }
      expect(fixture).not.toMatch(/<link\b[^>]*rel=["']stylesheet/i);
      expect(fixture).not.toMatch(/\b(?:display:grid|display:flex)\b/i);
    });

    it('includes a complete Outlook VML CTA fallback and mobile rules', () => {
      expect(fixture).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
      expect(fixture).toContain(
        'xmlns:o="urn:schemas-microsoft-com:office:office"',
      );
      expect(fixture).toContain(
        'xmlns:w="urn:schemas-microsoft-com:office:word"',
      );
      expect(fixture).toMatch(
        /<!--\[if mso\]><v:roundrect\b[^>]*href="https:\/\/[^"]+"[^>]*>[\s\S]*?<w:anchorlock\/>[\s\S]*?<!\[endif\]-->/,
      );
      expect(fixture).toContain('<o:PixelsPerInch>96</o:PixelsPerInch>');
      expect(fixture).toContain('@media screen and (max-width:620px)');
      expect(fixture).toContain('.email-container{width:100%!important');
      expect(fixture).toContain('.fluid-image{height:auto!important');
    });

    it('contains only absolute, export-safe resource URLs', () => {
      const urls = [...fixture.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(
        ([, value]) => value.replaceAll('&amp;', '&'),
      );

      expect(urls.length).toBeGreaterThan(0);
      for (const value of urls) {
        const url = new URL(value);
        expect(['https:', 'mailto:', 'tel:']).toContain(url.protocol);
      }
      expect(fixture).not.toMatch(/\b(?:blob:|data:|javascript:)/i);
    });
  },
);
