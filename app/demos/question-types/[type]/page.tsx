'use client';

import React from 'react';
import QuestionTypeDemo from '../../../question-types-demo/type-client-page';

export default function DemoQuestionTypePage({ params }: { params: { type: string } }) {
  return <QuestionTypeDemo params={params} />;
}
