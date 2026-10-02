import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent } from 'react';

import { isHexColor } from '../../../email/core';
import type {
  ArticleValue,
  BenefitValue,
  EmailFieldValue,
  ImageValue,
  LinkValue,
  StepValue,
  TemplateField,
} from '../../../email/types';
import { validateFieldValue, validateImageFile } from '../fieldValidation';
import styles from './EditorPanel.module.css';

interface DynamicFieldProps {
  field: TemplateField;
  value: EmailFieldValue;
  onChange: (value: EmailFieldValue) => void;
  onLocalDirtyChange?: (dirty: boolean) => void;
  hideLabel?: boolean;
  onImageFile?: (file: File, itemIndex?: number) => void | Promise<void>;
  onRemoveLocalImage?: (itemIndex?: number) => void;
}

function FieldErrors({ id, errors }: { id: string; errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div id={id} className={styles.errorText} role="alert">
      {errors.map((error) => <p key={error}>{error}</p>)}
    </div>
  );
}

function StepColorControl({
  label,
  onChange,
  onDirtyChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  value: string;
}) {
  const id = useId();
  const [colorState, setColorState] = useState({ input: value, base: value });
  const draft = colorState.base === value ? colorState.input : value;

  const update = (nextValue: string) => {
    setColorState({ input: nextValue, base: value });
    const valid = isHexColor(nextValue);
    onDirtyChange(!valid && nextValue !== value);
    if (valid) onChange(nextValue.toUpperCase());
  };

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className={styles.colorControl}>
        <input
          aria-label={`${label} picker`}
          className={styles.colorPicker}
          type="color"
          value={isHexColor(draft) ? draft : value}
          onChange={(event) => update(event.target.value)}
        />
        <input
          aria-invalid={!isHexColor(draft)}
          className={styles.textInput}
          id={id}
          spellCheck={false}
          value={draft}
          onChange={(event) => update(event.target.value)}
        />
      </div>
    </>
  );
}

export function DynamicField({
  field,
  value,
  onChange,
  onLocalDirtyChange,
  hideLabel = false,
  onImageFile,
  onRemoveLocalImage,
}: DynamicFieldProps) {
  const id = useId();
  const errorId = `${id}-errors`;
  const colorValue = typeof value === 'string' ? value : '#000000';
  const [colorState, setColorState] = useState({ input: colorValue, base: colorValue });
  const currentButton =
    typeof value === 'object' && value !== null && 'backgroundColor' in value
      ? value
      : { label: '', url: '', backgroundColor: '#000000', textColor: '#FFFFFF' };
  const [buttonBackgroundState, setButtonBackgroundState] = useState({ input: currentButton.backgroundColor, base: currentButton.backgroundColor });
  const [buttonTextState, setButtonTextState] = useState({ input: currentButton.textColor, base: currentButton.textColor });
  const [fileError, setFileError] = useState<string>();
  const nestedLocalDirty = useRef(new Set<string>());
  const colorDraft = colorState.base === colorValue ? colorState.input : colorValue;
  const buttonBackgroundDraft = buttonBackgroundState.base === currentButton.backgroundColor ? buttonBackgroundState.input : currentButton.backgroundColor;
  const buttonTextDraft = buttonTextState.base === currentButton.textColor ? buttonTextState.input : currentButton.textColor;

  const errors = field.type === 'color'
    ? isHexColor(colorDraft) ? [] : ['Use a six-digit HEX color, for example #2563EB.']
    : validateFieldValue(field, value);
  if (field.type === 'button') {
    if (!isHexColor(buttonBackgroundDraft)) errors.push('Enter a valid button color.');
    if (!isHexColor(buttonTextDraft)) errors.push('Enter a valid button text color.');
  }
  if (fileError !== undefined) errors.push(fileError);
  const describedBy = errors.length > 0 ? errorId : undefined;
  const reportNestedLocalDirty = (key: string, dirty: boolean) => {
    if (dirty) nestedLocalDirty.current.add(key);
    else nestedLocalDirty.current.delete(key);
    onLocalDirtyChange?.(nestedLocalDirty.current.size > 0);
  };

  if (field.type === 'link-list') {
    const links = Array.isArray(value) ? value as LinkValue[] : [];
    return (
      <div className={styles.collection}>
        {!hideLabel && <p className={styles.collectionLabel}>{field.label}</p>}
        {links.map((link, index) => (
          <div className={styles.collectionItem} key={index} role="group" aria-label={`Link ${index + 1}`}>
            <p className={styles.blockTitle}>Link {index + 1}</p>
            <button className={styles.removeItemButton} type="button" aria-label={`Remove link ${index + 1}`} title="Remove link" onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))}>
              <Trash2 aria-hidden="true" size={14} />
            </button>
            <label htmlFor={`${id}-${index}-label`}>Label</label>
            <input id={`${id}-${index}-label`} className={styles.textInput} value={link.label} onChange={(event) => onChange(links.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} />
            <label htmlFor={`${id}-${index}-url`}>URL</label>
            <input id={`${id}-${index}-url`} className={styles.textInput} type="url" value={link.url} onChange={(event) => onChange(links.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} />
          </div>
        ))}
        <button className={styles.addItemButton} type="button" disabled={links.length >= field.maxItems} onClick={() => onChange([...links, { label: `Link ${links.length + 1}`, url: 'https://example.com' }])}>
          <Plus aria-hidden="true" size={14} /> Add link
        </button>
        <FieldErrors id={errorId} errors={errors} />
      </div>
    );
  }

  if (field.type === 'benefit-list') {
    const benefits = Array.isArray(value) ? value as BenefitValue[] : [];
    return (
      <div className={styles.collection}>
        {!hideLabel && <p className={styles.collectionLabel}>{field.label}</p>}
        {benefits.map((benefit, index) => (
          <div className={styles.collectionItem} key={index} role="group" aria-label={`Benefit ${index + 1}`}>
            <p className={styles.blockTitle}>Benefit {index + 1}</p>
            <button className={styles.removeItemButton} type="button" aria-label={`Remove benefit ${index + 1}`} title="Remove benefit" onClick={() => onChange(benefits.filter((_, itemIndex) => itemIndex !== index))}>
              <Trash2 aria-hidden="true" size={14} />
            </button>
            <label htmlFor={`${id}-${index}-label`}>Label</label>
            <input id={`${id}-${index}-label`} className={styles.textInput} value={benefit.label} onChange={(event) => onChange(benefits.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} />
            <label htmlFor={`${id}-${index}-text`}>Text</label>
            <input id={`${id}-${index}-text`} className={styles.textInput} value={benefit.text} onChange={(event) => onChange(benefits.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))} />
          </div>
        ))}
        <button className={styles.addItemButton} type="button" disabled={benefits.length >= field.maxItems} onClick={() => onChange([...benefits, { label: `Benefit ${benefits.length + 1}`, text: 'Describe this benefit' }])}>
          <Plus aria-hidden="true" size={14} /> Add benefit
        </button>
        <FieldErrors id={errorId} errors={errors} />
      </div>
    );
  }

  if (field.type === 'step-list') {
    const steps = Array.isArray(value) ? value as StepValue[] : [];
    return (
      <div className={styles.collection}>
        {!hideLabel && <p className={styles.collectionLabel}>{field.label}</p>}
        {steps.map((step, index) => (
          <div className={styles.collectionItem} key={index} role="group" aria-label={`Step ${index + 1}`}>
            <p className={styles.blockTitle}>Step {index + 1}</p>
            <button className={styles.removeItemButton} type="button" aria-label={`Remove step ${index + 1}`} title="Remove step" onClick={() => onChange(steps.filter((_, itemIndex) => itemIndex !== index))}>
              <Trash2 aria-hidden="true" size={14} />
            </button>
            <label htmlFor={`${id}-${index}-title`}>Title</label>
            <input id={`${id}-${index}-title`} className={styles.textInput} value={step.title} onChange={(event) => onChange(steps.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} />
            <label htmlFor={`${id}-${index}-text`}>Description</label>
            <textarea id={`${id}-${index}-text`} className={styles.textInput} rows={3} value={step.text} onChange={(event) => onChange(steps.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))} />
            <StepColorControl
              label="Number color"
              onChange={(numberColor) => onChange(steps.map((item, itemIndex) => itemIndex === index ? { ...item, numberColor } : item))}
              onDirtyChange={(dirty) => reportNestedLocalDirty(`${index}:numberColor`, dirty)}
              value={step.numberColor}
            />
            <StepColorControl
              label="Number background"
              onChange={(numberBackgroundColor) => onChange(steps.map((item, itemIndex) => itemIndex === index ? { ...item, numberBackgroundColor } : item))}
              onDirtyChange={(dirty) => reportNestedLocalDirty(`${index}:numberBackgroundColor`, dirty)}
              value={step.numberBackgroundColor}
            />
          </div>
        ))}
        <button className={styles.addItemButton} type="button" onClick={() => onChange([...steps, { title: `Step ${steps.length + 1}`, text: 'Describe this step', numberColor: '#0369A1', numberBackgroundColor: '#EFF6FF' }])}>
          <Plus aria-hidden="true" size={14} /> Add step
        </button>
        <FieldErrors id={errorId} errors={errors} />
      </div>
    );
  }

  if (field.type === 'article-list') {
    const articles = Array.isArray(value) ? value as ArticleValue[] : [];
    const updateArticle = (index: number, update: Partial<ArticleValue>) =>
      onChange(articles.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item));
    const handleArticleFile = async (event: ChangeEvent<HTMLInputElement>, index: number) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file === undefined) return;
      const nextError = validateImageFile(file);
      setFileError(nextError);
      if (nextError === undefined) await onImageFile?.(file, index);
    };
    return (
      <div className={styles.collection}>
        {!hideLabel && <p className={styles.collectionLabel}>{field.label}</p>}
        {articles.map((article, index) => (
          <div className={styles.collectionItem} key={index} role="group" aria-label={`Article ${index + 1}`}>
            <p className={styles.blockTitle}>Article {index + 1}</p>
            <button className={styles.removeItemButton} type="button" aria-label={`Remove article ${index + 1}`} title="Remove article" onClick={() => onChange(articles.filter((_, itemIndex) => itemIndex !== index))}>
              <Trash2 aria-hidden="true" size={14} />
            </button>
            <label htmlFor={`${id}-${index}-category`}>Category</label>
            <input id={`${id}-${index}-category`} className={styles.textInput} value={article.category} onChange={(event) => updateArticle(index, { category: event.target.value })} />
            <label htmlFor={`${id}-${index}-title`}>Title</label>
            <input id={`${id}-${index}-title`} className={styles.textInput} value={article.title} onChange={(event) => updateArticle(index, { title: event.target.value })} />
            <label htmlFor={`${id}-${index}-text`}>Summary</label>
            <textarea id={`${id}-${index}-text`} className={styles.textInput} rows={3} value={article.text} onChange={(event) => updateArticle(index, { text: event.target.value })} />
            <label htmlFor={`${id}-${index}-image-url`}>Image URL</label>
            <input id={`${id}-${index}-image-url`} className={styles.textInput} type="url" value={article.image.remoteUrl} onChange={(event) => updateArticle(index, { image: { ...article.image, remoteUrl: event.target.value } })} />
            <label htmlFor={`${id}-${index}-image-alt`}>Image alt text</label>
            <input id={`${id}-${index}-image-alt`} className={styles.textInput} value={article.image.alt} onChange={(event) => updateArticle(index, { image: { ...article.image, alt: event.target.value } })} />
            <div className={styles.fileRow}>
              <span className={styles.filePicker}>
                <input id={`${id}-${index}-file`} className={styles.fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void handleArticleFile(event, index)} />
                <label className={styles.fileButton} htmlFor={`${id}-${index}-file`}><ImagePlus aria-hidden="true" size={15} /> Local preview</label>
              </span>
              {article.image.localPreviewUrl && <button type="button" className={styles.iconButton} aria-label={`Remove local preview for article ${index + 1}`} onClick={() => onRemoveLocalImage?.(index)}><Trash2 aria-hidden="true" size={15} /></button>}
            </div>
            <label htmlFor={`${id}-${index}-link-label`}>Link label</label>
            <input id={`${id}-${index}-link-label`} className={styles.textInput} value={article.link.label} onChange={(event) => updateArticle(index, { link: { ...article.link, label: event.target.value } })} />
            <label htmlFor={`${id}-${index}-link-url`}>Link URL</label>
            <input id={`${id}-${index}-link-url`} className={styles.textInput} type="url" value={article.link.url} onChange={(event) => updateArticle(index, { link: { ...article.link, url: event.target.value } })} />
          </div>
        ))}
        <button className={styles.addItemButton} type="button" disabled={articles.length >= field.maxItems} onClick={() => onChange([...articles, { category: 'CATEGORY', title: `Article ${articles.length + 1}`, text: 'Article summary', image: { remoteUrl: '', alt: `Article ${articles.length + 1} image` }, link: { label: 'Read more ->', url: 'https://example.com' } }])}>
          <Plus aria-hidden="true" size={14} /> Add article
        </button>
        <FieldErrors id={errorId} errors={errors} />
      </div>
    );
  }

  if (field.type === 'color') {
    const updateColor = (nextValue: string) => {
      setColorState({ input: nextValue, base: colorValue });
      const valid = isHexColor(nextValue);
      onLocalDirtyChange?.(!valid && nextValue !== colorValue);
      if (valid) onChange(nextValue.toUpperCase());
    };
    return (
      <div className={styles.field}>
        <label className={hideLabel ? styles.srOnly : undefined} htmlFor={id}>{field.label}</label>
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
        <label className={hideLabel ? styles.srOnly : undefined} htmlFor={id}>{field.label}</label>
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

  if (field.type === 'button') {
    const button = currentButton;
    const updateButtonColor = (key: 'backgroundColor' | 'textColor', nextValue: string) => {
      if (key === 'backgroundColor') {
        setButtonBackgroundState({ input: nextValue, base: button.backgroundColor });
      } else {
        setButtonTextState({ input: nextValue, base: button.textColor });
      }
      const valid = isHexColor(nextValue);
      const nextBackground = key === 'backgroundColor' ? nextValue : buttonBackgroundDraft;
      const nextText = key === 'textColor' ? nextValue : buttonTextDraft;
      onLocalDirtyChange?.(
        (!isHexColor(nextBackground) && nextBackground !== button.backgroundColor) ||
          (!isHexColor(nextText) && nextText !== button.textColor),
      );
      if (valid) onChange({ ...button, [key]: nextValue.toUpperCase() });
    };
    return (
      <div className={styles.fieldset} role="group" aria-label={field.label} aria-describedby={describedBy}>
        <p className={styles.blockTitle}>{field.label}</p>
        <label htmlFor={`${id}-label`}>Label</label>
        <input id={`${id}-label`} className={styles.textInput} value={button.label} onChange={(event) => onChange({ ...button, label: event.target.value })} />
        <label htmlFor={`${id}-url`}>URL</label>
        <input id={`${id}-url`} className={styles.textInput} type="url" value={button.url} onChange={(event) => onChange({ ...button, url: event.target.value })} />
        <label htmlFor={`${id}-background`}>Button color</label>
        <div className={styles.colorControl}>
          <input id={`${id}-background`} className={styles.colorPicker} type="color" value={isHexColor(buttonBackgroundDraft) ? buttonBackgroundDraft : '#000000'} onChange={(event) => updateButtonColor('backgroundColor', event.target.value)} />
          <input className={styles.textInput} aria-label="Button color HEX" aria-invalid={!isHexColor(buttonBackgroundDraft)} value={buttonBackgroundDraft} onChange={(event) => updateButtonColor('backgroundColor', event.target.value)} />
        </div>
        <label htmlFor={`${id}-text-color`}>Text color</label>
        <div className={styles.colorControl}>
          <input id={`${id}-text-color`} className={styles.colorPicker} type="color" value={isHexColor(buttonTextDraft) ? buttonTextDraft : '#FFFFFF'} onChange={(event) => updateButtonColor('textColor', event.target.value)} />
          <input className={styles.textInput} aria-label="Text color HEX" aria-invalid={!isHexColor(buttonTextDraft)} value={buttonTextDraft} onChange={(event) => updateButtonColor('textColor', event.target.value)} />
        </div>
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
      <div className={styles.fieldset} role="group" aria-label={field.label} aria-describedby={describedBy}>
        <p className={styles.blockTitle}>{field.label}</p>
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
      </div>
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
      <div className={styles.fieldset} role="group" aria-label={field.label} aria-describedby={describedBy}>
        <p className={styles.blockTitle}>{field.label}</p>
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
              onClick={() => onRemoveLocalImage?.()}
            >
              <Trash2 aria-hidden="true" size={15} />
            </button>
          )}
        </div>
        {image.localPreviewUrl && (
          <p className={styles.previewStatus}>Local preview only. A public URL is required for export.</p>
        )}
        <FieldErrors id={errorId} errors={errors} />
      </div>
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
      <label className={hideLabel ? styles.srOnly : undefined} htmlFor={id}>{field.label}</label>
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
