import {
  emailText,
  joinHtml,
  presentationTable,
  tableCell,
  tableDataCell,
  tableRow,
} from '../../core';
import type { EmailHtml } from '../../core';
import type { StepValue } from '../../types';
import { welcomeOnboardingManifest } from '../manifests/welcomeOnboarding';
import {
  brandRow,
  contentTable,
  createTemplateRenderer,
  ctaRow,
  linkValuesRow,
  preheaderRow,
  type RenderSession,
} from './shared';

function step(session: RenderSession, value: StepValue, index: number): EmailHtml {
  return tableCell({
    children: presentationTable({
      width: '100%',
      children: tableRow(
        joinHtml([
          tableDataCell({
            children: presentationTable({
              width: 38,
              children: tableRow(tableDataCell({
                children: emailText({
                  text: String(index + 1),
                  style: {
                    color: session.draft.theme.accentColor,
                    fontFamily: session.draft.theme.fontFamily,
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 38,
                    margin: 0,
                    textAlign: 'center',
                  },
                }),
                align: 'center',
                valign: 'middle',
                style: {
                  backgroundColor: '#EFF6FF',
                  borderRadius: 999,
                  width: 38,
                  height: 38,
                  padding: 0,
                },
              })),
            }),
            align: 'center',
            valign: 'top',
            style: {
              width: 38,
              padding: 0,
            },
          }),
          tableDataCell({
            children: joinHtml([
              emailText({
                text: value.title,
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
                text: value.text,
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
        session.boolean('showPreheader') ? preheaderRow(session) : null,
        session.boolean('showHeader') ? brandRow(session, '<>') : null,
        session.boolean('showHeader') ? tableCell({
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
        }) : null,
        session.boolean('showHeader') ? tableCell({
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
        }) : null,
        joinHtml((session.draft.fields.steps as StepValue[]).map((value, index) => step(session, value, index))),
        session.boolean('showAction') ? ctaRow(session) : null,
        !session.boolean('showAction') || support === null
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
        session.boolean('showFooter') ? tableCell({
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
        }) : null,
        session.boolean('showFooter') ? tableCell({
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
        }) : null,
        session.boolean('showFooter') ? linkValuesRow(session, 'footerLinks', 9) : null,
        session.boolean('showFooter') ? tableCell({
          children: emailText({ text: '', style: { margin: 0 } }),
          style: { padding: [0, 0, 18, 0] },
        }) : null,
      ]),
    );
  },
);
