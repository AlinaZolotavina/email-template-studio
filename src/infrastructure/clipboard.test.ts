import { copyText, type ClipboardDependencies } from './clipboard';

function dependencies(
  clipboard?: ClipboardDependencies['clipboard'],
  execCommand: (command: string) => boolean = () => false,
): ClipboardDependencies {
  const targetDocument = document.implementation.createHTMLDocument();
  targetDocument.execCommand = execCommand;
  return { clipboard, document: targetDocument };
}

describe('copyText', () => {
  it('uses the Clipboard API when it is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyText('<html>export</html>', dependencies({ writeText }))).resolves.toEqual({
      ok: true,
      method: 'clipboard',
    });
    expect(writeText).toHaveBeenCalledWith('<html>export</html>');
  });

  it('uses a temporary textarea when Clipboard API access fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('Denied'));
    const execCommand = vi.fn(() => true);
    const target = dependencies({ writeText }, execCommand);

    await expect(copyText('fallback html', target)).resolves.toEqual({
      ok: true,
      method: 'fallback',
    });
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(target.document.querySelector('textarea')).toBeNull();
  });

  it('returns a safe error and cleans up when neither method succeeds', async () => {
    const execCommand = vi.fn(() => false);
    const target = dependencies(undefined, execCommand);

    await expect(copyText('uncopied html', target)).resolves.toEqual({
      ok: false,
      message: 'Could not copy HTML. Select the generated code and copy it manually.',
    });
    expect(target.document.querySelector('textarea')).toBeNull();
  });
});
