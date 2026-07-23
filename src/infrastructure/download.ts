export type DownloadResult =
  | { ok: true; filename: string }
  | { ok: false; message: string };

export interface DownloadDependencies {
  document: Document;
  url: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>;
}

function browserDependencies(): DownloadDependencies {
  return {
    document,
    url: URL,
  };
}

export function emailFilename(templateId: string): string {
  const safeId = templateId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${safeId || 'email'}-email.html`;
}

export function downloadHtml(
  html: string,
  templateId: string,
  dependencies: DownloadDependencies = browserDependencies(),
): DownloadResult {
  const filename = emailFilename(templateId);
  let objectUrl: string | undefined;
  let anchor: HTMLAnchorElement | undefined;

  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    objectUrl = dependencies.url.createObjectURL(blob);
    anchor = dependencies.document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.hidden = true;
    dependencies.document.body.append(anchor);
    anchor.click();
    return { ok: true, filename };
  } catch {
    return {
      ok: false,
      message: 'Could not download the HTML file. Please try again.',
    };
  } finally {
    anchor?.remove();
    if (objectUrl !== undefined) dependencies.url.revokeObjectURL(objectUrl);
  }
}
