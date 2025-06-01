import { Quiz } from '../types/quiz';
import { createClient } from 'redis';

// Redis client configuration
// In production, you would use environment variables for these values
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_TTL = 3600; // 1 hour in seconds

// Create Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Returns a singleton Redis client instance, initializing and connecting it if necessary.
 *
 * @returns The connected Redis client, or null if connection fails.
 *
 * @remark The client is lazily initialized and reused across calls. If a connection error occurs during initialization, the client is reset to null and the error is logged.
 */
export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    // Connect to Redis if not connected
    if (!redisClient.isOpen) {
      await redisClient.connect().catch(err => {
        console.error('Redis connection error:', err);
        redisClient = null;
      });
    }
  }
  
  return redisClient;
}

/**
 * Constructs a standardized cache key for quiz-related data.
 *
 * Appends additional parameters as colon-separated key-value pairs to ensure uniqueness and consistency.
 *
 * @param key - The base key name.
 * @param params - Optional key-value pairs to further distinguish the cache entry.
 * @returns A formatted cache key string prefixed with `quiz:`.
 */
export function buildCacheKey(key: string, params: Record<string, string> = {}): string {
  let cacheKey = `quiz:${key}`;
  
  // Add any parameters to the cache key
  Object.entries(params).forEach(([k, v]) => {
    if (v) cacheKey += `:${k}:${v}`;
  });
  
  return cacheKey;
}

/**
 * Retrieves and deserializes an item from the Redis cache by key.
 *
 * @param key - The cache key to retrieve.
 * @returns The cached data as an object of type {@link T}, or null if not found or on error.
 */
export async function getCacheItem<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const data = await client.get(key);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Redis cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Stores data in Redis cache under the specified key with an optional time-to-live.
 *
 * @param key - The cache key to store the data under.
 * @param data - The data to cache.
 * @param ttl - Optional time-to-live in seconds; defaults to 1 hour if not provided.
 * @returns True if the data was successfully cached; false otherwise.
 */
export async function setCacheItem<T>(key: string, data: T, ttl = DEFAULT_TTL): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    await client.set(key, JSON.stringify(data), { EX: ttl });
    
    // Record cache analytics
    await recordCacheOperation('set', key);
    return true;
  } catch (error) {
    console.error(`Redis cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Deletes an item from the Redis cache by its key.
 *
 * @param key - The cache key to delete.
 * @returns `true` if the item was successfully deleted; otherwise, `false`.
 */
export async function deleteCacheItem(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Redis cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Deletes all quiz cache entries matching a given pattern.
 *
 * @param pattern - Optional pattern to match cache keys. Defaults to all quiz-related keys if not provided.
 *
 * @remark If no keys match the pattern, no action is taken.
 */
export async function clearCache(pattern?: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const keysPattern = pattern || 'quiz:*';
    const keys = await client.keys(keysPattern);
    
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Cleared ${keys.length} cache entries matching pattern: ${keysPattern}`);
    }
  } catch (error) {
    console.error('Error clearing Redis cache:', error);
  }
}

// Cache analytics tracking
interface CacheAnalytics {
  hits: number;
  misses: number;
  operations: {
    [key: string]: number;
  };
  keyStats: {
    [key: string]: {
      hits: number;
      misses: number;
      lastAccessed: string;
    };
  };
}

/**
 * Records a cache hit for the specified key, updating global and per-key analytics in Redis.
 *
 * Increments the total hit counter and the hit counter for the given key, updates the last accessed timestamp, and sets a 7-day expiration for per-key statistics.
 *
 * @param key - The cache key for which the hit is recorded.
 */
export async function recordCacheHit(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.hIncrBy('cache:analytics', 'hits', 1);
    
    // Update per-key stats
    const keyStatKey = `cache:keyStats:${key}`;
    await client.hIncrBy(keyStatKey, 'hits', 1);
    await client.hSet(keyStatKey, 'lastAccessed', new Date().toISOString());
    
    // Set expiry for the key stats (7 days)
    await client.expire(keyStatKey, 60 * 60 * 24 * 7);
  } catch (error) {
    console.error(`Error recording cache hit for ${key}:`, error);
  }
}

/**
 * Records a cache miss event for the specified cache key.
 *
 * Increments global and per-key miss counters in Redis analytics, updates the last accessed timestamp, and sets a 7-day expiration for per-key statistics.
 *
 * @param key - The cache key for which the miss is recorded.
 */
export async function recordCacheMiss(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.hIncrBy('cache:analytics', 'misses', 1);
    
    // Update per-key stats
    const keyStatKey = `cache:keyStats:${key}`;
    await client.hIncrBy(keyStatKey, 'misses', 1);
    await client.hSet(keyStatKey, 'lastAccessed', new Date().toISOString());
    
    // Set expiry for the key stats (7 days)
    await client.expire(keyStatKey, 60 * 60 * 24 * 7);
  } catch (error) {
    console.error(`Error recording cache miss for ${key}:`, error);
  }
}

/**
 * Increments the global count for a specific cache operation in analytics.
 *
 * @param operation - The cache operation performed (e.g., 'set', 'get', 'delete').
 * @param key - The cache key involved in the operation.
 */
export async function recordCacheOperation(operation: string, key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.hIncrBy('cache:analytics', `operations:${operation}`, 1);
  } catch (error) {
    console.error(`Error recording cache operation ${operation} for ${key}:`, error);
  }
}

/**
 * Retrieves aggregated cache analytics data, including global hit/miss counts, operation statistics, and per-key usage details.
 *
 * @returns A {@link CacheAnalytics} object containing cache usage metrics, or `null` if retrieval fails.
 */
export async function getCacheAnalytics(): Promise<CacheAnalytics | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const analytics = await client.hGetAll('cache:analytics');
    const keyStatsPattern = 'cache:keyStats:*';
    const keyStatsKeys = await client.keys(keyStatsPattern);
    
    const keyStats: Record<string, any> = {};
    
    // Get stats for each key
    for (const key of keyStatsKeys) {
      const actualKey = key.replace('cache:keyStats:', '');
      const stats = await client.hGetAll(key);
      keyStats[actualKey] = stats;
    }
    
    // Parse the raw analytics data into a structured format
    const hits = parseInt(analytics.hits || '0');
    const misses = parseInt(analytics.misses || '0');
    
    // Extract operation counts
    const operations: Record<string, number> = {};
    Object.entries(analytics).forEach(([key, value]) => {
      if (key.startsWith('operations:')) {
        const op = key.replace('operations:', '');
        operations[op] = parseInt(value);
      }
    });
    
    return {
      hits,
      misses,
      operations,
      keyStats
    };
  } catch (error) {
    console.error('Error getting cache analytics:', error);
    return null;
  }
}
