import React from 'react';

interface DemoPageProps {
  params: Promise<{ type: string }>;
}

export default async function DemoQuestionTypePage({ params }: DemoPageProps) {
  const resolvedParams = await params;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Question Type Demo: {resolvedParams.type}</h1>
      <p className="mt-4">Demo component for {resolvedParams.type} question type is not yet implemented.</p>
    </div>
  );
}
