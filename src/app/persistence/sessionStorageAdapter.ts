import { persistedSessionV1Schema } from '../../email/schemas';
import type { PersistedSessionV1, TemplateId } from '../../email/types';
import { mergeDraftWithDefaults, toPersistedDraft } from '../../features/editor/draftUtils';

export const SESSION_STORAGE_KEY = 'email-template-studio:session:v1';

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SessionStorageAdapter {
  load(): PersistedSessionV1 | undefined;
  save(session: PersistedSessionV1): boolean;
}

function removeCorruptEntry(storage: SessionStorageLike): void {
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function createSessionStorageAdapter(
  storage: SessionStorageLike,
): SessionStorageAdapter {
  return {
    load() {
      let raw: string | null;
      try {
        raw = storage.getItem(SESSION_STORAGE_KEY);
      } catch {
        return undefined;
      }
      if (raw === null) return undefined;

      let candidate: unknown;
      try {
        candidate = JSON.parse(raw) as unknown;
      } catch {
        removeCorruptEntry(storage);
        return undefined;
      }

      const parsed = persistedSessionV1Schema.safeParse(candidate);
      if (!parsed.success) {
        removeCorruptEntry(storage);
        return undefined;
      }

      const draftsByTemplateId: PersistedSessionV1['draftsByTemplateId'] = {};
      for (const [templateId, persistedDraft] of Object.entries(
        parsed.data.draftsByTemplateId,
      )) {
        if (persistedDraft === undefined) continue;
        const merged = mergeDraftWithDefaults(persistedDraft);
        const clean = toPersistedDraft(merged);
        if (clean !== undefined) {
          draftsByTemplateId[templateId as TemplateId] = clean;
        }
      }

      return { ...parsed.data, draftsByTemplateId };
    },
    save(session) {
      const parsed = persistedSessionV1Schema.safeParse(session);
      if (!parsed.success) return false;
      try {
        storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed.data));
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function getBrowserSessionStorage(): SessionStorageLike | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}
