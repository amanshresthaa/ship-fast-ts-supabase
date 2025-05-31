const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
// Ensure these environment variables are set in your .env file or environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const quizzesDataPath = path.join(__dirname, '../app/data/quizzes');

async function migrateQuizMetadata() {
  console.log('Starting quiz metadata migration...');
  try {
    const quizFolders = fs.readdirSync(quizzesDataPath).filter(folder =>
      fs.statSync(path.join(quizzesDataPath, folder)).isDirectory()
    );

    for (const quizFolder of quizFolders) {
      const metadataPath = path.join(quizzesDataPath, quizFolder, 'quiz_metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        const { id, title, description, quiz_type, settings, author, difficulty, quiz_topic } = metadata;
        
        console.log(`Migrating metadata for quiz: ${id} - ${title}`);

        const { error } = await supabase
          .from('quizzes')
          .upsert({
            id,
            title,
            description,
            quiz_type,
            settings,
            author,
            difficulty,
            quiz_topic,
            // ensure created_at and updated_at are handled by db
          }, { onConflict: 'id' });

        if (error) {
          console.error(`Error migrating metadata for quiz ${id}:`, error.message);
        } else {
          console.log(`Successfully migrated metadata for quiz ${id}.`);
        }
      } else {
        console.warn(`quiz_metadata.json not found in ${quizFolder}. Skipping metadata.`);
      }
    }
    console.log('Quiz metadata migration completed.');
  } catch (error) {
    console.error('Error during quiz metadata migration:', error);
  }
}

// Function to insert a base question and return its ID
async function insertBaseQuestion(questionData, quizTag) {
  const {
    id, // This is the UUID from the JSON file
    type,
    question,
    points,
    difficulty,
    explanation,
    feedback_correct,
    feedback_incorrect,
  } = questionData;

  if (!id) {
    console.error(`Question data is missing 'id' (UUID). Skipping:`, questionData.question ? questionData.question.substring(0, 50) + '...' : 'No question text');
    return null;
  }

  // console.log(`Attempting to insert/update base question ${id} of type ${type} for quiz ${quizTag}`);
  const { error } = await supabase
    .from('questions')
    .upsert({
      id,
      type,
      question,
      points,
      quiz_tag: quizTag,
      difficulty,
      explanation,
      feedback_correct,
      feedback_incorrect,
    }, { onConflict: 'id' });

  if (error) {
    console.error(`Error inserting/updating base question ${id} for quiz ${quizTag}:`, error.message);
    return null;
  }
  // console.log(`Successfully inserted/updated base question ${id}.`);
  return id;
}

// --- Migration for Single Selection Questions ---
async function migrateSingleSelectionQuestions(questions, quizTag) {
  console.log(`  Migrating ${questions.length} single_selection questions for quiz ${quizTag}...`);
  for (const q of questions) {
    if (q.type !== 'single_selection') {
      console.warn(`  Skipping question with mismatched type '${q.type}' in single_selection file. Expected 'single_selection'. Question ID: ${q.id}`);
      continue;
    }

    const questionId = await insertBaseQuestion(q, quizTag);
    if (!questionId) continue;

    // 1. Insert options
    if (q.options && q.options.length > 0) {
      const optionsToInsert = q.options.map(opt => ({
        question_id: questionId,
        option_id: opt.option_id,
        text: opt.text,
      }));

      const { error: optionsError } = await supabase
        .from('single_selection_options')
        .upsert(optionsToInsert, { onConflict: 'question_id, option_id' });

      if (optionsError) {
        console.error(`  Error inserting options for single_selection question ${questionId}:`, optionsError.message);
      }
    }

    // 2. Insert correct answer
    if (q.correctAnswerOptionId) {
      const { error: correctAnswerError } = await supabase
        .from('single_selection_correct_answer')
        .upsert({
          question_id: questionId,
          option_id: q.correctAnswerOptionId,
        }, { onConflict: 'question_id' });

      if (correctAnswerError) {
        console.error(`  Error inserting correct answer for single_selection question ${questionId}:`, correctAnswerError.message);
      }
    }
  }
}

// --- Placeholder for other question type migration functions ---
async function migrateMultiChoiceQuestions(questions, quizTag) {
  console.log(`  Placeholder: Migrating ${questions.length} multi_choice questions for quiz ${quizTag}... (Not yet implemented)`);
}
async function migrateDragAndDropQuestions(questions, quizTag) {
  console.log(`  Placeholder: Migrating ${questions.length} drag_and_drop questions for quiz ${quizTag}... (Not yet implemented)`);
}
async function migrateOrderQuestions(questions, quizTag) {
  console.log(`  Placeholder: Migrating ${questions.length} order questions for quiz ${quizTag}... (Not yet implemented)`);
}
async function migrateDropdownSelectionQuestions(questions, quizTag) {
  console.log(`  Placeholder: Migrating ${questions.length} dropdown_selection questions for quiz ${quizTag}... (Not yet implemented)`);
}
async function migrateYesNoQuestions(questions, quizTag) {
  console.log(`  Placeholder: Migrating ${questions.length} yes_no questions for quiz ${quizTag}... (Not yet implemented)`);
}
async function migrateYesNoMultiQuestions(questions, quizTag) {
  console.log(`  Placeholder: Migrating ${questions.length} yesno_multi questions for quiz ${quizTag}... (Not yet implemented)`);
}

async function migrateQuizQuestions() {
  console.log('\nStarting quiz questions migration...');
  try {
    const quizFolders = fs.readdirSync(quizzesDataPath).filter(folder =>
      fs.statSync(path.join(quizzesDataPath, folder)).isDirectory()
    );

    for (const quizFolder of quizFolders) {
      const quizFolderPath = path.join(quizzesDataPath, quizFolder);
      const metadataPath = path.join(quizFolderPath, 'quiz_metadata.json');
      let quizTag;

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        quizTag = metadata.id;
        console.log(`\nProcessing questions for quiz: ${quizTag} (Folder: ${quizFolder})`);
      } else {
        console.warn(`quiz_metadata.json not found in ${quizFolder}. Skipping question migration for this folder.`);
        continue;
      }

      const questionFiles = fs.readdirSync(quizFolderPath).filter(file =>
        file.startsWith('clean_') && file.endsWith('_questions.json')
      );

      for (const questionFile of questionFiles) {
        const filePath = path.join(quizFolderPath, questionFile);
        let questionsData;
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          questionsData = JSON.parse(fileContent);
        } catch (parseError) {
          console.error(`Error parsing JSON from ${questionFile} for quiz ${quizTag}:`, parseError.message);
          continue; 
        }
        
        if (!Array.isArray(questionsData)) {
          console.warn(`Invalid format: ${questionFile} for quiz ${quizTag} does not contain an array. Skipping.`);
          continue;
        }
        if (questionsData.length === 0) {
          // console.log(`No questions found in ${questionFile} for quiz ${quizTag}. Skipping.`);
          continue;
        }
        
        console.log(`Found ${questionsData.length} questions in ${questionFile}.`);

        if (questionFile === 'clean_single_selection_questions.json') {
          await migrateSingleSelectionQuestions(questionsData, quizTag);
        } else if (questionFile === 'clean_multi_questions.json') {
          await migrateMultiChoiceQuestions(questionsData, quizTag);
        } else if (questionFile === 'clean_drag_and_drop_questions.json') {
          await migrateDragAndDropQuestions(questionsData, quizTag);
        } else if (questionFile === 'clean_order_questions.json') {
          await migrateOrderQuestions(questionsData, quizTag);
        } else if (questionFile === 'clean_dropdown_selection_questions.json') {
          await migrateDropdownSelectionQuestions(questionsData, quizTag);
        } else if (questionFile === 'clean_yes_no_questions.json') {
          await migrateYesNoQuestions(questionsData, quizTag);
        } else if (questionFile === 'clean_yesno_multi_questions.json') {
          await migrateYesNoMultiQuestions(questionsData, quizTag);
        } else {
          console.log(`Unknown question file type: ${questionFile}. Skipping.`);
        }
      }
    }
    console.log('\nQuiz questions migration process completed.');
  } catch (error) {
    console.error('Error during quiz questions migration process:', error);
  }
}

async function main() {
  await migrateQuizMetadata();
  await migrateQuizQuestions();
}

main().catch(e => {
  console.error("Unhandled error in main execution:", e);
  process.exit(1);
});
