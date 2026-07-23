import { expect, test } from '@playwright/test';

test('selects a template in the workspace shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Email Template Studio' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Weekly digest' })).toBeVisible();

  await page.getByRole('tab', { name: 'Welcome' }).click();
  await page.getByRole('radio', { name: /Simple welcome/ }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'Simple welcome' })).toBeVisible();
  await expect(page.getByLabel('Greeting')).toHaveValue('Welcome aboard!');
  await expect(page.getByTitle('Email preview')).toHaveAttribute(
    'srcdoc',
    /Welcome aboard!/,
  );
  await expect(page.getByLabel('Generated HTML')).toHaveValue(/Welcome aboard!/);
});

test('keeps every panel accessible on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByLabel('Template gallery')).toBeVisible();
  await expect(page.getByTitle('Email preview')).toBeVisible();
  await expect(page.getByLabel('Generated HTML')).toBeVisible();
  await expect(page.getByLabel('Template editor')).toBeVisible();

  const bodyWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
});

test('edits fields and confirms a draft reset', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Heading').fill('A browser-edited heading');
  await expect(page.getByLabel('Heading')).toHaveValue('A browser-edited heading');
  await expect(page.getByTitle('Email preview')).toHaveAttribute(
    'srcdoc',
    /A browser-edited heading/,
  );
  await expect(page.getByLabel('Generated HTML')).toHaveValue(
    /A browser-edited heading/,
  );

  await page.getByLabel('Accent color', { exact: true }).fill('#123456');
  await expect(page.getByLabel('Accent color', { exact: true })).toHaveValue('#123456');

  await page.getByRole('button', { name: 'Reset draft' }).click();
  await expect(page.getByRole('group', { name: 'Confirm draft reset' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('Heading')).toHaveValue('The Weekly Brief');
});

test('switches viewport dimensions without changing generated HTML', async ({ page }) => {
  await page.goto('/');

  const frame = page.getByTitle('Email preview');
  const previewHtml = await frame.getAttribute('srcdoc');
  const exportHtml = await page.getByLabel('Generated HTML').inputValue();

  await page.getByRole('tab', { name: 'Mobile' }).click();

  await expect(frame).toHaveAttribute('width', '375');
  await expect(frame).toHaveAttribute('height', '560');
  expect(await frame.getAttribute('srcdoc')).toBe(previewHtml);
  expect(await page.getByLabel('Generated HTML').inputValue()).toBe(exportHtml);
});
