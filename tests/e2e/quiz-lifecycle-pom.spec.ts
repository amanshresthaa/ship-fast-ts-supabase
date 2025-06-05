import { test, expect } from '@playwright/test';
import { MOCK_QUIZ_DATA } from './mocks/MOCK_QUIZ_DATA';
import { QuizPage } from './models/QuizPage';

/**
 * E2E Quiz Testing: Complete Quiz Lifecycle (Refactored with Page Object Model)
 * 
 * This test covers the entire user journey from selecting a quiz
 * to completing it and viewing the results, using a clean Page Object Model
 * for better maintainability and readability.
 */

test.describe('Quiz Lifecycle E2E Tests (POM)', () => {
  let quizPage: QuizPage;

  test.beforeEach(async ({ page }) => {
    quizPage = new QuizPage(page);
    
    // Mock the API calls
    await page.route('**/api/quiz/azure-a102**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_QUIZ_DATA),
      });
    });

    await page.route('**/api/quizzes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_QUIZ_DATA]),
      });
    });
  });

  test('should complete the entire quiz lifecycle using Page Object Model', async () => {
    // DAY 1: Quiz Initiation Flow
    console.log('🚀 Day 1: Quiz Initiation Flow (POM)');
    
    await quizPage.goToQuizzes();
    await quizPage.selectQuizByTitle('Mocked Azure AI Quiz');
    await quizPage.startFullQuiz();
    await quizPage.assertUrlContains('/quiz/azure-a102');
    await quizPage.assertQuestionVisible('What is the primary purpose of Azure Cognitive Services?');
    
    console.log('✅ Day 1 Complete: Quiz initiation successful');

    // DAY 2: Testing Click-Based Questions
    console.log('🎯 Day 2: Testing Click-Based Questions (POM)');

    // Question 1: Single Selection
    await quizPage.answerSingleSelectionQuestion('To provide pre-built AI services');
    await quizPage.clickNext();

    // Question 2: Multi Selection
    await quizPage.assertQuestionVisible('Which of the following are Azure Cognitive Services categories?');
    await quizPage.answerMultiSelectionQuestion(['Vision', 'Speech', 'Language', 'Decision']);
    await quizPage.clickNext();

    console.log('✅ Day 2 Complete: Click-based questions handled');

    // DAY 3: Testing Complex Interactive Questions
    console.log('🔧 Day 3: Testing Complex Interactive Questions (POM)');

    // Question 3: Order Question
    await quizPage.assertQuestionVisible('Arrange the following steps in the correct order');
    await quizPage.answerOrderQuestion([
      'Create Custom Vision project',
      'Upload and tag training images',
      'Train the model',
      'Test the model with new images'
    ]);
    await quizPage.clickNext();

    // Question 4: Drag and Drop
    await quizPage.assertQuestionVisible('Match each Azure Cognitive Service to its primary function');
    await quizPage.answerDragAndDropQuestion([
      { option: 'Computer Vision', target: 'Image Recognition' },
      { option: 'Translator', target: 'Text Translation' },
      { option: 'Speech Service', target: 'Speech-to-Text' },
      { option: 'Anomaly Detector', target: 'Anomaly Detection' }
    ]);
    await quizPage.clickNext();

    // Question 5: Dropdown Selection
    await quizPage.assertQuestionVisible('Azure Form Recognizer can extract');
    await quizPage.answerDropdownQuestion([
      { dropdownIndex: 0, optionText: 'structured data' },
      { dropdownIndex: 1, optionText: 'sentiment analysis' }
    ]);
    await quizPage.clickNext();

    console.log('✅ Day 3 Complete: Complex questions handled');

    // DAY 4: Navigation and Yes/No Questions
    console.log('🧭 Day 4: Navigation and Yes/No Questions (POM)');

    // Question 6: Yes/No Question
    await quizPage.assertQuestionVisible('Can Azure Cognitive Services be used without writing custom machine learning code?');
    await quizPage.answerYesNoQuestion('Yes');
    await quizPage.clickNext();

    // Question 7: Yes/No Multi Statement
    await quizPage.assertQuestionVisible('Evaluate the following statements about Azure Cognitive Services');
    await quizPage.answerYesNoMultiQuestion(['No', 'Yes', 'No', 'Yes']);

    console.log('✅ Day 4 Complete: Navigation and Yes/No questions handled');

    // Test Navigation - Previous Button
    console.log('Testing navigation...');
    await quizPage.clickPrevious();
    await quizPage.assertQuestionVisible('Can Azure Cognitive Services be used without');
    await quizPage.clickNext();

    // DAY 5: Completion and Submission Flow
    console.log('🏁 Day 5: Completion and Submission Flow (POM)');

    await quizPage.submitQuiz();
    await quizPage.confirmSubmission();
    await quizPage.assertCompletionVisible();

    console.log('✅ Day 5 Complete: Quiz submission successful');
    console.log('🎉 SPRINT COMPLETE: All 5 days completed with Page Object Model!');
  });

  test('should handle navigation edge cases', async () => {
    await quizPage.goToQuiz('azure-a102');
    
    // Test Previous button disabled on first question
    await quizPage.assertPreviousButtonState(false);
    
    // Answer first question and move forward
    await quizPage.answerSingleSelectionQuestion('To provide pre-built AI services');
    await quizPage.clickNext();
    
    // Previous button should now be enabled
    await quizPage.assertPreviousButtonState(true);
  });

  test('should handle individual question types in isolation', async () => {
    await quizPage.goToQuiz('azure-a102');

    // Test each question type individually
    const questionTests = [
      {
        name: 'Single Selection',
        action: () => quizPage.answerSingleSelectionQuestion('To provide pre-built AI services')
      },
      {
        name: 'Multi Selection',
        action: () => {
          quizPage.clickNext();
          return quizPage.answerMultiSelectionQuestion(['Vision', 'Speech', 'Language', 'Decision']);
        }
      },
      {
        name: 'Order Question',
        action: () => {
          quizPage.clickNext();
          return quizPage.answerOrderQuestion([
            'Create Custom Vision project',
            'Upload and tag training images',
            'Train the model',
            'Test the model with new images'
          ]);
        }
      }
    ];

    for (const questionTest of questionTests) {
      console.log(`Testing ${questionTest.name}...`);
      await questionTest.action();
      console.log(`✅ ${questionTest.name} completed`);
    }
  });
});
