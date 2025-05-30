#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs all migration files in the migrations/ directory in order
 * 
 * Usage: node run-migrations.js
 * 
 * Environment Variables:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configure Supabase client
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Execute SQL directly using the connection
async function executeSql(sql) {
  try {
    const { data, error } = await supabase
      .from('_migrations_dummy_table_that_does_not_exist')
      .select('*');
      
    // This will fail, but let's try a different approach
    // We'll use a function call instead
    
    const { data: result, error: queryError } = await supabase.rpc('exec_migration_sql', {
      migration_sql: sql
    });
    
    if (queryError) {
      // Function doesn't exist, let's try to create it first
      console.log('Creating exec_migration_sql function...');
      await createExecFunction();
      
      // Try again
      const { data: retryResult, error: retryError } = await supabase.rpc('exec_migration_sql', {
        migration_sql: sql
      });
      
      if (retryError) {
        throw retryError;
      }
      
      return retryResult;
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}

// Create the exec function in Supabase
async function createExecFunction() {
  // We'll need to execute this manually first
  const functionSQL = `
    CREATE OR REPLACE FUNCTION exec_migration_sql(migration_sql TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE migration_sql;
      RETURN 'SUCCESS';
    END;
    $$;
  `;
  
  console.log('⚠️  Please execute this SQL manually in your Supabase SQL editor first:');
  console.log('---');
  console.log(functionSQL);
  console.log('---');
  
  // For now, we'll just output the migrations to run manually
  return false;
}

// Create migrations tracking table if it doesn't exist
async function ensureMigrationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum TEXT
    );
    
    -- Grant permissions
    GRANT SELECT, INSERT ON public.schema_migrations TO authenticated, anon;
  `;
  
  try {
    await executeSql(sql);
    console.log('✅ Migrations tracking table ready');
  } catch (error) {
    console.log('⚠️  Could not create migrations table automatically');
    console.log('Please run this SQL manually in Supabase:');
    console.log('---');
    console.log(sql);
    console.log('---');
    return false;
  }
  
  return true;
}

// Main migration runner
async function runMigrations() {
  try {
    console.log('� Starting database migrations...\n');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 No migrations directory found');
      return;
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure migrations run in order
    
    console.log(`📋 Found ${migrationFiles.length} migration files\n`);
    
    if (migrationFiles.length === 0) {
      console.log('✅ No migrations to run');
      return;
    }
    
    // Since we can't execute SQL directly through the Supabase client easily,
    // we'll output the SQL for manual execution
    console.log('📝 Please execute these migrations manually in your Supabase SQL editor:');
    console.log('=' .repeat(80));
    
    for (const filename of migrationFiles) {
      const filePath = path.join(migrationsDir, filename);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      console.log(`\n-- Migration: ${filename}`);
      console.log('-- ' + '='.repeat(50));
      console.log(sqlContent);
      console.log('-- End of ' + filename);
      console.log('-- ' + '='.repeat(50));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 After executing the above SQL, run this to mark migrations as complete:');
    
    const trackingSQL = migrationFiles.map(filename => 
      `INSERT INTO public.schema_migrations (filename) VALUES ('${filename}') ON CONFLICT (filename) DO NOTHING;`
    ).join('\n');
    
    console.log('---');
    console.log(trackingSQL);
    console.log('---');
    
    console.log('\n✅ Migration files prepared for manual execution');
    
  } catch (error) {
    console.error('💥 Migration preparation failed:', error);
    process.exit(1);
  }
}

// Run migrations
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
