import { persistedEmailDraftSchema } from '../../email/schemas';
import type {
  EmailDraft,
  EmailFieldValue,
  PersistedEmailDraft,
  PersistedEmailFieldValue,
} from '../../email/types';
import { getTemplateDefaults } from '../templates/templateRegistry';

function cloneFieldValue(value: EmailFieldValue): EmailFieldValue {
  return typeof value === 'object' ? { ...value } : value;
}

export function mergeDraftWithDefaults(
  persistedDraft: PersistedEmailDraft,
): EmailDraft {
  const defaults = getTemplateDefaults(persistedDraft.templateId);
  const currentFieldKeys = new Set(Object.keys(defaults.fields));
  const persistedFields = Object.entries(persistedDraft.fields).filter(([key]) =>
    currentFieldKeys.has(key),
  );

  return {
    ...defaults,
    theme: { ...defaults.theme, ...persistedDraft.theme },
    fields: {
      ...defaults.fields,
      ...Object.fromEntries(
        persistedFields.map(([key, value]) => [
          key,
          cloneFieldValue(value),
        ]),
      ),
    },
  };
}

function stripLocalPreviewUrls(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripLocalPreviewUrls);
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'localPreviewUrl')
      .map(([key, nestedValue]) => [key, stripLocalPreviewUrls(nestedValue)]),
  );
}

export function toPersistedDraft(
  draft: EmailDraft,
): PersistedEmailDraft | undefined {
  const parsed = persistedEmailDraftSchema.safeParse(stripLocalPreviewUrls(draft));
  return parsed.success ? parsed.data : undefined;
}

export function clonePersistedFieldValue(
  value: PersistedEmailFieldValue,
): EmailFieldValue {
  return typeof value === 'object' ? { ...value } : value;
}
