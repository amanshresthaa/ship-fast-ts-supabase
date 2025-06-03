import { test, expect } from '@playwright/test';

test('shows 404 page on invalid route', async ({ page }) => {
  const response = await page.goto('/non-existent-route');
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/something went wrong/i)).toBeVisible();
});
