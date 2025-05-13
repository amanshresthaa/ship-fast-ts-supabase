import { DropdownSelectionQuestion } from '@/app/types/quiz';
import { QuestionController } from './QuestionController';
import { DropdownSelectionValidator } from '../validators/DropdownSelectionValidator';

/**
 * Controller for dropdown selection questions
 * Manages state and validation for questions where the user selects options from dropdowns
 */
export class DropdownSelectionController extends QuestionController<
  DropdownSelectionQuestion, 
  Record<string, string | null>
> {
  /**
   * Creates an instance of DropdownSelectionController
   * @param question The dropdown selection question
   */
  constructor(question: DropdownSelectionQuestion) {
    // Create the validator and pass it to the base controller
    const validator = new DropdownSelectionValidator(question);
    super(question, validator);
  }
  
  /**
   * Gets the correct text for a specific placeholder
   * @param placeholderKey The placeholder key
   * @returns The correct option text or null if placeholder not found
   */
  getCorrectOptionForPlaceholder(placeholderKey: string): string | null {
    return this.question.placeholderTargets[placeholderKey]?.correctOptionText || null;
  }
  
  /**
   * Gets all placeholder keys in the question
   * @returns Array of placeholder keys
   */
  getPlaceholderKeys(): string[] {
    return Object.keys(this.question.placeholderTargets || {});
  }
  
  /**
   * Checks if a specific selection for a placeholder is correct
   * @param placeholderKey The placeholder key
   * @param selectedText The selected option text
   * @returns True if the selection is correct
   */
  isSelectionCorrect(placeholderKey: string, selectedText: string | null): boolean {
    if (!selectedText) return false;
    
    const correctText = this.getCorrectOptionForPlaceholder(placeholderKey);
    return selectedText === correctText;
  }
}
