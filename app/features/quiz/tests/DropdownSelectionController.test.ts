import { DropdownSelectionQuestion } from "@/app/types/quiz";
import { DropdownSelectionController } from "../controllers/DropdownSelectionController";

describe('DropdownSelectionController', () => {
  // Create a mock question for testing
  const mockQuestion: DropdownSelectionQuestion = {
    id: 'q1',
    type: 'dropdown_selection',
    question: 'The [animal] jumped over the [object].',
    points: 10,
    quiz_tag: 'test-quiz',
    difficulty: 'medium',
    feedback_correct: 'Good job!',
    feedback_incorrect: 'Try again!',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    options: [
      { option_id: 'a1', text: 'cat' },
      { option_id: 'a2', text: 'dog' },
      { option_id: 'a3', text: 'fox' },
      { option_id: 'o1', text: 'fence' },
      { option_id: 'o2', text: 'moon' },
      { option_id: 'o3', text: 'tree' },
    ],
    placeholderTargets: {
      'animal': {
        key: 'animal',
        correctOptionText: 'fox'
      },
      'object': {
        key: 'object',
        correctOptionText: 'fence'
      }
    }
  };

  let controller: DropdownSelectionController;

  beforeEach(() => {
    controller = new DropdownSelectionController(mockQuestion);
  });

  describe('constructor', () => {
    it('should properly initialize with a question', () => {
      expect(controller.getQuestion()).toBe(mockQuestion);
    });
  });

  describe('getCorrectOptionForPlaceholder', () => {
    it('should return the correct option text for a placeholder', () => {
      expect(controller.getCorrectOptionForPlaceholder('animal')).toBe('fox');
      expect(controller.getCorrectOptionForPlaceholder('object')).toBe('fence');
    });

    it('should return null for an invalid placeholder', () => {
      expect(controller.getCorrectOptionForPlaceholder('nonexistent')).toBeNull();
    });
  });

  describe('getPlaceholderKeys', () => {
    it('should return all placeholder keys', () => {
      expect(controller.getPlaceholderKeys()).toEqual(['animal', 'object']);
    });
  });

  describe('isSelectionCorrect', () => {
    it('should return true for correct selections', () => {
      expect(controller.isSelectionCorrect('animal', 'fox')).toBe(true);
      expect(controller.isSelectionCorrect('object', 'fence')).toBe(true);
    });

    it('should return false for incorrect selections', () => {
      expect(controller.isSelectionCorrect('animal', 'cat')).toBe(false);
      expect(controller.isSelectionCorrect('object', 'moon')).toBe(false);
    });

    it('should return false for null selections', () => {
      expect(controller.isSelectionCorrect('animal', null)).toBe(false);
    });
  });

  describe('isAnswerComplete', () => {
    it('should return true when all placeholders have selections', () => {
      const selections = { 'animal': 'cat', 'object': 'fence' };
      expect(controller.isAnswerComplete(selections)).toBe(true);
    });

    it('should return false when some placeholders have no selections', () => {
      const selections = { 'animal': 'cat', 'object': null };
      expect(controller.isAnswerComplete(selections)).toBe(false);
    });

    it('should return false for empty selections', () => {
      expect(controller.isAnswerComplete({})).toBe(false);
    });
  });

  describe('validateAnswer', () => {
    it('should return a map with each placeholder marked as correct/incorrect', () => {
      const selections = { 'animal': 'fox', 'object': 'tree' };
      const validation = controller.validateAnswer(selections);
      expect(validation['animal']).toBe(true);
      expect(validation['object']).toBe(false);
    });
  });

  describe('getScore', () => {
    it('should return 1 for all correct selections', () => {
      const selections = { 'animal': 'fox', 'object': 'fence' };
      expect(controller.getScore(selections)).toBe(1);
    });

    it('should return 0.5 for half correct selections', () => {
      const selections = { 'animal': 'fox', 'object': 'tree' };
      expect(controller.getScore(selections)).toBe(0.5);
    });

    it('should return 0 for all incorrect selections', () => {
      const selections = { 'animal': 'cat', 'object': 'tree' };
      expect(controller.getScore(selections)).toBe(0);
    });
  });

  describe('isCorrect', () => {
    it('should return true when all selections are correct', () => {
      const selections = { 'animal': 'fox', 'object': 'fence' };
      expect(controller.isCorrect(selections)).toBe(true);
    });

    it('should return false when any selection is incorrect', () => {
      const selections = { 'animal': 'fox', 'object': 'tree' };
      expect(controller.isCorrect(selections)).toBe(false);
    });
  });
});
