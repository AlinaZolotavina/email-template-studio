import { escapeAttribute, escapeText, trustedHtml, type EmailHtml } from './html';
import { assertHexColor } from './validators';

export interface EmailDocumentOptions {
  body: EmailHtml;
  title: string;
  preheader: string;
  backgroundColor: string;
  contentWidth: number;
  lang?: string;
}

const RESET_STYLES = `html,body{margin:0!important;padding:0!important;width:100%!important;height:100%!important}*{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}table,td{mso-table-lspace:0pt!important;mso-table-rspace:0pt!important;border-collapse:collapse!important}img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}a{text-decoration:none}@media screen and (max-width:620px){.email-container{width:100%!important;max-width:100%!important}.mobile-padding{padding-left:20px!important;padding-right:20px!important}.fluid-image{height:auto!important;max-width:100%!important;width:100%!important}}`;

export function emailDocument(options: EmailDocumentOptions): string {
  if (
    !Number.isInteger(options.contentWidth) ||
    options.contentWidth < 320 ||
    options.contentWidth > 800
  ) {
    throw new TypeError('contentWidth must be an integer between 320 and 800.');
  }
  const background = assertHexColor(options.backgroundColor, 'backgroundColor');
  const lang = escapeAttribute(options.lang ?? 'en');
  const title = escapeText(options.title);
  const preheader = escapeText(options.preheader);
  const body = trustedHtml(
    `<div style="display:none;font-size:1px;color:${background};line-height:1px;font-family:Arial,sans-serif;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all" aria-hidden="true">${preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>${options.body}`,
  );

  return `<!doctype html><html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"><title>${title}</title><!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]--><style>${RESET_STYLES}</style></head><body width="100%" style="margin:0;padding:0!important;background-color:${background}"><center role="article" aria-roledescription="email" lang="${lang}" style="width:100%;background-color:${background}"><div class="email-container" style="max-width:${options.contentWidth}px;margin:0 auto">${body}</div></center></body></html>`;
}
