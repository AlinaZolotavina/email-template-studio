import { useRef, useState } from 'react';

import type { PreviewViewport } from '../previewSlice';
import { PREVIEW_DIMENSIONS } from '../previewDimensions';
import styles from './PreviewWorkspace.module.css';

interface EmailPreviewFrameProps {
  html: string;
  scale: number;
  viewport: PreviewViewport;
}

export function EmailPreviewFrame({
  html,
  scale,
  viewport,
}: EmailPreviewFrameProps) {
  const dimensions = PREVIEW_DIMENSIONS[viewport];
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(dimensions.height);

  const measureFrameHeight = () => {
    const document = frameRef.current?.contentDocument;
    if (document === undefined || document === null) return;
    const contentHeight = Math.max(
      document.body?.scrollHeight ?? 0,
      document.documentElement.scrollHeight,
    );
    const nextHeight = Math.max(dimensions.height, contentHeight);
    setFrameHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  };

  return (
    <div className={styles.frameScroller}>
      <div
        className={styles.frameCanvas}
        data-testid="email-preview-canvas"
        style={{
          height: frameHeight * scale,
          width: dimensions.width * scale,
        }}
      >
        <iframe
          ref={frameRef}
          className={styles.previewFrame}
          data-testid="email-preview-frame"
          height={frameHeight}
          onLoad={measureFrameHeight}
          sandbox="allow-same-origin"
          scrolling="no"
          srcDoc={html}
          style={{ transform: `scale(${scale})` }}
          title="Email preview"
          width={dimensions.width}
        />
      </div>
    </div>
  );
}
