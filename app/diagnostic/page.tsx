'use client';

import React, { useState, useEffect } from 'react';

export default function DiagnosticPage() {
  const [status, setStatus] = useState('Loading...');
  
  useEffect(() => {
    try {
      console.log('DiagnosticPage mounted successfully');
      setStatus('Page loaded successfully - no auth errors');
    } catch (error) {
      console.error('Error in diagnostic page:', error);
      setStatus(`Error: ${error.message}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Diagnostic Page
        </h1>
        <p className="text-gray-600 mb-4">
          Status: {status}
        </p>
        <div className="bg-white p-4 rounded border">
          <h2 className="font-bold mb-2">Testing Steps:</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check if this page loads without "Error: Unauthorized"</li>
            <li>Open browser dev tools (F12)</li>
            <li>Check the Console tab for any errors</li>
            <li>Check the Network tab for any failed requests</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
