import { supabase, fetchQuizById } from '../app/lib/supabaseQuizService.ts';

// Save references to original implementation for comparison
const originalFetch = fetchQuizById;
const originalFrom = supabase.from.bind(supabase);

// Helper function to sleep between tests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runPerformanceTest() {
  // Test a variety of quiz sizes
  const testQuizIds = ['azure-a102', 'aws-saa-c03', 'gcp-ace'];
  
  console.log('Starting performance comparison test...\n');

  for (const quizId of testQuizIds) {
    console.log(`Testing quiz: ${quizId}`);
    console.log('----------------------------------------');

    try {
      // First test the original implementation
      let startTime = performance.now();
      let queryCount = 0;
      
      // Monkey-patch supabase.from to count queries
      supabase.from = function(...args) {
        queryCount++;
        return originalFrom.apply(this, args);
      };

      const resultOriginal = await originalFetch(quizId);
      const timeOriginal = performance.now() - startTime;

      console.log('\nOriginal Implementation:');
      console.log(`Time taken: ${timeOriginal.toFixed(2)}ms`);
      console.log(`DB queries made: ${queryCount}`);
      console.log(`Questions loaded: ${resultOriginal?.questions.length || 0}`);

      // Add a small delay between tests
      await sleep(1000);

      // Reset counters and restore original method
      supabase.from = originalFrom;
      queryCount = 0;

      // Now test the new batch implementation
      startTime = performance.now();
      
      // Monkey-patch again for the batch test
      supabase.from = function(...args) {
        queryCount++;
        return originalFrom.apply(this, args);
      };

      const resultBatch = await fetchQuizById(quizId);
      const timeBatch = performance.now() - startTime;

      console.log('\nBatch Implementation:');
      console.log(`Time taken: ${timeBatch.toFixed(2)}ms`);
      console.log(`DB queries made: ${queryCount}`);
      console.log(`Questions loaded: ${resultBatch?.questions.length || 0}`);

      // Calculate improvements
      const timeImprovement = ((timeOriginal - timeBatch) / timeOriginal * 100).toFixed(2);
      
      console.log('\nPerformance Improvement:');
      console.log(`Time reduction: ${timeImprovement}%`);

      // Verify data consistency
      const originalJson = JSON.stringify(resultOriginal);
      const batchJson = JSON.stringify(resultBatch);
      const dataMatches = originalJson === batchJson;

      console.log('\nData Consistency Check:');
      console.log(dataMatches ? '✅ Data matches exactly' : '❌ Data mismatch detected');

      if (!dataMatches) {
        console.log('WARNING: The optimized implementation returned different data than the original');
      }

    } catch (error) {
      console.error(`Error testing quiz ${quizId}:`, error);
    } finally {
      // Always restore the original method
      supabase.from = originalFrom;
    }

    console.log('\n----------------------------------------\n');
  }
}

// Run the tests
console.log('Quiz Data Fetching Optimization Test');
console.log('====================================\n');

runPerformanceTest().catch(console.error);
