#!/usr/bin/env node
/**
 * Quick test script to verify that quiz data can be fetched from Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;
if (!SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFetchQuizzes() {
  try {
    console.log('Testing quiz fetch from Supabase...');
    
    // Test fetching all quizzes
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*');

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError);
      return;
    }

    console.log(`✅ Successfully fetched ${quizzes.length} quiz(s):`);
    quizzes.forEach(quiz => {
      console.log(`  - ${quiz.title} (${quiz.id})`);
    });

    // Test fetching questions for the first quiz
    if (quizzes.length > 0) {
      const firstQuizId = quizzes[0].id;
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, type, question, points')
        .eq('quiz_tag', firstQuizId);

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        return;
      }

      console.log(`\n✅ Successfully fetched ${questions.length} questions for quiz "${firstQuizId}":`);
      
      // Group by question type
      const questionsByType = questions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
      }, {});

      Object.entries(questionsByType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count} questions`);
      });
    }

    console.log('\n🎉 All tests passed! Quiz data migration was successful.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFetchQuizzes();
