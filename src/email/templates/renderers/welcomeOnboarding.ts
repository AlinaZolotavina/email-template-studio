import {
  emailText,
  joinHtml,
  presentationTable,
  tableCell,
  tableDataCell,
  tableRow,
} from '../../core';
import type { EmailHtml } from '../../core';
import { welcomeOnboardingManifest } from '../manifests/welcomeOnboarding';
import {
  brandRow,
  contentTable,
  createTemplateRenderer,
  ctaRow,
  linksRow,
  preheaderRow,
  type RenderSession,
} from './shared';

function step(session: RenderSession, index: number): EmailHtml {
  return tableCell({
    children: presentationTable({
      width: '100%',
      children: tableRow(
        joinHtml([
          tableDataCell({
            children: emailText({
              text: String(index),
              style: {
                color: session.draft.theme.accentColor,
                fontFamily: session.draft.theme.fontFamily,
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 28,
                margin: 0,
                textAlign: 'center',
              },
            }),
            align: 'center',
            valign: 'top',
            style: {
              backgroundColor: '#EFF6FF',
              borderRadius: 20,
              width: 38,
              padding: [5, 0],
            },
          }),
          tableDataCell({
            children: joinHtml([
              emailText({
                text: session.string(`step${index}Title`),
                tag: 'h2',
                style: {
                  color: session.draft.theme.textColor,
                  fontFamily: session.draft.theme.fontFamily,
                  fontSize: 17,
                  fontWeight: 700,
                  lineHeight: 23,
                  margin: [0, 0, 5, 0],
                },
              }),
              emailText({
                text: session.string(`step${index}Text`),
                style: {
                  color: session.draft.theme.mutedTextColor,
                  fontFamily: session.draft.theme.fontFamily,
                  fontSize: 13,
                  lineHeight: 20,
                  margin: 0,
                },
              }),
            ]),
            valign: 'top',
            style: { padding: [0, 0, 0, 18] },
          }),
        ]),
      ),
    }),
    style: {
      borderColor: '#DCE3EA',
      borderRadius: 7,
      borderStyle: 'solid',
      borderWidth: 1,
      padding: [20, 24],
      backgroundColor: session.draft.theme.surfaceColor,
    },
  });
}

export const renderWelcomeOnboarding = createTemplateRenderer(
  welcomeOnboardingManifest,
  'greeting',
  (session) => {
    const support = session.boolean('showSupport')
      ? session.textLink(
          'supportLink',
          session.link('supportLink'),
          session.draft.theme.accentColor,
          12,
        )
      : null;
    return contentTable(
      session,
      joinHtml([
        preheaderRow(session),
        brandRow(session, '<>'),
        tableCell({
          children: emailText({
            text: session.string('greeting'),
            tag: 'h1',
            style: {
              color: session.draft.theme.accentColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 41,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [6, 32, 8, 32] },
        }),
        tableCell({
          children: emailText({
            text: session.string('intro'),
            style: {
              color: session.draft.theme.textColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 14,
              lineHeight: 22,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: { padding: [0, 64, 20, 64] },
        }),
        step(session, 1),
        step(session, 2),
        step(session, 3),
        ctaRow(session),
        support === null
          ? null
          : tableCell({
              children: joinHtml([
                emailText({
                  text: session.string('supportText'),
                  style: {
                    color: session.draft.theme.mutedTextColor,
                    fontFamily: session.draft.theme.fontFamily,
                    fontSize: 12,
                    lineHeight: 18,
                    margin: [0, 0, 4, 0],
                    textAlign: 'center',
                  },
                }),
                support,
              ]),
              align: 'center',
              style: { padding: [0, 40, 22, 40] },
            }),
        tableCell({
          children: emailText({
            text: session.string('signoffText'),
            style: {
              color: session.draft.theme.mutedTextColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 11,
              lineHeight: 17,
              margin: 0,
              textAlign: 'center',
            },
          }),
          align: 'center',
          style: {
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            borderWidth: 1,
            padding: [20, 40, 12, 40],
          },
        }),
        tableCell({
          children: emailText({
            text: session.string('footerText'),
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
          style: { padding: [0, 48, 0, 48] },
        }),
        linksRow(session, ['unsubscribeLink', 'privacyLink', 'termsLink'], 9),
        tableCell({
          children: emailText({ text: '', style: { margin: 0 } }),
          style: { padding: [0, 0, 18, 0] },
        }),
      ]),
    );
  },
);
