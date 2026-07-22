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
  await expect(page.getByText('Welcome aboard!')).toBeVisible();
  await expect(page.getByTestId('selected-template-visual').locator('img')).toHaveAttribute(
    'src',
    /welcome-simple\.png$/,
  );
});

test('keeps every panel accessible on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByLabel('Template gallery')).toBeVisible();
  await expect(page.getByTestId('selected-template-visual')).toBeVisible();
  await expect(page.getByLabel('Selected template data')).toBeVisible();

  const bodyWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
});
