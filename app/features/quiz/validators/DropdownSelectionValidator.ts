import { DropdownSelectionQuestion } from '@/app/types/quiz';
import { AnswerValidator, CorrectnessMap } from './AnswerValidator';

/**
 * Validator for dropdown selection questions
 * Works with Record<string, string | null> answer type (mapping placeholder keys to selected option text)
 */
export class DropdownSelectionValidator extends AnswerValidator<
  DropdownSelectionQuestion, 
  Record<string, string | null>
> {
  /**
   * Checks if all dropdowns have selections
   * @param selections Object mapping placeholder keys to selected option text
   * @returns True if all placeholders have selections
   */
  isComplete(selections: Record<string, string | null>): boolean {
    // If no selections object or no placeholder targets, nothing is complete
    if (!selections || !this.question.placeholderTargets || Object.keys(this.question.placeholderTargets).length === 0) {
      return false;
    }
    
    // Check that every placeholder target has a non-null value selected
    return Object.keys(this.question.placeholderTargets).every(key => 
      key in selections && 
      selections[key] !== null && 
      selections[key] !== undefined && 
      selections[key] !== ""
    );
  }
  
  /**
   * Validates which selections are correct
   * @param selections Object mapping placeholder keys to selected option text
   * @returns Map with entries for each placeholder's correctness
   */
  getCorrectnessMap(selections: Record<string, string | null>): CorrectnessMap {
    const correctnessMap: CorrectnessMap = {};
    
    // If no selections or no placeholder targets, return empty map
    if (!selections || !this.question.placeholderTargets) {
      return correctnessMap;
    }
    
    // Check each placeholder against its correct answer
    Object.keys(this.question.placeholderTargets).forEach(placeholderKey => {
      const selectedText = selections[placeholderKey];
      const correctText = this.question.placeholderTargets[placeholderKey]?.correctOptionText;
      
      // Mark as correct if selected text matches correct text
      correctnessMap[placeholderKey] = selectedText === correctText;
    });
    
    return correctnessMap;
  }
}
