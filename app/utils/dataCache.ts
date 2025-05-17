'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';

/**
 * Simple in-memory cache with expiration and memory management
 */
export class DataCache {
  private cache = new Map<string, {
    value: any;
    expiry: number | null;
    lastAccessed: number;
  }>();
  
  private maxEntries: number;
  private defaultTTL: number | null;
  private cleanupInterval: number;
  private subscribers: Set<() => void> = new Set();
  
  constructor(options: {
    maxEntries?: number;
    defaultTTL?: number | null;
    cleanupInterval?: number;
  } = {}) {
    this.maxEntries = options.maxEntries || 100;
    this.defaultTTL = options.defaultTTL !== undefined ? options.defaultTTL : 60 * 1000; // Default 1 minute
    this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // Default 5 minutes
    
    // Set up periodic cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in ms (null for no expiration)
   */
  set(key: string, value: any, ttl: number | null = this.defaultTTL): void {
    // Check if we need to make room
    if (!this.cache.has(key) && this.cache.size >= this.maxEntries) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(key, {
      value,
      expiry: ttl !== null ? Date.now() + ttl : null,
      lastAccessed: Date.now()
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found/expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if expired
    if (entry.expiry !== null && Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.notifySubscribers();
      return undefined;
    }
    
    // Update last accessed time
    entry.lastAccessed = Date.now();
    return entry.value;
  }
  
  /**
   * Check if a key exists and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (entry.expiry !== null && Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.notifySubscribers();
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    if (this.cache.delete(key)) {
      this.notifySubscribers();
    }
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    if (this.cache.size > 0) {
      this.cache.clear();
      this.notifySubscribers();
    }
  }
  
  /**
   * Get all non-expired keys
   */
  keys(): string[] {
    const now = Date.now();
    const keys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry === null || entry.expiry > now) {
        keys.push(key);
      }
    }
    
    return keys;
  }
  
  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    let hasDeleted = false;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry !== null && entry.expiry <= now) {
        this.cache.delete(key);
        hasDeleted = true;
      }
    }
    
    if (hasDeleted) {
      this.notifySubscribers();
    }
  }
  
  /**
   * Evict least recently used item
   */
  private evictLeastRecentlyUsed(): void {
    let oldest: { key: string; time: number } | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.lastAccessed < oldest.time) {
        oldest = { key, time: entry.lastAccessed };
      }
    }
    
    if (oldest) {
      this.cache.delete(oldest.key);
    }
  }
  
  /**
   * Subscribe to cache changes
   * @param callback Function to call when cache changes
   * @returns Unsubscribe function
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  /**
   * Notify subscribers of cache changes
   */
  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber();
    }
  }
}

// Create global cache instance
export const globalCache = typeof window !== 'undefined'
  ? new DataCache({ maxEntries: 500, defaultTTL: 5 * 60 * 1000 })
  : null;

/**
 * React hook for using the data cache
 * @param key Cache key
 * @param initialData Initial data if not in cache
 * @param options Cache options
 */
export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T> | T,
  options: {
    initialData?: T;
    ttl?: number | null;
    revalidateOnMount?: boolean;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  } = {}
) {
  const {
    initialData,
    ttl,
    revalidateOnMount = true,
    revalidateOnFocus = true,
    revalidateOnReconnect = true
  } = options;
  
  // Create a cache if we don't have the global one (e.g. in SSR)
  const cacheRef = useRef(globalCache || new DataCache());
  
  // Use sync external store to subscribe to cache changes
  const cachedData = useSyncExternalStore(
    (callback) => cacheRef.current.subscribe(callback),
    () => cacheRef.current.get(key),
    () => initialData as T // Server value
  );
  
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to load data
  const loadData = useCallback(async () => {
    if (!key) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetcher();
      
      // Update cache
      cacheRef.current.set(key, data, ttl);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl]);
  
  // Set initial data if provided
  useEffect(() => {
    if (initialData !== undefined && !cacheRef.current.has(key)) {
      cacheRef.current.set(key, initialData, ttl);
    }
  }, [key, initialData, ttl]);
  
  // Load data on mount if needed
  useEffect(() => {
    if (revalidateOnMount || !cacheRef.current.has(key)) {
      loadData().catch(console.error);
    }
  }, [key, loadData, revalidateOnMount]);
  
  // Set up focus and online listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleFocus = () => {
      if (revalidateOnFocus) {
        loadData().catch(console.error);
      }
    };
    
    const handleOnline = () => {
      if (revalidateOnReconnect) {
        loadData().catch(console.error);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadData, revalidateOnFocus, revalidateOnReconnect]);
  
  // Function to manually refresh data
  const refresh = useCallback(() => {
    return loadData();
  }, [loadData]);
  
  return {
    data: cachedData as T | undefined,
    isLoading,
    error,
    refresh,
    remove: () => cacheRef.current.delete(key)
  };
}
