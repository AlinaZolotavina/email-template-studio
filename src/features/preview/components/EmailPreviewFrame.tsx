import { useEffect, useRef, useState } from 'react';

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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | undefined>(undefined);
  const [frameHeight, setFrameHeight] = useState(dimensions.height);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  const syncFrameHeight = () => {
    const document = frameRef.current?.contentDocument;
    if (document === undefined || document === null) return;
    const contentHeight = Math.max(
      document.body?.scrollHeight ?? 0,
      document.documentElement.scrollHeight,
    );
    setFrameHeight(Math.max(dimensions.height, contentHeight));

    observerRef.current?.disconnect();
    if (typeof ResizeObserver !== 'undefined' && document.body !== null) {
      observerRef.current = new ResizeObserver(syncFrameHeight);
      observerRef.current.observe(document.body);
    }
  };

  return (
    <div className={styles.frameScroller}>
      <iframe
        ref={frameRef}
        className={styles.previewFrame}
        data-testid="email-preview-frame"
        height={frameHeight}
        onLoad={syncFrameHeight}
        sandbox="allow-same-origin"
        scrolling="no"
        srcDoc={html}
        title="Email preview"
        width={dimensions.width}
      />
    </div>
  );
}
