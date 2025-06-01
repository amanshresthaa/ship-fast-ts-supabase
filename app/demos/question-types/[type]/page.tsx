'use client';

import React from 'react';
import QuestionTypeDemo from '../../../question-types-demo/type-client-page';

/**
 * Renders the demo page for a specific question type.
 *
 * @param params - An object containing the question type identifier.
 */
export default function DemoQuestionTypePage({ params }: { params: { type: string } }) {
  return <QuestionTypeDemo params={params} />;
}
