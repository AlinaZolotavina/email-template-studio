import { FileText, LayoutTemplate } from 'lucide-react';

import type { EmailFieldValue } from '../email/types';
import { TemplateGallery } from '../features/templates/components/TemplateGallery';
import { listTemplates } from '../features/templates/templateRegistry';
import { templateSelected } from '../features/templates/templatesSlice';
import { useAppDispatch, useAppSelector } from './hooks';
import {
  selectSelectedDraft,
  selectSelectedTemplateDefinition,
} from './selectors';
import styles from './App.module.css';

const templates = listTemplates();

function formatFieldValue(value: EmailFieldValue): string {
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (typeof value === 'string') return value || 'Not set';
  if ('label' in value) return value.label || value.url || 'Not set';
  return value.alt || value.remoteUrl || 'Not set';
}

export function App() {
  const dispatch = useAppDispatch();
  const selectedTemplate = useAppSelector(selectSelectedTemplateDefinition);
  const selectedDraft = useAppSelector(selectSelectedDraft);

  const visibleFields = selectedTemplate.fields
    .filter((field) => field.type !== 'color')
    .slice(0, 8);

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

        <aside className={styles.dataPanel} aria-label="Selected template data">
          <header className={styles.panelHeader}>
            <FileText aria-hidden="true" size={17} />
            <h2>Draft data</h2>
          </header>

          <dl className={styles.metadata}>
            <div>
              <dt>Template</dt>
              <dd>{selectedTemplate.name}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{selectedTemplate.category}</dd>
            </div>
            <div>
              <dt>Schema</dt>
              <dd>v{selectedDraft.schemaVersion}</dd>
            </div>
            <div>
              <dt>Editable fields</dt>
              <dd>{selectedTemplate.fields.length}</dd>
            </div>
          </dl>

          <section className={styles.themeSection} aria-labelledby="theme-heading">
            <h3 id="theme-heading">Theme</h3>
            <div className={styles.swatches}>
              <span
                className={styles.swatch}
                style={{ backgroundColor: selectedDraft.theme.backgroundColor }}
                role="img"
                aria-label={`Background ${selectedDraft.theme.backgroundColor}`}
                title={`Background ${selectedDraft.theme.backgroundColor}`}
              />
              <span
                className={styles.swatch}
                style={{ backgroundColor: selectedDraft.theme.surfaceColor }}
                role="img"
                aria-label={`Surface ${selectedDraft.theme.surfaceColor}`}
                title={`Surface ${selectedDraft.theme.surfaceColor}`}
              />
              <span
                className={styles.swatch}
                style={{ backgroundColor: selectedDraft.theme.textColor }}
                role="img"
                aria-label={`Text ${selectedDraft.theme.textColor}`}
                title={`Text ${selectedDraft.theme.textColor}`}
              />
              <span
                className={styles.swatch}
                style={{ backgroundColor: selectedDraft.theme.accentColor }}
                role="img"
                aria-label={`Accent ${selectedDraft.theme.accentColor}`}
                title={`Accent ${selectedDraft.theme.accentColor}`}
              />
            </div>
            <p>{selectedDraft.theme.fontFamily}, {selectedDraft.theme.contentWidth}px</p>
          </section>

          <section className={styles.contentSection} aria-labelledby="content-heading">
            <h3 id="content-heading">Content</h3>
            <dl className={styles.fieldList}>
              {visibleFields.map((field) => (
                <div key={field.key}>
                  <dt>{field.label}</dt>
                  <dd>{formatFieldValue(selectedDraft.fields[field.key] ?? '')}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </main>
    </div>
  );
}
