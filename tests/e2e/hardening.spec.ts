import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __createdObjectUrls: string[];
    __revokedObjectUrls: string[];
  }
}

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('supports keyboard navigation and visible WCAG AA focus indicators', async ({ page }) => {
  await page.goto('/');

  const newsletterTab = page.getByRole('tab', { name: 'Newsletter' });
  await newsletterTab.focus();
  await newsletterTab.press('End');
  const welcomeTab = page.getByRole('tab', { name: 'Welcome' });
  await expect(welcomeTab).toBeFocused();
  await expect(welcomeTab).toHaveAttribute('aria-selected', 'true');

  const desktopTab = page.getByRole('tab', { name: 'Desktop' });
  await desktopTab.focus();
  await desktopTab.press('ArrowRight');
  const mobileTab = page.getByRole('tab', { name: 'Mobile' });
  await expect(mobileTab).toBeFocused();
  await expect(mobileTab).toHaveAttribute('aria-selected', 'true');

  const focusStyles = await mobileTab.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      color: styles.outlineColor,
      style: styles.outlineStyle,
      width: Number.parseFloat(styles.outlineWidth),
    };
  });
  expect(focusStyles.style).not.toBe('none');
  expect(focusStyles.width).toBeGreaterThanOrEqual(2);

  const focusContrast = await page.evaluate(() => {
    const parse = (value: string) => {
      const channels = /^#[0-9a-f]{6}$/i.test(value)
        ? [1, 3, 5].map((offset) =>
            Number.parseInt(value.slice(offset, offset + 2), 16),
          )
        : (value.match(/\d+/g)?.slice(0, 3).map(Number) ?? []);
      return channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
    };
    const luminance = (value: string) => {
      const [red, green, blue] = parse(value);
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };
    const root = getComputedStyle(document.documentElement);
    const focus = luminance(root.getPropertyValue('--color-focus').trim());
    const surface = luminance(root.getPropertyValue('--color-surface').trim());
    return (Math.max(focus, surface) + 0.05) / (Math.min(focus, surface) + 0.05);
  });
  expect(focusContrast).toBeGreaterThanOrEqual(3);

  await page.getByLabel('Heading').focus();
  await expect(page.getByLabel('Heading')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Introduction')).toBeFocused();
});

test('escapes adversarial HTML and rejects executable URL protocols', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto('/');

  const payload = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  await page.getByLabel('Heading').fill(payload);

  const generatedHtml = page.getByLabel('Generated HTML');
  await expect(generatedHtml).toHaveValue(/&lt;img src=x onerror=alert\(1\)&gt;/);
  await expect(generatedHtml).not.toHaveValue(/<script>alert\(2\)<\/script>/);
  await expect(page.getByTitle('Email preview')).toHaveAttribute(
    'srcdoc',
    /&lt;script&gt;alert\(2\)&lt;\/script&gt;/,
  );

  await page.locator('summary').filter({ hasText: 'Buttons' }).click();
  const primaryButton = page.getByRole('group', { name: 'Primary button' });
  await primaryButton.getByLabel('URL').fill('javascript:alert(document.domain)');

  await expect(primaryButton.getByText('Enter a valid absolute link URL.')).toBeVisible();
  await expect(page.getByText('Export unavailable')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy HTML' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Download .html' })).toBeDisabled();
  expect(browserErrors).toEqual([]);
});

test('handles maximum text, extreme colors, and long valid URLs without errors', async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto('/');

  const maximumHeading = 'W'.repeat(80);
  await page.getByLabel('Heading').fill(maximumHeading);
  await expect(page.getByText('80/80')).toBeVisible();

  const accent = page.getByLabel('Accent color', { exact: true });
  await accent.fill('#000000');
  await expect(page.getByLabel('Generated HTML')).toHaveValue(/#000000/);
  await accent.fill('#FFFFFF');
  await expect(page.getByLabel('Generated HTML')).toHaveValue(/#FFFFFF/);

  await page.locator('summary').filter({ hasText: 'Buttons' }).click();
  const longUrl = `https://example.com/${'segment-'.repeat(180)}?a=1&b=2`;
  await page
    .getByRole('group', { name: 'Primary button' })
    .getByLabel('URL')
    .fill(longUrl);

  await expect(page.getByRole('button', { name: 'Copy HTML' })).toBeEnabled();
  await expect(page.getByLabel('Generated HTML')).toHaveValue(/segment-segment-/);
  await expect(page.getByLabel('Generated HTML')).toHaveValue(/\?a=1&amp;b=2/);

  await accent.fill('#GGGGGG');
  await expect(page.getByText('Use a six-digit HEX color')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy HTML' })).toBeEnabled();
  expect(browserErrors).toEqual([]);
});

test('revokes replaced, removed, and page-hidden local object URLs', async ({ page }) => {
  await page.addInitScript(() => {
    const created: string[] = [];
    const revoked: string[] = [];
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    Object.assign(window, { __createdObjectUrls: created, __revokedObjectUrls: revoked });
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      revoked.push(url);
      revoke(url);
    };
  });
  await page.goto('/');

  const logo = page.getByRole('group', { name: 'Logo' });
  const fileInput = logo.locator('input[type="file"]');
  await fileInput.setInputFiles('public/template-thumbnails/newsletter-digest.png');
  await fileInput.setInputFiles('public/template-thumbnails/newsletter-promo.png');

  const afterReplacement = await page.evaluate(() => ({
    created: window.__createdObjectUrls,
    revoked: window.__revokedObjectUrls,
  }));
  expect(afterReplacement.created).toHaveLength(2);
  expect(afterReplacement.revoked).toContain(afterReplacement.created[0]);

  await page.getByRole('button', { name: 'Remove local preview for Logo' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__revokedObjectUrls.length,
      ),
    )
    .toBe(2);

  await fileInput.setInputFiles('public/template-thumbnails/newsletter-digest.png');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  const finalLifecycle = await page.evaluate(() => ({
    created: window.__createdObjectUrls,
    revoked: window.__revokedObjectUrls,
  }));
  expect(finalLifecycle.revoked).toEqual(expect.arrayContaining(finalLifecycle.created));
});
