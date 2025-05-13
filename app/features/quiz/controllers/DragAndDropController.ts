import { DragAndDropQuestion, DragAndDropOption, DragAndDropTarget } from '@/app/types/quiz';
import { QuestionController } from './QuestionController';
import { DragAndDropValidator } from '../validators/DragAndDropValidator';

/**
 * Controller for drag and drop questions
 * Manages state and validation for questions where the user drags options to targets
 */
export class DragAndDropController extends QuestionController<
  DragAndDropQuestion, 
  Record<string, string | null>
> {
  /**
   * Creates an instance of DragAndDropController
   * @param question The drag and drop question
   */
  constructor(question: DragAndDropQuestion) {
    // Create the validator and pass it to the base controller
    const validator = new DragAndDropValidator(question);
    super(question, validator);
  }
  
  /**
   * Gets all targets in the question
   * @returns Array of targets
   */
  getTargets(): DragAndDropTarget[] {
    return this.question.targets;
  }
  
  /**
   * Gets all options in the question
   * @returns Array of options
   */
  getOptions(): DragAndDropOption[] {
    return this.question.options;
  }
  
  /**
   * Gets the correct option ID for a specific target
   * @param targetId The target ID
   * @returns The correct option ID or null if not found
   */
  getCorrectOptionForTarget(targetId: string): string | null {
    const correctPair = this.question.correctPairs.find(pair => pair.target_id === targetId);
    return correctPair ? correctPair.option_id : null;
  }
  
  /**
   * Checks if a specific placement is correct
   * @param targetId The target ID
   * @param optionId The option ID
   * @returns True if the placement is correct
   */
  isPlacementCorrect(targetId: string, optionId: string | null): boolean {
    if (!optionId) return false;
    
    const correctPair = this.question.correctPairs.find(pair => 
      pair.target_id === targetId && pair.option_id === optionId
    );
    
    return !!correctPair;
  }
  
  /**
   * Gets the available options not yet placed in targets
   * @param placedAnswers The current state of option placements
   * @returns Array of options that are still available
   */
  getAvailableOptions(placedAnswers: Record<string, string | null>): DragAndDropOption[] {
    // Get all placed option IDs
    const placedOptionIds = Object.values(placedAnswers).filter(Boolean) as string[];
    
    // Return options that aren't placed anywhere
    return this.question.options.filter(option => 
      !placedOptionIds.includes(option.option_id)
    );
  }
  
  /**
   * Creates an initial empty answers object with all targets set to null
   * @returns Initial answers object
   */
  createInitialAnswers(): Record<string, string | null> {
    const initialAnswers: Record<string, string | null> = {};
    this.question.targets.forEach(target => {
      initialAnswers[target.target_id] = null;
    });
    return initialAnswers;
  }
}
