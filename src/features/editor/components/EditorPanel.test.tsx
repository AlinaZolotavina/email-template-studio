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

    await expandSection(user, 'Articles');
    const article = screen.getByRole('group', { name: 'Article 1' });
    await user.clear(within(article).getByLabelText('Link label'));
    await user.type(within(article).getByLabelText('Link label'), 'Explore');

    await expandSection(user, 'Appearance');
    const color = screen.getByLabelText('Page background');
    await user.clear(color);
    await user.type(color, '#123456');

    await user.click(screen.getByRole('checkbox', { name: 'Show article images' }));

    await expandSection(user, 'Footer');
    const legalLinks = screen.getByRole('group', { name: 'Legal links' });
    const preferences = within(legalLinks).getByRole('group', { name: 'Link 1' });
    await user.clear(within(preferences).getByLabelText('Label'));
    await user.type(within(preferences).getByLabelText('Label'), 'Email settings');
    await user.clear(within(preferences).getByLabelText('URL'));
    await user.type(within(preferences).getByLabelText('URL'), 'https://company.test/preferences');

    const draft = store.getState().editor.draftsByTemplateId['newsletter-digest'];
    expect(draft?.fields.heading).toBe('Edited heading');
    expect(draft?.fields.intro).toBe('Edited intro');
    expect(Array.isArray(draft?.fields.articles) && draft.fields.articles[0]).toEqual(
      expect.objectContaining({ link: { label: 'Explore', url: 'https://example.com/article-1' } }),
    );
    expect(draft?.theme.backgroundColor).toBe('#123456');
    expect(draft?.fields.showArticleImages).toBe(false);
    expect(Array.isArray(draft?.fields.legalLinks) && draft.fields.legalLinks[0]).toEqual({ label: 'Email settings', url: 'https://company.test/preferences' });
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
      'Articles',
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

  it('adds and removes repeated items and removable sections', async () => {
    const user = userEvent.setup();
    const { store } = renderEditor();

    const hiddenPreheaderLabel = screen.getByText('Preheader', { selector: 'label' });
    expect(hiddenPreheaderLabel.className).toContain('srOnly');

    await expandSection(user, 'Articles');
    await user.click(screen.getByRole('button', { name: 'Remove article 3' }));
    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Add article' }));
    }
    const digest = store.getState().editor.draftsByTemplateId['newsletter-digest'];
    expect(Array.isArray(digest?.fields.articles) && digest.fields.articles).toHaveLength(6);

    await expandSection(user, 'Footer');
    const socialLinks = screen.getByRole('group', { name: 'Social links' });
    await user.click(within(socialLinks).getByRole('button', { name: 'Remove link 1' }));
    await user.click(within(socialLinks).getByRole('button', { name: 'Add link' }));
    expect(Array.isArray(digest?.fields.socialLinks) && digest.fields.socialLinks).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Remove Delivery notice' }));
    await user.click(screen.getByRole('button', { name: 'Remove Social links' }));
    await user.click(screen.getByRole('button', { name: 'Remove Legal links' }));
    const updatedDigest = store.getState().editor.draftsByTemplateId['newsletter-digest'];
    expect(updatedDigest?.fields.showFooterText).toBe(false);
    expect(updatedDigest?.fields.showSocialLinks).toBe(false);
    expect(updatedDigest?.fields.showLegalLinks).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Remove Preheader' }));
    expect(store.getState().editor.draftsByTemplateId['newsletter-digest']?.fields.showPreheader).toBe(false);
    expect(screen.queryByRole('textbox', { name: 'Preheader' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Preheader' }));
    expect(store.getState().editor.draftsByTemplateId['newsletter-digest']?.fields.showPreheader).toBe(true);
  }, 20_000);

  it('edits button colors and manages onboarding steps as repeated items', async () => {
    const user = userEvent.setup();
    const { store } = renderEditor();
    const button = screen.getByRole('group', { name: 'Primary button' });
    await user.clear(within(button).getByLabelText('Button color HEX'));
    await user.type(within(button).getByLabelText('Button color HEX'), '#123456');
    await user.clear(within(button).getByLabelText('Text color HEX'));
    await user.type(within(button).getByLabelText('Text color HEX'), '#FEDCBA');
    expect(store.getState().editor.draftsByTemplateId['newsletter-digest']?.fields.primaryCta).toEqual(
      expect.objectContaining({ backgroundColor: '#123456', textColor: '#FEDCBA' }),
    );

    await user.click(screen.getByRole('button', { name: 'Templates' }));
    await user.click(screen.getByRole('tab', { name: 'Welcome' }));
    await user.click(screen.getByRole('radio', { name: /Onboarding steps/ }));
    await expandSection(user, 'Steps');
    await user.click(screen.getByRole('button', { name: 'Remove step 2' }));
    await user.click(screen.getByRole('button', { name: 'Add step' }));
    await user.click(screen.getByRole('button', { name: 'Add step' }));
    const steps = store.getState().editor.draftsByTemplateId['welcome-onboarding']?.fields.steps;
    expect(Array.isArray(steps) && steps).toHaveLength(4);
  }, 20_000);

  it('keeps benefits as individually editable repeated items', async () => {
    const user = userEvent.setup();
    const { store } = renderEditor();
    await user.click(screen.getByRole('button', { name: 'Templates' }));
    await user.click(screen.getByRole('radio', { name: /Promotional offer/ }));
    await expandSection(user, 'Benefits');

    expect(screen.getByRole('checkbox', { name: 'Show benefits' })).toBeVisible();
    expect(screen.getAllByRole('group', { name: /Benefit \d/ })).toHaveLength(3);
    await user.clear(within(screen.getByRole('group', { name: 'Benefit 1' })).getByLabelText('Text'));
    await user.type(within(screen.getByRole('group', { name: 'Benefit 1' })).getByLabelText('Text'), 'A custom benefit');
    await user.click(screen.getByRole('button', { name: 'Remove benefit 2' }));
    await user.click(screen.getByRole('button', { name: 'Add benefit' }));

    const benefits = store.getState().editor.draftsByTemplateId['newsletter-promo']?.fields.benefits;
    expect(Array.isArray(benefits) && benefits).toHaveLength(3);
    expect(Array.isArray(benefits) && benefits[0]).toEqual(expect.objectContaining({ text: 'A custom benefit' }));
  }, 20_000);
});
