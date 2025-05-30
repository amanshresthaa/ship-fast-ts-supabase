#!/usr/bin/env node
/**
 * Quiz Migration Setup Script
 * 
 * This script helps set up the environment for quiz data migration
 */

const fs = require('fs-extra');
const path = require('path');

async function setup() {
  console.log('🚀 Setting up quiz data migration environment...\n');
  
  // 1. Check for .env file
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (!await fs.pathExists(envPath)) {
    if (await fs.pathExists(envExamplePath)) {
      console.log('📄 Creating .env file from .env.example...');
      await fs.copy(envExamplePath, envPath);
      console.log('✅ .env file created');
      console.log('⚠️  Please edit .env and add your Supabase credentials:\n');
      console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
      console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key\n');
    } else {
      console.log('❌ No .env.example found. Please create .env manually with Supabase credentials.');
      return;
    }
  } else {
    console.log('✅ .env file already exists');
  }
  
  // 2. Create logs directory
  const logsDir = path.join(__dirname, 'logs');
  await fs.ensureDir(logsDir);
  console.log('✅ Logs directory ready');
  
  // 3. Check quiz data directory
  const quizDir = path.join(__dirname, 'app', 'data', 'quizzes', 'azure-a102');
  if (await fs.pathExists(quizDir)) {
    const files = await fs.readdir(quizDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    console.log(`✅ Quiz data directory found with ${jsonFiles.length} JSON files`);
  } else {
    console.log('❌ Quiz data directory not found at:', quizDir);
    return;
  }
  
  // 4. Check package dependencies
  console.log('📦 Checking dependencies...');
  try {
    require('@supabase/supabase-js');
    require('uuid');
    require('fs-extra');
    require('dotenv');
    console.log('✅ All required dependencies are installed');
  } catch (err) {
    console.log('❌ Missing dependencies. Run: npm install');
    return;
  }
  
  console.log('\n🎉 Setup complete! You can now run:\n');
  console.log('1. Validate your data:');
  console.log('   node validate-quiz-data.js --report');
  console.log('   node validate-quiz-data.js --fix --report\n');
  
  console.log('2. Test migration (dry run):');
  console.log('   node enhanced-migrate-quiz-data.js --dry-run\n');
  
  console.log('3. Run actual migration:');
  console.log('   node enhanced-migrate-quiz-data.js\n');
  
  console.log('💡 Make sure your database schema is applied first!');
}

if (require.main === module) {
  setup().catch(console.error);
}

module.exports = { setup };
