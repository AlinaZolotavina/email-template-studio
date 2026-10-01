import {
  emailText,
  joinHtml,
  presentationTable,
  tableCell,
  tableDataCell,
  tableRow,
} from '../../core';
import { newsletterPromoManifest } from '../manifests/newsletterPromo';
import {
  brandRow,
  contentTable,
  createTemplateRenderer,
  ctaRow,
  linkValuesRow,
  preheaderRow,
} from './shared';

export const renderNewsletterPromo = createTemplateRenderer(
  newsletterPromoManifest,
  'heading',
  (session) => {
    const hero = session.optionalImage('heroImage', 520, 347);
    const benefits = session.benefits('benefits');
    const benefitRow = session.boolean('showBenefits')
      ? tableCell({
          children: presentationTable({
            width: '100%',
            children: tableRow(
              joinHtml(
                benefits.map((benefit) =>
                  tableDataCell({
                    children: joinHtml([
                      emailText({
                        text: benefit.label,
                        style: {
                          color: session.draft.theme.accentColor,
                          fontFamily: session.draft.theme.fontFamily,
                          fontSize: 12,
                          fontWeight: 700,
                          lineHeight: 18,
                          margin: [0, 0, 5, 0],
                          textAlign: 'center',
                        },
                      }),
                      emailText({
                        text: benefit.text,
                        style: {
                          color: session.draft.theme.textColor,
                          fontFamily: session.draft.theme.fontFamily,
                          fontSize: 10,
                          fontWeight: 700,
                          lineHeight: 15,
                          margin: 0,
                          textAlign: 'center',
                        },
                      }),
                    ]),
                    align: 'center',
                    valign: 'top',
                    style: { padding: [0, 10], width: 120 },
                  }),
                ),
              ),
            ),
          }),
          style: { padding: [12, 40, 24, 40] },
        })
      : null;

    return contentTable(
      session,
      joinHtml([
        session.boolean('showPreheader') ? preheaderRow(session) : null,
        session.boolean('showHeader') ? brandRow(session, '*') : null,
        !session.boolean('showHeader') || hero === null
          ? null
          : tableCell({
              children: hero,
              align: 'center',
              style: { padding: [0, 40, 24, 40] },
            }),
        session.boolean('showHeader') ? tableCell({
          children: emailText({
            text: session.string('eyebrow').toUpperCase(),
            style: {
              color: session.draft.theme.mutedTextColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 16,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
        }) : null,
        session.boolean('showHeader') ? tableCell({
          children: emailText({
            text: session.string('heading'),
            tag: 'h1',
            style: {
              color: session.draft.theme.textColor,
              fontFamily: 'Georgia',
              fontSize: 46,
              fontWeight: 700,
              lineHeight: 46,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [6, 40, 8, 40] },
        }) : null,
        session.boolean('showHeader') ? tableCell({
          children: emailText({
            text: session.string('offerText'),
            style: {
              color: session.draft.theme.textColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 14,
              lineHeight: 21,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [0, 64, 16, 64] },
        }) : null,
        benefitRow,
        session.boolean('showAction') ? ctaRow(session) : null,
        session.boolean('showFooter') ? tableCell({
          children: emailText({
            text: session.string('termsText'),
            style: {
              color: session.draft.theme.mutedTextColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 10,
              lineHeight: 15,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: {
            borderColor: '#D9DED9',
            borderStyle: 'solid',
            borderWidth: 1,
            padding: [0, 48, 20, 48],
          },
        }) : null,
        session.boolean('showFooter') && session.boolean('showSocialLinks') ? linkValuesRow(session, 'socialLinks', 11) : null,
        session.boolean('showFooter') && session.boolean('showFooterText') ? tableCell({
          children: emailText({
            text: session.string('footerText'),
            style: {
              color: session.draft.theme.mutedTextColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 10,
              lineHeight: 16,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [10, 32, 0, 32] },
        }) : null,
        session.boolean('showFooter') && session.boolean('showLegalLinks') ? linkValuesRow(session, 'legalLinks', 10) : null,
        session.boolean('showFooter') ? tableCell({
          children: emailText({
            text: session.string('address'),
            style: {
              color: session.draft.theme.mutedTextColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 9,
              lineHeight: 14,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [8, 32, 24, 32] },
        }) : null,
      ]),
    );
  },
);
