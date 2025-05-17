import { Quiz } from '../types/quiz';
import { createClient } from 'redis';

// Redis client configuration
// In production, you would use environment variables for these values
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_TTL = 3600; // 1 hour in seconds

// Create Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize and get the Redis client
 * Lazy initialization to avoid connection in environments where Redis isn't needed
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
 * Cache key builder for consistency across the application
 * @param key Base key name
 * @param params Additional parameters to include in the key
 * @returns Formatted cache key
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
 * Get item from Redis cache
 * @param key Cache key
 * @returns Cached data or null if not found
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
 * Set item in Redis cache
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in seconds (optional, defaults to 1 hour)
 * @returns Success status
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
 * Delete item from Redis cache
 * @param key Cache key
 * @returns Success status
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
 * Clear all quiz cache entries or by pattern
 * @param pattern Optional pattern to match keys (e.g., 'quiz:aws*')
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
 * Record cache hit
 * @param key Cache key
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
 * Record cache miss
 * @param key Cache key
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
 * Record a cache operation
 * @param operation Operation name (e.g., 'set', 'get', 'delete')
 * @param key Cache key
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
 * Get cache analytics
 * @returns Cache analytics data
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
