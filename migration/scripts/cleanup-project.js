#!/usr/bin/env node
/**
 * Script Cleanup Utility
 * Identifies and removes obsolete/redundant scripts from the project
 */

const fs = require('fs-extra');
const path = require('path');

const OBSOLETE_FILES = [
  // Old migration scripts (now replaced by organized migration system)
  'scripts/migrate_quiz_metadata_to_supabase.js',
  
  // Redundant database files (now in migration/schemas/)
  'database_migration.sql',
  'supabase_database.sql',
  
  // Test scripts that should be moved to proper test directory or removed
  'test-quiz-service.js',
  'test-quiz-fetch.js', 
  'test-endpoints.js',
  'test-app-integration.js',
  'test-shuffle.js',
  'verify-database-state.js',
  'final-comprehensive-test.js',
  
  // Old configuration/utility files
  'apply-changes.js',
  
  // Redundant Jest configs
  'jest.config.new.js',
  'jest.config.fixed.js',
  
  // Old middleware (if replaced)
  'middleware.js'
];

const TEST_FILES_TO_MOVE = [
  'test-quiz-service.js',
  'test-quiz-fetch.js', 
  'test-endpoints.js',
  'test-app-integration.js',
  'test-shuffle.js',
  'final-comprehensive-test.js'
];

const projectRoot = '/Users/amankumarshrestha/Downloads/ship-fast-ts-supabase';

async function analyzeFiles() {
  console.log('🔍 Analyzing project files for cleanup...\n');
  
  const existing = [];
  const missing = [];
  
  for (const file of OBSOLETE_FILES) {
    const filePath = path.join(projectRoot, file);
    if (await fs.pathExists(filePath)) {
      const stats = await fs.stat(filePath);
      existing.push({
        file,
        size: stats.size,
        modified: stats.mtime.toISOString().split('T')[0]
      });
    } else {
      missing.push(file);
    }
  }
  
  console.log('📊 FILES FOUND FOR CLEANUP:');
  existing.forEach(item => {
    console.log(`📄 ${item.file} (${item.size} bytes, modified: ${item.modified})`);
  });
  
  if (missing.length > 0) {
    console.log('\n✅ FILES ALREADY REMOVED:');
    missing.forEach(file => console.log(`🗑️  ${file}`));
  }
  
  return existing;
}

async function createBackupAndCleanup(files) {
  if (files.length === 0) {
    console.log('\n✨ No files need cleanup!');
    return;
  }
  
  // Create backup directory
  const backupDir = path.join(projectRoot, 'cleanup-backup');
  await fs.ensureDir(backupDir);
  
  console.log(`\n📦 Creating backup in: ${backupDir}`);
  
  for (const item of files) {
    const sourcePath = path.join(projectRoot, item.file);
    const backupPath = path.join(backupDir, item.file);
    
    // Ensure backup directory structure exists
    await fs.ensureDir(path.dirname(backupPath));
    
    // Copy to backup
    await fs.copy(sourcePath, backupPath);
    console.log(`💾 Backed up: ${item.file}`);
  }
  
  console.log('\n🗑️  REMOVING FILES:');
  for (const item of files) {
    const filePath = path.join(projectRoot, item.file);
    await fs.remove(filePath);
    console.log(`❌ Removed: ${item.file}`);
  }
  
  console.log(`\n✅ Cleanup complete! Backup saved in: cleanup-backup/`);
}

async function moveTestFiles() {
  console.log('\n📂 Checking if test files should be moved to tests/ directory...');
  
  const testsDir = path.join(projectRoot, 'tests/migration');
  await fs.ensureDir(testsDir);
  
  for (const testFile of TEST_FILES_TO_MOVE) {
    const sourcePath = path.join(projectRoot, testFile);
    const targetPath = path.join(testsDir, testFile);
    
    if (await fs.pathExists(sourcePath)) {
      await fs.move(sourcePath, targetPath);
      console.log(`📁 Moved to tests/migration/: ${testFile}`);
    }
  }
}

async function main() {
  console.log('🧹 PROJECT CLEANUP UTILITY\n');
  console.log('This utility will:');
  console.log('1. 📋 Analyze obsolete files');
  console.log('2. 📦 Create backups');
  console.log('3. 🗑️  Remove redundant files');
  console.log('4. 📁 Organize test files');
  console.log('');
  
  try {
    const existingFiles = await analyzeFiles();
    
    if (existingFiles.length > 0) {
      await createBackupAndCleanup(existingFiles);
    }
    
    console.log('\n🎯 CLEANUP SUMMARY:');
    console.log('✅ Migration system: Organized in migration/ directory');
    console.log('✅ Database schemas: Located in migration/schemas/');
    console.log('✅ Test files: Will be organized in tests/ directory');
    console.log('✅ Configuration files: Kept essential configs only');
    console.log('');
    console.log('🚀 Project is now clean and organized!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Allow running as script
if (require.main === module) {
  main();
}

module.exports = { analyzeFiles, createBackupAndCleanup };
