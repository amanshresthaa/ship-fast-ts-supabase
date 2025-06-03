import { test, expect } from '@playwright/test';

test('terms of service page loads', async ({ page }) => {
  await page.goto('/tos');
  await expect(page.getByRole('heading', { name: /terms and conditions/i })).toBeVisible();
});

test('privacy policy page loads', async ({ page }) => {
  await page.goto('/privacy-policy');
  await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
});
