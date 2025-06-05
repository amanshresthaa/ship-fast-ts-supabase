import { Quiz } from '@/app/types/quiz';

export const MOCK_EMPTY_QUIZ: Quiz = {
  id: 'empty-quiz-001',
  title: 'Empty Quiz',
  description: 'This quiz intentionally has no questions.',
  quiz_type: 'multiple_choice',
  settings: null,
  author: 'mock_admin',
  difficulty: 'easy',
  quiz_topic: 'empty-quiz-001',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  questions: [],
};
