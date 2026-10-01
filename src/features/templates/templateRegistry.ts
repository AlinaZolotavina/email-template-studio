import type { EmailDraft, EmailFieldValue, TemplateDefinition } from '../../email/types';
import {
  newsletterDigestManifest,
  newsletterPromoManifest,
  welcomeOnboardingManifest,
  welcomeSimpleManifest,
} from '../../email/templates/manifests';
import { assertTemplateManifest } from '../../email/templates/validateManifest';
import {
  renderNewsletterDigest,
  renderNewsletterPromo,
  renderWelcomeOnboarding,
  renderWelcomeSimple,
} from '../../email/templates/renderers';

export class UnknownTemplateError extends Error {
  constructor(templateId: string) {
    super(`Unknown email template: "${templateId}".`);
    this.name = 'UnknownTemplateError';
  }
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}

function cloneFieldValue(value: EmailFieldValue): EmailFieldValue {
  return structuredClone(value);
}

function cloneDraft(draft: EmailDraft): EmailDraft {
  return {
    ...draft,
    theme: { ...draft.theme },
    fields: Object.fromEntries(
      Object.entries(draft.fields).map(([key, value]) => [
        key,
        cloneFieldValue(value),
      ]),
    ),
  };
}

const definitions = [
  { ...newsletterDigestManifest, render: renderNewsletterDigest },
  { ...newsletterPromoManifest, render: renderNewsletterPromo },
  { ...welcomeSimpleManifest, render: renderWelcomeSimple },
  { ...welcomeOnboardingManifest, render: renderWelcomeOnboarding },
] satisfies readonly TemplateDefinition[];

const ids = new Set<string>();
for (const definition of definitions) {
  if (ids.has(definition.id)) {
    throw new Error(`Duplicate template id: "${definition.id}".`);
  }
  ids.add(definition.id);
  assertTemplateManifest(definition);
  deepFreeze(definition);
}

const templates = Object.freeze([...definitions]) as readonly TemplateDefinition[];
const templatesById = new Map<string, TemplateDefinition>(
  templates.map((template) => [template.id, template]),
);

export function listTemplates(): readonly TemplateDefinition[] {
  return templates;
}

export function getTemplate(templateId: string): TemplateDefinition {
  const template = templatesById.get(templateId);
  if (template === undefined) {
    throw new UnknownTemplateError(templateId);
  }
  return template;
}

export function getTemplateDefaults(templateId: string): EmailDraft {
  return cloneDraft(getTemplate(templateId).defaults);
}
