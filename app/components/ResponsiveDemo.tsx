'use client';

import React from 'react';
import { useResponsive } from '@/app/hooks/useResponsive';
import { 
  MobileOnly, 
  TabletOnly, 
  DesktopOnly, 
  ResponsiveContainer,
  ResponsiveGrid
} from '@/app/components/ResponsiveComponents';

/**
 * Demo component showcasing the responsive design system
 * This component demonstrates various responsive patterns and utilities
 */
const ResponsiveDemo: React.FC = () => {
  const { 
    width, 
    height, 
    breakpoint, 
    deviceType, 
    isMobile, 
    isTablet, 
    isDesktop,
    orientation,
    isTouchDevice,
    getResponsiveClasses 
  } = useResponsive();

  // Dynamic classes based on device type
  const containerClasses = getResponsiveClasses({
    mobile: 'bg-red-100 p-4',
    tablet: 'bg-blue-100 p-6',
    desktop: 'bg-green-100 p-8'
  });

  const textClasses = getResponsiveClasses({
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-lg'
  });

  // Sample data for grid demonstration
  const gridItems = [
    { id: 1, title: 'Item 1', description: 'First responsive grid item' },
    { id: 2, title: 'Item 2', description: 'Second responsive grid item' },
    { id: 3, title: 'Item 3', description: 'Third responsive grid item' },
    { id: 4, title: 'Item 4', description: 'Fourth responsive grid item' },
    { id: 5, title: 'Item 5', description: 'Fifth responsive grid item' },
    { id: 6, title: 'Item 6', description: 'Sixth responsive grid item' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <ResponsiveContainer
        className="py-12 text-center"
        mobileClass="px-4"
        tabletClass="px-6"
        desktopClass="px-8"
      >
        <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-white mb-4">
          Responsive Design System Demo
        </h1>
        <p className="text-responsive-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          This page demonstrates the comprehensive responsive design system with real-time device detection and adaptive components.
        </p>
      </ResponsiveContainer>

      {/* Device Information Panel */}
      <ResponsiveContainer className="py-8">
        <div className={`rounded-lg shadow-lg ${containerClasses}`}>
          <h2 className="text-responsive-lg font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Current Device Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Screen Size</h3>
              <p className={`${textClasses} text-gray-900 dark:text-white`}>
                {width} × {height}px
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Breakpoint</h3>
              <p className={`${textClasses} text-gray-900 dark:text-white font-mono`}>
                {breakpoint}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Device Type</h3>
              <p className={`${textClasses} text-gray-900 dark:text-white`}>
                {deviceType}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Orientation</h3>
              <p className={`${textClasses} text-gray-900 dark:text-white`}>
                {orientation}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Touch Device</h3>
              <p className={`${textClasses} text-gray-900 dark:text-white`}>
                {isTouchDevice ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Device Flags</h3>
              <p className={`${textClasses} text-gray-900 dark:text-white`}>
                Mobile: {isMobile ? '✓' : '✗'}<br />
                Tablet: {isTablet ? '✓' : '✗'}<br />
                Desktop: {isDesktop ? '✓' : '✗'}
              </p>
            </div>
          </div>
        </div>
      </ResponsiveContainer>

      {/* Conditional Rendering Demo */}
      <ResponsiveContainer className="py-8">
        <h2 className="text-responsive-lg font-semibold mb-6 text-gray-900 dark:text-white">
          Conditional Rendering Examples
        </h2>
        
        <div className="space-y-6">
          <MobileOnly>
            <div className="bg-red-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">📱 Mobile Only Content</h3>
              <p>This content only appears on mobile devices (xs, sm breakpoints).</p>
              <button className="touch-target bg-red-600 text-white px-4 py-2 rounded mt-4">
                Touch-Optimized Button
              </button>
            </div>
          </MobileOnly>

          <TabletOnly>
            <div className="bg-blue-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">📐 Tablet Only Content</h3>
              <p>This content only appears on tablet devices (md breakpoint).</p>
              <button className="btn-responsive bg-blue-600 text-white">
                Tablet-Optimized Button
              </button>
            </div>
          </TabletOnly>

          <DesktopOnly>
            <div className="bg-green-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">🖥️ Desktop Only Content</h3>
              <p>This content only appears on desktop devices (lg, xl, xxl breakpoints).</p>
              <div className="flex gap-4 mt-4">
                <button className="btn-responsive bg-green-600 text-white">
                  Primary Action
                </button>
                <button className="btn-responsive bg-green-700 text-white">
                  Secondary Action
                </button>
              </div>
            </div>
          </DesktopOnly>
        </div>
      </ResponsiveContainer>

      {/* Responsive Grid Demo */}
      <ResponsiveContainer className="py-8">
        <h2 className="text-responsive-lg font-semibold mb-6 text-gray-900 dark:text-white">
          Responsive Grid System
        </h2>
        
        <ResponsiveGrid
          mobileCols={1}
          tabletCols={2}
          desktopCols={3}
          gap="gap-6"
          className="mb-8"
        >
          {gridItems.map((item) => (
            <div key={item.id} className="card-responsive">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {item.description}
              </p>
              <button className="btn-responsive bg-blue-500 text-white w-full">
                Learn More
              </button>
            </div>
          ))}
        </ResponsiveGrid>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Grid Configuration
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            <strong>Mobile:</strong> 1 column<br />
            <strong>Tablet:</strong> 2 columns<br />
            <strong>Desktop:</strong> 3 columns
          </p>
        </div>
      </ResponsiveContainer>

      {/* Typography Demo */}
      <ResponsiveContainer className="py-8">
        <h2 className="text-responsive-lg font-semibold mb-6 text-gray-900 dark:text-white">
          Responsive Typography
        </h2>
        
        <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h1 className="text-responsive-xl text-gray-900 dark:text-white">
            Extra Large Heading (text-responsive-xl)
          </h1>
          <h2 className="text-responsive-lg text-gray-900 dark:text-white">
            Large Heading (text-responsive-lg)
          </h2>
          <h3 className="text-responsive-base text-gray-900 dark:text-white">
            Base Heading (text-responsive-base)
          </h3>
          <p className="text-responsive-sm text-gray-600 dark:text-gray-300">
            Small body text (text-responsive-sm) - This text adapts its size based on the current breakpoint for optimal readability across all devices.
          </p>
          <p className="text-responsive-xs text-gray-500 dark:text-gray-400">
            Extra small text (text-responsive-xs) - Perfect for captions, footnotes, and secondary information.
          </p>
        </div>
      </ResponsiveContainer>

      {/* Spacing Demo */}
      <ResponsiveContainer className="py-8">
        <h2 className="text-responsive-lg font-semibold mb-6 text-gray-900 dark:text-white">
          Responsive Spacing
        </h2>
        
        <div className="space-y-6">
          <div className="spacing-responsive-xs bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Extra Small Spacing (spacing-responsive-xs)
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Compact spacing that adapts from mobile to desktop.
            </p>
          </div>
          
          <div className="spacing-responsive-sm bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Small Spacing (spacing-responsive-sm)
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Comfortable spacing for most content areas.
            </p>
          </div>
          
          <div className="spacing-responsive-md bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Medium Spacing (spacing-responsive-md)
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Generous spacing for important sections and cards.
            </p>
          </div>
        </div>
      </ResponsiveContainer>

      {/* Interactive Elements Demo */}
      <ResponsiveContainer className="py-8">
        <h2 className="text-responsive-lg font-semibold mb-6 text-gray-900 dark:text-white">
          Touch-Friendly Interactive Elements
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Standard Buttons
            </h3>
            <div className="space-y-3">
              <button className="btn-responsive bg-blue-500 hover:bg-blue-600 text-white w-full">
                Standard Responsive Button
              </button>
              <button className="btn-responsive-large bg-green-500 hover:bg-green-600 text-white w-full">
                Large Responsive Button
              </button>
              <button className="touch-target bg-red-500 hover:bg-red-600 text-white rounded w-full">
                Touch Target Button
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Form Elements
            </h3>
            <div className="space-y-3">
              <input 
                className="input-responsive" 
                placeholder="Responsive input field"
                type="text" 
              />
              <select className="input-responsive">
                <option>Responsive select dropdown</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
              <textarea 
                className="input-responsive min-h-[100px]" 
                placeholder="Responsive textarea"
              />
            </div>
          </div>
        </div>
      </ResponsiveContainer>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <ResponsiveContainer className="py-8">
          <div className="bg-gray-800 text-white p-6 rounded-lg font-mono text-sm">
            <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
            <pre className="whitespace-pre-wrap">
{JSON.stringify({
  width,
  height,
  breakpoint,
  deviceType,
  isMobile,
  isTablet,
  isDesktop,
  orientation,
  touchDevice: isTouchDevice,
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
}, null, 2)}
            </pre>
          </div>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ResponsiveDemo;
