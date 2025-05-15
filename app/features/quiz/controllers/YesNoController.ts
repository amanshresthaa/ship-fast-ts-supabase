import { YesNoQuestion } from '@/app/types/quiz';
import { QuestionController } from './QuestionController';
import { YesNoValidator } from '../validators/YesNoValidator';

/**
 * Controller for yes/no questions
 * Manages state and validation for questions where the user selects a single yes or no answer
 */
export class YesNoController extends QuestionController<YesNoQuestion, boolean | null> {
  /**
   * Creates an instance of YesNoController
   * @param question The yes/no question
   */
  constructor(question: YesNoQuestion) {
    // Create the validator and pass it to the base controller
    const validator = new YesNoValidator(question);
    super(question, validator);
  }
  
  /**
   * Gets the correct answer
   * @returns The correct answer (true for 'yes', false for 'no')
   */
  getCorrectAnswer(): boolean {
    return this.question.correctAnswer;
  }
  
  /**
   * Checks if a specific answer is correct
   * @param answer The answer to check
   * @returns True if the answer is correct
   */
  isAnswerCorrect(answer: boolean | null): boolean {
    if (answer === null) return false;
    return answer === this.question.correctAnswer;
  }
}
