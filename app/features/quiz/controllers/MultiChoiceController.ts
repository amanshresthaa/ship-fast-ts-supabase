import { MultiChoiceQuestion } from '@/app/types/quiz';
import { QuestionController } from './QuestionController';
import { MultiChoiceValidator } from '../validators/MultiChoiceValidator';

/**
 * Controller for multi-choice questions
 * Manages state and validation for questions where the user selects multiple options
 */
export class MultiChoiceController extends QuestionController<MultiChoiceQuestion, string[]> {
  /**
   * Creates an instance of MultiChoiceController
   * @param question The multi-choice question
   */
  constructor(question: MultiChoiceQuestion) {
    // Create the validator and pass it to the base controller
    const validator = new MultiChoiceValidator(question);
    super(question, validator);
  }
  
  /**
   * Gets the IDs of the correct options
   * @returns Array of correct option IDs
   */
  getCorrectOptionIds(): string[] {
    return this.question.correctAnswerOptionIds;
  }
  
  /**
   * Gets the required number of selections
   * @returns Number of options that should be selected
   */
  getRequiredSelectionCount(): number {
    return this.question.correctAnswerOptionIds.length;
  }
  
  /**
   * Checks if a specific option is part of the correct answer set
   * @param optionId The option ID to check
   * @returns True if the option is one of the correct answers
   */
  isOptionCorrect(optionId: string): boolean {
    return this.question.correctAnswerOptionIds.includes(optionId);
  }
}
