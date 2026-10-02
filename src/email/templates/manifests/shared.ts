import type { EmailTheme, ImageValue, TemplateField } from '../../types';

export function createSampleLogo(alt: string): ImageValue {
  return {
    remoteUrl:
      'https://raw.githubusercontent.com/AlinaZolotavina/email-template-studio/main/public/template-assets/logo-sample.svg',
    localPreviewUrl: `${import.meta.env.BASE_URL}template-assets/logo-sample.svg`,
    alt,
  };
}

export const DEFAULT_THEME: EmailTheme = {
  backgroundColor: '#F3F4F6',
  surfaceColor: '#FFFFFF',
  textColor: '#111827',
  mutedTextColor: '#6B7280',
  accentColor: '#2563EB',
  buttonTextColor: '#FFFFFF',
  fontFamily: 'Arial',
  contentWidth: 600,
};

export const THEME_COLOR_FIELDS = [
  {
    key: 'theme.backgroundColor',
    type: 'color',
    label: 'Page background',
    group: 'brand',
    themeKey: 'backgroundColor',
  },
  {
    key: 'theme.surfaceColor',
    type: 'color',
    label: 'Content background',
    group: 'brand',
    themeKey: 'surfaceColor',
  },
  {
    key: 'theme.textColor',
    type: 'color',
    label: 'Text color',
    group: 'brand',
    themeKey: 'textColor',
  },
  {
    key: 'theme.mutedTextColor',
    type: 'color',
    label: 'Muted text color',
    group: 'brand',
    themeKey: 'mutedTextColor',
  },
  {
    key: 'theme.accentColor',
    type: 'color',
    label: 'Accent color',
    group: 'brand',
    themeKey: 'accentColor',
  },
] as const satisfies readonly TemplateField[];

export const THEME_COLOR_FIELD_KEYS = THEME_COLOR_FIELDS.map(({ key }) => key);

export function createTheme(overrides: Partial<EmailTheme> = {}): EmailTheme {
  return { ...DEFAULT_THEME, ...overrides };
}
