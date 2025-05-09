import { Quiz } from '../../../types/quiz';

// Client-side service for fetching quiz data
export class QuizService {
  // Fetch quiz by ID with optional question type filter
  static async fetchQuizById(quizId: string, questionType?: string): Promise<Quiz> {
    const url = questionType 
      ? `/api/quiz/${quizId}?questionType=${questionType}`
      : `/api/quiz/${quizId}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch quiz: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
