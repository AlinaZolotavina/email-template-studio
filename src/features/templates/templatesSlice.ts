import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { TEMPLATE_IDS, type TemplateId } from '../../email/types';

export interface TemplatesState {
  selectedTemplateId: TemplateId;
  isPickerOpen: boolean;
}

export function createTemplatesInitialState(
  selectedTemplateId: TemplateId = TEMPLATE_IDS[0],
): TemplatesState {
  return { selectedTemplateId, isPickerOpen: false };
}

const templatesSlice = createSlice({
  name: 'templates',
  initialState: createTemplatesInitialState(),
  reducers: {
    templateSelected(state, action: PayloadAction<TemplateId>) {
      state.selectedTemplateId = action.payload;
      state.isPickerOpen = false;
    },
    templatePickerOpened(state) {
      state.isPickerOpen = true;
    },
    templatePickerClosed(state) {
      state.isPickerOpen = false;
    },
  },
});

export const { templateSelected, templatePickerOpened, templatePickerClosed } =
  templatesSlice.actions;
export const templatesReducer = templatesSlice.reducer;
