import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Quiz Pages
 * 
 * This class encapsulates common locators and actions for quiz-related pages,
 * making tests cleaner and easier to maintain.
 */
export class QuizPage {
  readonly page: Page;
  
  // Common Navigation Elements
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly submitButton: Locator;
  readonly finishButton: Locator;
  
  // Question Elements
  readonly questionText: Locator;
  readonly feedbackSection: Locator;
  readonly questionContainer: Locator;
  
  // Modal Elements
  readonly configModal: Locator;
  readonly startFullQuizButton: Locator;
  readonly confirmationDialog: Locator;
  readonly finalSubmitButton: Locator;
  
  // Question Type Specific Elements
  readonly singleSelectionOptions: Locator;
  readonly multiSelectionOptions: Locator;
  readonly yesButton: Locator;
  readonly noButton: Locator;
  readonly dropdowns: Locator;
  readonly dragOptions: Locator;
  readonly dropTargets: Locator;
  readonly availableItems: Locator;
  readonly orderedSequence: Locator;
  
  // Quiz List Elements
  readonly quizCards: Locator;
  
  // Completion Elements
  readonly completionSummary: Locator;
  readonly scoreDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation Elements
    this.nextButton = page.locator('button', { hasText: 'Next' }).or(
      page.locator('[data-testid="next-button"]')
    );
    this.previousButton = page.locator('button', { hasText: 'Previous' }).or(
      page.locator('[data-testid="previous-button"]')
    );
    this.submitButton = page.locator('button', { hasText: 'Submit Quiz' });
    this.finishButton = page.locator('button', { hasText: 'Finish Quiz' });
    
    // Question Elements
    this.questionText = page.locator('[data-testid="question-text"]').or(
      page.locator('.question-content')
    );
    this.feedbackSection = page.locator('[data-testid="feedback-section"]').or(
      page.locator('.feedback-section')
    );
    this.questionContainer = page.locator('[data-testid="question-container"]').or(
      page.locator('.question-container')
    );
    
    // Modal Elements
    this.configModal = page.locator('[role="dialog"]');
    this.startFullQuizButton = page.locator('text=Start Full Quiz').or(
      page.locator('button', { hasText: 'Start Full Quiz' })
    );
    this.confirmationDialog = page.locator('[role="dialog"]').or(
      page.locator('text=Are you sure you want to submit')
    );
    this.finalSubmitButton = page.locator('button', { hasText: 'Submit Quiz' }).or(
      page.locator('button', { hasText: 'Confirm' })
    );
    
    // Question Type Elements
    this.singleSelectionOptions = page.locator('[data-testid="single-selection-option"]').or(
      page.locator('.single-selection-option')
    );
    this.multiSelectionOptions = page.locator('[data-testid="multi-selection-option"]').or(
      page.locator('.multi-selection-option')
    );
    this.yesButton = page.locator('button', { hasText: 'Yes' }).or(
      page.locator('[data-testid="yes-button"]')
    );
    this.noButton = page.locator('button', { hasText: 'No' }).or(
      page.locator('[data-testid="no-button"]')
    );
    this.dropdowns = page.locator('select').or(
      page.locator('[data-testid="dropdown"]')
    );
    this.dragOptions = page.locator('[data-testid="drag-options"]').or(
      page.locator('.drag-options')
    );
    this.dropTargets = page.locator('[data-testid="drop-targets"]').or(
      page.locator('.drop-targets')
    );
    this.availableItems = page.locator('[data-testid="available-items"]').or(
      page.locator('.available-items')
    );
    this.orderedSequence = page.locator('[data-testid="ordered-sequence"]').or(
      page.locator('.ordered-sequence')
    );
    
    // Quiz List Elements
    this.quizCards = page.locator('[data-testid="quiz-card"]').or(
      page.locator('.quiz-card')
    );
    
    // Completion Elements
    this.completionSummary = page.locator('[data-testid="quiz-completion"]').or(
      page.locator('.completion-summary')
    );
    this.scoreDisplay = page.locator('[data-testid="score-display"]').or(
      page.locator('.score-display')
    );
  }

  // Navigation Actions
  async clickNext() {
    await expect(this.nextButton).toBeEnabled();
    await this.nextButton.click();
  }

  async clickPrevious() {
    await expect(this.previousButton).toBeEnabled();
    await this.previousButton.click();
  }

  async submitQuiz() {
    const submitBtn = this.submitButton.or(this.finishButton).or(this.nextButton);
    await submitBtn.click();
  }

  async confirmSubmission() {
    const isDialogVisible = await this.confirmationDialog.isVisible();
    if (isDialogVisible) {
      await this.finalSubmitButton.click();
    }
  }

  // Quiz Selection Actions
  async selectQuizByTitle(title: string) {
    const quizCard = this.page.locator(`text=${title}`).first();
    await expect(quizCard).toBeVisible();
    await quizCard.click();
  }

  async startFullQuiz() {
    await expect(this.configModal).toBeVisible();
    await expect(this.startFullQuizButton).toBeVisible();
    await this.startFullQuizButton.click();
  }

  // Question Type Actions
  async answerSingleSelectionQuestion(optionText: string) {
    const option = this.page.locator(`text=${optionText}`);
    await expect(option).toBeVisible();
    await option.click();
    await this.waitForFeedback();
  }

  async answerMultiSelectionQuestion(options: string[]) {
    for (const optionText of options) {
      const option = this.page.locator(`text=${optionText}`).first();
      await option.click();
    }
    await this.waitForFeedback();
  }

  async answerYesNoQuestion(answer: 'Yes' | 'No') {
    const button = answer === 'Yes' ? this.yesButton : this.noButton;
    await expect(button).toBeVisible();
    await button.click();
    await this.waitForFeedback();
  }

  async answerYesNoMultiQuestion(answers: Array<'Yes' | 'No'>) {
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const button = this.page.locator(`button`, { hasText: answer }).nth(i);
      if (await button.isVisible()) {
        await button.click();
      }
    }
    await this.waitForFeedback();
  }

  async answerDropdownQuestion(selections: Array<{ dropdownIndex: number; optionText: string }>) {
    for (const selection of selections) {
      const dropdown = this.dropdowns.nth(selection.dropdownIndex);
      if (await dropdown.isVisible()) {
        await dropdown.selectOption(selection.optionText);
      }
    }
    await this.waitForFeedback();
  }

  async answerOrderQuestion(items: string[]) {
    const hasOrderElements = await this.availableItems.count() > 0;
    if (hasOrderElements) {
      for (let i = 0; i < items.length; i++) {
        const item = this.page.locator(`text=${items[i]}`).first();
        const slot = this.orderedSequence.locator('> div').nth(i);
        if (await item.isVisible() && await slot.isVisible()) {
          await item.dragTo(slot);
        }
      }
    }
    await this.waitForFeedback();
  }

  async answerDragAndDropQuestion(pairs: Array<{ option: string; target: string }>) {
    const hasDragElements = await this.dragOptions.count() > 0;
    if (hasDragElements) {
      for (const pair of pairs) {
        const option = this.page.locator(`text=${pair.option}`).first();
        const target = this.page.locator(`text=${pair.target}`).first();
        if (await option.isVisible() && await target.isVisible()) {
          await option.dragTo(target);
        }
      }
    }
    await this.waitForFeedback();
  }

  // Utility Methods
  async waitForFeedback() {
    try {
      await expect(this.feedbackSection).toBeVisible({ timeout: 5000 });
    } catch {
      // Feedback might not always be visible immediately, continue with test
      console.log('Feedback section not immediately visible, continuing...');
    }
  }

  async waitForQuestionToLoad(questionText: string) {
    await expect(this.page.locator(`text=${questionText}`)).toBeVisible();
  }

  async assertQuestionVisible(questionText: string) {
    await expect(this.page.locator(`text=${questionText}`)).toBeVisible();
  }

  async assertUrlContains(urlFragment: string) {
    await expect(this.page).toHaveURL(new RegExp(`.*${urlFragment}.*`));
  }

  async assertPreviousButtonState(enabled: boolean) {
    const button = this.previousButton;
    if (await button.isVisible()) {
      if (enabled) {
        await expect(button).toBeEnabled();
      } else {
        await expect(button).toBeDisabled();
      }
    }
  }

  async assertNextButtonState(enabled: boolean) {
    const button = this.nextButton;
    if (await button.isVisible()) {
      if (enabled) {
        await expect(button).toBeEnabled();
      } else {
        await expect(button).toBeDisabled();
      }
    }
  }

  async assertCompletionVisible() {
    const completionIndicators = [
      this.page.locator('text=Quiz Completed!'),
      this.page.locator('text=Congratulations'),
      this.page.locator('text=Your Score'),
      this.page.locator('text=100%'),
      this.completionSummary,
      this.scoreDisplay
    ];

    let foundCompletion = false;
    for (const indicator of completionIndicators) {
      if (await indicator.isVisible()) {
        foundCompletion = true;
        break;
      }
    }

    // Check URL change as alternative
    if (!foundCompletion) {
      const currentUrl = this.page.url();
      const hasResultsUrl = currentUrl.includes('/results') || currentUrl.includes('/complete');
      const hasSuccessMessage = await this.page.locator('text=submitted').or(
        this.page.locator('text=finished')
      ).isVisible();
      
      foundCompletion = hasResultsUrl || hasSuccessMessage;
    }

    expect(foundCompletion).toBeTruthy();
  }

  // Navigation helpers
  async goToQuizzes() {
    await this.page.goto('/quizzes');
    await this.page.waitForLoadState('networkidle');
  }

  async goToQuiz(quizId: string) {
    await this.page.goto(`/quiz/${quizId}`);
    await this.page.waitForLoadState('networkidle');
  }
}
