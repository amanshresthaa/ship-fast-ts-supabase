import { OrderQuestion, OrderItem, OrderQuestionAnswer } from '@/app/types/quiz';
import { QuestionController } from './QuestionController';
import { OrderValidator } from '../validators/OrderValidator';

/**
 * Controller for order questions
 * Manages state and validation for questions where the user arranges items in the correct sequence
 */
export class OrderController extends QuestionController<OrderQuestion, OrderQuestionAnswer> {
  /**
   * Creates an instance of OrderController
   * @param question The order question
   */
  constructor(question: OrderQuestion) {
    // Create the validator and pass it to the base controller
    const validator = new OrderValidator(question);
    super(question, validator);
  }
  
  /**
   * Gets all items in the question
   * @returns Array of items
   */
  getItems(): OrderItem[] {
    return this.question.items;
  }
  
  /**
   * Gets the correct order of item IDs
   * @returns Array of item IDs in the correct order
   */
  getCorrectOrder(): string[] {
    return this.question.correctOrder;
  }

  /**
   * Gets the number of slots needed for this question
   * @returns The number of slots
   */
  getSlotCount(): number {
    return this.question.correctOrder.length;
  }

  /**
   * Gets the correct item ID for a specific slot
   * @param slotIndex The zero-based index of the slot
   * @returns The correct item ID for the slot, or null if out of range
   */
  getCorrectItemForSlot(slotIndex: number): string | null {
    if (slotIndex < 0 || slotIndex >= this.question.correctOrder.length) {
      return null;
    }
    return this.question.correctOrder[slotIndex];
  }

  /**
   * Checks if an item is correctly placed in a slot
   * @param slotIndex The zero-based index of the slot
   * @param itemId The item ID to check, or null if the slot is empty
   * @returns True if the item is correct for the slot
   */
  isItemCorrectlyPlacedInSlot(slotIndex: number, itemId: string | null): boolean {
    // Empty slots are always incorrect
    if (itemId === null) {
      return false;
    }
    
    return slotIndex >= 0 && 
           slotIndex < this.question.correctOrder.length && 
           this.question.correctOrder[slotIndex] === itemId;
  }
  
  /**
   * Gets the correctness map for a given answer.
   * Delegates to the validator.
   * @param answer The answer to validate
   * @returns A record mapping slot keys to boolean indicating correctness, or null if not applicable.
   */
  getCorrectnessMap(answer: OrderQuestionAnswer): Record<string, boolean | null> {
    // Ensure the validator is an instance of OrderValidator
    if (this.validator instanceof OrderValidator) {
      return this.validator.getCorrectnessMap(answer);
    }
    // Fallback or error handling if validator is not the expected type
    // This should ideally not happen if constructor is correctly used
    console.error("Validator is not an instance of OrderValidator");
    const emptyMap: Record<string, boolean | null> = {};
    Object.keys(answer).forEach(key => {
      emptyMap[key] = null;
    });
    return emptyMap;
  }

  /**
   * Creates an initial empty answer with all slots set to null
   * @returns An object mapping slot names to null values
   */
  createInitialAnswer(): OrderQuestionAnswer {
    const answer: OrderQuestionAnswer = {};
    const slotCount = this.getSlotCount();
    
    for (let i = 0; i < slotCount; i++) {
      answer[`slot_${i}`] = null;
    }
    
    return answer;
  }
}
