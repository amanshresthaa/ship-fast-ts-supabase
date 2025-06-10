#!/usr/bin/env node
/**
 * =================================================================
 *     PROJECT MANAGEMENT QUIZ MIGRATION SCRIPT - v1.0
 * =================================================================
 * This script handles migration for the project-management quiz
 * which has a different structure than the azure-a102 quiz.
 * =================================================================
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// --- Logger setup (same as main migration script) ---
const LOG_DIR = path.join(__dirname, 'logs');
fs.ensureDirSync(LOG_DIR);
const logStream = fs.createWriteStream(path.join(LOG_DIR, `pm_migration_${new Date().toISOString().replace(/:/g, '-')}.log`), { flags: 'a' });

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

// --- Main Migration Logic ---
(async () => {
  try {
    logger.info('=== Project Management Quiz Migration Started (v1.0) ===');
    
    const quizDir = path.join(__dirname, '..', 'app', 'data', 'quizzes', 'project-management', 'project-management');
    
    // 1. Create Quiz Metadata
    const quizId = 'project-management';
    const quizRow = {
      id: quizId,
      title: 'Project Management Professional (PMP) Agile Practice Quiz',
      description: 'Comprehensive quiz covering Agile principles, methodologies, and project management practices',
      quiz_type: 'certification',
      quiz_tag: 'project-management',
      settings: {
        timeLimit: null,
        shuffleQuestions: true,
        shuffleAnswers: true,
        showCorrectAnswers: true,
        allowRetake: true
      },
      author: 'Quiz System',
      difficulty: 'medium',
      quiz_topic: 'Project Management (Agile)',
    };
    
    logger.info(`Creating quiz - ID: ${quizRow.id}, Topic: ${quizRow.quiz_topic}`);
    await upsertInChunks('quizzes', [quizRow], 'id');

    // 2. Read All Topic JSON Files
    const files = (await fs.readdir(quizDir)).filter(f => f.startsWith('topic-') && f.endsWith('.json'));
    if (files.length === 0) {
      logger.warn('No topic-*.json files found in project-management directory');
      return;
    }
    
    logger.info(`Found ${files.length} topic files: ${files.join(', ')}`);
    
    const questionArrays = await Promise.all(
      files.map(async f => {
        try {
          const data = await fs.readJson(path.join(quizDir, f));
          logger.info(`Loaded ${data.questions?.length || 0} questions from ${f}`);
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
    logger.info(`Loaded ${allQuestions.length} total questions from ${files.length} topic files.`);

    // 3. Generate UUIDs and Prepare Base Question Rows
    const idMap = {};
    const baseQuestionRows = allQuestions.map(q => {
      const originalId = q.id || uuidv4();
      const newId = uuidv4();
      idMap[originalId] = newId;
      q.originalId = originalId;

      // Normalize question type
      let normalizedType = q.type;
      if (q.type === 'single' || q.type === 'single_select') {
        normalizedType = 'single_selection';
      } else if (q.type === 'multi_select') {
        normalizedType = 'multi';
      }

      return {
        id: newId,
        type: normalizedType,
        question: q.question,
        points: q.points || 1,
        quiz_tag: quizRow.id,
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || null,
        feedback_correct: q.feedback?.correct || 'Correct!',
        feedback_incorrect: q.feedback?.incorrect || 'Incorrect.',
      };
    });
    
    logger.info(`Prepared ${baseQuestionRows.length} questions with quiz_tag: ${quizRow.id}`);
    await upsertInChunks('questions', baseQuestionRows, 'id');

    // 4. Prepare Child Data for All Question Types
    const childData = {};
    const childTables = [
      'multi_options', 'multi_correct_answers',
      'single_selection_options', 'single_selection_correct_answer',
      'yes_no_answer', 'yesno_multi_statements', 'yesno_multi_correct_answers'
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
        // Normalize the type for processing
        let questionType = q.type;
        if (q.type === 'single' || q.type === 'single_select') {
          questionType = 'single_selection';
        } else if (q.type === 'multi_select') {
          questionType = 'multi';
        }
        
        switch (questionType) {
          case 'yes_no':
            childData.yes_no_answer.push({
              question_id: qid,
              correct_answer: q.correctAnswer === 'yes'
            });
            break;

          case 'single_selection':
            // Add options
            if (q.options && Array.isArray(q.options)) {
              q.options.forEach(opt => {
                childData.single_selection_options.push({
                  question_id: qid,
                  option_id: opt.id,
                  text: opt.text
                });
              });
              
              // Add correct answer
              if (q.correctAnswer) {
                childData.single_selection_correct_answer.push({
                  question_id: qid,
                  option_id: q.correctAnswer
                });
              }
            }
            break;

          case 'multi':
            // Add options
            if (q.options && Array.isArray(q.options)) {
              q.options.forEach(opt => {
                childData.multi_options.push({
                  question_id: qid,
                  option_id: opt.id,
                  text: opt.text
                });
              });
              
              // Add correct answers
              if (q.correctAnswers && Array.isArray(q.correctAnswers)) {
                q.correctAnswers.forEach(answerId => {
                  childData.multi_correct_answers.push({
                    question_id: qid,
                    option_id: answerId
                  });
                });
              }
            }
            break;

          case 'yesno_multi':
            // Add statements
            if (q.statements && Array.isArray(q.statements)) {
              q.statements.forEach(stmt => {
                childData.yesno_multi_statements.push({
                  question_id: qid,
                  statement_id: stmt.id,
                  text: stmt.text
                });
              });
              
              // Add correct answers
              if (q.correctAnswers && typeof q.correctAnswers === 'object') {
                Object.entries(q.correctAnswers).forEach(([stmtId, answer]) => {
                  childData.yesno_multi_correct_answers.push({
                    question_id: qid,
                    statement_id: stmtId,
                    correct_answer: answer === 'yes' || answer === true
                  });
                });
              }
            }
            break;

          default:
            logger.warn(`Unknown question type: ${q.type} (normalized to ${questionType}) for question ${q.originalId}`);
        }
      } catch (error) {
        logger.error(`Error processing question ${q.originalId}:`, error.message);
      }
    });

    // 5. Log child data statistics
    Object.entries(childData).forEach(([table, data]) => {
      if (data.length > 0) {
        logger.info(`Prepared ${data.length} rows for ${table}`);
      }
    });

    // 6. Upsert Child Data
    logger.info('=== Upserting child table data ===');
    
    // First, upsert all the base option/statement tables
    await Promise.all([
      upsertInChunks('multi_options', childData.multi_options, 'question_id,option_id'),
      upsertInChunks('single_selection_options', childData.single_selection_options, 'question_id,option_id'),
      upsertInChunks('yes_no_answer', childData.yes_no_answer, 'question_id'),
      upsertInChunks('yesno_multi_statements', childData.yesno_multi_statements, 'question_id,statement_id'),
    ]);

    // Then, upsert all the dependent tables
    await Promise.all([
      upsertInChunks('multi_correct_answers', childData.multi_correct_answers, 'question_id,option_id'),
      upsertInChunks('single_selection_correct_answer', childData.single_selection_correct_answer, 'question_id'),
      upsertInChunks('yesno_multi_correct_answers', childData.yesno_multi_correct_answers, 'question_id,statement_id'),
    ]);

    // 7. Final Validation
    logger.info('=== Final Validation ===');
    
    const { data: finalQuiz, error: finalQuizError } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('id', quizId)
      .single();
    
    if (finalQuizError || !finalQuiz) {
      logger.error(`Quiz ${quizId} not found in database after migration`);
      return;
    }
    
    const { data: finalQuestions, error: finalQuestionsError } = await supabase
      .from('questions')
      .select('id, type')
      .eq('quiz_tag', quizId);
    
    if (finalQuestionsError) {
      logger.error('Error fetching questions:', finalQuestionsError);
      return;
    }
    
    logger.success(`✓ Found quiz: ${finalQuiz.title}`);
    logger.success(`✓ Total questions: ${finalQuestions?.length || 0}`);
    
    // Count questions by type
    const typeCounts = {};
    finalQuestions?.forEach(q => {
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    });
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      logger.info(`  - ${type}: ${count} questions`);
    });

    // 8. Migration Summary
    logger.success('=== Project Management Quiz Migration Finished Successfully ===');
    logger.info(`Migration Summary:
    - Quiz ID: ${quizRow.id}
    - Quiz Title: ${quizRow.title}
    - Quiz Topic: ${quizRow.quiz_topic}
    - Total Questions: ${baseQuestionRows.length}
    - Topic Files Processed: ${files.length}
    - Child Tables Updated: ${childTables.length}
    - Validation: ✅ Completed`);
    
  } catch (err) {
    logger.error('The project management migration script failed:', err);
    process.exit(1);
  } finally {
    logStream.end();
  }
})();
