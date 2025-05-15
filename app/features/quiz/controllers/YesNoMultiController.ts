import { YesNoMultiQuestion, YesNoStatement } from '@/app/types/quiz';
import { QuestionController } from './QuestionController';
import { YesNoMultiValidator } from '../validators/YesNoMultiValidator';

/**
 * Controller for multi-statement yes/no questions
 * Manages state and validation for questions where the user answers yes/no to multiple statements
 */
export class YesNoMultiController extends QuestionController<YesNoMultiQuestion, boolean[]> {
  /**
   * Creates an instance of YesNoMultiController
   * @param question The multi-statement yes/no question
   */
  constructor(question: YesNoMultiQuestion) {
    // Create the validator and pass it to the base controller
    const validator = new YesNoMultiValidator(question);
    super(question, validator);
  }
  
  /**
   * Gets all statements in the question
   * @returns Array of statements
   */
  getStatements(): YesNoStatement[] {
    return this.question.statements;
  }
  
  /**
   * Gets the array of correct answers
   * @returns Array of boolean values representing correct answers
   */
  getCorrectAnswers(): boolean[] {
    return this.question.correctAnswers;
  }
  
  /**
   * Checks if a specific statement's answer is correct
   * @param index The index of the statement
   * @param answer The answer to check
   * @returns True if the answer is correct for that statement
   */
  isStatementAnswerCorrect(index: number, answer: boolean): boolean {
    if (index < 0 || index >= this.question.correctAnswers.length) {
      return false;
    }
    return answer === this.question.correctAnswers[index];
  }
  
  /**
   * Creates an initial empty answer array with nulls
   * @returns An array with null values for each statement
   */
  createInitialAnswer(): boolean[] {
    // Return an array filled with nulls matching the length of statements
    return new Array(this.question.statements.length).fill(null);
  }
}
