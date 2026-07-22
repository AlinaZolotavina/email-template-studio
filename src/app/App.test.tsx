import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { fieldChanged } from '../features/editor/editorSlice';
import { TemplateGallery } from '../features/templates/components/TemplateGallery';
import { listTemplates } from '../features/templates/templateRegistry';
import { createAppStore, type AppStore } from './store';
import { App } from './App';

function renderApp(store: AppStore = createAppStore()) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <App />
      </Provider>,
    ),
  };
}

describe('App workspace shell', () => {
  it('renders the selected template metadata, draft, and raster visual', () => {
    renderApp();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Email Template Studio' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Weekly digest' })).toBeVisible();
    expect(screen.getByText('The Weekly Brief')).toBeVisible();
    expect(screen.getByText('newsletter-digest')).toBeVisible();
    expect(
      within(screen.getByTestId('selected-template-visual')).getByAltText(
        'Weekly digest email template preview',
      ),
    ).toHaveAttribute('src', expect.stringContaining('newsletter-digest.png'));
  });

  it('switches category and selects a template', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Welcome' }));
    expect(screen.getByRole('radio', { name: /Simple welcome/ })).toBeVisible();
    expect(screen.queryByRole('radio', { name: /Weekly digest/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Simple welcome/ }));
    expect(screen.getByRole('radio', { name: /Simple welcome/ })).toBeChecked();
    expect(screen.getByRole('heading', { level: 2, name: 'Simple welcome' })).toBeVisible();
    expect(screen.getByText('Welcome aboard!')).toBeVisible();
    expect(within(screen.getByLabelText('Selected template data')).getByText('welcome')).toBeVisible();
  });

  it('keeps an edited draft when the user switches away and back', async () => {
    const user = userEvent.setup();
    const store = createAppStore();
    store.dispatch(
      fieldChanged({
        templateId: 'newsletter-digest',
        key: 'heading',
        value: 'Edited digest heading',
      }),
    );
    renderApp(store);

    await user.click(screen.getByRole('tab', { name: 'Welcome' }));
    await user.click(screen.getByRole('radio', { name: /Onboarding steps/ }));
    await user.click(screen.getByRole('tab', { name: 'Newsletter' }));
    await user.click(screen.getByRole('radio', { name: /Weekly digest/ }));

    expect(screen.getByText('Edited digest heading')).toBeVisible();
  });

  it('supports arrow, Home, and End navigation across category tabs', () => {
    renderApp();
    const newsletterTab = screen.getByRole('tab', { name: 'Newsletter' });
    newsletterTab.focus();

    fireEvent.keyDown(newsletterTab, { key: 'ArrowRight' });
    const welcomeTab = screen.getByRole('tab', { name: 'Welcome' });
    expect(welcomeTab).toHaveFocus();
    expect(welcomeTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(welcomeTab, { key: 'Home' });
    expect(newsletterTab).toHaveFocus();
    fireEvent.keyDown(newsletterTab, { key: 'End' });
    expect(welcomeTab).toHaveFocus();
  });

  it('selects and focuses templates with arrow-key navigation', () => {
    const store = createAppStore();
    renderApp(store);
    const digest = screen.getByRole('radio', { name: /Weekly digest/ });
    digest.focus();

    fireEvent.keyDown(digest, { key: 'ArrowDown' });

    const promo = screen.getByRole('radio', { name: /Promotional offer/ });
    expect(promo).toHaveFocus();
    expect(promo).toBeChecked();
    expect(store.getState().templates.selectedTemplateId).toBe('newsletter-promo');
  });
});

describe('TemplateGallery states', () => {
  it('renders empty, loading, and error states from its inputs', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <TemplateGallery templates={[]} onSelect={onSelect} />,
    );
    expect(screen.getByText('No templates available')).toBeVisible();

    rerender(
      <TemplateGallery templates={[]} onSelect={onSelect} status="loading" />,
    );
    expect(screen.getByText('Loading templates')).toBeVisible();

    rerender(
      <TemplateGallery
        templates={listTemplates()}
        onSelect={onSelect}
        status="error"
        errorMessage="Template registry failed."
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Template registry failed.');
  });
});
