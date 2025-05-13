import { MultiChoiceQuestion } from '@/app/types/quiz';
import { AnswerValidator, CorrectnessMap } from './AnswerValidator';

/**
 * Validator for multi-choice questions
 * Works with string[] answer type (the selected option IDs)
 */
export class MultiChoiceValidator extends AnswerValidator<MultiChoiceQuestion, string[]> {
  /**
   * Checks if the required number of selections has been made
   * @param selectedOptionIds Array of selected option IDs
   * @returns True if the correct number of options has been selected
   */
  isComplete(selectedOptionIds: string[]): boolean {
    // Empty selections array is always incomplete
    if (!selectedOptionIds) return false;
    
    // Check if the user has selected the required number of options
    return selectedOptionIds.length === this.question.correctAnswerOptionIds.length;
  }
  
  /**
   * Validates which selected options are correct
   * @param selectedOptionIds Array of selected option IDs
   * @returns Map with entries for each selected option's correctness
   */
  getCorrectnessMap(selectedOptionIds: string[]): CorrectnessMap {
    const correctnessMap: CorrectnessMap = {};
    
    // If no selections, return empty map
    if (!selectedOptionIds || selectedOptionIds.length === 0) {
      return correctnessMap;
    }
    
    // Check each selected option against the correct answers
    selectedOptionIds.forEach(optionId => {
      correctnessMap[optionId] = this.question.correctAnswerOptionIds.includes(optionId);
    });
    
    return correctnessMap;
  }
}
