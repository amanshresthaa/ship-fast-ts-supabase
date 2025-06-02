# Responsive Design System Documentation

## Overview

This document outlines the comprehensive responsive design system implemented for the React application. The system provides consistent, mobile-first responsive behavior across all device types.

## Table of Contents

1. [Breakpoints](#breakpoints)
2. [useResponsive Hook](#useresponsive-hook)
3. [Responsive Components](#responsive-components)
4. [Utility Classes](#utility-classes)
5. [Best Practices](#best-practices)
6. [Examples](#examples)
7. [Testing](#testing)

## Breakpoints

The application uses a mobile-first approach with the following breakpoints:

```typescript
export const BREAKPOINTS = {
  xs: 0,      // 0px - 575px (Mobile phones)
  sm: 576,    // 576px - 767px (Mobile large)  
  md: 768,    // 768px - 991px (Tablets)
  lg: 992,    // 992px - 1199px (Desktop)
  xl: 1200,   // 1200px - 1399px (Large desktop)
  xxl: 1400,  // 1400px+ (Extra large)
} as const;
```

### Device Types

- **mobile**: 0px - 575px
- **mobile-large**: 576px - 767px
- **tablet**: 768px - 991px
- **desktop**: 992px - 1199px
- **desktop-large**: 1200px - 1399px
- **desktop-xl**: 1400px+

## useResponsive Hook

The `useResponsive` hook is the core of the responsive system, providing real-time screen size tracking and device detection.

### Basic Usage

```typescript
import { useResponsive } from '@/app/hooks/useResponsive';

const MyComponent = () => {
  const { 
    width, 
    height, 
    breakpoint, 
    deviceType, 
    isMobile, 
    isTablet, 
    isDesktop 
  } = useResponsive();

  return (
    <div>
      <p>Current breakpoint: {breakpoint}</p>
      <p>Device type: {deviceType}</p>
      <p>Screen size: {width} x {height}</p>
    </div>
  );
};
```

### Advanced Usage

```typescript
const MyComponent = () => {
  const { 
    isBreakpointUp, 
    isBreakpointDown, 
    isBreakpointBetween,
    showOn,
    hideOn,
    getResponsiveClasses 
  } = useResponsive();

  // Check if screen is tablet or larger
  const showDesktopFeatures = isBreakpointUp('md');
  
  // Check if screen is between mobile and tablet
  const isMediumSize = isBreakpointBetween('sm', 'lg');
  
  // Conditional rendering
  const showComponent = showOn(['md', 'lg']);
  
  // Dynamic classes
  const classes = getResponsiveClasses({
    mobile: 'text-sm p-2',
    tablet: 'text-base p-4',
    desktop: 'text-lg p-6'
  });

  return <div className={classes}>Responsive content</div>;
};
```

### Hook Options

```typescript
const responsive = useResponsive({
  debounceMs: 150,        // Debounce resize events (default: 150ms)
  ssr: true,             // Enable SSR-safe mode (default: true)
  initialWidth: 1200,    // Initial width for SSR (default: 1200)
  initialHeight: 800     // Initial height for SSR (default: 800)
});
```

### Available Properties

```typescript
interface ResponsiveState {
  // Current dimensions
  width: number;
  height: number;
  
  // Breakpoint information
  breakpoint: BreakpointKey;
  deviceType: DeviceType;
  
  // Device type booleans
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  
  // Orientation
  orientation: 'portrait' | 'landscape';
  
  // Utility functions
  isBreakpoint: (bp: BreakpointKey) => boolean;
  isBreakpointUp: (bp: BreakpointKey) => boolean;
  isBreakpointDown: (bp: BreakpointKey) => boolean;
  isBreakpointBetween: (min: BreakpointKey, max: BreakpointKey) => boolean;
  
  // Device utilities
  isDevice: (device: DeviceType) => boolean;
  isTouchDevice: () => boolean;
  
  // Conditional rendering helpers
  showOn: (breakpoints: BreakpointKey | BreakpointKey[]) => boolean;
  hideOn: (breakpoints: BreakpointKey | BreakpointKey[]) => boolean;
  
  // CSS class generator
  getResponsiveClasses: (classMap: Partial<Record<BreakpointKey | DeviceType, string>>) => string;
  
  // Media query helpers
  getMediaQuery: (bp: BreakpointKey, direction?: 'up' | 'down') => string;
}
```

## Responsive Components

Pre-built components for common responsive patterns:

### ShowOn / HideOn Components

```tsx
import { ShowOn, HideOn } from '@/app/components/ResponsiveComponents';

// Show content only on desktop and larger
<ShowOn breakpoint="lg" direction="up">
  <DesktopNavigation />
</ShowOn>

// Hide content on mobile
<HideOn breakpoint="md" direction="down">
  <ComplexFeature />
</HideOn>
```

### Device-Specific Components

```tsx
import { 
  MobileOnly, 
  TabletOnly, 
  DesktopOnly, 
  MobileTablet,
  TabletDesktop 
} from '@/app/components/ResponsiveComponents';

<MobileOnly>
  <HamburgerMenu />
</MobileOnly>

<DesktopOnly>
  <FullNavigation />
</DesktopOnly>

<MobileTablet>
  <TouchOptimizedInterface />
</MobileTablet>
```

### ShowOnDevice / HideOnDevice

```tsx
import { ShowOnDevice, HideOnDevice } from '@/app/components/ResponsiveComponents';

// Show on specific device types
<ShowOnDevice device="mobile">
  <MobileHeader />
</ShowOnDevice>

<ShowOnDevice device={["tablet", "desktop"]}>
  <DesktopTabletView />
</ShowOnDevice>

// Hide on specific device types
<HideOnDevice device={["mobile", "mobile-large"]}>
  <DesktopOnlyFeature />
</HideOnDevice>
```

### ResponsiveContainer

```tsx
import { ResponsiveContainer } from '@/app/components/ResponsiveComponents';

<ResponsiveContainer
  className="base-styles"
  mobileClass="px-4 py-2"
  tabletClass="px-6 py-4"
  desktopClass="px-8 py-6"
>
  <Content />
</ResponsiveContainer>
```

### ResponsiveGrid

```tsx
import { ResponsiveGrid } from '@/app/components/ResponsiveComponents';

<ResponsiveGrid
  mobileCols={1}
  tabletCols={2}
  desktopCols={3}
  gap="gap-4"
  className="my-grid"
>
  {items.map(item => <GridItem key={item.id} {...item} />)}
</ResponsiveGrid>
```

### ResponsiveImage

```tsx
import { ResponsiveImage } from '@/app/components/ResponsiveComponents';

<ResponsiveImage
  src="/images/hero-desktop.jpg"
  mobileSrc="/images/hero-mobile.jpg"
  tabletSrc="/images/hero-tablet.jpg"
  alt="Hero image"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={true}
/>
```

## Utility Classes

### Responsive Container Classes

```css
/* Responsive containers with device-specific padding */
.container-responsive  /* Full responsive container */
.container-tight      /* Tighter padding variant */
```

### Responsive Text Classes

```css
.text-responsive-xs   /* text-xs sm:text-sm md:text-base */
.text-responsive-sm   /* text-sm sm:text-base md:text-lg */
.text-responsive-base /* text-base sm:text-lg md:text-xl */
.text-responsive-lg   /* text-lg sm:text-xl md:text-2xl lg:text-3xl */
.text-responsive-xl   /* text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl */
```

### Responsive Spacing Classes

```css
.spacing-responsive-xs /* p-2 sm:p-3 md:p-4 lg:p-6 */
.spacing-responsive-sm /* p-3 sm:p-4 md:p-6 lg:p-8 */
.spacing-responsive-md /* p-4 sm:p-6 md:p-8 lg:p-12 */
.spacing-responsive-lg /* p-6 sm:p-8 md:p-12 lg:p-16 xl:p-20 */
```

### Touch-Friendly Classes

```css
.touch-target       /* min-h-[44px] min-w-[44px] flex items-center justify-center */
.touch-target-large /* min-h-[56px] min-w-[56px] flex items-center justify-center */
```

### Responsive Grid Classes

```css
.grid-responsive-1-2-3 /* grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 */
.grid-responsive-1-2-4 /* grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 */
.grid-responsive-2-3-4 /* grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 */
```

### Responsive Flex Classes

```css
.flex-mobile-col /* flex flex-col md:flex-row */
.flex-mobile-row /* flex flex-row md:flex-col */
```

### Visibility Classes

```css
.show-mobile-only  /* block sm:hidden */
.show-tablet-only  /* hidden sm:block lg:hidden */
.show-desktop-only /* hidden lg:block */
.hide-mobile       /* hidden sm:block */
.hide-desktop      /* block lg:hidden */
```

### Component Classes

```css
.card-responsive      /* Responsive card with proper padding and styling */
.btn-responsive       /* Responsive button with touch-friendly sizing */
.btn-responsive-large /* Larger responsive button variant */
.input-responsive     /* Responsive input field with proper sizing */
.modal-responsive     /* Responsive modal/dialog */
```

## Best Practices

### 1. Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
// ✅ Good: Mobile-first
<div className="text-sm md:text-base lg:text-lg">
  Mobile-first text sizing
</div>

// ❌ Bad: Desktop-first
<div className="text-lg md:text-sm">
  Desktop-first approach
</div>
```

### 2. Touch-Friendly Design

Ensure interactive elements are touch-friendly on mobile:

```tsx
// ✅ Good: Touch-friendly button
<button className="touch-target px-4 py-2 bg-blue-500 text-white rounded">
  Touch-friendly button
</button>

// ❌ Bad: Too small for touch
<button className="px-1 py-1 text-xs">
  Too small
</button>
```

### 3. Performance Considerations

Use the responsive hook efficiently:

```tsx
// ✅ Good: Use specific checks
const { isMobile } = useResponsive();

// ❌ Bad: Unnecessary destructuring
const responsive = useResponsive();
const isMobile = responsive.isMobile;
```

### 4. Content Adaptation

Adapt content hierarchy for different screen sizes:

```tsx
const MobileHeader = () => {
  const { isMobile } = useResponsive();
  
  return (
    <header>
      {isMobile ? (
        <HamburgerMenu />
      ) : (
        <FullNavigationMenu />
      )}
    </header>
  );
};
```

### 5. Image Optimization

Use responsive images with appropriate sources:

```tsx
<ResponsiveImage
  src="/images/hero-desktop.jpg"
  mobileSrc="/images/hero-mobile.jpg"
  tabletSrc="/images/hero-tablet.jpg"
  alt="Hero image"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

## Examples

### Example 1: Responsive Navigation

```tsx
import { useResponsive, MobileOnly, DesktopOnly } from '@/components/responsive';

const Navigation = () => {
  const { isMobile } = useResponsive();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="container-responsive py-4">
      <div className="flex items-center justify-between">
        <Logo />
        
        <MobileOnly>
          <button 
            className="touch-target"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <HamburgerIcon />
          </button>
        </MobileOnly>
        
        <DesktopOnly>
          <NavigationLinks />
        </DesktopOnly>
      </div>
      
      {isMobile && isMenuOpen && (
        <MobileMenu onClose={() => setIsMenuOpen(false)} />
      )}
    </nav>
  );
};
```

### Example 2: Responsive Card Grid

```tsx
import { ResponsiveGrid } from '@/components/responsive';

const ProductGrid = ({ products }) => {
  return (
    <section className="container-responsive spacing-responsive-md">
      <h2 className="text-responsive-lg mb-6">Our Products</h2>
      
      <ResponsiveGrid
        mobileCols={1}
        tabletCols={2}
        desktopCols={3}
        gap="gap-6"
      >
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ResponsiveGrid>
    </section>
  );
};
```

### Example 3: Responsive Form

```tsx
import { useResponsive } from '@/hooks/useResponsive';

const ContactForm = () => {
  const { isMobile, getResponsiveClasses } = useResponsive();
  
  const formClasses = getResponsiveClasses({
    mobile: 'space-y-4',
    tablet: 'space-y-6 grid grid-cols-2 gap-6',
    desktop: 'space-y-8 grid grid-cols-2 gap-8'
  });
  
  return (
    <form className={`card-responsive ${formClasses}`}>
      <div className={isMobile ? 'col-span-1' : 'col-span-2'}>
        <input 
          className="input-responsive" 
          placeholder="Full Name"
          type="text" 
        />
      </div>
      
      <div>
        <input 
          className="input-responsive" 
          placeholder="Email"
          type="email" 
        />
      </div>
      
      <div>
        <input 
          className="input-responsive" 
          placeholder="Phone"
          type="tel" 
        />
      </div>
      
      <div className={isMobile ? 'col-span-1' : 'col-span-2'}>
        <textarea 
          className="input-responsive min-h-[120px]" 
          placeholder="Message"
        />
      </div>
      
      <div className={isMobile ? 'col-span-1' : 'col-span-2'}>
        <button className="btn-responsive-large w-full bg-primary text-white">
          Send Message
        </button>
      </div>
    </form>
  );
};
```

## Testing

### Manual Testing Checklist

1. **Breakpoint Testing**
   - [ ] Test all major breakpoints (576px, 768px, 992px, 1200px, 1400px)
   - [ ] Verify smooth transitions between breakpoints
   - [ ] Check edge cases (exactly at breakpoint values)

2. **Device Testing**
   - [ ] Test on real mobile devices (iPhone, Android)
   - [ ] Test on tablets (iPad, Android tablets)
   - [ ] Test on various desktop screen sizes
   - [ ] Test on ultra-wide monitors

3. **Orientation Testing**
   - [ ] Test portrait and landscape orientations
   - [ ] Verify orientation change handling
   - [ ] Check mobile keyboard interactions

4. **Touch Testing**
   - [ ] Verify touch targets are at least 44px
   - [ ] Test touch interactions (tap, swipe, pinch)
   - [ ] Check hover states on touch devices

5. **Performance Testing**
   - [ ] Verify no excessive re-renders on resize
   - [ ] Check memory usage over time
   - [ ] Test scroll performance on mobile

### Automated Testing

```typescript
import { renderHook } from '@testing-library/react';
import { useResponsive } from '@/hooks/useResponsive';

describe('useResponsive', () => {
  test('returns correct device type for mobile width', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.breakpoint).toBe('xs');
  });
  
  test('handles SSR correctly', () => {
    const { result } = renderHook(() => 
      useResponsive({ ssr: true, initialWidth: 1200 })
    );
    
    expect(result.current.width).toBe(1200);
    expect(result.current.deviceType).toBe('desktop-large');
  });
});
```

### Browser DevTools Testing

1. Open Chrome DevTools
2. Toggle device toolbar (Cmd+Shift+M)
3. Test various device presets
4. Use responsive design mode
5. Test custom dimensions
6. Verify network throttling on mobile

## Troubleshooting

### Common Issues

1. **Hydration Mismatch**
   - Ensure SSR mode is enabled
   - Use consistent initial values
   - Check for client-only logic

2. **Performance Issues**
   - Increase debounce delay
   - Minimize hook usage
   - Check for memory leaks

3. **Layout Shifts**
   - Use CSS transitions
   - Set fixed dimensions where possible
   - Use skeleton screens

4. **Touch Issues**
   - Ensure minimum touch target sizes
   - Test on actual devices
   - Check for conflicting CSS

### Debug Mode

Enable development debug info:

```tsx
// Shows device info overlay in development
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 left-4 z-50 bg-black text-white p-2 rounded text-xs">
    {deviceType} | {width}x{height}
  </div>
)}
```

This comprehensive responsive design system ensures your React application provides an optimal user experience across all device types while maintaining performance and accessibility standards.
