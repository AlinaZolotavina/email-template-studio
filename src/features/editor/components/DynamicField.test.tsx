import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import type { EmailFieldValue, TemplateField } from '../../../email/types';
import { MAX_IMAGE_BYTES } from '../fieldValidation';
import { DynamicField } from './DynamicField';

function renderField(field: TemplateField, value: Parameters<typeof DynamicField>[0]['value']) {
  const onChange = vi.fn();
  const onImageFile = vi.fn();
  const onRemoveLocalImage = vi.fn();
  function Harness() {
    const [currentValue, setCurrentValue] = useState<EmailFieldValue>(value);
    const handleChange = (nextValue: EmailFieldValue) => {
      setCurrentValue(nextValue);
      onChange(nextValue);
    };
    return (
      <DynamicField
        field={field}
        value={currentValue}
        onChange={handleChange}
        onImageFile={onImageFile}
        onRemoveLocalImage={onRemoveLocalImage}
      />
    );
  }
  render(
    <Harness />,
  );
  return { onChange, onImageFile, onRemoveLocalImage };
}

describe('DynamicField', () => {
  it.each([
    [{ key: 'title', type: 'text', label: 'Title', group: 'content', maxLength: 20 }, 'Old', 'New'],
    [{ key: 'body', type: 'textarea', label: 'Body', group: 'content', maxLength: 40 }, 'Old', 'New'],
    [{ key: 'site', type: 'url', label: 'Website', group: 'footer' }, 'https://old.test', 'https://new.test'],
  ] satisfies [TemplateField, string, string][])(
    'updates the $type field',
    async (field, value, nextValue) => {
      const user = userEvent.setup();
      const { onChange } = renderField(field, value);
      const control = screen.getByLabelText(field.label);
      await user.clear(control);
      await user.type(control, nextValue);
      expect(onChange).toHaveBeenLastCalledWith(nextValue);
    },
  );

  it('keeps invalid color text local and emits only valid HEX', async () => {
    const user = userEvent.setup();
    const field = { key: 'accent', type: 'color', label: 'Accent', group: 'brand', themeKey: 'accentColor' } as const;
    const { onChange } = renderField(field, '#2563EB');
    const input = screen.getByLabelText('Accent');

    await user.clear(input);
    await user.type(input, '#12');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('six-digit HEX');

    await user.clear(input);
    await user.type(input, '#abcdef');
    expect(onChange).toHaveBeenLastCalledWith('#ABCDEF');
  });

  it('updates link label and URL without losing its sibling value', async () => {
    const user = userEvent.setup();
    const field = { key: 'cta', type: 'link', label: 'CTA', group: 'buttons' } as const;
    const { onChange } = renderField(field, { label: 'Open', url: 'https://example.com' });
    await user.clear(screen.getByLabelText('Label'));
    expect(onChange).toHaveBeenLastCalledWith({ label: '', url: 'https://example.com' });
    await user.type(screen.getByLabelText('Label'), 'Go');
    expect(onChange).toHaveBeenLastCalledWith({ label: 'Go', url: 'https://example.com' });
  });

  it('updates a toggle', async () => {
    const user = userEvent.setup();
    const field = { key: 'show', type: 'toggle', label: 'Show section', group: 'content' } as const;
    const { onChange } = renderField(field, true);
    await user.click(screen.getByRole('checkbox', { name: 'Show section' }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('validates image MIME and size before accepting a local preview', () => {
    const field = { key: 'logo', type: 'image', label: 'Logo', group: 'brand', recommendedSize: '240 x 80 px' } as const;
    const { onImageFile } = renderField(field, { remoteUrl: '', alt: 'Logo' });
    const input = screen.getByLabelText('Local preview');

    fireEvent.change(input, {
      target: { files: [new File(['text'], 'logo.svg', { type: 'image/svg+xml' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('PNG, JPEG, WebP, or GIF');
    expect(onImageFile).not.toHaveBeenCalled();

    const oversized = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'huge.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(screen.getByRole('alert')).toHaveTextContent('5 MB or smaller');
    expect(onImageFile).not.toHaveBeenCalled();

    const valid = new File(['png'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [valid] } });
    expect(onImageFile).toHaveBeenCalledWith(valid);
  });
});
