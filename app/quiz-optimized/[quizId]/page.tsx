import { Suspense } from 'react';
import { fetchQuizById } from '../../../lib/supabaseQuizServiceRedis';
import OptimizedQuizRenderer from '../../../components/OptimizedQuizRenderer';
import Link from 'next/link';

// Enable revalidation for this page to benefit from the Next.js cache
export const revalidate = 3600; // 1 hour

// Define the page props
interface OptimizedQuizPageProps {
  params: {
    quizId: string;
  };
}

// Sample related quiz data - in a real app, this would come from a recommendation engine
const getRelatedQuizIds = (quizId: string): string[] => {
  const quizMap: Record<string, string[]> = {
    'azure-a102': ['aws-saa-c03', 'gcp-ace'], 
    'aws-saa-c03': ['azure-a102', 'gcp-ace'],
    'gcp-ace': ['aws-saa-c03', 'azure-a102']
  };
  
  return quizMap[quizId] || [];
};

/**
 * Renders the optimized quiz page with server-side data fetching, caching, and performance features.
 *
 * Displays a quiz identified by the given quiz ID, including navigation breadcrumbs, a summary of optimization techniques, related quizzes, sample performance metrics, and admin tools for cache management. The quiz content is rendered within a React Suspense boundary for improved loading experience.
 *
 * @param params - Route parameters containing the quiz ID to display.
 */
export default async function OptimizedQuizPage({ params }: OptimizedQuizPageProps) {
  const { quizId } = params;
  
  // Fetch the initial quiz data with server-side caching
  const initialQuizData = await fetchQuizById(quizId);
  const relatedQuizIds = getRelatedQuizIds(quizId);
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-1 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-blue-600 hover:underline">Home</Link>
          </li>
          <li>
            <span className="mx-1">/</span>
          </li>
          <li>
            <Link href="/quizzes" className="hover:text-blue-600 hover:underline">Quizzes</Link>
          </li>
          <li>
            <span className="mx-1">/</span>
          </li>
          <li className="font-medium text-gray-700">
            {quizId}
          </li>
        </ol>
      </nav>
      
      {/* Performance features explanation */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 shadow-sm border border-blue-100">
        <h2 className="text-lg font-semibold text-blue-800">Optimized Quiz Experience</h2>
        <p className="text-sm text-blue-700 mt-2">
          This page demonstrates all performance optimizations:
        </p>
        <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc pl-5">
          <li>Server-side rendering with data prefetching</li>
          <li>Optimized batch database queries</li>
          <li>Redis caching in production</li>
          <li>SWR pattern for client-side updates</li>
          <li>Background prefetching of related quizzes</li>
          <li>Automatic cache invalidation</li>
        </ul>
      </div>
      
      {/* The optimized quiz component with Suspense */}
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div>}>
        <OptimizedQuizRenderer
          quizId={quizId}
          initialData={initialQuizData}
          relatedQuizIds={relatedQuizIds}
        />
      </Suspense>
      
      {/* Performance metrics (in real app, this would use web vitals) */}
      <div className="mt-8 bg-white rounded-lg shadow p-4 border border-gray-200">
        <h2 className="text-lg font-semibold mb-2">Page Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500">Time to First Byte</div>
            <div className="text-2xl font-bold text-gray-800">~50ms</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500">FCP</div>
            <div className="text-2xl font-bold text-gray-800">~300ms</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500">LCP</div>
            <div className="text-2xl font-bold text-gray-800">~800ms</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500">TTI</div>
            <div className="text-2xl font-bold text-gray-800">~1200ms</div>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 italic">
          Note: These are sample metrics. Real values depend on network conditions, server load, and cache status.
        </p>
      </div>
      
      {/* Admin tools */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Admin Tools</h3>
          <div className="space-x-2">
            <Link 
              href={`/dashboard/cache-analytics`}
              className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              View Cache Analytics
            </Link>
            <Link 
              href={`/api/admin/cache?quizId=${quizId}`}
              className="inline-flex items-center rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
            >
              Clear Cache (Admin)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
