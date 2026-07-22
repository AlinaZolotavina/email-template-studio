import { AlertCircle, ImageOff, LoaderCircle } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';

import type {
  TemplateCategory,
  TemplateDefinition,
  TemplateId,
} from '../../../email/types';
import styles from './TemplateGallery.module.css';

const categories = [
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'welcome', label: 'Welcome' },
] as const satisfies readonly { id: TemplateCategory; label: string }[];

export interface TemplateGalleryProps {
  templates: readonly TemplateDefinition[];
  selectedTemplateId?: TemplateId;
  onSelect: (templateId: TemplateId) => void;
  status?: 'loading' | 'ready' | 'error';
  errorMessage?: string;
}

function nextIndex(key: string, current: number, length: number): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  if (key === 'ArrowRight' || key === 'ArrowDown') return (current + 1) % length;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (current - 1 + length) % length;
  return null;
}

export function TemplateGallery({
  templates,
  selectedTemplateId,
  onSelect,
  status = 'ready',
  errorMessage = 'Templates could not be loaded.',
}: TemplateGalleryProps) {
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>(
    selectedTemplate?.category ?? 'newsletter',
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const templateRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filteredTemplates = templates.filter(
    (template) => template.category === activeCategory,
  );
  const categoryHasSelection = filteredTemplates.some(
    (template) => template.id === selectedTemplateId,
  );

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const targetIndex = nextIndex(event.key, index, categories.length);
    if (targetIndex === null) return;
    event.preventDefault();
    setActiveCategory(categories[targetIndex].id);
    tabRefs.current[targetIndex]?.focus();
  }

  function handleTemplateKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const targetIndex = nextIndex(event.key, index, filteredTemplates.length);
    if (targetIndex === null) return;
    event.preventDefault();
    const target = filteredTemplates[targetIndex];
    onSelect(target.id);
    templateRefs.current[targetIndex]?.focus();
  }

  return (
    <section className={styles.gallery} aria-labelledby="templates-heading">
      <header className={styles.header}>
        <h2 id="templates-heading">Templates</h2>
        {status === 'ready' && templates.length > 0 ? (
          <span aria-label={`${templates.length} templates`}>{templates.length}</span>
        ) : null}
      </header>

      {status === 'loading' ? (
        <div className={styles.state} role="status">
          <LoaderCircle className={styles.spinner} aria-hidden="true" size={20} />
          <span>Loading templates</span>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className={styles.state} role="alert">
          <AlertCircle aria-hidden="true" size={20} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {status === 'ready' && templates.length === 0 ? (
        <div className={styles.state} role="status">
          <ImageOff aria-hidden="true" size={20} />
          <span>No templates available</span>
        </div>
      ) : null}

      {status === 'ready' && templates.length > 0 ? (
        <>
          <div className={styles.tabs} role="tablist" aria-label="Template categories">
            {categories.map((category, index) => {
              const isActive = category.id === activeCategory;
              return (
                <button
                  key={category.id}
                  ref={(element) => { tabRefs.current[index] = element; }}
                  type="button"
                  role="tab"
                  id={`template-tab-${category.id}`}
                  aria-selected={isActive}
                  aria-controls={`template-panel-${category.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveCategory(category.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          <div
            className={styles.list}
            id={`template-panel-${activeCategory}`}
            role="tabpanel"
            aria-labelledby={`template-tab-${activeCategory}`}
          >
            <div role="radiogroup" aria-label={`${activeCategory} templates`}>
              {filteredTemplates.map((template, index) => {
                const isSelected = template.id === selectedTemplateId;
                return (
                  <button
                    key={template.id}
                    ref={(element) => { templateRefs.current[index] = element; }}
                    className={styles.template}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected || (!categoryHasSelection && index === 0) ? 0 : -1}
                    onClick={() => onSelect(template.id)}
                    onKeyDown={(event) => handleTemplateKeyDown(event, index)}
                  >
                    <span className={styles.thumbnail}>
                      <img
                        src={`${import.meta.env.BASE_URL}${template.thumbnailPath}`}
                        alt={`${template.name} email template preview`}
                      />
                    </span>
                    <span className={styles.templateText}>
                      <strong>{template.name}</strong>
                      <span>{template.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
