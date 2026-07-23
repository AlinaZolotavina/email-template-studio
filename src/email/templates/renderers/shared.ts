import { emailDraftSchema } from '../../schemas';
import type {
  EmailDraft,
  EmailFieldValue,
  ImageValue,
  LinkValue,
  RenderContext,
  RenderError,
  RenderResult,
  RenderWarning,
  TemplateManifest,
} from '../../types';
import {
  bulletproofButton,
  emailDocument,
  emailImage,
  emailLink,
  emailText,
  joinHtml,
  presentationTable,
  tableDataCell,
  tableRow,
  tableCell,
  validateEmailUrl,
  type EmailHtml,
} from '../../core';

export interface RenderSession {
  readonly draft: EmailDraft;
  readonly context: RenderContext;
  readonly errors: RenderError[];
  readonly warnings: RenderWarning[];
  string(key: string): string;
  boolean(key: string): boolean;
  link(key: string): LinkValue;
  image(key: string): ImageValue;
  optionalImage(key: string, width: number, height?: number): EmailHtml | null;
  textLink(key: string, value: LinkValue, color?: string, fontSize?: number): EmailHtml | null;
  button(key: string, value: LinkValue): EmailHtml | null;
}

type BodyRenderer = (session: RenderSession) => EmailHtml;

function isObject(value: EmailFieldValue | undefined): value is LinkValue | ImageValue {
  return typeof value === 'object' && value !== null;
}

function fieldError(errors: RenderError[], key: string, expected: string): void {
  errors.push({
    code: 'invalid_field_type',
    message: `Field "${key}" must be ${expected}.`,
    fieldKey: key,
  });
}

function createSession(draft: EmailDraft, context: RenderContext): RenderSession {
  const errors: RenderError[] = [];
  const warnings: RenderWarning[] = [];

  const string = (key: string): string => {
    const value = draft.fields[key];
    if (typeof value === 'string') return value;
    fieldError(errors, key, 'a string');
    return '';
  };

  const boolean = (key: string): boolean => {
    const value = draft.fields[key];
    if (typeof value === 'boolean') return value;
    fieldError(errors, key, 'a boolean');
    return false;
  };

  const link = (key: string): LinkValue => {
    const value = draft.fields[key];
    if (isObject(value) && 'label' in value && 'url' in value) return value;
    fieldError(errors, key, 'a link');
    return { label: '', url: '' };
  };

  const image = (key: string): ImageValue => {
    const value = draft.fields[key];
    if (isObject(value) && 'remoteUrl' in value && 'alt' in value) return value;
    fieldError(errors, key, 'an image');
    return { remoteUrl: '', alt: '' };
  };

  const optionalImage = (key: string, width: number, height?: number): EmailHtml | null => {
    const value = image(key);
    let source: string;
    try {
      source = context.resolveImageSource(value).trim();
    } catch {
      errors.push({
        code: 'image_resolution_failed',
        message: `Image source for "${key}" could not be resolved.`,
        fieldKey: key,
      });
      return null;
    }
    if (source === '') return null;

    const validation = validateEmailUrl(source, 'image', context.mode);
    if (!validation.valid) {
      warnings.push({
        code: 'invalid_image_url',
        message: `Image "${key}" was omitted: ${validation.reason ?? 'invalid URL'}`,
        fieldKey: key,
      });
      return null;
    }

    return emailImage({
      value,
      context,
      width,
      height,
      className: 'fluid-image',
      style: { display: 'block', width: '100%', maxWidth: width },
    });
  };

  const textLink = (
    key: string,
    value: LinkValue,
    color?: string,
    fontSize = 15,
  ): EmailHtml | null => {
    const validation = validateEmailUrl(value.url, 'link');
    if (!validation.valid) {
      errors.push({
        code: 'invalid_link_url',
        message: `Link "${key}" is invalid: ${validation.reason ?? 'invalid URL'}`,
        fieldKey: key,
      });
      return null;
    }
    return emailLink({
      label: value.label,
      url: value.url,
      style: {
        color: color ?? draft.theme.accentColor,
        fontFamily: draft.theme.fontFamily,
        fontSize,
        fontWeight: 600,
        textDecoration: 'underline',
      },
    });
  };

  const button = (key: string, value: LinkValue): EmailHtml | null => {
    const validation = validateEmailUrl(value.url, 'link');
    if (!validation.valid) {
      errors.push({
        code: 'invalid_button_url',
        message: `Button "${key}" is invalid: ${validation.reason ?? 'invalid URL'}`,
        fieldKey: key,
      });
      return null;
    }
    if (value.label.trim() === '') {
      errors.push({
        code: 'empty_button_label',
        message: `Button "${key}" must have a label.`,
        fieldKey: key,
      });
      return null;
    }
    return bulletproofButton({
      label: value.label,
      url: value.url,
      backgroundColor: draft.theme.accentColor,
      textColor: draft.theme.buttonTextColor,
      fontFamily: draft.theme.fontFamily,
      borderRadius: 6,
    });
  };

  return {
    draft,
    context,
    errors,
    warnings,
    string,
    boolean,
    link,
    image,
    optionalImage,
    textLink,
    button,
  };
}

export function createTemplateRenderer(
  manifest: TemplateManifest,
  titleField: string,
  bodyRenderer: BodyRenderer,
): (draft: EmailDraft, context: RenderContext) => RenderResult {
  return (draft, context) => {
    const parsed = emailDraftSchema.safeParse(draft);
    if (!parsed.success) {
      return {
        html: '',
        warnings: [],
        errors: [
          {
            code: 'invalid_draft',
            message: `Draft for "${manifest.id}" is invalid: ${parsed.error.issues[0]?.message ?? 'unknown schema error'}`,
          },
        ],
      };
    }
    if (parsed.data.templateId !== manifest.id) {
      return {
        html: '',
        warnings: [],
        errors: [
          {
            code: 'template_mismatch',
            message: `Renderer "${manifest.id}" cannot render draft "${parsed.data.templateId}".`,
          },
        ],
      };
    }

    const session = createSession(parsed.data, context);
    try {
      const body = bodyRenderer(session);
      const html = emailDocument({
        body,
        title: session.string(titleField),
        preheader: session.string('preheader'),
        backgroundColor: parsed.data.theme.backgroundColor,
        contentWidth: parsed.data.theme.contentWidth,
      });
      return { html, warnings: session.warnings, errors: session.errors };
    } catch (error) {
      return {
        html: '',
        warnings: session.warnings,
        errors: [
          ...session.errors,
          {
            code: 'render_failed',
            message: `Template "${manifest.id}" could not be rendered: ${error instanceof Error ? error.message : 'unknown error'}`,
          },
        ],
      };
    }
  };
}

export function contentTable(session: RenderSession, children: EmailHtml): EmailHtml {
  return presentationTable({
    width: session.draft.theme.contentWidth,
    align: 'center',
    className: 'email-container',
    style: { backgroundColor: session.draft.theme.surfaceColor },
    children,
  });
}

export function logoRow(session: RenderSession): EmailHtml | null {
  const logo = session.optionalImage('logo', 120, 40);
  if (logo === null) return null;
  return tableCell({
    children: logo,
    align: 'center',
    style: { padding: [28, 32, 16, 32], backgroundColor: session.draft.theme.surfaceColor },
  });
}

export function brandRow(session: RenderSession, fallbackMark: string): EmailHtml {
  const logo = session.optionalImage('logo', 120, 40);
  return tableCell({
    children:
      logo ??
      emailText({
        text: fallbackMark,
        tag: 'p',
        style: {
          color: session.draft.theme.accentColor,
          fontFamily: session.draft.theme.fontFamily,
          fontSize: 26,
          fontWeight: 700,
          lineHeight: 32,
          margin: 0,
          textAlign: 'center',
        },
      }),
    align: 'center',
    style: {
      padding: [28, 32, 16, 32],
      backgroundColor: session.draft.theme.surfaceColor,
    },
  });
}

export function linksRow(
  session: RenderSession,
  keys: string[],
  fontSize = 11,
): EmailHtml | null {
  const cells = keys
    .map((key) => {
      const link = session.textLink(
        key,
        session.link(key),
        session.draft.theme.mutedTextColor,
        fontSize,
      );
      return link === null
        ? null
        : tableDataCell({
            children: link,
            align: 'center',
            style: { padding: [0, 7] },
          });
    })
    .filter((value): value is EmailHtml => value !== null);
  if (cells.length === 0) return null;
  return tableCell({
    children: presentationTable({
      align: 'center',
      children: tableRow(joinHtml(cells)),
    }),
    align: 'center',
    style: { padding: [8, 24, 0, 24] },
  });
}

export function headingRow(session: RenderSession, text: string): EmailHtml {
  return tableCell({
    children: emailText({
      text,
      tag: 'h1',
      style: {
        color: session.draft.theme.textColor,
        fontFamily: session.draft.theme.fontFamily,
        fontSize: 32,
        fontWeight: 700,
        lineHeight: 40,
        margin: 0,
        overflowWrap: 'break-word',
      },
    }),
    style: { padding: [16, 40, 12, 40], backgroundColor: session.draft.theme.surfaceColor },
  });
}

export function paragraphRow(session: RenderSession, text: string): EmailHtml {
  return tableCell({
    children: emailText({
      text,
      style: {
        color: session.draft.theme.mutedTextColor,
        fontFamily: session.draft.theme.fontFamily,
        fontSize: 17,
        lineHeight: 27,
        margin: 0,
        overflowWrap: 'break-word',
      },
    }),
    style: { padding: [0, 40, 24, 40], backgroundColor: session.draft.theme.surfaceColor },
  });
}

export function ctaRow(session: RenderSession, key = 'primaryCta'): EmailHtml | null {
  const button = session.button(key, session.link(key));
  if (button === null) return null;
  return tableCell({
    children: button,
    align: 'center',
    style: { padding: [8, 40, 32, 40], backgroundColor: session.draft.theme.surfaceColor },
  });
}

export function footerRow(
  session: RenderSession,
  text: string,
  link?: { key: string; label: string; url: string },
): EmailHtml {
  const footerLink = link
    ? session.textLink(link.key, { label: link.label, url: link.url }, session.draft.theme.mutedTextColor)
    : null;
  return tableCell({
    children: joinHtml([
      emailText({
        text,
        style: {
          color: session.draft.theme.mutedTextColor,
          fontFamily: session.draft.theme.fontFamily,
          fontSize: 13,
          lineHeight: 20,
          margin: [0, 0, 8, 0],
          textAlign: 'center',
        },
      }),
      footerLink,
    ]),
    align: 'center',
    style: { padding: [24, 40, 28, 40], backgroundColor: session.draft.theme.backgroundColor },
  });
}
