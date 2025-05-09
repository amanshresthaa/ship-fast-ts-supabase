import { Quiz } from '../../../types/quiz';

// Client-side service for fetching quiz data
export class QuizService {
  // Fetch quiz by ID
  static async fetchQuizById(quizId: string): Promise<Quiz> {
    const response = await fetch(`/api/quiz/${quizId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch quiz: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
