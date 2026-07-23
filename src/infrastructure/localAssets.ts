import type { TemplateId } from '../email/types';

export interface ObjectUrlApi {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

export interface LocalAssetsManager {
  attach: (
    templateId: TemplateId,
    fieldKey: string,
    file: File,
  ) => Promise<string>;
  release: (templateId: TemplateId, fieldKey: string) => void;
  releaseTemplate: (templateId: TemplateId) => void;
  releaseAll: () => void;
}

function assetKey(templateId: TemplateId, fieldKey: string): string {
  return `${templateId}:${fieldKey}`;
}

export function createLocalAssetsManager(api: ObjectUrlApi): LocalAssetsManager {
  const urls = new Map<string, string>();

  const releaseByKey = (key: string) => {
    const previousUrl = urls.get(key);
    if (previousUrl === undefined) return;
    api.revokeObjectURL(previousUrl);
    urls.delete(key);
  };

  return {
    attach(templateId, fieldKey, file) {
      return Promise.resolve().then(() => {
        const key = assetKey(templateId, fieldKey);
        const url = api.createObjectURL(file);
        releaseByKey(key);
        urls.set(key, url);
        return url;
      });
    },
    release(templateId, fieldKey) {
      releaseByKey(assetKey(templateId, fieldKey));
    },
    releaseTemplate(templateId) {
      const prefix = `${templateId}:`;
      for (const key of [...urls.keys()]) {
        if (key.startsWith(prefix)) releaseByKey(key);
      }
    },
    releaseAll() {
      for (const key of [...urls.keys()]) releaseByKey(key);
    },
  };
}

export function createBrowserLocalAssetsManager(): LocalAssetsManager {
  return {
    attach: (_templateId, _fieldKey, file) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('The selected image could not be read.'));
        });
        reader.addEventListener('error', () => {
          reject(reader.error ?? new Error('The selected image could not be read.'));
        });
        reader.readAsDataURL(file);
      }),
    release: () => undefined,
    releaseTemplate: () => undefined,
    releaseAll: () => undefined,
  };
}
