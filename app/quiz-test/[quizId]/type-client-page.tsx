'use client';

export default function QuizTypeClientPage({ quizId, questionType }: { quizId: string, questionType: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Quiz Feature Under Development
        </h1>
        <p className="text-gray-600 mb-4">
          Quiz ID: {quizId}, Type: {questionType}
        </p>
        <p className="text-sm text-gray-500">
          This feature is currently being developed. Please check back later.
        </p>
      </div>
    </div>
  );
}
