export const TEMPLATE_IDS = [
  'newsletter-digest',
  'newsletter-promo',
  'welcome-simple',
  'welcome-onboarding',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type TemplateCategory = 'newsletter' | 'welcome';

export const EMAIL_FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Tahoma',
  'Verdana',
] as const;

export type EmailFontFamily = (typeof EMAIL_FONT_FAMILIES)[number];

export interface EmailTheme {
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  buttonTextColor: string;
  fontFamily: EmailFontFamily;
  contentWidth: number;
}

export type ThemeColorKey = Exclude<
  keyof EmailTheme,
  'fontFamily' | 'contentWidth'
>;

export interface ImageValue {
  remoteUrl: string;
  localPreviewUrl?: string;
  alt: string;
}

export type PersistedImageValue = Omit<ImageValue, 'localPreviewUrl'>;

export interface LinkValue {
  label: string;
  url: string;
}

export interface ArticleValue {
  category: string;
  title: string;
  text: string;
  image: ImageValue;
  link: LinkValue;
}

export interface BenefitValue {
  label: string;
  text: string;
}

export type LinkListValue = LinkValue[];
export type ArticleListValue = ArticleValue[];
export type BenefitListValue = BenefitValue[];

export type EmailFieldValue =
  | string
  | boolean
  | LinkValue
  | ImageValue
  | LinkListValue
  | ArticleListValue
  | BenefitListValue;
export type PersistedEmailFieldValue =
  | string
  | boolean
  | LinkValue
  | PersistedImageValue
  | LinkListValue
  | (Omit<ArticleValue, 'image'> & { image: PersistedImageValue })[]
  | BenefitListValue;

export interface EmailDraft {
  templateId: TemplateId;
  schemaVersion: number;
  theme: EmailTheme;
  fields: Record<string, EmailFieldValue>;
}

export interface PersistedEmailDraft {
  templateId: TemplateId;
  schemaVersion: number;
  theme: EmailTheme;
  fields: Record<string, PersistedEmailFieldValue>;
}

export type TemplateFieldGroup =
  | 'content'
  | 'brand'
  | 'images'
  | 'buttons'
  | 'footer';

interface TemplateFieldBase {
  key: string;
  label: string;
  group: TemplateFieldGroup;
}

export interface TextTemplateField extends TemplateFieldBase {
  type: 'text';
  maxLength: number;
}

export interface TextareaTemplateField extends TemplateFieldBase {
  type: 'textarea';
  maxLength: number;
  rows?: number;
}

export interface ColorTemplateField extends TemplateFieldBase {
  type: 'color';
  themeKey: ThemeColorKey;
}

export interface UrlTemplateField extends TemplateFieldBase {
  type: 'url';
}

export interface ImageTemplateField extends TemplateFieldBase {
  type: 'image';
  recommendedSize: string;
}

export interface LinkTemplateField extends TemplateFieldBase {
  type: 'link';
}

export interface ToggleTemplateField extends TemplateFieldBase {
  type: 'toggle';
}

export interface LinkListTemplateField extends TemplateFieldBase {
  type: 'link-list';
  maxItems: number;
}

export interface ArticleListTemplateField extends TemplateFieldBase {
  type: 'article-list';
  maxItems: number;
}

export interface BenefitListTemplateField extends TemplateFieldBase {
  type: 'benefit-list';
  maxItems: number;
}

export type TemplateField =
  | TextTemplateField
  | TextareaTemplateField
  | ColorTemplateField
  | UrlTemplateField
  | ImageTemplateField
  | LinkTemplateField
  | ToggleTemplateField
  | LinkListTemplateField
  | ArticleListTemplateField
  | BenefitListTemplateField;

export interface TemplateEditorSection {
  id: string;
  label: string;
  fieldKeys: readonly string[];
  hiddenFieldLabels?: readonly string[];
  visibilityFieldKey?: string;
}

export interface RenderContext {
  mode: 'export' | 'preview';
  resolveImageSource(value: ImageValue): string;
}

export interface RenderIssue {
  code: string;
  message: string;
  fieldKey?: string;
}

export type RenderWarning = RenderIssue;
export type RenderError = RenderIssue;

export interface RenderResult {
  html: string;
  warnings: RenderWarning[];
  errors: RenderError[];
}

export interface TemplateManifest {
  id: TemplateId;
  name: string;
  category: TemplateCategory;
  description: string;
  thumbnailPath: string;
  defaults: EmailDraft;
  fields: readonly TemplateField[];
  editorSections: readonly TemplateEditorSection[];
  topLevelFieldKeys?: readonly string[];
}

// Rendering is attached only after the email core exists in stages 2 and 3.
export interface TemplateDefinition extends TemplateManifest {
  render(draft: EmailDraft, context: RenderContext): RenderResult;
}

export interface PersistedSessionV1 {
  version: 1;
  selectedTemplateId: TemplateId;
  draftsByTemplateId: Partial<Record<TemplateId, PersistedEmailDraft>>;
  previewViewport: 'desktop' | 'mobile';
}
