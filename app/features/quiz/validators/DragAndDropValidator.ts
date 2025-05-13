import { DragAndDropQuestion } from '@/app/types/quiz';
import { AnswerValidator, CorrectnessMap } from './AnswerValidator';

/**
 * Validator for drag and drop questions
 * Works with Record<string, string | null> answer type (mapping target_id to option_id)
 */
export class DragAndDropValidator extends AnswerValidator<
  DragAndDropQuestion, 
  Record<string, string | null>
> {
  /**
   * Checks if all targets have options placed in them
   * @param placedAnswers Object mapping target_id to option_id
   * @returns True if all targets have options
   */
  isComplete(placedAnswers: Record<string, string | null>): boolean {
    // If no answers object or no targets, nothing is complete
    if (!placedAnswers || this.question.targets.length === 0) {
      return false;
    }
    
    // Check that every target has a valid non-null option assigned
    return this.question.targets.every(target => {
      const targetId = target.target_id;
      // Make sure the target exists in answers and has a non-null value
      return targetId in placedAnswers && 
        placedAnswers[targetId] !== null && 
        placedAnswers[targetId] !== undefined;
    });
  }
  
  /**
   * Validates which placements are correct based on the question's correctPairs
   * @param placedAnswers Object mapping target_id to option_id
   * @returns Map with entries for each target's correctness
   */
  getCorrectnessMap(placedAnswers: Record<string, string | null>): CorrectnessMap {
    const correctnessMap: CorrectnessMap = {};
    
    // If no answers, return empty map
    if (!placedAnswers) {
      return correctnessMap;
    }
    
    // Check each target against correct pairs
    this.question.targets.forEach(target => {
      const targetId = target.target_id;
      const placedOptionId = placedAnswers[targetId];
      
      if (placedOptionId) {
        // Find if this is a correct pairing
        const correctPair = this.question.correctPairs.find(pair => 
          pair.target_id === targetId && pair.option_id === placedOptionId
        );
        
        correctnessMap[targetId] = !!correctPair;
      } else {
        // If no option placed, it's not correct
        correctnessMap[targetId] = false;
      }
    });
    
    return correctnessMap;
  }
}
