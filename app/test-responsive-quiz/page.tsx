'use client';

import React from 'react';
import { useResponsive } from '@/app/hooks/useResponsive';
import { ResponsiveContainer, ResponsiveGrid, ShowOnDevice, HideOnDevice } from '@/app/components/ResponsiveComponents';

export default function TestResponsiveQuizPage() {
  const { 
    deviceType, 
    isMobile, 
    isTablet, 
    isDesktop, 
    breakpoint,
    screenWidth,
    screenHeight,
    isTouchDevice,
    orientation
  } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <ResponsiveContainer className="py-8 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-8">
            📱 Responsive Quiz Demo
          </h1>
          
          {/* Device Information Panel */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Device Information</h2>
            <ResponsiveGrid mobileCols={1} tabletCols={2} desktopCols={3} gap="gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Device Type</div>
                <div className="text-lg font-semibold text-blue-800">{deviceType}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Breakpoint</div>
                <div className="text-lg font-semibold text-purple-800">{breakpoint}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Screen Size</div>
                <div className="text-lg font-semibold text-green-800">{screenWidth} × {screenHeight}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium">Touch Device</div>
                <div className="text-lg font-semibold text-orange-800">{isTouchDevice ? 'Yes' : 'No'}</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <div className="text-sm text-pink-600 font-medium">Orientation</div>
                <div className="text-lg font-semibold text-pink-800">{orientation}</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm text-indigo-600 font-medium">Flags</div>
                <div className="text-lg font-semibold text-indigo-800">
                  {isMobile && '📱'} {isTablet && '📄'} {isDesktop && '🖥️'}
                </div>
              </div>
            </ResponsiveGrid>
          </div>

          {/* Device-Specific Content Demo */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Device-Specific Content</h2>
            
            <ShowOnDevice device="mobile">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">📱 Mobile View</h3>
                <p className="text-red-700">
                  You&apos;re viewing this on a mobile device! This content is optimized for touch interactions:
                </p>
                <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                  <li>Bottom navigation bar for easy thumb access</li>
                  <li>Larger touch targets (44px minimum)</li>
                  <li>Compact question spacing</li>
                  <li>Sidebar as a drawer overlay</li>
                  <li>Single column layout</li>
                </ul>
              </div>
            </ShowOnDevice>

            <ShowOnDevice device="tablet">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📄 Tablet View</h3>
                <p className="text-blue-700">
                  You&apos;re viewing this on a tablet! This content is optimized for both touch and mouse:
                </p>
                <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
                  <li>Drawer pattern for quiz overview</li>
                  <li>Touch-friendly controls with hover states</li>
                  <li>Adaptive grid layouts</li>
                  <li>Portrait/landscape optimization</li>
                </ul>
              </div>
            </ShowOnDevice>

            <ShowOnDevice device="desktop">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">🖥️ Desktop View</h3>
                <p className="text-green-700">
                  You&apos;re viewing this on a desktop! This content is optimized for productivity:
                </p>
                <ul className="list-disc list-inside text-green-700 mt-2 space-y-1">
                  <li>Fixed sidebar for quick navigation</li>
                  <li>Keyboard shortcuts and hover states</li>
                  <li>Multi-column layouts</li>
                  <li>Zoom controls and accessibility features</li>
                </ul>
              </div>
            </ShowOnDevice>
          </div>

          {/* Interactive Elements Demo */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Touch-Optimized Controls</h2>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <button className={`${
                  isTouchDevice ? 'min-h-[44px] px-6 py-3' : 'px-4 py-2'
                } bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors`}>
                  {isTouchDevice ? '👆 Touch Button' : '🖱️ Click Button'}
                </button>
                
                <button className={`${
                  isTouchDevice ? 'min-h-[44px] px-6 py-3' : 'px-4 py-2'
                } bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors`}>
                  {isTouchDevice ? '📱 Mobile Action' : '💻 Desktop Action'}
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Touch targets are automatically sized to {isTouchDevice ? '44px minimum' : 'compact desktop sizes'} 
                based on your device type.
              </div>
            </div>
          </div>

          {/* Grid Layout Demo */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Responsive Grid Layout</h2>
            
            <ResponsiveGrid 
              mobileCols={2} 
              tabletCols={4} 
              desktopCols={6}
              gap="gap-3"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <div 
                  key={i} 
                  className="aspect-square bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                >
                  {i + 1}
                </div>
              ))}
            </ResponsiveGrid>
            
            <div className="mt-4 text-sm text-gray-600">
              Grid shows {isMobile ? '2' : isTablet ? '4' : '6'} columns on your current device.
            </div>
          </div>

          {/* Quiz Navigation Demo */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quiz Navigation Pattern</h2>
            
            <div className="text-gray-700 space-y-3">
              <p>Based on your device type ({deviceType}), the quiz interface uses:</p>
              
              <ul className="list-disc list-inside space-y-2">
                {isMobile && (
                  <>
                    <li>✅ Bottom navigation bar for easy thumb access</li>
                    <li>✅ Drawer-style sidebar overlay</li>
                    <li>✅ Compact header with essential information</li>
                    <li>✅ Full-width main content area</li>
                  </>
                )}
                
                {isTablet && (
                  <>
                    <li>✅ Drawer pattern for overview and navigation</li>
                    <li>✅ Touch-friendly controls with proper spacing</li>
                    <li>✅ Adaptive layouts for portrait/landscape</li>
                  </>
                )}
                
                {isDesktop && (
                  <>
                    <li>✅ Fixed sidebar for persistent quick navigation</li>
                    <li>✅ Hover states and keyboard navigation</li>
                    <li>✅ Zoom controls and accessibility features</li>
                    <li>✅ Multi-column layouts for efficiency</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Navigation Link */}
          <div className="mt-12 text-center">
            <a 
              href="/quiz/test-quiz?types=single_selection,multi" 
              className={`inline-flex items-center space-x-2 ${
                isTouchDevice ? 'px-8 py-4 min-h-[44px]' : 'px-6 py-3'
              } bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              <span>🚀 Try Responsive Quiz</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
