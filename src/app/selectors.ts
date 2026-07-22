import { createSelector } from '@reduxjs/toolkit';

import { emailDraftSchema } from '../email/schemas';
import {
  exportRenderContext,
  previewRenderContext,
  validateEmailUrl,
} from '../email/core';
import type {
  EmailDraft,
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

const selectHasUnexportableImage = createSelector(
  [selectSelectedTemplateDefinition, selectSelectedDraft],
  (definition, draft) =>
    definition.fields.some((field) => {
      if (field.type !== 'image') return false;
      const value = draft.fields[field.key];
      if (
        typeof value !== 'object' ||
        value === null ||
        !('remoteUrl' in value) ||
        typeof value.remoteUrl !== 'string'
      ) {
        return false;
      }
      const remoteUrl = value.remoteUrl.trim();
      const hasLocalPreview =
        'localPreviewUrl' in value &&
        typeof value.localPreviewUrl === 'string' &&
        value.localPreviewUrl !== '';
      const hasValidRemote = validateEmailUrl(remoteUrl, 'image', 'export').valid;

      return (remoteUrl !== '' && !hasValidRemote) || (hasLocalPreview && !hasValidRemote);
    }),
);

export const selectCanExport = createSelector(
  [selectDraftValidation, selectExportRenderResult, selectHasUnexportableImage],
  (validation, renderResult, hasUnexportableImage) =>
    validation.isValid &&
    renderResult.errors.length === 0 &&
    !hasUnexportableImage,
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
