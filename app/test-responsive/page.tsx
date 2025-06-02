'use client';

import { Suspense, useState } from 'react';
import { useResponsive } from '@/app/hooks/useResponsive';
import { 
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveImage,
  ShowOn,
  HideOn,
  MobileOnly,
  TabletOnly,
  DesktopOnly
} from '@/app/components/ResponsiveComponents';
import ResponsiveDemo from '@/app/components/ResponsiveDemo';
import Header from '@/components/Header';
import { PerformanceMonitor } from '@/app/components/PerformanceMonitor';
import { OptimizedResponsiveImage, LazyImageGrid } from '@/app/components/ResponsiveImageOptimization';

export default function TestResponsivePage() {
  const { 
    breakpoint, 
    deviceType, 
    width,
    height,
    isMobile, 
    isTablet, 
    isDesktop,
    isBreakpointUp,
    isBreakpointDown,
    orientation
  } = useResponsive();

  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(true);

  // Sample images for testing
  const sampleImages = [
    {
      id: '1',
      src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
      alt: 'Sample image 1',
      sources: {
        mobile: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
        tablet: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600',
        desktop: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800'
      }
    },
    {
      id: '2',
      src: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800',
      alt: 'Sample image 2',
      sources: {
        mobile: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400',
        tablet: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600',
        desktop: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800'
      }
    },
    {
      id: '3',
      src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      alt: 'Sample image 3',
      sources: {
        mobile: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        tablet: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
        desktop: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'
      }
    }
  ];

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      
      <main className="min-h-screen bg-base-200">
        <ResponsiveContainer className="py-8 space-y-12">
          
          {/* Performance Monitor Toggle */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold">Performance Monitoring</h2>
              <button
                onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
                className="btn btn-primary btn-sm"
              >
                {showPerformanceMonitor ? 'Hide' : 'Show'} Performance Monitor
              </button>
            </div>
            
            <div className="bg-base-100 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-4">
                The performance monitor tracks Core Web Vitals and device-specific metrics in real-time.
                Toggle it on to see performance data in the bottom-right corner.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Current Device:</strong> {deviceType}
                </div>
                <div>
                  <strong>Viewport:</strong> {width} × {height}px
                </div>
              </div>
            </div>
          </div>

          {/* Optimized Image Grid Demo */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Optimized Image Grid</h2>
            <div className="bg-base-100 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-6">
                Images automatically load device-appropriate resolutions and adjust quality based on connection speed.
                Each image uses lazy loading and progressive enhancement.
              </p>
              
              <LazyImageGrid
                images={sampleImages}
                columns={{ mobile: 1, tablet: 2, desktop: 3 }}
                gap="gap-4"
                aspectRatio="4/3"
              />
            </div>
          </div>

          {/* Current State Display */}
          <div className="bg-base-100 p-6 rounded-lg shadow-lg">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">
              Responsive Design System Test Page
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Current Breakpoint:</strong> {breakpoint}
              </div>
              <div>
                <strong>Current Device:</strong> {deviceType}
              </div>
              <div>
                <strong>Screen Size:</strong> {width}x{height}
              </div>
              <div>
                <strong>Is Mobile:</strong> {isMobile ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Is Tablet:</strong> {isTablet ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Is Desktop:</strong> {isDesktop ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Orientation:</strong> {orientation}
              </div>
            </div>
          </div>

          {/* Device-Specific Components */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Device-Specific Components</h2>
            
            <MobileOnly>
              <div className="bg-red-100 text-red-800 p-4 rounded border border-red-300">
                📱 Mobile Only Content - This only shows on mobile devices
              </div>
            </MobileOnly>
            
            <TabletOnly>
              <div className="bg-blue-100 text-blue-800 p-4 rounded border border-blue-300">
                📟 Tablet Only Content - This only shows on tablet devices
              </div>
            </TabletOnly>
            
            <DesktopOnly>
              <div className="bg-green-100 text-green-800 p-4 rounded border border-green-300">
                🖥️ Desktop Only Content - This only shows on desktop devices
              </div>
            </DesktopOnly>
          </div>

          {/* Breakpoint-Based Components */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Breakpoint-Based Components</h2>
            
            <ShowOn breakpoint="sm">
              <div className="bg-yellow-100 text-yellow-800 p-4 rounded border border-yellow-300">
                📏 Small and Up - Shows on SM and larger breakpoints
              </div>
            </ShowOn>
            
            <ShowOn breakpoint="md">
              <div className="bg-purple-100 text-purple-800 p-4 rounded border border-purple-300">
                📐 Medium and Up - Shows on MD and larger breakpoints
              </div>
            </ShowOn>
            
            <HideOn breakpoint="lg">
              <div className="bg-orange-100 text-orange-800 p-4 rounded border border-orange-300">
                📱📟 Mobile & Tablet Only - Hidden on LG and larger breakpoints
              </div>
            </HideOn>
          </div>

          {/* Responsive Grid */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Responsive Grid</h2>
            
            <ResponsiveGrid
              mobileCols={1}
              tabletCols={2}
              desktopCols={4}
              className="gap-4"
            >
              <div className="bg-primary text-primary-content p-4 rounded">Item 1</div>
              <div className="bg-secondary text-secondary-content p-4 rounded">Item 2</div>
              <div className="bg-accent text-accent-content p-4 rounded">Item 3</div>
              <div className="bg-neutral text-neutral-content p-4 rounded">Item 4</div>
              <div className="bg-info text-info-content p-4 rounded">Item 5</div>
              <div className="bg-success text-success-content p-4 rounded">Item 6</div>
              <div className="bg-warning text-warning-content p-4 rounded">Item 7</div>
              <div className="bg-error text-error-content p-4 rounded">Item 8</div>
            </ResponsiveGrid>
          </div>

          {/* Responsive Typography */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Responsive Typography</h2>
            
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                Responsive Heading 1
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold">
                Responsive Heading 2
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed">
                This is responsive body text that scales appropriately across different screen sizes. 
                The text size increases as the screen gets larger, ensuring optimal readability 
                on all devices.
              </p>
            </div>
          </div>

          {/* Responsive Images */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Responsive Images</h2>
            
            <ResponsiveImage
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800"
              alt="Responsive test image"
              className="rounded-lg shadow-md"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Sample images for testing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleImages.map((image) => (
                <div key={image.id} className="rounded-lg overflow-hidden shadow-md">
                  <OptimizedResponsiveImage
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    placeholder="blur"
                    blurDataURL={image.sources.mobile}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Responsive Spacing */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Responsive Spacing & Layout</h2>
            
            <div className="bg-base-100 p-4 sm:p-6 md:p-8 lg:p-12 rounded-lg">
              <p className="mb-4 sm:mb-6 md:mb-8">
                This container has responsive padding that increases with screen size.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8">
                <div className="flex-1 bg-base-200 p-4 rounded">Flex Item 1</div>
                <div className="flex-1 bg-base-200 p-4 rounded">Flex Item 2</div>
              </div>
            </div>
          </div>

          {/* Interactive Components */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Interactive Components</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn btn-primary btn-sm sm:btn-md lg:btn-lg">
                Responsive Button
              </button>
              <button className="btn btn-secondary btn-sm sm:btn-md lg:btn-lg">
                Another Button
              </button>
            </div>
            
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-sm sm:text-base">Responsive Form Field</span>
              </label>
              <input 
                type="text" 
                placeholder="Type here..." 
                className="input input-bordered w-full text-sm sm:text-base" 
              />
            </div>
          </div>

          {/* Performance Monitor */}
          {showPerformanceMonitor && (
            <div className="bg-base-100 p-4 rounded-lg shadow-md">
              <PerformanceMonitor />
            </div>
          )}

          {/* Full Demo Component */}
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold">Complete Responsive Demo</h2>
            <ResponsiveDemo />
          </div>

        </ResponsiveContainer>
      </main>

      {/* Performance Monitor Component */}
      <PerformanceMonitor showDetails={showPerformanceMonitor} />
    </>
  );
}
