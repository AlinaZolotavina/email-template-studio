import { LayoutTemplate } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { EditorPanel } from '../features/editor/components/EditorPanel';
import { TemplateGallery } from '../features/templates/components/TemplateGallery';
import { listTemplates } from '../features/templates/templateRegistry';
import { templateSelected } from '../features/templates/templatesSlice';
import {
  createBrowserLocalAssetsManager,
  type LocalAssetsManager,
} from '../infrastructure/localAssets';
import { useAppDispatch, useAppSelector } from './hooks';
import { selectSelectedTemplateDefinition } from './selectors';
import styles from './App.module.css';

const templates = listTemplates();

export function App({ localAssets: providedLocalAssets }: { localAssets?: LocalAssetsManager }) {
  const dispatch = useAppDispatch();
  const selectedTemplate = useAppSelector(selectSelectedTemplateDefinition);
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

          <div className={styles.visualStage} data-testid="selected-template-visual">
            <img
              src={`${import.meta.env.BASE_URL}${selectedTemplate.thumbnailPath}`}
              alt={`${selectedTemplate.name} email template preview`}
            />
          </div>
        </section>

        <aside className={styles.dataPanel} aria-label="Template editor">
          <EditorPanel key={selectedTemplate.id} localAssets={localAssets} />
        </aside>
      </main>
    </div>
  );
}
