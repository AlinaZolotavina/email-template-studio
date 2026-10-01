import {
  emailText,
  joinHtml,
  presentationTable,
  tableCell,
  tableDataCell,
  tableRow,
} from '../../core';
import type { EmailHtml } from '../../core';
import type { ArticleValue } from '../../types';
import { newsletterDigestManifest } from '../manifests/newsletterDigest';
import {
  brandRow,
  contentTable,
  createTemplateRenderer,
  ctaRow,
  linkValuesRow,
  preheaderRow,
  type RenderSession,
} from './shared';

function article(session: RenderSession, value: ArticleValue, index: number): EmailHtml {
  const image = session.boolean('showArticleImages')
    ? session.optionalImageValue(`articles.${index}.image`, value.image, 180, 135)
    : null;
  const link = session.textLink(
    `articles.${index}.link`,
    value.link,
    session.draft.theme.accentColor,
    13,
  );
  const copy = joinHtml([
    emailText({
      text: value.category.toUpperCase(),
      style: {
        color: session.draft.theme.accentColor,
        fontFamily: session.draft.theme.fontFamily,
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 15,
        margin: [0, 0, 4, 0],
      },
    }),
    emailText({
      text: value.title,
      tag: 'h2',
      style: {
        color: session.draft.theme.textColor,
        fontFamily: session.draft.theme.fontFamily,
        fontSize: 19,
        fontWeight: 700,
        lineHeight: 23,
        margin: [0, 0, 6, 0],
      },
    }),
    emailText({
      text: value.text,
      style: {
        color: session.draft.theme.mutedTextColor,
        fontFamily: session.draft.theme.fontFamily,
        fontSize: 13,
        lineHeight: 19,
        margin: [0, 0, 7, 0],
      },
    }),
    link,
  ]);

  return tableCell({
    children: presentationTable({
      width: '100%',
      children: tableRow(
        joinHtml([
          image === null
            ? null
            : tableDataCell({
                children: image,
                className: 'mobile-stack',
                valign: 'middle',
                style: { width: 180 },
              }),
          tableDataCell({
            children: copy,
            className: image === null ? undefined : 'mobile-stack mobile-stack-pad',
            valign: 'middle',
            style: { padding: image === null ? 0 : [0, 0, 0, 22] },
          }),
        ]),
      ),
    }),
    style: {
      borderColor: '#DDE5E5',
      borderStyle: 'solid',
      borderWidth: 1,
      padding: [20, 32],
      backgroundColor: session.draft.theme.surfaceColor,
    },
  });
}

function digestFooter(session: RenderSession): EmailHtml {
  const share = session.textLink(
    'shareLink',
    session.link('shareLink'),
    session.draft.theme.accentColor,
    12,
  );
  return joinHtml([
    tableCell({
      children: joinHtml([
        emailText({
          text: session.string('shareText'),
          style: {
            color: session.draft.theme.mutedTextColor,
            fontFamily: session.draft.theme.fontFamily,
            fontSize: 12,
            lineHeight: 18,
            margin: [0, 0, 3, 0],
            textAlign: 'center',
          },
        }),
        share,
      ]),
      align: 'center',
      style: { padding: [18, 32, 10, 32] },
    }),
    linkValuesRow(session, 'footerLinks', 11),
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
      style: { padding: [12, 32, 0, 32] },
    }),
    tableCell({
      children: emailText({
        text: '',
        style: { margin: 0 },
      }),
      style: { padding: [0, 0, 14, 0] },
    }),
  ]);
}

export const renderNewsletterDigest = createTemplateRenderer(
  newsletterDigestManifest,
  'heading',
  (session) =>
    contentTable(
      session,
      joinHtml([
        session.boolean('showPreheader') ? preheaderRow(session) : null,
        session.boolean('showHeader') ? brandRow(session, '//') : null,
        session.boolean('showHeader') ?
        tableCell({
          children: emailText({
            text: session.string('heading'),
            tag: 'h1',
            style: {
              color: session.draft.theme.textColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 41,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [12, 32, 8, 32] },
        }) : null,
        session.boolean('showHeader') ?
        tableCell({
          children: emailText({
            text: session.string('intro'),
            style: {
              color: session.draft.theme.mutedTextColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 15,
              lineHeight: 23,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [0, 54, 18, 54] },
        }) : null,
        session.boolean('showHeader') ? ctaRow(session) : null,
        session.boolean('showArticles')
          ? joinHtml(session.articles('articles').map((value, index) => article(session, value, index)))
          : null,
        session.boolean('showFooter') ? digestFooter(session) : null,
      ]),
    ),
);
