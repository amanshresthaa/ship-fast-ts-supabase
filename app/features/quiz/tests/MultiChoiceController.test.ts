import { MultiChoiceQuestion } from "@/app/types/quiz";
import { MultiChoiceController } from "../controllers/MultiChoiceController";

describe('MultiChoiceController', () => {
  // Create a mock question for testing
  const mockQuestion: MultiChoiceQuestion = {
    id: 'q1',
    type: 'multi',
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
      { option_id: 'd', text: 'Option D' },
    ],
    correctAnswerOptionIds: ['b', 'c']
  };

  let controller: MultiChoiceController;

  beforeEach(() => {
    controller = new MultiChoiceController(mockQuestion);
  });

  describe('constructor', () => {
    it('should properly initialize with a question', () => {
      expect(controller.getQuestion()).toBe(mockQuestion);
    });
  });

  describe('getCorrectOptionIds', () => {
    it('should return the correct answer option IDs', () => {
      expect(controller.getCorrectOptionIds()).toEqual(['b', 'c']);
    });
  });

  describe('getRequiredSelectionCount', () => {
    it('should return the number of correct options', () => {
      expect(controller.getRequiredSelectionCount()).toBe(2);
    });
  });

  describe('isOptionCorrect', () => {
    it('should return true for correct options', () => {
      expect(controller.isOptionCorrect('b')).toBe(true);
      expect(controller.isOptionCorrect('c')).toBe(true);
    });

    it('should return false for incorrect options', () => {
      expect(controller.isOptionCorrect('a')).toBe(false);
      expect(controller.isOptionCorrect('d')).toBe(false);
    });
  });

  describe('isAnswerComplete', () => {
    it('should return true when the correct number of options are selected', () => {
      expect(controller.isAnswerComplete(['a', 'b'])).toBe(true);
    });

    it('should return false when too few options are selected', () => {
      expect(controller.isAnswerComplete(['a'])).toBe(false);
    });

    it('should return false when too many options are selected', () => {
      expect(controller.isAnswerComplete(['a', 'b', 'c'])).toBe(false);
    });

    it('should return false for an empty array', () => {
      expect(controller.isAnswerComplete([])).toBe(false);
    });
  });

  describe('validateAnswer', () => {
    it('should return a map with each selected option marked as correct/incorrect', () => {
      const validation = controller.validateAnswer(['b', 'd']);
      expect(validation['b']).toBe(true);
      expect(validation['d']).toBe(false);
    });
  });

  describe('getScore', () => {
    it('should return 1 for all correct answers', () => {
      expect(controller.getScore(['b', 'c'])).toBe(1);
    });

    it('should return 0.5 for half correct answers', () => {
      expect(controller.getScore(['b', 'd'])).toBe(0.5);
    });

    it('should return 0 for all incorrect answers', () => {
      expect(controller.getScore(['a', 'd'])).toBe(0);
    });
  });

  describe('isCorrect', () => {
    it('should return true when all selected options are correct', () => {
      expect(controller.isCorrect(['b', 'c'])).toBe(true);
    });

    it('should return false when any selected option is incorrect', () => {
      expect(controller.isCorrect(['b', 'd'])).toBe(false);
    });
  });
});
