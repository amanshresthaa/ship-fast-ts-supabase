import { Suspense } from 'react';
import { getQuizCacheStats } from '../../lib/supabaseQuizServiceRedis';
import { clearQuizCache } from '../../lib/supabaseQuizServiceRedis';

// Add dynamic to ensure the page is always server-rendered with fresh data
export const dynamic = 'force-dynamic';

/**
 * Displays quiz cache analytics and management controls in a server-rendered dashboard.
 *
 * Fetches cache statistics, calculates hit rates and total requests, and presents summary and per-key metrics for both Redis and in-memory cache formats. Provides an admin interface to clear the entire quiz cache.
 */
async function CacheAnalyticsContent() {
  // Fetch analytics data
  const analytics = await getQuizCacheStats();

  // Calculate hit rate if possible
  let hitRate = 0;
  let totalRequests = 0;
  
  if (analytics && typeof analytics === 'object') {
    // Handle both Redis and in-memory cache stats formats
    if ('hits' in analytics && 'misses' in analytics) {
      const hits = Number(analytics.hits);
      const misses = Number(analytics.misses);
      totalRequests = hits + misses;
      hitRate = totalRequests > 0 ? (hits / totalRequests) * 100 : 0;
    }
  }

  // Format timestamp for React (if using Redis stats)
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Cache Performance</h3>
          
          {/* Summary statistics */}
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Cache Hit Rate</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-indigo-600">{hitRate.toFixed(2)}%</dd>
            </div>
            
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Total Requests</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalRequests}</dd>
            </div>
            
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Cached Keys</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {analytics && 'keyStats' in analytics 
                  ? Object.keys(analytics.keyStats).length 
                  : analytics && 'entries' in analytics 
                  ? analytics.entries.length 
                  : 0}
              </dd>
            </div>
          </div>
          
          {/* Key statistics */}
          {analytics && 'keyStats' in analytics && Object.keys(analytics.keyStats).length > 0 && (
            <div className="mt-8">
              <h4 className="text-md font-medium text-gray-700 mb-3">Cache Key Statistics</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Key</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Hits</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Misses</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Hit Rate</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Accessed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Object.entries(analytics.keyStats).map(([key, stats]) => {
                      const keyHits = Number(stats.hits || 0);
                      const keyMisses = Number(stats.misses || 0);
                      const keyTotal = keyHits + keyMisses;
                      const keyHitRate = keyTotal > 0 ? (keyHits / keyTotal) * 100 : 0;
                      
                      return (
                        <tr key={key}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{key}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{keyHits}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{keyMisses}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{keyHitRate.toFixed(2)}%</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatTimestamp(stats.lastAccessed)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* In-memory cache entries */}
          {analytics && 'entries' in analytics && analytics.entries.length > 0 && (
            <div className="mt-8">
              <h4 className="text-md font-medium text-gray-700 mb-3">Cached Quiz IDs</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {analytics.entries.map((entry) => (
                  <div key={entry} className="bg-gray-100 px-3 py-2 rounded text-sm">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Admin controls */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Cache Management</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Clear the quiz cache to force fresh data to be fetched from the database.</p>
          </div>
          <div className="mt-5">
            <form action={async () => {
              'use server';
              await clearQuizCache();
            }}>
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              >
                Clear All Cache
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the cache analytics dashboard page with summary information and controls.
 *
 * Displays a header, description, and asynchronously loads cache analytics content within a Suspense boundary.
 */
export default function CacheAnalyticsDashboard() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Cache Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor cache performance and optimize your application's data fetching strategy.
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <Suspense fallback={<div className="text-center py-10">Loading analytics data...</div>}>
          <CacheAnalyticsContent />
        </Suspense>
      </div>
    </div>
  );
}
