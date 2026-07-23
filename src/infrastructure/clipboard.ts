export type CopyMethod = 'clipboard' | 'fallback';

export type CopyResult =
  | { ok: true; method: CopyMethod }
  | { ok: false; message: string };

export interface ClipboardDependencies {
  clipboard?: Pick<Clipboard, 'writeText'>;
  document: Document;
}

function browserDependencies(): ClipboardDependencies {
  return {
    clipboard: navigator.clipboard,
    document,
  };
}

function copyWithFallback(
  text: string,
  targetDocument: Document,
): boolean {
  if (typeof targetDocument.execCommand !== 'function') return false;

  const textarea = targetDocument.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  targetDocument.body.append(textarea);

  try {
    textarea.focus();
    textarea.select();
    return targetDocument.execCommand('copy');
  } finally {
    textarea.remove();
  }
}

export async function copyText(
  text: string,
  dependencies: ClipboardDependencies = browserDependencies(),
): Promise<CopyResult> {
  if (dependencies.clipboard !== undefined) {
    try {
      await dependencies.clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    } catch {
      // Permission and secure-context failures may still allow the legacy fallback.
    }
  }

  try {
    if (copyWithFallback(text, dependencies.document)) {
      return { ok: true, method: 'fallback' };
    }
  } catch {
    // Normalize browser-specific errors into a stable result for the UI.
  }

  return {
    ok: false,
    message: 'Could not copy HTML. Select the generated code and copy it manually.',
  };
}
