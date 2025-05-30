import React from 'react';

export default function OptimizedQuizRenderer({ quiz }: { quiz: any }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Optimized Quiz Renderer
        </h1>
        <p className="text-gray-600 mb-4">
          Quiz: {quiz?.title || 'Loading...'}
        </p>
        <p className="text-sm text-gray-500">
          This feature is currently being optimized. Please check back later.
        </p>
      </div>
    </div>
  );
}
