#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDatabaseState() {
  console.log('🔍 Verifying current database state...\n');
  
  try {
    // Check quizzes table
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, title, quiz_tag, quiz_topic, description')
      .order('id');
    
    if (quizzesError) {
      console.error('❌ Error fetching quizzes:', quizzesError);
      return;
    }
    
    console.log(`📚 Found ${quizzes.length} quiz(es):`);
    quizzes.forEach(quiz => {
      console.log(`  - ID: ${quiz.id}, Quiz Tag: ${quiz.quiz_tag}, Title: ${quiz.title}`);
    });
    console.log();
    
    // Check questions for each quiz
    for (const quiz of quizzes) {
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, quiz_tag, type')
        .eq('quiz_tag', quiz.id);
      
      if (questionsError) {
        console.error(`❌ Error fetching questions for quiz ${quiz.id}:`, questionsError);
        continue;
      }
      
      console.log(`❓ Quiz "${quiz.id}" has ${questions.length} questions`);
      
      // Count by question type
      const typeCounts = questions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
      console.log();
    }
    
    // Check for any questions with mismatched quiz_tag
    const { data: orphanQuestions, error: orphanError } = await supabase
      .from('questions')
      .select('id, quiz_tag')
      .not('quiz_tag', 'in', `(${quizzes.map(q => `"${q.id}"`).join(',')})`);
    
    if (orphanError) {
      console.error('❌ Error checking for orphan questions:', orphanError);
    } else if (orphanQuestions.length > 0) {
      console.log('⚠️  Found questions with invalid quiz_tag references:');
      orphanQuestions.forEach(q => {
        console.log(`   - Question ${q.id} references quiz_tag: ${q.quiz_tag}`);
      });
    } else {
      console.log('✅ All questions have valid quiz_tag references');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyDatabaseState();
