import { OrderController } from '@/app/features/quiz/controllers/OrderController';
import { OrderQuestion, OrderQuestionAnswer, OrderItem } from '@/app/types/quiz';

const mockOrderQuestion: OrderQuestion = {
  id: 'oq1',
  type: 'order',
  text: 'Arrange the steps:',
  items: [
    { item_id: 'itemA', text: 'Step A' },
    { item_id: 'itemB', text: 'Step B' },
    { item_id: 'itemC', text: 'Step C' },
  ],
  correctOrder: ['itemA', 'itemB', 'itemC'],
  question_meta: {
    difficulty: 'easy',
    estimated_time: 30,
    topic: 'Process',
    skill: 'Ordering'
  },
  // slotCount is implicitly defined by correctOrder.length in the controller
};

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(() => {
    controller = new OrderController(mockOrderQuestion);
  });

  describe('getSlotCount', () => {
    it('should return the length of the correctOrder array', () => {
      expect(controller.getSlotCount()).toBe(3);
    });

    it('should return 0 if correctOrder is empty', () => {
      const emptyQuestion: OrderQuestion = { ...mockOrderQuestion, correctOrder: [], items: [] };
      const emptyController = new OrderController(emptyQuestion);
      expect(emptyController.getSlotCount()).toBe(0);
    });
  });

  describe('getCorrectItemForSlot', () => {
    it('should return the correct item ID for a given slot index', () => {
      expect(controller.getCorrectItemForSlot(0)).toBe('itemA');
      expect(controller.getCorrectItemForSlot(1)).toBe('itemB');
      expect(controller.getCorrectItemForSlot(2)).toBe('itemC');
    });

    it('should return null if the slot index is out of bounds', () => {
      expect(controller.getCorrectItemForSlot(3)).toBeNull();
      expect(controller.getCorrectItemForSlot(-1)).toBeNull();
    });
  });

  describe('isItemCorrectlyPlacedInSlot', () => {
    it('should return true if the item ID matches the correct item for that slot', () => {
      expect(controller.isItemCorrectlyPlacedInSlot(0, 'itemA')).toBe(true);
      expect(controller.isItemCorrectlyPlacedInSlot(1, 'itemB')).toBe(true);
    });

    it('should return false if the item ID does not match', () => {
      expect(controller.isItemCorrectlyPlacedInSlot(0, 'itemB')).toBe(false);
    });

    it('should return false if the item ID is null', () => {
      expect(controller.isItemCorrectlyPlacedInSlot(0, null)).toBe(false);
    });

    it('should return false if the slot index is out of bounds', () => {
      expect(controller.isItemCorrectlyPlacedInSlot(3, 'itemA')).toBe(false);
    });
  });

  describe('createInitialAnswer', () => {
    it('should return an object with null values for each slot', () => {
      const expectedInitialAnswer: OrderQuestionAnswer = {
        'slot_0': null,
        'slot_1': null,
        'slot_2': null,
      };
      expect(controller.createInitialAnswer()).toEqual(expectedInitialAnswer);
    });

    it('should return an empty object if slotCount is 0', () => {
      const emptyQuestion: OrderQuestion = { ...mockOrderQuestion, correctOrder: [], items: [] };
      const emptyController = new OrderController(emptyQuestion);
      expect(emptyController.createInitialAnswer()).toEqual({});
    });
  });
  
  describe('isAnswerComplete', () => {
    it('should return true if all slots in the answer are filled (not null)', () => {
      const completeAnswer: OrderQuestionAnswer = {
        'slot_0': 'itemA',
        'slot_1': 'itemB',
        'slot_2': 'itemC',
      };
      expect(controller.isAnswerComplete(completeAnswer)).toBe(true);
    });

    it('should return false if any slot in the answer is null', () => {
      const incompleteAnswer: OrderQuestionAnswer = {
        'slot_0': 'itemA',
        'slot_1': null,
        'slot_2': 'itemC',
      };
      expect(controller.isAnswerComplete(incompleteAnswer)).toBe(false);
    });

    it('should return false if the answer object does not have all necessary slot keys', () => {
      const partialAnswer: OrderQuestionAnswer = {
        'slot_0': 'itemA',
        'slot_1': 'itemB',
        // slot_2 is missing
      };
      expect(controller.isAnswerComplete(partialAnswer)).toBe(false);
    });

    it('should return true for an empty answer if slotCount is 0', () => {
      const emptyQuestion: OrderQuestion = { ...mockOrderQuestion, correctOrder: [], items: [] };
      const emptyController = new OrderController(emptyQuestion);
      expect(emptyController.isAnswerComplete({})).toBe(true);
    });

    it('should return true if all necessary slots are filled, even if extra slots with null values exist in answer', () => {
      const answerWithExtraNullSlot: OrderQuestionAnswer = {
        'slot_0': 'itemA',
        'slot_1': 'itemB',
        'slot_2': 'itemC',
        'slot_3': null, 
      };
      expect(controller.isAnswerComplete(answerWithExtraNullSlot)).toBe(true);
    });

    it('should return false if an extra slot (beyond slotCount) has a non-null value', () => {
      // This scenario implies an inconsistency, as the answer structure should ideally only contain keys up to slotCount-1.
      // However, if such an answer is provided, isAnswerComplete should ideally be robust.
      // The current implementation of isAnswerComplete iterates up to controller.getSlotCount(),
      // so it wouldn't naturally check 'slot_3' if slotCount is 3. 
      // This test confirms that behavior: it is considered complete based on the defined slots.
      const answerWithExtraFilledSlot: OrderQuestionAnswer = {
        'slot_0': 'itemA',
        'slot_1': 'itemB',
        'slot_2': 'itemC',
        'slot_3': 'itemExtra', 
      };
      expect(controller.isAnswerComplete(answerWithExtraFilledSlot)).toBe(true);
    });
  });

  describe('getCorrectOrder (inherited from QuestionController)', () => {
    it('should return the correctOrder array from the question definition', () => {
      expect(controller.getCorrectOrder()).toEqual(['itemA', 'itemB', 'itemC']);
    });
  });

  describe('getScore (inherited from QuestionController)', () => {
    it('should return 1 if the answer is completely correct', () => {
      const correctAnswer: OrderQuestionAnswer = {
        'slot_0': 'itemA',
        'slot_1': 'itemB',
        'slot_2': 'itemC',
      };
      expect(controller.getScore(correctAnswer)).toBe(1);
    });

    it('should return 0 if the answer is partially correct', () => {
      const partiallyCorrectAnswer: OrderQuestionAnswer = {
        'slot_0': 'itemA', // Correct
        'slot_1': 'itemC', // Incorrect
        'slot_2': 'itemB', // Incorrect
      };
      expect(controller.getScore(partiallyCorrectAnswer)).toBe(0);
    });

    it('should return 0 if the answer is completely incorrect', () => {
      const incorrectAnswer: OrderQuestionAnswer = {
        'slot_0': 'itemC',
        'slot_1': 'itemA',
        'slot_2': 'itemB',
      };
      expect(controller.getScore(incorrectAnswer)).toBe(0);
    });

    it('should return 0 if the answer is incomplete (some slots are null)', () => {
      const incompleteAnswer: OrderQuestionAnswer = {
        'slot_0': 'itemA',
        'slot_1': null,
        'slot_2': 'itemC',
      };
      expect(controller.getScore(incompleteAnswer)).toBe(0);
    });

    it('should return 1 if slotCount is 0 and answer is empty', () => {
        const emptyQuestion: OrderQuestion = { ...mockOrderQuestion, correctOrder: [], items: [] };
        const emptyController = new OrderController(emptyQuestion);
        expect(emptyController.getScore({})).toBe(1); // Correctly ordered nothing
    });
  });
});
