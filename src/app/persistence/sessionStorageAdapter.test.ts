import { getTemplateDefaults } from '../../features/templates/templateRegistry';
import {
  fieldChanged,
  imageLocalPreviewAttached,
} from '../../features/editor/editorSlice';
import { viewportChanged } from '../../features/preview/previewSlice';
import { selectPersistableSessionState } from '../selectors';
import { createAppStore } from '../store';
import {
  createSessionStorageAdapter,
  SESSION_STORAGE_KEY,
  type SessionStorageLike,
} from './sessionStorageAdapter';

function createMemoryStorage(initialValue?: string) {
  let value = initialValue ?? null;
  const getItem = vi.fn(() => value);
  const setItem = vi.fn((_key: string, nextValue: string) => {
    value = nextValue;
  });
  const removeItem = vi.fn(() => {
    value = null;
  });
  const storage: SessionStorageLike = {
    getItem,
    setItem,
    removeItem,
  };
  return { storage, getItem, setItem, removeItem, read: () => value };
}

describe('session storage adapter', () => {
  it('hydrates valid state and merges missing fields with current defaults', () => {
    const draft = getTemplateDefaults('welcome-simple');
    draft.fields.greeting = 'Restored greeting';
    delete draft.fields.body;
    draft.fields.removedLegacyField = 'Must not survive hydration';
    const memory = createMemoryStorage(
      JSON.stringify({
        version: 1,
        selectedTemplateId: 'welcome-simple',
        draftsByTemplateId: { 'welcome-simple': draft },
        previewViewport: 'mobile',
      }),
    );

    const store = createAppStore({ storage: memory.storage });
    const restored = store.getState().editor.draftsByTemplateId['welcome-simple'];
    expect(store.getState().templates.selectedTemplateId).toBe('welcome-simple');
    expect(store.getState().preview.viewport).toBe('mobile');
    expect(restored?.fields.greeting).toBe('Restored greeting');
    expect(restored?.fields.body).toBe(
      "You're all set to get started. Take a moment to explore and see what you can do.",
    );
    expect(restored?.fields.removedLegacyField).toBeUndefined();
  });

  it.each([
    ['invalid JSON', '{broken'],
    ['invalid schema', JSON.stringify({ version: 1 })],
    [
      'unsupported version',
      JSON.stringify({
        version: 2,
        selectedTemplateId: 'welcome-simple',
        draftsByTemplateId: {},
        previewViewport: 'desktop',
      }),
    ],
  ])('removes %s without throwing', (_label, storedValue) => {
    const memory = createMemoryStorage(storedValue);
    const adapter = createSessionStorageAdapter(memory.storage);

    expect(adapter.load()).toBeUndefined();
    expect(memory.removeItem).toHaveBeenCalledWith(SESSION_STORAGE_KEY);
  });

  it('debounces writes and strips localPreviewUrl from the payload', async () => {
    vi.useFakeTimers();
    const memory = createMemoryStorage();
    const store = createAppStore({
      storage: memory.storage,
      persistenceDebounceMs: 300,
    });

    store.dispatch(
      fieldChanged({
        templateId: 'newsletter-digest',
        key: 'heading',
        value: 'First',
      }),
    );
    store.dispatch(
      fieldChanged({
        templateId: 'newsletter-digest',
        key: 'heading',
        value: 'Final',
      }),
    );
    store.dispatch(
      imageLocalPreviewAttached({
        templateId: 'newsletter-digest',
        key: 'logo',
        localPreviewUrl: 'blob:must-not-persist',
      }),
    );
    store.dispatch(viewportChanged('mobile'));

    expect(memory.setItem).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(299);
    expect(memory.setItem).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(memory.setItem).toHaveBeenCalledTimes(1);

    const saved = memory.read();
    expect(saved).not.toBeNull();
    expect(saved).not.toContain('localPreviewUrl');
    expect(saved).not.toContain('blob:must-not-persist');
    expect(saved).toContain('Final');
    expect(saved).toContain('mobile');
    vi.useRealTimers();
  });

  it('builds a persistable payload without derived render data', () => {
    const store = createAppStore();
    const payload = selectPersistableSessionState(store.getState());

    expect(payload.version).toBe(1);
    expect(JSON.stringify(payload)).not.toMatch(/html|warnings|errors/);
  });
});
