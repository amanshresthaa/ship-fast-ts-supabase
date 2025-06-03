import { test, expect } from '@playwright/test';

test('landing page renders key sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /master any topic/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /pricing/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  await expect(page.getByText('©')).toBeVisible();
});
