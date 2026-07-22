import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  EmailDraft,
  EmailFieldValue,
  EmailTheme,
  ImageValue,
  TemplateId,
} from '../../email/types';
import { TEMPLATE_IDS } from '../../email/types';
import { getTemplate, getTemplateDefaults } from '../templates/templateRegistry';
import { templateSelected } from '../templates/templatesSlice';
import { mergeDraftWithDefaults } from './draftUtils';

export interface EditorState {
  draftsByTemplateId: Partial<Record<TemplateId, EmailDraft>>;
}

type ThemeChangedPayload = {
  [Key in keyof EmailTheme]: {
    templateId: TemplateId;
    key: Key;
    value: EmailTheme[Key];
  };
}[keyof EmailTheme];

interface FieldPayload {
  templateId: TemplateId;
  key: string;
}

function ensureDraft(state: EditorState, templateId: TemplateId): EmailDraft {
  const existing = state.draftsByTemplateId[templateId];
  if (existing !== undefined) return existing;

  const draft = getTemplateDefaults(templateId);
  state.draftsByTemplateId[templateId] = draft;
  return draft;
}

function isKnownField(templateId: TemplateId, key: string): boolean {
  return getTemplate(templateId).fields.some((field) => field.key === key);
}

function getImageValue(
  state: EditorState,
  payload: FieldPayload,
): ImageValue | undefined {
  if (!isKnownField(payload.templateId, payload.key)) return undefined;
  const value = ensureDraft(state, payload.templateId).fields[payload.key];
  if (
    typeof value !== 'object' ||
    value === null ||
    !('remoteUrl' in value) ||
    !('alt' in value)
  ) {
    return undefined;
  }
  return value;
}

export function createEditorInitialState(
  selectedTemplateId: TemplateId,
  restoredDrafts: Partial<Record<TemplateId, EmailDraft>> = {},
): EditorState {
  return {
    draftsByTemplateId: {
      ...restoredDrafts,
      [selectedTemplateId]:
        restoredDrafts[selectedTemplateId] ?? getTemplateDefaults(selectedTemplateId),
    },
  };
}

const editorSlice = createSlice({
  name: 'editor',
  initialState: createEditorInitialState('newsletter-digest'),
  reducers: {
    fieldChanged(
      state,
      action: PayloadAction<FieldPayload & { value: EmailFieldValue }>,
    ) {
      const { templateId, key, value } = action.payload;
      if (!isKnownField(templateId, key)) return;
      ensureDraft(state, templateId).fields[key] = value;
    },
    themeChanged(state, action: PayloadAction<ThemeChangedPayload>) {
      const { templateId, key, value } = action.payload;
      Object.assign(ensureDraft(state, templateId).theme, { [key]: value });
    },
    imageRemoteUrlChanged(
      state,
      action: PayloadAction<FieldPayload & { remoteUrl: string }>,
    ) {
      const image = getImageValue(state, action.payload);
      if (image !== undefined) image.remoteUrl = action.payload.remoteUrl;
    },
    imageLocalPreviewAttached(
      state,
      action: PayloadAction<FieldPayload & { localPreviewUrl: string }>,
    ) {
      const image = getImageValue(state, action.payload);
      if (image !== undefined) image.localPreviewUrl = action.payload.localPreviewUrl;
    },
    imageLocalPreviewRemoved(state, action: PayloadAction<FieldPayload>) {
      const image = getImageValue(state, action.payload);
      if (image !== undefined) delete image.localPreviewUrl;
    },
    draftReset(state, action: PayloadAction<TemplateId>) {
      state.draftsByTemplateId[action.payload] = getTemplateDefaults(action.payload);
    },
    sessionRestored(
      state,
      action: PayloadAction<Partial<Record<TemplateId, EmailDraft>>>,
    ) {
      const restored: Partial<Record<TemplateId, EmailDraft>> = {};
      for (const [templateId, draft] of Object.entries(action.payload)) {
        if (
          draft === undefined ||
          !TEMPLATE_IDS.includes(templateId as TemplateId)
        ) {
          continue;
        }
        restored[templateId as TemplateId] = mergeDraftWithDefaults(draft);
      }
      state.draftsByTemplateId = restored;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(templateSelected, (state, action) => {
      ensureDraft(state, action.payload);
    });
  },
});

export const {
  fieldChanged,
  themeChanged,
  imageRemoteUrlChanged,
  imageLocalPreviewAttached,
  imageLocalPreviewRemoved,
  draftReset,
  sessionRestored,
} = editorSlice.actions;
export const editorReducer = editorSlice.reducer;
