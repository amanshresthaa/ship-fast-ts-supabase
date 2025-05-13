#!/usr/bin/env node
/**
 * Migrate Azure-A102 quiz metadata + questions into Supabase/Postgres.
 *
 * 1. Upserts quiz-level metadata from `quiz_metadata.json`.
 * 2. Walks every `clean_*.json` question file, generates fresh UUIDs,
 *    and upserts all base and child-table rows according to the REFINED schema.
 *
 * Environment:
 *   • SUPABASE_URL
 *   • SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ------------------------------------------------------------------
// Supabase client
// ------------------------------------------------------------------
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// ------------------------------------------------------------------
// Logging
// ------------------------------------------------------------------
const LOG_DIR  = path.join(__dirname, 'logs');
fs.ensureDirSync(LOG_DIR);
const LOG_FILE = path.join(LOG_DIR, 'migration.log');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

const nowISO = () => new Date().toISOString();
function log(...args) {
  const flat = args.map(a =>
    a instanceof Error ? (a.stack || a.message)
      : typeof a === 'object' ? JSON.stringify(a, null, 2)
      : String(a)
  );
  const line = `${nowISO()} ${flat.join(' ')}\n`;
  process.stdout.write(line);
  logStream.write(line);
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
(async () => {
  try {
    const quizDir = path.join(__dirname, 'app', 'data', 'quizzes', 'azure-a102');
    log('=== Migration started ===');

    // 1. Quiz-level metadata
    let quizRow;
    const metaFile = path.join(quizDir, 'quiz_metadata.json');
    if (await fs.pathExists(metaFile)) {
      const meta = await fs.readJson(metaFile);
      quizRow = {
        id:          meta.metadata.id,
        title:       meta.metadata.title,
        description: meta.metadata.description,
        quiz_type:   meta.metadata.quizType,
        settings:    meta.metadata.settings,
        author:      meta.metadata.author,
        difficulty:  meta.metadata.difficulty || 'medium',
        quiz_topic:  meta.metadata.id,
        // created_at and updated_at will use DEFAULT now() in the DB
      };

      log('Upserting quiz metadata for', quizRow.id);
      // Ensure timestamps are handled by the DB on insert/update
      const { error: metaErr } = await supabase
        .from('quizzes')
        .upsert(quizRow, { onConflict: 'id' });
      if (metaErr) throw metaErr;
      log('Quiz metadata upserted');
    } else {
      throw new Error('quiz_metadata.json not found – cannot continue without quiz metadata');
    }

    // 2. Gather question files
    const files = await fs.readdir(quizDir);
    const jsonFiles = files.filter(f => f.startsWith('clean_') && f.endsWith('.json'));
    const allQuestions = [];

    for (const file of jsonFiles) {
      const filePath = path.join(quizDir, file);
      log('Reading', filePath);
      try {
        const { questions } = await fs.readJson(filePath);
        if (Array.isArray(questions) && questions.length) {
          log(`Loaded ${questions.length} questions from ${file}`);
          allQuestions.push(...questions);
        } else {
          log(`WARN: ${file} contained no questions or invalid format`);
        }
      } catch (readErr) {
        log(`ERROR reading or parsing ${file}:`, readErr);
      }
    }


    if (!allQuestions.length) {
      log('No questions found – nothing to do');
      return;
    }
    log('Total questions to import:', allQuestions.length);

    // 3. Legacy ID ➞ UUID map
    const idMap = {};
    allQuestions.forEach(q => {
      if (q.id) { // Check if question has an ID
        idMap[q.id] = uuidv4();
      } else {
        log(`WARN: Question found without an ID:`, q);
        // Handle missing ID - perhaps generate one here or skip
        // For now, generating a UUID on the fly if missing
        const generatedId = uuidv4();
        q.id = generatedId; // Add ID back to object for later steps
        idMap[generatedId] = generatedId;
        log(`Generated temporary ID ${generatedId} for question: ${q.question?.substring(0, 50)}...`);
      }
    });

    // 4. Upsert base questions
    const baseRows = allQuestions.map(q => ({
      id:                 idMap[q.id],
      type:               q.type,
      question:           q.question,
      points:             q.points,
      quiz_tag:           quizRow.id,
      difficulty:         q.difficulty || 'medium',
      explanation:        q.explanation || null,
      feedback_correct:   q.feedback?.correct || 'Correct!', // Provide default feedback
      feedback_incorrect: q.feedback?.incorrect || 'Incorrect.', // Provide default feedback
      // created_at and updated_at handled by DB default
    }));

    log('Upserting base questions');
    const { error: baseErr } = await supabase
      .from('questions')
      .upsert(baseRows, { onConflict: 'id' });
    if (baseErr) throw baseErr;
    log('Base questions done');

    // 5. Child-table rows
    const dragTargets           = [];
    const dragOptions           = []; // Refined
    const dragPairs             = [];
    const dropdownOptions       = []; // Refined (keeping is_correct for API)
    const dropdownTargets       = [];
    const multiOptions          = [];
    const multiCorrect          = [];
    const singleOptions         = [];
    const singleCorrect         = [];
    const orderItems            = []; // Refined
    const orderCorrect          = [];
    const yesNoAnswers          = [];
    const yesnoStmts            = [];
    const yesnoCorrect          = [];

    for (const q of allQuestions) {
      // Skip if ID mapping failed (e.g., question had no ID originally and wasn't fixed)
      if (!idMap[q.id]) {
          log(`WARN: Skipping child data for question with missing/unmapped ID: ${q.question?.substring(0, 50)}...`);
          continue;
      }
      const qid = idMap[q.id];


      switch (q.type) {
        case 'drag_and_drop':
          if (!q.targets || !q.options || !q.correct_pairs) {
             log(`WARN: Missing targets, options, or correct_pairs for drag_and_drop question ID ${q.id}`);
             continue;
          }
          q.targets.forEach(t =>
            dragTargets.push({ question_id: qid, target_id: t.id, text: t.text })
          );
          q.options.forEach(o =>
            // *** Refined: Removed target_id and is_correct ***
            dragOptions.push({
              question_id: qid,
              option_id:   o.id,
              text:        o.text
            })
          );
          q.correct_pairs.forEach(p =>
            dragPairs.push({
              question_id: qid,
              option_id:   p.option_id,
              target_id:   p.target_id
            })
          );
          break;

        case 'dropdown_selection':
           if (!q.options || !q.target) {
             log(`WARN: Missing options or target for dropdown_selection question ID ${q.id}`);
             continue;
           }
          q.options.forEach(o =>
             // *** Reverted: Keep is_correct for API logic ***
            dropdownOptions.push({
              question_id: qid,
              option_id:   o.id,
              text:        o.text,
              is_correct:  o.is_correct ?? false // Default to false if missing
            })
          );
          // Ensure target is an object before iterating
          if (typeof q.target === 'object' && q.target !== null) {
            Object.entries(q.target).forEach(([key, value]) =>
              dropdownTargets.push({ question_id: qid, key, value })
            );
          } else {
             log(`WARN: Invalid target format for dropdown_selection question ID ${q.id}`);
          }
          break;

        case 'multi':
          if (!q.options || !q.correctAnswers) {
            log(`WARN: Missing options or correctAnswers for multi question ID ${q.id}`);
            continue;
          }
          q.options.forEach(o => {
            multiOptions.push({ question_id: qid, option_id: o.id, text: o.text });
            // Ensure correctAnswers is an array before checking includes
            if (Array.isArray(q.correctAnswers) && q.correctAnswers.includes(o.id)) {
              multiCorrect.push({ question_id: qid, option_id: o.id }); // FK relation to multi_options
            }
          });
          break;

        case 'single_selection':
          if (!q.options || !q.correctAnswers || !q.correctAnswers[0]) {
            log(`WARN: Missing options or correctAnswers[0] for single_selection question ID ${q.id}`);
            continue;
          }
          q.options.forEach(o =>
            singleOptions.push({ question_id: qid, option_id: o.id, text: o.text })
          );
          singleCorrect.push({ question_id: qid, option_id: q.correctAnswers[0] }); // FK relation to single_selection_options
          break;

        case 'order':
          if (!q.items || !q.correctOrder) {
            log(`WARN: Missing items or correctOrder for order question ID ${q.id}`);
            continue;
          }
          // *** Refined: Removed position from orderItems ***
          q.items.forEach((item) =>
            orderItems.push({
              question_id: qid,
              item_id:     item.id,
              text:        item.text
            })
          );
          q.correctOrder.forEach((id, idx) =>
            orderCorrect.push({
              question_id: qid,
              item_id:     id,
              position:    idx + 1 // Positions are 1-based
            }) // FK relation to order_items
          );
          break;

        case 'yes_no':
          if (q.correctAnswer === undefined || q.correctAnswer === null) {
             log(`WARN: Missing correctAnswer for yes_no question ID ${q.id}`);
             continue;
          }
          yesNoAnswers.push({
            question_id:    qid,
            correct_answer: q.correctAnswer === 'yes' // Assuming source is 'yes'/'no' string
          });
          break;

        case 'yesno_multi':
           if (!q.statements || !q.correctAnswers) {
             log(`WARN: Missing statements or correctAnswers for yesno_multi question ID ${q.id}`);
             continue;
           }
          q.statements.forEach(s =>
            yesnoStmts.push({
              question_id:  qid,
              statement_id: s.id,
              text:         s.text
            })
          );
          // Ensure correctAnswers has same length as statements
           if (q.statements.length !== q.correctAnswers.length) {
             log(`WARN: Mismatch between statements count (${q.statements.length}) and answers count (${q.correctAnswers.length}) for yesno_multi question ID ${q.id}`);
             continue;
           }
          q.correctAnswers.forEach((ans, idx) =>
            yesnoCorrect.push({
              question_id:    qid,
              statement_id:   q.statements[idx].id, // Use ID from corresponding statement
              correct_answer: ans === 'yes' // Assuming source is 'yes'/'no' string
            }) // FK relation to yesno_multi_statements
          );
          break;

        default:
             log(`WARN: Unknown question type '${q.type}' for question ID ${q.id}`);
             break;
      }
    }

    // 6. Bulk helper (ensure ON CONFLICT uses appropriate constraints)
    async function upsert(table, rows, conflictConstraint) {
      if (!rows.length) {
        log(`No ${table} rows – skipped`);
        return;
      }
      log(`Upserting ${rows.length} rows into ${table}`);
      const { error } = await supabase
        .from(table)
        .upsert(rows, { onConflict: conflictConstraint }); // Use specific constraint name if needed
      if (error) {
        log(`ERROR upserting into ${table}:`, error); // Log specific error
        throw error; // Re-throw to stop migration on critical error
      }
      log(`${table} done`);
    }

    // 7. Execute child-table upserts with correct conflict constraints
    await upsert('drag_and_drop_targets',           dragTargets,     'question_id,target_id');
    await upsert('drag_and_drop_options',           dragOptions,     'question_id,option_id'); // Refined
    await upsert('drag_and_drop_correct_pairs',     dragPairs,       'question_id,option_id,target_id'); // Refined PK/constraint name
    await upsert('dropdown_selection_options',      dropdownOptions, 'question_id,option_id'); // Refined (kept is_correct)
    await upsert('dropdown_selection_targets',      dropdownTargets, 'question_id,key');
    await upsert('multi_options',                   multiOptions,    'question_id,option_id');
    await upsert('multi_correct_answers',           multiCorrect,    'question_id,option_id'); // PK/constraint name matches schema
    await upsert('single_selection_options',        singleOptions,   'question_id,option_id');
    await upsert('single_selection_correct_answer', singleCorrect,   'question_id'); // PK/constraint name matches schema
    await upsert('order_items',                     orderItems,      'question_id,item_id'); // Refined
    await upsert('order_correct_order',             orderCorrect,    'question_id,item_id'); // PK/constraint name matches schema
    await upsert('yes_no_answer',                   yesNoAnswers,    'question_id'); // PK/constraint name matches schema
    await upsert('yesno_multi_statements',          yesnoStmts,      'question_id,statement_id');
    await upsert('yesno_multi_correct_answers',     yesnoCorrect,    'question_id,statement_id'); // PK/constraint name matches schema


    log('=== Migration finished successfully ===');
  } catch (err) {
    log('ERROR', err);
    process.exit(1);
  } finally {
    logStream.end();
  }
})();