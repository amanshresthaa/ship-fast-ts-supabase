import { supabase } from '../app/lib/supabaseQuizService';
import { fetchQuizById } from '../app/lib/supabaseQuizService';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      then: jest.fn()
    }))
  }))
}));

// Mock implementation of the Supabase client for testing
const mockSupabaseInstance = {
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    then: jest.fn()
  }))
};

describe('supabaseQuizService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchQuizById', () => {
    it('should batch fetch data for single selection questions', async () => {
      // Mock quiz metadata response
      const mockQuizData = {
        id: 'test-quiz',
        title: 'Test Quiz',
        questions: [{
          id: 'q1',
          type: 'single_selection',
          question: 'Test question 1'
        }, {
          id: 'q2',
          type: 'single_selection',
          question: 'Test question 2'
        }]
      };

      // Mock base questions response
      const mockBaseQuestions = [{
        id: 'q1',
        type: 'single_selection',
        question: 'Test question 1'
      }, {
        id: 'q2',
        type: 'single_selection',
        question: 'Test question 2'
      }];

      // Mock single selection options response
      const mockSingleOptions = [{
        question_id: 'q1',
        option_id: 'opt1',
        text: 'Option 1'
      }, {
        question_id: 'q1',
        option_id: 'opt2',
        text: 'Option 2'
      }, {
        question_id: 'q2',
        option_id: 'opt3',
        text: 'Option 3'
      }];

      // Mock correct answers response
      const mockCorrectAnswers = [{
        question_id: 'q1',
        option_id: 'opt1'
      }, {
        question_id: 'q2',
        option_id: 'opt3'
      }];

      // Setup mock responses
      const mockSupabaseResponses = new Map([
        ['quizzes', { data: mockQuizData, error: null }],
        ['questions', { data: mockBaseQuestions, error: null }],
        ['single_selection_options', { data: mockSingleOptions, error: null }],
        ['single_selection_correct_answer', { data: mockCorrectAnswers, error: null }]
      ]);

      // Mock Supabase client methods
      const mockFrom = jest.fn(table => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(mockSupabaseResponses.get(table))
      }));

      supabase.from = mockFrom;

      // Execute test
      const result = await fetchQuizById('test-quiz');

      // Verify batch fetching was used
      expect(mockFrom).toHaveBeenCalledWith('single_selection_options');
      expect(mockFrom).toHaveBeenCalledWith('single_selection_correct_answer');

      // Verify the question IDs were passed to the IN clause
      const inCalls = mockFrom('single_selection_options').in.mock.calls;
      expect(inCalls).toEqual(expect.arrayContaining([
        ['question_id', ['q1', 'q2']]
      ]));

      // Verify the enriched questions have all their data
      expect(result).toBeTruthy();
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].options).toBeDefined();
      expect(result.questions[0].correctAnswerOptionId).toBeDefined();
    });

    // Test for multiple choice questions
    it('should batch fetch data for multiple choice questions', async () => {
      const mockQuizData = {
        id: 'test-quiz',
        title: 'Test Quiz',
        questions: [{
          id: 'q1',
          type: 'multi_choice',
          question: 'Test MCQ 1'
        }]
      };

      const mockMultiOptions = [{
        question_id: 'q1',
        option_id: 'opt1',
        text: 'Option 1'
      }, {
        question_id: 'q1',
        option_id: 'opt2',
        text: 'Option 2'
      }];

      const mockMultiAnswers = [{
        question_id: 'q1',
        option_id: 'opt1'
      }, {
        question_id: 'q1',
        option_id: 'opt2'
      }];

      const mockSupabaseResponses = new Map([
        ['quizzes', { data: mockQuizData, error: null }],
        ['questions', { data: mockQuizData.questions, error: null }],
        ['multi_choice_options', { data: mockMultiOptions, error: null }],
        ['multi_choice_correct_answers', { data: mockMultiAnswers, error: null }]
      ]);

      const mockFrom = jest.fn(table => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(mockSupabaseResponses.get(table))
      }));

      supabase.from = mockFrom;

      const result = await fetchQuizById('test-quiz');
      expect(mockFrom).toHaveBeenCalledWith('multi_choice_options');
      expect(mockFrom).toHaveBeenCalledWith('multi_choice_correct_answers');
    });

    // Test for drag and drop questions
    it('should batch fetch data for drag and drop questions', async () => {
      const mockQuizData = {
        id: 'test-quiz',
        title: 'Test Quiz',
        questions: [{
          id: 'q1',
          type: 'drag_and_drop',
          question: 'Test DnD 1'
        }]
      };

      const mockDndItems = [{
        question_id: 'q1',
        item_id: 'item1',
        text: 'Item 1',
        category: 'cat1'
      }];

      const mockSupabaseResponses = new Map([
        ['quizzes', { data: mockQuizData, error: null }],
        ['questions', { data: mockQuizData.questions, error: null }],
        ['drag_drop_items', { data: mockDndItems, error: null }]
      ]);

      const mockFrom = jest.fn(table => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(mockSupabaseResponses.get(table))
      }));

      supabase.from = mockFrom;

      const result = await fetchQuizById('test-quiz');
      expect(mockFrom).toHaveBeenCalledWith('drag_drop_items');
    });

    // Test error handling
    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockRejectedValue(mockError)
      });

      supabase.from = mockFrom;

      await expect(fetchQuizById('test-quiz')).rejects.toThrow();
    });
  });
});