import { test, expect } from '@playwright/test';

const quizId = 'azure-a102';

test('resume prompt appears when progress exists', async ({ page }) => {
  await page.route('**/api/user/quiz-progress**', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ progress: { current_question_index: 1, user_answers: {}, last_saved_at: new Date().toISOString() } })
      });
    }
    return route.continue();
  });

  await page.goto(`/quiz-test/${quizId}/single_selection`);
  await expect(page.getByText(/continue/i)).toBeVisible();
});
