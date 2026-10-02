import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import type { RenderResult } from '../../../email/types';
import { PREVIEW_DIMENSIONS } from '../previewDimensions';
import type { PreviewViewport } from '../previewSlice';
import { formatHtml } from '../formatHtml';
import { PreviewWorkspace } from './PreviewWorkspace';

const previewResult: RenderResult = {
  html: '<!doctype html><html><body><img src="blob:local-logo">Preview</body></html>',
  warnings: [],
  errors: [],
};

const exportResult: RenderResult = {
  html: '<!doctype html><html><body><img src="https://example.com/logo.png">Export</body></html>',
  warnings: [],
  errors: [],
};

function StatefulWorkspace() {
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');
  return (
    <PreviewWorkspace
      canExport
      exportResult={exportResult}
      exportBlockReasons={[]}
      onViewportChange={setViewport}
      previewResult={previewResult}
      templateId="newsletter-digest"
      viewport={viewport}
    />
  );
}

describe('PreviewWorkspace', () => {
  it('isolates preview HTML and shows export HTML in a read-only code view', () => {
    render(<StatefulWorkspace />);

    const frame = screen.getByTitle('Email preview');
    expect(frame).toHaveAttribute('sandbox', 'allow-same-origin');
    expect(frame).toHaveAttribute('scrolling', 'no');
    expect(frame).toHaveAttribute('srcdoc', previewResult.html);
    expect(frame).toHaveAttribute('width', String(PREVIEW_DIMENSIONS.desktop.width));
    expect(frame).toHaveAttribute('height', String(PREVIEW_DIMENSIONS.desktop.height));

    const code = screen.getByLabelText<HTMLTextAreaElement>('Generated HTML');
    expect(code).toHaveValue(formatHtml(exportResult.html));
    expect(code).toHaveAttribute('readonly');
    expect(code.value).not.toContain('blob:');
  });

  it('changes only fixed viewport dimensions when tabs change', () => {
    render(<StatefulWorkspace />);
    const originalSrcDoc = screen.getByTitle('Email preview').getAttribute('srcdoc');
    const originalCode =
      screen.getByLabelText<HTMLTextAreaElement>('Generated HTML').value;

    fireEvent.click(screen.getByRole('tab', { name: 'Mobile' }));

    const frame = screen.getByTitle('Email preview');
    expect(frame).toHaveAttribute('width', String(PREVIEW_DIMENSIONS.mobile.width));
    expect(frame).toHaveAttribute('height', String(PREVIEW_DIMENSIONS.mobile.height));
    expect(frame).toHaveAttribute('srcdoc', originalSrcDoc);
    expect(screen.getByLabelText('Generated HTML')).toHaveValue(originalCode);
  });

  it('changes the preview scale without changing the rendered HTML', () => {
    render(<StatefulWorkspace />);
    const frame = screen.getByTitle('Email preview');
    const originalSrcDoc = frame.getAttribute('srcdoc');

    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));

    expect(screen.getByLabelText('Preview zoom level')).toHaveTextContent('70%');
    expect(frame).toHaveStyle({ transform: 'scale(0.7)' });
    expect(frame).toHaveAttribute('srcdoc', originalSrcDoc);

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(screen.getByLabelText('Preview zoom level')).toHaveTextContent('80%');
    expect(frame).toHaveStyle({ transform: 'scale(0.8)' });
  });

  it('supports arrow-key navigation across viewport tabs', () => {
    render(<StatefulWorkspace />);
    const desktop = screen.getByRole('tab', { name: 'Desktop' });
    desktop.focus();

    fireEvent.keyDown(desktop, { key: 'ArrowRight' });

    expect(screen.getByRole('tab', { name: 'Mobile' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Mobile' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('renders loading and renderer error fallbacks', () => {
    const { rerender } = render(
      <PreviewWorkspace
        canExport
        exportResult={exportResult}
        exportBlockReasons={[]}
        onViewportChange={vi.fn()}
        previewResult={previewResult}
        templateId="newsletter-digest"
        status="loading"
        viewport="desktop"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Rendering email preview');

    rerender(
      <PreviewWorkspace
        canExport
        exportResult={exportResult}
        exportBlockReasons={[]}
        onViewportChange={vi.fn()}
        previewResult={{
          html: '',
          warnings: [],
          errors: [{ code: 'render_failed', message: 'Renderer exploded.' }],
        }}
        templateId="newsletter-digest"
        viewport="desktop"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email preview could not be rendered',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Renderer exploded.');
    expect(screen.queryByTitle('Email preview')).not.toBeInTheDocument();
  });

  it('copies and downloads exactly the HTML shown in the code view', async () => {
    const copyService = vi.fn().mockResolvedValue({
      ok: true,
      method: 'clipboard',
    });
    const downloadService = vi.fn(() => ({
      ok: true as const,
      filename: 'newsletter-digest-email.html',
    }));
    render(
      <PreviewWorkspace
        canExport
        copyService={copyService}
        downloadService={downloadService}
        exportBlockReasons={[]}
        exportResult={exportResult}
        onViewportChange={vi.fn()}
        previewResult={previewResult}
        templateId="newsletter-digest"
        viewport="desktop"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy HTML' }));
    expect(copyService).toHaveBeenCalledWith(formatHtml(exportResult.html));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'HTML copied to clipboard.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Download .html' }));
    expect(downloadService).toHaveBeenCalledWith(
      formatHtml(exportResult.html),
      'newsletter-digest',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Download started: newsletter-digest-email.html',
    );
  });

  it('disables export actions with an accessible explanation', () => {
    render(
      <PreviewWorkspace
        canExport={false}
        exportBlockReasons={['Add a valid public image URL before exporting.']}
        exportResult={exportResult}
        onViewportChange={vi.fn()}
        previewResult={previewResult}
        templateId="newsletter-digest"
        viewport="desktop"
      />,
    );

    expect(screen.getByRole('button', { name: 'Copy HTML' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download .html' })).toBeDisabled();
    expect(screen.getByText('Export unavailable')).toBeVisible();
    expect(
      screen.getByText('Add a valid public image URL before exporting.'),
    ).toBeVisible();
  });

  it('shows image warnings without disabling export actions', () => {
    render(
      <PreviewWorkspace
        canExport
        exportBlockReasons={[]}
        exportResult={exportResult}
        exportWarnings={['Replace local images with public URLs.']}
        onViewportChange={vi.fn()}
        previewResult={previewResult}
        templateId="newsletter-digest"
        viewport="desktop"
      />,
    );

    expect(screen.getByText('Check image URLs')).toBeVisible();
    expect(screen.getByText('Replace local images with public URLs.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Copy HTML' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Download .html' })).toBeEnabled();
  });

  it('announces copy errors', async () => {
    render(
      <PreviewWorkspace
        canExport
        copyService={vi.fn().mockResolvedValue({
          ok: false,
          message: 'Clipboard permission was denied.',
        })}
        exportBlockReasons={[]}
        exportResult={exportResult}
        onViewportChange={vi.fn()}
        previewResult={previewResult}
        templateId="newsletter-digest"
        viewport="desktop"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy HTML' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Clipboard permission was denied.',
    );
  });
});
