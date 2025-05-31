#!/usr/bin/env node
/**
 * Quick test to verify the application can successfully load from database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;
if (!SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAppIntegration() {
  try {
    console.log('🧪 Testing application integration...\n');
    
    // Test 1: Fetch quizzes (same as the app does)
    console.log('1️⃣  Testing quiz list fetch...');
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*');

    if (quizzesError) {
      console.error('❌ Quiz fetch failed:', quizzesError);
      return;
    }

    console.log(`✅ Found ${quizzes.length} quiz(s)`);
    quizzes.forEach(quiz => {
      console.log(`   📚 ${quiz.title} (${quiz.id})`);
    });

    if (quizzes.length === 0) {
      console.log('❌ No quizzes found in database');
      return;
    }

    // Test 2: Test fetching questions for a quiz (API simulation)
    console.log('\n2️⃣  Testing question fetch for first quiz...');
    const firstQuizId = quizzes[0].id;
    
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, type, question, points, difficulty')
      .eq('quiz_tag', firstQuizId);

    if (questionsError) {
      console.error('❌ Questions fetch failed:', questionsError);
      return;
    }

    console.log(`✅ Found ${questions.length} questions for "${firstQuizId}"`);
    
    // Group by type for summary
    const questionsByType = questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(questionsByType).forEach(([type, count]) => {
      console.log(`   🔸 ${type}: ${count} questions`);
    });

    // Test 3: Test fetching a single question with options
    console.log('\n3️⃣  Testing single question with options fetch...');
    
    const singleSelectionQuestion = questions.find(q => q.type === 'single_selection');
    if (singleSelectionQuestion) {
      const { data: options, error: optionsError } = await supabase
        .from('single_selection_options')
        .select('option_id, text')
        .eq('question_id', singleSelectionQuestion.id);

      if (optionsError) {
        console.error('❌ Options fetch failed:', optionsError);
        return;
      }

      console.log(`✅ Found ${options.length} options for question "${singleSelectionQuestion.question.substring(0, 50)}..."`);
      options.forEach(option => {
        console.log(`   🔹 ${option.option_id}: ${option.text.substring(0, 40)}...`);
      });
    }

    console.log('\n🎉 All integration tests passed! Your Learning mode Quiz app is ready to use.');
    console.log(`\n🚀 Access your app at: http://localhost:3001/quizzes`);
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

testAppIntegration();
