import { SingleSelectionQuestion } from "@/app/types/quiz";
import { SingleSelectionController } from "../controllers/SingleSelectionController";

describe('SingleSelectionController', () => {
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

  let controller: SingleSelectionController;

  beforeEach(() => {
    controller = new SingleSelectionController(mockQuestion);
  });

  describe('constructor', () => {
    it('should properly initialize with a question', () => {
      expect(controller.getQuestion()).toBe(mockQuestion);
    });
  });

  describe('getCorrectOptionId', () => {
    it('should return the correct answer option ID', () => {
      expect(controller.getCorrectOptionId()).toBe('b');
    });
  });

  describe('isOptionCorrect', () => {
    it('should return true for the correct option', () => {
      expect(controller.isOptionCorrect('b')).toBe(true);
    });

    it('should return false for incorrect options', () => {
      expect(controller.isOptionCorrect('a')).toBe(false);
      expect(controller.isOptionCorrect('c')).toBe(false);
    });
  });

  describe('isAnswerComplete', () => {
    it('should return true when an answer is selected', () => {
      expect(controller.isAnswerComplete('a')).toBe(true);
    });

    it('should return false when no answer is selected', () => {
      expect(controller.isAnswerComplete(null)).toBe(false);
    });
  });

  describe('validateAnswer', () => {
    it('should return a map with the selected option marked as correct/incorrect', () => {
      const correctValidation = controller.validateAnswer('b');
      expect(correctValidation['b']).toBe(true);

      const incorrectValidation = controller.validateAnswer('a');
      expect(incorrectValidation['a']).toBe(false);
    });
  });

  describe('getScore', () => {
    it('should return 1 for a correct answer', () => {
      expect(controller.getScore('b')).toBe(1);
    });

    it('should return 0 for an incorrect answer', () => {
      expect(controller.getScore('a')).toBe(0);
    });

    it('should return 0 for no answer', () => {
      expect(controller.getScore(null)).toBe(0);
    });
  });

  describe('isCorrect', () => {
    it('should return true for a correct answer', () => {
      expect(controller.isCorrect('b')).toBe(true);
    });

    it('should return false for an incorrect answer', () => {
      expect(controller.isCorrect('a')).toBe(false);
    });
  });
});
