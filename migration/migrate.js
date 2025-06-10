#!/usr/bin/env node
/**
 * Main Migration Runner
 * Orchestrates the complete migration process
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Import configuration
const config = require('./config/migration.config.js');

const SCRIPTS_DIR = path.join(__dirname, 'scripts');
const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
fs.ensureDirSync(LOGS_DIR);

function createLogFileName(operation) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  return path.join(LOGS_DIR, `${operation}_${timestamp}.log`);
}

function runScript(scriptName, description) {
  console.log(`\n🚀 ${description}...`);
  console.log(`📝 Running: ${scriptName}`);
  
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  const logFile = createLogFileName(scriptName.replace('.js', ''));
  
  try {
    const output = execSync(`node "${scriptPath}"`, {
      cwd: __dirname,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Write to log file
    fs.writeFileSync(logFile, output);
    console.log(`✅ ${description} completed successfully`);
    console.log(`📋 Log saved to: ${path.relative(__dirname, logFile)}`);
    
    return { success: true, output };
  } catch (error) {
    const errorOutput = error.stdout + '\n' + error.stderr;
    fs.writeFileSync(logFile, errorOutput);
    console.error(`❌ ${description} failed`);
    console.error(`📋 Error log saved to: ${path.relative(__dirname, logFile)}`);
    console.error(`💥 Error: ${error.message}`);
    
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🎯 === SUPABASE QUIZ MIGRATION SUITE ===');
  console.log('📁 Migration Directory:', __dirname);
  console.log('🗂️  Data Source:', config.quizzes.dataPath);
  console.log('📊 Available Quizzes:', config.quizzes.availableQuizzes.length);
  
  const operations = [
    {
      script: 'apply-schema.js',
      name: 'Schema Application & Verification',
      required: true
    },
    {
      script: 'migrate-quiz-data.js',
      name: 'Azure AI-102 Quiz Migration',
      required: false
    },
    {
      script: 'migrate-project-management.js',
      name: 'Project Management Quiz Migration', 
      required: false
    },
    {
      script: 'verify-migration.js',
      name: 'Migration Verification',
      required: true
    },
    {
      script: 'migration-summary.js',
      name: 'Migration Summary Report',
      required: false
    }
  ];

  let allSuccess = true;
  const results = [];

  for (const operation of operations) {
    const result = runScript(operation.script, operation.name);
    results.push({
      operation: operation.name,
      success: result.success,
      required: operation.required
    });

    if (!result.success && operation.required) {
      console.error(`💀 Required operation failed: ${operation.name}`);
      allSuccess = false;
      break;
    }
  }

  // Final summary
  console.log('\n📊 === MIGRATION RESULTS SUMMARY ===');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const type = result.required ? '[REQUIRED]' : '[OPTIONAL]';
    console.log(`${status} ${type} ${result.operation}`);
  });

  if (allSuccess) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('🚀 Database is ready for production use!');
  } else {
    console.log('\n⚠️  Migration completed with some issues.');
    console.log('📋 Check the log files for details.');
  }

  return allSuccess;
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🎯 Supabase Quiz Migration Suite

Usage: node migrate.js [options]

Options:
  --help, -h     Show this help message
  --verify-only  Run only verification scripts
  --summary-only Run only summary report

Available Scripts:
  - apply-schema.js         Check and apply database schema
  - migrate-quiz-data.js    Migrate Azure AI-102 quiz data
  - migrate-project-management.js  Migrate Project Management quiz data
  - verify-migration.js     Verify all migrated data
  - migration-summary.js    Generate comprehensive summary

Configuration:
  - Config: ./config/migration.config.js
  - Schema: ./schemas/supabase_database.sql
  - Data: ./data/quizzes/
  - Logs: ./logs/
`);
  process.exit(0);
}

if (args.includes('--verify-only')) {
  console.log('🔍 Running verification only...');
  const result = runScript('verify-migration.js', 'Migration Verification');
  process.exit(result.success ? 0 : 1);
}

if (args.includes('--summary-only')) {
  console.log('📊 Running summary report only...');
  const result = runScript('migration-summary.js', 'Migration Summary Report');
  process.exit(result.success ? 0 : 1);
}

// Run main migration
main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Migration failed with error:', error);
    process.exit(1);
  });
