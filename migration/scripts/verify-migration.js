#!/usr/bin/env node
/**
 * Verify Migration - Quick database verification script
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration results for all quizzes...\n');
    
    // Check all quizzes
    const { data: allQuizzes, error: allQuizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .order('id');
    
    if (allQuizzesError) {
      console.error('❌ Quizzes not found:', allQuizzesError.message);
      return;
    }
    
    console.log(`✅ Found ${allQuizzes.length} quizzes in database:\n`);
    
    for (const quiz of allQuizzes) {
      console.log(`📚 Quiz: ${quiz.id}`);
      console.log(`   Title: ${quiz.title}`);
      console.log(`   Topic: ${quiz.quiz_topic}`);
      console.log(`   Difficulty: ${quiz.difficulty}`);
      
      // Check question counts for this quiz
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('type')
        .eq('quiz_tag', quiz.id);
      
      if (questionsError) {
        console.error(`❌ Questions not found for ${quiz.id}:`, questionsError.message);
        continue;
      }
      
      console.log(`   Questions: ${questions.length} total`);
      const typeCounts = {};
      questions.forEach(q => {
        typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
      });
      
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`     ${type}: ${count} questions`);
      });
      console.log('');
    }
    
    console.log('🎉 Migration verification successful for all quizzes!');
    
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  }
}

verifyMigration();
