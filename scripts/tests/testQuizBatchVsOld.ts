import { supabase, fetchQuizById } from '../app/lib/supabaseQuizService';
import { fetchQuizByIdOptimized, clearQuizCache } from '../app/lib/supabaseQuizServiceOptimized';
import { Quiz } from '../app/types/quiz';

// Save a reference to the original from method
const originalFromMethod = supabase.from;

// Type-safe wrapper for monkey patching
type FromFunction = typeof supabase.from;

async function runPerformanceTest() {
  // Sample quiz IDs to test (small, medium, large)
  const testQuizIds = ['azure-a102', 'aws-saa-c03', 'gcp-ace']; // replace with actual quiz IDs

  console.log('Starting performance comparison test...\n');

  for (const quizId of testQuizIds) {
    console.log(`Testing quiz: ${quizId}`);
    console.log('----------------------------------------');

    // Clear cache before each test to ensure a fair comparison
    clearQuizCache(quizId);
    
    // Test original implementation
    const startTimeOriginal = performance.now();
    let dbQueriesOriginal = 0;

    // Monkey patch the Supabase client to count queries (with proper typing)
    supabase.from = function(this: any, relation: string) {
      dbQueriesOriginal++;
      return originalFromMethod.call(this, relation);
    } as FromFunction;

    try {
      const quizOriginal = await fetchQuizById(quizId);
      const endTimeOriginal = performance.now();
      const durationOriginal = endTimeOriginal - startTimeOriginal;

      console.log('\nOriginal Implementation:');
      console.log(`Total time: ${durationOriginal.toFixed(2)}ms`);
      console.log(`Total DB queries: ${dbQueriesOriginal}`);
      console.log(`Questions enriched: ${quizOriginal?.questions.length || 0}`);

      // Reset query counter and restore original method
      supabase.from = originalFromMethod;

      // Test optimized implementation (without cache)
      const startTimeOptimized = performance.now();
      let dbQueriesOptimized = 0;

      // Monkey patch again for optimized implementation (with proper typing)
      supabase.from = function(this: any, relation: string) {
        dbQueriesOptimized++;
        return originalFromMethod.call(this, relation);
      } as FromFunction;

      // Use the optimized implementation but disable cache for fair comparison
      const quizOptimized = await fetchQuizByIdOptimized(quizId, undefined, false);
      const endTimeOptimized = performance.now();
      const durationOptimized = endTimeOptimized - startTimeOptimized;

      console.log('\nOptimized Implementation (no cache):');
      console.log(`Total time: ${durationOptimized.toFixed(2)}ms`);
      console.log(`Total DB queries: ${dbQueriesOptimized}`);
      console.log(`Questions enriched: ${quizOptimized?.questions.length || 0}`);
      
      // Reset query counter again
      supabase.from = originalFromMethod;
      
      // Test cached implementation
      const startTimeCached = performance.now();
      let dbQueriesCached = 0;
      
      // Monkey patch again for cached implementation (with proper typing)
      supabase.from = function(this: any, relation: string) {
        dbQueriesCached++;
        return originalFromMethod.call(this, relation);
      } as FromFunction;
      
      // First call will populate the cache
      await fetchQuizByIdOptimized(quizId, undefined, true);
      
      // Second call should use the cache
      const startTimeActualCached = performance.now();
      const quizCached = await fetchQuizByIdOptimized(quizId);
      const endTimeCached = performance.now();
      const durationCached = endTimeCached - startTimeActualCached;
      
      console.log('\nCached Implementation:');
      console.log(`Total time: ${durationCached.toFixed(2)}ms`);
      console.log(`Total DB queries: ${dbQueriesCached}`);
      console.log(`Questions enriched: ${quizCached?.questions.length || 0}`);

      // Calculate improvements
      const timeImprovement = ((durationOriginal - durationOptimized) / durationOriginal * 100).toFixed(2);
      const queryImprovement = ((dbQueriesOriginal - dbQueriesOptimized) / dbQueriesOriginal * 100).toFixed(2);
      const cachedTimeImprovement = ((durationOriginal - durationCached) / durationOriginal * 100).toFixed(2);

      console.log('\nImprovements:');
      console.log(`Time reduction (optimized vs original): ${timeImprovement}%`);
      console.log(`Query reduction (optimized vs original): ${queryImprovement}%`);
      console.log(`Time reduction (cached vs original): ${cachedTimeImprovement}%`);

      // Verify data consistency
      const questionsMatchOptimized = JSON.stringify(quizOriginal?.questions) === JSON.stringify(quizOptimized?.questions);
      const questionsMatchCached = JSON.stringify(quizOriginal?.questions) === JSON.stringify(quizCached?.questions);
      
      console.log(`\nData consistency check (optimized): ${questionsMatchOptimized ? 'PASSED ✅' : 'FAILED ❌'}`);
      console.log(`Data consistency check (cached): ${questionsMatchCached ? 'PASSED ✅' : 'FAILED ❌'}`);

      if (!questionsMatchOptimized) {
        console.log('WARNING: The enriched questions from optimized implementation do not match the original.');
      }
      
      if (!questionsMatchCached) {
        console.log('WARNING: The enriched questions from cached implementation do not match the original.');
      }

    } catch (error) {
      console.error(`Error testing quiz ${quizId}:`, error);
    }

    // Restore original Supabase client
    supabase.from = originalFromMethod;
    console.log('\n----------------------------------------\n');
  }
}

// Run the test
console.log('Quiz Data Fetching Optimization Test');
console.log('====================================\n');
console.log('This test compares the performance of the original implementation');
console.log('vs the new batch fetching implementation.\n');

runPerformanceTest().catch(console.error);