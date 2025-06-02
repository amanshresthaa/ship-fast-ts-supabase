import { test, expect, devices, Browser, Page } from '@playwright/test';

// Test configuration for different devices
const DEVICE_CONFIGS = [
  { name: 'Mobile', device: devices['iPhone 12'] },
  { name: 'Tablet', device: devices['iPad'] },
  { name: 'Desktop', device: devices['Desktop Chrome'] },
  { name: 'Large Desktop', viewport: { width: 1920, height: 1080 } }
];

// Performance thresholds by device type
const PERFORMANCE_THRESHOLDS = {
  mobile: {
    fcp: 2000,    // First Contentful Paint
    lcp: 3000,    // Largest Contentful Paint
    cls: 0.1,     // Cumulative Layout Shift
    fid: 100      // First Input Delay
  },
  tablet: {
    fcp: 1500,
    lcp: 2500,
    cls: 0.1,
    fid: 100
  },
  desktop: {
    fcp: 1000,
    lcp: 2000,
    cls: 0.1,
    fid: 100
  }
};

// Helper function to get Core Web Vitals
async function getCoreWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals: any = {};
      
      // FCP - First Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          vitals.fcp = entries[0].startTime;
        }
      }).observe({ entryTypes: ['paint'] });

      // LCP - Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          vitals.lcp = entries[entries.length - 1].startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // FID - First Input Delay (simulated with click)
      let fidMeasured = false;
      const measureFID = () => {
        if (!fidMeasured) {
          const startTime = performance.now();
          setTimeout(() => {
            vitals.fid = performance.now() - startTime;
            fidMeasured = true;
            resolve(vitals);
          }, 0);
        }
      };

      // Trigger FID measurement after a short delay
      setTimeout(measureFID, 1000);
      
      // Fallback resolve after 3 seconds
      setTimeout(() => resolve(vitals), 3000);
    });
  });
}

// Helper function to check responsive breakpoints
async function checkBreakpoints(page: Page) {
  const breakpoints = await page.evaluate(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      sm: computedStyle.getPropertyValue('--breakpoint-sm') || '640px',
      md: computedStyle.getPropertyValue('--breakpoint-md') || '768px',
      lg: computedStyle.getPropertyValue('--breakpoint-lg') || '1024px',
      xl: computedStyle.getPropertyValue('--breakpoint-xl') || '1280px',
      '2xl': computedStyle.getPropertyValue('--breakpoint-2xl') || '1536px'
    };
  });

  return breakpoints;
}

// Helper function to test component responsiveness
async function testComponentResponsiveness(page: Page, selector: string) {
  const element = page.locator(selector);
  
  // Check if element exists
  await expect(element).toBeVisible();
  
  // Get element dimensions and styles
  const elementInfo = await element.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const styles = getComputedStyle(el);
    
    return {
      width: rect.width,
      height: rect.height,
      fontSize: styles.fontSize,
      padding: styles.padding,
      margin: styles.margin,
      display: styles.display,
      flexDirection: styles.flexDirection,
      gridTemplateColumns: styles.gridTemplateColumns
    };
  });

  return elementInfo;
}

// Test suite for responsive design
test.describe('Responsive Design Tests', () => {
  
  DEVICE_CONFIGS.forEach(({ name, device, viewport }) => {
    test.describe(`${name} Device Tests`, () => {
      
      test.beforeEach(async ({ page, browser }) => {
        if (device) {
          await page.setViewportSize(device.viewport);
          await page.setUserAgent(device.userAgent || '');
        } else if (viewport) {
          await page.setViewportSize(viewport);
        }
      });

      test('should load responsive test page correctly', async ({ page }) => {
        await page.goto('/test-responsive');
        
        // Check if page loads without errors
        await expect(page).toHaveTitle(/Responsive Design Test/);
        
        // Check if main responsive container is present
        await expect(page.locator('[data-testid="responsive-container"]')).toBeVisible();
      });

      test('should display correct breakpoint information', async ({ page }) => {
        await page.goto('/test-responsive');
        
        // Wait for responsive hook to initialize
        await page.waitForTimeout(500);
        
        // Check breakpoint display
        const breakpointInfo = page.locator('[data-testid="breakpoint-info"]');
        await expect(breakpointInfo).toBeVisible();
        
        // Verify breakpoint matches device
        const breakpointText = await breakpointInfo.textContent();
        if (name === 'Mobile') {
          expect(breakpointText).toContain('mobile: true');
        } else if (name === 'Tablet') {
          expect(breakpointText).toContain('tablet: true');
        } else {
          expect(breakpointText).toContain('desktop: true');
        }
      });

      test('should have proper responsive typography', async ({ page }) => {
        await page.goto('/test-responsive');
        
        // Test heading responsiveness
        const heading = page.locator('h1').first();
        const headingInfo = await testComponentResponsiveness(page, 'h1');
        
        // Verify font sizes are appropriate for device
        const fontSize = parseFloat(headingInfo.fontSize);
        if (name === 'Mobile') {
          expect(fontSize).toBeGreaterThanOrEqual(24); // Minimum readable size
          expect(fontSize).toBeLessThanOrEqual(32);
        } else if (name === 'Tablet') {
          expect(fontSize).toBeGreaterThanOrEqual(28);
          expect(fontSize).toBeLessThanOrEqual(40);
        } else {
          expect(fontSize).toBeGreaterThanOrEqual(32);
        }
      });

      test('should have proper responsive grid layout', async ({ page }) => {
        await page.goto('/test-responsive');
        
        // Test ResponsiveGrid component
        const grid = page.locator('[data-testid="responsive-grid"]');
        if (await grid.count() > 0) {
          const gridInfo = await testComponentResponsiveness(page, '[data-testid="responsive-grid"]');
          
          // Check grid template columns
          if (name === 'Mobile') {
            expect(gridInfo.gridTemplateColumns).toMatch(/repeat\(1,|1fr/);
          } else if (name === 'Tablet') {
            expect(gridInfo.gridTemplateColumns).toMatch(/repeat\([2-3],|1fr 1fr/);
          } else {
            expect(gridInfo.gridTemplateColumns).toMatch(/repeat\([3-6],|1fr 1fr 1fr/);
          }
        }
      });

      test('should have proper image optimization', async ({ page }) => {
        await page.goto('/test-responsive');
        
        // Wait for images to load
        await page.waitForLoadState('networkidle');
        
        // Check optimized images
        const images = page.locator('[data-testid="optimized-image"]');
        const imageCount = await images.count();
        
        if (imageCount > 0) {
          const firstImage = images.first();
          await expect(firstImage).toBeVisible();
          
          // Check if image has proper loading attributes
          const loading = await firstImage.getAttribute('loading');
          expect(loading).toBe('lazy');
          
          // Check if image has proper dimensions
          const imageInfo = await firstImage.evaluate((img: HTMLImageElement) => ({
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            displayWidth: img.width,
            displayHeight: img.height
          }));
          
          expect(imageInfo.naturalWidth).toBeGreaterThan(0);
          expect(imageInfo.naturalHeight).toBeGreaterThan(0);
        }
      });

      test('should meet performance thresholds', async ({ page }) => {
        await page.goto('/test-responsive');
        
        // Get performance metrics
        const vitals = await getCoreWebVitals(page);
        const deviceType = name.toLowerCase().includes('mobile') ? 'mobile' : 
                          name.toLowerCase().includes('tablet') ? 'tablet' : 'desktop';
        const thresholds = PERFORMANCE_THRESHOLDS[deviceType];
        
        // Check Core Web Vitals
        if (vitals.fcp) {
          expect(vitals.fcp).toBeLessThan(thresholds.fcp);
        }
        if (vitals.lcp) {
          expect(vitals.lcp).toBeLessThan(thresholds.lcp);
        }
        if (vitals.cls !== undefined) {
          expect(vitals.cls).toBeLessThan(thresholds.cls);
        }
        if (vitals.fid !== undefined) {
          expect(vitals.fid).toBeLessThan(thresholds.fid);
        }
      });

      test('should handle touch interactions properly', async ({ page }) => {
        if (!name.includes('Mobile') && !name.includes('Tablet')) return;
        
        await page.goto('/test-responsive');
        
        // Test touch-friendly elements
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          const firstButton = buttons.first();
          const buttonInfo = await testComponentResponsiveness(page, 'button');
          
          // Check minimum touch target size (44px x 44px)
          expect(buttonInfo.width).toBeGreaterThanOrEqual(44);
          expect(buttonInfo.height).toBeGreaterThanOrEqual(44);
        }
      });

      test('should be accessible with keyboard navigation', async ({ page }) => {
        await page.goto('/test-responsive');
        
        // Test tab navigation
        await page.keyboard.press('Tab');
        
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();
        
        // Check focus indicators
        const focusedInfo = await focused.evaluate((el) => {
          const styles = getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow
          };
        });
        
        // Should have visible focus indicator
        const hasFocusIndicator = focusedInfo.outline !== 'none' || 
                                 focusedInfo.outlineWidth !== '0px' || 
                                 focusedInfo.boxShadow !== 'none';
        expect(hasFocusIndicator).toBe(true);
      });
    });
  });

  test.describe('Cross-Device Consistency Tests', () => {
    
    test('should maintain layout consistency across devices', async ({ browser }) => {
      const results: any = {};
      
      // Test on each device
      for (const { name, device, viewport } of DEVICE_CONFIGS) {
        const context = await browser.newContext(device || { viewport });
        const page = await context.newPage();
        
        await page.goto('/test-responsive');
        await page.waitForLoadState('networkidle');
        
        // Take screenshot for visual comparison
        const screenshot = await page.screenshot({ fullPage: true });
        
        // Get layout information
        const layoutInfo = await page.evaluate(() => {
          const container = document.querySelector('[data-testid="responsive-container"]');
          if (!container) return null;
          
          const rect = container.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            childCount: container.children.length
          };
        });
        
        results[name] = { screenshot, layoutInfo };
        await context.close();
      }
      
      // Verify consistent child count across devices
      const childCounts = Object.values(results).map((r: any) => r.layoutInfo?.childCount);
      const uniqueChildCounts = [...new Set(childCounts)];
      expect(uniqueChildCounts.length).toBe(1); // All devices should have same number of children
    });
  });

  test.describe('Animation Performance Tests', () => {
    
    test('should handle animations smoothly on all devices', async ({ page }) => {
      await page.goto('/test-responsive');
      
      // Check for animation performance
      const animationPerformance = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameCount = 0;
          let droppedFrames = 0;
          let lastTime = performance.now();
          
          const measureFrames = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime > 16.67 * 2) { // More than 2 frames at 60fps
              droppedFrames++;
            }
            
            frameCount++;
            lastTime = currentTime;
            
            if (frameCount < 60) {
              requestAnimationFrame(measureFrames);
            } else {
              resolve({
                totalFrames: frameCount,
                droppedFrames,
                fps: Math.round(1000 / (deltaTime / frameCount))
              });
            }
          };
          
          requestAnimationFrame(measureFrames);
        });
      });
      
      // Expect smooth animation performance
      expect(animationPerformance.droppedFrames).toBeLessThan(5);
      expect(animationPerformance.fps).toBeGreaterThan(30);
    });
  });
});
