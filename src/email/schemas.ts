import { z } from 'zod';

import {
  EMAIL_FONT_FAMILIES,
  TEMPLATE_IDS,
  type EmailDraft,
  type PersistedEmailDraft,
  type PersistedSessionV1,
} from './types';

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const templateIdSchema = z.enum(TEMPLATE_IDS);

export const emailThemeSchema = z.strictObject({
  backgroundColor: hexColorSchema,
  surfaceColor: hexColorSchema,
  textColor: hexColorSchema,
  mutedTextColor: hexColorSchema,
  accentColor: hexColorSchema,
  buttonTextColor: hexColorSchema,
  fontFamily: z.enum(EMAIL_FONT_FAMILIES),
  contentWidth: z.number().int().min(320).max(800),
});

export const imageValueSchema = z.strictObject({
  remoteUrl: z.string(),
  localPreviewUrl: z.string().optional(),
  alt: z.string(),
});

export const persistedImageValueSchema = z.strictObject({
  remoteUrl: z.string(),
  alt: z.string(),
});

export const linkValueSchema = z.strictObject({
  label: z.string(),
  url: z.string(),
});

const buttonValueSchema = z.strictObject({
  label: z.string(),
  url: z.string(),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
});

const benefitValueSchema = z.strictObject({
  label: z.string(),
  text: z.string(),
});

const stepValueSchema = z.strictObject({
  title: z.string(),
  text: z.string(),
});

const articleValueSchema = z.strictObject({
  category: z.string(),
  title: z.string(),
  text: z.string(),
  image: imageValueSchema,
  link: linkValueSchema,
});

const persistedArticleValueSchema = articleValueSchema.extend({
  image: persistedImageValueSchema,
});

const emailFieldValueSchema = z.union([
  z.string(),
  z.boolean(),
  linkValueSchema,
  buttonValueSchema,
  imageValueSchema,
  z.array(linkValueSchema),
  z.array(benefitValueSchema),
  z.array(stepValueSchema),
  z.array(articleValueSchema),
]);

const persistedEmailFieldValueSchema = z.union([
  z.string(),
  z.boolean(),
  linkValueSchema,
  buttonValueSchema,
  persistedImageValueSchema,
  z.array(linkValueSchema),
  z.array(benefitValueSchema),
  z.array(stepValueSchema),
  z.array(persistedArticleValueSchema),
]);

export const emailDraftSchema: z.ZodType<EmailDraft> = z.strictObject({
  templateId: templateIdSchema,
  schemaVersion: z.number().int().positive(),
  theme: emailThemeSchema,
  fields: z.record(z.string(), emailFieldValueSchema),
});

export const persistedEmailDraftSchema: z.ZodType<PersistedEmailDraft> =
  z.strictObject({
    templateId: templateIdSchema,
    schemaVersion: z.number().int().positive(),
    theme: emailThemeSchema,
    fields: z.record(z.string(), persistedEmailFieldValueSchema),
  });

const persistedDraftsByTemplateIdSchema = z
  .partialRecord(templateIdSchema, persistedEmailDraftSchema)
  .superRefine((drafts, context) => {
    for (const [templateId, draft] of Object.entries(drafts)) {
      if (draft !== undefined && draft.templateId !== templateId) {
        context.addIssue({
          code: 'custom',
          message: `Draft key "${templateId}" does not match draft templateId "${draft.templateId}".`,
          path: [templateId, 'templateId'],
        });
      }
    }
  });

export const persistedSessionV1Schema: z.ZodType<PersistedSessionV1> =
  z.strictObject({
    version: z.literal(1),
    selectedTemplateId: templateIdSchema,
    draftsByTemplateId: persistedDraftsByTemplateIdSchema,
    previewViewport: z.enum(['desktop', 'mobile']),
  });
