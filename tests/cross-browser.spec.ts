/**
 * Cross-Browser Compatibility Testing
 * 
 * Tests responsive design across different browsers and devices
 */

import { test, expect, devices } from '@playwright/test';

// Browser configurations
const browsers = [
  { name: 'Chrome', channel: 'chrome' },
  { name: 'Firefox', channel: 'firefox' },
  { name: 'Safari', channel: 'webkit' },
  { name: 'Edge', channel: 'msedge' }
];

// Device and viewport configurations
const testConfigurations = [
  {
    name: 'iPhone 12',
    device: devices['iPhone 12'],
    features: ['touch', 'mobile', 'notch']
  },
  {
    name: 'iPad Pro',
    device: devices['iPad Pro'],
    features: ['touch', 'tablet']
  },
  {
    name: 'Desktop HD',
    device: {
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      hasTouch: false,
      isMobile: false
    },
    features: ['desktop', 'high-resolution']
  },
  {
    name: 'Desktop 4K',
    device: {
      viewport: { width: 3840, height: 2160 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      hasTouch: false,
      isMobile: false,
      deviceScaleFactor: 2
    },
    features: ['desktop', 'ultra-high-resolution']
  }
];

// CSS features to test for support
const cssFeatures = [
  'display: grid',
  'display: flex',
  'position: sticky',
  'backdrop-filter: blur(10px)',
  'aspect-ratio: 16/9',
  'gap: 1rem',
  'clamp(1rem, 5vw, 3rem)',
  'min(100%, 500px)',
  'max(50px, 10vw)',
  'container-type: inline-size'
];

// Performance thresholds by device type
const performanceThresholds = {
  mobile: {
    FCP: 2000,  // First Contentful Paint
    LCP: 3000,  // Largest Contentful Paint
    CLS: 0.1,   // Cumulative Layout Shift
    FID: 100    // First Input Delay
  },
  tablet: {
    FCP: 1500,
    LCP: 2500,
    CLS: 0.1,
    FID: 100
  },
  desktop: {
    FCP: 1000,
    LCP: 2000,
    CLS: 0.1,
    FID: 100
  }
};

// Test pages and components
const testPages = [
  { path: '/', name: 'HomePage', critical: true },
  { path: '/quizzes', name: 'QuizzesPage', critical: true },
  { path: '/blog', name: 'BlogPage', critical: false },
  { path: '/signin', name: 'SignInPage', critical: true }
];

// Utility functions
const getDeviceCategory = (config) => {
  if (config.features.includes('mobile')) return 'mobile';
  if (config.features.includes('tablet')) return 'tablet';
  return 'desktop';
};

const measurePerformance = async (page) => {
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          
          resolve({
            FCP: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            LCP: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart
          });
        });
      } else {
        setTimeout(() => resolve({}), 1000);
      }
    });
  });
  
  return metrics;
};

const testCSSFeatureSupport = async (page) => {
  const support = await page.evaluate((features) => {
    const results = {};
    
    features.forEach(feature => {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);
      
      try {
        testElement.style.cssText = feature;
        results[feature] = testElement.style.cssText.includes(feature.split(':')[1].trim());
      } catch (e) {
        results[feature] = false;
      }
      
      document.body.removeChild(testElement);
    });
    
    return results;
  }, cssFeatures);
  
  return support;
};

// Main test suites
for (const config of testConfigurations) {
  test.describe(`Cross-Browser Tests - ${config.name}`, () => {
    test.use(config.device);

    for (const page of testPages) {
      test(`${page.name} - Layout and Functionality`, async ({ page: browser }) => {
        await browser.goto(page.path);
        await browser.waitForLoadState('networkidle');

        // Basic layout verification
        await expect(browser.locator('body')).toBeVisible();
        await expect(browser.locator('header, nav')).toBeVisible();

        // Responsive layout checks
        const deviceCategory = getDeviceCategory(config);
        
        if (deviceCategory === 'mobile') {
          // Mobile-specific tests
          await expect(browser.locator('.mobile-hidden')).toBeHidden();
          await expect(browser.locator('.mobile-visible')).toBeVisible();
          
          // Touch-friendly button sizes
          const buttons = browser.locator('button, [role="button"]');
          const buttonCount = await buttons.count();
          
          for (let i = 0; i < Math.min(buttonCount, 5); i++) {
            const buttonBox = await buttons.nth(i).boundingBox();
            if (buttonBox) {
              expect(buttonBox.height).toBeGreaterThanOrEqual(44); // iOS touch target
              expect(buttonBox.width).toBeGreaterThanOrEqual(44);
            }
          }
        } else if (deviceCategory === 'desktop') {
          // Desktop-specific tests
          await expect(browser.locator('.desktop-hidden')).toBeHidden();
          await expect(browser.locator('.desktop-visible')).toBeVisible();
        }

        // Performance testing
        const metrics = await measurePerformance(browser);
        const thresholds = performanceThresholds[deviceCategory];
        
        if (page.critical && metrics.FCP) {
          expect(metrics.FCP).toBeLessThan(thresholds.FCP);
        }

        // CSS feature support
        const cssSupport = await testCSSFeatureSupport(browser);
        console.log(`CSS Feature Support for ${config.name}:`, cssSupport);

        // Visual regression test
        await expect(browser).toHaveScreenshot(
          `${page.name}-${config.name.replace(/\s+/g, '-').toLowerCase()}.png`,
          {
            fullPage: true,
            threshold: 0.2,
            maxDiffPixels: 2000
          }
        );
      });

      test(`${page.name} - Interaction Testing`, async ({ page: browser }) => {
        await browser.goto(page.path);
        await browser.waitForLoadState('networkidle');

        // Test navigation
        const navLinks = browser.locator('nav a[href], header a[href]');
        const linkCount = await navLinks.count();
        
        if (linkCount > 0) {
          // Test first navigation link
          const firstLink = navLinks.first();
          await expect(firstLink).toBeVisible();
          
          if (config.features.includes('touch')) {
            await firstLink.tap();
          } else {
            await firstLink.click();
          }
          
          await browser.waitForLoadState('networkidle');
          await browser.goBack();
        }

        // Test form interactions (if present)
        const forms = browser.locator('form');
        const formCount = await forms.count();
        
        if (formCount > 0) {
          const inputs = forms.first().locator('input, textarea, select');
          const inputCount = await inputs.count();
          
          for (let i = 0; i < Math.min(inputCount, 3); i++) {
            const input = inputs.nth(i);
            const inputType = await input.getAttribute('type');
            
            if (inputType !== 'submit' && inputType !== 'button') {
              await input.focus();
              await expect(input).toBeFocused();
              
              if (inputType === 'text' || inputType === 'email') {
                await input.fill('test input');
                await expect(input).toHaveValue('test input');
              }
            }
          }
        }

        // Test modal/overlay interactions
        const modalTriggers = browser.locator('[data-modal], [aria-haspopup="dialog"]');
        const triggerCount = await modalTriggers.count();
        
        if (triggerCount > 0) {
          if (config.features.includes('touch')) {
            await modalTriggers.first().tap();
          } else {
            await modalTriggers.first().click();
          }
          
          // Check if modal appeared
          const modal = browser.locator('[role="dialog"], .modal');
          await expect(modal).toBeVisible({ timeout: 3000 });
          
          // Close modal
          const closeButton = modal.locator('[aria-label*="close"], .modal-close, .btn-close');
          if (await closeButton.count() > 0) {
            await closeButton.first().click();
            await expect(modal).toBeHidden();
          }
        }
      });

      test(`${page.name} - Accessibility Testing`, async ({ page: browser }) => {
        await browser.goto(page.path);
        await browser.waitForLoadState('networkidle');

        // Check for essential accessibility features
        const headings = browser.locator('h1, h2, h3, h4, h5, h6');
        await expect(headings.first()).toBeVisible();

        // Check for proper heading hierarchy
        const h1Count = await browser.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
        expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1

        // Check for alt text on images
        const images = browser.locator('img');
        const imageCount = await images.count();
        
        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const alt = await images.nth(i).getAttribute('alt');
          expect(alt).toBeTruthy();
        }

        // Check for form labels
        const inputs = browser.locator('input[type!="hidden"], textarea, select');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          
          if (id) {
            const label = browser.locator(`label[for="${id}"]`);
            const labelExists = await label.count() > 0;
            expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy();
          }
        }

        // Keyboard navigation test
        await browser.keyboard.press('Tab');
        const focusedElement = browser.locator(':focus');
        await expect(focusedElement).toBeVisible();
      });
    }
  });
}

// Browser-specific feature tests
test.describe('Browser-Specific Features', () => {
  test('Modern CSS Grid Support', async ({ page }) => {
    await page.goto('/');
    
    const gridSupport = await page.evaluate(() => {
      return CSS.supports('display', 'grid') && CSS.supports('grid-template-columns', '1fr 1fr');
    });
    
    expect(gridSupport).toBeTruthy();
  });

  test('Flexbox Support', async ({ page }) => {
    await page.goto('/');
    
    const flexSupport = await page.evaluate(() => {
      return CSS.supports('display', 'flex') && CSS.supports('flex-direction', 'column');
    });
    
    expect(flexSupport).toBeTruthy();
  });

  test('Custom Properties (CSS Variables)', async ({ page }) => {
    await page.goto('/');
    
    const customPropsSupport = await page.evaluate(() => {
      return CSS.supports('color', 'var(--test-color)');
    });
    
    expect(customPropsSupport).toBeTruthy();
  });

  test('Modern Image Formats', async ({ page }) => {
    await page.goto('/');
    
    const formatSupport = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      // AVIF support is harder to detect, so we'll just check WebP
      return { webp: webpSupport };
    });
    
    console.log('Image format support:', formatSupport);
  });
});
