import { Quiz } from '../../../types/quiz';

// Client-side service for fetching quiz data
export class QuizService {
  // Fetch quiz by ID with optional question type filter(s)
  static async fetchQuizById(quizId: string, questionTypes?: string | string[]): Promise<Quiz> {
    let url = `/api/quiz/${quizId}`;
    
    if (questionTypes) {
      const params = new URLSearchParams();
      if (typeof questionTypes === 'string') {
        params.append('questionType', questionTypes);
      } else if (Array.isArray(questionTypes) && questionTypes.length > 0) {
        params.append('types', questionTypes.join(','));
      }
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch quiz: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
