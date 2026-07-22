import { emailText, joinHtml, presentationTable, tableCell } from '../../core';
import type { EmailHtml } from '../../core';
import { newsletterDigestManifest } from '../manifests/newsletterDigest';
import {
  contentTable,
  createTemplateRenderer,
  ctaRow,
  footerRow,
  headingRow,
  logoRow,
  paragraphRow,
  type RenderSession,
} from './shared';

function article(session: RenderSession, index: number): EmailHtml {
  const image = session.boolean('showArticleImages')
    ? session.optionalImage(`article${index}Image`, 520, 260)
    : null;
  const link = session.link(`article${index}Link`);
  const linkHtml = session.textLink(`article${index}Link`, link);

  return tableCell({
    children: presentationTable({
      width: '100%',
      children: joinHtml([
        image === null
          ? null
          : tableCell({ children: image, style: { padding: [0, 0, 20, 0] } }),
        tableCell({
          children: emailText({
            text: session.string(`article${index}Title`),
            tag: 'h2',
            style: {
              color: session.draft.theme.textColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 29,
              margin: [0, 0, 8, 0],
            },
          }),
        }),
        tableCell({
          children: emailText({
            text: session.string(`article${index}Text`),
            style: {
              color: session.draft.theme.mutedTextColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 15,
              lineHeight: 24,
              margin: [0, 0, 12, 0],
            },
          }),
        }),
        linkHtml === null ? null : tableCell({ children: linkHtml }),
      ]),
    }),
    style: {
      borderColor: '#E5E7EB',
      borderStyle: 'solid',
      borderWidth: 1,
      padding: [24, 40],
      backgroundColor: session.draft.theme.surfaceColor,
    },
  });
}

export const renderNewsletterDigest = createTemplateRenderer(
  newsletterDigestManifest,
  'heading',
  (session) => {
    const companyUrl = session.string('companyUrl');
    return contentTable(
      session,
      joinHtml([
        logoRow(session),
        headingRow(session, session.string('heading')),
        paragraphRow(session, session.string('intro')),
        article(session, 1),
        article(session, 2),
        article(session, 3),
        ctaRow(session),
        footerRow(session, session.string('footerText'), {
          key: 'companyUrl',
          label: 'Visit our website',
          url: companyUrl,
        }),
      ]),
    );
  },
);
