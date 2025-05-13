import { SingleSelectionQuestion } from "@/app/types/quiz";
import { SingleSelectionValidator } from "../validators/SingleSelectionValidator";

describe('SingleSelectionValidator', () => {
  // Create a mock question for testing
  const mockQuestion: SingleSelectionQuestion = {
    id: 'q1',
    type: 'single_selection',
    question: 'Test question?',
    points: 10,
    quiz_tag: 'test-quiz',
    difficulty: 'medium',
    feedback_correct: 'Good job!',
    feedback_incorrect: 'Try again!',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    options: [
      { option_id: 'a', text: 'Option A' },
      { option_id: 'b', text: 'Option B' },
      { option_id: 'c', text: 'Option C' },
    ],
    correctAnswerOptionId: 'b'
  };

  let validator: SingleSelectionValidator;

  beforeEach(() => {
    validator = new SingleSelectionValidator(mockQuestion);
  });

  describe('isComplete', () => {
    it('should return true when an option is selected', () => {
      expect(validator.isComplete('a')).toBe(true);
    });

    it('should return false when no option is selected', () => {
      expect(validator.isComplete(null)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validator.isComplete('')).toBe(false);
    });
  });

  describe('getCorrectnessMap', () => {
    it('should mark the correct option as correct', () => {
      const result = validator.getCorrectnessMap('b');
      expect(result['b']).toBe(true);
    });

    it('should mark incorrect options as incorrect', () => {
      const result = validator.getCorrectnessMap('a');
      expect(result['a']).toBe(false);
    });

    it('should return a default map for null selection', () => {
      const result = validator.getCorrectnessMap(null);
      expect(result['answer']).toBe(false);
    });
  });
});
