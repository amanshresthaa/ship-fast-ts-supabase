'use client';

import React from 'react';

export default function SimpleSpacedRepetitionDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Simple Spaced Repetition Demo
        </h1>
        <p className="text-gray-600 mb-8">
          Basic demo without any external dependencies.
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sample Question</h2>
          <p className="mb-4">What is the capital of France?</p>
          
          <div className="space-y-2">
            {['London', 'Berlin', 'Paris', 'Madrid'].map((option, index) => (
              <label key={index} className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="answer" value={option} className="mr-3" />
                <span>{option}</span>
              </label>
            ))}
          </div>
          
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Submit Answer
          </button>
        </div>
      </div>
    </div>
  );
}
