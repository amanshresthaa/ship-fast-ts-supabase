/**
 * Visual Regression Testing Suite
 * 
 * Comprehensive visual testing across devices and components
 * Features: Cross-device screenshots, animation testing, theme testing
 */

import { test, expect, devices, type Page } from '@playwright/test';

// Test configurations for different device types
const deviceConfigs = [
  {
    name: 'Mobile',
    device: devices['iPhone 12'],
    viewport: { width: 390, height: 844 }
  },
  {
    name: 'Tablet',
    device: devices['iPad Pro'],
    viewport: { width: 1024, height: 1366 }
  },
  {
    name: 'Desktop',
    device: devices['Desktop Chrome'],
    viewport: { width: 1920, height: 1080 }
  }
];

// Components to test visually
const componentsToTest = [
  { path: '/', name: 'HomePage' },
  { path: '/quizzes', name: 'QuizzesPage' },
  { path: '/blog', name: 'BlogPage' },
  { path: '/signin', name: 'SignInPage' }
];

// Theme configurations
const themes = [
  { name: 'light', attribute: 'data-theme', value: 'light' },
  { name: 'dark', attribute: 'data-theme', value: 'dark' }
];

// Utility functions
const waitForAnimations = async (page: Page) => {
  // Wait for CSS animations to complete
  await page.waitForFunction(() => {
    const elements = document.querySelectorAll('*');
    return Array.from(elements).every(el => {
      const computedStyle = window.getComputedStyle(el);
      const animationDuration = computedStyle.animationDuration;
      const transitionDuration = computedStyle.transitionDuration;
      return animationDuration === '0s' && transitionDuration === '0s';
    });
  }, { timeout: 10000 });
  
  // Additional wait to ensure stability
  await page.waitForTimeout(1000);
};

const disableAnimations = async (page: Page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `
  });
};

const mockImages = async (page: Page) => {
  await page.route('**/*.(png|jpg|jpeg|gif|webp|avif)', route => {
    // Serve a consistent placeholder image for visual testing
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      )
    });
  });
};

// Main test suite
for (const deviceConfig of deviceConfigs) {
  test.describe(`Visual Regression - ${deviceConfig.name}`, () => {
    test.use({ ...deviceConfig.device });

    for (const component of componentsToTest) {
      for (const theme of themes) {
        test(`${component.name} - ${theme.name} theme - ${deviceConfig.name}`, async ({ page }) => {
          // Setup
          await page.setViewportSize(deviceConfig.viewport);
          await disableAnimations(page);
          await mockImages(page);

          // Navigate to component
          await page.goto(component.path);

          // Set theme
          await page.addInitScript(({ attribute, value }) => {
            document.documentElement.setAttribute(attribute, value);
          }, theme);

          // Wait for page to be ready
          await page.waitForLoadState('networkidle');
          await waitForAnimations(page);

          // Take screenshot
          await expect(page).toHaveScreenshot(
            `${component.name}-${theme.name}-${deviceConfig.name.toLowerCase()}.png`,
            {
              fullPage: true,
              threshold: 0.2,
              maxDiffPixels: 1000
            }
          );
        });
      }
    }
  });
}

// Component-specific visual tests
test.describe('Component Visual Tests', () => {
  test('Modal component variations', async ({ page }) => {
    await page.goto('/');
    await disableAnimations(page);

    // Test different modal sizes
    const modalSizes = ['sm', 'md', 'lg', 'xl', 'full'];
    
    for (const size of modalSizes) {
      await page.evaluate((size) => {
        // Simulate opening modal with specific size
        const modal = document.createElement('div');
        modal.setAttribute('data-modal-size', size);
        modal.innerHTML = `
          <div class="modal modal-open">
            <div class="modal-box">
              <h2>Test Modal - ${size}</h2>
              <p>This is a test modal for visual regression testing.</p>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }, size);

      await expect(page).toHaveScreenshot(`modal-${size}.png`);

      // Clean up
      await page.evaluate(() => {
        const modal = document.querySelector('[data-modal-size]');
        if (modal) modal.remove();
      });
    }
  });

  test('Responsive grid layouts', async ({ page }) => {
    await page.goto('/');
    await disableAnimations(page);

    // Test grid at different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow layout to adjust

      // Focus on grid components
      const gridSelector = '[class*="grid"], [class*="ResponsiveGrid"]';
      const grids = await page.locator(gridSelector).all();

      for (let i = 0; i < grids.length; i++) {
        await expect(grids[i]).toHaveScreenshot(
          `grid-${i}-${viewport.name}.png`,
          { threshold: 0.2 }
        );
      }
    }
  });

  test('Button states and variants', async ({ page }) => {
    await page.goto('/');
    await disableAnimations(page);

    // Create test buttons with different states
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.background = 'white';
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <button class="btn btn-primary">Primary</button>
          <button class="btn btn-secondary">Secondary</button>
          <button class="btn btn-primary" disabled>Disabled</button>
          <button class="btn btn-primary btn-loading">Loading</button>
          <button class="btn btn-sm">Small</button>
          <button class="btn btn-lg">Large</button>
        </div>
      `;
      document.body.appendChild(container);
    });

    await expect(page.locator('div').last()).toHaveScreenshot('button-variants.png');
  });

  test('Form components responsive behavior', async ({ page }) => {
    await page.goto('/signin');
    await disableAnimations(page);

    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 1024, height: 768, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(
        `signin-form-${viewport.name}.png`,
        { fullPage: true, threshold: 0.2 }
      );
    }
  });
});

// Animation visual tests
test.describe('Animation Visual Tests', () => {
  test('Scroll-triggered animations', async ({ page }) => {
    await page.goto('/');
    
    // Enable animations for this test
    await page.evaluate(() => {
      // Remove animation disabling styles
      const styleSheets = Array.from(document.styleSheets);
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules);
          rules.forEach((rule, index) => {
            if (rule.cssText.includes('animation-duration: 0s')) {
              sheet.deleteRule(index);
            }
          });
        } catch (e) {
          // Cross-origin stylesheets may throw errors
        }
      });
    });

    // Scroll through page and capture animation states
    const scrollPositions = [0, 500, 1000, 1500];
    
    for (const position of scrollPositions) {
      await page.evaluate((pos) => window.scrollTo(0, pos), position);
      await page.waitForTimeout(1000); // Allow animations to trigger
      
      await expect(page).toHaveScreenshot(
        `scroll-animations-${position}.png`,
        { fullPage: true, threshold: 0.3 }
      );
    }
  });

  test('Hover state animations', async ({ page }) => {
    await page.goto('/');
    await disableAnimations(page);

    // Find interactive elements
    const interactiveElements = [
      'button',
      'a[href]',
      '[role="button"]',
      '.btn'
    ];

    for (const selector of interactiveElements) {
      const elements = await page.locator(selector).all();
      
      for (let i = 0; i < Math.min(elements.length, 3); i++) {
        // Normal state
        await expect(elements[i]).toHaveScreenshot(
          `${selector.replace(/\W/g, '_')}-${i}-normal.png`,
          { threshold: 0.2 }
        );

        // Hover state
        await elements[i].hover();
        await page.waitForTimeout(300);
        
        await expect(elements[i]).toHaveScreenshot(
          `${selector.replace(/\W/g, '_')}-${i}-hover.png`,
          { threshold: 0.2 }
        );
      }
    }
  });
});

// Performance-related visual tests
test.describe('Performance Visual Tests', () => {
  test('Loading states', async ({ page }) => {
    // Test various loading states
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Capture loading skeleton/placeholder state
    await expect(page).toHaveScreenshot('loading-state.png', {
      threshold: 0.2
    });

    // Wait for full load and capture final state
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);
    
    await expect(page).toHaveScreenshot('loaded-state.png', {
      threshold: 0.2
    });
  });

  test('Progressive image loading', async ({ page }) => {
    // Test progressive image loading behavior
    await page.goto('/');
    
    // Throttle network to simulate slow loading
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50000, // 50kb/s
      uploadThroughput: 50000,
      latency: 100
    });

    // Capture images in various loading states
    const images = await page.locator('img').all();
    
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      await expect(images[i]).toHaveScreenshot(
        `image-loading-${i}.png`,
        { threshold: 0.3 }
      );
    }
  });
});

// Error state visual tests
test.describe('Error State Visual Tests', () => {
  test('404 page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await disableAnimations(page);
    await waitForAnimations(page);

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
      threshold: 0.2
    });
  });

  test('Network error states', async ({ page }) => {
    // Block network requests to simulate offline state
    await page.route('**/*', route => route.abort());
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('network-error-state.png', {
      fullPage: true,
      threshold: 0.2
    });
  });
});
