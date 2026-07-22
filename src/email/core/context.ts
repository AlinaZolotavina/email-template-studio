import type { ImageValue, RenderContext } from '../types';

export const exportRenderContext: RenderContext = Object.freeze({
  mode: 'export',
  resolveImageSource: (value: ImageValue) => value.remoteUrl,
});

export const previewRenderContext: RenderContext = Object.freeze({
  mode: 'preview',
  resolveImageSource: (value: ImageValue) => value.localPreviewUrl ?? value.remoteUrl,
});
