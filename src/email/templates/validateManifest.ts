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
    case 'link-list':
      return Array.isArray(value) && value.every((item) =>
        isRecord(item) && typeof item.label === 'string' && typeof item.url === 'string'
      );
    case 'benefit-list':
      return Array.isArray(value) && value.every((item) =>
        isRecord(item) && typeof item.label === 'string' && typeof item.text === 'string'
      );
    case 'article-list':
      return Array.isArray(value) && value.every((item) =>
        isRecord(item) &&
        typeof item.category === 'string' &&
        typeof item.title === 'string' &&
        typeof item.text === 'string' &&
        isRecord(item.image) &&
        typeof item.image.remoteUrl === 'string' &&
        typeof item.image.alt === 'string' &&
        isRecord(item.link) &&
        typeof item.link.label === 'string' &&
        typeof item.link.url === 'string'
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

  const sectionIds = new Set<string>();
  const sectionFieldKeys = new Set<string>();
  for (const section of manifest.editorSections) {
    if (sectionIds.has(section.id)) {
      throw new Error(`Duplicate editor section "${section.id}" in template "${manifest.id}".`);
    }
    sectionIds.add(section.id);
    if (section.visibilityFieldKey !== undefined) {
      if (!keys.has(section.visibilityFieldKey)) {
        throw new Error(`Editor section "${section.id}" references unknown visibility field "${section.visibilityFieldKey}".`);
      }
      sectionFieldKeys.add(section.visibilityFieldKey);
    }
    for (const fieldKey of section.fieldKeys) {
      if (!keys.has(fieldKey)) {
        throw new Error(`Editor section "${section.id}" references unknown field "${fieldKey}".`);
      }
      if (
        sectionFieldKeys.has(fieldKey) &&
        fieldKey !== section.visibilityFieldKey
      ) {
        throw new Error(`Field "${fieldKey}" appears in more than one editor section.`);
      }
      sectionFieldKeys.add(fieldKey);
    }
  }

  for (const fieldKey of manifest.topLevelFieldKeys ?? []) {
    if (!keys.has(fieldKey)) {
      throw new Error(`Top-level editor field "${fieldKey}" is unknown.`);
    }
    sectionFieldKeys.add(fieldKey);
  }

  for (const fieldKey of keys) {
    if (!sectionFieldKeys.has(fieldKey)) {
      throw new Error(`Field "${fieldKey}" has no editor section in template "${manifest.id}".`);
    }
  }
}
