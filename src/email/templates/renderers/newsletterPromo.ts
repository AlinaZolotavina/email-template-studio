import { emailText, joinHtml, presentationTable, tableCell } from '../../core';
import { newsletterPromoManifest } from '../manifests/newsletterPromo';
import {
  contentTable,
  createTemplateRenderer,
  ctaRow,
  footerRow,
  headingRow,
  logoRow,
  paragraphRow,
} from './shared';

export const renderNewsletterPromo = createTemplateRenderer(
  newsletterPromoManifest,
  'heading',
  (session) => {
    const hero = session.optionalImage('heroImage', session.draft.theme.contentWidth, 360);
    const benefits = session.string('benefits').split(/\r?\n/).filter((item) => item.trim() !== '');
    const benefitRows = session.boolean('showBenefits')
      ? benefits.map((benefit) =>
          tableCell({
            children: emailText({
              text: `• ${benefit}`,
              style: {
                color: session.draft.theme.textColor,
                fontFamily: session.draft.theme.fontFamily,
                fontSize: 15,
                lineHeight: 24,
                margin: [0, 0, 6, 0],
              },
            }),
          }),
        )
      : [];

    return contentTable(
      session,
      joinHtml([
        logoRow(session),
        hero === null ? null : tableCell({ children: hero }),
        tableCell({
          children: emailText({
            text: session.string('eyebrow').toUpperCase(),
            style: {
              color: session.draft.theme.accentColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 20,
              margin: 0,
            },
          }),
          align: 'center',
          style: { padding: [28, 40, 0, 40] },
        }),
        headingRow(session, session.string('heading')),
        paragraphRow(session, session.string('offerText')),
        benefitRows.length === 0
          ? null
          : tableCell({
              children: presentationTable({ width: '100%', children: joinHtml(benefitRows) }),
              style: { padding: [0, 64, 24, 64] },
            }),
        ctaRow(session),
        footerRow(session, session.string('footerText'), {
          key: 'termsUrl',
          label: 'View offer terms',
          url: session.string('termsUrl'),
        }),
      ]),
    );
  },
);
