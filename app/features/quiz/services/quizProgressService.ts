export interface QuizProgress {
  currentQuestionIndex: number;
  userAnswers: Record<string, any>;
}

export interface SaveProgressPayload extends QuizProgress {
  quizId: string;
  questionTypeFilter?: string | null;
  isExplicitlyCompleted?: boolean;
}

export class QuizProgressService {
  static async loadProgress(quizId: string, questionTypeFilter?: string): Promise<QuizProgress | null> {
    if (!quizId) return null;
    const params = new URLSearchParams({ quizId });
    if (questionTypeFilter) {
      params.append('questionTypeFilter', questionTypeFilter);
    }
    const response = await fetch(`/api/user/quiz-progress?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch progress');
    }
    const data = await response.json();
    if (!data.progress) {
      return null;
    }
    return {
      currentQuestionIndex: data.progress.current_question_index,
      userAnswers: data.progress.user_answers,
    };
  }

  static async saveProgress(payload: SaveProgressPayload): Promise<boolean> {
    const response = await fetch('/api/user/quiz-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizId: payload.quizId,
        questionTypeFilter: payload.questionTypeFilter || null,
        currentQuestionIndex: payload.currentQuestionIndex,
        userAnswers: payload.userAnswers,
        isExplicitlyCompleted: payload.isExplicitlyCompleted || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save progress');
    }
    return true;
  }

  static async deleteProgress(quizId: string, questionTypeFilter?: string): Promise<boolean> {
    if (!quizId) return false;
    const params = new URLSearchParams({ quizId });
    if (questionTypeFilter) {
      params.append('questionTypeFilter', questionTypeFilter);
    }
    const response = await fetch(`/api/user/quiz-progress?${params.toString()}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete progress');
    }
    return true;
  }
}
