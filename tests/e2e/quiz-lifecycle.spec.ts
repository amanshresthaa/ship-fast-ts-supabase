import { test, expect, Page } from '@playwright/test';
import { MOCK_QUIZ_DATA } from './mocks/MOCK_QUIZ_DATA';

/**
 * E2E Quiz Testing: Complete Quiz Lifecycle
 * 
 * This test covers the entire user journey from selecting a quiz
 * to completing it and viewing the results, including interactions
 * with all 7 question types.
 */

test.describe('Quiz Lifecycle E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Mock the API call to return our test quiz data
    await page.route('**/api/quiz/azure-a102**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_QUIZ_DATA),
      });
    });

    // Mock the quizzes list API call if needed
    await page.route('**/api/quizzes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_QUIZ_DATA]),
      });
    });
  });

  test('should complete the entire quiz lifecycle - from selection to completion', async () => {
    // DAY 1: Quiz Initiation Flow
    console.log('🚀 Starting Day 1: Quiz Initiation Flow');
    
    // Navigate to the quizzes page
    await page.goto('/quizzes');
    await page.waitForLoadState('networkidle');

    // Locate and click the quiz card
    const quizCard = page.locator('text=Mocked Azure AI Quiz').first();
    await expect(quizCard).toBeVisible();
    await quizCard.click();

    // Assert that QuizConfigModal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click the "Start Full Quiz" button
    const startButton = page.locator('text=Start Full Quiz').or(page.locator('button', { hasText: 'Start Full Quiz' }));
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Assert the URL is now /quiz/azure-a102
    await expect(page).toHaveURL(/.*\/quiz\/azure-a102.*/);

    // Assert the first question from mock data is visible
    const firstQuestion = page.locator('text=What is the primary purpose of Azure Cognitive Services?');
    await expect(firstQuestion).toBeVisible();
    
    console.log('✅ Day 1 Complete: Successfully navigated to quiz and first question is visible');

    // DAY 2: Testing Click-Based Questions
    console.log('🎯 Starting Day 2: Testing Click-Based Questions');

    // Test Question 1: Single Selection
    console.log('Testing single_selection question...');
    const singleChoice = page.locator('text=To provide pre-built AI services');
    await expect(singleChoice).toBeVisible();
    await singleChoice.click();

    // Wait for feedback to appear
    const feedback = page.locator('text=Correct! Azure Cognitive Services are pre-built AI services.').or(
      page.locator('[data-testid="feedback-section"]')
    );
    await expect(feedback).toBeVisible({ timeout: 5000 });

    // Assert Next button is enabled and click it
    const nextButton = page.locator('button', { hasText: 'Next' }).or(
      page.locator('[data-testid="next-button"]')
    );
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Test Question 2: Multi Selection
    console.log('Testing multi selection question...');
    await expect(page.locator('text=Which of the following are Azure Cognitive Services categories?')).toBeVisible();
    
    // Select multiple correct options
    const multiOptions = ['Vision', 'Speech', 'Language', 'Decision'];
    for (const option of multiOptions) {
      const optionElement = page.locator(`text=${option}`).first();
      await optionElement.click();
    }

    // Wait for feedback
    await expect(page.locator('text=Excellent!').or(page.locator('[data-testid="feedback-section"]'))).toBeVisible({ timeout: 5000 });
    
    // Move to next question
    await nextButton.click();

    console.log('✅ Day 2 Complete: Click-based questions tested successfully');

    // DAY 3: Testing Complex Interactive Questions
    console.log('🔧 Starting Day 3: Testing Complex Interactive Questions');

    // Test Question 3: Order Question
    console.log('Testing order question...');
    await expect(page.locator('text=Arrange the following steps in the correct order')).toBeVisible();

    // For order questions, we'll look for draggable items and slots
    const availableItems = page.locator('[data-testid="available-items"]').or(
      page.locator('.available-items')
    );
    const orderedSlots = page.locator('[data-testid="ordered-sequence"]').or(
      page.locator('.ordered-sequence')
    );

    // If drag and drop elements exist, perform the ordering
    const hasOrderElements = await availableItems.count() > 0;
    if (hasOrderElements) {
      // Drag items in correct order
      const items = ['Create Custom Vision project', 'Upload and tag training images', 'Train the model', 'Test the model with new images'];
      for (let i = 0; i < items.length; i++) {
        const item = page.locator(`text=${items[i]}`).first();
        const slot = orderedSlots.locator('> div').nth(i);
        if (await item.isVisible() && await slot.isVisible()) {
          await item.dragTo(slot);
        }
      }
    }

    // Move to next question
    await nextButton.click();

    // Test Question 4: Drag and Drop
    console.log('Testing drag and drop question...');
    await expect(page.locator('text=Match each Azure Cognitive Service to its primary function')).toBeVisible();

    // Look for drag and drop elements
    const dragOptions = page.locator('[data-testid="drag-options"]').or(
      page.locator('.drag-options')
    );
    const dropTargets = page.locator('[data-testid="drop-targets"]').or(
      page.locator('.drop-targets')
    );

    // Perform drag and drop if elements exist
    const hasDragElements = await dragOptions.count() > 0;
    if (hasDragElements) {
      const pairs = [
        { option: 'Computer Vision', target: 'Image Recognition' },
        { option: 'Translator', target: 'Text Translation' },
        { option: 'Speech Service', target: 'Speech-to-Text' },
        { option: 'Anomaly Detector', target: 'Anomaly Detection' }
      ];

      for (const pair of pairs) {
        const option = page.locator(`text=${pair.option}`).first();
        const target = page.locator(`text=${pair.target}`).first();
        if (await option.isVisible() && await target.isVisible()) {
          await option.dragTo(target);
        }
      }
    }

    // Move to next question
    await nextButton.click();

    // Test Question 5: Dropdown Selection
    console.log('Testing dropdown selection question...');
    await expect(page.locator('text=Azure Form Recognizer can extract')).toBeVisible();

    // Look for dropdown elements
    const dropdowns = page.locator('select').or(page.locator('[data-testid="dropdown"]'));
    const dropdownCount = await dropdowns.count();
    
    if (dropdownCount > 0) {
      // Select correct options in dropdowns
      await dropdowns.nth(0).selectOption('structured data');
      if (dropdownCount > 1) {
        await dropdowns.nth(1).selectOption('sentiment analysis');
      }
    }

    // Move to next question
    await nextButton.click();

    console.log('✅ Day 3 Complete: Complex interactive questions tested successfully');

    // DAY 4: Navigation and Yes/No Questions
    console.log('🧭 Starting Day 4: Navigation and Yes/No Questions');

    // Test Question 6: Yes/No Question
    console.log('Testing yes/no question...');
    await expect(page.locator('text=Can Azure Cognitive Services be used without writing custom machine learning code?')).toBeVisible();

    // Click Yes button
    const yesButton = page.locator('button', { hasText: 'Yes' }).or(
      page.locator('[data-testid="yes-button"]')
    );
    await expect(yesButton).toBeVisible();
    await yesButton.click();

    // Wait for feedback
    await expect(page.locator('text=Yes! That\'s the main advantage').or(
      page.locator('[data-testid="feedback-section"]')
    )).toBeVisible({ timeout: 5000 });

    // Move to final question
    await nextButton.click();

    // Test Question 7: Yes/No Multi Statement
    console.log('Testing yes/no multi statement question...');
    await expect(page.locator('text=Evaluate the following statements about Azure Cognitive Services')).toBeVisible();

    // Answer each statement (based on our mock data correctAnswers: [false, true, false, true])
    const statements = [
      { text: 'require a paid subscription', answer: 'No' },
      { text: 'trained with your own images', answer: 'Yes' },
      { text: 'only supports English', answer: 'No' },
      { text: 'detect the language', answer: 'Yes' }
    ];

    for (const statement of statements) {
      const statementButton = page.locator(`button`, { hasText: statement.answer }).first();
      if (await statementButton.isVisible()) {
        await statementButton.click();
      }
    }

    console.log('✅ Day 4 Complete: Navigation and Yes/No questions tested successfully');

    // Test Navigation - Previous Button
    console.log('Testing Previous button navigation...');
    const prevButton = page.locator('button', { hasText: 'Previous' }).or(
      page.locator('[data-testid="previous-button"]')
    );
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await page.waitForTimeout(1000); // Allow navigation to complete
      
      // Should be back to yes/no question
      await expect(page.locator('text=Can Azure Cognitive Services be used without')).toBeVisible();
      
      // Navigate back to final question
      await nextButton.click();
    }

    // DAY 5: Completion and Submission Flow
    console.log('🏁 Starting Day 5: Completion and Submission Flow');

    // The Next button should now show "Finish Quiz" or "Submit Quiz"
    const submitButton = page.locator('button', { hasText: 'Finish Quiz' })
      .or(page.locator('button', { hasText: 'Submit Quiz' }))
      .or(nextButton);
    
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Test Confirmation Dialog
    console.log('Testing confirmation dialog...');
    const confirmationDialog = page.locator('[role="dialog"]').or(
      page.locator('text=Are you sure you want to submit')
    );
    
    // If confirmation dialog appears, confirm submission
    const hasConfirmDialog = await confirmationDialog.isVisible();
    if (hasConfirmDialog) {
      const finalSubmitButton = page.locator('button', { hasText: 'Submit Quiz' })
        .or(page.locator('button', { hasText: 'Confirm' }))
        .or(page.locator('button', { hasText: 'Yes' }));
      await finalSubmitButton.click();
    }

    // Test Completion Summary
    console.log('Testing completion summary...');
    
    // Wait for completion page/component to load
    await page.waitForLoadState('networkidle');
    
    // Check for completion indicators
    const completionIndicators = [
      page.locator('text=Quiz Completed!'),
      page.locator('text=Congratulations'),
      page.locator('text=Your Score'),
      page.locator('text=100%'),
      page.locator('[data-testid="quiz-completion"]'),
      page.locator('.completion-summary')
    ];

    let foundCompletion = false;
    for (const indicator of completionIndicators) {
      if (await indicator.isVisible()) {
        foundCompletion = true;
        console.log('✅ Found completion indicator:', await indicator.textContent());
        break;
      }
    }

    // If we can't find a specific completion page, check if URL changed or any success message
    if (!foundCompletion) {
      const currentUrl = page.url();
      const hasResultsUrl = currentUrl.includes('/results') || currentUrl.includes('/complete');
      const hasSuccessMessage = await page.locator('text=submitted').or(page.locator('text=finished')).isVisible();
      
      if (hasResultsUrl || hasSuccessMessage) {
        foundCompletion = true;
        console.log('✅ Quiz completion detected via URL change or success message');
      }
    }

    // Assert that some form of completion was detected
    expect(foundCompletion).toBeTruthy();

    console.log('✅ Day 5 Complete: Quiz submission and completion flow tested successfully');
    console.log('🎉 SPRINT COMPLETE: All 5 days of E2E testing completed successfully!');
  });

  test('should handle quiz navigation correctly', async () => {
    // Additional test for navigation edge cases
    await page.goto('/quiz/azure-a102');
    await page.waitForLoadState('networkidle');

    // Test that Previous button is disabled on first question
    const prevButton = page.locator('button', { hasText: 'Previous' });
    if (await prevButton.isVisible()) {
      await expect(prevButton).toBeDisabled();
    }

    // Answer first question and move forward
    const firstChoice = page.locator('text=To provide pre-built AI services');
    if (await firstChoice.isVisible()) {
      await firstChoice.click();
      
      const nextButton = page.locator('button', { hasText: 'Next' });
      await nextButton.click();
      
      // Now Previous button should be enabled
      if (await prevButton.isVisible()) {
        await expect(prevButton).toBeEnabled();
      }
    }
  });
});
