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

function matchesDefaultShape(
  defaultValue: EmailFieldValue,
  candidate: PersistedEmailFieldValue,
): boolean {
  if (typeof defaultValue !== 'object' || defaultValue === null) {
    return typeof candidate === typeof defaultValue;
  }
  if (typeof candidate !== 'object' || candidate === null) return false;
  if ('label' in defaultValue) return 'label' in candidate && 'url' in candidate;
  return 'remoteUrl' in candidate && 'alt' in candidate;
}

export function mergeDraftWithDefaults(
  persistedDraft: PersistedEmailDraft,
): EmailDraft {
  const defaults = getTemplateDefaults(persistedDraft.templateId);
  const currentFieldKeys = new Set(Object.keys(defaults.fields));
  const persistedFields = Object.entries(persistedDraft.fields).filter(
    ([key, value]) => {
      const defaultValue = defaults.fields[key];
      return (
        currentFieldKeys.has(key) &&
        defaultValue !== undefined &&
        matchesDefaultShape(defaultValue, value)
      );
    },
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
