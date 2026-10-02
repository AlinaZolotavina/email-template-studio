import { expect, test, type Page } from '@playwright/test';

const SESSION_STORAGE_KEY = 'email-template-studio:session:v1';

async function openDigest(page: Page) {
  await page.getByRole('radio', { name: /Weekly digest/ }).click();
}

async function returnToTemplates(page: Page) {
  await page.getByRole('button', { name: 'Templates' }).click();
  const confirm = page.getByRole('button', { name: 'Leave and reset' });
  if (await confirm.count()) await confirm.click();
}

test('selects a template in the workspace shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Email Template Studio' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Email creation, simplified' })).toBeVisible();

  await page.getByRole('tab', { name: 'Welcome' }).click();
  await page.getByRole('radio', { name: /Simple welcome/ }).click();

  await expect(page).toHaveURL(/#\/studio\/welcome-simple$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Simple welcome' })).toBeVisible();
  await expect(page.getByLabel('Greeting')).toHaveValue('Welcome!');
  await expect(page.getByTitle('Email preview')).toHaveAttribute(
    'srcdoc',
    /Welcome!/,
  );
  await expect(page.getByLabel('Generated HTML')).toHaveValue(/Welcome!/);
});

test('keeps every panel accessible on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await openDigest(page);

  await expect(page.getByTitle('Email preview')).toBeVisible();
  await expect(page.getByLabel('Generated HTML')).toBeVisible();
  await expect(page.getByLabel('Template editor')).toBeVisible();

  const bodyWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
});

test('scrolls the template catalogue on a desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/#/templates');

  const catalogue = page.getByRole('main');
  await expect.poll(() => catalogue.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await catalogue.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect.poll(() => catalogue.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
});

test('edits fields and confirms a draft reset', async ({ page }) => {
  await page.goto('/');
  await openDigest(page);
  await page.getByLabel('Heading').fill('A browser-edited heading');
  await expect(page.getByLabel('Heading')).toHaveValue('A browser-edited heading');
  await expect(page.getByTitle('Email preview')).toHaveAttribute(
    'srcdoc',
    /A browser-edited heading/,
  );
  await expect(page.getByLabel('Generated HTML')).toHaveValue(
    /A browser-edited heading/,
  );

  await page.getByRole('button', { name: 'Expand Appearance' }).click();
  await page.getByLabel('Accent color', { exact: true }).fill('#123456');
  await expect(page.getByLabel('Accent color', { exact: true })).toHaveValue('#123456');

  await page.getByRole('button', { name: 'Reset draft' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Reset this draft?' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('Heading')).toHaveValue('Weekly digest');
});

test('leaves a clean template without showing a reset dialog', async ({ page }) => {
  await page.goto('/');
  await openDigest(page);

  await expect(page.getByRole('button', { name: 'Reset draft' })).toBeDisabled();
  await page.getByRole('button', { name: 'Templates' }).click();

  await expect(page).toHaveURL(/#\/templates$/);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('switches viewport dimensions without changing generated HTML', async ({ page }) => {
  await page.goto('/');
  await openDigest(page);

  const frame = page.getByTitle('Email preview');
  const previewHtml = await frame.getAttribute('srcdoc');
  const exportHtml = await page.getByLabel('Generated HTML').inputValue();

  await page.getByRole('tab', { name: 'Mobile' }).click();

  await expect(frame).toHaveAttribute('width', '375');
  expect(Number(await frame.getAttribute('height'))).toBeGreaterThanOrEqual(560);
  expect(await frame.getAttribute('srcdoc')).toBe(previewHtml);
  expect(await page.getByLabel('Generated HTML').inputValue()).toBe(exportHtml);
});

test('shows preheader edits in the email body and generated HTML', async ({ page }) => {
  await page.goto('/');
  await openDigest(page);

  const preheader = 'A visible inbox preview line';
  await page.getByRole('textbox', { name: 'Preheader' }).fill(preheader);

  const previewBody = page.frameLocator('iframe[title="Email preview"]').locator('body');
  await expect(previewBody.locator('p').getByText(preheader, { exact: true })).toBeVisible();
  await expect(page.getByLabel('Generated HTML')).toHaveValue(
    new RegExp(preheader),
  );
});

test('adds and removes articles, footer links, and entire sections', async ({ page }) => {
  await page.goto('/');
  await openDigest(page);

  await page.getByRole('button', { name: 'Expand Articles' }).click();
  await page.getByRole('button', { name: 'Remove article 3' }).click();
  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: 'Add article' }).click();
  }
  await expect(
    page.frameLocator('iframe[title="Email preview"]').locator('h2'),
  ).toHaveCount(6);

  await page.getByRole('button', { name: 'Expand Footer' }).click();
  const socialLinks = page.getByRole('group', { name: 'Social links' });
  await expect(socialLinks.getByRole('group', { name: 'Link 1' })).toBeVisible();
  await expect(page.getByText('X link', { exact: true })).toHaveCount(0);
  await socialLinks.getByRole('button', { name: 'Remove link 1' }).click();

  await page.getByRole('button', { name: 'Remove Delivery notice' }).click();
  await page.getByRole('button', { name: 'Remove Legal links' }).click();
  await expect(page.getByRole('button', { name: 'Add Delivery notice' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Legal links' })).toBeVisible();

  await page.getByRole('button', { name: 'Remove Preheader' }).click();
  await expect(page.getByRole('textbox', { name: 'Preheader' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add Preheader' })).toBeVisible();
  await expect(page.getByLabel('Generated HTML')).not.toHaveValue(
    /This week: product thinking, design systems, and growth\./,
  );
});

test('restores the selected template, draft, and viewport after refresh', async ({ page }) => {
  await page.goto('/');
  await openDigest(page);
  await page.getByLabel('Heading').fill('Persisted browser draft');
  await page.getByRole('tab', { name: 'Mobile' }).click();

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const stored = sessionStorage.getItem(key);
        return (
          stored?.includes('Persisted browser draft') === true &&
          stored.includes('"previewViewport":"mobile"')
        );
      }, SESSION_STORAGE_KEY),
    )
    .toBe(true);

  await page.reload();

  await expect(page).toHaveURL(/#\/studio\/newsletter-digest$/);
  await expect(page.getByLabel('Heading')).toHaveValue('Persisted browser draft');
  await expect(page.getByRole('tab', { name: 'Mobile' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByTitle('Email preview')).toHaveAttribute(
    'srcdoc',
    /Persisted browser draft/,
  );
});

test('resets each draft when returning to templates', async ({ page }) => {
  await page.goto('/');
  await openDigest(page);
  await page.getByLabel('Heading').fill('Digest-only heading');

  await returnToTemplates(page);
  await page.getByRole('tab', { name: 'Welcome' }).click();
  await page.getByRole('radio', { name: /Simple welcome/ }).click();
  await page.getByLabel('Greeting').fill('Welcome-only greeting');

  await returnToTemplates(page);
  await page.getByRole('tab', { name: 'Newsletter' }).click();
  await page.getByRole('radio', { name: /Weekly digest/ }).click();
  await expect(page.getByLabel('Heading')).toHaveValue('Weekly digest');

  await returnToTemplates(page);
  await page.getByRole('tab', { name: 'Welcome' }).click();
  await page.getByRole('radio', { name: /Simple welcome/ }).click();
  await expect(page.getByLabel('Greeting')).toHaveValue('Welcome!');
});

test('warns about local-only images, then copies and downloads the exact export HTML', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await openDigest(page);

  const logoGroup = page.getByRole('group', { name: 'Logo' });
  await logoGroup
    .locator('input[type="file"]')
    .setInputFiles('public/template-thumbnails/newsletter-digest.png');

  await expect(page.getByRole('button', { name: 'Copy HTML' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Download .html' })).toBeEnabled();
  await expect(
    page.getByText(/Local preview images are not embedded/),
  ).toBeVisible();
  await logoGroup
    .getByLabel('Public image URL')
    .fill('https://example.com/public-logo.png');

  const codeView = page.getByLabel('Generated HTML');
  const exportHtml = await codeView.inputValue();
  expect(exportHtml).toContain('https://example.com/public-logo.png');
  expect(exportHtml).not.toContain('blob:');

  await page.getByRole('button', { name: 'Copy HTML' }).click();
  await expect(page.getByRole('status')).toHaveText('HTML copied to clipboard.');
  const clipboardHtml = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardHtml.replace(/\r\n/g, '\n')).toBe(exportHtml);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .html' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('newsletter-digest-email.html');
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
});
