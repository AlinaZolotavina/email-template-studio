import type { TemplateManifest } from '../../types';
import { createTheme, THEME_COLOR_FIELDS } from './shared';

const promoHero = {
  remoteUrl: 'https://raw.githubusercontent.com/AlinaZolotavina/email-template-studio/main/public/template-assets/promo-hero.png',
  localPreviewUrl: `${import.meta.env.BASE_URL}template-assets/promo-hero.png`,
  alt: 'Minimal product display with vase and geometric forms',
};

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
      heroImage: promoHero,
      eyebrow: 'LIMITED TIME OFFER',
      heading: '20% OFF SITEWIDE',
      offerText: 'Our way of saying thank you. Enjoy 20% off everything, for a limited time only.',
      benefits: 'QUALITY YOU CAN TRUST\nFAST & RELIABLE SHIPPING\nEASY RETURNS, NO HASSLE',
      primaryCta: { label: 'SHOP NOW', url: 'https://example.com/offer' },
      showBenefits: true,
      termsText: 'Offer valid through May 25, 2026 at 11:59 PM PT. Exclusions apply. Discount shown at checkout.',
      socialEmail: { label: 'Email', url: 'mailto:hello@example.com' },
      socialInstagram: { label: 'IG', url: 'https://example.com/instagram' },
      socialFacebook: { label: 'f', url: 'https://example.com/facebook' },
      footerText: "You're receiving this email because you signed up for updates.",
      unsubscribeLink: { label: 'Unsubscribe', url: 'https://example.com/unsubscribe' },
      preferencesLink: { label: 'Manage preferences', url: 'https://example.com/preferences' },
      address: '1234 Market St, Suite 567, San Francisco, CA 94103',
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
    { key: 'termsText', type: 'textarea', label: 'Offer terms', group: 'footer', maxLength: 400, rows: 3 },
    { key: 'socialEmail', type: 'link', label: 'Email link', group: 'footer' },
    { key: 'socialInstagram', type: 'link', label: 'Instagram link', group: 'footer' },
    { key: 'socialFacebook', type: 'link', label: 'Facebook link', group: 'footer' },
    { key: 'footerText', type: 'textarea', label: 'Footer text', group: 'footer', maxLength: 300, rows: 3 },
    { key: 'unsubscribeLink', type: 'link', label: 'Unsubscribe link', group: 'footer' },
    { key: 'preferencesLink', type: 'link', label: 'Preferences link', group: 'footer' },
    { key: 'address', type: 'textarea', label: 'Business address', group: 'footer', maxLength: 300, rows: 2 },
    ...THEME_COLOR_FIELDS,
  ],
} as const satisfies TemplateManifest;
