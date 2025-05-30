import { OrderQuestion, OrderQuestionAnswer } from '@/app/types/quiz';
import { AnswerValidator, CorrectnessMap } from './AnswerValidator';

/**
 * Validator for order questions
 * Works with OrderQuestionAnswer type (Record<string, string | null>)
 * where keys are slot names (e.g., "slot_0", "slot_1") and values are item_ids or null
 */
export class OrderValidator extends AnswerValidator<OrderQuestion, OrderQuestionAnswer> {
  /**
   * Checks if user has filled all slots
   * @param answer Record mapping slots to item_ids
   * @returns True if all slots have items assigned (no null values)
   */
  isComplete(answer: OrderQuestionAnswer): boolean {
    // If no answer object, it's not complete
    if (!answer || typeof answer !== 'object') {
      return false;
    }
    
    // If no items in question, then empty answer is complete
    if (this.question.correctOrder.length === 0) {
      return true;
    }
    
    // Check if we have the right number of slots and none are null
    const slotCount = this.question.correctOrder.length;
    let filledSlots = 0;
    
    for (let i = 0; i < slotCount; i++) {
      const slotKey = `slot_${i}`;
      if (answer[slotKey] !== undefined && answer[slotKey] !== null) {
        filledSlots++;
      }
    }
    
    return filledSlots === slotCount;
  }
  
  /**
   * Validates which items are in the correct slots based on the question's correctOrder
   * @param answer Record mapping slots to item_ids
   * @returns Map with entries for each slot's correctness
   */
  getCorrectnessMap(answer: OrderQuestionAnswer): CorrectnessMap {
    const correctnessMap: CorrectnessMap = {};
    
    // If no answer object, return empty map
    if (!answer || typeof answer !== 'object') {
      return correctnessMap;
    }
    
    // Check each slot against the correctOrder
    this.question.correctOrder.forEach((correctItemId, index) => {
      const slotKey = `slot_${index}`;
      const placedItemId = answer[slotKey];
      
      // Mark the slot as correct or incorrect
      const isCorrect = placedItemId === correctItemId;
      correctnessMap[slotKey] = isCorrect;
    });
    
    return correctnessMap;
  }

  /**
   * For order questions, we use all-or-nothing scoring
   * The user must get all items in the correct order to receive points
   * @param answer The answer to score
   * @returns 1 if completely correct, 0 otherwise
   */
  getCorrectnessScore(answer: OrderQuestionAnswer): number {
    // If no items to order, perfect score
    if (this.question.correctOrder.length === 0) {
      return 1;
    }
    
    // Check if answer is complete first
    if (!this.isComplete(answer)) {
      return 0;
    }
    
    // Check if all items are in correct positions
    const correctnessMap = this.getCorrectnessMap(answer);
    const allCorrect = Object.values(correctnessMap).every(isCorrect => isCorrect);
    
    return allCorrect ? 1 : 0;
  }
}
