import type { TemplateManifest } from '../../types';
import { createTheme, THEME_COLOR_FIELDS } from './shared';

export const newsletterPromoManifest = {
  id: 'newsletter-promo',
  name: 'Promotional offer',
  category: 'newsletter',
  description: 'A campaign layout centered on one offer and its benefits.',
  thumbnailPath: 'template-thumbnails/newsletter-promo.png',
  defaults: {
    templateId: 'newsletter-promo',
    schemaVersion: 1,
    theme: createTheme({
      backgroundColor: '#FFF7ED',
      accentColor: '#C2410C',
    }),
    fields: {
      preheader: 'A limited offer created for our subscribers.',
      logo: { remoteUrl: '', alt: 'Company logo' },
      heroImage: { remoteUrl: '', alt: 'Featured product' },
      eyebrow: 'Subscriber exclusive',
      heading: 'Make your next project happen',
      offerText: 'Save 20% on everything you need to get started this week.',
      benefits: 'Simple setup\nUseful defaults\nSupport when you need it',
      primaryCta: { label: 'Claim the offer', url: 'https://example.com/offer' },
      showBenefits: true,
      termsUrl: 'https://example.com/terms',
      footerText: 'Offer availability and terms may change.',
    },
  },
  fields: [
    { key: 'preheader', type: 'text', label: 'Preheader', group: 'content', maxLength: 140 },
    { key: 'logo', type: 'image', label: 'Logo', group: 'brand', recommendedSize: '240 x 80 px' },
    { key: 'heroImage', type: 'image', label: 'Hero image', group: 'images', recommendedSize: '1200 x 720 px' },
    { key: 'eyebrow', type: 'text', label: 'Eyebrow', group: 'content', maxLength: 50 },
    { key: 'heading', type: 'text', label: 'Heading', group: 'content', maxLength: 90 },
    { key: 'offerText', type: 'textarea', label: 'Offer description', group: 'content', maxLength: 360, rows: 4 },
    { key: 'benefits', type: 'textarea', label: 'Benefits', group: 'content', maxLength: 400, rows: 5 },
    { key: 'primaryCta', type: 'link', label: 'Primary button', group: 'buttons' },
    { key: 'showBenefits', type: 'toggle', label: 'Show benefits', group: 'content' },
    { key: 'termsUrl', type: 'url', label: 'Terms URL', group: 'footer' },
    { key: 'footerText', type: 'textarea', label: 'Footer text', group: 'footer', maxLength: 300, rows: 3 },
    ...THEME_COLOR_FIELDS,
  ],
} as const satisfies TemplateManifest;
