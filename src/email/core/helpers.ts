import type { EmailFontFamily, ImageValue, RenderContext } from '../types';
import { escapeAttribute, escapeText, joinHtml, trustedHtml, type EmailHtml } from './html';
import { serializeInlineStyle, type EmailStyle } from './styles';
import { assertEmailUrl, assertHexColor } from './validators';

function numeric(value: number, name: string): string {
  if (!Number.isInteger(value) || value < 0 || value > 2000) {
    throw new TypeError(`${name} must be an integer between 0 and 2000.`);
  }
  return String(value);
}

function styleAttribute(style?: EmailStyle): string {
  const value = serializeInlineStyle(style);
  return value ? ` style="${escapeAttribute(value)}"` : '';
}

export interface TableOptions {
  children: EmailHtml;
  width?: number | '100%';
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: EmailStyle;
}

export function presentationTable(options: TableOptions): EmailHtml {
  const width = options.width ?? '100%';
  const widthAttribute = width === '100%' ? '100%' : numeric(width, 'width');
  const align = options.align ? ` align="${options.align}"` : '';
  const className = options.className ? ` class="${escapeAttribute(options.className)}"` : '';
  return trustedHtml(
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${widthAttribute}"${align}${className}${styleAttribute(options.style)}><tbody>${options.children}</tbody></table>`,
  );
}

export interface CellOptions {
  children: EmailHtml;
  align?: 'left' | 'center' | 'right';
  className?: string;
  colspan?: number;
  style?: EmailStyle;
  valign?: 'top' | 'middle' | 'bottom';
}

export function tableCell(options: CellOptions): EmailHtml {
  const align = options.align ? ` align="${options.align}"` : '';
  const valign = options.valign ? ` valign="${options.valign}"` : '';
  const colspan =
    options.colspan === undefined ? '' : ` colspan="${numeric(options.colspan, 'colspan')}"`;
  const className = options.className ? ` class="${escapeAttribute(options.className)}"` : '';
  return trustedHtml(
    `<tr><td${align}${valign}${colspan}${className}${styleAttribute(options.style)}>${options.children}</td></tr>`,
  );
}

export function tableDataCell(options: CellOptions): EmailHtml {
  const align = options.align ? ` align="${options.align}"` : '';
  const valign = options.valign ? ` valign="${options.valign}"` : '';
  const colspan =
    options.colspan === undefined ? '' : ` colspan="${numeric(options.colspan, 'colspan')}"`;
  const className = options.className ? ` class="${escapeAttribute(options.className)}"` : '';
  return trustedHtml(
    `<td${align}${valign}${colspan}${className}${styleAttribute(options.style)}>${options.children}</td>`,
  );
}

export function tableRow(children: EmailHtml): EmailHtml {
  return trustedHtml(`<tr>${children}</tr>`);
}

export interface TextOptions {
  text: string;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'span';
  style?: EmailStyle;
}

export function emailText(options: TextOptions): EmailHtml {
  const tag = options.tag ?? 'p';
  return trustedHtml(
    `<${tag}${styleAttribute(options.style)}>${escapeText(options.text)}</${tag}>`,
  );
}

export interface LinkOptions {
  label: string;
  url: string;
  style?: EmailStyle;
}

export function emailLink(options: LinkOptions): EmailHtml {
  const url = escapeAttribute(assertEmailUrl(options.url, 'link'));
  return trustedHtml(
    `<a href="${url}" target="_blank"${styleAttribute(options.style)}>${escapeText(options.label)}</a>`,
  );
}

export interface ImageOptions {
  value: ImageValue;
  context: RenderContext;
  width: number;
  height?: number;
  className?: string;
  style?: EmailStyle;
}

export function emailImage(options: ImageOptions): EmailHtml {
  const resolved = options.context.resolveImageSource(options.value);
  const source = assertEmailUrl(resolved, 'image', options.context.mode);
  const height =
    options.height === undefined ? '' : ` height="${numeric(options.height, 'height')}"`;
  const className = options.className ? ` class="${escapeAttribute(options.className)}"` : '';
  return trustedHtml(
    `<img src="${escapeAttribute(source)}" width="${numeric(options.width, 'width')}"${height} alt="${escapeAttribute(options.value.alt)}" border="0"${className}${styleAttribute({ display: 'block', maxWidth: options.width, width: '100%', ...options.style })}>`,
  );
}

export function spacer(height: number): EmailHtml {
  const safeHeight = numeric(height, 'height');
  return trustedHtml(
    `<tr><td height="${safeHeight}" aria-hidden="true" style="font-size:0;line-height:${safeHeight}px;height:${safeHeight}px">&nbsp;</td></tr>`,
  );
}

export interface BulletproofButtonOptions {
  label: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: EmailFontFamily;
  fontSize?: number;
  lineHeight?: number;
  horizontalPadding?: number;
  borderRadius?: number;
  align?: 'left' | 'center' | 'right';
}

export function bulletproofButton(options: BulletproofButtonOptions): EmailHtml {
  const url = escapeAttribute(assertEmailUrl(options.url, 'link'));
  const background = assertHexColor(options.backgroundColor, 'backgroundColor');
  const color = assertHexColor(options.textColor, 'textColor');
  const fontSize = numeric(options.fontSize ?? 16, 'fontSize');
  const lineHeight = numeric(options.lineHeight ?? 48, 'lineHeight');
  const padding = numeric(options.horizontalPadding ?? 24, 'horizontalPadding');
  const radius = numeric(options.borderRadius ?? 4, 'borderRadius');
  const label = escapeText(options.label);
  const font = escapeAttribute(options.fontFamily);
  const align = options.align ?? 'center';
  const vmlWidth = Math.max(120, options.label.length * Number(fontSize) + Number(padding) * 2);

  return trustedHtml(
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="${align}"><tbody><tr><td align="${align}" bgcolor="${background}" style="border-radius:${radius}px;background-color:${background}"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:${lineHeight}px;v-text-anchor:middle;width:${vmlWidth}px" arcsize="10%" stroke="f" fillcolor="${background}"><w:anchorlock/><center style="color:${color};font-family:${font};font-size:${fontSize}px;font-weight:bold"><![endif]--><a href="${url}" target="_blank" style="background-color:${background};border-radius:${radius}px;color:${color};display:inline-block;font-family:${font};font-size:${fontSize}px;font-weight:bold;line-height:${lineHeight}px;padding:0 ${padding}px;text-align:center;text-decoration:none;mso-hide:all">${label}</a><!--[if mso]></center></v:roundrect><![endif]--></td></tr></tbody></table>`,
  );
}

export { joinHtml };
