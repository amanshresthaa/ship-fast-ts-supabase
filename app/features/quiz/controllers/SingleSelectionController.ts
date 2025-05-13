import { SingleSelectionQuestion } from '@/app/types/quiz';
import { QuestionController } from './QuestionController';
import { SingleSelectionValidator } from '../validators/SingleSelectionValidator';

/**
 * Controller for single selection questions
 * Manages state and validation for questions where the user selects one option
 */
export class SingleSelectionController extends QuestionController<SingleSelectionQuestion, string | null> {
  /**
   * Creates an instance of SingleSelectionController
   * @param question The single selection question
   */
  constructor(question: SingleSelectionQuestion) {
    // Create the validator and pass it to the base controller
    const validator = new SingleSelectionValidator(question);
    super(question, validator);
  }
  
  /**
   * Gets the ID of the correct option
   * @returns The correct option ID
   */
  getCorrectOptionId(): string {
    return this.question.correctAnswerOptionId;
  }
  
  /**
   * Checks if a specific option is the correct answer
   * @param optionId The option ID to check
   * @returns True if the option is correct
   */
  isOptionCorrect(optionId: string): boolean {
    return optionId === this.question.correctAnswerOptionId;
  }
}
