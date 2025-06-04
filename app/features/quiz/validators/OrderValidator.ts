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
    // If no answer object or no items in question, nothing is complete
    if (!answer || typeof answer !== 'object' || this.question.correctOrder.length === 0) {
      return false;
    }
    
    // Check if we have the right number of slots and none are null
    const slotCount = this.question.correctOrder.length;
    let filledSlots = 0;

    for (let i = 0; i < slotCount; i++) {
      const slotKey = `slot_${i}`;
      const value = answer[slotKey];
      if (typeof value === 'string' && value.trim() !== '') {
        filledSlots++;
      }
    }

    return filledSlots === slotCount;
  }
  
  /**
   * Validates which items are in the correct slots based on the question's correctOrder
   * @param answer Record mapping slots to item_ids
   * @returns Map with entries for each item's correctness
   */
  getCorrectnessMap(answer: OrderQuestionAnswer): CorrectnessMap {
    const correctnessMap: CorrectnessMap = {};

    if (!answer || typeof answer !== 'object') {
      return correctnessMap;
    }

    const slotCount = this.question.correctOrder.length;
    for (let i = 0; i < slotCount; i++) {
      const slotKey = `slot_${i}`;
      const placedItemId = answer[slotKey];
      if (typeof placedItemId !== 'string') {
        correctnessMap[slotKey] = false;
        continue;
      }
      correctnessMap[slotKey] = placedItemId === this.question.correctOrder[i];
    }

    return correctnessMap;
  }
}
