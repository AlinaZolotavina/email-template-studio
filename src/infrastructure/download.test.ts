import { downloadHtml, emailFilename } from './download';

describe('downloadHtml', () => {
  it('downloads the exact HTML with the expected MIME type and filename', async () => {
    const html = '<!doctype html><html><body>Export</body></html>';
    const targetDocument = document.implementation.createHTMLDocument();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    let downloadedBlob: Blob | undefined;
    const createObjectURL = vi.fn((blob: Blob) => {
      downloadedBlob = blob;
      return 'blob:download';
    });
    const revokeObjectURL = vi.fn();

    expect(
      downloadHtml(html, 'newsletter-digest', {
        document: targetDocument,
        url: { createObjectURL, revokeObjectURL },
      }),
    ).toEqual({
      ok: true,
      filename: 'newsletter-digest-email.html',
    });

    expect(downloadedBlob).toBeDefined();
    expect(downloadedBlob?.type).toBe('text/html;charset=utf-8');
    await expect(downloadedBlob?.text()).resolves.toBe(html);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');
    expect(targetDocument.querySelector('a')).toBeNull();
    click.mockRestore();
  });

  it('revokes the object URL and reports failure when clicking throws', () => {
    const targetDocument = document.implementation.createHTMLDocument();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('Download blocked');
    });
    const revokeObjectURL = vi.fn();

    expect(
      downloadHtml('<html></html>', 'welcome-simple', {
        document: targetDocument,
        url: {
          createObjectURL: () => 'blob:failed-download',
          revokeObjectURL,
        },
      }),
    ).toEqual({
      ok: false,
      message: 'Could not download the HTML file. Please try again.',
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:failed-download');
    expect(targetDocument.querySelector('a')).toBeNull();
    click.mockRestore();
  });

  it('sanitizes filenames', () => {
    expect(emailFilename(' Campaign / Summer ')).toBe('campaign-summer-email.html');
    expect(emailFilename('***')).toBe('email-email.html');
  });
});
