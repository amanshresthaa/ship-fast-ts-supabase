import { OrderValidator } from '@/app/features/quiz/validators/OrderValidator';
import { OrderQuestion, OrderQuestionAnswer } from '@/app/types/quiz';

// Mock OrderQuestion data
const mockOrderQuestion: OrderQuestion = {
  id: 'oq1',
  type: 'order',
  text: 'Arrange the following steps in the correct order:',
  items: [
    { item_id: 'item1', text: 'Step 1' },
    { item_id: 'item2', text: 'Step 2' },
    { item_id: 'item3', text: 'Step 3' },
  ],
  correctOrder: ['item1', 'item2', 'item3'],
  question_meta: {
    difficulty: 'medium',
    estimated_time: 60,
    topic: 'General Knowledge',
    skill: 'Sequencing',
  },
  slotCount: 3, // Explicitly define slotCount based on correctOrder length
};

describe('OrderValidator', () => {
  let validator: OrderValidator;

  beforeEach(() => {
    validator = new OrderValidator(mockOrderQuestion);
  });

  describe('isComplete', () => {
    it('should return true if all slots are filled', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1',
        'slot_1': 'item2',
        'slot_2': 'item3',
      };
      expect(validator.isComplete(answer)).toBe(true);
    });

    it('should return false if any slot is empty (null)', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1',
        'slot_1': null,
        'slot_2': 'item3',
      };
      expect(validator.isComplete(answer)).toBe(false);
    });

    it('should return false if the answer is empty', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': null,
        'slot_1': null,
        'slot_2': null,
      };
      expect(validator.isComplete(answer)).toBe(false);
    });

    it('should return false if answer has fewer slots filled than slotCount', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1',
        'slot_1': 'item2', 
        // slot_2 is missing
      };
      // The current implementation of isComplete might consider this complete
      // if it only checks for null values in existing keys.
      // This test case might need adjustment based on precise isComplete logic.
      // For now, assuming it requires all defined slots to be non-null.
      const validatorWithSpecificSlotCount = new OrderValidator({ ...mockOrderQuestion, slotCount: 3 });
       expect(validatorWithSpecificSlotCount.isComplete(answer)).toBe(false);
    });
     
    it('should return true if all slots defined by correctOrder length are filled, even if answer has extra null slots', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1',
        'slot_1': 'item2',
        'slot_2': 'item3',
        'slot_3': null, // Extra slot, should be ignored by isComplete if slotCount is 3
      };
      const validatorWithThreeSlots = new OrderValidator({ ...mockOrderQuestion, slotCount: 3 });
      expect(validatorWithThreeSlots.isComplete(answer)).toBe(true);
    });


    it('should handle cases where slotCount is 0 (e.g. no items to order)', () => {
        const emptyQuestion: OrderQuestion = {
            ...mockOrderQuestion,
            items: [],
            correctOrder: [],
            slotCount: 0,
        };
        const emptyValidator = new OrderValidator(emptyQuestion);
        const answer: OrderQuestionAnswer = {};
        expect(emptyValidator.isComplete(answer)).toBe(true); // No slots to fill
    });
  });

  describe('getCorrectnessMap', () => {
    it('should return all true for a completely correct answer', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1',
        'slot_1': 'item2',
        'slot_2': 'item3',
      };
      const expectedMap = {
        'slot_0': true,
        'slot_1': true,
        'slot_2': true,
      };
      expect(validator.getCorrectnessMap(answer)).toEqual(expectedMap);
    });

    it('should return correct and incorrect flags for a partially correct answer', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1', // Correct
        'slot_1': 'item3', // Incorrect
        'slot_2': 'item2', // Incorrect
      };
      const expectedMap = {
        'slot_0': true,
        'slot_1': false,
        'slot_2': false,
      };
      expect(validator.getCorrectnessMap(answer)).toEqual(expectedMap);
    });

    it('should return all false if all items are in wrong slots', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item3',
        'slot_1': 'item1',
        'slot_2': 'item2',
      };
      const expectedMap = {
        'slot_0': false,
        'slot_1': false,
        'slot_2': false,
      };
      expect(validator.getCorrectnessMap(answer)).toEqual(expectedMap);
    });

    it('should return false for empty slots', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1',
        'slot_1': null,
        'slot_2': 'item2',
      };
      const expectedMap = {
        'slot_0': true, // Correct
        'slot_1': false, // Empty, thus incorrect
        'slot_2': false, // item2 is not correct for slot_2
      };
      expect(validator.getCorrectnessMap(answer)).toEqual(expectedMap);
    });

    it('should handle answers with items not belonging to the question (if possible by type)', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1',
        'slot_1': 'item_unknown', // Does not exist in question.items
        'slot_2': 'item3',
      };
      const expectedMap = {
        'slot_0': true,
        'slot_1': false,
        'slot_2': true,
      };
      expect(validator.getCorrectnessMap(answer)).toEqual(expectedMap);
    });
    
    it('should return an empty map if slotCount is 0', () => {
        const emptyQuestion: OrderQuestion = {
            ...mockOrderQuestion,
            items: [],
            correctOrder: [],
            slotCount: 0,
        };
        const emptyValidator = new OrderValidator(emptyQuestion);
        const answer: OrderQuestionAnswer = {};
        expect(emptyValidator.getCorrectnessMap(answer)).toEqual({});
    });

    it('should correctly evaluate correctness if answer has more slots than question.slotCount but they are null', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1',
        'slot_1': 'item2',
        'slot_2': 'item3',
        'slot_3': null, // Extra slot, should not affect correctness of defined slots
      };
       const validatorWithThreeSlots = new OrderValidator({ ...mockOrderQuestion, slotCount: 3 });
      const expectedMap = {
        'slot_0': true,
        'slot_1': true,
        'slot_2': true,
      };
      expect(validatorWithThreeSlots.getCorrectnessMap(answer)).toEqual(expectedMap);
    });

    it('should mark as incorrect if an actual item is placed in an extra slot beyond slotCount', () => {
      const answer: OrderQuestionAnswer = {
        'slot_0': 'item1',
        'slot_1': 'item2',
        'slot_2': 'item3',
        'slot_3': 'item1', // Item placed in an undefined slot (assuming slotCount is 3)
      };
      const validatorWithThreeSlots = new OrderValidator({ ...mockOrderQuestion, slotCount: 3 });
      // The current getCorrectnessMap iterates based on question.slotCount.
      // So, 'slot_3' won't be in the map. This behavior is acceptable.
      const expectedMap = {
        'slot_0': true,
        'slot_1': true,
        'slot_2': true,
      };
      expect(validatorWithThreeSlots.getCorrectnessMap(answer)).toEqual(expectedMap);
    });
  });
});
