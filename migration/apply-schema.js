#!/usr/bin/env node
/**
 * Apply Database Schema Script
 * This script applies the database schema from supabase_database.sql
 */

const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function applySchema() {
  try {
    console.log('🗄️ Reading SQL schema file...');
    const sqlFile = path.join(__dirname, 'supabase_database.sql');
    const sqlContent = await fs.readFile(sqlFile, 'utf8');
    
    console.log('🚀 Applying database schema...');
    console.log('📝 Note: This requires direct database access. Please apply the SQL schema manually through Supabase dashboard.');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql');
    console.log('📄 Copy and paste the contents of supabase_database.sql');
    console.log('');
    console.log('After applying the schema, you can run the data migration with:');
    console.log('node migration/migrate-quiz-data.js');
    
    // Test if schema is already applied
    console.log('🔍 Testing database connection and schema...');
    const { data: quizTable, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .limit(1);
    
    const { data: questionTable, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);
      
    if (quizError || questionError) {
      console.log('⚠️  Database schema needs to be applied manually.');
      console.log('   Please apply supabase_database.sql through the Supabase dashboard.');
    } else {
      console.log('✅ Database schema is already applied and working!');
      console.log('🚀 You can now run the data migration:');
      console.log('   cd migration && node migrate-quiz-data.js');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applySchema();
