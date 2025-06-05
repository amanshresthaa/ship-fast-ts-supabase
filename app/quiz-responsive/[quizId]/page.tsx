import { notFound } from 'next/navigation';

interface QuizResponsivePageProps {
  params: Promise<{
    quizId: string;
  }>;
}

export default async function QuizResponsivePage({ params }: QuizResponsivePageProps) {
  const { quizId } = await params;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Responsive Quiz: {quizId}</h1>
      <p className="text-gray-600">
        This is a placeholder for the responsive quiz page. 
        Quiz ID: {quizId}
      </p>
      <div className="mt-4">
        <a 
          href={`/quiz/${quizId}`}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Quiz
        </a>
      </div>
    </div>
  );
}
