import { Quiz, AnyQuestion } from '../../../types/quiz';

interface SpacedRepetitionSession {
  session_id: string;
  questions: AnyQuestion[];
  metadata: {
    total_count: number;
    quiz_topic_filter: string | null;
    generated_at: string;
  };
}

interface QuestionResponse {
  question_id: string;
  quiz_session_id?: string;
  user_answer_data: any;
  is_correct: boolean;
  response_time_ms: number;
  confidence_level?: number;
}

/**
 * Enhanced quiz service that integrates spaced repetition functionality
 * with the existing quiz pipeline while maintaining the same UX/UI
 */
export class SpacedRepetitionQuizService {
  
  /**
   * Start a new spaced repetition session or fetch questions due for review
   * @param quizTopic - Quiz topic filter (optional)
   * @param limit - Maximum number of questions (default: 20)
   * @returns Promise<Quiz> - Quiz object compatible with existing pipeline
   */
  static async startSpacedRepetitionSession(
    quizTopic?: string, 
    limit: number = 20
  ): Promise<Quiz> {
    try {
      // First, get questions due for review
      const params = new URLSearchParams();
      if (quizTopic) {
        params.append('quiz_topic', quizTopic);
      }
      params.append('limit', limit.toString());

      const response = await fetch(`/api/quiz/review-questions?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch review questions');
      }

      const data = await response.json();
      
      // If no questions due for review, return empty quiz
      if (!data.questions || data.questions.length === 0) {
        return {
          id: 'spaced-repetition-empty',
          title: 'No Questions Due for Review',
          description: 'All questions are up to date! Check back later.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          quiz_type: quizTopic || 'spaced_repetition',
          difficulty: 'medium' as const,
          quiz_topic: quizTopic || 'spaced_repetition',
          questions: [],
          is_spaced_repetition: true,
          spaced_repetition_metadata: data.metadata
        };
      }

      // Create a spaced repetition session
      const sessionResponse = await fetch('/api/quiz/adaptive-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_topic: quizTopic,
          session_metadata: {
            source: 'integrated_quiz_pipeline',
            question_count: data.questions.length
          }
        })
      });

      let sessionId = null;
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        sessionId = sessionData.session_id;
      }

      // Transform questions to include spaced repetition metadata
      const questionsWithMetadata = data.questions.map((q: any) => ({
        ...q,
        spaced_repetition_data: {
          session_id: sessionId,
          easiness_factor: q.easiness_factor,
          repetition_count: q.repetition_count,
          interval_days: q.interval_days,
          last_reviewed: q.last_reviewed,
          next_review_date: q.next_review_date,
          performance_streak: q.performance_streak
        }
      }));

      // Return quiz object compatible with existing pipeline
      return {
        id: `spaced-repetition-${sessionId || Date.now()}`,
        title: 'Spaced Repetition Review',
        description: `Review ${data.questions.length} questions due for practice`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        quiz_type: quizTopic || 'spaced_repetition',
        difficulty: 'medium' as const,
        quiz_topic: quizTopic || 'spaced_repetition',
        questions: questionsWithMetadata,
        is_spaced_repetition: true,
        spaced_repetition_metadata: {
          ...data.metadata,
          session_id: sessionId
        }
      };

    } catch (error) {
      console.error('Error starting spaced repetition session:', error);
      throw error;
    }
  }

  /**
   * Record a user's response to a spaced repetition question
   * @param questionId - ID of the question
   * @param userAnswer - User's answer data
   * @param isCorrect - Whether the answer was correct
   * @param responseTimeMs - Time taken to answer in milliseconds
   * @param sessionId - Optional session ID
   * @param confidenceLevel - Optional confidence level (1-5)
   * @returns Promise<any> - Response from the API
   */
  static async recordQuestionResponse(
    questionId: string,
    userAnswer: any,
    isCorrect: boolean,
    responseTimeMs: number,
    sessionId?: string,
    confidenceLevel?: number
  ): Promise<any> {
    try {
      const response = await fetch('/api/quiz/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
          quiz_session_id: sessionId,
          user_answer_data: userAnswer,
          is_correct: isCorrect,
          response_time_ms: responseTimeMs,
          confidence_level: confidenceLevel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error recording question response:', error);
      throw error;
    }
  }

  /**
   * Check if a quiz object is using spaced repetition
   * @param quiz - Quiz object to check
   * @returns boolean - True if using spaced repetition
   */
  static isSpacedRepetitionQuiz(quiz: Quiz): boolean {
    return quiz.is_spaced_repetition === true;
  }

  /**
   * Get spaced repetition statistics for a question
   * @param question - Question object
   * @returns object - Spaced repetition stats
   */
  static getQuestionSpacedRepetitionStats(question: AnyQuestion): any {
    return question.spaced_repetition_data || null;
  }
}
