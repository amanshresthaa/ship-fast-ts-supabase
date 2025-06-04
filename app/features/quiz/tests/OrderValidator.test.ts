import { OrderQuestion } from "@/app/types/quiz";
import { OrderValidator } from "../validators/OrderValidator";

describe('OrderValidator', () => {
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

  let validator: OrderValidator;

  beforeEach(() => {
    validator = new OrderValidator(mockQuestion);
  });

  describe('isComplete', () => {
    it('should return true when all items are ordered', () => {
      const userAnswer = { 'slot_0': 'i1', 'slot_1': 'i2', 'slot_2': 'i3', 'slot_3': 'i4' };
      expect(validator.isComplete(userAnswer)).toBe(true);
    });

    it('should return false when not all items are ordered', () => {
      const userAnswer = { 'slot_0': 'i1', 'slot_1': 'i2', 'slot_2': 'i3' } as any;
      expect(validator.isComplete(userAnswer)).toBe(false);
    });

    it('should return false when answer is null or undefined', () => {
      expect(validator.isComplete(null as any)).toBe(false);
      expect(validator.isComplete(undefined as any)).toBe(false);
    });

    it('should return false when answer is not an object', () => {
      expect(validator.isComplete('string' as any)).toBe(false);
    });
  });

  describe('getCorrectnessMap', () => {
    it('should mark items in correct positions as true', () => {
      const userAnswer = {
        'slot_0': 'i2',
        'slot_1': 'i4',
        'slot_2': 'i1',
        'slot_3': 'i3'
      };
      const correctnessMap = validator.getCorrectnessMap(userAnswer);

      expect(correctnessMap['slot_0']).toBe(true);
      expect(correctnessMap['slot_1']).toBe(true);
      expect(correctnessMap['slot_2']).toBe(true);
      expect(correctnessMap['slot_3']).toBe(true);
    });

    it('should mark items in incorrect positions as false', () => {
      const userAnswer = { 'slot_0': 'i1', 'slot_1': 'i2', 'slot_2': 'i3', 'slot_3': 'i4' };
      const correctnessMap = validator.getCorrectnessMap(userAnswer);

      expect(correctnessMap['slot_0']).toBe(false);
      expect(correctnessMap['slot_1']).toBe(false);
      expect(correctnessMap['slot_2']).toBe(false);
      expect(correctnessMap['slot_3']).toBe(false);
    });

    it('should mark some items correct and others incorrect', () => {
      const userAnswer = { 'slot_0': 'i2', 'slot_1': 'i1', 'slot_2': 'i4', 'slot_3': 'i3' };
      const correctnessMap = validator.getCorrectnessMap(userAnswer);

      expect(correctnessMap['slot_0']).toBe(true);  // Correct position
      expect(correctnessMap['slot_1']).toBe(false); // Wrong position
      expect(correctnessMap['slot_2']).toBe(false); // Wrong position
      expect(correctnessMap['slot_3']).toBe(true);  // Correct position
    });

    it('should return empty map when answer is null or undefined', () => {
      expect(Object.keys(validator.getCorrectnessMap(null as any)).length).toBe(0);
      expect(Object.keys(validator.getCorrectnessMap(undefined as any)).length).toBe(0);
    });

    it('should return empty map when answer is not an object', () => {
      expect(Object.keys(validator.getCorrectnessMap('string' as any)).length).toBe(0);
    });
  });

  // Test the inherited methods via the validator instance
  describe('getCorrectnessScore', () => {
    it('should return 1 for completely correct answers', () => {
      const userAnswer = { 'slot_0': 'i2', 'slot_1': 'i4', 'slot_2': 'i1', 'slot_3': 'i3' };
      expect(validator.getCorrectnessScore(userAnswer)).toBe(1);
    });
    
    it('should return 0.5 for partially correct answers', () => {
      const userAnswer = { 'slot_0': 'i2', 'slot_1': 'i1', 'slot_2': 'i4', 'slot_3': 'i3' };
      expect(validator.getCorrectnessScore(userAnswer)).toBe(0.5);
    });
    
    it('should return 0 for completely incorrect answers', () => {
      const userAnswer = { 'slot_0': 'i3', 'slot_1': 'i1', 'slot_2': 'i4', 'slot_3': 'i2' };
      expect(validator.getCorrectnessScore(userAnswer)).toBe(0);
    });
  });
  
  describe('isCorrect', () => {
    it('should return true for completely correct answers', () => {
      const userAnswer = { 'slot_0': 'i2', 'slot_1': 'i4', 'slot_2': 'i1', 'slot_3': 'i3' };
      expect(validator.isCorrect(userAnswer)).toBe(true);
    });
    
    it('should return false for partially correct answers', () => {
      const userAnswer = { 'slot_0': 'i2', 'slot_1': 'i1', 'slot_2': 'i4', 'slot_3': 'i3' };
      expect(validator.isCorrect(userAnswer)).toBe(false);
    });
    
    it('should return false for completely incorrect answers', () => {
      const userAnswer = { 'slot_0': 'i3', 'slot_1': 'i1', 'slot_2': 'i4', 'slot_3': 'i2' };
      expect(validator.isCorrect(userAnswer)).toBe(false);
    });
  });
});
