import { ImagePlus, Trash2 } from 'lucide-react';
import { useId, useState, type ChangeEvent } from 'react';

import { isHexColor } from '../../../email/core';
import type {
  EmailFieldValue,
  ImageValue,
  LinkValue,
  TemplateField,
} from '../../../email/types';
import { validateFieldValue, validateImageFile } from '../fieldValidation';
import styles from './EditorPanel.module.css';

interface DynamicFieldProps {
  field: TemplateField;
  value: EmailFieldValue;
  onChange: (value: EmailFieldValue) => void;
  onImageFile?: (file: File) => void | Promise<void>;
  onRemoveLocalImage?: () => void;
}

function FieldErrors({ id, errors }: { id: string; errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div id={id} className={styles.errorText} role="alert">
      {errors.map((error) => <p key={error}>{error}</p>)}
    </div>
  );
}

export function DynamicField({
  field,
  value,
  onChange,
  onImageFile,
  onRemoveLocalImage,
}: DynamicFieldProps) {
  const id = useId();
  const errorId = `${id}-errors`;
  const colorValue = typeof value === 'string' ? value : '#000000';
  const [colorState, setColorState] = useState({ input: colorValue, base: colorValue });
  const [fileError, setFileError] = useState<string>();
  const colorDraft = colorState.base === colorValue ? colorState.input : colorValue;

  const errors = field.type === 'color'
    ? isHexColor(colorDraft) ? [] : ['Use a six-digit HEX color, for example #2563EB.']
    : validateFieldValue(field, value);
  if (fileError !== undefined) errors.push(fileError);
  const describedBy = errors.length > 0 ? errorId : undefined;

  if (field.type === 'color') {
    const updateColor = (nextValue: string) => {
      setColorState({ input: nextValue, base: colorValue });
      if (isHexColor(nextValue)) onChange(nextValue.toUpperCase());
    };
    return (
      <div className={styles.field}>
        <label htmlFor={id}>{field.label}</label>
        <div className={styles.colorControl}>
          <input
            aria-label={`${field.label} color picker`}
            className={styles.colorPicker}
            type="color"
            value={isHexColor(colorDraft) ? colorDraft : colorValue}
            onChange={(event) => updateColor(event.target.value)}
          />
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={errors.length > 0}
            className={styles.textInput}
            value={colorDraft}
            onChange={(event) => updateColor(event.target.value)}
            spellCheck={false}
          />
        </div>
        <FieldErrors id={errorId} errors={errors} />
      </div>
    );
  }

  if (field.type === 'toggle') {
    return (
      <div className={`${styles.field} ${styles.toggleField}`}>
        <label htmlFor={id}>{field.label}</label>
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={errors.length > 0}
          checked={value === true}
          type="checkbox"
          onChange={(event) => onChange(event.target.checked)}
        />
        <FieldErrors id={errorId} errors={errors} />
      </div>
    );
  }

  if (field.type === 'link') {
    const link: LinkValue =
      typeof value === 'object' &&
      value !== null &&
      'label' in value &&
      'url' in value &&
      typeof value.label === 'string' &&
      typeof value.url === 'string'
        ? value
        : { label: '', url: '' };
    return (
      <fieldset className={styles.fieldset} aria-describedby={describedBy}>
        <legend>{field.label}</legend>
        <label htmlFor={`${id}-label`}>Label</label>
        <input
          id={`${id}-label`}
          className={styles.textInput}
          aria-describedby={describedBy}
          aria-invalid={errors.length > 0}
          value={link.label}
          onChange={(event) => onChange({ ...link, label: event.target.value })}
        />
        <label htmlFor={`${id}-url`}>URL</label>
        <input
          id={`${id}-url`}
          className={styles.textInput}
          aria-describedby={describedBy}
          aria-invalid={errors.length > 0}
          type="url"
          value={link.url}
          onChange={(event) => onChange({ ...link, url: event.target.value })}
        />
        <FieldErrors id={errorId} errors={errors} />
      </fieldset>
    );
  }

  if (field.type === 'image') {
    const image: ImageValue =
      typeof value === 'object' &&
      value !== null &&
      'remoteUrl' in value &&
      'alt' in value &&
      typeof value.remoteUrl === 'string' &&
      typeof value.alt === 'string'
        ? value
        : { remoteUrl: '', alt: '' };
    const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file === undefined) return;
      const nextError = validateImageFile(file);
      setFileError(nextError);
      if (nextError !== undefined) return;
      try {
        await onImageFile?.(file);
      } catch {
        setFileError('The selected image could not be read. Try another file.');
      }
    };
    return (
      <fieldset className={styles.fieldset} aria-describedby={describedBy}>
        <legend>{field.label}</legend>
        <p className={styles.fieldHint}>Recommended: {field.recommendedSize}</p>
        <label htmlFor={`${id}-url`}>Public image URL</label>
        <input
          id={`${id}-url`}
          className={styles.textInput}
          aria-describedby={describedBy}
          aria-invalid={errors.length > 0}
          type="url"
          value={image.remoteUrl}
          onChange={(event) => onChange({ ...image, remoteUrl: event.target.value })}
        />
        <label htmlFor={`${id}-alt`}>Alt text</label>
        <input
          id={`${id}-alt`}
          className={styles.textInput}
          aria-describedby={describedBy}
          aria-invalid={errors.length > 0}
          value={image.alt}
          onChange={(event) => onChange({ ...image, alt: event.target.value })}
        />
        <div className={styles.fileRow}>
          <span className={styles.filePicker}>
            <input
              id={`${id}-file`}
              className={styles.fileInput}
              aria-describedby={describedBy}
              aria-invalid={fileError !== undefined}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => void handleFile(event)}
            />
            <label className={styles.fileButton} htmlFor={`${id}-file`}>
              <ImagePlus aria-hidden="true" size={15} /> Local preview
            </label>
          </span>
          {image.localPreviewUrl && (
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`Remove local preview for ${field.label}`}
              title="Remove local preview"
              onClick={onRemoveLocalImage}
            >
              <Trash2 aria-hidden="true" size={15} />
            </button>
          )}
        </div>
        {image.localPreviewUrl && (
          <p className={styles.previewStatus}>Local preview only. A public URL is required for export.</p>
        )}
        <FieldErrors id={errorId} errors={errors} />
      </fieldset>
    );
  }

  const stringValue = typeof value === 'string' ? value : '';
  const common = {
    id,
    className: styles.textInput,
    value: stringValue,
    'aria-describedby': describedBy,
    'aria-invalid': errors.length > 0,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{field.label}</label>
      {field.type === 'textarea' ? (
        <textarea {...common} rows={field.rows ?? 3} maxLength={field.maxLength} />
      ) : (
        <input
          {...common}
          type={field.type === 'url' ? 'url' : 'text'}
          maxLength={field.type === 'text' ? field.maxLength : undefined}
        />
      )}
      {(field.type === 'text' || field.type === 'textarea') && (
        <span className={styles.characterCount}>{stringValue.length}/{field.maxLength}</span>
      )}
      <FieldErrors id={errorId} errors={errors} />
    </div>
  );
}
