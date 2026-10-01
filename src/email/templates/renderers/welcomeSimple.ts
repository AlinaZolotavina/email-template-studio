import { emailText, joinHtml, tableCell } from '../../core';
import { welcomeSimpleManifest } from '../manifests/welcomeSimple';
import {
  brandRow,
  contentTable,
  createTemplateRenderer,
  ctaRow,
  linkValuesRow,
  preheaderRow,
} from './shared';

export const renderWelcomeSimple = createTemplateRenderer(
  welcomeSimpleManifest,
  'greeting',
  (session) => {
    return contentTable(
      session,
      joinHtml([
        session.boolean('showPreheader') ? preheaderRow(session) : null,
        session.boolean('showHeader') ? brandRow(session, 'AP') : null,
        session.boolean('showHeader') ? tableCell({
          children: emailText({
            text: session.string('greeting'),
            tag: 'h1',
            style: {
              color: session.draft.theme.textColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 42,
              fontWeight: 700,
              lineHeight: 48,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [8, 40, 4, 40] },
        }) : null,
        session.boolean('showHeader') ? tableCell({
          children: emailText({
            text: session.string('subheading'),
            style: {
              color: session.draft.theme.mutedTextColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 20,
              lineHeight: 28,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [0, 40, 18, 40] },
        }) : null,
        session.boolean('showHeader') ? tableCell({
          children: emailText({
            text: '+',
            style: {
              color: '#FB7185',
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 24,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [0, 40, 18, 40] },
        }) : null,
        session.boolean('showMessage') ? tableCell({
          children: emailText({
            text: session.string('body'),
            style: {
              color: session.draft.theme.textColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 16,
              lineHeight: 25,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: {
            backgroundColor: '#F5F3F7',
            borderRadius: 8,
            padding: [26, 52],
          },
        }) : null,
        session.boolean('showAction') ? ctaRow(session) : null,
        session.boolean('showFooter') ? tableCell({
          children: emailText({
              text: session.string('helpText'),
              style: {
                color: session.draft.theme.mutedTextColor,
                fontFamily: session.draft.theme.fontFamily,
                fontSize: 12,
                lineHeight: 18,
                margin: [0, 0, 4, 0],
                textAlign: 'center',
              },
            }),
          align: 'center',
          style: {
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            borderWidth: 1,
            padding: [0, 40, 22, 40],
          },
        }) : null,
        session.boolean('showFooter') ? linkValuesRow(session, 'footerLinks', 11) : null,
        session.boolean('showFooter') ? tableCell({
          children: emailText({
            text: session.string('footerText'),
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
          style: { padding: [12, 48, 0, 48] },
        }) : null,
        session.boolean('showFooter') ? tableCell({
          children: emailText({ text: '', style: { margin: 0 } }),
          style: { padding: [0, 0, 18, 0] },
        }) : null,
      ]),
    );
  },
);
