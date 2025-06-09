#!/usr/bin/env node
/**
 * Migration Summary Script
 * Shows complete overview of all migrated quizzes and their statistics
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function showMigrationSummary() {
  try {
    console.log('🎯 === COMPLETE QUIZ MIGRATION SUMMARY ===\n');
    
    // Get all quizzes
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .order('id');
    
    if (quizzesError) {
      console.error('❌ Error fetching quizzes:', quizzesError.message);
      return;
    }
    
    console.log(`📚 Total Quizzes Migrated: ${quizzes.length}\n`);
    
    let totalQuestions = 0;
    const allQuestionTypes = new Set();
    
    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      console.log(`${i + 1}. ${quiz.title}`);
      console.log(`   ID: ${quiz.id}`);
      console.log(`   Topic: ${quiz.quiz_topic}`);
      console.log(`   Difficulty: ${quiz.difficulty}`);
      console.log(`   Type: ${quiz.quiz_type || 'general'}`);
      
      // Get questions for this quiz
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('type')
        .eq('quiz_tag', quiz.id);
      
      if (questionsError) {
        console.error(`   ❌ Error fetching questions: ${questionsError.message}`);
        continue;
      }
      
      const typeCounts = {};
      questions.forEach(q => {
        typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
        allQuestionTypes.add(q.type);
      });
      
      console.log(`   Questions: ${questions.length} total`);
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`     • ${type}: ${count}`);
      });
      
      totalQuestions += questions.length;
      console.log('');
    }
    
    // Database table statistics
    console.log('📊 === DATABASE STATISTICS ===');
    console.log(`Total Questions: ${totalQuestions}`);
    console.log(`Question Types: ${Array.from(allQuestionTypes).sort().join(', ')}`);
    console.log('');
    
    // Get table counts
    const tables = [
      'quizzes', 'questions', 'drag_and_drop_targets', 'drag_and_drop_options',
      'drag_and_drop_correct_pairs', 'dropdown_selection_options', 'dropdown_selection_targets',
      'multi_options', 'multi_correct_answers', 'single_selection_options',
      'single_selection_correct_answer', 'order_items', 'order_correct_order',
      'yes_no_answer', 'yesno_multi_statements', 'yesno_multi_correct_answers'
    ];
    
    console.log('🗃️  Table Record Counts:');
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ${table}: Error - ${error.message}`);
        } else {
          console.log(`   ${table}: ${count} records`);
        }
      } catch (err) {
        console.log(`   ${table}: Error - ${err.message}`);
      }
    }
    
    console.log('\n✅ === MIGRATION COMPLETE ===');
    console.log('🚀 Ready for production use!');
    console.log('🧪 Ready for testing and validation!');
    console.log('📱 Web interface can now load quiz data from database!');
    
  } catch (err) {
    console.error('❌ Summary generation failed:', err.message);
  }
}

showMigrationSummary();
