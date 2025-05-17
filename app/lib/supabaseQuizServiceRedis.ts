import { 
  BaseQuestion, 
  AnyQuestion, 
  Quiz
} from '../types/quiz';

// Use core functionality from the optimized service
import { supabase } from './supabaseQuizService';
import {
  enrichSingleSelectionQuestions,
  enrichMultiChoiceQuestions,
  enrichDragAndDropQuestions,
  enrichDropdownSelectionQuestions,
  enrichOrderQuestions,
  enrichYesNoQuestions,
  enrichYesNoMultiQuestions,
  groupQuestionsByType,
} from './supabaseQuizService';

// Import Redis cache functions
import {
  buildCacheKey,
  getCacheItem,
  setCacheItem,
  deleteCacheItem,
  clearCache,
  recordCacheHit,
  recordCacheMiss,
  getCacheAnalytics
} from './redisCache';

// Default cache TTL (1 hour in seconds)
const CACHE_TTL = 3600;

// Environment indicator
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Redis-based implementation of fetchQuizById with advanced caching
 */
export async function fetchQuizByIdRedis(
  quizId: string,
  questionType?: string,
  useCache = true
): Promise<Quiz | null> {
  // Build a cache key that includes the question type if provided
  const cacheKey = buildCacheKey(quizId, { type: questionType || 'all' });
  
  // Check cache first if enabled
  if (useCache) {
    const cachedQuiz = await getCacheItem<Quiz>(cacheKey);
    if (cachedQuiz) {
      await recordCacheHit(cacheKey);
      return cachedQuiz;
    }
    await recordCacheMiss(cacheKey);
  }

  try {
    // 1. Fetch quiz metadata and base questions in parallel
    const [quizResult, questionsResult] = await Promise.all([
      supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single(),
      
      supabase
        .from('questions')
        .select('*')
        .eq('quiz_tag', quizId)
        .order('id', { ascending: true })
        .then(result => {
          // Apply question type filter if provided
          if (questionType && result.data) {
            return {
              ...result,
              data: result.data.filter(q => q.type === questionType)
            };
          }
          return result;
        })
    ]);

    // Handle quiz fetch errors
    if (quizResult.error) {
      if (quizResult.error.code === 'PGRST116') { // Not found
        console.warn(`Quiz with ID '${quizId}' not found.`);
      } else {
        console.error(`Error fetching quiz ${quizId}:`, quizResult.error.message);
      }
      return null;
    }

    // Handle questions fetch errors
    if (questionsResult.error) {
      console.error(`Error fetching questions for quiz ${quizId}:`, questionsResult.error.message);
      return null;
    }

    const quizData = quizResult.data;
    const baseQuestionsData = questionsResult.data || [];

    // If no questions found, return quiz with empty questions array
    if (!baseQuestionsData.length) {
      const emptyQuiz = {
        ...(quizData as Quiz),
        questions: [],
      };
      
      // Cache the result if caching is enabled
      if (useCache) {
        await setCacheItem(cacheKey, emptyQuiz, CACHE_TTL);
      }
      
      return emptyQuiz;
    }

    // Group questions by type for batch processing
    const questionsByType = groupQuestionsByType(baseQuestionsData as BaseQuestion[]);

    // Process each question type in parallel
    const enrichmentPromises: Promise<AnyQuestion[]>[] = [];

    // Add enrichment promises for each question type that exists
    if (questionsByType['single_selection']?.length) {
      enrichmentPromises.push(enrichSingleSelectionQuestions(questionsByType['single_selection']));
    }
    if (questionsByType['multi']?.length) {
      enrichmentPromises.push(enrichMultiChoiceQuestions(questionsByType['multi']));
    }
    if (questionsByType['drag_and_drop']?.length) {
      enrichmentPromises.push(enrichDragAndDropQuestions(questionsByType['drag_and_drop']));
    }
    if (questionsByType['dropdown_selection']?.length) {
      enrichmentPromises.push(enrichDropdownSelectionQuestions(questionsByType['dropdown_selection']));
    }
    if (questionsByType['order']?.length) {
      enrichmentPromises.push(enrichOrderQuestions(questionsByType['order']));
    }
    if (questionsByType['yes_no']?.length) {
      enrichmentPromises.push(enrichYesNoQuestions(questionsByType['yes_no']));
    }
    if (questionsByType['yesno_multi']?.length) {
      enrichmentPromises.push(enrichYesNoMultiQuestions(questionsByType['yesno_multi']));
    }

    // Wait for all enrichment operations to complete
    const enrichedQuestionArrays = await Promise.all(enrichmentPromises);

    // Flatten the arrays of enriched questions into a single array
    const allEnrichedQuestions = enrichedQuestionArrays.flat();

    // Log warning if not all questions were enriched successfully
    if (baseQuestionsData.length !== allEnrichedQuestions.length) {
      console.warn(`Not all questions for quiz ${quizId} could be successfully enriched. Original: ${baseQuestionsData.length}, Enriched: ${allEnrichedQuestions.length}`);
    }

    // Create the final quiz object
    const enrichedQuiz = {
      ...(quizData as Quiz),
      questions: allEnrichedQuestions,
    };

    // Cache the result if caching is enabled
    if (useCache) {
      await setCacheItem(cacheKey, enrichedQuiz, CACHE_TTL);
    }

    return enrichedQuiz;

  } catch (error: any) {
    console.error(`Unexpected error in fetchQuizByIdRedis for quiz ${quizId}:`, error.message || error);
    return null;
  }
}

/**
 * The main fetchQuizById function that uses either Redis or in-memory cache
 * depending on the environment
 */
export async function fetchQuizById(
  quizId: string,
  questionType?: string,
  useCache = true
): Promise<Quiz | null> {
  // Use Redis in production, in-memory cache in development
  if (isProduction) {
    return fetchQuizByIdRedis(quizId, questionType, useCache);
  } else {
    // Import dynamically to avoid circular dependencies
    const { fetchQuizByIdOptimized } = await import('./supabaseQuizServiceOptimized');
    return fetchQuizByIdOptimized(quizId, questionType, useCache);
  }
}

/**
 * Clear the quiz cache
 * @param quizId Optional quiz ID to clear specific cache entry
 */
export async function clearQuizCache(quizId?: string): Promise<void> {
  if (isProduction) {
    // In production, clear Redis cache
    if (quizId) {
      await clearCache(`quiz:${quizId}*`);
    } else {
      await clearCache();
    }
  } else {
    // In development, use in-memory cache clearing
    // Import dynamically to avoid circular dependencies
    const { clearQuizCache: clearMemoryCache } = await import('./supabaseQuizServiceOptimized');
    clearMemoryCache(quizId);
  }
}

/**
 * Get cache statistics
 */
export async function getQuizCacheStats() {
  if (isProduction) {
    // Get Redis stats in production
    return await getCacheAnalytics();
  } else {
    // Get in-memory stats in development
    // Import dynamically to avoid circular dependencies
    const { getQuizCacheStats: getMemoryStats } = await import('./supabaseQuizServiceOptimized');
    return getMemoryStats();
  }
}
