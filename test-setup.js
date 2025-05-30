#!/usr/bin/env node
/**
 * Simple test to verify the migration setup
 */

const fs = require('fs-extra');
const path = require('path');

async function testSetup() {
  console.log('🧪 Testing migration setup...\n');
  
  const results = {
    nodeJs: '❌',
    dependencies: '❌',
    envFile: '❌',
    quizData: '❌',
    scripts: '❌'
  };
  
  try {
    // Test Node.js
    console.log('✅ Node.js is working');
    results.nodeJs = '✅';
    
    // Test dependencies
    try {
      require('@supabase/supabase-js');
      require('uuid');
      require('fs-extra');
      require('dotenv');
      console.log('✅ Dependencies are installed');
      results.dependencies = '✅';
    } catch (err) {
      console.log('❌ Missing dependencies:', err.message);
    }
    
    // Test .env file
    const envPath = path.join(__dirname, '.env');
    if (await fs.pathExists(envPath)) {
      console.log('✅ .env file exists');
      results.envFile = '✅';
    } else {
      console.log('❌ .env file missing');
    }
    
    // Test quiz data
    const quizDir = path.join(__dirname, 'app', 'data', 'quizzes', 'azure-a102');
    if (await fs.pathExists(quizDir)) {
      const files = await fs.readdir(quizDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      console.log(`✅ Quiz data directory found with ${jsonFiles.length} JSON files`);
      results.quizData = '✅';
    } else {
      console.log('❌ Quiz data directory not found');
    }
    
    // Test scripts
    const scripts = ['validate-quiz-data.js', 'enhanced-migrate-quiz-data.js', 'setup-migration.js'];
    let allScriptsExist = true;
    for (const script of scripts) {
      if (await fs.pathExists(path.join(__dirname, script))) {
        console.log(`✅ ${script} exists`);
      } else {
        console.log(`❌ ${script} missing`);
        allScriptsExist = false;
      }
    }
    if (allScriptsExist) {
      results.scripts = '✅';
    }
    
    console.log('\n📊 Setup Summary:');
    console.log(`Node.js: ${results.nodeJs}`);
    console.log(`Dependencies: ${results.dependencies}`);
    console.log(`Environment: ${results.envFile}`);
    console.log(`Quiz Data: ${results.quizData}`);
    console.log(`Scripts: ${results.scripts}`);
    
    const allReady = Object.values(results).every(r => r === '✅');
    if (allReady) {
      console.log('\n🎉 Everything is ready for migration!');
      console.log('\nNext steps:');
      console.log('1. Update your .env file with Supabase credentials');
      console.log('2. Apply the database schema (supabase_database.sql)');
      console.log('3. Run: node validate-quiz-data.js --report');
      console.log('4. Run: node enhanced-migrate-quiz-data.js --dry-run');
      console.log('5. Run: node enhanced-migrate-quiz-data.js');
    } else {
      console.log('\n⚠️  Some items need attention before migration');
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testSetup();
