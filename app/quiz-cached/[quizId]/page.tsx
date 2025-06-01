import { Suspense } from 'react';
import { fetchQuizByIdOptimized } from '../../lib/supabaseQuizServiceOptimized';
import { QuizDataProvider } from '../../components/QuizDataProvider';

// Set revalidation period for this page
export const revalidate = 3600; // Revalidate page every hour

// Add dynamic = 'force-dynamic' if you want to ensure this is always server-rendered
// export const dynamic = 'force-dynamic';

/**
 * Server-rendered page component that displays quiz details by quiz ID with cached data fetching and revalidation.
 *
 * Fetches quiz data on the server using an optimized method and renders the quiz content or an error message based on data availability. The page is cached and revalidated according to the configured interval.
 *
 * @param params - Route parameters containing the quiz ID.
 * @returns The rendered quiz page with quiz details or an error message if the quiz is not found.
 */
export default async function CachedQuizPage({ params }: { params: { quizId: string } }) {
  const { quizId } = params;
  
  // Pre-fetch quiz data on the server (will be cached according to revalidate setting)
  const quizData = await fetchQuizByIdOptimized(quizId);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Quiz: {quizId}</h1>
      
      <Suspense fallback={<div>Loading quiz details...</div>}>
        {quizData ? (
          <QuizWithData initialData={quizData} quizId={quizId} />
        ) : (
          <div className="text-red-500">Quiz not found or error loading quiz data.</div>
        )}
      </Suspense>
    </div>
  );
}

// Client Component that receives the server-fetched data 
/**
 * Wraps the quiz display component with a context provider, supplying initial quiz data and quiz ID for client-side state management.
 *
 * @param initialData - The initial quiz data fetched on the server.
 * @param quizId - The unique identifier for the quiz.
 */
function QuizWithData({ initialData, quizId }: { initialData: any; quizId: string }) {
  return (
    <QuizDataProvider quizId={quizId} initialData={initialData}>
      <QuizDisplay />
    </QuizDataProvider>
  );
}

/**
 * Displays a summary of the cached quiz data fetching strategy and its benefits.
 *
 * Intended to be used within a quiz data context, this component presents static informational content about server-side data pre-fetching, cache revalidation, and data consistency between server and client.
 */
function QuizDisplay() {
  // This would normally use the useQuizData() hook to get quiz data from context
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Quiz Summary</h2>
      
      <div className="space-y-4">
        <p>
          This page demonstrates the cached quiz data fetching implementation.
          The quiz data is pre-fetched on the server and then passed to the client,
          with a revalidation period of 1 hour.
        </p>
        
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-medium">Benefits of this implementation:</h3>
          <ul className="list-disc ml-5 mt-2">
            <li>Server-side rendering with data pre-fetching</li>
            <li>Automatic cache revalidation after 1 hour</li>
            <li>Optimized batch fetching for related quiz data</li>
            <li>In-memory caching for subsequent requests</li>
            <li>Consistent data between server and client</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
