import { LayoutTemplate } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { EditorPanel } from '../features/editor/components/EditorPanel';
import { PreviewWorkspace } from '../features/preview/components/PreviewWorkspace';
import { viewportChanged } from '../features/preview/previewSlice';
import { TemplateGallery } from '../features/templates/components/TemplateGallery';
import { listTemplates } from '../features/templates/templateRegistry';
import { templateSelected } from '../features/templates/templatesSlice';
import {
  createBrowserLocalAssetsManager,
  type LocalAssetsManager,
} from '../infrastructure/localAssets';
import { useAppDispatch, useAppSelector } from './hooks';
import {
  selectCanExport,
  selectExportBlockReasons,
  selectExportRenderResult,
  selectPreviewRenderResult,
  selectSelectedTemplateDefinition,
} from './selectors';
import styles from './App.module.css';

const templates = listTemplates();

export function App({ localAssets: providedLocalAssets }: { localAssets?: LocalAssetsManager }) {
  const dispatch = useAppDispatch();
  const selectedTemplate = useAppSelector(selectSelectedTemplateDefinition);
  const previewResult = useAppSelector(selectPreviewRenderResult);
  const exportResult = useAppSelector(selectExportRenderResult);
  const canExport = useAppSelector(selectCanExport);
  const exportBlockReasons = useAppSelector(selectExportBlockReasons);
  const previewViewport = useAppSelector((state) => state.preview.viewport);
  const localAssets = useMemo(
    () => providedLocalAssets ?? createBrowserLocalAssetsManager(),
    [providedLocalAssets],
  );

  useEffect(() => {
    const releaseAll = () => localAssets.releaseAll();
    window.addEventListener('pagehide', releaseAll);
    return () => {
      window.removeEventListener('pagehide', releaseAll);
      localAssets.releaseAll();
    };
  }, [localAssets]);

  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <LayoutTemplate aria-hidden="true" size={20} strokeWidth={1.8} />
          <h1>Email Template Studio</h1>
        </div>
        <span className={styles.status}>Session saved in this tab</span>
      </header>

      <main className={styles.workspace}>
        <aside className={styles.templatePanel} aria-label="Template gallery">
          <TemplateGallery
            key={selectedTemplate.category}
            templates={templates}
            selectedTemplateId={selectedTemplate.id}
            onSelect={(templateId) => dispatch(templateSelected(templateId))}
          />
        </aside>

        <section className={styles.canvas} aria-labelledby="workspace-title">
          <header className={styles.canvasHeader}>
            <div>
              <p className={styles.sectionLabel}>{selectedTemplate.category}</p>
              <h2 id="workspace-title">{selectedTemplate.name}</h2>
              <p>{selectedTemplate.description}</p>
            </div>
            <span className={styles.templateId}>{selectedTemplate.id}</span>
          </header>

          <PreviewWorkspace
            canExport={canExport}
            exportResult={exportResult}
            exportBlockReasons={exportBlockReasons}
            onViewportChange={(viewport) => dispatch(viewportChanged(viewport))}
            previewResult={previewResult}
            templateId={selectedTemplate.id}
            viewport={previewViewport}
          />
        </section>

        <aside className={styles.dataPanel} aria-label="Template editor">
          <EditorPanel key={selectedTemplate.id} localAssets={localAssets} />
        </aside>
      </main>
    </div>
  );
}
