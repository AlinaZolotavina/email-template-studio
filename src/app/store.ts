import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  isAnyOf,
} from '@reduxjs/toolkit';

import type { EmailDraft, TemplateId } from '../email/types';
import {
  createEditorInitialState,
  draftReset,
  editorReducer,
  fieldChanged,
  imageLocalPreviewAttached,
  imageLocalPreviewRemoved,
  imageRemoteUrlChanged,
  sessionRestored,
  themeChanged,
} from '../features/editor/editorSlice';
import {
  createPreviewInitialState,
  previewReducer,
  viewportChanged,
} from '../features/preview/previewSlice';
import {
  createTemplatesInitialState,
  templateSelected,
  templatesReducer,
} from '../features/templates/templatesSlice';
import {
  createSessionStorageAdapter,
  type SessionStorageLike,
} from './persistence/sessionStorageAdapter';
import { selectPersistableSessionState } from './selectors';

const rootReducer = combineReducers({
  templates: templatesReducer,
  editor: editorReducer,
  preview: previewReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export interface CreateAppStoreOptions {
  storage?: SessionStorageLike | null;
  persistenceDebounceMs?: number;
}

export function createAppStore({
  storage = null,
  persistenceDebounceMs = 300,
}: CreateAppStoreOptions = {}) {
  const adapter = storage === null ? undefined : createSessionStorageAdapter(storage);
  const restored = adapter?.load();
  const selectedTemplateId = restored?.selectedTemplateId ?? 'newsletter-digest';
  const restoredDrafts = (restored?.draftsByTemplateId ?? {}) as Partial<
    Record<TemplateId, EmailDraft>
  >;
  const preloadedState: RootState = {
    templates: createTemplatesInitialState(selectedTemplateId),
    editor: createEditorInitialState(selectedTemplateId, restoredDrafts),
    preview: createPreviewInitialState(restored?.previewViewport),
  };

  const listenerMiddleware = createListenerMiddleware<RootState>();
  if (adapter !== undefined) {
    listenerMiddleware.startListening({
      matcher: isAnyOf(
        templateSelected,
        fieldChanged,
        themeChanged,
        imageRemoteUrlChanged,
        imageLocalPreviewAttached,
        imageLocalPreviewRemoved,
        draftReset,
        sessionRestored,
        viewportChanged,
      ),
      effect: async (_action, listenerApi) => {
        listenerApi.cancelActiveListeners();
        await listenerApi.delay(persistenceDebounceMs);
        adapter.save(selectPersistableSessionState(listenerApi.getState()));
      },
    });
  }

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
