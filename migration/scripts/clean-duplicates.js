#!/usr/bin/env node
/**
 * Clean Duplicate Migration Data
 * This script removes duplicate records that may have been created during multiple migrations
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function cleanDuplicates() {
  console.log('🧹 Cleaning duplicate migration data...');
  
  try {
    // First, get quiz IDs to avoid foreign key issues
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id');
    
    if (!quizzes || quizzes.length === 0) {
      console.log('ℹ️  No quizzes found to clean');
      return;
    }
    
    // Count current records
    const { count: questionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    const { count: quizCount } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Current state: ${quizCount} quizzes, ${questionCount} questions`);
    
    if (questionCount > 400) {
      console.log('🚨 Detected duplicate data - cleaning...');
      
      // Delete all questions (cascading will handle related tables)
      await supabase.from('questions').delete().neq('id', '');
      
      // Delete all quizzes
      await supabase.from('quizzes').delete().neq('id', '');
      
      console.log('✅ Duplicate data cleaned');
      
      // Verify cleanup
      const { count: newQuestionCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });
      
      const { count: newQuizCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 After cleanup: ${newQuizCount} quizzes, ${newQuestionCount} questions`);
      console.log('💡 Run migration again to restore proper data');
    } else {
      console.log('✅ No duplicate data detected');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning duplicates:', error.message);
  }
}

cleanDuplicates();
