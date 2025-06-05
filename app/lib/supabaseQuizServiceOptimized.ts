import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  BaseQuestion, 
  AnyQuestion, 
  SingleSelectionQuestion, 
  MultiChoiceQuestion,
  SelectionOption,
  DragAndDropTarget,
  DragAndDropOption,
  DragAndDropCorrectPair,
  DragAndDropQuestion,
  DropdownOption,
  DropdownPlaceholderTarget,
  DropdownSelectionQuestion,
  OrderQuestion,
  OrderItem,
  YesNoQuestion,
  YesNoMultiQuestion,
  YesNoStatement,
  Quiz
} from '../types/quiz';

// Initialize Supabase client - reuse from the original service
import { 
  supabase,
  enrichSingleSelectionQuestions,
  enrichMultiChoiceQuestions,
  enrichDragAndDropQuestions,
  enrichDropdownSelectionQuestions,
  enrichOrderQuestions,
  enrichYesNoQuestions,
  enrichYesNoMultiQuestions,
  groupQuestionsByType 
} from './supabaseQuizService';

// Re-export the helper functions for consistency
export {
  enrichSingleSelectionQuestions,
  enrichMultiChoiceQuestions,
  enrichDragAndDropQuestions,
  enrichDropdownSelectionQuestions,
  enrichOrderQuestions,
  enrichYesNoQuestions,
  enrichYesNoMultiQuestions,
  groupQuestionsByType,
} from './supabaseQuizService';

/**
 * Cache for quiz data with expiry time (in milliseconds)
 * This is a simple in-memory cache that will be cleared on server restart
 * For production use, consider using a more robust solution like Redis
 */
interface CacheEntry {
  data: Quiz;
  timestamp: number;
  version: string; // Version hash based on quiz content
}

const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds
const quizCache: Record<string, CacheEntry> = {};

/**
 * Performance metrics storage for API calls
 */
interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  params: Record<string, any>;
  cacheHit?: boolean;
}

// Store metrics in a circular buffer to avoid memory leaks
const MAX_METRICS = 100;
const performanceMetrics: PerformanceMetric[] = [];

/**
 * Generate a version hash for a quiz based on its content
 * This allows us to invalidate the cache when the quiz content changes
 * @param quiz The quiz data
 * @returns A version hash string
 */
function generateQuizVersionHash(quiz: Quiz): string {
  // Use the updated_at timestamp as a version indicator
  // For more complex versioning, could use a hash of the quiz content
  return `${quiz.updated_at || new Date().toISOString()}`;
}

/**
 * Track performance of an API call
 * @param operation Name of the operation being performed
 * @param params Parameters that were passed to the operation
 * @returns A function to call when the operation completes
 */
export function traceOperation(operation: string, params: Record<string, any> = {}): 
  (success: boolean, additionalInfo?: Record<string, any>) => void {
  
  // Only track metrics in development or if explicitly enabled
  if (process.env.NODE_ENV !== 'development' && 
      process.env.NEXT_PUBLIC_ENABLE_METRICS !== 'true') {
    return () => {}; // No-op in production unless metrics explicitly enabled
  }
  
  const startTime = performance.now();
  return (success: boolean, additionalInfo: Record<string, any> = {}) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const metric: PerformanceMetric = {
      operation,
      startTime,
      endTime,
      duration,
      success,
      params: { ...params, ...additionalInfo }
    };
    
    // Add to circular buffer, removing oldest if full
    if (performanceMetrics.length >= MAX_METRICS) {
      performanceMetrics.shift();
    }
    performanceMetrics.push(metric);
    
    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 500) {
      console.warn(`Slow operation detected - ${operation}: ${duration.toFixed(2)}ms`, params);
    }
  };
}

/**
 * Get performance metrics for analysis
 * @param operation Optional operation name to filter by
 * @param minDuration Optional minimum duration to filter by (in ms)
 * @returns Array of performance metrics
 */
export function getPerformanceMetrics(operation?: string, minDuration?: number): PerformanceMetric[] {
  return performanceMetrics
    .filter(m => operation ? m.operation === operation : true)
    .filter(m => minDuration ? m.duration >= minDuration : true);
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  performanceMetrics.length = 0;
}

/**
 * Get summary statistics for API operations
 * @returns Object with summary statistics
 */
export function getPerformanceStats(): Record<string, {
  count: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  successRate: number;
  cacheHitRate?: number;
}> {
  const stats: Record<string, {
    count: number;
    totalDuration: number;
    maxDuration: number;
    minDuration: number;
    successCount: number;
    cacheHits?: number;
  }> = {};
  
  for (const metric of performanceMetrics) {
    const { operation, duration, success, cacheHit } = metric;
    
    if (!stats[operation]) {
      stats[operation] = {
        count: 0,
        totalDuration: 0,
        maxDuration: -Infinity,
        minDuration: Infinity,
        successCount: 0,
        cacheHits: 0
      };
    }
    
    const opStats = stats[operation];
    opStats.count++;
    opStats.totalDuration += duration;
    opStats.maxDuration = Math.max(opStats.maxDuration, duration);
    opStats.minDuration = Math.min(opStats.minDuration, duration);
    if (success) opStats.successCount++;
    if (cacheHit) opStats.cacheHits!++;
  }
  
  // Calculate averages and rates
  return Object.entries(stats).reduce((acc, [operation, opStats]) => {
    acc[operation] = {
      count: opStats.count,
      avgDuration: opStats.count > 0 ? opStats.totalDuration / opStats.count : 0,
      maxDuration: opStats.maxDuration !== -Infinity ? opStats.maxDuration : 0,
      minDuration: opStats.minDuration !== Infinity ? opStats.minDuration : 0,
      successRate: opStats.count > 0 ? (opStats.successCount / opStats.count) * 100 : 0,
      cacheHitRate: opStats.cacheHits !== undefined && opStats.count > 0 
        ? (opStats.cacheHits / opStats.count) * 100 
        : undefined
    };
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Enhanced fetchQuizById with caching
 * @param quizId The ID of the quiz to fetch
 * @param questionType Optional filter for question type
 * @param useCache Whether to use the cache or force a fresh fetch
 * @returns The quiz data or null if not found or error
 */
export async function fetchQuizByIdOptimized(
  quizId: string,
  questionType?: string,
  useCache = true
): Promise<Quiz | null> {
  // Set up performance tracing
  const completeTrace = traceOperation('fetchQuizByIdOptimized', { quizId, questionType, useCache });
  
  // Check cache first if caching is enabled
  const now = Date.now();
  if (useCache && quizCache[quizId] && now - quizCache[quizId].timestamp < CACHE_TTL) {
    console.log(`Cache hit for quiz ${quizId}`);
    
    // Check if we need to validate the cached version
    const { data: latestVersionInfo } = await supabase
      .from('quizzes')
      .select('updated_at')
      .eq('id', quizId)
      .single();
    
    // If version matches or we couldn't fetch version info, use the cache
    const cachedVersion = quizCache[quizId].version;
    const latestVersion = latestVersionInfo ? `${latestVersionInfo.updated_at}` : cachedVersion;
    
    if (cachedVersion === latestVersion) {
      // If questionType filter is provided, filter the cached questions
      if (questionType) {
        const filteredQuiz = {
          ...quizCache[quizId].data,
          questions: quizCache[quizId].data.questions.filter(q => q.type === questionType)
        };
        return filteredQuiz;
      }
      
      return quizCache[quizId].data;
    } else {
      console.log(`Cache invalidated for quiz ${quizId} due to version mismatch`);
      // Cache version mismatch, will fetch fresh data
    }
  }

  try {
    // 1. Fetch quiz metadata and base questions in parallel to reduce latency
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
        questions: [] as AnyQuestion[],
      };
      
      // Cache the result if caching is enabled
      if (useCache) {
        quizCache[quizId] = {
          data: emptyQuiz,
          timestamp: now,
          version: generateQuizVersionHash(emptyQuiz),
        };
      }
      
      return emptyQuiz;
    }

    // Group questions by type for batch processing
    const questionsByType = groupQuestionsByType(baseQuestionsData as BaseQuestion[]);

    // Process each question type in parallel using Promise.all for maximum efficiency
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
      quizCache[quizId] = {
        data: enrichedQuiz,
        timestamp: now,
        version: generateQuizVersionHash(enrichedQuiz),
      };
    }

    return enrichedQuiz;

  } catch (error: any) {
    console.error(`Unexpected error in fetchQuizByIdOptimized for quiz ${quizId}:`, error.message || error);
    return null;
  }
}

/**
 * Clear the quiz cache
 * @param quizId Optional quiz ID to clear specific cache entry, or clear all if not provided
 */
export function clearQuizCache(quizId?: string): void {
  if (quizId) {
    delete quizCache[quizId];
    console.log(`Cache cleared for quiz ${quizId}`);
  } else {
    Object.keys(quizCache).forEach(key => delete quizCache[key]);
    console.log('All quiz cache cleared');
  }
}

// Function to get cache stats for debugging
export function getQuizCacheStats(): { size: number, entries: string[] } {
  return {
    size: Object.keys(quizCache).length,
    entries: Object.keys(quizCache)
  };
}

/**
 * Prefetch related quizzes based on tags or topics
 * This function can be called when a quiz loads to preload other quizzes the user might access next
 * 
 * @param currentQuizId The ID of the currently viewed quiz
 * @param limit The maximum number of related quizzes to prefetch
 * @returns An array of quiz IDs that were prefetched
 */
export async function prefetchRelatedQuizzes(currentQuizId: string, limit: number = 3): Promise<string[]> {
  try {
    // First, get the current quiz's topic to find related quizzes
    const { data: currentQuiz } = await supabase
      .from('quizzes')
      .select('quiz_topic')
      .eq('id', currentQuizId)
      .single();
    
    if (!currentQuiz || !currentQuiz.quiz_topic) {
      return [];
    }
    
    // Find related quizzes with the same topic, excluding the current quiz
    const { data: relatedQuizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('quiz_topic', currentQuiz.quiz_topic)
      .neq('id', currentQuizId)
      .limit(limit);
    
    if (!relatedQuizzes || relatedQuizzes.length === 0) {
      return [];
    }
    
    // Prefetch each related quiz in the background
    const prefetchPromises = relatedQuizzes.map(quiz => 
      fetchQuizByIdOptimized(quiz.id, undefined, true)
        .then(() => quiz.id)
        .catch((): null => null)
    );
    
    // Wait for all prefetch operations to complete
    const prefetchedIds = await Promise.all(prefetchPromises);
    
    // Return the successfully prefetched quiz IDs
    return prefetchedIds.filter(id => id !== null) as string[];
    
  } catch (error: any) {
    console.warn(`Error prefetching related quizzes for ${currentQuizId}:`, error.message);
    return [];
  }
}

/**
 * Optimized batch fetching for a list of quizzes
 * This minimizes database queries by fetching all quizzes in one request
 * 
 * @param quizIds Array of quiz IDs to fetch
 * @param useCache Whether to use cache for individual quizzes
 * @returns Object mapping quiz IDs to quizzes
 */
export async function batchFetchQuizzes(
  quizIds: string[],
  useCache = true
): Promise<Record<string, Quiz | null>> {
  if (!quizIds.length) return {};
  
  // Deduplicate quiz IDs
  const uniqueQuizIds = [...new Set(quizIds)];
  
  // Check cache first for each quiz
  const result: Record<string, Quiz | null> = {};
  const quizIdsToFetch: string[] = [];
  
  const now = Date.now();
  if (useCache) {
    for (const quizId of uniqueQuizIds) {
      if (quizCache[quizId] && now - quizCache[quizId].timestamp < CACHE_TTL) {
        result[quizId] = quizCache[quizId].data;
      } else {
        quizIdsToFetch.push(quizId);
      }
    }
  } else {
    quizIdsToFetch.push(...uniqueQuizIds);
  }
  
  if (quizIdsToFetch.length === 0) {
    return result;
  }
  
  try {
    // 1. Fetch all quiz metadata in a single query
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .in('id', quizIdsToFetch);
    
    if (quizzesError) {
      console.error('Error fetching batched quizzes:', quizzesError.message);
      // Return null for quizzes that couldn't be fetched
      quizIdsToFetch.forEach(id => result[id] = null);
      return result;
    }
    
    // Map quizzes by ID for easy lookup
    const quizzesById = quizzesData?.reduce((acc, quiz) => {
      acc[quiz.id] = quiz;
      return acc;
    }, {} as Record<string, any>) || {};
    
    // 2. Fetch all questions for the quizzes in a single query
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('quiz_tag', quizIdsToFetch)
      .order('id', { ascending: true });
    
    if (questionsError) {
      console.error('Error fetching questions for batched quizzes:', questionsError.message);
      // Return partial results - quizzes with no questions
      for (const quizId of quizIdsToFetch) {
        if (quizzesById[quizId]) {
          const emptyQuiz: Quiz = {
            ...(quizzesById[quizId] as Quiz),
            questions: [] as AnyQuestion[], // Explicitly type the empty array
          };
          result[quizId] = emptyQuiz;
          
          // Cache the result
          if (useCache) {
            quizCache[quizId] = {
              data: emptyQuiz,
              timestamp: now,
              version: generateQuizVersionHash(emptyQuiz)
            };
          }
        } else {
          result[quizId] = null;
        }
      }
      return result;
    }
    
    // 3. Group questions by quiz ID
    const questionsByQuiz = questionsData?.reduce((acc, question) => {
      const quizTag = question.quiz_tag;
      if (!acc[quizTag]) {
        acc[quizTag] = [];
      }
      acc[quizTag].push(question);
      return acc;
    }, {} as Record<string, any[]>) || {};
    
    // 4. Process each quiz in parallel
    const processingPromises = quizIdsToFetch.map(async quizId => {
      if (!quizzesById[quizId]) {
        result[quizId] = null;
        return;
      }
      
      const baseQuestionsData = questionsByQuiz[quizId] || [];
      
      if (baseQuestionsData.length === 0) {
        const emptyQuiz = {
          ...(quizzesById[quizId] as Quiz),
          questions: [] as AnyQuestion[],
        };
        result[quizId] = emptyQuiz;
        
        // Cache the result
        if (useCache) {
          quizCache[quizId] = {
            data: emptyQuiz,
            timestamp: now,
            version: generateQuizVersionHash(emptyQuiz)
          };
        }
        return;
      }
      
      try {
        // Group questions by type for batch processing
        const questionsByType = groupQuestionsByType(baseQuestionsData as BaseQuestion[]);
        
        // Process each question type in parallel
        const enrichmentPromises: Promise<AnyQuestion[]>[] = [];
        
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
        
        // Flatten the arrays of enriched questions
        const allEnrichedQuestions = enrichedQuestionArrays.flat();
        
        // Create the final quiz object
        const enrichedQuiz = {
          ...(quizzesById[quizId] as Quiz),
          questions: allEnrichedQuestions,
        };
        
        result[quizId] = enrichedQuiz;
        
        // Cache the result
        if (useCache) {
          quizCache[quizId] = {
            data: enrichedQuiz,
            timestamp: now,
            version: generateQuizVersionHash(enrichedQuiz)
          };
        }
      } catch (err: any) {
        console.error(`Error processing questions for quiz ${quizId}:`, err.message);
        // Return quiz with empty questions if processing fails
        const emptyQuiz = {
          ...(quizzesById[quizId] as Quiz),
          questions: [] as AnyQuestion[],
        };
        result[quizId] = emptyQuiz;
      }
    });
    
    // Wait for all quiz processing to complete
    await Promise.all(processingPromises);
    
    return result;
  } catch (error: any) {
    console.error('Unexpected error in batchFetchQuizzes:', error.message);
    // Return null for all quizzes on catastrophic error
    quizIdsToFetch.forEach(id => result[id] = null);
    return result;
  }
}

/**
 * Fetch quiz metadata first and then progressively load questions
 * This improves perceived performance by showing content to the user sooner
 * 
 * @param quizId The ID of the quiz to fetch
 * @param onQuestionsProgress Optional callback for question loading progress
 * @returns A Promise with the initial quiz metadata and a function to load questions
 */
export async function fetchQuizProgressively(
  quizId: string,
  onQuestionsProgress?: (progress: { loaded: number, total: number }) => void
): Promise<{ 
  initialQuiz: Quiz | null, 
  loadQuestions: () => Promise<Quiz | null> 
}> {
  try {
    // First, check if we have this quiz in cache
    const now = Date.now();
    if (quizCache[quizId] && now - quizCache[quizId].timestamp < CACHE_TTL) {
      // Return the cached quiz immediately, no need for progressive loading
      return { 
        initialQuiz: quizCache[quizId].data, 
        loadQuestions: async () => quizCache[quizId].data 
      };
    }
    
    // Fetch only the quiz metadata first
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
    
    if (quizError) {
      console.error(`Error fetching quiz ${quizId}:`, quizError.message);
      return { initialQuiz: null, loadQuestions: async () => null };
    }
    
    // Create an initial quiz object with empty questions array
    const initialQuiz = {
      ...(quizData as Quiz),
      questions: [] as AnyQuestion[],
    };
    
    // Return the initial quiz and a function to load questions
    return {
      initialQuiz,
      loadQuestions: async () => {
        try {
          // Then fetch questions count for progress reporting
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_tag', quizId);
            
          const totalQuestions = count || 0;
          
          // Fetch all questions
          const { data: questionsData, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('quiz_tag', quizId)
            .order('id', { ascending: true });
          
          if (questionsError) {
            console.error(`Error fetching questions for quiz ${quizId}:`, questionsError.message);
            return initialQuiz;
          }
          
          const baseQuestionsData = questionsData || [];
          
          if (baseQuestionsData.length === 0) {
            return initialQuiz;
          }
          
          // Group questions by type for batch processing
          const questionsByType = groupQuestionsByType(baseQuestionsData as BaseQuestion[]);
          
          // Process each question type in parallel
          const enrichmentPromises: Promise<AnyQuestion[]>[] = [];
          let loadedQuestions = 0;
          
          // Add enrichment promises for each question type
          for (const type of Object.keys(questionsByType)) {
            if (!questionsByType[type]?.length) continue;
            
            // Create enrichment promise with progress reporting
            const enrichmentPromise = (async () => {
              let result: AnyQuestion[] = [];
              
              switch (type) {
                case 'single_selection':
                  result = await enrichSingleSelectionQuestions(questionsByType[type]);
                  break;
                case 'multi':
                  result = await enrichMultiChoiceQuestions(questionsByType[type]);
                  break;
                case 'drag_and_drop':
                  result = await enrichDragAndDropQuestions(questionsByType[type]);
                  break;
                case 'dropdown_selection':
                  result = await enrichDropdownSelectionQuestions(questionsByType[type]);
                  break;
                case 'order':
                  result = await enrichOrderQuestions(questionsByType[type]);
                  break;
                case 'yes_no':
                  result = await enrichYesNoQuestions(questionsByType[type]);
                  break;
                case 'yesno_multi':
                  result = await enrichYesNoMultiQuestions(questionsByType[type]);
                  break;
                default:
                  break;
              }
              
              // Update loading progress
              loadedQuestions += questionsByType[type].length;
              if (onQuestionsProgress) {
                onQuestionsProgress({
                  loaded: loadedQuestions,
                  total: totalQuestions
                });
              }
              
              return result;
            })();
            
            enrichmentPromises.push(enrichmentPromise);
          }
          
          // Wait for all enrichment operations to complete
          const enrichedQuestionArrays = await Promise.all(enrichmentPromises);
          
          // Flatten the arrays of enriched questions into a single array
          const allEnrichedQuestions = enrichedQuestionArrays.flat();
          
          // Create the final quiz object
          const enrichedQuiz = {
            ...initialQuiz,
            questions: allEnrichedQuestions,
          };
          
          // Cache the result
          quizCache[quizId] = {
            data: enrichedQuiz,
            timestamp: Date.now(),
            version: generateQuizVersionHash(enrichedQuiz)
          };
          
          return enrichedQuiz;
        } catch (error: any) {
          console.error(`Error loading questions for quiz ${quizId}:`, error.message);
          return initialQuiz;
        }
      }
    };
  } catch (error: any) {
    console.error(`Unexpected error in fetchQuizProgressively for quiz ${quizId}:`, error.message);
    return { initialQuiz: null, loadQuestions: async () => null };
  }
}
