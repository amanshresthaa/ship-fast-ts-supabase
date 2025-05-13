import { DragAndDropQuestion } from "@/app/types/quiz";
import { DragAndDropController } from "../controllers/DragAndDropController";

describe('DragAndDropController', () => {
  // Create a mock question for testing
  const mockQuestion: DragAndDropQuestion = {
    id: 'q1',
    type: 'drag_and_drop',
    question: 'Match the items correctly',
    points: 10,
    quiz_tag: 'test-quiz',
    difficulty: 'medium',
    feedback_correct: 'Good job!',
    feedback_incorrect: 'Try again!',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    targets: [
      { target_id: 't1', text: 'Target 1' },
      { target_id: 't2', text: 'Target 2' },
      { target_id: 't3', text: 'Target 3' },
    ],
    options: [
      { option_id: 'o1', text: 'Option 1' },
      { option_id: 'o2', text: 'Option 2' },
      { option_id: 'o3', text: 'Option 3' },
      { option_id: 'o4', text: 'Option 4' }, // Extra option
    ],
    correctPairs: [
      { target_id: 't1', option_id: 'o2' },
      { target_id: 't2', option_id: 'o1' },
      { target_id: 't3', option_id: 'o3' },
    ]
  };

  let controller: DragAndDropController;

  beforeEach(() => {
    controller = new DragAndDropController(mockQuestion);
  });

  describe('constructor', () => {
    it('should properly initialize with a question', () => {
      expect(controller.getQuestion()).toBe(mockQuestion);
    });
  });

  describe('getTargets', () => {
    it('should return all targets', () => {
      expect(controller.getTargets()).toBe(mockQuestion.targets);
      expect(controller.getTargets().length).toBe(3);
    });
  });

  describe('getOptions', () => {
    it('should return all options', () => {
      expect(controller.getOptions()).toBe(mockQuestion.options);
      expect(controller.getOptions().length).toBe(4);
    });
  });

  describe('getCorrectOptionForTarget', () => {
    it('should return the correct option ID for a target', () => {
      expect(controller.getCorrectOptionForTarget('t1')).toBe('o2');
      expect(controller.getCorrectOptionForTarget('t2')).toBe('o1');
      expect(controller.getCorrectOptionForTarget('t3')).toBe('o3');
    });

    it('should return null for an invalid target', () => {
      expect(controller.getCorrectOptionForTarget('nonexistent')).toBeNull();
    });
  });

  describe('isPlacementCorrect', () => {
    it('should return true for correct placements', () => {
      expect(controller.isPlacementCorrect('t1', 'o2')).toBe(true);
      expect(controller.isPlacementCorrect('t2', 'o1')).toBe(true);
      expect(controller.isPlacementCorrect('t3', 'o3')).toBe(true);
    });

    it('should return false for incorrect placements', () => {
      expect(controller.isPlacementCorrect('t1', 'o1')).toBe(false);
      expect(controller.isPlacementCorrect('t2', 'o2')).toBe(false);
    });

    it('should return false for null placements', () => {
      expect(controller.isPlacementCorrect('t1', null)).toBe(false);
    });
  });

  describe('getAvailableOptions', () => {
    it('should return unused options', () => {
      const placedAnswers = {
        't1': 'o1',
        't2': 'o2',
        't3': null
      };
      
      const availableOptions = controller.getAvailableOptions(placedAnswers);
      expect(availableOptions.length).toBe(2);
      expect(availableOptions.some(opt => opt.option_id === 'o3')).toBe(true);
      expect(availableOptions.some(opt => opt.option_id === 'o4')).toBe(true);
    });

    it('should return all options when none are placed', () => {
      const placedAnswers = {
        't1': null,
        't2': null,
        't3': null
      };
      
      const availableOptions = controller.getAvailableOptions(placedAnswers);
      expect(availableOptions.length).toBe(4);
    });
  });

  describe('createInitialAnswers', () => {
    it('should create an object with all targets set to null', () => {
      const initialAnswers = controller.createInitialAnswers();
      expect(Object.keys(initialAnswers).length).toBe(3);
      expect(initialAnswers['t1']).toBeNull();
      expect(initialAnswers['t2']).toBeNull();
      expect(initialAnswers['t3']).toBeNull();
    });
  });

  describe('isAnswerComplete', () => {
    it('should return true when all targets have options', () => {
      const placedAnswers = {
        't1': 'o1',
        't2': 'o2',
        't3': 'o3'
      };
      expect(controller.isAnswerComplete(placedAnswers)).toBe(true);
    });

    it('should return false when some targets have no options', () => {
      const placedAnswers = {
        't1': 'o1',
        't2': null,
        't3': 'o3'
      };
      expect(controller.isAnswerComplete(placedAnswers)).toBe(false);
    });

    it('should return false for empty answers', () => {
      expect(controller.isAnswerComplete({})).toBe(false);
    });
  });

  describe('validateAnswer', () => {
    it('should return a map with each target marked as correct/incorrect', () => {
      const placedAnswers = {
        't1': 'o2', // correct
        't2': 'o3', // incorrect
        't3': 'o1'  // incorrect
      };
      
      const validation = controller.validateAnswer(placedAnswers);
      expect(validation['t1']).toBe(true);
      expect(validation['t2']).toBe(false);
      expect(validation['t3']).toBe(false);
    });
  });

  describe('getScore', () => {
    it('should return 1 for all correct placements', () => {
      const placedAnswers = {
        't1': 'o2',
        't2': 'o1',
        't3': 'o3'
      };
      expect(controller.getScore(placedAnswers)).toBe(1);
    });

    it('should return fraction for partially correct placements', () => {
      const placedAnswers = {
        't1': 'o2', // correct
        't2': 'o3', // incorrect
        't3': 'o1'  // incorrect
      };
      expect(controller.getScore(placedAnswers)).toBe(1/3);
    });

    it('should return 0 for all incorrect placements', () => {
      const placedAnswers = {
        't1': 'o1',
        't2': 'o3',
        't3': 'o4'
      };
      expect(controller.getScore(placedAnswers)).toBe(0);
    });
  });

  describe('isCorrect', () => {
    it('should return true when all placements are correct', () => {
      const placedAnswers = {
        't1': 'o2',
        't2': 'o1',
        't3': 'o3'
      };
      expect(controller.isCorrect(placedAnswers)).toBe(true);
    });

    it('should return false when any placement is incorrect', () => {
      const placedAnswers = {
        't1': 'o2', // correct
        't2': 'o3', // incorrect
        't3': 'o3'  // correct
      };
      expect(controller.isCorrect(placedAnswers)).toBe(false);
    });
  });
});
