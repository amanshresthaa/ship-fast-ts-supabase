import { test, expect } from '@playwright/test';

const quizId = 'azure-a102';
const questionTypes = [
  'single_selection',
  'multi',
  'drag_and_drop',
  'order',
  'yes_no',
  'dropdown_selection',
  'yesno_multi'
];

for (const type of questionTypes) {
  test(`load ${type} question`, async ({ page }) => {
    await page.goto(`/quiz-test/${quizId}/${type}`);
    await expect(page.locator('.question-text')).toBeVisible();
  });
}
