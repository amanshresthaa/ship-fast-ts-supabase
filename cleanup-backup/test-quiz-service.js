#!/usr/bin/env node
/**
 * Test the quiz service functions with the migrated data
 */

const path = require('path');
require('dotenv').config();

// Import the TypeScript compiled version or use ts-node
async function testQuizService() {
  try {
    // Import the quiz service (assuming it's compiled to JS or using ts-node)
    const { fetchQuizWithQuestions } = require('./app/lib/supabaseQuizService.ts');
    
    console.log('Testing fetchQuizWithQuestions with quiz ID: azure-a102');
    
    const quiz = await fetchQuizWithQuestions('azure-a102');
    
    if (quiz) {
      console.log('✅ Successfully fetched quiz:', quiz.title);
      console.log('✅ Questions count:', quiz.questions.length);
      console.log('✅ Question types:');
      
      const types = {};
      quiz.questions.forEach(q => {
        types[q.type] = (types[q.type] || 0) + 1;
      });
      
      Object.entries(types).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count} questions`);
      });
    } else {
      console.log('❌ Failed to fetch quiz');
    }
    
  } catch (error) {
    console.error('❌ Error testing quiz service:', error.message);
  }
}

testQuizService();
