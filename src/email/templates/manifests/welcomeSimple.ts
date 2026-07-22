import type { TemplateManifest } from '../../types';
import { createTheme, THEME_COLOR_FIELDS } from './shared';

export const welcomeSimpleManifest = {
  id: 'welcome-simple',
  name: 'Simple welcome',
  category: 'welcome',
  description: 'A direct welcome message with one clear next action.',
  thumbnailPath: 'template-thumbnails/welcome-simple.png',
  defaults: {
    templateId: 'welcome-simple',
    schemaVersion: 1,
    theme: createTheme({ accentColor: '#7C3AED' }),
    fields: {
      preheader: 'Welcome - your account is ready.',
      logo: { remoteUrl: '', alt: 'Company logo' },
      greeting: 'Welcome aboard!',
      body: 'Thanks for joining us. Your workspace is ready, and you can begin whenever you are.',
      primaryCta: { label: 'Open your workspace', url: 'https://example.com/app' },
      helpUrl: 'https://example.com/help',
      footerText: 'Questions? Visit our help center for quick answers.',
    },
  },
  fields: [
    { key: 'preheader', type: 'text', label: 'Preheader', group: 'content', maxLength: 140 },
    { key: 'logo', type: 'image', label: 'Logo', group: 'brand', recommendedSize: '240 x 80 px' },
    { key: 'greeting', type: 'text', label: 'Greeting', group: 'content', maxLength: 90 },
    { key: 'body', type: 'textarea', label: 'Message', group: 'content', maxLength: 600, rows: 6 },
    { key: 'primaryCta', type: 'link', label: 'Primary button', group: 'buttons' },
    { key: 'helpUrl', type: 'url', label: 'Help center URL', group: 'footer' },
    { key: 'footerText', type: 'textarea', label: 'Footer text', group: 'footer', maxLength: 300, rows: 3 },
    ...THEME_COLOR_FIELDS,
  ],
} as const satisfies TemplateManifest;
