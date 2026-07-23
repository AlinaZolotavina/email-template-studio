import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import type {
  EmailFieldValue,
  ImageValue,
  TemplateFieldGroup,
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

const GROUPS: { id: TemplateFieldGroup; label: string }[] = [
  { id: 'content', label: 'Content' },
  { id: 'brand', label: 'Brand' },
  { id: 'images', label: 'Images' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'footer', label: 'Footer' },
];

export function EditorPanel({ localAssets }: { localAssets: LocalAssetsManager }) {
  const dispatch = useAppDispatch();
  const template = useAppSelector(selectSelectedTemplateDefinition);
  const draft = useAppSelector(selectSelectedDraft);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);

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
        {GROUPS.map((group, index) => {
          const fields = template.fields.filter((field) => field.group === group.id);
          if (fields.length === 0) return null;
          return (
            <details className={styles.group} key={group.id} open={index < 2}>
              <summary>{group.label}<span>{fields.length}</span></summary>
              <div className={styles.groupFields}>
                {fields.map((field) => (
                  <DynamicField
                    key={`${template.id}:${field.key}:${editorRevision}`}
                    field={field}
                    value={valueFor(field.key, field.type)}
                    onChange={(value) => updateField(field.key, value)}
                    onImageFile={field.type === 'image' ? (file) => {
                      const localPreviewUrl = localAssets.attach(template.id, field.key, file);
                      dispatch(imageLocalPreviewAttached({ templateId: template.id, key: field.key, localPreviewUrl }));
                    } : undefined}
                    onRemoveLocalImage={field.type === 'image' ? () => {
                      localAssets.release(template.id, field.key);
                      dispatch(imageLocalPreviewRemoved({ templateId: template.id, key: field.key }));
                    } : undefined}
                  />
                ))}
              </div>
            </details>
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
