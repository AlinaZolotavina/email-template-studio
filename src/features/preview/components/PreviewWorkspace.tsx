import { Code2, Copy, Download, Monitor, Smartphone } from 'lucide-react';
import { useMemo, useState, type KeyboardEvent } from 'react';

import type { RenderIssue, RenderResult } from '../../../email/types';
import { copyText, type CopyResult } from '../../../infrastructure/clipboard';
import {
  downloadHtml,
  type DownloadResult,
} from '../../../infrastructure/download';
import type { PreviewViewport } from '../previewSlice';
import { formatHtml } from '../formatHtml';
import { EmailPreviewFrame } from './EmailPreviewFrame';
import styles from './PreviewWorkspace.module.css';

interface PreviewWorkspaceProps {
  previewResult: RenderResult;
  exportResult: RenderResult;
  viewport: PreviewViewport;
  onViewportChange: (viewport: PreviewViewport) => void;
  templateId: string;
  canExport: boolean;
  exportBlockReasons: string[];
  status?: 'loading' | 'ready';
  copyService?: (html: string) => Promise<CopyResult>;
  downloadService?: (html: string, templateId: string) => DownloadResult;
}

const VIEWPORTS: {
  id: PreviewViewport;
  label: string;
  icon: typeof Monitor;
}[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
];

function uniqueIssues(...groups: RenderIssue[][]): RenderIssue[] {
  const seen = new Set<string>();
  return groups.flat().filter((issue) => {
    const identity = `${issue.code}:${issue.fieldKey ?? ''}:${issue.message}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export function PreviewWorkspace({
  previewResult,
  exportResult,
  viewport,
  onViewportChange,
  templateId,
  canExport,
  exportBlockReasons,
  status = 'ready',
  copyService = copyText,
  downloadService = downloadHtml,
}: PreviewWorkspaceProps) {
  const [copyPending, setCopyPending] = useState(false);
  const formattedHtml = useMemo(() => formatHtml(exportResult.html), [exportResult.html]);
  const [feedback, setFeedback] = useState<
    { html: string; kind: 'success' | 'error'; message: string } | undefined
  >();
  const visibleFeedback =
    feedback?.html === formattedHtml ? feedback : undefined;

  const handleCopy = async () => {
    const html = formattedHtml;
    setCopyPending(true);
    setFeedback(undefined);
    try {
      const result = await copyService(html);
      setFeedback(
        result.ok
          ? {
              html,
              kind: 'success',
              message: 'HTML copied to clipboard.',
            }
          : { html, kind: 'error', message: result.message },
      );
    } catch {
      setFeedback({
        html,
        kind: 'error',
        message: 'Could not copy HTML. Select the generated code and copy it manually.',
      });
    } finally {
      setCopyPending(false);
    }
  };

  const handleDownload = () => {
    const html = formattedHtml;
    setFeedback(undefined);
    try {
      const result = downloadService(html, templateId);
      setFeedback(
        result.ok
          ? {
              html,
              kind: 'success',
              message: `Download started: ${result.filename}`,
            }
          : { html, kind: 'error', message: result.message },
      );
    } catch {
      setFeedback({
        html,
        kind: 'error',
        message: 'Could not download the HTML file. Please try again.',
      });
    }
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentViewport: PreviewViewport,
  ) => {
    const currentIndex = VIEWPORTS.findIndex(({ id }) => id === currentViewport);
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % VIEWPORTS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + VIEWPORTS.length) % VIEWPORTS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = VIEWPORTS.length - 1;
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextViewport = VIEWPORTS[nextIndex].id;
    onViewportChange(nextViewport);
    document.getElementById(`${nextViewport}-preview-tab`)?.focus();
  };

  if (status === 'loading') {
    return (
      <div className={styles.fallback} role="status">
        Rendering email preview...
      </div>
    );
  }

  const errors = uniqueIssues(previewResult.errors, exportResult.errors);
  if (previewResult.html === '' || exportResult.html === '') {
    return (
      <div className={styles.fallback} role="alert">
        <strong>Email preview could not be rendered.</strong>
        {errors.length > 0 ? (
          <ul>
            {errors.map((error) => (
              <li key={`${error.code}:${error.fieldKey ?? ''}:${error.message}`}>
                {error.message}
              </li>
            ))}
          </ul>
        ) : (
          <p>The renderer returned an empty document.</p>
        )}
      </div>
    );
  }

  return (
    <div className={styles.previewWorkspace}>
      <section className={styles.previewPane} aria-labelledby="preview-heading">
        <header className={styles.paneHeader}>
          <h3 id="preview-heading">Preview</h3>
          <div className={styles.viewportTabs} role="tablist" aria-label="Preview viewport">
            {VIEWPORTS.map(({ id, label, icon: Icon }) => (
              <button
                aria-controls="email-preview-panel"
                aria-selected={viewport === id}
                className={styles.viewportTab}
                id={`${id}-preview-tab`}
                key={id}
                onClick={() => onViewportChange(id)}
                onKeyDown={(event) => handleTabKeyDown(event, id)}
                role="tab"
                tabIndex={viewport === id ? 0 : -1}
                type="button"
              >
                <Icon aria-hidden="true" size={14} />
                {label}
              </button>
            ))}
          </div>
        </header>

        <div
          aria-labelledby={`${viewport}-preview-tab`}
          className={styles.frameStage}
          id="email-preview-panel"
          role="tabpanel"
        >
          <EmailPreviewFrame key={viewport} html={previewResult.html} viewport={viewport} />
        </div>
      </section>

      <section className={styles.codePane}>
        <header className={styles.paneHeader}>
          <h3 id="code-heading">
            <Code2 aria-hidden="true" size={15} />
            Generated HTML
          </h3>
          <span>Export</span>
        </header>
        <textarea
          aria-label="Generated HTML"
          className={styles.codeView}
          readOnly
          spellCheck={false}
          value={formattedHtml}
          wrap="off"
        />
        <footer className={styles.exportFooter}>
          <div className={styles.exportActions}>
            <button
              aria-describedby={!canExport ? 'export-block-reasons' : undefined}
              disabled={!canExport || copyPending}
              onClick={() => void handleCopy()}
              type="button"
            >
              <Copy aria-hidden="true" size={15} />
              {copyPending ? 'Copying...' : 'Copy HTML'}
            </button>
            <button
              aria-describedby={!canExport ? 'export-block-reasons' : undefined}
              disabled={!canExport || copyPending}
              onClick={handleDownload}
              type="button"
            >
              <Download aria-hidden="true" size={15} />
              Download .html
            </button>
          </div>
          {!canExport && exportBlockReasons.length > 0 && (
            <div className={styles.exportBlocked} id="export-block-reasons">
              <strong>Export unavailable</strong>
              <ul>
                {exportBlockReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
          {visibleFeedback !== undefined && (
            <p
              className={
                visibleFeedback.kind === 'error'
                  ? styles.exportError
                  : styles.exportSuccess
              }
              role={visibleFeedback.kind === 'error' ? 'alert' : 'status'}
            >
              {visibleFeedback.message}
            </p>
          )}
        </footer>
      </section>
    </div>
  );
}
