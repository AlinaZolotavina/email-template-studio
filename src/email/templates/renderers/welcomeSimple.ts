import { joinHtml } from '../../core';
import { welcomeSimpleManifest } from '../manifests/welcomeSimple';
import {
  contentTable,
  createTemplateRenderer,
  ctaRow,
  footerRow,
  headingRow,
  logoRow,
  paragraphRow,
} from './shared';

export const renderWelcomeSimple = createTemplateRenderer(
  welcomeSimpleManifest,
  'greeting',
  (session) =>
    contentTable(
      session,
      joinHtml([
        logoRow(session),
        headingRow(session, session.string('greeting')),
        paragraphRow(session, session.string('body')),
        ctaRow(session),
        footerRow(session, session.string('footerText'), {
          key: 'helpUrl',
          label: 'Visit the help center',
          url: session.string('helpUrl'),
        }),
      ]),
    ),
);
