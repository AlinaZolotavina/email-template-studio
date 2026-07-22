import { emailDraftSchema } from '../schemas';
import type {
  EmailFieldValue,
  TemplateField,
  TemplateManifest,
} from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function matchesFieldType(field: TemplateField, value: EmailFieldValue): boolean {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'url':
      return typeof value === 'string';
    case 'toggle':
      return typeof value === 'boolean';
    case 'image':
      return (
        isRecord(value) &&
        typeof value.remoteUrl === 'string' &&
        typeof value.alt === 'string'
      );
    case 'link':
      return (
        isRecord(value) &&
        typeof value.label === 'string' &&
        typeof value.url === 'string'
      );
    case 'color':
      return false;
  }
}

export function assertTemplateManifest(manifest: TemplateManifest): void {
  const parsedDraft = emailDraftSchema.safeParse(manifest.defaults);

  if (!parsedDraft.success) {
    throw new Error(
      `Invalid defaults for template "${manifest.id}": ${parsedDraft.error.message}`,
    );
  }

  if (manifest.defaults.templateId !== manifest.id) {
    throw new Error(`Defaults templateId does not match manifest "${manifest.id}".`);
  }

  const keys = new Set<string>();
  const contentFieldKeys = new Set<string>();

  for (const field of manifest.fields) {
    if (keys.has(field.key)) {
      throw new Error(`Duplicate field key "${field.key}" in template "${manifest.id}".`);
    }
    keys.add(field.key);

    if (field.type === 'color') {
      if (field.key !== `theme.${field.themeKey}`) {
        throw new Error(`Color field "${field.key}" has an inconsistent themeKey.`);
      }
      continue;
    }

    contentFieldKeys.add(field.key);
    const value = manifest.defaults.fields[field.key];
    if (value === undefined) {
      throw new Error(`Missing default for field "${field.key}" in template "${manifest.id}".`);
    }
    if (!matchesFieldType(field, value)) {
      throw new Error(`Default for field "${field.key}" has the wrong value type.`);
    }
  }

  for (const key of Object.keys(manifest.defaults.fields)) {
    if (!contentFieldKeys.has(key)) {
      throw new Error(`Default "${key}" has no field definition in template "${manifest.id}".`);
    }
  }
}
