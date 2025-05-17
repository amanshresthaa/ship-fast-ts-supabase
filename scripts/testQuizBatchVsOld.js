const { supabase, fetchQuizById } = require('../app/lib/supabaseQuizService');

// Save the original fetchQuizById implementation and a copy of the client for comparison
const originalFetchQuizById = fetchQuizById;
const originalFrom = supabase.from.bind(supabase);

async function runPerformanceTest() {
  // Sample quiz IDs to test (small, medium, large)
  const testQuizIds = ['azure-a102', 'aws-saa-c03', 'gcp-ace']; // replace with actual quiz IDs

  console.log('Starting performance comparison test...\n');

  for (const quizId of testQuizIds) {
    console.log(`Testing quiz: ${quizId}`);
    console.log('----------------------------------------');

    // Test original implementation
    const startTimeOriginal = performance.now();
    let dbQueriesOriginal = 0;

    // Monkey patch the Supabase client to count queries
    const originalFrom = supabase.from;
    supabase.from = function(...args) {
      dbQueriesOriginal++;
      return originalFrom.apply(this, args);
    };

    try {
      const quizOriginal = await originalFetchQuizById(quizId);
      const endTimeOriginal = performance.now();
      const durationOriginal = endTimeOriginal - startTimeOriginal;

      console.log('\nOriginal Implementation:');
      console.log(`Total time: ${durationOriginal.toFixed(2)}ms`);
      console.log(`Total DB queries: ${dbQueriesOriginal}`);
      console.log(`Questions enriched: ${quizOriginal?.questions.length || 0}`);

      // Reset query counter and restore original method
      supabase.from = originalFrom;

      // Test batch implementation
      const startTimeBatch = performance.now();
      let dbQueriesBatch = 0;

      // Monkey patch again for batch implementation
      supabase.from = function(...args) {
        dbQueriesBatch++;
        return originalFrom.apply(this, args);
      };

      const quizBatch = await originalFetchQuizById(quizId);
      const endTimeBatch = performance.now();
      const durationBatch = endTimeBatch - startTimeBatch;

      console.log('\nBatch Implementation:');
      console.log(`Total time: ${durationBatch.toFixed(2)}ms`);
      console.log(`Total DB queries: ${dbQueriesBatch}`);
      console.log(`Questions enriched: ${quizBatch?.questions.length || 0}`);

      // Calculate improvements
      const timeImprovement = ((durationOriginal - durationBatch) / durationOriginal * 100).toFixed(2);
      const queryImprovement = ((dbQueriesOriginal - dbQueriesBatch) / dbQueriesOriginal * 100).toFixed(2);

      console.log('\nImprovements:');
      console.log(`Time reduction: ${timeImprovement}%`);
      console.log(`Query reduction: ${queryImprovement}%`);

      // Verify data consistency
      const questionsMatch = JSON.stringify(quizOriginal?.questions) === JSON.stringify(quizBatch?.questions);
      console.log(`\nData consistency check: ${questionsMatch ? 'PASSED ✅' : 'FAILED ❌'}`);

      if (!questionsMatch) {
        console.log('WARNING: The enriched questions from both implementations do not match exactly.');
      }

    } catch (error) {
      console.error(`Error testing quiz ${quizId}:`, error);
    }

    // Restore original Supabase client
    supabase.from = originalFrom;
    console.log('\n----------------------------------------\n');
  }
}

// Run the test
console.log('Quiz Data Fetching Optimization Test');
console.log('====================================\n');
console.log('This test compares the performance of the original implementation');
console.log('vs the new batch fetching implementation.\n');

runPerformanceTest().catch(console.error);
