import {
  ArrowLeft,
  ChevronRight,
  Copy,
  LayoutTemplate,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { EditorPanel } from '../features/editor/components/EditorPanel';
import { draftReset } from '../features/editor/editorSlice';
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
  selectExportWarnings,
  selectIsSelectedDraftDirty,
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
  const [confirmingExit, setConfirmingExit] = useState(false);
  const [hasLocalEditorChanges, setHasLocalEditorChanges] = useState(false);
  const selectedTemplate = useAppSelector(selectSelectedTemplateDefinition);
  const previewResult = useAppSelector(selectPreviewRenderResult);
  const exportResult = useAppSelector(selectExportRenderResult);
  const canExport = useAppSelector(selectCanExport);
  const exportBlockReasons = useAppSelector(selectExportBlockReasons);
  const exportWarnings = useAppSelector(selectExportWarnings);
  const previewViewport = useAppSelector((state) => state.preview.viewport);
  const isDraftDirty = useAppSelector(selectIsSelectedDraftDirty);
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
  const hasEditorChanges = isDraftDirty || hasLocalEditorChanges;

  const leaveStudio = () => {
    localAssets.releaseTemplate(selectedTemplate.id);
    dispatch(draftReset(selectedTemplate.id));
    setHasLocalEditorChanges(false);
    setConfirmingExit(false);
    navigate({ view: 'templates' });
  };

  return (
    <div className={styles.appShell}>
      <header className={`${styles.header} ${studioOpen ? styles.studioHeader : ''}`}>
        <div className={styles.brand}>
          <LayoutTemplate aria-hidden="true" size={20} strokeWidth={1.8} />
          <h1>Email Template Studio</h1>
        </div>
        <span className={styles.status}>Session saved in this tab</span>
      </header>

      {!studioOpen ? (
        <main className={styles.home}>
          <section className={styles.promo} aria-labelledby="promo-title">
            <img
              aria-hidden="true"
              className={styles.heroBackground}
              src={`${import.meta.env.BASE_URL}hero-assets/hero-bg.jpg`}
            />
            <div className={styles.promoContent}>
              <img
                alt="Email template transformed into export-ready HTML"
                className={styles.heroImage}
                src={`${import.meta.env.BASE_URL}hero-assets/hero-image.png`}
              />
              <h2 id="promo-title">Email creation, simplified</h2>
              <ol className={styles.steps}>
                <li>
                  <span className={`${styles.stepIcon} ${styles.stepIconGreen}`}><LayoutTemplate aria-hidden="true" size={25} /></span>
                  <strong>Pick a template</strong>
                  <ChevronRight aria-hidden="true" className={styles.stepArrow} size={30} />
                </li>
                <li>
                  <span className={`${styles.stepIcon} ${styles.stepIconPurple}`}><SlidersHorizontal aria-hidden="true" size={25} /></span>
                  <strong>Make it yours</strong>
                  <ChevronRight aria-hidden="true" className={styles.stepArrow} size={30} />
                </li>
                <li>
                  <span className={`${styles.stepIcon} ${styles.stepIconBlue}`}><Copy aria-hidden="true" size={25} /></span>
                  <strong>Export HTML</strong>
                </li>
              </ol>
            </div>
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
          <img
            aria-hidden="true"
            className={styles.workspaceBackground}
            src={`${import.meta.env.BASE_URL}hero-assets/hero-bg.jpg`}
          />
          <section className={styles.canvas} aria-labelledby="workspace-title">
            <header className={styles.canvasHeader}>
              <button
                className={styles.backButton}
                onClick={() => {
                  if (hasEditorChanges) setConfirmingExit(true);
                  else navigate({ view: 'templates' });
                }}
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
              exportWarnings={exportWarnings}
              onViewportChange={(viewport) => dispatch(viewportChanged(viewport))}
              previewResult={previewResult}
              templateId={selectedTemplate.id}
              viewport={previewViewport}
            />
          </section>

          <aside className={styles.dataPanel} aria-label="Template editor">
            <EditorPanel
              key={selectedTemplate.id}
              localAssets={localAssets}
              onLocalDirtyStateChange={setHasLocalEditorChanges}
            />
          </aside>
          <ConfirmDialog
            confirmLabel="Leave and reset"
            description="All changes in this template will be reset to their default values. Are you sure you want to return to templates?"
            onCancel={() => setConfirmingExit(false)}
            onConfirm={leaveStudio}
            open={confirmingExit}
            title="Leave the editor?"
          />
        </main>
      )}
    </div>
  );
}
