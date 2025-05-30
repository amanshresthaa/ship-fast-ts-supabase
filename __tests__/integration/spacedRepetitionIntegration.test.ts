import { QuizService } from '../../app/features/quiz/services/quizService';
import { SpacedRepetitionQuizService } from '../../app/features/quiz/services/spacedRepetitionQuizService';
import { Quiz, AnyQuestion } from '../../app/types/quiz';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Spaced Repetition Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('QuizService Integration', () => {
    it('should handle spaced repetition quiz ID correctly', async () => {
      // Mock the review questions API response
      const mockReviewQuestions = {
        success: true,
        questions: [
          {
            id: 'test-question-1',
            type: 'single_selection',
            question: 'Test question?',
            points: 10,
            quiz_tag: 'test-quiz',
            difficulty: 'medium',
            feedback_correct: 'Correct!',
            feedback_incorrect: 'Incorrect.',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            options: [
              { option_id: 'opt1', text: 'Option 1' },
              { option_id: 'opt2', text: 'Option 2' }
            ],
            correctAnswerOptionId: 'opt1',
            easiness_factor: 2.5,
            repetition_count: 3,
            interval_days: 7,
            performance_streak: 2
          }
        ],
        metadata: {
          total_count: 1,
          quiz_topic_filter: null as string | null,
          generated_at: '2024-01-01T00:00:00Z'
        }
      };

      const mockSessionResponse = {
        session_id: 'test-session-123',
        success: true
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockReviewQuestions)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockSessionResponse)
        });

      const quiz = await QuizService.fetchQuizById('spaced-repetition');

      expect(fetch).toHaveBeenCalledWith('/api/quiz/review-questions?limit=20');
      expect(fetch).toHaveBeenCalledWith('/api/quiz/adaptive-session', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_topic: undefined,
          session_metadata: {
            source: 'integrated_quiz_pipeline',
            question_count: 1
          }
        })
      }));

      expect(quiz.is_spaced_repetition).toBe(true);
      expect(quiz.questions).toHaveLength(1);
      expect(quiz.questions[0].spaced_repetition_data).toBeDefined();
      expect(quiz.questions[0].spaced_repetition_data?.session_id).toBe('test-session-123');
      expect(quiz.questions[0].spaced_repetition_data?.easiness_factor).toBe(2.5);
    });

    it('should handle regular quiz IDs normally', async () => {
      const mockQuizResponse = {
        id: 'regular-quiz',
        title: 'Regular Quiz',
        questions: [] as AnyQuestion[]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockQuizResponse)
      });

      const quiz = await QuizService.fetchQuizById('regular-quiz');

      expect(fetch).toHaveBeenCalledWith('/api/quiz/regular-quiz');
      expect(quiz.is_spaced_repetition).toBeUndefined();
    });

    it('should detect spaced repetition quizzes correctly', () => {
      const spacedRepetitionQuiz: Quiz = {
        id: 'spaced-rep-test',
        title: 'Test',
        difficulty: 'medium',
        quiz_topic: 'test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        questions: [],
        is_spaced_repetition: true
      };

      const regularQuiz: Quiz = {
        id: 'regular-test',
        title: 'Test',
        difficulty: 'medium',
        quiz_topic: 'test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        questions: []
      };

      expect(QuizService.isSpacedRepetitionQuiz(spacedRepetitionQuiz)).toBe(true);
      expect(QuizService.isSpacedRepetitionQuiz(regularQuiz)).toBe(false);
    });
  });

  describe('Question Type Compatibility', () => {
    const questionTypes = [
      'single_selection',
      'multi',
      'drag_and_drop',
      'dropdown_selection',
      'order',
      'yes_no',
      'yesno_multi'
    ];

    questionTypes.forEach(questionType => {
      it(`should work with ${questionType} questions`, async () => {
        const mockResponse = {
          success: true,
          spaced_repetition_data: {
            updated_performance: true,
            next_review_date: '2024-01-08T00:00:00Z'
          }
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const result = await SpacedRepetitionQuizService.recordQuestionResponse(
          'test-question',
          { test: 'answer' },
          true,
          5000,
          'test-session'
        );

        expect(fetch).toHaveBeenCalledWith('/api/quiz/response', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: 'test-question',
            quiz_session_id: 'test-session',
            user_answer_data: { test: 'answer' },
            is_correct: true,
            response_time_ms: 5000,
            confidence_level: undefined
          })
        }));

        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Spaced Repetition Metadata', () => {
    it('should extract spaced repetition stats from questions', () => {
      const questionWithStats: AnyQuestion = {
        id: 'test-question',
        type: 'single_selection',
        question: 'Test?',
        points: 10,
        quiz_tag: 'test',
        difficulty: 'medium',
        feedback_correct: 'Correct!',
        feedback_incorrect: 'Incorrect.',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        options: [],
        correctAnswerOptionId: 'opt1',
        spaced_repetition_data: {
          session_id: 'test-session',
          easiness_factor: 2.8,
          repetition_count: 5,
          interval_days: 14,
          performance_streak: 3
        }
      };

      const questionWithoutStats: AnyQuestion = {
        id: 'test-question',
        type: 'single_selection',
        question: 'Test?',
        points: 10,
        quiz_tag: 'test',
        difficulty: 'medium',
        feedback_correct: 'Correct!',
        feedback_incorrect: 'Incorrect.',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        options: [],
        correctAnswerOptionId: 'opt1'
      };

      const statsWithData = SpacedRepetitionQuizService.getQuestionSpacedRepetitionStats(questionWithStats);
      const statsWithoutData = SpacedRepetitionQuizService.getQuestionSpacedRepetitionStats(questionWithoutStats);

      expect(statsWithData).toEqual({
        session_id: 'test-session',
        easiness_factor: 2.8,
        repetition_count: 5,
        interval_days: 14,
        performance_streak: 3
      });

      expect(statsWithoutData).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'API Error' })
      });

      await expect(
        SpacedRepetitionQuizService.startSpacedRepetitionSession()
      ).rejects.toThrow('API Error');
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      await expect(
        SpacedRepetitionQuizService.recordQuestionResponse(
          'test-question',
          {},
          true,
          1000
        )
      ).rejects.toThrow('Network Error');
    });
  });

  describe('Empty Quiz State', () => {
    it('should handle empty review questions correctly', async () => {
      const mockEmptyResponse = {
        success: true,
        questions: [] as AnyQuestion[],
        metadata: {
          total_count: 0,
          quiz_topic_filter: null as string | null,
          generated_at: '2024-01-01T00:00:00Z'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockEmptyResponse)
      });

      const quiz = await SpacedRepetitionQuizService.startSpacedRepetitionSession();

      expect(quiz.id).toBe('spaced-repetition-empty');
      expect(quiz.title).toBe('No Questions Due for Review');
      expect(quiz.questions).toHaveLength(0);
      expect(quiz.is_spaced_repetition).toBe(true);
    });
  });
});
