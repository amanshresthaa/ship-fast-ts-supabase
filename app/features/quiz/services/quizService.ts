import { Quiz } from '../../../types/quiz';
import { SpacedRepetitionQuizService } from './spacedRepetitionQuizService';

// Client-side service for fetching quiz data
export class QuizService {
  
  /**
   * Fetch quiz by ID with optional question type filter
   * @param quizId - Quiz ID or 'spaced-repetition' for spaced repetition mode
   * @param questionType - Optional question type filter
   * @param spacedRepetitionMode - Enable spaced repetition for regular quizzes
   * @returns Promise<Quiz> - Quiz object
   */
  static async fetchQuizById(
    quizId: string, 
    questionType?: string, 
    spacedRepetitionMode?: boolean
  ): Promise<Quiz> {
    // Handle spaced repetition mode
    if (quizId === 'spaced-repetition') {
      return SpacedRepetitionQuizService.startSpacedRepetitionSession(questionType);
    }
    
    // Regular quiz fetching
    const url = questionType 
      ? `/api/quiz/${quizId}?questionType=${questionType}`
      : `/api/quiz/${quizId}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch quiz: ${response.statusText}`);
    }
    
    const quiz = await response.json();
    
    // If spaced repetition mode is enabled for this regular quiz,
    // enhance it with spaced repetition features
    if (spacedRepetitionMode) {
      return this.enhanceQuizWithSpacedRepetition(quiz, questionType);
    }
    
    return quiz;
  }

  /**
   * Enhance a regular quiz with spaced repetition functionality
   * @param quiz - Regular quiz object
   * @param questionType - Optional question type filter
   * @returns Promise<Quiz> - Enhanced quiz with spaced repetition
   */
  static async enhanceQuizWithSpacedRepetition(quiz: Quiz, questionType?: string): Promise<Quiz> {
    try {
      // Create a spaced repetition session for this quiz
      const sessionResponse = await fetch('/api/quiz/adaptive-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_topic: quiz.quiz_topic || quiz.id,
          quiz_id: quiz.id,
          session_metadata: {
            source: 'enhanced_database_quiz',
            original_quiz_id: quiz.id,
            question_count: quiz.questions.length,
            question_type_filter: questionType
          }
        })
      });

      let sessionId = null;
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        sessionId = sessionData.session_id;
      }

      // Enhance questions with spaced repetition metadata
      const enhancedQuestions = quiz.questions.map((question, index) => ({
        ...question,
        spaced_repetition_data: {
          session_id: sessionId,
          easiness_factor: 2.5, // Default SM-2 easiness factor
          repetition_count: 0,
          interval_days: 1,
          last_reviewed: null as string | null,
          next_review_date: new Date().toISOString(),
          performance_streak: 0,
          original_question_index: index
        }
      }));

      // Return enhanced quiz
      return {
        ...quiz,
        id: `${quiz.id}-spaced-repetition`,
        title: `${quiz.title} (Spaced Repetition Mode)`,
        description: `${quiz.description} - Enhanced with adaptive spaced repetition algorithm`,
        questions: enhancedQuestions,
        is_spaced_repetition: true,
        spaced_repetition_metadata: {
          session_id: sessionId,
          enhanced_mode: true,
          original_question_count: quiz.questions.length
        } as any
      };

    } catch (error) {
      console.error('Error enhancing quiz with spaced repetition:', error);
      // Fallback to regular quiz if enhancement fails
      return quiz;
    }
  }

  /**
   * Check if a quiz is using spaced repetition
   * @param quiz - Quiz object to check
   * @returns boolean - True if using spaced repetition
   */
  static isSpacedRepetitionQuiz(quiz: Quiz): boolean {
    return SpacedRepetitionQuizService.isSpacedRepetitionQuiz(quiz);
  }
}
