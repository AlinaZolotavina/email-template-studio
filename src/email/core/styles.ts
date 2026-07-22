import type { EmailFontFamily } from '../types';
import { assertHexColor } from './validators';

export type Spacing =
  number | readonly [number, number] | readonly [number, number, number, number];

export interface EmailStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'none';
  borderWidth?: number;
  color?: string;
  display?: 'block' | 'inline-block' | 'none';
  fontFamily?: EmailFontFamily;
  fontSize?: number;
  fontWeight?: 400 | 600 | 700 | 'bold' | 'normal';
  height?: number;
  lineHeight?: number;
  margin?: Spacing;
  maxWidth?: number;
  msoLineHeightRule?: 'exactly' | 'at-least';
  msoPaddingAlt?: Spacing;
  overflowWrap?: 'normal' | 'break-word';
  padding?: Spacing;
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: 'none' | 'underline';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  width?: number | '100%';
}

function safeNumber(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 2000) {
    throw new TypeError(`${name} must be a finite number between 0 and 2000.`);
  }
  return value;
}

function spacing(value: Spacing, name: string): string {
  const values = typeof value === 'number' ? [value] : value;
  return values.map((item) => `${safeNumber(item, name)}px`).join(' ');
}

export function serializeInlineStyle(style: EmailStyle = {}): string {
  const declarations: string[] = [];
  const add = (property: string, value: string | number | undefined) => {
    if (value !== undefined) declarations.push(`${property}:${value}`);
  };

  if (style.backgroundColor) add('background-color', assertHexColor(style.backgroundColor));
  if (style.borderColor) add('border-color', assertHexColor(style.borderColor));
  if (style.borderRadius !== undefined)
    add('border-radius', `${safeNumber(style.borderRadius, 'borderRadius')}px`);
  add('border-style', style.borderStyle);
  if (style.borderWidth !== undefined)
    add('border-width', `${safeNumber(style.borderWidth, 'borderWidth')}px`);
  if (style.color) add('color', assertHexColor(style.color));
  add('display', style.display);
  add('font-family', style.fontFamily);
  if (style.fontSize !== undefined) add('font-size', `${safeNumber(style.fontSize, 'fontSize')}px`);
  add('font-weight', style.fontWeight);
  if (style.height !== undefined) add('height', `${safeNumber(style.height, 'height')}px`);
  if (style.lineHeight !== undefined)
    add('line-height', `${safeNumber(style.lineHeight, 'lineHeight')}px`);
  if (style.margin !== undefined) add('margin', spacing(style.margin, 'margin'));
  if (style.maxWidth !== undefined) add('max-width', `${safeNumber(style.maxWidth, 'maxWidth')}px`);
  add('mso-line-height-rule', style.msoLineHeightRule);
  if (style.msoPaddingAlt !== undefined)
    add('mso-padding-alt', spacing(style.msoPaddingAlt, 'msoPaddingAlt'));
  add('overflow-wrap', style.overflowWrap);
  if (style.padding !== undefined) add('padding', spacing(style.padding, 'padding'));
  add('text-align', style.textAlign);
  add('text-decoration', style.textDecoration);
  add('vertical-align', style.verticalAlign);
  if (style.width !== undefined)
    add('width', style.width === '100%' ? style.width : `${safeNumber(style.width, 'width')}px`);
  return declarations.join(';');
}
