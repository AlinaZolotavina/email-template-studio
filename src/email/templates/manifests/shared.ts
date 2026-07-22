import type { EmailTheme, TemplateField } from '../../types';

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
  {
    key: 'theme.buttonTextColor',
    type: 'color',
    label: 'Button text color',
    group: 'brand',
    themeKey: 'buttonTextColor',
  },
] as const satisfies readonly TemplateField[];

export function createTheme(overrides: Partial<EmailTheme> = {}): EmailTheme {
  return { ...DEFAULT_THEME, ...overrides };
}
