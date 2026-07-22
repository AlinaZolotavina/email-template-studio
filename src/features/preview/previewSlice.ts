import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type PreviewViewport = 'desktop' | 'mobile';

export interface PreviewState {
  viewport: PreviewViewport;
}

export function createPreviewInitialState(
  viewport: PreviewViewport = 'desktop',
): PreviewState {
  return { viewport };
}

const previewSlice = createSlice({
  name: 'preview',
  initialState: createPreviewInitialState(),
  reducers: {
    viewportChanged(state, action: PayloadAction<PreviewViewport>) {
      state.viewport = action.payload;
    },
  },
});

export const { viewportChanged } = previewSlice.actions;
export const previewReducer = previewSlice.reducer;
