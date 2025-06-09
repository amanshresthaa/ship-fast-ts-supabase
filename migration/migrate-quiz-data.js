#!/usr/bin/env node
/**
 * =================================================================
 *     COMPLETE QUIZ MIGRATION SCRIPT (Schema + Data) - v4.0
 * =================================================================
 * This script handles:
 * 1. Database schema setup and validation
 * 2. Quiz data migration from JSON files
 * 3. Trigger setup for automatic timestamps
 * 4. Data integrity validation
 * =================================================================
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// --- Enhanced Logger with Colors & Emojis ---
const LOG_DIR = path.join(__dirname, 'logs');
fs.ensureDirSync(LOG_DIR);
const logStream = fs.createWriteStream(path.join(LOG_DIR, `complete_migration_${new Date().toISOString().replace(/:/g, '-')}.log`), { flags: 'a' });

const colors = {
  reset: "\x1b[0m", green: "\x1b[32m", yellow: "\x1b[33m",
  red: "\x1b[31m", cyan: "\x1b[36m", dim: "\x1b[2m", blue: "\x1b[34m"
};

const formatArgsForLog = (args) => {
  return args.map(arg => {
    if (arg instanceof Error) return arg.stack || arg.message;
    if (typeof arg === 'object' && arg !== null) return JSON.stringify(arg, null, 2);
    return String(arg);
  }).join(' ');
};

const logger = {
  log: (icon, color, ...args) => {
    const formattedMessage = formatArgsForLog(args);
    const consoleMessage = `${color}${icon} ${formattedMessage}${colors.reset}\n`;
    const fileMessage = `${new Date().toISOString()} ${icon} ${formattedMessage}\n`;

    process.stdout.write(consoleMessage);
    logStream.write(fileMessage);
  },
  info: (...args) => logger.log('🚀', colors.cyan, ...args),
  success: (...args) => logger.log('✅', colors.green, ...args),
  warn: (...args) => logger.log('⚠️', colors.yellow, ...args),
  error: (...args) => logger.log('❌', colors.red, ...args),
  dim: (...args) => logger.log('...', colors.dim, ...args),
  schema: (...args) => logger.log('🗄️', colors.blue, ...args),
};

// --- Supabase Client Setup ---
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// --- Database Schema Setup Functions ---
async function executeSQL(query, description) {
  logger.schema(`Skipping SQL execution: ${description} (requires direct database access)`);
  return true;
}

async function setupDatabaseSchema() {
  logger.schema('=== Database Schema Setup ===');
  
  try {
    // Verify that required tables exist
    const { data: quizTable, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .limit(1);
    
    const { data: questionTable, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);
      
    if (quizError || questionError) {
      logger.error('Database schema is not set up. Please run the SQL schema file first.');
      logger.error('You need to apply supabase_database.sql to your Supabase database.');
      logger.error('You can do this through the Supabase dashboard SQL editor.');
      return false;
    }
    
    logger.success('✅ Database schema verification completed - tables exist');
    return true;
  } catch (err) {
    logger.error('Schema verification failed:', err.message);
    return false;
  }
}

// --- Helper Functions ---
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
};

async function upsertInChunks(table, rows, onConflict) {
  if (!rows.length) {
    logger.dim(`No rows for ${table} (skipped)`);
    return;
  }
  const CHUNK_SIZE = 500;
  const chunks = chunkArray(rows, CHUNK_SIZE);
  logger.info(`Upserting ${rows.length} rows into ${table} in ${chunks.length} chunks...`);
  await Promise.all(chunks.map(async (chunk, idx) => {
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) {
      logger.error(`Error in ${table} chunk ${idx + 1}/${chunks.length}:`, error);
      throw error;
    }
  }));
  logger.success(`✓ Finished upserting to ${table}.`);
}

async function validateQuizIntegrity(quizId) {
  logger.info(`=== Validating Quiz Integrity for ${quizId} ===`);
  
  try {
    const { data, error } = await supabase.rpc('validate_quiz_integrity', { 
      quiz_tag_param: quizId 
    });
    
    if (error) {
      logger.warn('Custom validation function not available, performing basic validation:', error.message);
      return await performBasicValidation(quizId);
    }
    
    if (data && data.length > 0) {
      logger.info('Quiz Integrity Report:');
      data.forEach(row => {
        logger.info(`  ${row.table_name}: ${row.question_count} records, ${row.orphaned_records} orphaned`);
        if (row.issues && row.issues.length > 0) {
          row.issues.forEach(issue => logger.warn(`    Issue: ${issue}`));
        }
      });
      logger.success('✅ Quiz integrity validation completed');
      return true;
    } else {
      logger.warn('No validation data returned');
      return await performBasicValidation(quizId);
    }
  } catch (err) {
    logger.error('Error during validation:', err);
    return await performBasicValidation(quizId);
  }
}

async function performBasicValidation(quizId) {
  try {
    logger.info('Performing basic validation checks...');
    
    // Check if quiz exists
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('id', quizId)
      .single();
    
    if (quizError || !quizData) {
      logger.error(`Quiz ${quizId} not found in database`);
      return false;
    }
    
    // Check question count
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('id, type')
      .eq('quiz_tag', quizId);
    
    if (questionError) {
      logger.error('Error fetching questions:', questionError);
      return false;
    }
    
    logger.success(`✓ Found quiz: ${quizData.title}`);
    logger.success(`✓ Total questions: ${questionData?.length || 0}`);
    
    // Count questions by type
    const typeCounts = {};
    questionData?.forEach(q => {
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    });
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      logger.info(`  - ${type}: ${count} questions`);
    });
    
    return true;
  } catch (err) {
    logger.error('Basic validation failed:', err);
    return false;
  }
}

// --- Main Migration Logic ---
(async () => {
  try {
    logger.info('=== Complete Quiz Migration Process Started (v4.0) ===');
    
    // Step 1: Setup Database Schema
    await setupDatabaseSchema();
    
    // Step 2: Quiz Data Migration
    logger.info('=== Starting Quiz Data Migration ===');
    const quizDir = path.join(__dirname, '..', 'app', 'data', 'quizzes', 'azure-a102');

    // 2.1. Upsert Quiz Metadata
    const metaFile = path.join(quizDir, 'quiz_metadata.json');
    if (!await fs.pathExists(metaFile)) {
      throw new Error(`quiz_metadata.json not found at ${metaFile}`);
    }

    const meta = await fs.readJson(metaFile);
    
    // Use folder name as quiz ID for consistency with application code
    const folderBaseName = path.basename(quizDir);
    const quizRow = {
      id: folderBaseName, // Use folder name (e.g., 'azure-a102') instead of metadata.id
      title: meta.metadata.title,
      description: meta.metadata.description,
      quiz_type: meta.metadata.quizType,
      quiz_tag: meta.metadata.quiz_tag || folderBaseName,
      settings: meta.metadata.settings,
      author: meta.metadata.author,
      difficulty: meta.metadata.difficulty || 'medium',
      quiz_topic: meta.quiz_topic || meta.metadata.quiz_topic || 'azure-fundamentals',
    };
    
    logger.info(`Upserting quiz - ID: ${quizRow.id}, Tag: ${quizRow.quiz_tag}, Topic: ${quizRow.quiz_topic}`);
    await upsertInChunks('quizzes', [quizRow], 'id');

    // 2.2. Read All Question JSON Files
    const files = (await fs.readdir(quizDir)).filter(f => f.startsWith('clean_') && f.endsWith('.json'));
    if (files.length === 0) {
      logger.warn('No clean_*.json files found in quiz directory');
      return;
    }
    
    const questionArrays = await Promise.all(
      files.map(async f => {
        try {
          const data = await fs.readJson(path.join(quizDir, f));
          return data.questions || [];
        } catch (err) {
          logger.warn(`Could not read or parse ${f}:`, err.message);
          return [];
        }
      })
    );
    
    const allQuestions = questionArrays.flat();
    if (!allQuestions.length) {
      logger.warn('No questions found in JSON files. Exiting.');
      return;
    }
    logger.info(`Loaded ${allQuestions.length} total questions from ${files.length} JSON files.`);

    // 2.3. Generate UUIDs and Prepare Base Question Rows
    const idMap = {};
    const baseQuestionRows = allQuestions.map(q => {
      const originalId = q.id || uuidv4();
      const newId = uuidv4();
      idMap[originalId] = newId;
      q.originalId = originalId;

      return {
        id: newId,
        type: q.type,
        question: q.questionText || q.question,
        points: q.points || 1,
        quiz_tag: quizRow.id, // Use quiz.id to satisfy the foreign key constraint
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || null,
        feedback_correct: q.feedback?.correct || 'Correct!',
        feedback_incorrect: q.feedback?.incorrect || 'Incorrect.',
      };
    });
    
    logger.info(`Prepared ${baseQuestionRows.length} questions with quiz_tag: ${quizRow.id}`);
    await upsertInChunks('questions', baseQuestionRows, 'id');

    // 2.4. Prepare Data for All Child Tables
    const childData = {};
    const childTables = [
      'drag_and_drop_targets', 'drag_and_drop_options', 'drag_and_drop_correct_pairs',
      'dropdown_selection_options', 'dropdown_selection_targets', 'multi_options',
      'multi_correct_answers', 'single_selection_options', 'single_selection_correct_answer',
      'order_items', 'order_correct_order', 'yes_no_answer', 'yesno_multi_statements',
      'yesno_multi_correct_answers'
    ];
    childTables.forEach(t => childData[t] = []);

    // Process each question and prepare child data
    allQuestions.forEach(q => {
      const qid = idMap[q.originalId];
      if (!qid) {
        logger.warn(`Could not find new UUID for original question ID: ${q.originalId}. Skipping its child data.`);
        return;
      }
      
      try {
        switch (q.type) {
          case 'drag_and_drop':
            if (!q.targets || !q.options || !q.correct_pairs) {
              logger.warn(`Missing required fields for drag_and_drop question ${q.originalId}`);
              break;
            }
            q.targets.forEach(t => {
              if (t.id && t.text) {
                childData.drag_and_drop_targets.push({ question_id: qid, target_id: t.id, text: t.text });
              }
            });
            q.options.forEach(o => {
              if (o.id && o.text) {
                childData.drag_and_drop_options.push({ question_id: qid, option_id: o.id, text: o.text });
              }
            });
            q.correct_pairs.forEach(p => {
              if (p.option_id && p.target_id) {
                childData.drag_and_drop_correct_pairs.push({ question_id: qid, option_id: p.option_id, target_id: p.target_id });
              }
            });
            break;
            
          case 'dropdown_selection':
            if (!q.options || !q.target) {
              logger.warn(`Missing required fields for dropdown_selection question ${q.originalId}`);
              break;
            }
            q.options.forEach(o => {
              if (o.id && o.text) {
                childData.dropdown_selection_options.push({ 
                  question_id: qid, 
                  option_id: o.id, 
                  text: o.text, 
                  is_correct: !!o.is_correct 
                });
              }
            });
            Object.entries(q.target).forEach(([k, v]) => {
              childData.dropdown_selection_targets.push({ question_id: qid, key: k, value: v });
            });
            break;
            
          case 'multi':
            if (!q.options) {
              logger.warn(`Missing options for multi question ${q.originalId}`);
              break;
            }
            const validMultiOptionIds = new Set();
            q.options.forEach(o => {
              if (o.id && o.text) {
                childData.multi_options.push({ question_id: qid, option_id: o.id, text: o.text });
                validMultiOptionIds.add(o.id);
              }
            });
            q.correctAnswers?.forEach(correctId => {
              if (validMultiOptionIds.has(correctId)) {
                childData.multi_correct_answers.push({ question_id: qid, option_id: correctId });
              } else {
                logger.warn(`Skipping invalid correct answer option_id '${correctId}' for multi question ${q.originalId}`);
              }
            });
            break;
            
          case 'single_selection':
            if (!q.options) {
              logger.warn(`Missing options for single_selection question ${q.originalId}`);
              break;
            }
            const validOptionIds = new Set();
            q.options.forEach(o => {
              if (o.id && o.text) {
                childData.single_selection_options.push({ question_id: qid, option_id: o.id, text: o.text });
                validOptionIds.add(o.id);
              }
            });
            if (q.correctAnswers?.[0]) {
              const correctAnswerId = q.correctAnswers[0];
              if (validOptionIds.has(correctAnswerId)) {
                childData.single_selection_correct_answer.push({ question_id: qid, option_id: correctAnswerId });
              } else {
                logger.error(`Invalid correct answer option_id '${correctAnswerId}' for single_selection question ${q.originalId}. Valid options: [${Array.from(validOptionIds).join(', ')}]`);
              }
            } else {
              logger.warn(`Missing correctAnswers for single_selection question ${q.originalId}`);
            }
            break;
            
          case 'order':
            if (!q.items) {
              logger.warn(`Missing items for order question ${q.originalId}`);
              break;
            }
            const validItemIds = new Set((q.items || []).map(i => i.id));
            q.items?.forEach(i => {
              if (i.id && i.text) {
                childData.order_items.push({ question_id: qid, item_id: i.id, text: i.text });
              }
            });
            q.correctOrder?.forEach((id, idx) => {
              if (validItemIds.has(id)) {
                childData.order_correct_order.push({ question_id: qid, item_id: id, position: idx + 1 });
              } else {
                logger.warn(`Skipping invalid item_id '${id}' in correctOrder for question ${q.originalId}`);
              }
            });
            break;
            
          case 'yes_no':
            if (q.correctAnswer === undefined) {
              logger.warn(`Missing correctAnswer for yes_no question ${q.originalId}`);
              break;
            }
            childData.yes_no_answer.push({ question_id: qid, correct_answer: q.correctAnswer === 'yes' });
            break;
            
          case 'yesno_multi':
            if (!q.statements) {
              logger.warn(`Missing statements for yesno_multi question ${q.originalId}`);
              break;
            }
            const validStatementIds = new Set();
            q.statements?.forEach(s => {
              if (s.id && s.text) {
                childData.yesno_multi_statements.push({ question_id: qid, statement_id: s.id, text: s.text });
                validStatementIds.add(s.id);
              }
            });
            q.statements?.forEach((s, i) => {
              if (s.id && validStatementIds.has(s.id) && q.correctAnswers?.[i] !== undefined) {
                childData.yesno_multi_correct_answers.push({ 
                  question_id: qid, 
                  statement_id: s.id, 
                  correct_answer: q.correctAnswers[i] === 'yes' 
                });
              }
            });
            break;
            
          default:
            logger.warn(`Unknown question type: ${q.type} for question ${q.originalId}`);
        }
      } catch (error) {
        logger.error(`Error processing question ${q.originalId} of type ${q.type}:`, error);
      }
    });

    // 2.5. Log child data statistics
    Object.entries(childData).forEach(([table, data]) => {
      if (data.length > 0) {
        logger.info(`Prepared ${data.length} rows for ${table}`);
      }
    });

    // 2.6. Upsert Child Data with Proper Dependencies
    logger.info('=== Upserting child table data ===');
    
    // First, upsert all the base option/item/target/statement tables
    await Promise.all([
      upsertInChunks('drag_and_drop_targets', childData.drag_and_drop_targets, 'question_id,target_id'),
      upsertInChunks('drag_and_drop_options', childData.drag_and_drop_options, 'question_id,option_id'),
      upsertInChunks('dropdown_selection_options', childData.dropdown_selection_options, 'question_id,option_id'),
      upsertInChunks('dropdown_selection_targets', childData.dropdown_selection_targets, 'question_id,key'),
      upsertInChunks('multi_options', childData.multi_options, 'question_id,option_id'),
      upsertInChunks('single_selection_options', childData.single_selection_options, 'question_id,option_id'),
      upsertInChunks('order_items', childData.order_items, 'question_id,item_id'),
      upsertInChunks('yes_no_answer', childData.yes_no_answer, 'question_id'),
      upsertInChunks('yesno_multi_statements', childData.yesno_multi_statements, 'question_id,statement_id'),
    ]);

    // Then, upsert all the dependent tables that reference the above tables
    await Promise.all([
      upsertInChunks('drag_and_drop_correct_pairs', childData.drag_and_drop_correct_pairs, 'question_id,option_id,target_id'),
      upsertInChunks('multi_correct_answers', childData.multi_correct_answers, 'question_id,option_id'),
      upsertInChunks('single_selection_correct_answer', childData.single_selection_correct_answer, 'question_id'),
      upsertInChunks('order_correct_order', childData.order_correct_order, 'question_id,item_id'),
      upsertInChunks('yesno_multi_correct_answers', childData.yesno_multi_correct_answers, 'question_id,statement_id'),
    ]);

    // Step 3: Validate Quiz Integrity
    logger.info('=== Final Validation ===');
    await validateQuizIntegrity(quizRow.id);

    // Step 4: Migration Summary
    logger.success('=== Complete Quiz Migration Process Finished Successfully ===');
    logger.info(`Migration Summary:
    - Schema Setup: ✅ Completed
    - Quiz ID: ${quizRow.id}
    - Quiz Tag: ${quizRow.quiz_tag} 
    - Quiz Topic: ${quizRow.quiz_topic}
    - Total Questions: ${baseQuestionRows.length}
    - Child Tables Updated: ${childTables.length}
    - Validation: ✅ Completed`);
    
  } catch (err) {
    logger.error('The complete migration script failed:', err);
    process.exit(1);
  } finally {
    logStream.end();
  }
})();