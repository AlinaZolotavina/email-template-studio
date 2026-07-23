import type { TemplateId } from '../email/types';

export interface ObjectUrlApi {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

export interface LocalAssetsManager {
  attach: (templateId: TemplateId, fieldKey: string, file: File) => string;
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
      const key = assetKey(templateId, fieldKey);
      const url = api.createObjectURL(file);
      releaseByKey(key);
      urls.set(key, url);
      return url;
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
  return createLocalAssetsManager({
    createObjectURL: (blob) => URL.createObjectURL(blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
  });
}
