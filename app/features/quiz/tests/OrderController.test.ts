import { OrderQuestion } from "@/app/types/quiz";
import { OrderController } from "../controllers/OrderController";

describe('OrderController', () => {
  // Create a mock question for testing
  const mockQuestion: OrderQuestion = {
    id: 'q1',
    type: 'order',
    question: 'Place these items in the correct order',
    points: 10,
    quiz_tag: 'test-quiz',
    difficulty: 'medium',
    feedback_correct: 'Good job!',
    feedback_incorrect: 'Try again!',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    items: [
      { item_id: 'i1', text: 'Item 1' },
      { item_id: 'i2', text: 'Item 2' },
      { item_id: 'i3', text: 'Item 3' },
      { item_id: 'i4', text: 'Item 4' },
    ],
    correctOrder: ['i2', 'i4', 'i1', 'i3']
  };

  let controller: OrderController;

  beforeEach(() => {
    controller = new OrderController(mockQuestion);
  });

  describe('constructor', () => {
    it('should properly initialize with a question', () => {
      expect(controller.getQuestion()).toBe(mockQuestion);
    });
  });

  describe('getItems', () => {
    it('should return all items from the question', () => {
      const items = controller.getItems();
      expect(items).toHaveLength(4);
      expect(items).toEqual(mockQuestion.items);
    });
  });

  describe('getCorrectOrder', () => {
    it('should return the correct order from the question', () => {
      const correctOrder = controller.getCorrectOrder();
      expect(correctOrder).toHaveLength(4);
      expect(correctOrder).toEqual(mockQuestion.correctOrder);
    });
  });

  describe('isItemInCorrectPosition', () => {
    it('should return true for items in correct positions', () => {
      expect(controller.isItemInCorrectPosition('i2', 0)).toBe(true);
      expect(controller.isItemInCorrectPosition('i4', 1)).toBe(true);
      expect(controller.isItemInCorrectPosition('i1', 2)).toBe(true);
      expect(controller.isItemInCorrectPosition('i3', 3)).toBe(true);
    });

    it('should return false for items in incorrect positions', () => {
      expect(controller.isItemInCorrectPosition('i1', 0)).toBe(false);
      expect(controller.isItemInCorrectPosition('i2', 1)).toBe(false);
      expect(controller.isItemInCorrectPosition('i3', 0)).toBe(false);
      expect(controller.isItemInCorrectPosition('i4', 3)).toBe(false);
    });

    it('should return false for invalid positions', () => {
      expect(controller.isItemInCorrectPosition('i1', -1)).toBe(false);
      expect(controller.isItemInCorrectPosition('i1', 4)).toBe(false);
    });
  });

  describe('isAnswerComplete', () => {
    it('should return true when all items are ordered', () => {
      const userAnswer = ['i1', 'i2', 'i3', 'i4']; // All items present
      expect(controller.isAnswerComplete(userAnswer)).toBe(true);
    });

    it('should return false when not all items are ordered', () => {
      const userAnswer = ['i1', 'i2', 'i3']; // Missing an item
      expect(controller.isAnswerComplete(userAnswer)).toBe(false);
    });
  });

  describe('validateAnswer', () => {
    it('should return correctness map for each item', () => {
      const userAnswer = ['i2', 'i1', 'i4', 'i3']; // i2 and i3 are in correct positions
      const correctnessMap = controller.validateAnswer(userAnswer);
      
      expect(correctnessMap['i2']).toBe(true);
      expect(correctnessMap['i1']).toBe(false);
      expect(correctnessMap['i4']).toBe(false);
      expect(correctnessMap['i3']).toBe(true);
    });
  });
});
