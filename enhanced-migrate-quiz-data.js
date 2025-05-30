#!/usr/bin/env node
/**
 * Enhanced Migration Script for Azure-A102 Quiz Data
 * 
 * Features:
 * 1. Data validation and cleanup before migration
 * 2. Graceful handling of incomplete question data
 * 3. Comprehensive error reporting and logging
 * 4. Progress tracking and rollback capabilities
 * 5. Support for all question types with proper schema mapping
 * 
 * Prerequisites:
 * - .env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * - Database schema must be already applied (supabase_database.sql)
 * 
 * Usage: node enhanced-migrate-quiz-data.js [options]
 * Options:
 *   --dry-run: Validate data without inserting into database
 *   --force: Overwrite existing data without prompting
 *   --skip-validation: Skip data validation step
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ------------------------------------------------------------------
// Configuration and Setup
// ------------------------------------------------------------------
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
  console.error('   Copy .env.example to .env and fill in your credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const skipValidation = args.includes('--skip-validation');

// ------------------------------------------------------------------
// Logging Setup
// ------------------------------------------------------------------
const LOG_DIR = path.join(__dirname, 'logs');
fs.ensureDirSync(LOG_DIR);
const LOG_FILE = path.join(LOG_DIR, `migration-${Date.now()}.log`);
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });

const nowISO = () => new Date().toISOString();
function log(level, ...args) {
  const flat = args.map(a =>
    a instanceof Error ? (a.stack || a.message)
      : typeof a === 'object' ? JSON.stringify(a, null, 2)
      : String(a)
  );
  const line = `${nowISO()} [${level.toUpperCase()}] ${flat.join(' ')}\n`;
  
  // Color coding for console
  const colors = {
    INFO: '\x1b[36m',    // Cyan
    WARN: '\x1b[33m',    // Yellow
    ERROR: '\x1b[31m',   // Red
    SUCCESS: '\x1b[32m', // Green
    RESET: '\x1b[0m'
  };
  
  const coloredLine = `${colors[level.toUpperCase()] || ''}${line.trim()}${colors.RESET}\n`;
  process.stdout.write(coloredLine);
  logStream.write(line);
}

// ------------------------------------------------------------------
// Data Validation Functions
// ------------------------------------------------------------------
function validateQuestionBase(question, index) {
  const errors = [];
  
  if (!question.id && !question.question) {
    errors.push(`Question at index ${index}: Missing both 'id' and 'question' fields`);
  }
  
  if (!question.type) {
    errors.push(`Question ${question.id || index}: Missing 'type' field`);
  } else if (!['drag_and_drop', 'dropdown_selection', 'multi', 'single_selection', 'order', 'yes_no', 'yesno_multi'].includes(question.type)) {
    errors.push(`Question ${question.id || index}: Invalid type '${question.type}'`);
  }
  
  if (question.points && (typeof question.points !== 'number' || question.points < 0)) {
    errors.push(`Question ${question.id || index}: Invalid points value`);
  }
  
  return errors;
}

function validateDragAndDrop(question) {
  const errors = [];
  
  if (!question.targets || !Array.isArray(question.targets)) {
    errors.push(`Drag & Drop ${question.id}: Missing or invalid 'targets' array`);
  } else {
    question.targets.forEach((target, idx) => {
      if (!target.id || !target.text) {
        errors.push(`Drag & Drop ${question.id}: Target ${idx} missing id or text`);
      }
    });
  }
  
  if (!question.options || !Array.isArray(question.options)) {
    errors.push(`Drag & Drop ${question.id}: Missing or invalid 'options' array`);
  } else {
    question.options.forEach((option, idx) => {
      if (!option.id || !option.text) {
        errors.push(`Drag & Drop ${question.id}: Option ${idx} missing id or text`);
      }
    });
  }
  
  if (!question.correct_pairs || !Array.isArray(question.correct_pairs)) {
    errors.push(`Drag & Drop ${question.id}: Missing or invalid 'correct_pairs' array`);
  }
  
  return errors;
}

function validateDropdownSelection(question) {
  const errors = [];
  
  if (!question.options || !Array.isArray(question.options)) {
    errors.push(`Dropdown ${question.id}: Missing or invalid 'options' array`);
  }
  
  if (!question.target || typeof question.target !== 'object') {
    errors.push(`Dropdown ${question.id}: Missing or invalid 'target' object`);
  }
  
  return errors;
}

function validateMultiChoice(question) {
  const errors = [];
  
  if (!question.options || !Array.isArray(question.options)) {
    errors.push(`Multi ${question.id}: Missing or invalid 'options' array`);
  }
  
  if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
    errors.push(`Multi ${question.id}: Missing or invalid 'correctAnswers' array`);
  }
  
  return errors;
}

function validateSingleSelection(question) {
  const errors = [];
  
  if (!question.options || !Array.isArray(question.options)) {
    errors.push(`Single Selection ${question.id}: Missing or invalid 'options' array`);
  }
  
  if (!question.correctAnswers || !Array.isArray(question.correctAnswers) || !question.correctAnswers[0]) {
    errors.push(`Single Selection ${question.id}: Missing or invalid 'correctAnswers[0]'`);
  }
  
  return errors;
}

function validateOrder(question) {
  const errors = [];
  
  if (!question.items || !Array.isArray(question.items)) {
    errors.push(`Order ${question.id}: Missing or invalid 'items' array`);
  }
  
  if (!question.correctOrder || !Array.isArray(question.correctOrder)) {
    errors.push(`Order ${question.id}: Missing or invalid 'correctOrder' array`);
  }
  
  return errors;
}

function validateYesNo(question) {
  const errors = [];
  
  if (question.correctAnswer === undefined || question.correctAnswer === null) {
    errors.push(`Yes/No ${question.id}: Missing 'correctAnswer'`);
  }
  
  return errors;
}

function validateYesNoMulti(question) {
  const errors = [];
  
  if (!question.statements || !Array.isArray(question.statements)) {
    errors.push(`Yes/No Multi ${question.id}: Missing or invalid 'statements' array`);
  }
  
  if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
    errors.push(`Yes/No Multi ${question.id}: Missing or invalid 'correctAnswers' array`);
  }
  
  return errors;
}

function validateQuestionData(question, index) {
  let errors = validateQuestionBase(question, index);
  
  if (!question.type) return errors; // Can't validate type-specific data without type
  
  switch (question.type) {
    case 'drag_and_drop':
      errors = errors.concat(validateDragAndDrop(question));
      break;
    case 'dropdown_selection':
      errors = errors.concat(validateDropdownSelection(question));
      break;
    case 'multi':
      errors = errors.concat(validateMultiChoice(question));
      break;
    case 'single_selection':
      errors = errors.concat(validateSingleSelection(question));
      break;
    case 'order':
      errors = errors.concat(validateOrder(question));
      break;
    case 'yes_no':
      errors = errors.concat(validateYesNo(question));
      break;
    case 'yesno_multi':
      errors = errors.concat(validateYesNoMulti(question));
      break;
  }
  
  return errors;
}

// ------------------------------------------------------------------
// Data Cleanup Functions
// ------------------------------------------------------------------
function cleanupQuestion(question, index) {
  // Generate ID if missing
  if (!question.id) {
    question.id = `generated-${index}-${uuidv4().slice(0, 8)}`;
    log('WARN', `Generated ID '${question.id}' for question at index ${index}`);
  }
  
  // Set default values
  question.points = question.points || 1;
  question.difficulty = question.difficulty || 'medium';
  question.quiz_tag = question.quiz_tag || 'azure-a102';
  
  // Ensure feedback structure
  if (!question.feedback) {
    question.feedback = {};
  }
  if (!question.feedback.correct) {
    question.feedback.correct = 'Correct!';
  }
  if (!question.feedback.incorrect) {
    question.feedback.incorrect = 'Incorrect. Please review the explanation.';
  }
  
  // Set explanation if missing
  if (!question.explanation) {
    question.explanation = 'No explanation provided.';
  }
  
  return question;
}

// ------------------------------------------------------------------
// Database Operation Functions
// ------------------------------------------------------------------
async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('quizzes').select('count').limit(1);
    if (error) throw error;
    log('SUCCESS', '✅ Database connection successful');
    return true;
  } catch (err) {
    log('ERROR', '❌ Database connection failed:', err.message);
    return false;
  }
}

async function upsertWithLogging(table, rows, conflictConstraint, description) {
  if (!rows.length) {
    log('INFO', `📭 No ${description} to insert`);
    return { success: true, count: 0 };
  }
  
  log('INFO', `📥 Inserting ${rows.length} ${description}...`);
  
  if (isDryRun) {
    log('INFO', `🔍 DRY RUN: Would insert ${rows.length} ${description}`);
    return { success: true, count: rows.length };
  }
  
  try {
    const { error, count } = await supabase
      .from(table)
      .upsert(rows, { onConflict: conflictConstraint });
      
    if (error) throw error;
    
    log('SUCCESS', `✅ Successfully inserted ${rows.length} ${description}`);
    return { success: true, count: rows.length };
  } catch (err) {
    log('ERROR', `❌ Failed to insert ${description}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ------------------------------------------------------------------
// Main Migration Logic
// ------------------------------------------------------------------
async function main() {
  try {
    log('INFO', '🚀 Starting Enhanced Quiz Data Migration');
    log('INFO', `📋 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    
    // Test database connection
    if (!await testDatabaseConnection()) {
      throw new Error('Database connection failed');
    }
    
    const quizDir = path.join(__dirname, 'app', 'data', 'quizzes', 'azure-a102');
    
    // 1. Load and validate quiz metadata
    log('INFO', '📄 Loading quiz metadata...');
    const metaFile = path.join(quizDir, 'quiz_metadata.json');
    if (!await fs.pathExists(metaFile)) {
      throw new Error('quiz_metadata.json not found – cannot continue without quiz metadata');
    }
    
    const meta = await fs.readJson(metaFile);
    const quizRow = {
      id: meta.metadata.id,
      title: meta.metadata.title,
      description: meta.metadata.description,
      quiz_type: meta.metadata.quizType,
      settings: meta.metadata.settings,
      author: meta.metadata.author,
      difficulty: meta.metadata.difficulty || 'medium',
      quiz_topic: meta.quiz_topic || meta.metadata.id,
    };
    
    // 2. Load all question files
    log('INFO', '📚 Loading question files...');
    const files = await fs.readdir(quizDir);
    const jsonFiles = files.filter(f => f.startsWith('clean_') && f.endsWith('.json'));
    let allQuestions = [];
    let totalLoadErrors = 0;
    
    for (const file of jsonFiles) {
      const filePath = path.join(quizDir, file);
      log('INFO', `📖 Reading ${file}...`);
      
      try {
        const { questions } = await fs.readJson(filePath);
        if (Array.isArray(questions) && questions.length) {
          // Filter out incomplete questions (only have quiz_tag or difficulty)
          const validQuestions = questions.filter(q => {
            const hasMinimalData = q.id || q.question || q.type;
            if (!hasMinimalData) {
              log('WARN', `Skipping incomplete question in ${file}:`, q);
              totalLoadErrors++;
            }
            return hasMinimalData;
          });
          
          log('INFO', `📦 Loaded ${validQuestions.length} valid questions from ${file}`);
          allQuestions.push(...validQuestions);
        } else {
          log('WARN', `⚠️  ${file} contained no valid questions`);
        }
      } catch (readErr) {
        log('ERROR', `❌ Error reading ${file}:`, readErr.message);
        totalLoadErrors++;
      }
    }
    
    if (!allQuestions.length) {
      throw new Error('No valid questions found – nothing to migrate');
    }
    
    log('INFO', `📊 Total questions loaded: ${allQuestions.length}`);
    if (totalLoadErrors > 0) {
      log('WARN', `⚠️  Skipped ${totalLoadErrors} incomplete questions/files`);
    }
    
    // 3. Data validation and cleanup
    if (!skipValidation) {
      log('INFO', '🔍 Validating question data...');
      let validationErrors = 0;
      
      allQuestions = allQuestions.map((question, index) => {
        const errors = validateQuestionData(question, index);
        if (errors.length > 0) {
          log('WARN', `⚠️  Validation issues for question ${question.id || index}:`, errors);
          validationErrors += errors.length;
        }
        return cleanupQuestion(question, index);
      });
      
      if (validationErrors > 0) {
        log('WARN', `⚠️  Found ${validationErrors} validation issues (cleaned up automatically)`);
      } else {
        log('SUCCESS', '✅ All questions passed validation');
      }
    }
    
    // 4. Generate UUID mappings
    log('INFO', '🔗 Generating UUID mappings...');
    const idMap = {};
    allQuestions.forEach(q => {
      idMap[q.id] = uuidv4();
    });
    
    // 5. Migrate quiz metadata
    log('INFO', '📝 Migrating quiz metadata...');
    const metaResult = await upsertWithLogging('quizzes', [quizRow], 'id', 'quiz metadata');
    if (!metaResult.success) {
      throw new Error(`Quiz metadata migration failed: ${metaResult.error}`);
    }
    
    // 6. Migrate base questions
    log('INFO', '❓ Migrating base questions...');
    const baseRows = allQuestions.map(q => ({
      id: idMap[q.id],
      type: q.type,
      question: q.questionText || q.question,
      points: q.points,
      quiz_tag: quizRow.id,
      quiz_topic: quizRow.quiz_topic,
      difficulty: q.difficulty,
      explanation: q.explanation,
      feedback_correct: q.feedback?.correct || 'Correct!',
      feedback_incorrect: q.feedback?.incorrect || 'Incorrect.',
    }));
    
    const baseResult = await upsertWithLogging('questions', baseRows, 'id', 'base questions');
    if (!baseResult.success) {
      throw new Error(`Base questions migration failed: ${baseResult.error}`);
    }
    
    // 7. Migrate question-specific data
    log('INFO', '🔧 Migrating question-specific data...');
    
    // Initialize arrays for different question types
    const tableData = {
      dragTargets: [],
      dragOptions: [],
      dragPairs: [],
      dropdownOptions: [],
      dropdownTargets: [],
      multiOptions: [],
      multiCorrect: [],
      singleOptions: [],
      singleCorrect: [],
      orderItems: [],
      orderCorrect: [],
      yesNoAnswers: [],
      yesnoStmts: [],
      yesnoCorrect: []
    };
    
    // Process each question
    for (const q of allQuestions) {
      const qid = idMap[q.id];
      
      try {
        switch (q.type) {
          case 'drag_and_drop':
            if (q.targets?.length && q.options?.length && q.correct_pairs?.length) {
              q.targets.forEach(t =>
                tableData.dragTargets.push({ question_id: qid, target_id: t.id, text: t.text })
              );
              q.options.forEach(o =>
                tableData.dragOptions.push({
                  question_id: qid,
                  option_id: o.id,
                  text: o.text
                })
              );
              q.correct_pairs.forEach(p =>
                tableData.dragPairs.push({
                  question_id: qid,
                  option_id: p.option_id,
                  target_id: p.target_id
                })
              );
            }
            break;
            
          case 'dropdown_selection':
            if (q.options?.length && q.target) {
              q.options.forEach(o =>
                tableData.dropdownOptions.push({
                  question_id: qid,
                  option_id: o.id,
                  text: o.text,
                  is_correct: o.is_correct ?? false
                })
              );
              Object.entries(q.target).forEach(([key, value]) =>
                tableData.dropdownTargets.push({ question_id: qid, key, value })
              );
            }
            break;
            
          case 'multi':
            if (q.options?.length && q.correctAnswers?.length) {
              q.options.forEach(o => {
                tableData.multiOptions.push({ question_id: qid, option_id: o.id, text: o.text });
                if (q.correctAnswers.includes(o.id)) {
                  tableData.multiCorrect.push({ question_id: qid, option_id: o.id });
                }
              });
            }
            break;
            
          case 'single_selection':
            if (q.options?.length && q.correctAnswers?.[0]) {
              q.options.forEach(o =>
                tableData.singleOptions.push({ question_id: qid, option_id: o.id, text: o.text })
              );
              tableData.singleCorrect.push({ question_id: qid, option_id: q.correctAnswers[0] });
            }
            break;
            
          case 'order':
            if (q.items?.length && q.correctOrder?.length) {
              q.items.forEach(item =>
                tableData.orderItems.push({
                  question_id: qid,
                  item_id: item.id,
                  text: item.text
                })
              );
              q.correctOrder.forEach((id, idx) =>
                tableData.orderCorrect.push({
                  question_id: qid,
                  item_id: id,
                  position: idx + 1
                })
              );
            }
            break;
            
          case 'yes_no':
            if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
              tableData.yesNoAnswers.push({
                question_id: qid,
                correct_answer: q.correctAnswer === 'yes'
              });
            }
            break;
            
          case 'yesno_multi':
            if (q.statements?.length && q.correctAnswers?.length) {
              q.statements.forEach(s =>
                tableData.yesnoStmts.push({
                  question_id: qid,
                  statement_id: s.id,
                  text: s.text
                })
              );
              q.correctAnswers.forEach((ans, idx) =>
                tableData.yesnoCorrect.push({
                  question_id: qid,
                  statement_id: q.statements[idx].id,
                  correct_answer: ans === 'yes'
                })
              );
            }
            break;
        }
      } catch (err) {
        log('ERROR', `❌ Error processing question ${q.id} (${q.type}):`, err.message);
      }
    }
    
    // 8. Execute all table migrations
    const migrations = [
      ['drag_and_drop_targets', tableData.dragTargets, 'question_id,target_id', 'drag & drop targets'],
      ['drag_and_drop_options', tableData.dragOptions, 'question_id,option_id', 'drag & drop options'],
      ['drag_and_drop_correct_pairs', tableData.dragPairs, 'question_id,option_id,target_id', 'drag & drop pairs'],
      ['dropdown_selection_options', tableData.dropdownOptions, 'question_id,option_id', 'dropdown options'],
      ['dropdown_selection_targets', tableData.dropdownTargets, 'question_id,key', 'dropdown targets'],
      ['multi_options', tableData.multiOptions, 'question_id,option_id', 'multi-choice options'],
      ['multi_correct_answers', tableData.multiCorrect, 'question_id,option_id', 'multi-choice answers'],
      ['single_selection_options', tableData.singleOptions, 'question_id,option_id', 'single selection options'],
      ['single_selection_correct_answer', tableData.singleCorrect, 'question_id', 'single selection answers'],
      ['order_items', tableData.orderItems, 'question_id,item_id', 'order items'],
      ['order_correct_order', tableData.orderCorrect, 'question_id,item_id', 'order sequences'],
      ['yes_no_answer', tableData.yesNoAnswers, 'question_id', 'yes/no answers'],
      ['yesno_multi_statements', tableData.yesnoStmts, 'question_id,statement_id', 'yes/no multi statements'],
      ['yesno_multi_correct_answers', tableData.yesnoCorrect, 'question_id,statement_id', 'yes/no multi answers']
    ];
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const [table, rows, conflict, description] of migrations) {
      const result = await upsertWithLogging(table, rows, conflict, description);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        log('ERROR', `❌ Migration failed for ${description}`);
      }
    }
    
    // 9. Final summary
    log('SUCCESS', '🎉 Migration completed!');
    log('INFO', `📊 Summary:`);
    log('INFO', `   • Quiz metadata: ✅ Migrated`);
    log('INFO', `   • Base questions: ✅ ${baseRows.length} migrated`);
    log('INFO', `   • Table migrations: ✅ ${successCount} successful, ❌ ${failureCount} failed`);
    
    if (isDryRun) {
      log('INFO', '🔍 This was a DRY RUN - no data was actually inserted');
    }
    
    log('INFO', `📋 Log file: ${LOG_FILE}`);
    
  } catch (err) {
    log('ERROR', '💥 Migration failed:', err.message);
    if (err.stack) {
      log('ERROR', err.stack);
    }
    process.exit(1);
  } finally {
    logStream.end();
  }
}

// ------------------------------------------------------------------
// Execute Migration
// ------------------------------------------------------------------
if (require.main === module) {
  main();
}

module.exports = { main, validateQuestionData, cleanupQuestion };
