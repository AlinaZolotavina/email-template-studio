import {
  ArrowLeft,
  Copy,
  LayoutTemplate,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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

type AppRoute =
  | { view: 'templates' }
  | { view: 'studio'; templateId: (typeof templates)[number]['id'] };

function readRoute(): AppRoute {
  const match = /^#\/studio\/([^/]+)$/.exec(window.location.hash);
  const template = templates.find((candidate) => candidate.id === match?.[1]);
  return template === undefined
    ? { view: 'templates' }
    : { view: 'studio', templateId: template.id };
}

export function App({ localAssets: providedLocalAssets }: { localAssets?: LocalAssetsManager }) {
  const dispatch = useAppDispatch();
  const [route, setRoute] = useState<AppRoute>(readRoute);
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

  useEffect(() => {
    const syncRoute = () => {
      const nextRoute = readRoute();
      setRoute(nextRoute);
      if (nextRoute.view === 'studio') {
        dispatch(templateSelected(nextRoute.templateId));
      }
    };

    if (window.location.hash === '') {
      window.history.replaceState(null, '', '#/templates');
    }
    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, [dispatch]);

  const navigate = (nextRoute: AppRoute) => {
    const hash =
      nextRoute.view === 'studio'
        ? `#/studio/${nextRoute.templateId}`
        : '#/templates';
    setRoute(nextRoute);
    window.location.hash = hash;
  };

  const studioOpen = route.view === 'studio';

  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <LayoutTemplate aria-hidden="true" size={20} strokeWidth={1.8} />
          <h1>Email Template Studio</h1>
        </div>
        <span className={styles.status}>Session saved in this tab</span>
      </header>

      {!studioOpen ? (
        <main className={styles.home}>
          <section className={styles.promo} aria-labelledby="promo-title">
            <p className={styles.eyebrow}>Email creation, simplified</p>
            <h2 id="promo-title">Choose. Customize. Copy.</h2>
            <p>Pick a layout, make it yours, and export email-ready HTML. Easy peasy.</p>
            <ol className={styles.steps}>
              <li><LayoutTemplate aria-hidden="true" size={18} /><span><strong>Choose</strong> a template</span></li>
              <li><SlidersHorizontal aria-hidden="true" size={18} /><span><strong>Customize</strong> the details</span></li>
              <li><Copy aria-hidden="true" size={18} /><span><strong>Copy</strong> clean HTML</span></li>
            </ol>
          </section>

          <section className={styles.templateChooser} aria-label="Choose a template">
          <TemplateGallery
            key={selectedTemplate.category}
            templates={templates}
            selectedTemplateId={selectedTemplate.id}
            onSelect={(templateId) => {
              dispatch(templateSelected(templateId));
              navigate({ view: 'studio', templateId });
            }}
          />
          </section>
        </main>
      ) : (
        <main className={styles.workspace}>
          <section className={styles.canvas} aria-labelledby="workspace-title">
            <header className={styles.canvasHeader}>
              <button
                className={styles.backButton}
                onClick={() => navigate({ view: 'templates' })}
                title="Back to templates"
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={17} />
                <span>Templates</span>
              </button>
              <div className={styles.templateMeta}>
                <p className={styles.sectionLabel}>{selectedTemplate.category}</p>
                <h2 id="workspace-title">{selectedTemplate.name}</h2>
                <p>{selectedTemplate.description}</p>
              </div>
              <span className={styles.templateId}>{selectedTemplate.id}</span>
            </header>

            <PreviewWorkspace
              key={selectedTemplate.id}
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
      )}
    </div>
  );
}
