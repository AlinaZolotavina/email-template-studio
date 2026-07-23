import type { PreviewViewport } from './previewSlice';

export const PREVIEW_DIMENSIONS: Record<
  PreviewViewport,
  { width: number; height: number }
> = {
  desktop: { width: 720, height: 560 },
  mobile: { width: 375, height: 560 },
};
