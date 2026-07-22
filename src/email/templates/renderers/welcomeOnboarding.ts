import { emailText, joinHtml, presentationTable, tableCell } from '../../core';
import type { EmailHtml } from '../../core';
import { welcomeOnboardingManifest } from '../manifests/welcomeOnboarding';
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

function step(session: RenderSession, index: number): EmailHtml {
  return tableCell({
    children: presentationTable({
      width: '100%',
      children: joinHtml([
        tableCell({
          children: emailText({
            text: `Step ${index}`,
            style: {
              color: session.draft.theme.accentColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 20,
              margin: [0, 0, 4, 0],
            },
          }),
        }),
        tableCell({
          children: emailText({
            text: session.string(`step${index}Title`),
            tag: 'h2',
            style: {
              color: session.draft.theme.textColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 27,
              margin: [0, 0, 6, 0],
            },
          }),
        }),
        tableCell({
          children: emailText({
            text: session.string(`step${index}Text`),
            style: {
              color: session.draft.theme.mutedTextColor,
              fontFamily: session.draft.theme.fontFamily,
              fontSize: 15,
              lineHeight: 24,
              margin: 0,
            },
          }),
        }),
      ]),
    }),
    style: {
      borderColor: '#E5E7EB',
      borderStyle: 'solid',
      borderWidth: 1,
      padding: [20, 28],
      backgroundColor: session.draft.theme.surfaceColor,
    },
  });
}

export const renderWelcomeOnboarding = createTemplateRenderer(
  welcomeOnboardingManifest,
  'greeting',
  (session) => {
    const support = session.boolean('showSupport')
      ? session.textLink('supportLink', session.link('supportLink'))
      : null;
    return contentTable(
      session,
      joinHtml([
        logoRow(session),
        headingRow(session, session.string('greeting')),
        paragraphRow(session, session.string('intro')),
        step(session, 1),
        step(session, 2),
        step(session, 3),
        ctaRow(session),
        support === null
          ? null
          : tableCell({
              children: support,
              align: 'center',
              style: { padding: [0, 40, 28, 40] },
            }),
        footerRow(session, session.string('footerText')),
      ]),
    );
  },
);
