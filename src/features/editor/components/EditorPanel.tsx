import { ChevronDown, Plus, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type {
  EmailFieldValue,
  ImageValue,
} from '../../../email/types';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectSelectedDraft, selectSelectedTemplateDefinition } from '../../../app/selectors';
import type { LocalAssetsManager } from '../../../infrastructure/localAssets';
import {
  draftReset,
  fieldChanged,
  imageLocalPreviewAttached,
  imageLocalPreviewRemoved,
  imageRemoteUrlChanged,
  themeChanged,
} from '../editorSlice';
import { DynamicField } from './DynamicField';
import styles from './EditorPanel.module.css';

export function EditorPanel({ localAssets }: { localAssets: LocalAssetsManager }) {
  const dispatch = useAppDispatch();
  const template = useAppSelector(selectSelectedTemplateDefinition);
  const draft = useAppSelector(selectSelectedDraft);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({});

  const valueFor = (fieldKey: string, type: string): EmailFieldValue => {
    if (type === 'color') {
      const field = template.fields.find((candidate) => candidate.key === fieldKey);
      return field?.type === 'color' ? draft.theme[field.themeKey] : '';
    }
    return draft.fields[fieldKey] ?? '';
  };

  const updateField = (fieldKey: string, value: EmailFieldValue) => {
    const field = template.fields.find((candidate) => candidate.key === fieldKey);
    if (field?.type === 'color' && typeof value === 'string') {
      dispatch(themeChanged({ templateId: template.id, key: field.themeKey, value }));
      return;
    }
    if (field?.type === 'image' && typeof value === 'object' && value !== null && 'remoteUrl' in value) {
      const previous = draft.fields[fieldKey] as ImageValue;
      if (previous.remoteUrl !== value.remoteUrl) {
        dispatch(imageRemoteUrlChanged({ templateId: template.id, key: fieldKey, remoteUrl: value.remoteUrl }));
      }
      if (previous.alt !== value.alt) {
        dispatch(fieldChanged({ templateId: template.id, key: fieldKey, value }));
      }
      return;
    }
    dispatch(fieldChanged({ templateId: template.id, key: fieldKey, value }));
  };

  const resetDraft = () => {
    localAssets.releaseTemplate(template.id);
    dispatch(draftReset(template.id));
    setEditorRevision((revision) => revision + 1);
    setConfirmingReset(false);
  };

  return (
    <div className={styles.editorPanel}>
      <header className={styles.panelHeader}>
        <SlidersHorizontal aria-hidden="true" size={17} />
        <div>
          <h2>Editor</h2>
          <p>{template.name}</p>
        </div>
      </header>

      <div className={styles.groups}>
        {(template.topLevelFieldKeys ?? []).length > 0 && (
          <div className={styles.topLevelFields}>
            {template.topLevelFieldKeys?.map((fieldKey) => {
              const field = template.fields.find((candidate) => candidate.key === fieldKey);
              if (field === undefined) throw new Error(`Unknown top-level field: ${fieldKey}`);
              return <DynamicField key={field.key} field={field} value={valueFor(field.key, field.type)} onChange={(value) => updateField(field.key, value)} />;
            })}
          </div>
        )}
        {template.editorSections.map((section, index) => {
          const sectionKey = `${template.id}:${section.id}`;
          const isOpen = sectionState[sectionKey] ?? index < 2;
          const fields = section.fieldKeys.map((fieldKey) => {
            const field = template.fields.find((candidate) => candidate.key === fieldKey);
            if (field === undefined) throw new Error(`Unknown editor field: ${fieldKey}`);
            return field;
          });
          const contentId = `editor-section-${template.id}-${section.id}`;
          const sectionEnabled = section.visibilityFieldKey === undefined || draft.fields[section.visibilityFieldKey] === true;
          return (
            <section className={styles.group} key={section.id}>
              <div className={styles.groupHeader}>
                <h3>{section.label}</h3>
                <div className={styles.sectionActions}>
                  {section.visibilityFieldKey !== undefined && sectionEnabled && (
                    <button className={styles.sectionAction} type="button" aria-label={`Remove ${section.label}`} title={`Remove ${section.label}`} onClick={() => updateField(section.visibilityFieldKey!, false)}>
                      <Trash2 aria-hidden="true" size={14} />
                    </button>
                  )}
                  {!sectionEnabled && section.visibilityFieldKey !== undefined ? (
                    <button className={styles.restoreSectionButton} type="button" aria-label={`Add ${section.label}`} onClick={() => updateField(section.visibilityFieldKey!, true)}>
                      <Plus aria-hidden="true" size={14} /> Add section
                    </button>
                  ) : (
                    <button
                      className={styles.sectionToggle}
                      type="button"
                      aria-controls={contentId}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${section.label}`}
                      title={`${isOpen ? 'Collapse' : 'Expand'} ${section.label}`}
                      onClick={() => setSectionState((current) => ({ ...current, [sectionKey]: !isOpen }))}
                    >
                      <ChevronDown aria-hidden="true" size={16} />
                    </button>
                  )}
                </div>
              </div>
              {sectionEnabled && isOpen ? <div className={styles.groupFields} id={contentId}>
                {fields.map((field) => {
                  const fieldEnabled = field.visibilityFieldKey === undefined || draft.fields[field.visibilityFieldKey] === true;
                  const editorField = fieldEnabled ? <DynamicField
                    key={`${template.id}:${field.key}:${editorRevision}`}
                    field={field}
                    value={valueFor(field.key, field.type)}
                    hideLabel={field.visibilityFieldKey !== undefined || section.hiddenFieldLabels?.includes(field.key)}
                    onChange={(value) => updateField(field.key, value)}
                    onImageFile={field.type === 'image' || field.type === 'article-list' ? async (file, itemIndex) => {
                      const assetKey = itemIndex === undefined ? field.key : `${field.key}.${itemIndex}`;
                      const localPreviewUrl = await localAssets.attach(template.id, assetKey, file);
                      if (field.type === 'article-list' && itemIndex !== undefined) {
                        const articles = structuredClone(draft.fields[field.key]);
                        if (Array.isArray(articles) && articles[itemIndex] && 'image' in articles[itemIndex]) {
                          articles[itemIndex].image.localPreviewUrl = localPreviewUrl;
                          updateField(field.key, articles);
                        }
                      } else {
                        dispatch(imageLocalPreviewAttached({ templateId: template.id, key: field.key, localPreviewUrl }));
                      }
                    } : undefined}
                    onRemoveLocalImage={field.type === 'image' || field.type === 'article-list' ? (itemIndex) => {
                      const assetKey = itemIndex === undefined ? field.key : `${field.key}.${itemIndex}`;
                      localAssets.release(template.id, assetKey);
                      if (field.type === 'article-list' && itemIndex !== undefined) {
                        const articles = structuredClone(draft.fields[field.key]);
                        if (Array.isArray(articles) && articles[itemIndex] && 'image' in articles[itemIndex]) {
                          delete articles[itemIndex].image.localPreviewUrl;
                          updateField(field.key, articles);
                        }
                      } else {
                        dispatch(imageLocalPreviewRemoved({ templateId: template.id, key: field.key }));
                      }
                    } : undefined}
                  /> : null;

                  if (field.visibilityFieldKey === undefined) return editorField;
                  return (
                    <div className={styles.fieldBlock} key={`${template.id}:${field.key}:${editorRevision}`} role="group" aria-label={field.label}>
                      <div className={styles.fieldBlockHeader}>
                        <h4>{field.label}</h4>
                        {fieldEnabled ? (
                          <button className={styles.sectionAction} type="button" aria-label={`Remove ${field.label}`} title={`Remove ${field.label}`} onClick={() => updateField(field.visibilityFieldKey!, false)}>
                            <Trash2 aria-hidden="true" size={14} />
                          </button>
                        ) : (
                          <button className={styles.restoreSectionButton} type="button" aria-label={`Add ${field.label}`} onClick={() => updateField(field.visibilityFieldKey!, true)}>
                            <Plus aria-hidden="true" size={14} /> Add
                          </button>
                        )}
                      </div>
                      {editorField}
                    </div>
                  );
                })}
              </div> : null}
            </section>
          );
        })}
      </div>

      <div className={styles.resetArea}>
        {!confirmingReset ? (
          <button className={styles.resetButton} type="button" onClick={() => setConfirmingReset(true)}>
            <RotateCcw aria-hidden="true" size={15} /> Reset draft
          </button>
        ) : (
          <div className={styles.resetConfirm} role="group" aria-label="Confirm draft reset">
            <p>Reset this template to its defaults?</p>
            <button type="button" onClick={resetDraft}>Reset</button>
            <button type="button" onClick={() => setConfirmingReset(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
