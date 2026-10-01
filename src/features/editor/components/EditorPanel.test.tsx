import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { App } from '../../../app/App';
import { createAppStore } from '../../../app/store';
import type { LocalAssetsManager } from '../../../infrastructure/localAssets';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

function createAssetsMock(): LocalAssetsManager {
  return {
    attach: vi.fn(() => Promise.resolve('blob:local-logo')),
    release: vi.fn(),
    releaseTemplate: vi.fn(),
    releaseAll: vi.fn(),
  };
}

function renderEditor() {
  const store = createAppStore();
  const localAssets = createAssetsMock();
  const result = render(
    <Provider store={store}>
      <App localAssets={localAssets} />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('radio', { name: /Weekly digest/ }));
  return { ...result, store, localAssets };
}

function containsBinary(value: unknown): boolean {
  if (value instanceof Blob) return true;
  if (Array.isArray(value)) return value.some(containsBinary);
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).some(containsBinary);
}

async function expandSection(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: `Expand ${name}` }));
}

describe('EditorPanel integration', () => {
  it('dispatches text, textarea, color, URL, link, and toggle edits', async () => {
    const user = userEvent.setup();
    const { store } = renderEditor();

    const heading = screen.getByLabelText('Heading');
    await user.clear(heading);
    await user.type(heading, 'Edited heading');

    const intro = screen.getByLabelText('Introduction');
    await user.clear(intro);
    await user.type(intro, 'Edited intro');

    await expandSection(user, 'Article 1');
    const articleLink = screen.getByRole('group', { name: 'Article 1 link' });
    const label = articleLink.querySelector<HTMLInputElement>('input[id$="-label"]');
    expect(label).not.toBeNull();
    await user.clear(label!);
    await user.type(label!, 'Explore');

    await expandSection(user, 'Appearance');
    const color = screen.getByLabelText('Page background');
    await user.clear(color);
    await user.type(color, '#123456');

    await expandSection(user, 'Footer');
    await user.click(screen.getByRole('checkbox', { name: 'Show article images' }));

    const preferences = screen.getByRole('group', { name: 'Preferences link' });
    await user.clear(within(preferences).getByLabelText('Label'));
    await user.type(within(preferences).getByLabelText('Label'), 'Email settings');
    await user.clear(within(preferences).getByLabelText('URL'));
    await user.type(within(preferences).getByLabelText('URL'), 'https://company.test/preferences');

    const draft = store.getState().editor.draftsByTemplateId['newsletter-digest'];
    expect(draft?.fields.heading).toBe('Edited heading');
    expect(draft?.fields.intro).toBe('Edited intro');
    expect(draft?.fields.article1Link).toEqual({ label: 'Explore', url: 'https://example.com/article-1' });
    expect(draft?.theme.backgroundColor).toBe('#123456');
    expect(draft?.fields.showArticleImages).toBe(false);
    expect(draft?.fields.preferencesLink).toEqual({
      label: 'Email settings',
      url: 'https://company.test/preferences',
    });
  }, 20_000);

  it('keeps invalid color out of Redux', async () => {
    const user = userEvent.setup();
    const { store } = renderEditor();
    await expandSection(user, 'Appearance');
    const color = screen.getByLabelText('Page background');
    await user.clear(color);
    await user.type(color, '#12');
    expect(store.getState().editor.draftsByTemplateId['newsletter-digest']?.theme.backgroundColor).toBe('#F3F4F6');
  });

  it('creates local preview without storing File and preserves it across template switches', async () => {
    const user = userEvent.setup();
    const { store, localAssets } = renderEditor();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    await user.upload(within(screen.getByRole('group', { name: 'Logo' })).getByLabelText('Local preview'), file);

    const logo = store.getState().editor.draftsByTemplateId['newsletter-digest']?.fields.logo;
    expect(localAssets.attach).toHaveBeenCalledWith('newsletter-digest', 'logo', file);
    expect(logo).toEqual({ remoteUrl: '', alt: 'Weekly Digest logo', localPreviewUrl: 'blob:local-logo' });
    expect(containsBinary(store.getState())).toBe(false);
    expect(JSON.stringify(store.getState())).not.toContain('logo.png');

    await user.click(screen.getByRole('button', { name: 'Templates' }));
    await user.click(screen.getByRole('tab', { name: 'Welcome' }));
    await user.click(screen.getByRole('radio', { name: /Simple welcome/ }));
    await user.click(screen.getByRole('button', { name: 'Templates' }));
    await user.click(screen.getByRole('tab', { name: 'Newsletter' }));
    await user.click(screen.getByRole('radio', { name: /Weekly digest/ }));
    expect(store.getState().editor.draftsByTemplateId['newsletter-digest']?.fields.logo).toEqual(logo);
    expect(localAssets.release).not.toHaveBeenCalled();
  });

  it('removes a local preview and revokes its object URL', async () => {
    const user = userEvent.setup();
    const { store, localAssets } = renderEditor();
    await user.upload(
      within(screen.getByRole('group', { name: 'Logo' })).getByLabelText('Local preview'),
      new File(['logo'], 'logo.png', { type: 'image/png' }),
    );
    await user.click(screen.getByRole('button', { name: 'Remove local preview for Logo' }));
    expect(localAssets.release).toHaveBeenCalledWith('newsletter-digest', 'logo');
    expect(store.getState().editor.draftsByTemplateId['newsletter-digest']?.fields.logo).toEqual({ remoteUrl: '', alt: 'Weekly Digest logo' });
  });

  it('requires explicit reset confirmation and revokes template URLs', async () => {
    const user = userEvent.setup();
    const { store, localAssets } = renderEditor();
    const heading = screen.getByLabelText('Heading');
    await user.clear(heading);
    await user.type(heading, 'Temporary');
    await user.click(screen.getByRole('button', { name: 'Reset draft' }));
    expect(store.getState().editor.draftsByTemplateId['newsletter-digest']?.fields.heading).toBe('Temporary');
    await user.click(screen.getByRole('button', { name: /^Reset$/ }));
    expect(localAssets.releaseTemplate).toHaveBeenCalledWith('newsletter-digest');
    expect(store.getState().editor.draftsByTemplateId['newsletter-digest']?.fields.heading).toBe('Weekly digest');
  });

  it('clears an invalid local color draft when the template is reset', async () => {
    const user = userEvent.setup();
    renderEditor();
    await expandSection(user, 'Appearance');
    const color = screen.getByLabelText('Page background');
    await user.clear(color);
    await user.type(color, '#12');
    expect(color).toHaveValue('#12');

    await user.click(screen.getByRole('button', { name: 'Reset draft' }));
    await user.click(screen.getByRole('button', { name: /^Reset$/ }));

    expect(screen.getByLabelText('Page background')).toHaveValue('#F3F4F6');
  });

  it('revokes all local URLs on pagehide and app teardown', () => {
    const { unmount, localAssets } = renderEditor();
    window.dispatchEvent(new Event('pagehide'));
    expect(localAssets.releaseAll).toHaveBeenCalledTimes(1);
    unmount();
    expect(localAssets.releaseAll).toHaveBeenCalledTimes(2);
  });

  it('uses template order and expands each section from its header button', async () => {
    const user = userEvent.setup();
    renderEditor();

    const editor = screen.getByLabelText('Template editor');
    expect(within(editor).getAllByRole('heading', { level: 3 }).map(({ textContent }) => textContent)).toEqual([
      'Preheader',
      'Header',
      'Article 1',
      'Article 2',
      'Article 3',
      'Footer',
      'Appearance',
    ]);

    const collapseHeader = screen.getByRole('button', { name: 'Collapse Header' });
    expect(collapseHeader).toHaveAttribute('aria-expanded', 'true');
    await user.click(collapseHeader);
    expect(screen.queryByLabelText('Heading')).not.toBeInTheDocument();
    const expandHeader = screen.getByRole('button', { name: 'Expand Header' });
    expect(expandHeader).toHaveAttribute('aria-expanded', 'false');
    await user.click(expandHeader);
    expect(screen.getByLabelText('Heading')).toBeVisible();
  });
});
