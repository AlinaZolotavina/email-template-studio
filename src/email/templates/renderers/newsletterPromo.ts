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
  linksRow,
} from './shared';

export const renderNewsletterPromo = createTemplateRenderer(
  newsletterPromoManifest,
  'heading',
  (session) => {
    const hero = session.optionalImage('heroImage', 520, 347);
    const benefits = session
      .string('benefits')
      .split(/\r?\n/)
      .filter((item) => item.trim() !== '');
    const benefitRow = session.boolean('showBenefits')
      ? tableCell({
          children: presentationTable({
            width: '100%',
            children: tableRow(
              joinHtml(
                benefits.map((benefit, index) =>
                  tableDataCell({
                    children: joinHtml([
                      emailText({
                        text: ['OK', 'FAST', 'EASY'][index] ?? 'OK',
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
                        text: benefit,
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
        brandRow(session, '*'),
        hero === null
          ? null
          : tableCell({
              children: hero,
              align: 'center',
              style: { padding: [0, 40, 24, 40] },
            }),
        tableCell({
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
        }),
        tableCell({
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
        }),
        tableCell({
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
        }),
        benefitRow,
        ctaRow(session),
        tableCell({
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
        }),
        linksRow(session, ['socialEmail', 'socialInstagram', 'socialFacebook'], 12),
        tableCell({
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
        }),
        linksRow(session, ['unsubscribeLink', 'preferencesLink'], 10),
        tableCell({
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
        }),
      ]),
    );
  },
);
