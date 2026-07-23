import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import type { RenderResult } from '../../../email/types';
import { PREVIEW_DIMENSIONS } from '../previewDimensions';
import type { PreviewViewport } from '../previewSlice';
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
      exportResult={exportResult}
      onViewportChange={setViewport}
      previewResult={previewResult}
      viewport={viewport}
    />
  );
}

describe('PreviewWorkspace', () => {
  it('isolates preview HTML and shows export HTML in a read-only code view', () => {
    render(<StatefulWorkspace />);

    const frame = screen.getByTitle('Email preview');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame).toHaveAttribute('srcdoc', previewResult.html);
    expect(frame).toHaveAttribute('width', String(PREVIEW_DIMENSIONS.desktop.width));
    expect(frame).toHaveAttribute('height', String(PREVIEW_DIMENSIONS.desktop.height));

    const code = screen.getByLabelText<HTMLTextAreaElement>('Generated HTML');
    expect(code).toHaveValue(exportResult.html);
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
        exportResult={exportResult}
        onViewportChange={vi.fn()}
        previewResult={previewResult}
        status="loading"
        viewport="desktop"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Rendering email preview');

    rerender(
      <PreviewWorkspace
        exportResult={exportResult}
        onViewportChange={vi.fn()}
        previewResult={{
          html: '',
          warnings: [],
          errors: [{ code: 'render_failed', message: 'Renderer exploded.' }],
        }}
        viewport="desktop"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email preview could not be rendered',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Renderer exploded.');
    expect(screen.queryByTitle('Email preview')).not.toBeInTheDocument();
  });
});
