import { createSelector } from '@reduxjs/toolkit';

import { emailDraftSchema } from '../email/schemas';
import {
  exportRenderContext,
  previewRenderContext,
  validateEmailUrl,
} from '../email/core';
import type {
  EmailDraft,
  ImageValue,
  PersistedSessionV1,
  RenderResult,
} from '../email/types';
import { toPersistedDraft } from '../features/editor/draftUtils';
import { getTemplate, getTemplateDefaults } from '../features/templates/templateRegistry';
import type { RootState } from './store';

const selectSelectedTemplateId = (state: RootState) =>
  state.templates.selectedTemplateId;
const selectDraftsByTemplateId = (state: RootState) =>
  state.editor.draftsByTemplateId;

export const selectSelectedTemplateDefinition = createSelector(
  [selectSelectedTemplateId],
  (templateId) => getTemplate(templateId),
);

export const selectSelectedDraft = createSelector(
  [selectSelectedTemplateId, selectDraftsByTemplateId],
  (templateId, drafts): EmailDraft =>
    drafts[templateId] ?? getTemplateDefaults(templateId),
);

export const selectIsSelectedDraftDirty = createSelector(
  [selectSelectedTemplateDefinition, selectSelectedDraft],
  (definition, draft) => JSON.stringify(draft) !== JSON.stringify(definition.defaults),
);

export interface DraftValidationResult {
  isValid: boolean;
  errors: string[];
}

export const selectDraftValidation = createSelector(
  [selectSelectedTemplateDefinition, selectSelectedDraft],
  (definition, draft): DraftValidationResult => {
    const parsed = emailDraftSchema.safeParse(draft);
    const errors = parsed.success
      ? []
      : parsed.error.issues.map((issue) => issue.message);
    if (draft.templateId !== definition.id) {
      errors.push('The selected template does not match the active draft.');
    }
    return { isValid: errors.length === 0, errors };
  },
);

function failedRender(error: unknown): RenderResult {
  return {
    html: '',
    warnings: [],
    errors: [
      {
        code: 'render_failed',
        message: error instanceof Error ? error.message : 'Email rendering failed.',
      },
    ],
  };
}

export const selectExportRenderResult = createSelector(
  [selectSelectedTemplateDefinition, selectSelectedDraft],
  (definition, draft): RenderResult => {
    try {
      return definition.render(draft, exportRenderContext);
    } catch (error) {
      return failedRender(error);
    }
  },
);

export const selectPreviewRenderResult = createSelector(
  [selectSelectedTemplateDefinition, selectSelectedDraft],
  (definition, draft): RenderResult => {
    try {
      return definition.render(draft, previewRenderContext);
    } catch (error) {
      return failedRender(error);
    }
  },
);

function imageValuesIn(value: unknown): ImageValue[] {
  if (Array.isArray(value)) return value.flatMap(imageValuesIn);
  if (typeof value !== 'object' || value === null) return [];
  if (
    'remoteUrl' in value &&
    typeof value.remoteUrl === 'string' &&
    'alt' in value &&
    typeof value.alt === 'string'
  ) {
    return [value as ImageValue];
  }
  return Object.values(value).flatMap(imageValuesIn);
}

const selectDraftImages = createSelector([selectSelectedDraft], (draft) =>
  Object.values(draft.fields).flatMap(imageValuesIn),
);

const selectHasInvalidImageUrl = createSelector([selectDraftImages], (images) =>
  images.some(({ remoteUrl }) => {
    const url = remoteUrl.trim();
    return url !== '' && !validateEmailUrl(url, 'image', 'export').valid;
  }),
);

const selectHasUploadedLocalPreview = createSelector(
  [selectDraftImages],
  (images) =>
    images.some(({ localPreviewUrl }) =>
      /^(?:blob:|data:image\/)/i.test(localPreviewUrl?.trim() ?? ''),
    ),
);

export const selectExportBlockReasons = createSelector(
  [selectDraftValidation, selectExportRenderResult, selectHasInvalidImageUrl],
  (validation, renderResult, hasInvalidImageUrl): string[] => {
    const reasons = new Set<string>();
    if (hasInvalidImageUrl) {
      reasons.add('Add a valid public image URL before exporting.');
    }
    for (const error of validation.errors) reasons.add(error);
    for (const error of renderResult.errors) reasons.add(error.message);
    return [...reasons];
  },
);

export const selectExportWarnings = createSelector(
  [selectHasUploadedLocalPreview],
  (hasUploadedLocalPreview): string[] =>
    hasUploadedLocalPreview
      ? [
          'Local preview images are not embedded in the exported HTML. Replace them with public image URLs before using it.',
        ]
      : [],
);

export const selectCanExport = createSelector(
  [selectExportBlockReasons],
  (reasons) => reasons.length === 0,
);

export const selectPersistableSessionState = createSelector(
  [
    selectSelectedTemplateId,
    selectDraftsByTemplateId,
    (state: RootState) => state.preview.viewport,
  ],
  (selectedTemplateId, drafts, previewViewport): PersistedSessionV1 => {
    const draftsByTemplateId: PersistedSessionV1['draftsByTemplateId'] = {};
    for (const [templateId, draft] of Object.entries(drafts)) {
      if (draft === undefined) continue;
      const persisted = toPersistedDraft(draft);
      if (persisted !== undefined) {
        draftsByTemplateId[templateId as keyof typeof draftsByTemplateId] =
          persisted;
      }
    }
    return {
      version: 1,
      selectedTemplateId,
      draftsByTemplateId,
      previewViewport,
    };
  },
);
