import { YesNoQuestion } from '@/app/types/quiz';
import { AnswerValidator, CorrectnessMap } from './AnswerValidator';

/**
 * Validator for yes/no questions
 * Works with boolean answer type (true for 'yes', false for 'no')
 */
export class YesNoValidator extends AnswerValidator<YesNoQuestion, boolean | null> {
  /**
   * Checks if an answer has been selected
   * @param answer The selected answer (true, false, or null)
   * @returns True if an answer has been selected
   */
  isComplete(answer: boolean | null): boolean {
    return answer !== null && answer !== undefined;
  }
  
  /**
   * Validates if the selected answer is correct
   * @param answer The selected answer (true, false, or null)
   * @returns Map with a single entry for the answer's correctness
   */
  getCorrectnessMap(answer: boolean | null): CorrectnessMap {
    // If no selection, nothing is correct
    if (answer === null || answer === undefined) {
      return { 'answer': false };
    }
    
    // Check if selected answer matches the correct answer
    const isCorrect = answer === this.question.correctAnswer;
    
    // Return a map with a key based on the answer
    return { [answer ? 'yes' : 'no']: isCorrect };
  }
}
