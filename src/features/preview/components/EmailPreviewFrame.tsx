import type { PreviewViewport } from '../previewSlice';
import { PREVIEW_DIMENSIONS } from '../previewDimensions';
import styles from './PreviewWorkspace.module.css';

interface EmailPreviewFrameProps {
  html: string;
  viewport: PreviewViewport;
}

export function EmailPreviewFrame({
  html,
  viewport,
}: EmailPreviewFrameProps) {
  const dimensions = PREVIEW_DIMENSIONS[viewport];

  return (
    <div className={styles.frameScroller}>
      <iframe
        className={styles.previewFrame}
        data-testid="email-preview-frame"
        height={dimensions.height}
        sandbox=""
        srcDoc={html}
        title="Email preview"
        width={dimensions.width}
      />
    </div>
  );
}
