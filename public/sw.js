// Service Worker for Advanced Image Caching and Performance Optimization
const CACHE_NAME = 'responsive-images-v1';
const IMAGE_CACHE_NAME = 'images-v1';

// Cache versioning and cleanup
const CACHE_VERSION = '1.0.0';
const MAX_CACHE_SIZE = 50; // Maximum number of cached images
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Image formats and quality settings
const SUPPORTED_FORMATS = ['webp', 'avif', 'jpeg', 'png', 'svg'];
const QUALITY_SETTINGS = {
  'slow-2g': { quality: 30, format: 'webp' },
  '2g': { quality: 50, format: 'webp' },
  '3g': { quality: 70, format: 'webp' },
  '4g': { quality: 85, format: 'webp' },
  'fast': { quality: 90, format: 'webp' }
};

// Device-specific image sizes
const RESPONSIVE_BREAKPOINTS = {
  mobile: { width: 480, height: 480 },
  tablet: { width: 768, height: 768 },
  desktop: { width: 1200, height: 1200 },
  xl: { width: 1920, height: 1920 }
};

// Utility functions
function getDeviceType() {
  const width = self.screen?.width || 1920;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1440) return 'desktop';
  return 'xl';
}

function getConnectionType() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connection?.effectiveType || '4g';
}

function getOptimalImageSettings() {
  const connectionType = getConnectionType();
  const deviceType = getDeviceType();
  
  const qualitySettings = QUALITY_SETTINGS[connectionType] || QUALITY_SETTINGS['4g'];
  const sizeSettings = RESPONSIVE_BREAKPOINTS[deviceType];
  
  return { ...qualitySettings, ...sizeSettings };
}

function isImageRequest(url) {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
  return imageExtensions.test(url) || url.includes('images.unsplash.com') || url.includes('image');
}

function getCacheKey(url, settings) {
  const deviceType = getDeviceType();
  const connectionType = getConnectionType();
  return `${url}-${deviceType}-${connectionType}-${settings.quality}`;
}

// Cache management
async function cleanupCache() {
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove expired entries
    const now = Date.now();
    const expiredRequests = [];
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = response.headers.get('sw-cached-time');
        if (cachedTime && (now - parseInt(cachedTime)) > CACHE_EXPIRY) {
          expiredRequests.push(request);
        }
      }
    }
    
    // Remove expired entries
    await Promise.all(expiredRequests.map(request => cache.delete(request)));
    
    // If still too many entries, remove oldest
    const remainingRequests = await cache.keys();
    if (remainingRequests.length > MAX_CACHE_SIZE) {
      const toRemove = remainingRequests.slice(0, remainingRequests.length - MAX_CACHE_SIZE);
      await Promise.all(toRemove.map(request => cache.delete(request)));
    }
    
    console.log(`Cache cleanup completed. Removed ${expiredRequests.length} expired entries.`);
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

// Progressive image loading with blur placeholder
function generateBlurPlaceholder(width, height) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Create a simple gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.1 });
}

// Advanced image optimization
async function optimizeImage(imageBlob, settings) {
  try {
    // For now, return the original blob
    // In a real implementation, you could use ImageBitmap API or WebAssembly
    // to perform actual image compression and format conversion
    return imageBlob;
  } catch (error) {
    console.error('Image optimization failed:', error);
    return imageBlob;
  }
}

// Service Worker event handlers
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker cache opened');
      return cache.addAll([
        '/',
        '/test-responsive'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Initial cache cleanup
      cleanupCache(),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  // Handle image requests with advanced caching
  if (isImageRequest(url.pathname) || isImageRequest(url.href)) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Handle other requests with basic caching
  event.respondWith(handleGenericRequest(request));
});

async function handleImageRequest(request) {
  try {
    const settings = getOptimalImageSettings();
    const cacheKey = getCacheKey(request.url, settings);
    const cache = await caches.open(IMAGE_CACHE_NAME);
    
    // Try to get from cache first
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      // Check if cache is still valid
      const cachedTime = cachedResponse.headers.get('sw-cached-time');
      if (cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_EXPIRY) {
        console.log('Serving cached image:', request.url);
        return cachedResponse;
      }
    }
    
    // Fetch from network
    console.log('Fetching image from network:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone the response for caching
      const responseClone = response.clone();
      
      // Get the image blob
      const imageBlob = await response.blob();
      
      // Optimize the image based on connection and device
      const optimizedBlob = await optimizeImage(imageBlob, settings);
      
      // Create optimized response with cache headers
      const optimizedResponse = new Response(optimizedBlob, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'sw-cached-time': Date.now().toString(),
          'sw-device-type': getDeviceType(),
          'sw-connection-type': getConnectionType(),
          'cache-control': 'public, max-age=31536000', // 1 year
        }
      });
      
      // Cache the optimized response
      await cache.put(cacheKey, optimizedResponse.clone());
      
      // Perform background cache cleanup
      setTimeout(() => cleanupCache(), 1000);
      
      return optimizedResponse;
    }
    
    // If network fails, try to return a placeholder
    const placeholderBlob = await generateBlurPlaceholder(
      settings.width || 400, 
      settings.height || 400
    );
    
    return new Response(placeholderBlob, {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
        'sw-placeholder': 'true'
      }
    });
    
  } catch (error) {
    console.error('Image request failed:', error);
    
    // Return a simple placeholder on error
    const placeholderBlob = await generateBlurPlaceholder(400, 400);
    return new Response(placeholderBlob, {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
        'sw-error': 'true'
      }
    });
  }
}

async function handleGenericRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version and update in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response);
        }
      }).catch(() => {
        // Ignore background update failures
      });
      
      return cachedResponse;
    }
    
    // Fetch from network
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.error('Generic request failed:', error);
    
    // Try to return cached version as fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a basic error response
    return new Response('Network error', { status: 503 });
  }
}

// Background sync for performance metrics
self.addEventListener('sync', (event) => {
  if (event.tag === 'performance-sync') {
    event.waitUntil(syncPerformanceData());
  }
});

async function syncPerformanceData() {
  try {
    // Send performance data to analytics endpoint
    const performanceData = {
      cacheHits: await getCacheStats(),
      connectionType: getConnectionType(),
      deviceType: getDeviceType(),
      timestamp: Date.now()
    };
    
    // In a real application, you would send this to your analytics service
    console.log('Performance data:', performanceData);
    
  } catch (error) {
    console.error('Performance sync failed:', error);
  }
}

async function getCacheStats() {
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const requests = await cache.keys();
    return requests.length;
  } catch (error) {
    return 0;
  }
}

// Periodic cache cleanup
setInterval(() => {
  cleanupCache();
}, 60 * 60 * 1000); // Every hour

console.log('Responsive Image Service Worker loaded successfully');
