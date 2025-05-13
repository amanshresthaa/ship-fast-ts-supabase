import { SingleSelectionQuestion } from '@/app/types/quiz';
import { AnswerValidator, CorrectnessMap } from './AnswerValidator';

/**
 * Validator for single selection questions
 * Works with string answer type (the selected option ID)
 */
export class SingleSelectionValidator extends AnswerValidator<SingleSelectionQuestion, string | null> {
  /**
   * Checks if a selection has been made
   * @param selectedOptionId The selected option ID or null
   * @returns True if an option has been selected
   */
  isComplete(selectedOptionId: string | null): boolean {
    return selectedOptionId !== null && selectedOptionId !== undefined && selectedOptionId !== '';
  }
  
  /**
   * Validates if the selected option is correct
   * @param selectedOptionId The selected option ID or null
   * @returns Map with a single entry for the selected option's correctness
   */
  getCorrectnessMap(selectedOptionId: string | null): CorrectnessMap {
    // If no selection, nothing is correct
    if (!selectedOptionId) {
      return { 'answer': false };
    }
    
    // Check if selected option matches the correct answer
    const isCorrect = selectedOptionId === this.question.correctAnswerOptionId;
    
    // Return a map with the selected option ID as key
    return { [selectedOptionId]: isCorrect };
  }
}
