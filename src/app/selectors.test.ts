import {
  selectCanExport,
  selectExportBlockReasons,
  selectExportRenderResult,
  selectExportWarnings,
  selectIsSelectedDraftDirty,
  selectPreviewRenderResult,
  selectSelectedDraft,
} from './selectors';
import { createAppStore } from './store';
import {
  fieldChanged,
  imageLocalPreviewAttached,
  imageRemoteUrlChanged,
} from '../features/editor/editorSlice';
import {
  templatePickerOpened,
  templateSelected,
} from '../features/templates/templatesSlice';
import type { ArticleValue } from '../email/types';

describe('state selectors', () => {
  it('reports whether the selected draft differs from its defaults', () => {
    const store = createAppStore();
    expect(selectIsSelectedDraftDirty(store.getState())).toBe(false);

    store.dispatch(
      fieldChanged({
        templateId: 'newsletter-digest',
        key: 'heading',
        value: 'Changed heading',
      }),
    );
    expect(selectIsSelectedDraftDirty(store.getState())).toBe(true);
  });

  it('memoizes render results until the selected draft changes', () => {
    const store = createAppStore();
    const first = selectExportRenderResult(store.getState());

    expect(selectExportRenderResult(store.getState())).toBe(first);
    store.dispatch(templatePickerOpened());
    expect(selectExportRenderResult(store.getState())).toBe(first);

    store.dispatch(
      fieldChanged({
        templateId: 'newsletter-digest',
        key: 'heading',
        value: 'A new heading',
      }),
    );
    const changed = selectExportRenderResult(store.getState());
    expect(changed).not.toBe(first);
    expect(changed.html).toContain('A new heading');
  });

  it('selects the lazily initialized draft after template switching', () => {
    const store = createAppStore();
    store.dispatch(templateSelected('welcome-onboarding'));

    expect(selectSelectedDraft(store.getState()).templateId).toBe(
      'welcome-onboarding',
    );
  });

  it('uses blob URLs only in preview and warns without blocking export', () => {
    const store = createAppStore();
    const image = { templateId: 'newsletter-digest' as const, key: 'logo' };
    store.dispatch(
      imageLocalPreviewAttached({
        ...image,
        localPreviewUrl: 'blob:preview-logo',
      }),
    );

    expect(selectPreviewRenderResult(store.getState()).html).toContain(
      'blob:preview-logo',
    );
    expect(selectExportRenderResult(store.getState()).html).not.toContain('blob:');
    expect(selectCanExport(store.getState())).toBe(true);
    expect(selectExportBlockReasons(store.getState())).toEqual([]);
    expect(selectExportWarnings(store.getState())).toContain(
      'Local preview images are not embedded in the exported HTML. Replace them with public image URLs before using it.',
    );

    store.dispatch(
      imageRemoteUrlChanged({
        ...image,
        remoteUrl: 'https://example.com/public-logo.png',
      }),
    );
    expect(selectPreviewRenderResult(store.getState()).html).toContain(
      'blob:preview-logo',
    );
    expect(selectExportRenderResult(store.getState()).html).toContain(
      'https://example.com/public-logo.png',
    );
    expect(selectCanExport(store.getState())).toBe(true);
    expect(selectExportBlockReasons(store.getState())).toEqual([]);
    expect(selectExportWarnings(store.getState())).toHaveLength(1);
  });

  it('blocks export for a non-empty image URL with a forbidden protocol', () => {
    const store = createAppStore();
    store.dispatch(
      imageRemoteUrlChanged({
        templateId: 'newsletter-digest',
        key: 'logo',
        remoteUrl: 'data:image/png;base64,unsafe',
      }),
    );

    expect(selectExportRenderResult(store.getState()).html).not.toContain('data:');
    expect(selectCanExport(store.getState())).toBe(false);
    expect(selectExportBlockReasons(store.getState())).toContain(
      'Add a valid public image URL before exporting.',
    );
  });

  it('warns about a local preview nested inside an article', () => {
    const store = createAppStore();
    const articles = structuredClone(
      selectSelectedDraft(store.getState()).fields.articles,
    ) as ArticleValue[];
    expect(articles.length).toBeGreaterThan(0);

    articles[0].image.localPreviewUrl = 'data:image/png;base64,preview';
    store.dispatch(
      fieldChanged({
        templateId: 'newsletter-digest',
        key: 'articles',
        value: articles,
      }),
    );

    expect(selectCanExport(store.getState())).toBe(true);
    expect(selectExportWarnings(store.getState())).toHaveLength(1);
  });
});
