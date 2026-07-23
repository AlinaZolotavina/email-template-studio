import { createAppStore } from '../../app/store';
import type { ImageValue } from '../../email/types';
import {
  draftReset,
  fieldChanged,
  imageLocalPreviewAttached,
  imageLocalPreviewRemoved,
  imageRemoteUrlChanged,
  sessionRestored,
  themeChanged,
} from './editorSlice';
import { templateSelected } from '../templates/templatesSlice';

describe('editor state', () => {
  it('keeps independent drafts while switching templates', () => {
    const store = createAppStore();

    store.dispatch(
      fieldChanged({
        templateId: 'newsletter-digest',
        key: 'heading',
        value: 'Edited digest',
      }),
    );
    store.dispatch(templateSelected('welcome-simple'));
    store.dispatch(
      fieldChanged({
        templateId: 'welcome-simple',
        key: 'greeting',
        value: 'Hello there',
      }),
    );
    store.dispatch(templateSelected('newsletter-digest'));

    const drafts = store.getState().editor.draftsByTemplateId;
    expect(drafts['newsletter-digest']?.fields.heading).toBe('Edited digest');
    expect(drafts['welcome-simple']?.fields.greeting).toBe('Hello there');
  });

  it('updates theme and image string state without File or Blob values', () => {
    const store = createAppStore();
    const imagePayload = {
      templateId: 'newsletter-digest' as const,
      key: 'logo',
    };

    store.dispatch(
      themeChanged({
        templateId: 'newsletter-digest',
        key: 'accentColor',
        value: '#123456',
      }),
    );
    store.dispatch(
      imageRemoteUrlChanged({
        ...imagePayload,
        remoteUrl: 'https://example.com/logo.png',
      }),
    );
    store.dispatch(
      imageLocalPreviewAttached({
        ...imagePayload,
        localPreviewUrl: 'blob:local-logo',
      }),
    );

    let state = store.getState();
    expect(state.editor.draftsByTemplateId['newsletter-digest']?.theme.accentColor).toBe(
      '#123456',
    );
    expect(
      state.editor.draftsByTemplateId['newsletter-digest']?.fields.logo,
    ).toEqual({
      remoteUrl: 'https://example.com/logo.png',
      localPreviewUrl: 'blob:local-logo',
      alt: 'Weekly Digest logo',
    });

    store.dispatch(imageLocalPreviewRemoved(imagePayload));
    state = store.getState();
    expect(
      (state.editor.draftsByTemplateId['newsletter-digest']?.fields.logo as ImageValue)
        .localPreviewUrl,
    ).toBeUndefined();
  });

  it('resets only the requested draft', () => {
    const store = createAppStore();
    store.dispatch(
      fieldChanged({
        templateId: 'newsletter-digest',
        key: 'heading',
        value: 'Temporary heading',
      }),
    );
    store.dispatch(templateSelected('welcome-simple'));
    store.dispatch(
      fieldChanged({
        templateId: 'welcome-simple',
        key: 'greeting',
        value: 'Keep me',
      }),
    );
    store.dispatch(draftReset('newsletter-digest'));

    const drafts = store.getState().editor.draftsByTemplateId;
    expect(drafts['newsletter-digest']?.fields.heading).toBe('Weekly digest');
    expect(drafts['welcome-simple']?.fields.greeting).toBe('Keep me');
  });

  it('ignores empty entries in a partial restored session', () => {
    const store = createAppStore();

    expect(() =>
      store.dispatch(sessionRestored({ 'welcome-simple': undefined })),
    ).not.toThrow();
    expect(store.getState().editor.draftsByTemplateId).toEqual({});
  });
});
