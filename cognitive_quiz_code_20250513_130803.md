# Cognitive Quiz Codebase

Generated on: 2025-05-13 13:08:03

## Project Structure

```
.cursor/rules/code-style.mdc
.cursor/rules/key-conventions.mdc
.cursor/rules/naming-conventions.mdc
.cursor/rules/performance-optimization.mdc
.cursor/rules/project-structure.mdc
.cursor/rules/syntax-formatting.mdc
.cursor/rules/typescript-usage.mdc
.cursor/rules/ui-styling.mdc
.env
.env.example
.env.local
.eslintrc.json
app/api/auth/callback/route.ts
app/api/lead/route.ts
app/api/questions/route.ts
app/api/quiz/[quizId]/route.ts
app/api/stripe/create-checkout/route.ts
app/api/stripe/create-portal/route.ts
app/api/webhook/mailgun/route.ts
app/api/webhook/stripe/route.ts
app/blog/[articleId]/page.tsx
app/blog/_assets/components/Avatar.tsx
app/blog/_assets/components/BadgeCategory.tsx
app/blog/_assets/components/CardArticle.tsx
app/blog/_assets/components/CardCategory.tsx
app/blog/_assets/components/HeaderBlog.tsx
app/blog/_assets/content.tsx
app/blog/author/[authorId]/page.tsx
app/blog/category/[categoryId]/page.tsx
app/blog/layout.tsx
app/blog/page.tsx
app/components/QuizCTA.tsx
app/dashboard/layout.tsx
app/dashboard/page.tsx
app/data/quizzes/azure-a102/sample_multi_question.json
app/debug-components/page.tsx
app/error.tsx
app/features/quiz/components/FeedbackSection.tsx
app/features/quiz/components/QuestionCard.tsx
app/features/quiz/components/QuestionContent.tsx
app/features/quiz/components/QuestionHeader.tsx
app/features/quiz/components/QuizCompletionSummary.tsx
app/features/quiz/components/QuizNavigation.tsx
app/features/quiz/components/QuizProgress.tsx
app/features/quiz/components/question-types/DragAndDropQuestionComponent.tsx
app/features/quiz/components/question-types/MultiChoiceComponent.tsx
app/features/quiz/components/question-types/QuestionTypeRenderer.tsx
app/features/quiz/components/question-types/SingleSelectionComponent.tsx
app/features/quiz/context/QuizContext.tsx
app/features/quiz/hooks/useQuizScoring.ts
app/features/quiz/hooks/useQuizState.ts
app/features/quiz/index.ts
app/features/quiz/pages/QuizPage.tsx
app/features/quiz/pages/QuizPage.tsx.new
app/features/quiz/services/quizApiClient.ts
app/features/quiz/services/quizService.ts
app/globals.css
app/layout.tsx
app/lib/supabaseQuizService.ts
app/not-found.tsx
app/page.tsx
app/privacy-policy/page.tsx
app/question-types-demo/[type]/page.tsx
app/question-types-demo/type-client-page.tsx
app/question-types/page.tsx
app/quiz-test/[quizId]/[questionType]/page.tsx
app/quiz-test/[quizId]/client-page.tsx
app/quiz-test/[quizId]/page-fixed.tsx
app/quiz-test/[quizId]/page-new.tsx
app/quiz-test/[quizId]/page-server.tsx
app/quiz-test/[quizId]/page-updated.tsx
app/quiz-test/[quizId]/page.tsx
app/quiz-test/[quizId]/page.tsx.bak
app/quiz-test/[quizId]/questions/[type]/page.tsx
app/quiz-test/[quizId]/questions/page.tsx
app/quiz-test/[quizId]/type-client-page.tsx
app/quiz-type-filters/layout.tsx
app/quiz-type-filters/page.tsx
app/signin/layout.tsx
app/signin/page.tsx
app/tos/page.tsx
app/types/quiz.ts
collect_code_for_llm.py
components/BetterIcon.tsx
components/ButtonAccount.tsx
components/ButtonCheckout.tsx
components/ButtonGradient.tsx
components/ButtonLead.tsx
components/ButtonPopover.tsx
components/ButtonSignin.tsx
components/ButtonSupport.tsx
components/CTA.tsx
components/FAQ.tsx
components/FeaturesAccordion.tsx
components/FeaturesGrid.tsx
components/FeaturesListicle.tsx
components/Footer.tsx
components/Header.tsx
components/Hero.tsx
components/LayoutClient.tsx
components/Modal.tsx
components/Pricing.tsx
components/Problem.tsx
components/Testimonial1Small.tsx
components/TestimonialRating.tsx
components/Testimonials1.tsx
components/Testimonials11.tsx
components/Testimonials3.tsx
components/TestimonialsAvatars.tsx
components/WithWithout.tsx
config.ts
libs/api.ts
libs/gpt.ts
libs/mailgun.ts
libs/seo.tsx
libs/stripe.ts
middleware.js
migrate-quiz-data.js
next-env.d.ts
next-sitemap.config.js
next.config.js
package-lock.json
package.json
postcss.config.js
supabase_database.sql
tailwind.config.js
tsconfig.json
types/config.ts
types/index.ts
types/next-auth.d.ts
```

## File Contents

### migrate-quiz-data.js

```javascript
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
```

### tailwind.config.js

```javascript
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/globals.css",
  ],
  theme: {
    extend: {
      colors: {
        'custom-primary': '#0078D7',
        'custom-accent': '#FF4081',
        'custom-success': '#00C853',
        'custom-error': '#FF3D00',
        'custom-dark-blue': '#1A2151',
        'custom-light-bg': '#F5F8FA',
        'custom-gray-1': '#333333',
        'custom-gray-2': '#757575',
        'custom-gray-3': '#BDBDBD',
      },
      backgroundImage: {
        gradient:
          "linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)",
        'primary-gradient': 'linear-gradient(135deg, #0078D7, #00BCF2)',
        'accent-gradient': 'linear-gradient(135deg, #FF4081, #F06292)',
        'success-gradient': 'linear-gradient(135deg, #00C853, #69F0AE)',
        'error-gradient': 'linear-gradient(135deg, #FF3D00, #FF8A65)',
      },
      boxShadow: {
        'shadow-1': '0 4px 6px rgba(0,0,0,0.1)',
        'shadow-2': '0 6px 16px rgba(0,0,0,0.1)',
        'shadow-strong': '0 10px 25px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'rounded-sm-ref': '8px',
        'rounded-md-ref': '12px',
        'rounded-lg-ref': '20px',
      },
      animation: {
        opacity: "opacity 0.25s ease-in-out",
        appearFromRight: "appearFromRight 300ms ease-in-out",
        wiggle: "wiggle 1.5s ease-in-out infinite",
        popup: "popup 0.25s ease-in-out",
        shimmer: "shimmer 3s ease-out infinite alternate",
        'fade-in': 'fadeIn 0.8s ease-out',
        'card-appear': 'cardAppear 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
      },
      keyframes: {
        opacity: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        appearFromRight: {
          "0%": { opacity: 0.3, transform: "translate(15%, 0px);" },
          "100%": { opacity: 1, transform: "translate(0);" },
        },
        wiggle: {
          "0%, 20%, 80%, 100%": { transform: "rotate(0deg)" },
          "30%, 60%": { transform: "rotate(-2deg)" },
          "40%, 70%": { transform: "rotate(2deg)" },
          "45%": { transform: "rotate(-4deg)" },
          "55%": { transform: "rotate(4deg)" },
        },
        popup: {
          "0%": { transform: "scale(0.8)", opacity: 0.8 },
          "50%": { transform: "scale(1.1)", opacity: 1 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "0 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        fadeIn: {
          'from': { opacity: 0, transform: 'translateY(-10px)' },
          'to': { opacity: 1, transform: 'translateY(0)' },
        },
        cardAppear: {
          'from': { opacity: 0, transform: 'translateY(20px) rotateX(5deg)' },
          'to': { opacity: 1, transform: 'translateY(0) rotateX(0)' },
        },
        fadeInUp: {
          'from': { opacity: 0, transform: 'translateY(10px)' },
          'to': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
  },
};

```

### .env.local

```local
SUPABASE_URL=https://rvwvnralrlsdtugtgict.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3ZucmFscmxzZHR1Z3RnaWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ0NzM0NCwiZXhwIjoyMDYxMDIzMzQ0fQ.hFRjn5zq24WmKEoCLbWDRUY6dUdEjlPS-c4OemCaFM4
NEXT_PUBLIC_SUPABASE_URL=https://rvwvnralrlsdtugtgict.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3ZucmFscmxzZHR1Z3RnaWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDczNDQsImV4cCI6MjA2MTAyMzM0NH0.6pBET5OCcZ8hfJrexg83vtXhmes9bnk7iFz3wCLHGWc


# -----------------------------------------------------------------------------
# Mailgun: https://shipfa.st/docs/features/emails
# -----------------------------------------------------------------------------
EMAIL_SERVER=
MAILGUN_API_KEY=



# -----------------------------------------------------------------------------
# Stripe: https://shipfa.st/docs/features/payments
# -----------------------------------------------------------------------------
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### supabase_database.sql

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------------
-- No changes needed unless new types are required
CREATE TYPE question_type AS ENUM (
  'drag_and_drop',
  'dropdown_selection',
  'multi',
  'single_selection',
  'order',
  'yes_no',
  'yesno_multi'
);
CREATE TYPE difficulty AS ENUM ('easy','medium','hard');

-- ------------------------------------------------------------------
-- Utility Function for Timestamps
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------
-- QUIZ-LEVEL METADATA
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id           TEXT        PRIMARY KEY,          -- e.g. azure-a102
  title        TEXT        NOT NULL,
  description  TEXT,
  quiz_type    TEXT,
  settings     JSONB,
  author       TEXT,
  difficulty   difficulty  NOT NULL DEFAULT 'medium',
  quiz_topic   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic      ON public.quizzes (quiz_topic);
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON public.quizzes (difficulty);

-- Add trigger for updated_at on quizzes
DROP TRIGGER IF EXISTS set_timestamp_quizzes ON public.quizzes;
CREATE TRIGGER set_timestamp_quizzes
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------
-- QUESTIONS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  type               question_type NOT NULL,
  question           TEXT          NOT NULL,
  points             INTEGER       NOT NULL CHECK (points >= 0),
  quiz_tag           TEXT          NOT NULL,
  difficulty         difficulty    NOT NULL DEFAULT 'medium',
  explanation        TEXT,
  feedback_correct   TEXT          NOT NULL,
  feedback_incorrect TEXT          NOT NULL,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT fk_questions_quiz
    FOREIGN KEY (quiz_tag)
    REFERENCES public.quizzes(id)
    ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_questions_type       ON public.questions (type);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_tag   ON public.questions (quiz_tag);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions (difficulty);

-- Add trigger for updated_at on questions
DROP TRIGGER IF EXISTS set_timestamp_questions ON public.questions;
CREATE TRIGGER set_timestamp_questions
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------
-- drag_and_drop
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drag_and_drop_targets (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  target_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, target_id)
);

-- *** Refined: Removed target_id and is_correct ***
CREATE TABLE IF NOT EXISTS public.drag_and_drop_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.drag_and_drop_correct_pairs (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id, target_id),
  FOREIGN KEY (question_id, option_id)
    REFERENCES public.drag_and_drop_options(question_id, option_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id, target_id)
    REFERENCES public.drag_and_drop_targets(question_id, target_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- dropdown_selection
-- ------------------------------------------------------------------
-- *** Reverted: Kept is_correct as quizApi.ts relies on it ***
CREATE TABLE IF NOT EXISTS public.dropdown_selection_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL, -- Kept for quizApi logic
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.dropdown_selection_targets (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  key         TEXT NOT NULL, -- Placeholder key in the question text e.g., 'city'
  value       TEXT NOT NULL, -- The TEXT value of the correct option for this key
  PRIMARY KEY (question_id, key)
);

-- ------------------------------------------------------------------
-- multi (multi-select) - Structure is good
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.multi_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.multi_correct_answers (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id),
  FOREIGN KEY (question_id, option_id)
    REFERENCES public.multi_options(question_id, option_id) ON DELETE CASCADE -- Added ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- single_selection - Structure is good
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.single_selection_options (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS public.single_selection_correct_answer (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE PRIMARY KEY,
  option_id   TEXT NOT NULL,
  FOREIGN KEY (question_id, option_id)
    REFERENCES public.single_selection_options(question_id, option_id) ON DELETE CASCADE -- Added ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- order
-- ------------------------------------------------------------------
-- *** Refined: Removed position ***
CREATE TABLE IF NOT EXISTS public.order_items (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.order_correct_order (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  position    INTEGER NOT NULL CHECK (position > 0),
  PRIMARY KEY (question_id, item_id), -- Ensures each item has only one position
  UNIQUE (question_id, position),      -- Ensures each position is used only once per question
  FOREIGN KEY (question_id, item_id)
    REFERENCES public.order_items(question_id, item_id) ON DELETE CASCADE -- Added ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- yes_no - Structure is good
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yes_no_answer (
  question_id    UUID REFERENCES public.questions(id) ON DELETE CASCADE PRIMARY KEY,
  correct_answer BOOLEAN NOT NULL
);

-- ------------------------------------------------------------------
-- yesno_multi - Structure is good
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yesno_multi_statements (
  question_id  UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  statement_id TEXT NOT NULL,
  text         TEXT NOT NULL,
  PRIMARY KEY (question_id, statement_id)
);

CREATE TABLE IF NOT EXISTS public.yesno_multi_correct_answers (
  question_id    UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  statement_id   TEXT NOT NULL,
  correct_answer BOOLEAN NOT NULL,
  PRIMARY KEY (question_id, statement_id),
  FOREIGN KEY (question_id, statement_id)
    REFERENCES public.yesno_multi_statements(question_id, statement_id) ON DELETE CASCADE -- Added ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- Permissions
-- ------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;
```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // NextJS <Image> component needs to whitelist domains for src={}
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
    ],
  },
};

module.exports = nextConfig;

```

### next-sitemap.config.js

```javascript
module.exports = {
  // REQUIRED: add your own domain name here (e.g. https://shipfa.st),
  siteUrl: process.env.SITE_URL || "https://shipfa.st",
  generateRobotsTxt: true,
  // use this to exclude routes from the sitemap (i.e. a user dashboard). By default, NextJS app router metadata files are excluded (https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
  exclude: ["/twitter-image.*", "/opengraph-image.*", "/icon.*"],
};

```

### collect_code_for_llm.py

```python
#!/usr/bin/env python3
"""
A simple script to collect all code files from a project, including JSON files
by default. Only excludes Markdown (.md) files.
Can limit quiz JSON files to only 3 questions per quiz type.

Usage:
  python3 collect_code_for_llm.py
  python3 collect_code_for_llm.py --output-dir=./output
  python3 collect_code_for_llm.py --exclude large-data.json another-file.json
  python3 collect_code_for_llm.py --limit-quiz-questions 3
"""

import os
import json
import datetime
from pathlib import Path
import argparse
import sys


def is_quiz_file(filepath, content):
    """Determines if a JSON file is a quiz file by checking for specific structures."""
    try:
        data = json.loads(content)
        # Check for quiz structure pattern
        if 'quiz' in data and 'questions' in data['quiz']:
            return True
        # Check for questions array pattern (from separated quiz files)
        if 'questions' in data and isinstance(data['questions'], list):
            return True
        return False
    except (json.JSONDecodeError, TypeError):
        return False

def limit_quiz_questions(content, max_questions=3):
    """Limits the number of questions in a quiz file to max_questions."""
    try:
        data = json.loads(content)
        
        # Handle quiz structure
        if 'quiz' in data and 'questions' in data['quiz']:
            if len(data['quiz']['questions']) > max_questions:
                data['quiz']['questions'] = data['quiz']['questions'][:max_questions]
        
        # Handle questions array structure (from separated quiz files)
        elif 'questions' in data and isinstance(data['questions'], list):
            if len(data['questions']) > max_questions:
                data['questions'] = data['questions'][:max_questions]
        
        return json.dumps(data, indent=2)
    except (json.JSONDecodeError, TypeError):
        # If there's an error, return the original content
        return content

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Collect code files for LLM analysis.')
    parser.add_argument('--output-dir', default='.', help='Directory to save output files')
    parser.add_argument('--exclude', nargs='+', default=[], 
                      help='JSON files to exclude (all other JSON files will be included)')
    parser.add_argument('--root-dir', default='.', help='Root directory of the project')
    parser.add_argument('--limit-quiz-questions', type=int, default=0,
                      help='Limit the number of questions in quiz files (0 = no limit)')
    args = parser.parse_args()

    # Normalize paths
    root_dir = Path(args.root_dir).absolute()
    output_dir = Path(args.output_dir).absolute()
    output_dir.mkdir(exist_ok=True)

    # Generate timestamp for output files
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    json_outfile = output_dir / f"cognitive_quiz_code_{timestamp}.json"
    md_outfile = output_dir / f"cognitive_quiz_code_{timestamp}.md"
    
    print(f"Project root: {root_dir}")
    print(f"Output directory: {output_dir}")
    print(f"JSON files to exclude: {', '.join(args.exclude)}")
    if args.limit_quiz_questions > 0:
        print(f"Limiting quiz files to {args.limit_quiz_questions} questions per quiz type")
    
    # Collection stats
    stats = {
        'total_files': 0,
        'included_files': 0,
        'json_excluded': 0,
        'markdown_excluded': 0,
        'binary_excluded': 0,
        'ignored_dirs_excluded': 0,
        'other_excluded': 0,
        'quiz_files_limited': 0
    }
    
    collected_files = []
    errors = []
    
    # Directories to ignore
    ignore_dirs = ['.git', 'node_modules', '.next', 'dist', 'build']
    
    # Extensions to treat as binary
    binary_extensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.svg',
        '.mp4', '.webm', '.mp3', '.ogg', '.wav',
        '.pdf', '.docx', '.xlsx', '.pptx',
        '.zip', '.tar', '.gz', '.7z',
        '.ttf', '.woff', '.woff2', '.eot'
    ]
    
    # Walk through the directory tree
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Skip ignored directories
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
        
        for filename in filenames:
            stats['total_files'] += 1
            filepath = Path(dirpath) / filename
            rel_path = filepath.relative_to(root_dir)
            rel_path_str = str(rel_path).replace(os.sep, '/')
            
            # Skip files in ignored directories
            if any(ignore_dir in str(filepath) for ignore_dir in ignore_dirs):
                stats['ignored_dirs_excluded'] += 1
                continue
                
            # Handle JSON files
            if filepath.suffix.lower() == '.json':
                # Skip JSON files if they're in the exclude list
                if any(exclude_file in filepath.name for exclude_file in args.exclude):
                    print(f"Excluding JSON file: {rel_path_str}")
                    stats['json_excluded'] += 1
                    continue
            
            # Handle Markdown files - exclude all .md files
            if filepath.suffix.lower() == '.md':
                print(f"Excluding Markdown file: {rel_path_str}")
                stats['markdown_excluded'] += 1
                continue
            
            # Skip binary files
            if filepath.suffix.lower() in binary_extensions:
                print(f"Skipping binary file: {rel_path_str}")
                stats['binary_excluded'] += 1
                continue
                
            # Read the file
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Limit quiz JSON files if requested
                if args.limit_quiz_questions > 0 and filepath.suffix.lower() == '.json':
                    if is_quiz_file(filepath, content):
                        original_content = content
                        content = limit_quiz_questions(content, args.limit_quiz_questions)
                        if content != original_content:
                            stats['quiz_files_limited'] += 1
                            print(f"Limited quiz questions in: {rel_path_str}")
                    
                collected_files.append({
                    'filepath': rel_path_str,
                    'content': content
                })
                
                stats['included_files'] += 1
                print(f"Collected: {rel_path_str}")
                
            except UnicodeDecodeError:
                # Skip binary files that weren't caught by extension
                print(f"Skipping binary file (decode error): {rel_path_str}")
                stats['binary_excluded'] += 1
            except Exception as e:
                error_msg = f"Error reading {rel_path_str}: {e}"
                print(f"Error: {error_msg}")
                errors.append(error_msg)
    
    # Calculate other excluded files
    stats['other_excluded'] = (stats['total_files'] - stats['included_files'] - 
                              stats['json_excluded'] - stats['markdown_excluded'] -
                              stats['binary_excluded'] - stats['ignored_dirs_excluded'])
    
    # Create project structure
    structure = sorted([f['filepath'] for f in collected_files])
    
    # Create output JSON
    output = {
        'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'project_structure': structure,
        'files': collected_files
    }
    
    # Write JSON output
    with open(json_outfile, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2)
    
    # Write Markdown output
    with open(md_outfile, 'w', encoding='utf-8') as f:
        # Write header
        f.write(f"# Cognitive Quiz Codebase\n\n")
        f.write(f"Generated on: {output['date']}\n\n")
        
        # Write project structure
        f.write("## Project Structure\n\n```\n")
        for path in structure:
            f.write(f"{path}\n")
        f.write("```\n\n")
        
        # Write file contents
        f.write("## File Contents\n\n")
        for file_data in collected_files:
            f.write(f"### {file_data['filepath']}\n\n")
            extension = os.path.splitext(file_data['filepath'])[1][1:] or 'text'
            
            # Map file extensions to markdown code block language identifiers
            extension_map = {
                'js': 'javascript',
                'jsx': 'jsx',
                'ts': 'typescript',
                'tsx': 'tsx',
                'py': 'python',
                'css': 'css',
                'scss': 'scss',
                'html': 'html',
                'md': 'markdown',
                'json': 'json',
                'yaml': 'yaml',
                'yml': 'yaml',
                'sh': 'bash',
                'bash': 'bash',
                'zsh': 'bash'
            }
            
            lang = extension_map.get(extension.lower(), extension)
            f.write(f"```{lang}\n{file_data['content']}\n```\n\n")
    
    # Print summary
    print("\nCollection complete:")
    print(f"- Total files scanned: {stats['total_files']}")
    print(f"- Files included: {stats['included_files']}")
    print(f"- JSON files excluded: {stats['json_excluded']}")
    print(f"- Markdown files excluded: {stats['markdown_excluded']}")
    print(f"- Binary files excluded: {stats['binary_excluded']}")
    print(f"- Files in ignored directories: {stats['ignored_dirs_excluded']}")
    print(f"- Other files excluded: {stats['other_excluded']}")
    if args.limit_quiz_questions > 0:
        print(f"- Quiz files limited to {args.limit_quiz_questions} questions: {stats['quiz_files_limited']}")
    
    print(f"\nOutput files created:")
    print(f"- JSON: {json_outfile}")
    print(f"- Markdown: {md_outfile}")

if __name__ == "__main__":
    main()
```

### next-env.d.ts

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

### package-lock.json

```json
{
  "name": "ship-fast-code",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "ship-fast-code",
      "version": "0.1.0",
      "dependencies": {
        "@headlessui/react": "^1.7.18",
        "@mdx-js/loader": "^2.3.0",
        "@mdx-js/react": "^2.3.0",
        "@next/mdx": "^13.5.6",
        "@supabase/auth-helpers-nextjs": "^0.8.7",
        "@supabase/supabase-js": "^2.41.1",
        "axios": "^1.6.8",
        "crisp-sdk-web": "^1.0.22",
        "eslint": "8.47.0",
        "eslint-config-next": "13.4.19",
        "form-data": "^4.0.0",
        "framer-motion": "^12.10.1",
        "mailgun.js": "^9.4.1",
        "next": "^15.3.2",
        "next-plausible": "^3.12.0",
        "next-sitemap": "^4.2.3",
        "nextjs-toploader": "^1.6.11",
        "nodemailer": "^6.9.13",
        "react": "18.2.0",
        "react-dom": "18.2.0",
        "react-hot-toast": "^2.4.1",
        "react-syntax-highlighter": "^15.5.0",
        "react-tooltip": "^5.26.3",
        "stripe": "^13.11.0",
        "zod": "^3.22.4"
      },
      "devDependencies": {
        "@types/jest": "^29.5.12",
        "@types/mdx": "^2.0.12",
        "@types/mongoose": "^5.11.97",
        "@types/node": "^20.12.2",
        "@types/react": "^18.2.73",
        "@types/react-dom": "^18.2.23",
        "@types/react-syntax-highlighter": "^15.5.11",
        "autoprefixer": "^10.4.19",
        "daisyui": "^4.10.1",
        "postcss": "^8.4.38",
        "tailwindcss": "^3.4.3",
        "typescript": "^5.4.3"
      }
    },
    "node_modules/@aashutoshrathi/word-wrap": {
      "version": "1.2.6",
      "resolved": "https://registry.npmjs.org/@aashutoshrathi/word-wrap/-/word-wrap-1.2.6.tgz",
      "integrity": "sha512-1Yjs2SvM8TflER/OD3cOjhWWOZb58A2t7wpE2S9XfBYTiIl+XFhQG2bjy4Pu1I+EAlCNUzRDYDdFwFYUKvXcIA==",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/@alloc/quick-lru": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.2.0.tgz",
      "integrity": "sha512-UrcABB+4bUrFABwbluTIBErXwvbsU/V7TZWfmbgJfbkwiBuziS9gxdODUyuiecfdGQ85jglMW6juS3+z5TsKLw==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.24.2",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.24.2.tgz",
      "integrity": "sha512-y5+tLQyV8pg3fsiln67BVLD1P13Eg4lh5RW9mF0zUuvLrv9uIQ4MCL+CRT+FTsBlBjcIan6PGsLcBN0m3ClUyQ==",
      "dev": true,
      "dependencies": {
        "@babel/highlight": "^7.24.2",
        "picocolors": "^1.0.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.22.20",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.22.20.tgz",
      "integrity": "sha512-Y4OZ+ytlatR8AI+8KZfKuL5urKp7qey08ha31L8b3BwewJAoJamTzyvxPR/5D+KkdJCGPq/+8TukHBlY10FX9A==",
      "dev": true,
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/highlight": {
      "version": "7.24.2",
      "resolved": "https://registry.npmjs.org/@babel/highlight/-/highlight-7.24.2.tgz",
      "integrity": "sha512-Yac1ao4flkTxTteCDZLEvdxg2fZfz1v8M4QpaGypq/WPDqg3ijHYbDfs+LG5hvzSoqaSZ9/Z9lKSP3CjZjv+pA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.22.20",
        "chalk": "^2.4.2",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.0.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/highlight/node_modules/ansi-styles": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-3.2.1.tgz",
      "integrity": "sha512-VT0ZI6kZRdTh8YyJw3SMbYm/u+NqfsAxEpWO0Pf9sq8/e94WxxOpPKx9FR1FlyCtOVDNOQ+8ntlqFxiRc+r5qA==",
      "dev": true,
      "dependencies": {
        "color-convert": "^1.9.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/@babel/highlight/node_modules/chalk": {
      "version": "2.4.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-2.4.2.tgz",
      "integrity": "sha512-Mti+f9lpJNcwF4tWV8/OrTTtF1gZi+f8FqlyAdouralcFWFQWF2+NgCHShjkCb+IFBLq9buZwE1xckQU4peSuQ==",
      "dev": true,
      "dependencies": {
        "ansi-styles": "^3.2.1",
        "escape-string-regexp": "^1.0.5",
        "supports-color": "^5.3.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/@babel/highlight/node_modules/color-convert": {
      "version": "1.9.3",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-1.9.3.tgz",
      "integrity": "sha512-QfAUtd+vFdAtFQcC8CCyYt1fYWxSqAiK2cSD6zDB8N3cpsEBAvRxp9zOGg6G/SHHJYAT88/az/IuDGALsNVbGg==",
      "dev": true,
      "dependencies": {
        "color-name": "1.1.3"
      }
    },
    "node_modules/@babel/highlight/node_modules/color-name": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.3.tgz",
      "integrity": "sha512-72fSenhMw2HZMTVHeCA9KCmpEIbzWiQsjN+BHcBbS9vr1mtt+vJjPdksIBNUmKAW8TFUDPJK5SUU3QhE9NEXDw==",
      "dev": true
    },
    "node_modules/@babel/highlight/node_modules/escape-string-regexp": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
      "integrity": "sha512-vbRorB5FUQWvla16U8R/qgaFIya2qGzwDrNmCZuYKrbdSUMG6I1ZCGQRefkRVhuOkIGVne7BQ35DSfo1qvJqFg==",
      "dev": true,
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/@babel/highlight/node_modules/has-flag": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-3.0.0.tgz",
      "integrity": "sha512-sKJf1+ceQBr4SMkvQnBDNDtf4TXpVhVGateu0t918bl30FnbE2m4vNLX+VWe/dpjlb+HugGYzW7uQXH98HPEYw==",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/@babel/highlight/node_modules/supports-color": {
      "version": "5.5.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-5.5.0.tgz",
      "integrity": "sha512-QjVjwdXIt408MIiAqCX4oUKsgU2EqAGzs2Ppkm4aQYbjm+ZEWEcW4SfFNTr4uMNZma0ey4f5lgLrkB0aX0QMow==",
      "dev": true,
      "dependencies": {
        "has-flag": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/@babel/runtime": {
      "version": "7.24.1",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.24.1.tgz",
      "integrity": "sha512-+BIznRzyqBf+2wCTxcKE3wDjfGeCoVE61KSHGpkzqrLi8qxqFwBeUFyId2cxkTmm55fzDGnm0+yCxaxygrLUnQ==",
      "dependencies": {
        "regenerator-runtime": "^0.14.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@corex/deepmerge": {
      "version": "4.0.43",
      "resolved": "https://registry.npmjs.org/@corex/deepmerge/-/deepmerge-4.0.43.tgz",
      "integrity": "sha512-N8uEMrMPL0cu/bdboEWpQYb/0i2K5Qn8eCsxzOmxSggJbbQte7ljMRoXm917AbntqTGOzdTu+vP3KOOzoC70HQ=="
    },
    "node_modules/@emnapi/runtime": {
      "version": "1.4.3",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.4.3.tgz",
      "integrity": "sha512-pBPWdu6MLKROBX05wSNKcNb++m5Er+KQ9QkB+WVM+pW2Kx9hoSrVTnu3BdkI5eBLZoKu/J6mW/B6i6bJB2ytXQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@eslint-community/eslint-utils": {
      "version": "4.4.0",
      "resolved": "https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.4.0.tgz",
      "integrity": "sha512-1/sA4dwrzBAyeUoQ6oxahHKmrZvsnLCg4RfxW3ZFGGmQkSNQPFNLV9CUEFQP1x9EYXHTo5p6xdhZM1Ne9p/AfA==",
      "dependencies": {
        "eslint-visitor-keys": "^3.3.0"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "peerDependencies": {
        "eslint": "^6.0.0 || ^7.0.0 || >=8.0.0"
      }
    },
    "node_modules/@eslint-community/regexpp": {
      "version": "4.10.0",
      "resolved": "https://registry.npmjs.org/@eslint-community/regexpp/-/regexpp-4.10.0.tgz",
      "integrity": "sha512-Cu96Sd2By9mCNTx2iyKOmq10v22jUVQv0lQnlGNy16oE9589yE+QADPbrMGCkA51cKZSg3Pu/aTJVTGfL/qjUA==",
      "engines": {
        "node": "^12.0.0 || ^14.0.0 || >=16.0.0"
      }
    },
    "node_modules/@eslint/eslintrc": {
      "version": "2.1.4",
      "resolved": "https://registry.npmjs.org/@eslint/eslintrc/-/eslintrc-2.1.4.tgz",
      "integrity": "sha512-269Z39MS6wVJtsoUl10L60WdkhJVdPG24Q4eZTH3nnF6lpvSShEK3wQjDX9JRWAUPvPh7COouPpU9IrqaZFvtQ==",
      "dependencies": {
        "ajv": "^6.12.4",
        "debug": "^4.3.2",
        "espree": "^9.6.0",
        "globals": "^13.19.0",
        "ignore": "^5.2.0",
        "import-fresh": "^3.2.1",
        "js-yaml": "^4.1.0",
        "minimatch": "^3.1.2",
        "strip-json-comments": "^3.1.1"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@eslint/js": {
      "version": "8.57.0",
      "resolved": "https://registry.npmjs.org/@eslint/js/-/js-8.57.0.tgz",
      "integrity": "sha512-Ys+3g2TaW7gADOJzPt83SJtCDhMjndcDMFVQ/Tj9iA1BfJzFKD9mAUXT3OenpuPHbI6P/myECxRJrofUsDx/5g==",
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      }
    },
    "node_modules/@floating-ui/core": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/@floating-ui/core/-/core-1.6.0.tgz",
      "integrity": "sha512-PcF++MykgmTj3CIyOQbKA/hDzOAiqI3mhuoN44WRCopIs1sgoDoU4oty4Jtqaj/y3oDU6fnVSm4QG0a3t5i0+g==",
      "dependencies": {
        "@floating-ui/utils": "^0.2.1"
      }
    },
    "node_modules/@floating-ui/dom": {
      "version": "1.6.3",
      "resolved": "https://registry.npmjs.org/@floating-ui/dom/-/dom-1.6.3.tgz",
      "integrity": "sha512-RnDthu3mzPlQ31Ss/BTwQ1zjzIhr3lk1gZB1OC56h/1vEtaXkESrOqL5fQVMfXpwGtRwX+YsZBdyHtJMQnkArw==",
      "dependencies": {
        "@floating-ui/core": "^1.0.0",
        "@floating-ui/utils": "^0.2.0"
      }
    },
    "node_modules/@floating-ui/utils": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/@floating-ui/utils/-/utils-0.2.1.tgz",
      "integrity": "sha512-9TANp6GPoMtYzQdt54kfAyMmz1+osLlXdg2ENroU7zzrtflTLrrC/lgrIfaSe+Wu0b89GKccT7vxXA0MoAIO+Q=="
    },
    "node_modules/@headlessui/react": {
      "version": "1.7.18",
      "resolved": "https://registry.npmjs.org/@headlessui/react/-/react-1.7.18.tgz",
      "integrity": "sha512-4i5DOrzwN4qSgNsL4Si61VMkUcWbcSKueUV7sFhpHzQcSShdlHENE5+QBntMSRvHt8NyoFO2AGG8si9lq+w4zQ==",
      "dependencies": {
        "@tanstack/react-virtual": "^3.0.0-beta.60",
        "client-only": "^0.0.1"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "react": "^16 || ^17 || ^18",
        "react-dom": "^16 || ^17 || ^18"
      }
    },
    "node_modules/@humanwhocodes/config-array": {
      "version": "0.11.14",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/config-array/-/config-array-0.11.14.tgz",
      "integrity": "sha512-3T8LkOmg45BV5FICb15QQMsyUSWrQ8AygVfC7ZG32zOalnqrilm018ZVCw0eapXux8FtA33q8PSRSstjee3jSg==",
      "dependencies": {
        "@humanwhocodes/object-schema": "^2.0.2",
        "debug": "^4.3.1",
        "minimatch": "^3.0.5"
      },
      "engines": {
        "node": ">=10.10.0"
      }
    },
    "node_modules/@humanwhocodes/module-importer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz",
      "integrity": "sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==",
      "engines": {
        "node": ">=12.22"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@humanwhocodes/object-schema": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/object-schema/-/object-schema-2.0.2.tgz",
      "integrity": "sha512-6EwiSjwWYP7pTckG6I5eyFANjPhmPjUX9JRLUSfNPC7FX7zK9gyZAfUEaECL6ALTpGX5AjnBq3C9XmVWPitNpw=="
    },
    "node_modules/@img/sharp-darwin-arm64": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-darwin-arm64/-/sharp-darwin-arm64-0.34.1.tgz",
      "integrity": "sha512-pn44xgBtgpEbZsu+lWf2KNb6OAf70X68k+yk69Ic2Xz11zHR/w24/U49XT7AeRwJ0Px+mhALhU5LPci1Aymk7A==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-darwin-arm64": "1.1.0"
      }
    },
    "node_modules/@img/sharp-darwin-x64": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-darwin-x64/-/sharp-darwin-x64-0.34.1.tgz",
      "integrity": "sha512-VfuYgG2r8BpYiOUN+BfYeFo69nP/MIwAtSJ7/Zpxc5QF3KS22z8Pvg3FkrSFJBPNQ7mmcUcYQFBmEQp7eu1F8Q==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-darwin-x64": "1.1.0"
      }
    },
    "node_modules/@img/sharp-libvips-darwin-arm64": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-darwin-arm64/-/sharp-libvips-darwin-arm64-1.1.0.tgz",
      "integrity": "sha512-HZ/JUmPwrJSoM4DIQPv/BfNh9yrOA8tlBbqbLz4JZ5uew2+o22Ik+tHQJcih7QJuSa0zo5coHTfD5J8inqj9DA==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "darwin"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-darwin-x64": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-darwin-x64/-/sharp-libvips-darwin-x64-1.1.0.tgz",
      "integrity": "sha512-Xzc2ToEmHN+hfvsl9wja0RlnXEgpKNmftriQp6XzY/RaSfwD9th+MSh0WQKzUreLKKINb3afirxW7A0fz2YWuQ==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "darwin"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-arm": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-arm/-/sharp-libvips-linux-arm-1.1.0.tgz",
      "integrity": "sha512-s8BAd0lwUIvYCJyRdFqvsj+BJIpDBSxs6ivrOPm/R7piTs5UIwY5OjXrP2bqXC9/moGsyRa37eYWYCOGVXxVrA==",
      "cpu": [
        "arm"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-arm64": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-arm64/-/sharp-libvips-linux-arm64-1.1.0.tgz",
      "integrity": "sha512-IVfGJa7gjChDET1dK9SekxFFdflarnUB8PwW8aGwEoF3oAsSDuNUTYS+SKDOyOJxQyDC1aPFMuRYLoDInyV9Ew==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-ppc64": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-ppc64/-/sharp-libvips-linux-ppc64-1.1.0.tgz",
      "integrity": "sha512-tiXxFZFbhnkWE2LA8oQj7KYR+bWBkiV2nilRldT7bqoEZ4HiDOcePr9wVDAZPi/Id5fT1oY9iGnDq20cwUz8lQ==",
      "cpu": [
        "ppc64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-s390x": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-s390x/-/sharp-libvips-linux-s390x-1.1.0.tgz",
      "integrity": "sha512-xukSwvhguw7COyzvmjydRb3x/09+21HykyapcZchiCUkTThEQEOMtBj9UhkaBRLuBrgLFzQ2wbxdeCCJW/jgJA==",
      "cpu": [
        "s390x"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-x64": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-x64/-/sharp-libvips-linux-x64-1.1.0.tgz",
      "integrity": "sha512-yRj2+reB8iMg9W5sULM3S74jVS7zqSzHG3Ol/twnAAkAhnGQnpjj6e4ayUz7V+FpKypwgs82xbRdYtchTTUB+Q==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linuxmusl-arm64": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linuxmusl-arm64/-/sharp-libvips-linuxmusl-arm64-1.1.0.tgz",
      "integrity": "sha512-jYZdG+whg0MDK+q2COKbYidaqW/WTz0cc1E+tMAusiDygrM4ypmSCjOJPmFTvHHJ8j/6cAGyeDWZOsK06tP33w==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linuxmusl-x64": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linuxmusl-x64/-/sharp-libvips-linuxmusl-x64-1.1.0.tgz",
      "integrity": "sha512-wK7SBdwrAiycjXdkPnGCPLjYb9lD4l6Ze2gSdAGVZrEL05AOUJESWU2lhlC+Ffn5/G+VKuSm6zzbQSzFX/P65A==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-linux-arm": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-arm/-/sharp-linux-arm-0.34.1.tgz",
      "integrity": "sha512-anKiszvACti2sGy9CirTlNyk7BjjZPiML1jt2ZkTdcvpLU1YH6CXwRAZCA2UmRXnhiIftXQ7+Oh62Ji25W72jA==",
      "cpu": [
        "arm"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-arm": "1.1.0"
      }
    },
    "node_modules/@img/sharp-linux-arm64": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-arm64/-/sharp-linux-arm64-0.34.1.tgz",
      "integrity": "sha512-kX2c+vbvaXC6vly1RDf/IWNXxrlxLNpBVWkdpRq5Ka7OOKj6nr66etKy2IENf6FtOgklkg9ZdGpEu9kwdlcwOQ==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-arm64": "1.1.0"
      }
    },
    "node_modules/@img/sharp-linux-s390x": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-s390x/-/sharp-linux-s390x-0.34.1.tgz",
      "integrity": "sha512-7s0KX2tI9mZI2buRipKIw2X1ufdTeaRgwmRabt5bi9chYfhur+/C1OXg3TKg/eag1W+6CCWLVmSauV1owmRPxA==",
      "cpu": [
        "s390x"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-s390x": "1.1.0"
      }
    },
    "node_modules/@img/sharp-linux-x64": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-x64/-/sharp-linux-x64-0.34.1.tgz",
      "integrity": "sha512-wExv7SH9nmoBW3Wr2gvQopX1k8q2g5V5Iag8Zk6AVENsjwd+3adjwxtp3Dcu2QhOXr8W9NusBU6XcQUohBZ5MA==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-x64": "1.1.0"
      }
    },
    "node_modules/@img/sharp-linuxmusl-arm64": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-linuxmusl-arm64/-/sharp-linuxmusl-arm64-0.34.1.tgz",
      "integrity": "sha512-DfvyxzHxw4WGdPiTF0SOHnm11Xv4aQexvqhRDAoD00MzHekAj9a/jADXeXYCDFH/DzYruwHbXU7uz+H+nWmSOQ==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linuxmusl-arm64": "1.1.0"
      }
    },
    "node_modules/@img/sharp-linuxmusl-x64": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-linuxmusl-x64/-/sharp-linuxmusl-x64-0.34.1.tgz",
      "integrity": "sha512-pax/kTR407vNb9qaSIiWVnQplPcGU8LRIJpDT5o8PdAx5aAA7AS3X9PS8Isw1/WfqgQorPotjrZL3Pqh6C5EBg==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linuxmusl-x64": "1.1.0"
      }
    },
    "node_modules/@img/sharp-wasm32": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-wasm32/-/sharp-wasm32-0.34.1.tgz",
      "integrity": "sha512-YDybQnYrLQfEpzGOQe7OKcyLUCML4YOXl428gOOzBgN6Gw0rv8dpsJ7PqTHxBnXnwXr8S1mYFSLSa727tpz0xg==",
      "cpu": [
        "wasm32"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later AND MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/runtime": "^1.4.0"
      },
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-ia32": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-ia32/-/sharp-win32-ia32-0.34.1.tgz",
      "integrity": "sha512-WKf/NAZITnonBf3U1LfdjoMgNO5JYRSlhovhRhMxXVdvWYveM4kM3L8m35onYIdh75cOMCo1BexgVQcCDzyoWw==",
      "cpu": [
        "ia32"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-x64": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-x64/-/sharp-win32-x64-0.34.1.tgz",
      "integrity": "sha512-hw1iIAHpNE8q3uMIRCgGOeDoz9KtFNarFLQclLxr/LK1VBkj8nby18RjFvr6aP7USRYAjTZW6yisnBWMX571Tw==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@isaacs/cliui": {
      "version": "8.0.2",
      "resolved": "https://registry.npmjs.org/@isaacs/cliui/-/cliui-8.0.2.tgz",
      "integrity": "sha512-O8jcjabXaleOG9DQ0+ARXWZBTfnP4WNAqzuiJK7ll44AmxGKv/J2M4TPjxjY3znBCfvBXFzucm1twdyFybFqEA==",
      "dev": true,
      "dependencies": {
        "string-width": "^5.1.2",
        "string-width-cjs": "npm:string-width@^4.2.0",
        "strip-ansi": "^7.0.1",
        "strip-ansi-cjs": "npm:strip-ansi@^6.0.1",
        "wrap-ansi": "^8.1.0",
        "wrap-ansi-cjs": "npm:wrap-ansi@^7.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@isaacs/cliui/node_modules/ansi-regex": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.0.1.tgz",
      "integrity": "sha512-n5M855fKb2SsfMIiFFoVrABHJC8QtHwVx+mHWP3QcEqBHYienj5dHSgjbxtC0WEZXYt4wcD6zrQElDPhFuZgfA==",
      "dev": true,
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/@isaacs/cliui/node_modules/strip-ansi": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.1.0.tgz",
      "integrity": "sha512-iq6eVVI64nQQTRYq2KtEg2d2uU7LElhTJwsH4YzIHZshxlgZms/wIc4VoDQTlG/IvVIrBKG06CrZnp0qv7hkcQ==",
      "dev": true,
      "dependencies": {
        "ansi-regex": "^6.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
      }
    },
    "node_modules/@jest/expect-utils": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/expect-utils/-/expect-utils-29.7.0.tgz",
      "integrity": "sha512-GlsNBWiFQFCVi9QVSx7f5AgMeLxe9YCCs5PuP2O2LdjDAA8Jh9eX7lA1Jq/xdXw3Wb3hyvlFNfZIfcRetSzYcA==",
      "dev": true,
      "dependencies": {
        "jest-get-type": "^29.6.3"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/schemas": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/@jest/schemas/-/schemas-29.6.3.tgz",
      "integrity": "sha512-mo5j5X+jIZmJQveBKeS/clAueipV7KgiX1vMgCxam1RNYiqE1w62n0/tJJnHtjW8ZHcQco5gY85jA3mi0L+nSA==",
      "dev": true,
      "dependencies": {
        "@sinclair/typebox": "^0.27.8"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/types": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/@jest/types/-/types-29.6.3.tgz",
      "integrity": "sha512-u3UPsIilWKOM3F9CXtrG8LEJmNxwoCQC/XVj4IKYXvvpx7QIi/Kg1LI5uDmDpKlac62NUtX7eLjRh+jVZcLOzw==",
      "dev": true,
      "dependencies": {
        "@jest/schemas": "^29.6.3",
        "@types/istanbul-lib-coverage": "^2.0.0",
        "@types/istanbul-reports": "^3.0.0",
        "@types/node": "*",
        "@types/yargs": "^17.0.8",
        "chalk": "^4.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.5.tgz",
      "integrity": "sha512-IzL8ZoEDIBRWEzlCcRhOaCupYyN5gdIK+Q6fbFdPDg6HqX6jpkItn7DFIpW9LQzXG6Df9sA7+OKnq0qlz/GaQg==",
      "dependencies": {
        "@jridgewell/set-array": "^1.2.1",
        "@jridgewell/sourcemap-codec": "^1.4.10",
        "@jridgewell/trace-mapping": "^0.3.24"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/set-array": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@jridgewell/set-array/-/set-array-1.2.1.tgz",
      "integrity": "sha512-R8gLRTZeyp03ymzP/6Lil/28tGeGEzhx1q2k703KGWRAI1VdvPIXdG70VJc2pAMw3NA6JKL5hhFu1sJX0Mnn/A==",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/source-map": {
      "version": "0.3.6",
      "resolved": "https://registry.npmjs.org/@jridgewell/source-map/-/source-map-0.3.6.tgz",
      "integrity": "sha512-1ZJTZebgqllO79ue2bm3rIGud/bOe0pP5BjSRCRxxYkEZS8STV7zN84UBbiYu7jy+eCKSnVIUgoWWE/tt+shMQ==",
      "peer": true,
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.25"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.4.15",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.4.15.tgz",
      "integrity": "sha512-eF2rxCRulEKXHTRiDrDy6erMYWqNw4LPdQ8UQA4huuxaQsVeRPFl2oM8oDGxMFhJUWZf9McpLtJasDDZb/Bpeg=="
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.25",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.25.tgz",
      "integrity": "sha512-vNk6aEwybGtawWmy/PzwnGDOjCkLWSD2wqvjGGAgOAwCGWySYXfYoxt00IJkTF+8Lb57DwOb3Aa0o9CApepiYQ==",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@mdx-js/loader": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/@mdx-js/loader/-/loader-2.3.0.tgz",
      "integrity": "sha512-IqsscXh7Q3Rzb+f5DXYk0HU71PK+WuFsEhf+mSV3fOhpLcEpgsHvTQ2h0T6TlZ5gHOaBeFjkXwB52by7ypMyNg==",
      "dependencies": {
        "@mdx-js/mdx": "^2.0.0",
        "source-map": "^0.7.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      },
      "peerDependencies": {
        "webpack": ">=4"
      }
    },
    "node_modules/@mdx-js/mdx": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/@mdx-js/mdx/-/mdx-2.3.0.tgz",
      "integrity": "sha512-jLuwRlz8DQfQNiUCJR50Y09CGPq3fLtmtUQfVrj79E0JWu3dvsVcxVIcfhR5h0iXu+/z++zDrYeiJqifRynJkA==",
      "dependencies": {
        "@types/estree-jsx": "^1.0.0",
        "@types/mdx": "^2.0.0",
        "estree-util-build-jsx": "^2.0.0",
        "estree-util-is-identifier-name": "^2.0.0",
        "estree-util-to-js": "^1.1.0",
        "estree-walker": "^3.0.0",
        "hast-util-to-estree": "^2.0.0",
        "markdown-extensions": "^1.0.0",
        "periscopic": "^3.0.0",
        "remark-mdx": "^2.0.0",
        "remark-parse": "^10.0.0",
        "remark-rehype": "^10.0.0",
        "unified": "^10.0.0",
        "unist-util-position-from-estree": "^1.0.0",
        "unist-util-stringify-position": "^3.0.0",
        "unist-util-visit": "^4.0.0",
        "vfile": "^5.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/@mdx-js/react": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/@mdx-js/react/-/react-2.3.0.tgz",
      "integrity": "sha512-zQH//gdOmuu7nt2oJR29vFhDv88oGPmVw6BggmrHeMI+xgEkp1B2dX9/bMBSYtK0dyLX/aOmesKS09g222K1/g==",
      "dependencies": {
        "@types/mdx": "^2.0.0",
        "@types/react": ">=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      },
      "peerDependencies": {
        "react": ">=16"
      }
    },
    "node_modules/@mongodb-js/saslprep": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/@mongodb-js/saslprep/-/saslprep-1.1.5.tgz",
      "integrity": "sha512-XLNOMH66KhJzUJNwT/qlMnS4WsNDWD5ASdyaSH3EtK+F4r/CFGa3jT4GNi4mfOitGvWXtdLgQJkQjxSVrio+jA==",
      "dev": true,
      "dependencies": {
        "sparse-bitfield": "^3.0.3"
      }
    },
    "node_modules/@next/env": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/@next/env/-/env-15.3.2.tgz",
      "integrity": "sha512-xURk++7P7qR9JG1jJtLzPzf0qEvqCN0A/T3DXf8IPMKo9/6FfjxtEffRJIIew/bIL4T3C2jLLqBor8B/zVlx6g==",
      "license": "MIT"
    },
    "node_modules/@next/eslint-plugin-next": {
      "version": "13.4.19",
      "resolved": "https://registry.npmjs.org/@next/eslint-plugin-next/-/eslint-plugin-next-13.4.19.tgz",
      "integrity": "sha512-N/O+zGb6wZQdwu6atMZHbR7T9Np5SUFUjZqCbj0sXm+MwQO35M8TazVB4otm87GkXYs2l6OPwARd3/PUWhZBVQ==",
      "dependencies": {
        "glob": "7.1.7"
      }
    },
    "node_modules/@next/mdx": {
      "version": "13.5.6",
      "resolved": "https://registry.npmjs.org/@next/mdx/-/mdx-13.5.6.tgz",
      "integrity": "sha512-2AMyCrz1SxSWNUpADyLz3RbPbq0GHrchbO7Msvg7IsH8MrTw3VYaZSI1KNa6JzZIoykwtNVSEL+uBmPZi106Jw==",
      "dependencies": {
        "source-map": "^0.7.0"
      },
      "peerDependencies": {
        "@mdx-js/loader": ">=0.15.0",
        "@mdx-js/react": ">=0.15.0"
      },
      "peerDependenciesMeta": {
        "@mdx-js/loader": {
          "optional": true
        },
        "@mdx-js/react": {
          "optional": true
        }
      }
    },
    "node_modules/@next/swc-darwin-arm64": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-arm64/-/swc-darwin-arm64-15.3.2.tgz",
      "integrity": "sha512-2DR6kY/OGcokbnCsjHpNeQblqCZ85/1j6njYSkzRdpLn5At7OkSdmk7WyAmB9G0k25+VgqVZ/u356OSoQZ3z0g==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-darwin-x64": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-x64/-/swc-darwin-x64-15.3.2.tgz",
      "integrity": "sha512-ro/fdqaZWL6k1S/5CLv1I0DaZfDVJkWNaUU3un8Lg6m0YENWlDulmIWzV96Iou2wEYyEsZq51mwV8+XQXqMp3w==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-gnu": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-gnu/-/swc-linux-arm64-gnu-15.3.2.tgz",
      "integrity": "sha512-covwwtZYhlbRWK2HlYX9835qXum4xYZ3E2Mra1mdQ+0ICGoMiw1+nVAn4d9Bo7R3JqSmK1grMq/va+0cdh7bJA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-musl": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-musl/-/swc-linux-arm64-musl-15.3.2.tgz",
      "integrity": "sha512-KQkMEillvlW5Qk5mtGA/3Yz0/tzpNlSw6/3/ttsV1lNtMuOHcGii3zVeXZyi4EJmmLDKYcTcByV2wVsOhDt/zg==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-gnu": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-gnu/-/swc-linux-x64-gnu-15.3.2.tgz",
      "integrity": "sha512-uRBo6THWei0chz+Y5j37qzx+BtoDRFIkDzZjlpCItBRXyMPIg079eIkOCl3aqr2tkxL4HFyJ4GHDes7W8HuAUg==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-musl": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-musl/-/swc-linux-x64-musl-15.3.2.tgz",
      "integrity": "sha512-+uxFlPuCNx/T9PdMClOqeE8USKzj8tVz37KflT3Kdbx/LOlZBRI2yxuIcmx1mPNK8DwSOMNCr4ureSet7eyC0w==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-arm64-msvc": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-arm64-msvc/-/swc-win32-arm64-msvc-15.3.2.tgz",
      "integrity": "sha512-LLTKmaI5cfD8dVzh5Vt7+OMo+AIOClEdIU/TSKbXXT2iScUTSxOGoBhfuv+FU8R9MLmrkIL1e2fBMkEEjYAtPQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-x64-msvc": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-x64-msvc/-/swc-win32-x64-msvc-15.3.2.tgz",
      "integrity": "sha512-aW5B8wOPioJ4mBdMDXkt5f3j8pUr9W8AnlX0Df35uRWNT1Y6RIybxjnSUe+PhM+M1bwgyY8PHLmXZC6zT1o5tA==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@nodelib/fs.scandir": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
      "integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==",
      "dependencies": {
        "@nodelib/fs.stat": "2.0.5",
        "run-parallel": "^1.1.9"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.stat": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz",
      "integrity": "sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.walk": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz",
      "integrity": "sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==",
      "dependencies": {
        "@nodelib/fs.scandir": "2.1.5",
        "fastq": "^1.6.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@pkgjs/parseargs": {
      "version": "0.11.0",
      "resolved": "https://registry.npmjs.org/@pkgjs/parseargs/-/parseargs-0.11.0.tgz",
      "integrity": "sha512-+1VkjdD0QBLPodGrJUeqarH8VAIvQODIbwh9XpP5Syisf7YoQgsJKPNFoqqLQlu+VQ/tVSshMR6loPMn8U+dPg==",
      "dev": true,
      "optional": true,
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@rushstack/eslint-patch": {
      "version": "1.10.1",
      "resolved": "https://registry.npmjs.org/@rushstack/eslint-patch/-/eslint-patch-1.10.1.tgz",
      "integrity": "sha512-S3Kq8e7LqxkA9s7HKLqXGTGck1uwis5vAXan3FnU5yw1Ec5hsSGnq4s/UCaSqABPOnOTg7zASLyst7+ohgWexg=="
    },
    "node_modules/@sinclair/typebox": {
      "version": "0.27.8",
      "resolved": "https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.27.8.tgz",
      "integrity": "sha512-+Fj43pSMwJs4KRrH/938Uf+uAELIgVBmQzg/q1YG10djyfA3TnrU8N8XzqCh/okZdszqBQTZf96idMfE5lnwTA==",
      "dev": true
    },
    "node_modules/@supabase/auth-helpers-nextjs": {
      "version": "0.8.7",
      "resolved": "https://registry.npmjs.org/@supabase/auth-helpers-nextjs/-/auth-helpers-nextjs-0.8.7.tgz",
      "integrity": "sha512-iYdOjFo0GkRvha340l8JdCiBiyXQuG9v8jnq7qMJ/2fakrskRgHTCOt7ryWbip1T6BExcWKC8SoJrhCzPOxhhg==",
      "dependencies": {
        "@supabase/auth-helpers-shared": "0.6.3",
        "set-cookie-parser": "^2.6.0"
      },
      "peerDependencies": {
        "@supabase/supabase-js": "^2.19.0"
      }
    },
    "node_modules/@supabase/auth-helpers-shared": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/@supabase/auth-helpers-shared/-/auth-helpers-shared-0.6.3.tgz",
      "integrity": "sha512-xYQRLFeFkL4ZfwC7p9VKcarshj3FB2QJMgJPydvOY7J5czJe6xSG5/wM1z63RmAzGbCkKg+dzpq61oeSyWiGBQ==",
      "dependencies": {
        "jose": "^4.14.4"
      },
      "peerDependencies": {
        "@supabase/supabase-js": "^2.19.0"
      }
    },
    "node_modules/@supabase/auth-js": {
      "version": "2.63.0",
      "resolved": "https://registry.npmjs.org/@supabase/auth-js/-/auth-js-2.63.0.tgz",
      "integrity": "sha512-yIgcHnlgv24GxHtVGUhwGqAFDyJkPIC/xjx7HostN08A8yCy8HIfl4JEkTKyBqD1v1L05jNEJOUke4Lf4O1+Qg==",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14"
      }
    },
    "node_modules/@supabase/functions-js": {
      "version": "2.2.2",
      "resolved": "https://registry.npmjs.org/@supabase/functions-js/-/functions-js-2.2.2.tgz",
      "integrity": "sha512-sJGq1nludmi7pY/fdtCpyY/pYonx7MfHdN408bqb736guWcVI1AChYVbI4kUM978EuOE4Ci6l7bUudfGg07QRw==",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14"
      }
    },
    "node_modules/@supabase/node-fetch": {
      "version": "2.6.15",
      "resolved": "https://registry.npmjs.org/@supabase/node-fetch/-/node-fetch-2.6.15.tgz",
      "integrity": "sha512-1ibVeYUacxWYi9i0cf5efil6adJ9WRyZBLivgjs+AUpewx1F3xPi7gLgaASI2SmIQxPoCEjAsLAzKPgMJVgOUQ==",
      "dependencies": {
        "whatwg-url": "^5.0.0"
      },
      "engines": {
        "node": "4.x || >=6.0.0"
      }
    },
    "node_modules/@supabase/postgrest-js": {
      "version": "1.9.2",
      "resolved": "https://registry.npmjs.org/@supabase/postgrest-js/-/postgrest-js-1.9.2.tgz",
      "integrity": "sha512-I6yHo8CC9cxhOo6DouDMy9uOfW7hjdsnCxZiaJuIVZm1dBGTFiQPgfMa9zXCamEWzNyWRjZvupAUuX+tqcl5Sw==",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14"
      }
    },
    "node_modules/@supabase/realtime-js": {
      "version": "2.9.3",
      "resolved": "https://registry.npmjs.org/@supabase/realtime-js/-/realtime-js-2.9.3.tgz",
      "integrity": "sha512-lAp50s2n3FhGJFq+wTSXLNIDPw5Y0Wxrgt44eM5nLSA3jZNUUP3Oq2Ccd1CbZdVntPCWLZvJaU//pAd2NE+QnQ==",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14",
        "@types/phoenix": "^1.5.4",
        "@types/ws": "^8.5.10",
        "ws": "^8.14.2"
      }
    },
    "node_modules/@supabase/storage-js": {
      "version": "2.5.5",
      "resolved": "https://registry.npmjs.org/@supabase/storage-js/-/storage-js-2.5.5.tgz",
      "integrity": "sha512-OpLoDRjFwClwc2cjTJZG8XviTiQH4Ik8sCiMK5v7et0MDu2QlXjCAW3ljxJB5+z/KazdMOTnySi+hysxWUPu3w==",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14"
      }
    },
    "node_modules/@supabase/supabase-js": {
      "version": "2.41.1",
      "resolved": "https://registry.npmjs.org/@supabase/supabase-js/-/supabase-js-2.41.1.tgz",
      "integrity": "sha512-xmECLhYugMo/6SObpsOhu5xaxVfsk+JK/d4JSh055bpESmgmN3PLpzbfqejKCpaUeeUNF21+lrJp/U9HQzT9mA==",
      "dependencies": {
        "@supabase/auth-js": "2.63.0",
        "@supabase/functions-js": "2.2.2",
        "@supabase/node-fetch": "2.6.15",
        "@supabase/postgrest-js": "1.9.2",
        "@supabase/realtime-js": "2.9.3",
        "@supabase/storage-js": "2.5.5"
      }
    },
    "node_modules/@swc/counter": {
      "version": "0.1.3",
      "resolved": "https://registry.npmjs.org/@swc/counter/-/counter-0.1.3.tgz",
      "integrity": "sha512-e2BR4lsJkkRlKZ/qCHPw9ZaSxc0MVUd7gtbtaB7aMvHeJVYe8sOB8DBZkP2DtISHGSku9sCK6T6cnY0CtXrOCQ==",
      "license": "Apache-2.0"
    },
    "node_modules/@swc/helpers": {
      "version": "0.5.15",
      "resolved": "https://registry.npmjs.org/@swc/helpers/-/helpers-0.5.15.tgz",
      "integrity": "sha512-JQ5TuMi45Owi4/BIMAJBoSQoOJu12oOk/gADqlcUL9JEdHB8vyjUSsxqeNXnmXHjYKMi2WcYtezGEEhqUI/E2g==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.8.0"
      }
    },
    "node_modules/@tanstack/react-virtual": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/@tanstack/react-virtual/-/react-virtual-3.2.0.tgz",
      "integrity": "sha512-OEdMByf2hEfDa6XDbGlZN8qO6bTjlNKqjM3im9JG+u3mCL8jALy0T/67oDI001raUUPh1Bdmfn4ZvPOV5knpcg==",
      "dependencies": {
        "@tanstack/virtual-core": "3.2.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      },
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0",
        "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0"
      }
    },
    "node_modules/@tanstack/virtual-core": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/@tanstack/virtual-core/-/virtual-core-3.2.0.tgz",
      "integrity": "sha512-P5XgYoAw/vfW65byBbJQCw+cagdXDT/qH6wmABiLt4v4YBT2q2vqCOhihe+D1Nt325F/S/0Tkv6C5z0Lv+VBQQ==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      }
    },
    "node_modules/@types/acorn": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/@types/acorn/-/acorn-4.0.6.tgz",
      "integrity": "sha512-veQTnWP+1D/xbxVrPC3zHnCZRjSrKfhbMUlEA43iMZLu7EsnTtkJklIuwrCPbOi8YkvDQAiW05VQQFvvz9oieQ==",
      "dependencies": {
        "@types/estree": "*"
      }
    },
    "node_modules/@types/debug": {
      "version": "4.1.12",
      "resolved": "https://registry.npmjs.org/@types/debug/-/debug-4.1.12.tgz",
      "integrity": "sha512-vIChWdVG3LG1SMxEvI/AK+FWJthlrqlTu7fbrlywTkkaONwk/UAGaULXRlf8vkzFBLVm0zkMdCquhL5aOjhXPQ==",
      "dependencies": {
        "@types/ms": "*"
      }
    },
    "node_modules/@types/eslint": {
      "version": "8.56.6",
      "resolved": "https://registry.npmjs.org/@types/eslint/-/eslint-8.56.6.tgz",
      "integrity": "sha512-ymwc+qb1XkjT/gfoQwxIeHZ6ixH23A+tCT2ADSA/DPVKzAjwYkTXBMCQ/f6fe4wEa85Lhp26VPeUxI7wMhAi7A==",
      "peer": true,
      "dependencies": {
        "@types/estree": "*",
        "@types/json-schema": "*"
      }
    },
    "node_modules/@types/eslint-scope": {
      "version": "3.7.7",
      "resolved": "https://registry.npmjs.org/@types/eslint-scope/-/eslint-scope-3.7.7.tgz",
      "integrity": "sha512-MzMFlSLBqNF2gcHWO0G1vP/YQyfvrxZ0bF+u7mzUdZ1/xK4A4sru+nraZz5i3iEIk1l1uyicaDVTB4QbbEkAYg==",
      "peer": true,
      "dependencies": {
        "@types/eslint": "*",
        "@types/estree": "*"
      }
    },
    "node_modules/@types/estree": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.5.tgz",
      "integrity": "sha512-/kYRxGDLWzHOB7q+wtSUQlFrtcdUccpfy+X+9iMBpHK8QLLhx2wIPYuS5DYtR9Wa/YlZAbIovy7qVdB1Aq6Lyw=="
    },
    "node_modules/@types/estree-jsx": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/@types/estree-jsx/-/estree-jsx-1.0.5.tgz",
      "integrity": "sha512-52CcUVNFyfb1A2ALocQw/Dd1BQFNmSdkuC3BkZ6iqhdMfQz7JWOFRuJFloOzjk+6WijU56m9oKXFAXc7o3Towg==",
      "dependencies": {
        "@types/estree": "*"
      }
    },
    "node_modules/@types/hast": {
      "version": "2.3.10",
      "resolved": "https://registry.npmjs.org/@types/hast/-/hast-2.3.10.tgz",
      "integrity": "sha512-McWspRw8xx8J9HurkVBfYj0xKoE25tOFlHGdx4MJ5xORQrMGZNqJhVQWaIbm6Oyla5kYOXtDiopzKRJzEOkwJw==",
      "dependencies": {
        "@types/unist": "^2"
      }
    },
    "node_modules/@types/istanbul-lib-coverage": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/@types/istanbul-lib-coverage/-/istanbul-lib-coverage-2.0.6.tgz",
      "integrity": "sha512-2QF/t/auWm0lsy8XtKVPG19v3sSOQlJe/YHZgfjb/KBBHOGSV+J2q/S671rcq9uTBrLAXmZpqJiaQbMT+zNU1w==",
      "dev": true
    },
    "node_modules/@types/istanbul-lib-report": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/@types/istanbul-lib-report/-/istanbul-lib-report-3.0.3.tgz",
      "integrity": "sha512-NQn7AHQnk/RSLOxrBbGyJM/aVQ+pjj5HCgasFxc0K/KhoATfQ/47AyUl15I2yBUpihjmas+a+VJBOqecrFH+uA==",
      "dev": true,
      "dependencies": {
        "@types/istanbul-lib-coverage": "*"
      }
    },
    "node_modules/@types/istanbul-reports": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/istanbul-reports/-/istanbul-reports-3.0.4.tgz",
      "integrity": "sha512-pk2B1NWalF9toCRu6gjBzR69syFjP4Od8WRAX+0mmf9lAjCRicLOWc+ZrxZHx/0XRjotgkF9t6iaMJ+aXcOdZQ==",
      "dev": true,
      "dependencies": {
        "@types/istanbul-lib-report": "*"
      }
    },
    "node_modules/@types/jest": {
      "version": "29.5.12",
      "resolved": "https://registry.npmjs.org/@types/jest/-/jest-29.5.12.tgz",
      "integrity": "sha512-eDC8bTvT/QhYdxJAulQikueigY5AsdBRH2yDKW3yveW7svY3+DzN84/2NUgkw10RTiJbWqZrTtoGVdYlvFJdLw==",
      "dev": true,
      "dependencies": {
        "expect": "^29.0.0",
        "pretty-format": "^29.0.0"
      }
    },
    "node_modules/@types/json-schema": {
      "version": "7.0.15",
      "resolved": "https://registry.npmjs.org/@types/json-schema/-/json-schema-7.0.15.tgz",
      "integrity": "sha512-5+fP8P8MFNC+AyZCDxrB2pkZFPGzqQWUzpSeuuVLvm8VMcorNYavBqoFcxK8bQz4Qsbn4oUEEem4wDLfcysGHA==",
      "peer": true
    },
    "node_modules/@types/json5": {
      "version": "0.0.29",
      "resolved": "https://registry.npmjs.org/@types/json5/-/json5-0.0.29.tgz",
      "integrity": "sha512-dRLjCWHYg4oaA77cxO64oO+7JwCwnIzkZPdrrC71jQmQtlhM556pwKo5bUzqvZndkVbeFLIIi+9TC40JNF5hNQ=="
    },
    "node_modules/@types/mdast": {
      "version": "3.0.15",
      "resolved": "https://registry.npmjs.org/@types/mdast/-/mdast-3.0.15.tgz",
      "integrity": "sha512-LnwD+mUEfxWMa1QpDraczIn6k0Ee3SMicuYSSzS6ZYl2gKS09EClnJYGd8Du6rfc5r/GZEk5o1mRb8TaTj03sQ==",
      "dependencies": {
        "@types/unist": "^2"
      }
    },
    "node_modules/@types/mdx": {
      "version": "2.0.12",
      "resolved": "https://registry.npmjs.org/@types/mdx/-/mdx-2.0.12.tgz",
      "integrity": "sha512-H9VZ9YqE+H28FQVchC83RCs5xQ2J7mAAv6qdDEaWmXEVl3OpdH+xfrSUzQ1lp7U7oSTRZ0RvW08ASPJsYBi7Cw=="
    },
    "node_modules/@types/mongoose": {
      "version": "5.11.97",
      "resolved": "https://registry.npmjs.org/@types/mongoose/-/mongoose-5.11.97.tgz",
      "integrity": "sha512-cqwOVYT3qXyLiGw7ueU2kX9noE8DPGRY6z8eUxudhXY8NZ7DMKYAxyZkLSevGfhCX3dO/AoX5/SO9lAzfjon0Q==",
      "deprecated": "Mongoose publishes its own types, so you do not need to install this package.",
      "dev": true,
      "dependencies": {
        "mongoose": "*"
      }
    },
    "node_modules/@types/ms": {
      "version": "0.7.34",
      "resolved": "https://registry.npmjs.org/@types/ms/-/ms-0.7.34.tgz",
      "integrity": "sha512-nG96G3Wp6acyAgJqGasjODb+acrI7KltPiRxzHPXnP3NgI28bpQDRv53olbqGXbfcgF5aiiHmO3xpwEpS5Ld9g=="
    },
    "node_modules/@types/node": {
      "version": "20.12.2",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-20.12.2.tgz",
      "integrity": "sha512-zQ0NYO87hyN6Xrclcqp7f8ZbXNbRfoGWNcMvHTPQp9UUrwI0mI7XBz+cu7/W6/VClYo2g63B0cjull/srU7LgQ==",
      "dependencies": {
        "undici-types": "~5.26.4"
      }
    },
    "node_modules/@types/nprogress": {
      "version": "0.2.3",
      "resolved": "https://registry.npmjs.org/@types/nprogress/-/nprogress-0.2.3.tgz",
      "integrity": "sha512-k7kRA033QNtC+gLc4VPlfnue58CM1iQLgn1IMAU8VPHGOj7oIHPp9UlhedEnD/Gl8evoCjwkZjlBORtZ3JByUA=="
    },
    "node_modules/@types/phoenix": {
      "version": "1.6.4",
      "resolved": "https://registry.npmjs.org/@types/phoenix/-/phoenix-1.6.4.tgz",
      "integrity": "sha512-B34A7uot1Cv0XtaHRYDATltAdKx0BvVKNgYNqE4WjtPUa4VQJM7kxeXcVKaH+KS+kCmZ+6w+QaUdcljiheiBJA=="
    },
    "node_modules/@types/prop-types": {
      "version": "15.7.12",
      "resolved": "https://registry.npmjs.org/@types/prop-types/-/prop-types-15.7.12.tgz",
      "integrity": "sha512-5zvhXYtRNRluoE/jAp4GVsSduVUzNWKkOZrCDBWYtE7biZywwdC2AcEzg+cSMLFRfVgeAFqpfNabiPjxFddV1Q=="
    },
    "node_modules/@types/react": {
      "version": "18.2.73",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-18.2.73.tgz",
      "integrity": "sha512-XcGdod0Jjv84HOC7N5ziY3x+qL0AfmubvKOZ9hJjJ2yd5EE+KYjWhdOjt387e9HPheHkdggF9atTifMRtyAaRA==",
      "dependencies": {
        "@types/prop-types": "*",
        "csstype": "^3.0.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "18.2.23",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-18.2.23.tgz",
      "integrity": "sha512-ZQ71wgGOTmDYpnav2knkjr3qXdAFu0vsk8Ci5w3pGAIdj7/kKAyn+VsQDhXsmzzzepAiI9leWMmubXz690AI/A==",
      "dev": true,
      "dependencies": {
        "@types/react": "*"
      }
    },
    "node_modules/@types/react-syntax-highlighter": {
      "version": "15.5.11",
      "resolved": "https://registry.npmjs.org/@types/react-syntax-highlighter/-/react-syntax-highlighter-15.5.11.tgz",
      "integrity": "sha512-ZqIJl+Pg8kD+47kxUjvrlElrraSUrYa4h0dauY/U/FTUuprSCqvUj+9PNQNQzVc6AJgIWUUxn87/gqsMHNbRjw==",
      "dev": true,
      "dependencies": {
        "@types/react": "*"
      }
    },
    "node_modules/@types/stack-utils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/@types/stack-utils/-/stack-utils-2.0.3.tgz",
      "integrity": "sha512-9aEbYZ3TbYMznPdcdr3SmIrLXwC/AKZXQeCf9Pgao5CKb8CyHuEX5jzWPTkvregvhRJHcpRO6BFoGW9ycaOkYw==",
      "dev": true
    },
    "node_modules/@types/unist": {
      "version": "2.0.10",
      "resolved": "https://registry.npmjs.org/@types/unist/-/unist-2.0.10.tgz",
      "integrity": "sha512-IfYcSBWE3hLpBg8+X2SEa8LVkJdJEkT2Ese2aaLs3ptGdVtABxndrMaxuFlQ1qdFf9Q5rDvDpxI3WwgvKFAsQA=="
    },
    "node_modules/@types/webidl-conversions": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/@types/webidl-conversions/-/webidl-conversions-7.0.3.tgz",
      "integrity": "sha512-CiJJvcRtIgzadHCYXw7dqEnMNRjhGZlYK05Mj9OyktqV8uVT8fD2BFOB7S1uwBE3Kj2Z+4UyPmFw/Ixgw/LAlA==",
      "dev": true
    },
    "node_modules/@types/whatwg-url": {
      "version": "11.0.4",
      "resolved": "https://registry.npmjs.org/@types/whatwg-url/-/whatwg-url-11.0.4.tgz",
      "integrity": "sha512-lXCmTWSHJvf0TRSO58nm978b8HJ/EdsSsEKLd3ODHFjo+3VGAyyTp4v50nWvwtzBxSMQrVOK7tcuN0zGPLICMw==",
      "dev": true,
      "dependencies": {
        "@types/webidl-conversions": "*"
      }
    },
    "node_modules/@types/ws": {
      "version": "8.5.10",
      "resolved": "https://registry.npmjs.org/@types/ws/-/ws-8.5.10.tgz",
      "integrity": "sha512-vmQSUcfalpIq0R9q7uTo2lXs6eGIpt9wtnLdMv9LVpIjCA/+ufZRozlVoVelIYixx1ugCBKDhn89vnsEGOCx9A==",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/yargs": {
      "version": "17.0.32",
      "resolved": "https://registry.npmjs.org/@types/yargs/-/yargs-17.0.32.tgz",
      "integrity": "sha512-xQ67Yc/laOG5uMfX/093MRlGGCIBzZMarVa+gfNKJxWAIgykYpVGkBdbqEzGDDfCrVUj6Hiff4mTZ5BA6TmAog==",
      "dev": true,
      "dependencies": {
        "@types/yargs-parser": "*"
      }
    },
    "node_modules/@types/yargs-parser": {
      "version": "21.0.3",
      "resolved": "https://registry.npmjs.org/@types/yargs-parser/-/yargs-parser-21.0.3.tgz",
      "integrity": "sha512-I4q9QU9MQv4oEOz4tAHJtNz1cwuLxn2F3xcc2iV5WdqLPpUnj30aUuxt1mAxYTG+oe8CZMV/+6rU4S4gRDzqtQ==",
      "dev": true
    },
    "node_modules/@typescript-eslint/parser": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/parser/-/parser-6.21.0.tgz",
      "integrity": "sha512-tbsV1jPne5CkFQCgPBcDOt30ItF7aJoZL997JSF7MhGQqOeT3svWRYxiqlfA5RUdlHN6Fi+EI9bxqbdyAUZjYQ==",
      "dependencies": {
        "@typescript-eslint/scope-manager": "6.21.0",
        "@typescript-eslint/types": "6.21.0",
        "@typescript-eslint/typescript-estree": "6.21.0",
        "@typescript-eslint/visitor-keys": "6.21.0",
        "debug": "^4.3.4"
      },
      "engines": {
        "node": "^16.0.0 || >=18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^7.0.0 || ^8.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@typescript-eslint/scope-manager": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/scope-manager/-/scope-manager-6.21.0.tgz",
      "integrity": "sha512-OwLUIWZJry80O99zvqXVEioyniJMa+d2GrqpUTqi5/v5D5rOrppJVBPa0yKCblcigC0/aYAzxxqQ1B+DS2RYsg==",
      "dependencies": {
        "@typescript-eslint/types": "6.21.0",
        "@typescript-eslint/visitor-keys": "6.21.0"
      },
      "engines": {
        "node": "^16.0.0 || >=18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/types": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/types/-/types-6.21.0.tgz",
      "integrity": "sha512-1kFmZ1rOm5epu9NZEZm1kckCDGj5UJEf7P1kliH4LKu/RkwpsfqqGmY2OOcUs18lSlQBKLDYBOGxRVtrMN5lpg==",
      "engines": {
        "node": "^16.0.0 || >=18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/typescript-estree/-/typescript-estree-6.21.0.tgz",
      "integrity": "sha512-6npJTkZcO+y2/kr+z0hc4HwNfrrP4kNYh57ek7yCNlrBjWQ1Y0OS7jiZTkgumrvkX5HkEKXFZkkdFNkaW2wmUQ==",
      "dependencies": {
        "@typescript-eslint/types": "6.21.0",
        "@typescript-eslint/visitor-keys": "6.21.0",
        "debug": "^4.3.4",
        "globby": "^11.1.0",
        "is-glob": "^4.0.3",
        "minimatch": "9.0.3",
        "semver": "^7.5.4",
        "ts-api-utils": "^1.0.1"
      },
      "engines": {
        "node": "^16.0.0 || >=18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.0.1.tgz",
      "integrity": "sha512-XnAIvQ8eM+kC6aULx6wuQiwVsnzsi9d3WxzV3FpWTGA19F621kwdbsAcFKXgKUHZWsy+mY6iL1sHTxWEFCytDA==",
      "dependencies": {
        "balanced-match": "^1.0.0"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch": {
      "version": "9.0.3",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-9.0.3.tgz",
      "integrity": "sha512-RHiac9mvaRw0x3AYRgDC1CxAP7HTcNrrECeA8YYJeWnpo+2Q5CegtZjaotWTWxDG3UeGA1coE05iH1mPjT/2mg==",
      "dependencies": {
        "brace-expansion": "^2.0.1"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/visitor-keys/-/visitor-keys-6.21.0.tgz",
      "integrity": "sha512-JJtkDduxLi9bivAB+cYOVMtbkqdPOhZ+ZI5LC47MIRrDV4Yn2o+ZnW10Nkmr28xRpSpdJ6Sm42Hjf2+REYXm0A==",
      "dependencies": {
        "@typescript-eslint/types": "6.21.0",
        "eslint-visitor-keys": "^3.4.1"
      },
      "engines": {
        "node": "^16.0.0 || >=18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@webassemblyjs/ast": {
      "version": "1.12.1",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/ast/-/ast-1.12.1.tgz",
      "integrity": "sha512-EKfMUOPRRUTy5UII4qJDGPpqfwjOmZ5jeGFwid9mnoqIFK+e0vqoi1qH56JpmZSzEL53jKnNzScdmftJyG5xWg==",
      "peer": true,
      "dependencies": {
        "@webassemblyjs/helper-numbers": "1.11.6",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.6"
      }
    },
    "node_modules/@webassemblyjs/floating-point-hex-parser": {
      "version": "1.11.6",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/floating-point-hex-parser/-/floating-point-hex-parser-1.11.6.tgz",
      "integrity": "sha512-ejAj9hfRJ2XMsNHk/v6Fu2dGS+i4UaXBXGemOfQ/JfQ6mdQg/WXtwleQRLLS4OvfDhv8rYnVwH27YJLMyYsxhw==",
      "peer": true
    },
    "node_modules/@webassemblyjs/helper-api-error": {
      "version": "1.11.6",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/helper-api-error/-/helper-api-error-1.11.6.tgz",
      "integrity": "sha512-o0YkoP4pVu4rN8aTJgAyj9hC2Sv5UlkzCHhxqWj8butaLvnpdc2jOwh4ewE6CX0txSfLn/UYaV/pheS2Txg//Q==",
      "peer": true
    },
    "node_modules/@webassemblyjs/helper-buffer": {
      "version": "1.12.1",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/helper-buffer/-/helper-buffer-1.12.1.tgz",
      "integrity": "sha512-nzJwQw99DNDKr9BVCOZcLuJJUlqkJh+kVzVl6Fmq/tI5ZtEyWT1KZMyOXltXLZJmDtvLCDgwsyrkohEtopTXCw==",
      "peer": true
    },
    "node_modules/@webassemblyjs/helper-numbers": {
      "version": "1.11.6",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/helper-numbers/-/helper-numbers-1.11.6.tgz",
      "integrity": "sha512-vUIhZ8LZoIWHBohiEObxVm6hwP034jwmc9kuq5GdHZH0wiLVLIPcMCdpJzG4C11cHoQ25TFIQj9kaVADVX7N3g==",
      "peer": true,
      "dependencies": {
        "@webassemblyjs/floating-point-hex-parser": "1.11.6",
        "@webassemblyjs/helper-api-error": "1.11.6",
        "@xtuc/long": "4.2.2"
      }
    },
    "node_modules/@webassemblyjs/helper-wasm-bytecode": {
      "version": "1.11.6",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/helper-wasm-bytecode/-/helper-wasm-bytecode-1.11.6.tgz",
      "integrity": "sha512-sFFHKwcmBprO9e7Icf0+gddyWYDViL8bpPjJJl0WHxCdETktXdmtWLGVzoHbqUcY4Be1LkNfwTmXOJUFZYSJdA==",
      "peer": true
    },
    "node_modules/@webassemblyjs/helper-wasm-section": {
      "version": "1.12.1",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/helper-wasm-section/-/helper-wasm-section-1.12.1.tgz",
      "integrity": "sha512-Jif4vfB6FJlUlSbgEMHUyk1j234GTNG9dBJ4XJdOySoj518Xj0oGsNi59cUQF4RRMS9ouBUxDDdyBVfPTypa5g==",
      "peer": true,
      "dependencies": {
        "@webassemblyjs/ast": "1.12.1",
        "@webassemblyjs/helper-buffer": "1.12.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.6",
        "@webassemblyjs/wasm-gen": "1.12.1"
      }
    },
    "node_modules/@webassemblyjs/ieee754": {
      "version": "1.11.6",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/ieee754/-/ieee754-1.11.6.tgz",
      "integrity": "sha512-LM4p2csPNvbij6U1f19v6WR56QZ8JcHg3QIJTlSwzFcmx6WSORicYj6I63f9yU1kEUtrpG+kjkiIAkevHpDXrg==",
      "peer": true,
      "dependencies": {
        "@xtuc/ieee754": "^1.2.0"
      }
    },
    "node_modules/@webassemblyjs/leb128": {
      "version": "1.11.6",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/leb128/-/leb128-1.11.6.tgz",
      "integrity": "sha512-m7a0FhE67DQXgouf1tbN5XQcdWoNgaAuoULHIfGFIEVKA6tu/edls6XnIlkmS6FrXAquJRPni3ZZKjw6FSPjPQ==",
      "peer": true,
      "dependencies": {
        "@xtuc/long": "4.2.2"
      }
    },
    "node_modules/@webassemblyjs/utf8": {
      "version": "1.11.6",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/utf8/-/utf8-1.11.6.tgz",
      "integrity": "sha512-vtXf2wTQ3+up9Zsg8sa2yWiQpzSsMyXj0qViVP6xKGCUT8p8YJ6HqI7l5eCnWx1T/FYdsv07HQs2wTFbbof/RA==",
      "peer": true
    },
    "node_modules/@webassemblyjs/wasm-edit": {
      "version": "1.12.1",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/wasm-edit/-/wasm-edit-1.12.1.tgz",
      "integrity": "sha512-1DuwbVvADvS5mGnXbE+c9NfA8QRcZ6iKquqjjmR10k6o+zzsRVesil54DKexiowcFCPdr/Q0qaMgB01+SQ1u6g==",
      "peer": true,
      "dependencies": {
        "@webassemblyjs/ast": "1.12.1",
        "@webassemblyjs/helper-buffer": "1.12.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.6",
        "@webassemblyjs/helper-wasm-section": "1.12.1",
        "@webassemblyjs/wasm-gen": "1.12.1",
        "@webassemblyjs/wasm-opt": "1.12.1",
        "@webassemblyjs/wasm-parser": "1.12.1",
        "@webassemblyjs/wast-printer": "1.12.1"
      }
    },
    "node_modules/@webassemblyjs/wasm-gen": {
      "version": "1.12.1",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/wasm-gen/-/wasm-gen-1.12.1.tgz",
      "integrity": "sha512-TDq4Ojh9fcohAw6OIMXqiIcTq5KUXTGRkVxbSo1hQnSy6lAM5GSdfwWeSxpAo0YzgsgF182E/U0mDNhuA0tW7w==",
      "peer": true,
      "dependencies": {
        "@webassemblyjs/ast": "1.12.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.6",
        "@webassemblyjs/ieee754": "1.11.6",
        "@webassemblyjs/leb128": "1.11.6",
        "@webassemblyjs/utf8": "1.11.6"
      }
    },
    "node_modules/@webassemblyjs/wasm-opt": {
      "version": "1.12.1",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/wasm-opt/-/wasm-opt-1.12.1.tgz",
      "integrity": "sha512-Jg99j/2gG2iaz3hijw857AVYekZe2SAskcqlWIZXjji5WStnOpVoat3gQfT/Q5tb2djnCjBtMocY/Su1GfxPBg==",
      "peer": true,
      "dependencies": {
        "@webassemblyjs/ast": "1.12.1",
        "@webassemblyjs/helper-buffer": "1.12.1",
        "@webassemblyjs/wasm-gen": "1.12.1",
        "@webassemblyjs/wasm-parser": "1.12.1"
      }
    },
    "node_modules/@webassemblyjs/wasm-parser": {
      "version": "1.12.1",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/wasm-parser/-/wasm-parser-1.12.1.tgz",
      "integrity": "sha512-xikIi7c2FHXysxXe3COrVUPSheuBtpcfhbpFj4gmu7KRLYOzANztwUU0IbsqvMqzuNK2+glRGWCEqZo1WCLyAQ==",
      "peer": true,
      "dependencies": {
        "@webassemblyjs/ast": "1.12.1",
        "@webassemblyjs/helper-api-error": "1.11.6",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.6",
        "@webassemblyjs/ieee754": "1.11.6",
        "@webassemblyjs/leb128": "1.11.6",
        "@webassemblyjs/utf8": "1.11.6"
      }
    },
    "node_modules/@webassemblyjs/wast-printer": {
      "version": "1.12.1",
      "resolved": "https://registry.npmjs.org/@webassemblyjs/wast-printer/-/wast-printer-1.12.1.tgz",
      "integrity": "sha512-+X4WAlOisVWQMikjbcvY2e0rwPsKQ9F688lksZhBcPycBBuii3O7m8FACbDMWDojpAqvjIncrG8J0XHKyQfVeA==",
      "peer": true,
      "dependencies": {
        "@webassemblyjs/ast": "1.12.1",
        "@xtuc/long": "4.2.2"
      }
    },
    "node_modules/@xtuc/ieee754": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@xtuc/ieee754/-/ieee754-1.2.0.tgz",
      "integrity": "sha512-DX8nKgqcGwsc0eJSqYt5lwP4DH5FlHnmuWWBRy7X0NcaGR0ZtuyeESgMwTYVEtxmsNGY+qit4QYT/MIYTOTPeA==",
      "peer": true
    },
    "node_modules/@xtuc/long": {
      "version": "4.2.2",
      "resolved": "https://registry.npmjs.org/@xtuc/long/-/long-4.2.2.tgz",
      "integrity": "sha512-NuHqBY1PB/D8xU6s/thBgOAiAP7HOYDQ32+BFZILJ8ivkUkAHQnWfn6WhL79Owj1qmUnoN/YPhktdIoucipkAQ==",
      "peer": true
    },
    "node_modules/acorn": {
      "version": "8.11.3",
      "resolved": "https://registry.npmjs.org/acorn/-/acorn-8.11.3.tgz",
      "integrity": "sha512-Y9rRfJG5jcKOE0CLisYbojUjIrIEE7AGMzA/Sm4BslANhbS+cDMpgBdcPT91oJ7OuJ9hYJBx59RjbhxVnrF8Xg==",
      "bin": {
        "acorn": "bin/acorn"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/acorn-import-assertions": {
      "version": "1.9.0",
      "resolved": "https://registry.npmjs.org/acorn-import-assertions/-/acorn-import-assertions-1.9.0.tgz",
      "integrity": "sha512-cmMwop9x+8KFhxvKrKfPYmN6/pKTYYHBqLa0DfvVZcKMJWNyWLnaqND7dx/qn66R7ewM1UX5XMaDVP5wlVTaVA==",
      "peer": true,
      "peerDependencies": {
        "acorn": "^8"
      }
    },
    "node_modules/acorn-jsx": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz",
      "integrity": "sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==",
      "peerDependencies": {
        "acorn": "^6.0.0 || ^7.0.0 || ^8.0.0"
      }
    },
    "node_modules/ajv": {
      "version": "6.12.6",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.12.6.tgz",
      "integrity": "sha512-j3fVLgvTo527anyYyJOGTYJbG+vnnQYvE0m5mmkc1TK+nxAppkCLMIL0aZ4dblVCNoGShhm+kzE4ZUykBoMg4g==",
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ajv-keywords": {
      "version": "3.5.2",
      "resolved": "https://registry.npmjs.org/ajv-keywords/-/ajv-keywords-3.5.2.tgz",
      "integrity": "sha512-5p6WTN0DdTGVQk6VjcEju19IgaHudalcfabD7yhDGeA6bcQnmL+CpveLJq/3hvfwd1aof6L386Ougkx6RfyMIQ==",
      "peer": true,
      "peerDependencies": {
        "ajv": "^6.9.1"
      }
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/any-promise": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/any-promise/-/any-promise-1.3.0.tgz",
      "integrity": "sha512-7UvmKalWRt1wgjL1RrGxoSJW/0QZFIegpeGvZG9kjp8vrRu55XTHbwnqq2GpXm9uLbcuhxm3IqX9OB4MZR1b2A==",
      "dev": true
    },
    "node_modules/anymatch": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/anymatch/-/anymatch-3.1.3.tgz",
      "integrity": "sha512-KMReFUr0B4t+D+OBkjR3KYqvocp2XaSzO55UcB6mgQMd3KbcE+mWTyvVV7D/zsdEbNnV6acZUutkiHQXvTr1Rw==",
      "dev": true,
      "dependencies": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/arg": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/arg/-/arg-5.0.2.tgz",
      "integrity": "sha512-PYjyFOLKQ9y57JvQ6QLo8dAgNqswh8M1RMJYdQduT6xbWSgK36P/Z/v+p888pM69jMMfS8Xd8F6I1kQ/I9HUGg==",
      "dev": true
    },
    "node_modules/argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q=="
    },
    "node_modules/aria-query": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/aria-query/-/aria-query-5.3.0.tgz",
      "integrity": "sha512-b0P0sZPKtyu8HkeRAfCq0IfURZK+SuwMjY1UXGBU27wpAiTwQAIlq56IbIO+ytk/JjS1fMR14ee5WBBfKi5J6A==",
      "dependencies": {
        "dequal": "^2.0.3"
      }
    },
    "node_modules/array-buffer-byte-length": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/array-buffer-byte-length/-/array-buffer-byte-length-1.0.1.tgz",
      "integrity": "sha512-ahC5W1xgou+KTXix4sAO8Ki12Q+jf4i0+tmk3sC+zgcynshkHxzpXdImBehiUYKKKDwvfFiJl1tZt6ewscS1Mg==",
      "dependencies": {
        "call-bind": "^1.0.5",
        "is-array-buffer": "^3.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array-includes": {
      "version": "3.1.8",
      "resolved": "https://registry.npmjs.org/array-includes/-/array-includes-3.1.8.tgz",
      "integrity": "sha512-itaWrbYbqpGXkGhZPGUulwnhVf5Hpy1xiCFsGqyIGglbBxmG5vSjxQen3/WGOjPpNEv1RtBLKxbmVXm8HpJStQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.4",
        "is-string": "^1.0.7"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array-union": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/array-union/-/array-union-2.1.0.tgz",
      "integrity": "sha512-HGyxoOTYUyCM6stUe6EJgnd4EoewAI7zMdfqO+kGjnlZmBDz/cR5pf8r/cR4Wq60sL/p0IkcjUEEPwS3GFrIyw==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/array.prototype.findlast": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/array.prototype.findlast/-/array.prototype.findlast-1.2.5.tgz",
      "integrity": "sha512-CVvd6FHg1Z3POpBLxO6E6zr+rSKEQ9L6rZHAaY7lLfhKsWYUBBOuMs0e9o24oopj6H+geRCX0YJ+TJLBK2eHyQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.findlastindex": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/array.prototype.findlastindex/-/array.prototype.findlastindex-1.2.5.tgz",
      "integrity": "sha512-zfETvRFA8o7EiNn++N5f/kaCw221hrpGsDmcpndVupkPzEc1Wuf3VgC0qby1BbHs7f5DVYjgtEU2LLh5bqeGfQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.flat": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/array.prototype.flat/-/array.prototype.flat-1.3.2.tgz",
      "integrity": "sha512-djYB+Zx2vLewY8RWlNCUdHjDXs2XOgm602S9E7P/UpHgfeHL00cRiIF+IN/G/aUJ7kGPb6yO/ErDI5V2s8iycA==",
      "dependencies": {
        "call-bind": "^1.0.2",
        "define-properties": "^1.2.0",
        "es-abstract": "^1.22.1",
        "es-shim-unscopables": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.flatmap": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/array.prototype.flatmap/-/array.prototype.flatmap-1.3.2.tgz",
      "integrity": "sha512-Ewyx0c9PmpcsByhSW4r+9zDU7sGjFc86qf/kKtuSCRdhfbk0SNLLkaT5qvcHnRGgc5NP/ly/y+qkXkqONX54CQ==",
      "dependencies": {
        "call-bind": "^1.0.2",
        "define-properties": "^1.2.0",
        "es-abstract": "^1.22.1",
        "es-shim-unscopables": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.toreversed": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/array.prototype.toreversed/-/array.prototype.toreversed-1.1.2.tgz",
      "integrity": "sha512-wwDCoT4Ck4Cz7sLtgUmzR5UV3YF5mFHUlbChCzZBQZ+0m2cl/DH3tKgvphv1nKgFsJ48oCSg6p91q2Vm0I/ZMA==",
      "dependencies": {
        "call-bind": "^1.0.2",
        "define-properties": "^1.2.0",
        "es-abstract": "^1.22.1",
        "es-shim-unscopables": "^1.0.0"
      }
    },
    "node_modules/array.prototype.tosorted": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/array.prototype.tosorted/-/array.prototype.tosorted-1.1.3.tgz",
      "integrity": "sha512-/DdH4TiTmOKzyQbp/eadcCVexiCb36xJg7HshYOYJnNZFDj33GEv0P7GxsynpShhq4OLYJzbGcBDkLsDt7MnNg==",
      "dependencies": {
        "call-bind": "^1.0.5",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.22.3",
        "es-errors": "^1.1.0",
        "es-shim-unscopables": "^1.0.2"
      }
    },
    "node_modules/arraybuffer.prototype.slice": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/arraybuffer.prototype.slice/-/arraybuffer.prototype.slice-1.0.3.tgz",
      "integrity": "sha512-bMxMKAjg13EBSVscxTaYA4mRc5t1UAXa2kXiGTNfZ079HIWXEkKmkgFrh/nJqamaLSrXO5H4WFFkPEaLJWbs3A==",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.1",
        "call-bind": "^1.0.5",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.22.3",
        "es-errors": "^1.2.1",
        "get-intrinsic": "^1.2.3",
        "is-array-buffer": "^3.0.4",
        "is-shared-array-buffer": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/ast-types-flow": {
      "version": "0.0.8",
      "resolved": "https://registry.npmjs.org/ast-types-flow/-/ast-types-flow-0.0.8.tgz",
      "integrity": "sha512-OH/2E5Fg20h2aPrbe+QL8JZQFko0YZaF+j4mnQ7BGhfavO7OpSLa8a0y9sBwomHdSbkhTS8TQNayBfnW5DwbvQ=="
    },
    "node_modules/astring": {
      "version": "1.8.6",
      "resolved": "https://registry.npmjs.org/astring/-/astring-1.8.6.tgz",
      "integrity": "sha512-ISvCdHdlTDlH5IpxQJIex7BWBywFWgjJSVdwst+/iQCoEYnyOaQ95+X1JGshuBjGp6nxKUy1jMgE3zPqN7fQdg==",
      "bin": {
        "astring": "bin/astring"
      }
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q=="
    },
    "node_modules/autoprefixer": {
      "version": "10.4.19",
      "resolved": "https://registry.npmjs.org/autoprefixer/-/autoprefixer-10.4.19.tgz",
      "integrity": "sha512-BaENR2+zBZ8xXhM4pUaKUxlVdxZ0EZhjvbopwnXmxRUfqDmwSpC2lAi/QXvx7NRdPCo1WKEcEF6mV64si1z4Ew==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/autoprefixer"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "dependencies": {
        "browserslist": "^4.23.0",
        "caniuse-lite": "^1.0.30001599",
        "fraction.js": "^4.3.7",
        "normalize-range": "^0.1.2",
        "picocolors": "^1.0.0",
        "postcss-value-parser": "^4.2.0"
      },
      "bin": {
        "autoprefixer": "bin/autoprefixer"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/available-typed-arrays": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/available-typed-arrays/-/available-typed-arrays-1.0.7.tgz",
      "integrity": "sha512-wvUjBtSGN7+7SjNpq/9M2Tg350UZD3q62IFZLbRAR1bSMlCo1ZaeW+BJ+D090e4hIIZLBcTDWe4Mh4jvUDajzQ==",
      "dependencies": {
        "possible-typed-array-names": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/axe-core": {
      "version": "4.7.0",
      "resolved": "https://registry.npmjs.org/axe-core/-/axe-core-4.7.0.tgz",
      "integrity": "sha512-M0JtH+hlOL5pLQwHOLNYZaXuhqmvS8oExsqB1SBYgA4Dk7u/xx+YdGHXaK5pyUfed5mYXdlYiphWq3G8cRi5JQ==",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/axios": {
      "version": "1.6.8",
      "resolved": "https://registry.npmjs.org/axios/-/axios-1.6.8.tgz",
      "integrity": "sha512-v/ZHtJDU39mDpyBoFVkETcd/uNdxrWRrg3bKpOKzXFA6Bvqopts6ALSMU3y6ijYxbw2B+wPrIv46egTzJXCLGQ==",
      "dependencies": {
        "follow-redirects": "^1.15.6",
        "form-data": "^4.0.0",
        "proxy-from-env": "^1.1.0"
      }
    },
    "node_modules/axobject-query": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/axobject-query/-/axobject-query-3.2.1.tgz",
      "integrity": "sha512-jsyHu61e6N4Vbz/v18DHwWYKK0bSWLqn47eeDSKPB7m8tqMHF9YJ+mhIk2lVteyZrY8tnSj/jHOv4YiTCuCJgg==",
      "dependencies": {
        "dequal": "^2.0.3"
      }
    },
    "node_modules/bail": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/bail/-/bail-2.0.2.tgz",
      "integrity": "sha512-0xO6mYd7JB2YesxDKplafRpsiOzPt9V02ddPCLbY1xYGPOX24NTyN50qnUxgCPcSoYMhKpAuBTjQoRZCAkUDRw==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw=="
    },
    "node_modules/base-64": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/base-64/-/base-64-1.0.0.tgz",
      "integrity": "sha512-kwDPIFCGx0NZHog36dj+tHiwP4QMzsZ3AgMViUBKI0+V5n4U0ufTCUMhnQ04diaRI8EX/QcPfql7zlhZ7j4zgg=="
    },
    "node_modules/binary-extensions": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/binary-extensions/-/binary-extensions-2.3.0.tgz",
      "integrity": "sha512-Ceh+7ox5qe7LJuLHoY0feh3pHuUDHAcRUeyL2VYghZwfpkNIy/+8Ocg0a3UuSoYzavmylwuLWQOf3hl0jjMMIw==",
      "dev": true,
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/brace-expansion": {
      "version": "1.1.11",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
      "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.2.tgz",
      "integrity": "sha512-b8um+L1RzM3WDSzvhm6gIz1yfTbBt6YTlcEKAvsmqCZZFw46z626lVj9j1yEPW33H5H+lBQpZMP1k8l+78Ha0A==",
      "dependencies": {
        "fill-range": "^7.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/browserslist": {
      "version": "4.23.0",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.23.0.tgz",
      "integrity": "sha512-QW8HiM1shhT2GuzkvklfjcKDiWFXHOeFCIA/huJPwHsslwcydgk7X+z2zXpEijP98UCY7HbubZt5J2Zgvf0CaQ==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "dependencies": {
        "caniuse-lite": "^1.0.30001587",
        "electron-to-chromium": "^1.4.668",
        "node-releases": "^2.0.14",
        "update-browserslist-db": "^1.0.13"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/bson": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/bson/-/bson-6.5.0.tgz",
      "integrity": "sha512-DXf1BTAS8vKyR90BO4x5v3rKVarmkdkzwOrnYDFdjAY694ILNDkmA3uRh1xXJEl+C1DAh8XCvAQ+Gh3kzubtpg==",
      "dev": true,
      "engines": {
        "node": ">=16.20.1"
      }
    },
    "node_modules/buffer-from": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.2.tgz",
      "integrity": "sha512-E+XQCRwSbaaiChtv6k6Dwgc+bx+Bs6vuKJHHl5kox/BaKbhiXzqQOwK4cO22yElGp2OCmjwVhT3HmxgyPGnJfQ==",
      "peer": true
    },
    "node_modules/busboy": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/busboy/-/busboy-1.6.0.tgz",
      "integrity": "sha512-8SFQbg/0hQ9xy3UNTB0YEnsNBbWfhf7RtnzpL7TkBiTBRfrQ9Fxcnz7VJsleJpyp6rVLvXiuORqjlHi5q+PYuA==",
      "dependencies": {
        "streamsearch": "^1.1.0"
      },
      "engines": {
        "node": ">=10.16.0"
      }
    },
    "node_modules/call-bind": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/call-bind/-/call-bind-1.0.7.tgz",
      "integrity": "sha512-GHTSNSYICQ7scH7sZ+M2rFopRoLh8t2bLSW6BbgrtLsahOIB5iyAVJf9GjWK3cYTDaMj4XdBpM1cA6pIS0Kv2w==",
      "dependencies": {
        "es-define-property": "^1.0.0",
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.2.4",
        "set-function-length": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/callsites": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/callsites/-/callsites-3.1.0.tgz",
      "integrity": "sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/camelcase-css": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/camelcase-css/-/camelcase-css-2.0.1.tgz",
      "integrity": "sha512-QOSvevhslijgYwRx6Rv7zKdMF8lbRmx+uQGx2+vDc+KI/eBnsy9kit5aj23AgGu3pa4t9AgwbnXWqS+iOY+2aA==",
      "dev": true,
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001603",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001603.tgz",
      "integrity": "sha512-iL2iSS0eDILMb9n5yKQoTBim9jMZ0Yrk8g0N9K7UzYyWnfIKzXBZD5ngpM37ZcL/cv0Mli8XtVMRYMQAfFpi5Q==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ]
    },
    "node_modules/ccount": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/ccount/-/ccount-2.0.1.tgz",
      "integrity": "sha512-eyrF0jiFpY+3drT6383f1qhkbGsLSifNAjA61IUjZjmLCWjItY6LB9ft9YhoDgwfmclB2zhu51Lc7+95b8NRAg==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/chalk": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
      "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/character-entities": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/character-entities/-/character-entities-2.0.2.tgz",
      "integrity": "sha512-shx7oQ0Awen/BRIdkjkvz54PnEEI/EjwXDSIZp86/KKdbafHh1Df/RYGBhn4hbe2+uKC9FnT5UCEdyPz3ai9hQ==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/character-entities-html4": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/character-entities-html4/-/character-entities-html4-2.1.0.tgz",
      "integrity": "sha512-1v7fgQRj6hnSwFpq1Eu0ynr/CDEw0rXo2B61qXrLNdHZmPKgb7fqS1a2JwF0rISo9q77jDI8VMEHoApn8qDoZA==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/character-entities-legacy": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/character-entities-legacy/-/character-entities-legacy-1.1.4.tgz",
      "integrity": "sha512-3Xnr+7ZFS1uxeiUDvV02wQ+QDbc55o97tIV5zHScSPJpcLm/r0DFPcoY3tYRp+VZukxuMeKgXYmsXQHO05zQeA==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/character-reference-invalid": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/character-reference-invalid/-/character-reference-invalid-1.1.4.tgz",
      "integrity": "sha512-mKKUkUbhPpQlCOfIuZkvSEgktjPFIsZKRRbC6KWVEMvlzblj3i3asQv5ODsrwt0N3pHAEvjP8KTQPHkp0+6jOg==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/chokidar": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-3.6.0.tgz",
      "integrity": "sha512-7VT13fmjotKpGipCW9JEQAusEPE+Ei8nl6/g4FBAmIm0GOOLMua9NDDo/DWp0ZAxCr3cPq5ZpBqmPAQgDda2Pw==",
      "dev": true,
      "dependencies": {
        "anymatch": "~3.1.2",
        "braces": "~3.0.2",
        "glob-parent": "~5.1.2",
        "is-binary-path": "~2.1.0",
        "is-glob": "~4.0.1",
        "normalize-path": "~3.0.0",
        "readdirp": "~3.6.0"
      },
      "engines": {
        "node": ">= 8.10.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/chokidar/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/chrome-trace-event": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/chrome-trace-event/-/chrome-trace-event-1.0.3.tgz",
      "integrity": "sha512-p3KULyQg4S7NIHixdwbGX+nFHkoBiA4YQmyWtjb8XngSKV124nJmRysgAeujbUVb15vh+RvFUfCPqU7rXk+hZg==",
      "peer": true,
      "engines": {
        "node": ">=6.0"
      }
    },
    "node_modules/ci-info": {
      "version": "3.9.0",
      "resolved": "https://registry.npmjs.org/ci-info/-/ci-info-3.9.0.tgz",
      "integrity": "sha512-NIxF55hv4nSqQswkAeiOi1r83xy8JldOFDTWiug55KBu9Jnblncd2U6ViHmYgHf01TPZS77NJBhBMKdWj9HQMQ==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/sibiraj-s"
        }
      ],
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/classnames": {
      "version": "2.5.1",
      "resolved": "https://registry.npmjs.org/classnames/-/classnames-2.5.1.tgz",
      "integrity": "sha512-saHYOzhIQs6wy2sVxTM6bUDsQO4F50V9RQ22qBpEdCW+I+/Wmke2HOl6lS6dTpdxVhb88/I6+Hs+438c3lfUow=="
    },
    "node_modules/client-only": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/client-only/-/client-only-0.0.1.tgz",
      "integrity": "sha512-IV3Ou0jSMzZrd3pZ48nLkT9DA7Ag1pnPzaiQhpW7c3RbcqqzvzzVu+L8gfqMp/8IM2MQtSiqaCxrrcfu8I8rMA=="
    },
    "node_modules/color": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/color/-/color-4.2.3.tgz",
      "integrity": "sha512-1rXeuUUiGGrykh+CeBdu5Ie7OJwinCgQY0bc7GCRxy5xVHy+moaqkpL/jqQq0MtQOeYcrqEz4abc5f0KtU7W4A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "color-convert": "^2.0.1",
        "color-string": "^1.9.0"
      },
      "engines": {
        "node": ">=12.5.0"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA=="
    },
    "node_modules/color-string": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/color-string/-/color-string-1.9.1.tgz",
      "integrity": "sha512-shrVawQFojnZv6xM40anx4CkoDP+fZsw/ZerEMsW/pyzsRbElpsL/DBVW7q3ExxwusdNXI3lXpuhEZkzs8p5Eg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "color-name": "^1.0.0",
        "simple-swizzle": "^0.2.2"
      }
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/comma-separated-tokens": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/comma-separated-tokens/-/comma-separated-tokens-2.0.3.tgz",
      "integrity": "sha512-Fu4hJdvzeylCfQPp9SGWidpzrMs7tTrlu6Vb8XGaRGck8QSNZJJp538Wrb60Lax4fPwR64ViY468OIUTbRlGZg==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/commander": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/commander/-/commander-4.1.1.tgz",
      "integrity": "sha512-NOKm8xhkzAjzFx8B2v5OAHT+u5pRQc2UCa2Vq9jYL/31o2wi9mxBA7LIFs3sV5VSC49z6pEhfbMULvShKj26WA==",
      "dev": true,
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg=="
    },
    "node_modules/crisp-sdk-web": {
      "version": "1.0.22",
      "resolved": "https://registry.npmjs.org/crisp-sdk-web/-/crisp-sdk-web-1.0.22.tgz",
      "integrity": "sha512-5LakqSr638Cv1J/FuM/RhCGVEaHmrbPpEY14h9GdoEUeNF+jzDhV2KwTVVL5hDwTo5Vhc1J+hprUzgqUv9xH4Q=="
    },
    "node_modules/cross-spawn": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.3.tgz",
      "integrity": "sha512-iRDPJKUPVEND7dHPO8rkbOnPpyDygcDFtWjpeWNCgy8WP2rXcxXL8TskReQl6OrB2G7+UJrags1q15Fudc7G6w==",
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/css-selector-tokenizer": {
      "version": "0.8.0",
      "resolved": "https://registry.npmjs.org/css-selector-tokenizer/-/css-selector-tokenizer-0.8.0.tgz",
      "integrity": "sha512-Jd6Ig3/pe62/qe5SBPTN8h8LeUg/pT4lLgtavPf7updwwHpvFzxvOQBHYj2LZDMjUnBzgvIUSjRcf6oT5HzHFg==",
      "dev": true,
      "dependencies": {
        "cssesc": "^3.0.0",
        "fastparse": "^1.1.2"
      }
    },
    "node_modules/cssesc": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/cssesc/-/cssesc-3.0.0.tgz",
      "integrity": "sha512-/Tb/JcjK111nNScGob5MNtsntNM1aCNUDipB/TkwZFhyDrrE47SOx/18wF2bbjgc3ZzCSKW1T5nt5EbFoAz/Vg==",
      "dev": true,
      "bin": {
        "cssesc": "bin/cssesc"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/csstype": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.1.3.tgz",
      "integrity": "sha512-M1uQkMl8rQK/szD0LNhtqxIPLpimGm8sOBwU7lLnCpSbTyY3yeU1Vc7l4KT5zT4s/yOxHH5O7tIuuLOCnLADRw=="
    },
    "node_modules/culori": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/culori/-/culori-3.3.0.tgz",
      "integrity": "sha512-pHJg+jbuFsCjz9iclQBqyL3B2HLCBF71BwVNujUYEvCeQMvV97R59MNK3R2+jgJ3a1fcZgI9B3vYgz8lzr/BFQ==",
      "dev": true,
      "engines": {
        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
      }
    },
    "node_modules/daisyui": {
      "version": "4.10.1",
      "resolved": "https://registry.npmjs.org/daisyui/-/daisyui-4.10.1.tgz",
      "integrity": "sha512-Ds0Z0Fv+Xf6ZEqV4Q5JIOeKfg83xxnww0Lzid0V94vPtlQ0yYmucEa33zSctsX2VEgBALtmk5zVEqd59pnUbuQ==",
      "dev": true,
      "dependencies": {
        "css-selector-tokenizer": "^0.8",
        "culori": "^3",
        "picocolors": "^1",
        "postcss-js": "^4"
      },
      "engines": {
        "node": ">=16.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/daisyui"
      }
    },
    "node_modules/damerau-levenshtein": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/damerau-levenshtein/-/damerau-levenshtein-1.0.8.tgz",
      "integrity": "sha512-sdQSFB7+llfUcQHUQO3+B8ERRj0Oa4w9POWMI/puGtuf7gFywGmkaLCElnudfTiKZV+NvHqL0ifzdrI8Ro7ESA=="
    },
    "node_modules/data-view-buffer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/data-view-buffer/-/data-view-buffer-1.0.1.tgz",
      "integrity": "sha512-0lht7OugA5x3iJLOWFhWK/5ehONdprk0ISXqVFn/NFrDu+cuc8iADFrGQz5BnRK7LLU3JmkbXSxaqX+/mXYtUA==",
      "dependencies": {
        "call-bind": "^1.0.6",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/data-view-byte-length": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/data-view-byte-length/-/data-view-byte-length-1.0.1.tgz",
      "integrity": "sha512-4J7wRJD3ABAzr8wP+OcIcqq2dlUKp4DVflx++hs5h5ZKydWMI6/D/fAot+yh6g2tHh8fLFTvNOaVN357NvSrOQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/data-view-byte-offset": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/data-view-byte-offset/-/data-view-byte-offset-1.0.0.tgz",
      "integrity": "sha512-t/Ygsytq+R995EJ5PZlD4Cu56sWa8InXySaViRzw9apusqsOO2bQP+SbYzAhR0pFKoB+43lYy8rWban9JSuXnA==",
      "dependencies": {
        "call-bind": "^1.0.6",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/debug": {
      "version": "4.3.4",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.4.tgz",
      "integrity": "sha512-PRWFHuSU3eDtQJPvnNY7Jcket1j0t5OuOsFzPPzsekD52Zl8qUfFIPEiswXqIvHWGVHOgX+7G/vCNNhehwxfkQ==",
      "dependencies": {
        "ms": "2.1.2"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decode-named-character-reference": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/decode-named-character-reference/-/decode-named-character-reference-1.0.2.tgz",
      "integrity": "sha512-O8x12RzrUF8xyVcY0KJowWsmaJxQbmy0/EtnNtHRpsOcT7dFk5W598coHqBVpmWo1oQQfsCqfCmkZN5DJrZVdg==",
      "dependencies": {
        "character-entities": "^2.0.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/deep-is": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/deep-is/-/deep-is-0.1.4.tgz",
      "integrity": "sha512-oIPzksmTg4/MriiaYGO+okXDT7ztn/w3Eptv/+gSIdMdKsJo0u4CfYNFJPy+4SKMuCqGw2wxnA+URMg3t8a/bQ=="
    },
    "node_modules/define-data-property": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/define-data-property/-/define-data-property-1.1.4.tgz",
      "integrity": "sha512-rBMvIzlpA8v6E+SJZoo++HAYqsLrkg7MSfIinMPFhmkorw7X+dOXVJQs+QT69zGkzMyfDnIMN2Wid1+NbL3T+A==",
      "dependencies": {
        "es-define-property": "^1.0.0",
        "es-errors": "^1.3.0",
        "gopd": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/define-properties": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.2.1.tgz",
      "integrity": "sha512-8QmQKqEASLd5nx0U1B1okLElbUuuttJ/AnYmRXbbbGDWh6uS208EjD4Xqq/I9wK7u0v6O08XhTWnt5XtEbR6Dg==",
      "dependencies": {
        "define-data-property": "^1.0.1",
        "has-property-descriptors": "^1.0.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/dequal": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/dequal/-/dequal-2.0.3.tgz",
      "integrity": "sha512-0je+qPKHEMohvfRTCEo3CrPG6cAzAYgmzKyxRiYSSDkS6eGJdyVJm7WaYA5ECaAD9wLB2T4EEeymA5aFVcYXCA==",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/detect-libc": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.0.4.tgz",
      "integrity": "sha512-3UDv+G9CsCKO1WKMGw9fwq/SWJYbI0c5Y7LU1AXYoDdbhE2AHQ6N6Nb34sG8Fj7T5APy8qXDCKuuIHd1BR0tVA==",
      "license": "Apache-2.0",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/didyoumean": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/didyoumean/-/didyoumean-1.2.2.tgz",
      "integrity": "sha512-gxtyfqMg7GKyhQmb056K7M3xszy/myH8w+B4RT+QXBQsvAOdc3XymqDDPHx1BgPgsdAA5SIifona89YtRATDzw==",
      "dev": true
    },
    "node_modules/diff": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/diff/-/diff-5.2.0.tgz",
      "integrity": "sha512-uIFDxqpRZGZ6ThOk84hEfqWoHx2devRFvpTZcTHur85vImfaxUbTW9Ryh4CpCuDnToOP1CEtXKIgytHBPVff5A==",
      "engines": {
        "node": ">=0.3.1"
      }
    },
    "node_modules/diff-sequences": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/diff-sequences/-/diff-sequences-29.6.3.tgz",
      "integrity": "sha512-EjePK1srD3P08o2j4f0ExnylqRs5B9tJjcp9t1krH2qRi8CCdsYfwe9JgSLurFBWwq4uOlipzfk5fHNvwFKr8Q==",
      "dev": true,
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/dir-glob": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/dir-glob/-/dir-glob-3.0.1.tgz",
      "integrity": "sha512-WkrWp9GR4KXfKGYzOLmTuGVi1UWFfws377n9cc55/tb6DuqyF6pcQ5AbiHEshaDpY9v6oaSr2XCDidGmMwdzIA==",
      "dependencies": {
        "path-type": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/dlv": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/dlv/-/dlv-1.1.3.tgz",
      "integrity": "sha512-+HlytyjlPKnIG8XuRG8WvmBP8xs8P71y+SKKS6ZXWoEgLuePxtDoUEiH7WkdePWrQ5JBpE6aoVqfZfJUQkjXwA==",
      "dev": true
    },
    "node_modules/doctrine": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/doctrine/-/doctrine-3.0.0.tgz",
      "integrity": "sha512-yS+Q5i3hBf7GBkd4KG8a7eBNNWNGLTaEwwYWUijIYM7zrlYDM0BFXHjjPWlWZ1Rg7UaddZeIDmi9jF3HmqiQ2w==",
      "dependencies": {
        "esutils": "^2.0.2"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/eastasianwidth": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/eastasianwidth/-/eastasianwidth-0.2.0.tgz",
      "integrity": "sha512-I88TYZWc9XiYHRQ4/3c5rjjfgkjhLyW2luGIheGERbNQ6OY7yTybanSpDXZa8y7VUP9YmDcYa+eyq4ca7iLqWA==",
      "dev": true
    },
    "node_modules/electron-to-chromium": {
      "version": "1.4.722",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.4.722.tgz",
      "integrity": "sha512-5nLE0TWFFpZ80Crhtp4pIp8LXCztjYX41yUcV6b+bKR2PqzjskTMOOlBi1VjBHlvHwS+4gar7kNKOrsbsewEZQ=="
    },
    "node_modules/emoji-regex": {
      "version": "9.2.2",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-9.2.2.tgz",
      "integrity": "sha512-L18DaJsXSUk2+42pv8mLs5jJT2hqFkFE4j21wOmgbUqsZ2hL72NsUU785g9RXgo3s0ZNgVl42TiHp3ZtOv/Vyg=="
    },
    "node_modules/enhanced-resolve": {
      "version": "5.16.0",
      "resolved": "https://registry.npmjs.org/enhanced-resolve/-/enhanced-resolve-5.16.0.tgz",
      "integrity": "sha512-O+QWCviPNSSLAD9Ucn8Awv+poAkqn3T1XY5/N7kR7rQO9yfSGWkYZDwpJ+iKF7B8rxaQKWngSqACpgzeapSyoA==",
      "dependencies": {
        "graceful-fs": "^4.2.4",
        "tapable": "^2.2.0"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/es-abstract": {
      "version": "1.23.3",
      "resolved": "https://registry.npmjs.org/es-abstract/-/es-abstract-1.23.3.tgz",
      "integrity": "sha512-e+HfNH61Bj1X9/jLc5v1owaLYuHdeHHSQlkhCBiTK8rBvKaULl/beGMxwrMXjpYrv4pz22BlY570vVePA2ho4A==",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.1",
        "arraybuffer.prototype.slice": "^1.0.3",
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.7",
        "data-view-buffer": "^1.0.1",
        "data-view-byte-length": "^1.0.1",
        "data-view-byte-offset": "^1.0.0",
        "es-define-property": "^1.0.0",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "es-set-tostringtag": "^2.0.3",
        "es-to-primitive": "^1.2.1",
        "function.prototype.name": "^1.1.6",
        "get-intrinsic": "^1.2.4",
        "get-symbol-description": "^1.0.2",
        "globalthis": "^1.0.3",
        "gopd": "^1.0.1",
        "has-property-descriptors": "^1.0.2",
        "has-proto": "^1.0.3",
        "has-symbols": "^1.0.3",
        "hasown": "^2.0.2",
        "internal-slot": "^1.0.7",
        "is-array-buffer": "^3.0.4",
        "is-callable": "^1.2.7",
        "is-data-view": "^1.0.1",
        "is-negative-zero": "^2.0.3",
        "is-regex": "^1.1.4",
        "is-shared-array-buffer": "^1.0.3",
        "is-string": "^1.0.7",
        "is-typed-array": "^1.1.13",
        "is-weakref": "^1.0.2",
        "object-inspect": "^1.13.1",
        "object-keys": "^1.1.1",
        "object.assign": "^4.1.5",
        "regexp.prototype.flags": "^1.5.2",
        "safe-array-concat": "^1.1.2",
        "safe-regex-test": "^1.0.3",
        "string.prototype.trim": "^1.2.9",
        "string.prototype.trimend": "^1.0.8",
        "string.prototype.trimstart": "^1.0.8",
        "typed-array-buffer": "^1.0.2",
        "typed-array-byte-length": "^1.0.1",
        "typed-array-byte-offset": "^1.0.2",
        "typed-array-length": "^1.0.6",
        "unbox-primitive": "^1.0.2",
        "which-typed-array": "^1.1.15"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.0.tgz",
      "integrity": "sha512-jxayLKShrEqqzJ0eumQbVhTYQM27CfT1T35+gCgDFoL82JLsXqTJ76zv6A0YLOgEnLUMvLzsDsGIrl8NFpT2gQ==",
      "dependencies": {
        "get-intrinsic": "^1.2.4"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-iterator-helpers": {
      "version": "1.0.18",
      "resolved": "https://registry.npmjs.org/es-iterator-helpers/-/es-iterator-helpers-1.0.18.tgz",
      "integrity": "sha512-scxAJaewsahbqTYrGKJihhViaM6DDZDDoucfvzNbK0pOren1g/daDQ3IAhzn+1G14rBG7w+i5N+qul60++zlKA==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.0",
        "es-errors": "^1.3.0",
        "es-set-tostringtag": "^2.0.3",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.2.4",
        "globalthis": "^1.0.3",
        "has-property-descriptors": "^1.0.2",
        "has-proto": "^1.0.3",
        "has-symbols": "^1.0.3",
        "internal-slot": "^1.0.7",
        "iterator.prototype": "^1.1.2",
        "safe-array-concat": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-module-lexer": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/es-module-lexer/-/es-module-lexer-1.5.0.tgz",
      "integrity": "sha512-pqrTKmwEIgafsYZAGw9kszYzmagcE/n4dbgwGWLEXg7J4QFJVQRBld8j3Q3GNez79jzxZshq0bcT962QHOghjw==",
      "peer": true
    },
    "node_modules/es-object-atoms": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.0.0.tgz",
      "integrity": "sha512-MZ4iQ6JwHOBQjahnjwaC1ZtIBH+2ohjamzAO3oaHcXYup7qxjF2fixyH+Q71voWHeOkI2q/TnJao/KfXYIZWbw==",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.0.3.tgz",
      "integrity": "sha512-3T8uNMC3OQTHkFUsFq8r/BwAXLHvU/9O9mE0fBc/MY5iq/8H7ncvO947LmYA6ldWw9Uh8Yhf25zu6n7nML5QWQ==",
      "dependencies": {
        "get-intrinsic": "^1.2.4",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-shim-unscopables": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/es-shim-unscopables/-/es-shim-unscopables-1.0.2.tgz",
      "integrity": "sha512-J3yBRXCzDu4ULnQwxyToo/OjdMx6akgVC7K6few0a7F/0wLtmKKN7I73AH5T2836UuXRqN7Qg+IIUw/+YJksRw==",
      "dependencies": {
        "hasown": "^2.0.0"
      }
    },
    "node_modules/es-to-primitive": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/es-to-primitive/-/es-to-primitive-1.2.1.tgz",
      "integrity": "sha512-QCOllgZJtaUo9miYBcLChTUaHNjJF3PYs1VidD7AwiEj1kYxKeQTctLAezAOH5ZKRH0g2IgPn6KwB4IT8iRpvA==",
      "dependencies": {
        "is-callable": "^1.1.4",
        "is-date-object": "^1.0.1",
        "is-symbol": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/escalade": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.1.2.tgz",
      "integrity": "sha512-ErCHMCae19vR8vQGe50xIsVomy19rg6gFu3+r3jkEO46suLMWBksvVyoGgQV+jOfl84ZSOSlmv6Gxa89PmTGmA==",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
      "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint": {
      "version": "8.47.0",
      "resolved": "https://registry.npmjs.org/eslint/-/eslint-8.47.0.tgz",
      "integrity": "sha512-spUQWrdPt+pRVP1TTJLmfRNJJHHZryFmptzcafwSvHsceV81djHOdnEeDmkdotZyLNjDhrOasNK8nikkoG1O8Q==",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.2.0",
        "@eslint-community/regexpp": "^4.6.1",
        "@eslint/eslintrc": "^2.1.2",
        "@eslint/js": "^8.47.0",
        "@humanwhocodes/config-array": "^0.11.10",
        "@humanwhocodes/module-importer": "^1.0.1",
        "@nodelib/fs.walk": "^1.2.8",
        "ajv": "^6.12.4",
        "chalk": "^4.0.0",
        "cross-spawn": "^7.0.2",
        "debug": "^4.3.2",
        "doctrine": "^3.0.0",
        "escape-string-regexp": "^4.0.0",
        "eslint-scope": "^7.2.2",
        "eslint-visitor-keys": "^3.4.3",
        "espree": "^9.6.1",
        "esquery": "^1.4.2",
        "esutils": "^2.0.2",
        "fast-deep-equal": "^3.1.3",
        "file-entry-cache": "^6.0.1",
        "find-up": "^5.0.0",
        "glob-parent": "^6.0.2",
        "globals": "^13.19.0",
        "graphemer": "^1.4.0",
        "ignore": "^5.2.0",
        "imurmurhash": "^0.1.4",
        "is-glob": "^4.0.0",
        "is-path-inside": "^3.0.3",
        "js-yaml": "^4.1.0",
        "json-stable-stringify-without-jsonify": "^1.0.1",
        "levn": "^0.4.1",
        "lodash.merge": "^4.6.2",
        "minimatch": "^3.1.2",
        "natural-compare": "^1.4.0",
        "optionator": "^0.9.3",
        "strip-ansi": "^6.0.1",
        "text-table": "^0.2.0"
      },
      "bin": {
        "eslint": "bin/eslint.js"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint-config-next": {
      "version": "13.4.19",
      "resolved": "https://registry.npmjs.org/eslint-config-next/-/eslint-config-next-13.4.19.tgz",
      "integrity": "sha512-WE8367sqMnjhWHvR5OivmfwENRQ1ixfNE9hZwQqNCsd+iM3KnuMc1V8Pt6ytgjxjf23D+xbesADv9x3xaKfT3g==",
      "dependencies": {
        "@next/eslint-plugin-next": "13.4.19",
        "@rushstack/eslint-patch": "^1.1.3",
        "@typescript-eslint/parser": "^5.4.2 || ^6.0.0",
        "eslint-import-resolver-node": "^0.3.6",
        "eslint-import-resolver-typescript": "^3.5.2",
        "eslint-plugin-import": "^2.26.0",
        "eslint-plugin-jsx-a11y": "^6.5.1",
        "eslint-plugin-react": "^7.31.7",
        "eslint-plugin-react-hooks": "^4.5.0 || 5.0.0-canary-7118f5dd7-20230705"
      },
      "peerDependencies": {
        "eslint": "^7.23.0 || ^8.0.0",
        "typescript": ">=3.3.1"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-import-resolver-node": {
      "version": "0.3.9",
      "resolved": "https://registry.npmjs.org/eslint-import-resolver-node/-/eslint-import-resolver-node-0.3.9.tgz",
      "integrity": "sha512-WFj2isz22JahUv+B788TlO3N6zL3nNJGU8CcZbPZvVEkBPaJdCV4vy5wyghty5ROFbCRnm132v8BScu5/1BQ8g==",
      "dependencies": {
        "debug": "^3.2.7",
        "is-core-module": "^2.13.0",
        "resolve": "^1.22.4"
      }
    },
    "node_modules/eslint-import-resolver-node/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-import-resolver-typescript": {
      "version": "3.6.1",
      "resolved": "https://registry.npmjs.org/eslint-import-resolver-typescript/-/eslint-import-resolver-typescript-3.6.1.tgz",
      "integrity": "sha512-xgdptdoi5W3niYeuQxKmzVDTATvLYqhpwmykwsh7f6HIOStGWEIL9iqZgQDF9u9OEzrRwR8no5q2VT+bjAujTg==",
      "dependencies": {
        "debug": "^4.3.4",
        "enhanced-resolve": "^5.12.0",
        "eslint-module-utils": "^2.7.4",
        "fast-glob": "^3.3.1",
        "get-tsconfig": "^4.5.0",
        "is-core-module": "^2.11.0",
        "is-glob": "^4.0.3"
      },
      "engines": {
        "node": "^14.18.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/unts/projects/eslint-import-resolver-ts"
      },
      "peerDependencies": {
        "eslint": "*",
        "eslint-plugin-import": "*"
      }
    },
    "node_modules/eslint-module-utils": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/eslint-module-utils/-/eslint-module-utils-2.8.1.tgz",
      "integrity": "sha512-rXDXR3h7cs7dy9RNpUlQf80nX31XWJEyGq1tRMo+6GsO5VmTe4UTwtmonAD4ZkAsrfMVDA2wlGJ3790Ys+D49Q==",
      "dependencies": {
        "debug": "^3.2.7"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependenciesMeta": {
        "eslint": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-module-utils/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-plugin-import": {
      "version": "2.29.1",
      "resolved": "https://registry.npmjs.org/eslint-plugin-import/-/eslint-plugin-import-2.29.1.tgz",
      "integrity": "sha512-BbPC0cuExzhiMo4Ff1BTVwHpjjv28C5R+btTOGaCRC7UEz801up0JadwkeSk5Ued6TG34uaczuVuH6qyy5YUxw==",
      "dependencies": {
        "array-includes": "^3.1.7",
        "array.prototype.findlastindex": "^1.2.3",
        "array.prototype.flat": "^1.3.2",
        "array.prototype.flatmap": "^1.3.2",
        "debug": "^3.2.7",
        "doctrine": "^2.1.0",
        "eslint-import-resolver-node": "^0.3.9",
        "eslint-module-utils": "^2.8.0",
        "hasown": "^2.0.0",
        "is-core-module": "^2.13.1",
        "is-glob": "^4.0.3",
        "minimatch": "^3.1.2",
        "object.fromentries": "^2.0.7",
        "object.groupby": "^1.0.1",
        "object.values": "^1.1.7",
        "semver": "^6.3.1",
        "tsconfig-paths": "^3.15.0"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependencies": {
        "eslint": "^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8"
      }
    },
    "node_modules/eslint-plugin-import/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-plugin-import/node_modules/doctrine": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/doctrine/-/doctrine-2.1.0.tgz",
      "integrity": "sha512-35mSku4ZXK0vfCuHEDAwt55dg2jNajHZ1odvF+8SSr82EsZY4QmXfuWso8oEd8zRhVObSN18aM0CjSdoBX7zIw==",
      "dependencies": {
        "esutils": "^2.0.2"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/eslint-plugin-import/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/eslint-plugin-jsx-a11y": {
      "version": "6.8.0",
      "resolved": "https://registry.npmjs.org/eslint-plugin-jsx-a11y/-/eslint-plugin-jsx-a11y-6.8.0.tgz",
      "integrity": "sha512-Hdh937BS3KdwwbBaKd5+PLCOmYY6U4f2h9Z2ktwtNKvIdIEu137rjYbcb9ApSbVJfWxANNuiKTD/9tOKjK9qOA==",
      "dependencies": {
        "@babel/runtime": "^7.23.2",
        "aria-query": "^5.3.0",
        "array-includes": "^3.1.7",
        "array.prototype.flatmap": "^1.3.2",
        "ast-types-flow": "^0.0.8",
        "axe-core": "=4.7.0",
        "axobject-query": "^3.2.1",
        "damerau-levenshtein": "^1.0.8",
        "emoji-regex": "^9.2.2",
        "es-iterator-helpers": "^1.0.15",
        "hasown": "^2.0.0",
        "jsx-ast-utils": "^3.3.5",
        "language-tags": "^1.0.9",
        "minimatch": "^3.1.2",
        "object.entries": "^1.1.7",
        "object.fromentries": "^2.0.7"
      },
      "engines": {
        "node": ">=4.0"
      },
      "peerDependencies": {
        "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8"
      }
    },
    "node_modules/eslint-plugin-react": {
      "version": "7.34.1",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react/-/eslint-plugin-react-7.34.1.tgz",
      "integrity": "sha512-N97CxlouPT1AHt8Jn0mhhN2RrADlUAsk1/atcT2KyA/l9Q/E6ll7OIGwNumFmWfZ9skV3XXccYS19h80rHtgkw==",
      "dependencies": {
        "array-includes": "^3.1.7",
        "array.prototype.findlast": "^1.2.4",
        "array.prototype.flatmap": "^1.3.2",
        "array.prototype.toreversed": "^1.1.2",
        "array.prototype.tosorted": "^1.1.3",
        "doctrine": "^2.1.0",
        "es-iterator-helpers": "^1.0.17",
        "estraverse": "^5.3.0",
        "jsx-ast-utils": "^2.4.1 || ^3.0.0",
        "minimatch": "^3.1.2",
        "object.entries": "^1.1.7",
        "object.fromentries": "^2.0.7",
        "object.hasown": "^1.1.3",
        "object.values": "^1.1.7",
        "prop-types": "^15.8.1",
        "resolve": "^2.0.0-next.5",
        "semver": "^6.3.1",
        "string.prototype.matchall": "^4.0.10"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependencies": {
        "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8"
      }
    },
    "node_modules/eslint-plugin-react-hooks": {
      "version": "4.6.0",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react-hooks/-/eslint-plugin-react-hooks-4.6.0.tgz",
      "integrity": "sha512-oFc7Itz9Qxh2x4gNHStv3BqJq54ExXmfC+a1NjAta66IAN87Wu0R/QArgIS9qKzX3dXKPI9H5crl9QchNMY9+g==",
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "eslint": "^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0-0"
      }
    },
    "node_modules/eslint-plugin-react/node_modules/doctrine": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/doctrine/-/doctrine-2.1.0.tgz",
      "integrity": "sha512-35mSku4ZXK0vfCuHEDAwt55dg2jNajHZ1odvF+8SSr82EsZY4QmXfuWso8oEd8zRhVObSN18aM0CjSdoBX7zIw==",
      "dependencies": {
        "esutils": "^2.0.2"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/eslint-plugin-react/node_modules/resolve": {
      "version": "2.0.0-next.5",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-2.0.0-next.5.tgz",
      "integrity": "sha512-U7WjGVG9sH8tvjW5SmGbQuui75FiyjAX72HX15DwBBwF9dNiQZRQAg9nnPhYy+TUnE0+VcrttuvNI8oSxZcocA==",
      "dependencies": {
        "is-core-module": "^2.13.0",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/eslint-plugin-react/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/eslint-scope": {
      "version": "7.2.2",
      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-7.2.2.tgz",
      "integrity": "sha512-dOt21O7lTMhDM+X9mB4GX+DZrZtCUJPL/wlcTqxyrx5IvO0IYtILdtrQGQp+8n5S0gwSVmOf9NQrjMOgfQZlIg==",
      "dependencies": {
        "esrecurse": "^4.3.0",
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint-visitor-keys": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.4.3.tgz",
      "integrity": "sha512-wpc+LXeiyiisxPlEkUzU6svyS1frIO3Mgxj1fdy7Pm8Ygzguax2N3Fa/D/ag1WqbOprdI+uY6wMUl8/a2G+iag==",
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/espree": {
      "version": "9.6.1",
      "resolved": "https://registry.npmjs.org/espree/-/espree-9.6.1.tgz",
      "integrity": "sha512-oruZaFkjorTpF32kDSI5/75ViwGeZginGGy2NoOSg3Q9bnwlnmDm4HLnkl0RE3n+njDXR037aY1+x58Z/zFdwQ==",
      "dependencies": {
        "acorn": "^8.9.0",
        "acorn-jsx": "^5.3.2",
        "eslint-visitor-keys": "^3.4.1"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/esquery": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/esquery/-/esquery-1.5.0.tgz",
      "integrity": "sha512-YQLXUplAwJgCydQ78IMJywZCceoqk1oH01OERdSAJc/7U2AylwjhSCLDEtqwg811idIS/9fIU5GjG73IgjKMVg==",
      "dependencies": {
        "estraverse": "^5.1.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/esrecurse": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/esrecurse/-/esrecurse-4.3.0.tgz",
      "integrity": "sha512-KmfKL3b6G+RXvP8N1vr3Tq1kL/oCFgn2NYXEtqP8/L3pKapUA4G8cFVaoF3SU323CD4XypR/ffioHmkti6/Tag==",
      "dependencies": {
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estraverse": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-5.3.0.tgz",
      "integrity": "sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==",
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estree-util-attach-comments": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/estree-util-attach-comments/-/estree-util-attach-comments-2.1.1.tgz",
      "integrity": "sha512-+5Ba/xGGS6mnwFbXIuQiDPTbuTxuMCooq3arVv7gPZtYpjp+VXH/NkHAP35OOefPhNG/UGqU3vt/LTABwcHX0w==",
      "dependencies": {
        "@types/estree": "^1.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/estree-util-build-jsx": {
      "version": "2.2.2",
      "resolved": "https://registry.npmjs.org/estree-util-build-jsx/-/estree-util-build-jsx-2.2.2.tgz",
      "integrity": "sha512-m56vOXcOBuaF+Igpb9OPAy7f9w9OIkb5yhjsZuaPm7HoGi4oTOQi0h2+yZ+AtKklYFZ+rPC4n0wYCJCEU1ONqg==",
      "dependencies": {
        "@types/estree-jsx": "^1.0.0",
        "estree-util-is-identifier-name": "^2.0.0",
        "estree-walker": "^3.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/estree-util-is-identifier-name": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/estree-util-is-identifier-name/-/estree-util-is-identifier-name-2.1.0.tgz",
      "integrity": "sha512-bEN9VHRyXAUOjkKVQVvArFym08BTWB0aJPppZZr0UNyAqWsLaVfAqP7hbaTJjzHifmB5ebnR8Wm7r7yGN/HonQ==",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/estree-util-to-js": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/estree-util-to-js/-/estree-util-to-js-1.2.0.tgz",
      "integrity": "sha512-IzU74r1PK5IMMGZXUVZbmiu4A1uhiPgW5hm1GjcOfr4ZzHaMPpLNJjR7HjXiIOzi25nZDrgFTobHTkV5Q6ITjA==",
      "dependencies": {
        "@types/estree-jsx": "^1.0.0",
        "astring": "^1.8.0",
        "source-map": "^0.7.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/estree-util-visit": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/estree-util-visit/-/estree-util-visit-1.2.1.tgz",
      "integrity": "sha512-xbgqcrkIVbIG+lI/gzbvd9SGTJL4zqJKBFttUl5pP27KhAjtMKbX/mQXJ7qgyXpMgVy/zvpm0xoQQaGL8OloOw==",
      "dependencies": {
        "@types/estree-jsx": "^1.0.0",
        "@types/unist": "^2.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/estree-walker": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
      "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
      "dependencies": {
        "@types/estree": "^1.0.0"
      }
    },
    "node_modules/esutils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/events": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/events/-/events-3.3.0.tgz",
      "integrity": "sha512-mQw+2fkQbALzQ7V0MY0IqdnXNOeTtP4r0lN9z7AAawCXgqea7bDii20AYrIBrFd/Hx0M2Ocz6S111CaFkUcb0Q==",
      "peer": true,
      "engines": {
        "node": ">=0.8.x"
      }
    },
    "node_modules/expect": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/expect/-/expect-29.7.0.tgz",
      "integrity": "sha512-2Zks0hf1VLFYI1kbh0I5jP3KHHyCHpkfyHBzsSXRFgl/Bg9mWYfMW8oD+PdMPlEwy5HNsR9JutYy6pMeOh61nw==",
      "dev": true,
      "dependencies": {
        "@jest/expect-utils": "^29.7.0",
        "jest-get-type": "^29.6.3",
        "jest-matcher-utils": "^29.7.0",
        "jest-message-util": "^29.7.0",
        "jest-util": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/extend": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/extend/-/extend-3.0.2.tgz",
      "integrity": "sha512-fjquC59cD7CyW6urNXK0FBufkZcoiGG80wTuPujX590cB5Ttln20E2UB4S/WARVqhXffZl2LNgS+gQdPIIim/g=="
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q=="
    },
    "node_modules/fast-glob": {
      "version": "3.3.2",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.3.2.tgz",
      "integrity": "sha512-oX2ruAFQwf/Orj8m737Y5adxDQO0LAB7/S5MnxCdTNDd4p6BsyIVsv9JQsATbTSq8KHRpLwIHbVlUNatxd+1Ow==",
      "dependencies": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.4"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/fast-glob/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw=="
    },
    "node_modules/fast-levenshtein": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz",
      "integrity": "sha512-DCXu6Ifhqcks7TZKY3Hxp3y6qphY5SJZmrWMDrKcERSOXWQdMhU9Ig/PYrzyw/ul9jOIyh0N4M0tbC5hodg8dw=="
    },
    "node_modules/fastparse": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/fastparse/-/fastparse-1.1.2.tgz",
      "integrity": "sha512-483XLLxTVIwWK3QTrMGRqUfUpoOs/0hbQrl2oz4J0pAcm3A3bu84wxTFqGqkJzewCLdME38xJLJAxBABfQT8sQ==",
      "dev": true
    },
    "node_modules/fastq": {
      "version": "1.17.1",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.17.1.tgz",
      "integrity": "sha512-sRVD3lWVIXWg6By68ZN7vho9a1pQcN/WBFaAAsDDFzlJjvoGx0P8z7V1t72grFJfJhu3YPZBuu25f7Kaw2jN1w==",
      "dependencies": {
        "reusify": "^1.0.4"
      }
    },
    "node_modules/fault": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/fault/-/fault-1.0.4.tgz",
      "integrity": "sha512-CJ0HCB5tL5fYTEA7ToAq5+kTwd++Borf1/bifxd9iT70QcXr4MRrO3Llf8Ifs70q+SJcGHFtnIE/Nw6giCtECA==",
      "dependencies": {
        "format": "^0.2.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/file-entry-cache": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/file-entry-cache/-/file-entry-cache-6.0.1.tgz",
      "integrity": "sha512-7Gps/XWymbLk2QLYK4NzpMOrYjMhdIxXuIvy2QBsLE6ljuodKvdkWs/cpyJJ3CVIVpH0Oi1Hvg1ovbMzLdFBBg==",
      "dependencies": {
        "flat-cache": "^3.0.4"
      },
      "engines": {
        "node": "^10.12.0 || >=12.0.0"
      }
    },
    "node_modules/fill-range": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.0.1.tgz",
      "integrity": "sha512-qOo9F+dMUmC2Lcb4BbVvnKJxTPjCm+RRpe4gDuGrzkL7mEVl/djYSu2OdQ2Pa302N4oqkSg9ir6jaLWJ2USVpQ==",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/find-up": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
      "dependencies": {
        "locate-path": "^6.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/flat-cache": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/flat-cache/-/flat-cache-3.2.0.tgz",
      "integrity": "sha512-CYcENa+FtcUKLmhhqyctpclsq7QF38pKjZHsGNiSQF5r4FtoKDWabFDl3hzaEQMvT1LHEysw5twgLvpYYb4vbw==",
      "dependencies": {
        "flatted": "^3.2.9",
        "keyv": "^4.5.3",
        "rimraf": "^3.0.2"
      },
      "engines": {
        "node": "^10.12.0 || >=12.0.0"
      }
    },
    "node_modules/flatted": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/flatted/-/flatted-3.3.1.tgz",
      "integrity": "sha512-X8cqMLLie7KsNUDSdzeN8FYK9rEt4Dt67OsG/DNGnYTSDBG4uFAJFBnUeiV+zCVAvwFy56IjM9sH51jVaEhNxw=="
    },
    "node_modules/follow-redirects": {
      "version": "1.15.6",
      "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.15.6.tgz",
      "integrity": "sha512-wWN62YITEaOpSK584EZXJafH1AGpO8RVgElfkuXbTOrPX4fIfOyEpW/CsiNd8JdYrAoOvafRTOEnvsO++qCqFA==",
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/RubenVerborgh"
        }
      ],
      "engines": {
        "node": ">=4.0"
      },
      "peerDependenciesMeta": {
        "debug": {
          "optional": true
        }
      }
    },
    "node_modules/for-each": {
      "version": "0.3.3",
      "resolved": "https://registry.npmjs.org/for-each/-/for-each-0.3.3.tgz",
      "integrity": "sha512-jqYfLp7mo9vIyQf8ykW2v7A+2N4QjeCeI5+Dz9XraiO1ign81wjiH7Fb9vSOWvQfNtmSa4H2RoQTrrXivdUZmw==",
      "dependencies": {
        "is-callable": "^1.1.3"
      }
    },
    "node_modules/foreground-child": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/foreground-child/-/foreground-child-3.1.1.tgz",
      "integrity": "sha512-TMKDUnIte6bfb5nWv7V/caI169OHgvwjb7V4WkeUvbQQdjr5rWKqHFiKWb/fcOwB+CzBT+qbWjvj+DVwRskpIg==",
      "dev": true,
      "dependencies": {
        "cross-spawn": "^7.0.0",
        "signal-exit": "^4.0.1"
      },
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/form-data": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.0.tgz",
      "integrity": "sha512-ETEklSGi5t0QMZuiXoA/Q6vcnxcLQP5vdugSpuAyi6SVGi2clPPp+xgEhuMaHC+zGgn31Kd235W35f7Hykkaww==",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "mime-types": "^2.1.12"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/format": {
      "version": "0.2.2",
      "resolved": "https://registry.npmjs.org/format/-/format-0.2.2.tgz",
      "integrity": "sha512-wzsgA6WOq+09wrU1tsJ09udeR/YZRaeArL9e1wPbFg3GG2yDnC2ldKpxs4xunpFF9DgqCqOIra3bc1HWrJ37Ww==",
      "engines": {
        "node": ">=0.4.x"
      }
    },
    "node_modules/fraction.js": {
      "version": "4.3.7",
      "resolved": "https://registry.npmjs.org/fraction.js/-/fraction.js-4.3.7.tgz",
      "integrity": "sha512-ZsDfxO51wGAXREY55a7la9LScWpwv9RxIrYABrlvOFBlH/ShPnrtsXeuUIfXKKOVicNxQ+o8JTbJvjS4M89yew==",
      "dev": true,
      "engines": {
        "node": "*"
      },
      "funding": {
        "type": "patreon",
        "url": "https://github.com/sponsors/rawify"
      }
    },
    "node_modules/framer-motion": {
      "version": "12.10.1",
      "resolved": "https://registry.npmjs.org/framer-motion/-/framer-motion-12.10.1.tgz",
      "integrity": "sha512-g+fANUVC17SzQc6eA0CtomBW4n67ckhS2hq5fjkKZneKzv7sbdXK3zzjnnAKB22Ck+Qhh+IlO5RjHNKULsq99Q==",
      "license": "MIT",
      "dependencies": {
        "motion-dom": "^12.10.1",
        "motion-utils": "^12.9.4",
        "tslib": "^2.4.0"
      },
      "peerDependencies": {
        "@emotion/is-prop-valid": "*",
        "react": "^18.0.0 || ^19.0.0",
        "react-dom": "^18.0.0 || ^19.0.0"
      },
      "peerDependenciesMeta": {
        "@emotion/is-prop-valid": {
          "optional": true
        },
        "react": {
          "optional": true
        },
        "react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/fs.realpath": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/fs.realpath/-/fs.realpath-1.0.0.tgz",
      "integrity": "sha512-OO0pH2lK6a0hZnAdau5ItzHPI6pUlvI7jMVnxUQRtw4owF2wk8lOSabtGDCTP4Ggrg2MbGnWO9X8K1t4+fGMDw=="
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/function.prototype.name": {
      "version": "1.1.6",
      "resolved": "https://registry.npmjs.org/function.prototype.name/-/function.prototype.name-1.1.6.tgz",
      "integrity": "sha512-Z5kx79swU5P27WEayXM1tBi5Ze/lbIyiNgU3qyXUOf9b2rgXYyF9Dy9Cx+IQv/Lc8WCG6L82zwUPpSS9hGehIg==",
      "dependencies": {
        "call-bind": "^1.0.2",
        "define-properties": "^1.2.0",
        "es-abstract": "^1.22.1",
        "functions-have-names": "^1.2.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/functions-have-names": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/functions-have-names/-/functions-have-names-1.2.3.tgz",
      "integrity": "sha512-xckBUXyTIqT97tq2x2AMb+g163b5JFysYk0x4qxNFwbfQkmNZoiRHb6sPzI9/QV33WeuvVYBUIiD4NzNIyqaRQ==",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.2.4.tgz",
      "integrity": "sha512-5uYhsJH8VJBTv7oslg4BznJYhDoRI6waYCxMmCdnTrcCrHA/fCFKoTFz2JKKE0HdDFUF7/oQuhzumXJK7paBRQ==",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2",
        "has-proto": "^1.0.1",
        "has-symbols": "^1.0.3",
        "hasown": "^2.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-symbol-description": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/get-symbol-description/-/get-symbol-description-1.0.2.tgz",
      "integrity": "sha512-g0QYk1dZBxGwk+Ngc+ltRH2IBp2f7zBkBMBJZCDerh6EhlhSR6+9irMCuT/09zD6qkarHUSn529sK/yL4S27mg==",
      "dependencies": {
        "call-bind": "^1.0.5",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-tsconfig": {
      "version": "4.7.3",
      "resolved": "https://registry.npmjs.org/get-tsconfig/-/get-tsconfig-4.7.3.tgz",
      "integrity": "sha512-ZvkrzoUA0PQZM6fy6+/Hce561s+faD1rsNwhnO5FelNjyy7EMGJ3Rz1AQ8GYDWjhRs/7dBLOEJvhK8MiEJOAFg==",
      "dependencies": {
        "resolve-pkg-maps": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/privatenumber/get-tsconfig?sponsor=1"
      }
    },
    "node_modules/glob": {
      "version": "7.1.7",
      "resolved": "https://registry.npmjs.org/glob/-/glob-7.1.7.tgz",
      "integrity": "sha512-OvD9ENzPLbegENnYP5UUfJIirTg4+XwMWGaQfQTY0JenxNvvIKP3U3/tAQSPIu/lHxXYSZmpXlUHeqAIdKzBLQ==",
      "dependencies": {
        "fs.realpath": "^1.0.0",
        "inflight": "^1.0.4",
        "inherits": "2",
        "minimatch": "^3.0.4",
        "once": "^1.3.0",
        "path-is-absolute": "^1.0.0"
      },
      "engines": {
        "node": "*"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/glob-parent": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-6.0.2.tgz",
      "integrity": "sha512-XxwI8EOhVQgWp6iDL+3b0r86f4d6AX6zSU55HfB4ydCEuXLXc5FcYeOu+nnGftS4TEju/11rt4KJPTMgbfmv4A==",
      "dependencies": {
        "is-glob": "^4.0.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/glob-to-regexp": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/glob-to-regexp/-/glob-to-regexp-0.4.1.tgz",
      "integrity": "sha512-lkX1HJXwyMcprw/5YUZc2s7DrpAiHB21/V+E1rHUrVNokkvB6bqMzT0VfV6/86ZNabt1k14YOIaT7nDvOX3Iiw==",
      "peer": true
    },
    "node_modules/globals": {
      "version": "13.24.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-13.24.0.tgz",
      "integrity": "sha512-AhO5QUcj8llrbG09iWhPU2B204J1xnPeL8kQmVorSsy+Sjj1sk8gIyh6cUocGmH4L0UuhAJy+hJMRA4mgA4mFQ==",
      "dependencies": {
        "type-fest": "^0.20.2"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/globalthis": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/globalthis/-/globalthis-1.0.3.tgz",
      "integrity": "sha512-sFdI5LyBiNTHjRd7cGPWapiHWMOXKyuBNX/cWJ3NfzrZQVa8GI/8cofCl74AOVqq9W5kNmguTIzJ/1s2gyI9wA==",
      "dependencies": {
        "define-properties": "^1.1.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/globby": {
      "version": "11.1.0",
      "resolved": "https://registry.npmjs.org/globby/-/globby-11.1.0.tgz",
      "integrity": "sha512-jhIXaOzy1sb8IyocaruWSn1TjmnBVs8Ayhcy83rmxNJ8q2uWKCAj3CnJY+KpGSXCueAPc0i05kVvVKtP1t9S3g==",
      "dependencies": {
        "array-union": "^2.1.0",
        "dir-glob": "^3.0.1",
        "fast-glob": "^3.2.9",
        "ignore": "^5.2.0",
        "merge2": "^1.4.1",
        "slash": "^3.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/goober": {
      "version": "2.1.14",
      "resolved": "https://registry.npmjs.org/goober/-/goober-2.1.14.tgz",
      "integrity": "sha512-4UpC0NdGyAFqLNPnhCT2iHpza2q+RAY3GV85a/mRPdzyPQMsj0KmMMuetdIkzWRbJ+Hgau1EZztq8ImmiMGhsg==",
      "peerDependencies": {
        "csstype": "^3.0.10"
      }
    },
    "node_modules/gopd": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.0.1.tgz",
      "integrity": "sha512-d65bNlIadxvpb/A2abVdlqKqV563juRnZ1Wtk6s1sIR8uNsXR70xqIzVqxVf1eTqDunwT2MkczEeaezCKTZhwA==",
      "dependencies": {
        "get-intrinsic": "^1.1.3"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ=="
    },
    "node_modules/graphemer": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/graphemer/-/graphemer-1.4.0.tgz",
      "integrity": "sha512-EtKwoO6kxCL9WO5xipiHTZlSzBm7WLT627TqC/uVRd0HKmq8NXyebnNYxDoBi7wt8eTWrUrKXCOVaFq9x1kgag=="
    },
    "node_modules/has-bigints": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-bigints/-/has-bigints-1.0.2.tgz",
      "integrity": "sha512-tSvCKtBr9lkF0Ex0aQiP9N+OpV4zi2r/Nee5VkRDbaqv35RLYMzbwQfFSZZH0kR+Rd6302UJZ2p/bJCEoR3VoQ==",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/has-property-descriptors": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-property-descriptors/-/has-property-descriptors-1.0.2.tgz",
      "integrity": "sha512-55JNKuIW+vq4Ke1BjOTjM2YctQIvCT7GFzHwmfZPGo5wnrgkid0YQtnAleFSqumZm4az3n2BS+erby5ipJdgrg==",
      "dependencies": {
        "es-define-property": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-proto": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/has-proto/-/has-proto-1.0.3.tgz",
      "integrity": "sha512-SJ1amZAJUiZS+PhsVLf5tGydlaVB8EdFpaSO4gmiUKUOxk8qzn5AIy4ZeJUmh22znIdk/uMAUT2pl3FxzVUH+Q==",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.0.3.tgz",
      "integrity": "sha512-l3LCuF6MgDNwTDKkdYGEihYjt5pRPbEg46rtlmnSPlUbgmB8LOIrKJbYYFBSbnPaJexMKtiPO8hmeRjRz2Td+A==",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.2.tgz",
      "integrity": "sha512-0hJU9SCPvmMzIBdZFqNPXWa6dqh7WdH0cII9y+CyS8rG3nL48Bclra9HmKhVVUHyPWNH5Y7xDwAB7bfgSjkUMQ==",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/hast-util-parse-selector": {
      "version": "2.2.5",
      "resolved": "https://registry.npmjs.org/hast-util-parse-selector/-/hast-util-parse-selector-2.2.5.tgz",
      "integrity": "sha512-7j6mrk/qqkSehsM92wQjdIgWM2/BW61u/53G6xmC8i1OmEdKLHbk419QKQUjz6LglWsfqoiHmyMRkP1BGjecNQ==",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/hast-util-to-estree": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/hast-util-to-estree/-/hast-util-to-estree-2.3.3.tgz",
      "integrity": "sha512-ihhPIUPxN0v0w6M5+IiAZZrn0LH2uZomeWwhn7uP7avZC6TE7lIiEh2yBMPr5+zi1aUCXq6VoYRgs2Bw9xmycQ==",
      "dependencies": {
        "@types/estree": "^1.0.0",
        "@types/estree-jsx": "^1.0.0",
        "@types/hast": "^2.0.0",
        "@types/unist": "^2.0.0",
        "comma-separated-tokens": "^2.0.0",
        "estree-util-attach-comments": "^2.0.0",
        "estree-util-is-identifier-name": "^2.0.0",
        "hast-util-whitespace": "^2.0.0",
        "mdast-util-mdx-expression": "^1.0.0",
        "mdast-util-mdxjs-esm": "^1.0.0",
        "property-information": "^6.0.0",
        "space-separated-tokens": "^2.0.0",
        "style-to-object": "^0.4.1",
        "unist-util-position": "^4.0.0",
        "zwitch": "^2.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/hast-util-whitespace": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/hast-util-whitespace/-/hast-util-whitespace-2.0.1.tgz",
      "integrity": "sha512-nAxA0v8+vXSBDt3AnRUNjyRIQ0rD+ntpbAp4LnPkumc5M9yUbSMa4XDU9Q6etY4f1Wp4bNgvc1yjiZtsTTrSng==",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/hastscript": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/hastscript/-/hastscript-6.0.0.tgz",
      "integrity": "sha512-nDM6bvd7lIqDUiYEiu5Sl/+6ReP0BMk/2f4U/Rooccxkj0P5nm+acM5PrGJ/t5I8qPGiqZSE6hVAwZEdZIvP4w==",
      "dependencies": {
        "@types/hast": "^2.0.0",
        "comma-separated-tokens": "^1.0.0",
        "hast-util-parse-selector": "^2.0.0",
        "property-information": "^5.0.0",
        "space-separated-tokens": "^1.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/hastscript/node_modules/comma-separated-tokens": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/comma-separated-tokens/-/comma-separated-tokens-1.0.8.tgz",
      "integrity": "sha512-GHuDRO12Sypu2cV70d1dkA2EUmXHgntrzbpvOB+Qy+49ypNfGgFQIC2fhhXbnyrJRynDCAARsT7Ou0M6hirpfw==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/hastscript/node_modules/property-information": {
      "version": "5.6.0",
      "resolved": "https://registry.npmjs.org/property-information/-/property-information-5.6.0.tgz",
      "integrity": "sha512-YUHSPk+A30YPv+0Qf8i9Mbfe/C0hdPXk1s1jPVToV8pk8BQtpw10ct89Eo7OWkutrwqvT0eicAxlOg3dOAu8JA==",
      "dependencies": {
        "xtend": "^4.0.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/hastscript/node_modules/space-separated-tokens": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/space-separated-tokens/-/space-separated-tokens-1.1.5.tgz",
      "integrity": "sha512-q/JSVd1Lptzhf5bkYm4ob4iWPjx0KiRe3sRFBNrVqbJkFaBm5vbbowy1mymoPNLRa52+oadOhJ+K49wsSeSjTA==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/highlight.js": {
      "version": "10.7.3",
      "resolved": "https://registry.npmjs.org/highlight.js/-/highlight.js-10.7.3.tgz",
      "integrity": "sha512-tzcUFauisWKNHaRkN4Wjl/ZA07gENAjFl3J/c480dprkGTg5EQstgaNFqBfUqCq54kZRIEcreTsAgF/m2quD7A==",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/ignore": {
      "version": "5.3.1",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.3.1.tgz",
      "integrity": "sha512-5Fytz/IraMjqpwfd34ke28PTVMjZjJG2MPn5t7OE4eUCUNf8BAa7b5WUS9/Qvr6mwOQS7Mk6vdsMno5he+T8Xw==",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/import-fresh": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.0.tgz",
      "integrity": "sha512-veYYhQa+D1QBKznvhUHxb8faxlrwUnxseDAbAp457E0wLNio2bOSKnjYDhMj+YiAq61xrMGhQk9iXVk5FzgQMw==",
      "dependencies": {
        "parent-module": "^1.0.0",
        "resolve-from": "^4.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
      "integrity": "sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==",
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/inflight": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/inflight/-/inflight-1.0.6.tgz",
      "integrity": "sha512-k92I/b08q4wvFscXCLvqfsHCrjrF7yiXsQuIVvVE7N82W3+aqpzuUdBbfhWcy/FZR3/4IgflMgKLOsvPDrGCJA==",
      "dependencies": {
        "once": "^1.3.0",
        "wrappy": "1"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ=="
    },
    "node_modules/inline-style-parser": {
      "version": "0.1.1",
      "resolved": "https://registry.npmjs.org/inline-style-parser/-/inline-style-parser-0.1.1.tgz",
      "integrity": "sha512-7NXolsK4CAS5+xvdj5OMMbI962hU/wvwoxk+LWR9Ek9bVtyuuYScDN6eS0rUm6TxApFpw7CX1o4uJzcd4AyD3Q=="
    },
    "node_modules/internal-slot": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/internal-slot/-/internal-slot-1.0.7.tgz",
      "integrity": "sha512-NGnrKwXzSms2qUUih/ILZ5JBqNTSa1+ZmP6flaIp6KmSElgE9qdndzS3cqjrDovwFdmwsGsLdeFgB6suw+1e9g==",
      "dependencies": {
        "es-errors": "^1.3.0",
        "hasown": "^2.0.0",
        "side-channel": "^1.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/is-alphabetical": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-alphabetical/-/is-alphabetical-1.0.4.tgz",
      "integrity": "sha512-DwzsA04LQ10FHTZuL0/grVDk4rFoVH1pjAToYwBrHSxcrBIGQuXrQMtD5U1b0U2XVgKZCTLLP8u2Qxqhy3l2Vg==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/is-alphanumerical": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-alphanumerical/-/is-alphanumerical-1.0.4.tgz",
      "integrity": "sha512-UzoZUr+XfVz3t3v4KyGEniVL9BDRoQtY7tOyrRybkVNjDFWyo1yhXNGrrBTQxp3ib9BLAWs7k2YKBQsFRkZG9A==",
      "dependencies": {
        "is-alphabetical": "^1.0.0",
        "is-decimal": "^1.0.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/is-array-buffer": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/is-array-buffer/-/is-array-buffer-3.0.4.tgz",
      "integrity": "sha512-wcjaerHw0ydZwfhiKbXJWLDY8A7yV7KhjQOpb83hGgGfId/aQa4TOvwyzn2PuswW2gPCYEL/nEAiSVpdOj1lXw==",
      "dependencies": {
        "call-bind": "^1.0.2",
        "get-intrinsic": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-arrayish": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/is-arrayish/-/is-arrayish-0.3.2.tgz",
      "integrity": "sha512-eVRqCvVlZbuw3GrM63ovNSNAeA1K16kaR/LRY/92w0zxQ5/1YzwblUX652i4Xs9RwAGjW9d9y6X88t8OaAJfWQ==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/is-async-function": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/is-async-function/-/is-async-function-2.0.0.tgz",
      "integrity": "sha512-Y1JXKrfykRJGdlDwdKlLpLyMIiWqWvuSd17TvZk68PLAOGOoF4Xyav1z0Xhoi+gCYjZVeC5SI+hYFOfvXmGRCA==",
      "dependencies": {
        "has-tostringtag": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-bigint": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-bigint/-/is-bigint-1.0.4.tgz",
      "integrity": "sha512-zB9CruMamjym81i2JZ3UMn54PKGsQzsJeo6xvN3HJJ4CAsQNB6iRutp2To77OfCNuoxspsIhzaPoO1zyCEhFOg==",
      "dependencies": {
        "has-bigints": "^1.0.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-binary-path": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/is-binary-path/-/is-binary-path-2.1.0.tgz",
      "integrity": "sha512-ZMERYes6pDydyuGidse7OsHxtbI7WVeUEozgR/g7rd0xUimYNlvZRE/K2MgZTjWy725IfelLeVcEM97mmtRGXw==",
      "dev": true,
      "dependencies": {
        "binary-extensions": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-boolean-object": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/is-boolean-object/-/is-boolean-object-1.1.2.tgz",
      "integrity": "sha512-gDYaKHJmnj4aWxyj6YHyXVpdQawtVLHU5cb+eztPGczf6cjuTdwve5ZIEfgXqH4e57An1D1AKf8CZ3kYrQRqYA==",
      "dependencies": {
        "call-bind": "^1.0.2",
        "has-tostringtag": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-buffer": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/is-buffer/-/is-buffer-2.0.5.tgz",
      "integrity": "sha512-i2R6zNFDwgEHJyQUtJEk0XFi1i0dPFn/oqjK3/vPCcDeJvW5NQ83V8QbicfF1SupOaB0h8ntgBC2YiE7dfyctQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/is-callable": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/is-callable/-/is-callable-1.2.7.tgz",
      "integrity": "sha512-1BC0BVFhS/p0qtw6enp8e+8OD0UrK0oFLztSjNzhcKA3WDuJxxAPXzPuPtKkjEY9UUoEWlX/8fgKeu2S8i9JTA==",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-core-module": {
      "version": "2.13.1",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.13.1.tgz",
      "integrity": "sha512-hHrIjvZsftOsvKSn2TRYl63zvxsgE0K+0mYMoH6gD4omR5IWB2KynivBQczo3+wF1cCkjzvptnI9Q0sPU66ilw==",
      "dependencies": {
        "hasown": "^2.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-data-view": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/is-data-view/-/is-data-view-1.0.1.tgz",
      "integrity": "sha512-AHkaJrsUVW6wq6JS8y3JnM/GJF/9cf+k20+iDzlSaJrinEo5+7vRiteOSwBhHRiAyQATN1AmY4hwzxJKPmYf+w==",
      "dependencies": {
        "is-typed-array": "^1.1.13"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-date-object": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/is-date-object/-/is-date-object-1.0.5.tgz",
      "integrity": "sha512-9YQaSxsAiSwcvS33MBk3wTCVnWK+HhF8VZR2jRxehM16QcVOdHqPn4VPHmRK4lSr38n9JriurInLcP90xsYNfQ==",
      "dependencies": {
        "has-tostringtag": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-decimal": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-decimal/-/is-decimal-1.0.4.tgz",
      "integrity": "sha512-RGdriMmQQvZ2aqaQq3awNA6dCGtKpiDFcOzrTWrDAT2MiWrKQVPmxLGHl7Y2nNu6led0kEyoX0enY0qXYsv9zw==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-finalizationregistry": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/is-finalizationregistry/-/is-finalizationregistry-1.0.2.tgz",
      "integrity": "sha512-0by5vtUJs8iFQb5TYUHHPudOR+qXYIMKtiUzvLIZITZUjknFmziyBJuLhVRc+Ds0dREFlskDNJKYIdIzu/9pfw==",
      "dependencies": {
        "call-bind": "^1.0.2"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-generator-function": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/is-generator-function/-/is-generator-function-1.0.10.tgz",
      "integrity": "sha512-jsEjy9l3yiXEQ+PsXdmBwEPcOxaXWLspKdplFUVI9vq1iZgIekeC0L167qeu86czQaxed3q/Uzuw0swL0irL8A==",
      "dependencies": {
        "has-tostringtag": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-hexadecimal": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-hexadecimal/-/is-hexadecimal-1.0.4.tgz",
      "integrity": "sha512-gyPJuv83bHMpocVYoqof5VDiZveEoGoFL8m3BXNb2VW8Xs+rz9kqO8LOQ5DH6EsuvilT1ApazU0pyl+ytbPtlw==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/is-map": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-map/-/is-map-2.0.3.tgz",
      "integrity": "sha512-1Qed0/Hr2m+YqxnM09CjA2d/i6YZNfF6R2oRAOj36eUdS6qIV/huPJNSEpKbupewFs+ZsJlxsjjPbc0/afW6Lw==",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-negative-zero": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-negative-zero/-/is-negative-zero-2.0.3.tgz",
      "integrity": "sha512-5KoIu2Ngpyek75jXodFvnafB6DJgr3u8uuK0LEZJjrU19DrMD3EVERaR8sjz8CCGgpZvxPl9SuE1GMVPFHx1mw==",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/is-number-object": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/is-number-object/-/is-number-object-1.0.7.tgz",
      "integrity": "sha512-k1U0IRzLMo7ZlYIfzRu23Oh6MiIFasgpb9X76eqfFZAqwH44UI4KTBvBYIZ1dSL9ZzChTB9ShHfLkR4pdW5krQ==",
      "dependencies": {
        "has-tostringtag": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-path-inside": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/is-path-inside/-/is-path-inside-3.0.3.tgz",
      "integrity": "sha512-Fd4gABb+ycGAmKou8eMftCupSir5lRxqf4aD/vd0cD2qc4HL07OjCeuHMr8Ro4CoMaeCKDB0/ECBOVWjTwUvPQ==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-plain-obj": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/is-plain-obj/-/is-plain-obj-4.1.0.tgz",
      "integrity": "sha512-+Pgi+vMuUNkJyExiMBt5IlFoMyKnr5zhJ4Uspz58WOhBF5QoIZkFyNHIbBAtHwzVAgk5RtndVNsDRN61/mmDqg==",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-reference": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/is-reference/-/is-reference-3.0.2.tgz",
      "integrity": "sha512-v3rht/LgVcsdZa3O2Nqs+NMowLOxeOm7Ay9+/ARQ2F+qEoANRcqrjAZKGN0v8ymUetZGgkp26LTnGT7H0Qo9Pg==",
      "dependencies": {
        "@types/estree": "*"
      }
    },
    "node_modules/is-regex": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/is-regex/-/is-regex-1.1.4.tgz",
      "integrity": "sha512-kvRdxDsxZjhzUX07ZnLydzS1TU/TJlTUHHY4YLL87e37oUA49DfkLqgy+VjFocowy29cKvcSiu+kIv728jTTVg==",
      "dependencies": {
        "call-bind": "^1.0.2",
        "has-tostringtag": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-set": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-set/-/is-set-2.0.3.tgz",
      "integrity": "sha512-iPAjerrse27/ygGLxw+EBR9agv9Y6uLeYVJMu+QNCoouJ1/1ri0mGrcWpfCqFZuzzx3WjtwxG098X+n4OuRkPg==",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-shared-array-buffer": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/is-shared-array-buffer/-/is-shared-array-buffer-1.0.3.tgz",
      "integrity": "sha512-nA2hv5XIhLR3uVzDDfCIknerhx8XUKnstuOERPNNIinXG7v9u+ohXF67vxm4TPTEPU6lm61ZkwP3c9PCB97rhg==",
      "dependencies": {
        "call-bind": "^1.0.7"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-string": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/is-string/-/is-string-1.0.7.tgz",
      "integrity": "sha512-tE2UXzivje6ofPW7l23cjDOMa09gb7xlAqG6jG5ej6uPV32TlWP3NKPigtaGeHNu9fohccRYvIiZMfOOnOYUtg==",
      "dependencies": {
        "has-tostringtag": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-symbol": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-symbol/-/is-symbol-1.0.4.tgz",
      "integrity": "sha512-C/CPBqKWnvdcxqIARxyOh4v1UUEOCHpgDa0WYgpKDFMszcrPcffg5uhwSgPCLD2WWxmq6isisz87tzT01tuGhg==",
      "dependencies": {
        "has-symbols": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-typed-array": {
      "version": "1.1.13",
      "resolved": "https://registry.npmjs.org/is-typed-array/-/is-typed-array-1.1.13.tgz",
      "integrity": "sha512-uZ25/bUAlUY5fR4OKT4rZQEBrzQWYV9ZJYGGsUmEJ6thodVJ1HX64ePQ6Z0qPWP+m+Uq6e9UugrE38jeYsDSMw==",
      "dependencies": {
        "which-typed-array": "^1.1.14"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakmap": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/is-weakmap/-/is-weakmap-2.0.2.tgz",
      "integrity": "sha512-K5pXYOm9wqY1RgjpL3YTkF39tni1XajUIkawTLUo9EZEVUFga5gSQJF8nNS7ZwJQ02y+1YCNYcMh+HIf1ZqE+w==",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakref": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/is-weakref/-/is-weakref-1.0.2.tgz",
      "integrity": "sha512-qctsuLZmIQ0+vSSMfoVvyFe2+GSEvnmZ2ezTup1SBse9+twCCeial6EEi3Nc2KFcf6+qz2FBPnjXsk8xhKSaPQ==",
      "dependencies": {
        "call-bind": "^1.0.2"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakset": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-weakset/-/is-weakset-2.0.3.tgz",
      "integrity": "sha512-LvIm3/KWzS9oRFHugab7d+M/GcBXuXX5xZkzPmN+NxihdQlZUQ4dWuSV1xR/sq6upL1TJEDrfBgRepHFdBtSNQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "get-intrinsic": "^1.2.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/isarray": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/isarray/-/isarray-2.0.5.tgz",
      "integrity": "sha512-xHjhDr3cNBK0BzdUJSPXZntQUx/mwMS5Rw4A7lPJ90XGAO6ISP/ePDNuo0vhqOZU+UD5JoodwCAAoZQd3FeAKw=="
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw=="
    },
    "node_modules/iterator.prototype": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/iterator.prototype/-/iterator.prototype-1.1.2.tgz",
      "integrity": "sha512-DR33HMMr8EzwuRL8Y9D3u2BMj8+RqSE850jfGu59kS7tbmPLzGkZmVSfyCFSDxuZiEY6Rzt3T2NA/qU+NwVj1w==",
      "dependencies": {
        "define-properties": "^1.2.1",
        "get-intrinsic": "^1.2.1",
        "has-symbols": "^1.0.3",
        "reflect.getprototypeof": "^1.0.4",
        "set-function-name": "^2.0.1"
      }
    },
    "node_modules/jackspeak": {
      "version": "2.3.6",
      "resolved": "https://registry.npmjs.org/jackspeak/-/jackspeak-2.3.6.tgz",
      "integrity": "sha512-N3yCS/NegsOBokc8GAdM8UcmfsKiSS8cipheD/nivzr700H+nsMOxJjQnvwOcRYVuFkdH0wGUvW2WbXGmrZGbQ==",
      "dev": true,
      "dependencies": {
        "@isaacs/cliui": "^8.0.2"
      },
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      },
      "optionalDependencies": {
        "@pkgjs/parseargs": "^0.11.0"
      }
    },
    "node_modules/jest-diff": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-diff/-/jest-diff-29.7.0.tgz",
      "integrity": "sha512-LMIgiIrhigmPrs03JHpxUh2yISK3vLFPkAodPeo0+BuF7wA2FoQbkEg1u8gBYBThncu7e1oEDUfIXVuTqLRUjw==",
      "dev": true,
      "dependencies": {
        "chalk": "^4.0.0",
        "diff-sequences": "^29.6.3",
        "jest-get-type": "^29.6.3",
        "pretty-format": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-get-type": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/jest-get-type/-/jest-get-type-29.6.3.tgz",
      "integrity": "sha512-zrteXnqYxfQh7l5FHyL38jL39di8H8rHoecLH3JNxH3BwOrBsNeabdap5e0I23lD4HHI8W5VFBZqG4Eaq5LNcw==",
      "dev": true,
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-matcher-utils": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-matcher-utils/-/jest-matcher-utils-29.7.0.tgz",
      "integrity": "sha512-sBkD+Xi9DtcChsI3L3u0+N0opgPYnCRPtGcQYrgXmR+hmt/fYfWAL0xRXYU8eWOdfuLgBe0YCW3AFtnRLagq/g==",
      "dev": true,
      "dependencies": {
        "chalk": "^4.0.0",
        "jest-diff": "^29.7.0",
        "jest-get-type": "^29.6.3",
        "pretty-format": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-message-util": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-message-util/-/jest-message-util-29.7.0.tgz",
      "integrity": "sha512-GBEV4GRADeP+qtB2+6u61stea8mGcOT4mCtrYISZwfu9/ISHFJ/5zOMXYbpBE9RsS5+Gb63DW4FgmnKJ79Kf6w==",
      "dev": true,
      "dependencies": {
        "@babel/code-frame": "^7.12.13",
        "@jest/types": "^29.6.3",
        "@types/stack-utils": "^2.0.0",
        "chalk": "^4.0.0",
        "graceful-fs": "^4.2.9",
        "micromatch": "^4.0.4",
        "pretty-format": "^29.7.0",
        "slash": "^3.0.0",
        "stack-utils": "^2.0.3"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-util": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-util/-/jest-util-29.7.0.tgz",
      "integrity": "sha512-z6EbKajIpqGKU56y5KBUgy1dt1ihhQJgWzUlZHArA/+X2ad7Cb5iF+AK1EWVL/Bo7Rz9uurpqw6SiBCefUbCGA==",
      "dev": true,
      "dependencies": {
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "chalk": "^4.0.0",
        "ci-info": "^3.2.0",
        "graceful-fs": "^4.2.9",
        "picomatch": "^2.2.3"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-worker": {
      "version": "27.5.1",
      "resolved": "https://registry.npmjs.org/jest-worker/-/jest-worker-27.5.1.tgz",
      "integrity": "sha512-7vuh85V5cdDofPyxn58nrPjBktZo0u9x1g8WtjQol+jZDaE+fhN+cIvTj11GndBnMnyfrUOG1sZQxCdjKh+DKg==",
      "peer": true,
      "dependencies": {
        "@types/node": "*",
        "merge-stream": "^2.0.0",
        "supports-color": "^8.0.0"
      },
      "engines": {
        "node": ">= 10.13.0"
      }
    },
    "node_modules/jest-worker/node_modules/supports-color": {
      "version": "8.1.1",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-8.1.1.tgz",
      "integrity": "sha512-MpUEN2OodtUzxvKQl72cUF7RQ5EiHsGvSsVG0ia9c5RbWGL2CI4C7EpPS8UTBIplnlzZiNuV56w+FuNxy3ty2Q==",
      "peer": true,
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/supports-color?sponsor=1"
      }
    },
    "node_modules/jiti": {
      "version": "1.21.0",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-1.21.0.tgz",
      "integrity": "sha512-gFqAIbuKyyso/3G2qhiO2OM6shY6EPP/R0+mkDbyspxKazh8BXDC5FiFsUjlczgdNz/vfra0da2y+aHrusLG/Q==",
      "dev": true,
      "bin": {
        "jiti": "bin/jiti.js"
      }
    },
    "node_modules/jose": {
      "version": "4.15.5",
      "resolved": "https://registry.npmjs.org/jose/-/jose-4.15.5.tgz",
      "integrity": "sha512-jc7BFxgKPKi94uOvEmzlSWFFe2+vASyXaKUpdQKatWAESU2MWjDfFf0fdfc83CDKcA5QecabZeNLyfhe3yKNkg==",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ=="
    },
    "node_modules/js-yaml": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.1.0.tgz",
      "integrity": "sha512-wpxZs9NoxZaJESJGIZTyDEaYpl0FKSA+FB9aJiyemKhMwkxQg63h4T1KJgUGHpTqPDNRcmmYLugrRjJlBtWvRA==",
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/json-buffer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/json-buffer/-/json-buffer-3.0.1.tgz",
      "integrity": "sha512-4bV5BfR2mqfQTJm+V5tPPdf+ZpuhiIvTuAB5g8kcrXOZpTT/QwwVRWBywX1ozr6lEuPdbHxwaJlm9G6mI2sfSQ=="
    },
    "node_modules/json-parse-even-better-errors": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/json-parse-even-better-errors/-/json-parse-even-better-errors-2.3.1.tgz",
      "integrity": "sha512-xyFwyhro/JEof6Ghe2iz2NcXoj2sloNsWr/XsERDK/oiPCfaNhl5ONfp+jQdAZRQQ0IJWNzH9zIZF7li91kh2w==",
      "peer": true
    },
    "node_modules/json-schema-traverse": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg=="
    },
    "node_modules/json-stable-stringify-without-jsonify": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/json-stable-stringify-without-jsonify/-/json-stable-stringify-without-jsonify-1.0.1.tgz",
      "integrity": "sha512-Bdboy+l7tA3OGW6FjyFHWkP5LuByj1Tk33Ljyq0axyzdk9//JSi2u3fP1QSmd1KNwq6VOKYGlAu87CisVir6Pw=="
    },
    "node_modules/json5": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/json5/-/json5-1.0.2.tgz",
      "integrity": "sha512-g1MWMLBiz8FKi1e4w0UyVL3w+iJceWAFBAaBnnGKOpNa5f8TLktkbre1+s6oICydWAm+HRUGTmI+//xv2hvXYA==",
      "dependencies": {
        "minimist": "^1.2.0"
      },
      "bin": {
        "json5": "lib/cli.js"
      }
    },
    "node_modules/jsx-ast-utils": {
      "version": "3.3.5",
      "resolved": "https://registry.npmjs.org/jsx-ast-utils/-/jsx-ast-utils-3.3.5.tgz",
      "integrity": "sha512-ZZow9HBI5O6EPgSJLUb8n2NKgmVWTwCvHGwFuJlMjvLFqlGG6pjirPhtdsseaLZjSibD8eegzmYpUZwoIlj2cQ==",
      "dependencies": {
        "array-includes": "^3.1.6",
        "array.prototype.flat": "^1.3.1",
        "object.assign": "^4.1.4",
        "object.values": "^1.1.6"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/kareem": {
      "version": "2.5.1",
      "resolved": "https://registry.npmjs.org/kareem/-/kareem-2.5.1.tgz",
      "integrity": "sha512-7jFxRVm+jD+rkq3kY0iZDJfsO2/t4BBPeEb2qKn2lR/9KhuksYk5hxzfRYWMPV8P/x2d0kHD306YyWLzjjH+uA==",
      "dev": true,
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/keyv": {
      "version": "4.5.4",
      "resolved": "https://registry.npmjs.org/keyv/-/keyv-4.5.4.tgz",
      "integrity": "sha512-oxVHkHR/EJf2CNXnWxRLW6mg7JyCCUcG0DtEGmL2ctUo1PNTin1PUil+r/+4r5MpVgC/fn1kjsx7mjSujKqIpw==",
      "dependencies": {
        "json-buffer": "3.0.1"
      }
    },
    "node_modules/kleur": {
      "version": "4.1.5",
      "resolved": "https://registry.npmjs.org/kleur/-/kleur-4.1.5.tgz",
      "integrity": "sha512-o+NO+8WrRiQEE4/7nwRJhN1HWpVmJm511pBHUxPLtp0BUISzlBplORYSmTclCnJvQq2tKu/sgl3xVpkc7ZWuQQ==",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/language-subtag-registry": {
      "version": "0.3.22",
      "resolved": "https://registry.npmjs.org/language-subtag-registry/-/language-subtag-registry-0.3.22.tgz",
      "integrity": "sha512-tN0MCzyWnoz/4nHS6uxdlFWoUZT7ABptwKPQ52Ea7URk6vll88bWBVhodtnlfEuCcKWNGoc+uGbw1cwa9IKh/w=="
    },
    "node_modules/language-tags": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/language-tags/-/language-tags-1.0.9.tgz",
      "integrity": "sha512-MbjN408fEndfiQXbFQ1vnd+1NoLDsnQW41410oQBXiyXDMYH5z505juWa4KUE1LqxRC7DgOgZDbKLxHIwm27hA==",
      "dependencies": {
        "language-subtag-registry": "^0.3.20"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/levn": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/levn/-/levn-0.4.1.tgz",
      "integrity": "sha512-+bT2uH4E5LGE7h/n3evcS/sQlJXCpIp6ym8OWJ5eV6+67Dsql/LaaT7qJBAt2rzfoa/5QBGBhxDix1dMt2kQKQ==",
      "dependencies": {
        "prelude-ls": "^1.2.1",
        "type-check": "~0.4.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/lilconfig": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/lilconfig/-/lilconfig-2.1.0.tgz",
      "integrity": "sha512-utWOt/GHzuUxnLKxB6dk81RoOeoNeHgbrXiuGk4yyF5qlRz+iIVWu56E2fqGHFrXz0QNUhLB/8nKqvRH66JKGQ==",
      "dev": true,
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/lines-and-columns": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-1.2.4.tgz",
      "integrity": "sha512-7ylylesZQ/PV29jhEDl3Ufjo6ZX7gCqJr5F7PKrqc93v7fzSymt1BpwEU8nAUXs8qzzvqhbjhK5QZg6Mt/HkBg==",
      "dev": true
    },
    "node_modules/loader-runner": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/loader-runner/-/loader-runner-4.3.0.tgz",
      "integrity": "sha512-3R/1M+yS3j5ou80Me59j7F9IMs4PXs3VqRrm0TU3AbKPxlmpoY1TNscJV/oGJXo8qCatFGTfDbY6W6ipGOYXfg==",
      "peer": true,
      "engines": {
        "node": ">=6.11.5"
      }
    },
    "node_modules/locate-path": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
      "dependencies": {
        "p-locate": "^5.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/lodash.merge": {
      "version": "4.6.2",
      "resolved": "https://registry.npmjs.org/lodash.merge/-/lodash.merge-4.6.2.tgz",
      "integrity": "sha512-0KpjqXRVvrYyCsX1swR/XTK0va6VQkQM6MNo7PqW77ByjAhoARA8EfrP1N4+KlKj8YS0ZUCtRT/YUuhyYDujIQ=="
    },
    "node_modules/longest-streak": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/longest-streak/-/longest-streak-3.1.0.tgz",
      "integrity": "sha512-9Ri+o0JYgehTaVBBDoMqIl8GXtbWg711O3srftcHhZ0dqnETqLaoIK0x17fUw9rFSlK/0NlsKe0Ahhyl5pXE2g==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/loose-envify": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
      "dependencies": {
        "js-tokens": "^3.0.0 || ^4.0.0"
      },
      "bin": {
        "loose-envify": "cli.js"
      }
    },
    "node_modules/lowlight": {
      "version": "1.20.0",
      "resolved": "https://registry.npmjs.org/lowlight/-/lowlight-1.20.0.tgz",
      "integrity": "sha512-8Ktj+prEb1RoCPkEOrPMYUN/nCggB7qAWe3a7OpMjWQkh3l2RD5wKRQ+o8Q8YuI9RG/xs95waaI/E6ym/7NsTw==",
      "dependencies": {
        "fault": "^1.0.0",
        "highlight.js": "~10.7.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/mailgun.js": {
      "version": "9.4.1",
      "resolved": "https://registry.npmjs.org/mailgun.js/-/mailgun.js-9.4.1.tgz",
      "integrity": "sha512-PUXZvSR6MImDHIf/EhF7uajkv2pP0fbwVfKnRCQ2xDO8uR731U6pWkGHscUxebDkU8tsLb+0zCH5t1+KP6cX3g==",
      "dependencies": {
        "axios": "^1.6.0",
        "base-64": "^1.0.0",
        "url-join": "^4.0.1"
      }
    },
    "node_modules/markdown-extensions": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/markdown-extensions/-/markdown-extensions-1.1.1.tgz",
      "integrity": "sha512-WWC0ZuMzCyDHYCasEGs4IPvLyTGftYwh6wIEOULOF0HXcqZlhwRzrK0w2VUlxWA98xnvb/jszw4ZSkJ6ADpM6Q==",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/mdast-util-definitions": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/mdast-util-definitions/-/mdast-util-definitions-5.1.2.tgz",
      "integrity": "sha512-8SVPMuHqlPME/z3gqVwWY4zVXn8lqKv/pAhC57FuJ40ImXyBpmO5ukh98zB2v7Blql2FiHjHv9LVztSIqjY+MA==",
      "dependencies": {
        "@types/mdast": "^3.0.0",
        "@types/unist": "^2.0.0",
        "unist-util-visit": "^4.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/mdast-util-from-markdown": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/mdast-util-from-markdown/-/mdast-util-from-markdown-1.3.1.tgz",
      "integrity": "sha512-4xTO/M8c82qBcnQc1tgpNtubGUW/Y1tBQ1B0i5CtSoelOLKFYlElIr3bvgREYYO5iRqbMY1YuqZng0GVOI8Qww==",
      "dependencies": {
        "@types/mdast": "^3.0.0",
        "@types/unist": "^2.0.0",
        "decode-named-character-reference": "^1.0.0",
        "mdast-util-to-string": "^3.1.0",
        "micromark": "^3.0.0",
        "micromark-util-decode-numeric-character-reference": "^1.0.0",
        "micromark-util-decode-string": "^1.0.0",
        "micromark-util-normalize-identifier": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0",
        "unist-util-stringify-position": "^3.0.0",
        "uvu": "^0.5.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/mdast-util-mdx": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/mdast-util-mdx/-/mdast-util-mdx-2.0.1.tgz",
      "integrity": "sha512-38w5y+r8nyKlGvNjSEqWrhG0w5PmnRA+wnBvm+ulYCct7nsGYhFVb0lljS9bQav4psDAS1eGkP2LMVcZBi/aqw==",
      "dependencies": {
        "mdast-util-from-markdown": "^1.0.0",
        "mdast-util-mdx-expression": "^1.0.0",
        "mdast-util-mdx-jsx": "^2.0.0",
        "mdast-util-mdxjs-esm": "^1.0.0",
        "mdast-util-to-markdown": "^1.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/mdast-util-mdx-expression": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/mdast-util-mdx-expression/-/mdast-util-mdx-expression-1.3.2.tgz",
      "integrity": "sha512-xIPmR5ReJDu/DHH1OoIT1HkuybIfRGYRywC+gJtI7qHjCJp/M9jrmBEJW22O8lskDWm562BX2W8TiAwRTb0rKA==",
      "dependencies": {
        "@types/estree-jsx": "^1.0.0",
        "@types/hast": "^2.0.0",
        "@types/mdast": "^3.0.0",
        "mdast-util-from-markdown": "^1.0.0",
        "mdast-util-to-markdown": "^1.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/mdast-util-mdx-jsx": {
      "version": "2.1.4",
      "resolved": "https://registry.npmjs.org/mdast-util-mdx-jsx/-/mdast-util-mdx-jsx-2.1.4.tgz",
      "integrity": "sha512-DtMn9CmVhVzZx3f+optVDF8yFgQVt7FghCRNdlIaS3X5Bnym3hZwPbg/XW86vdpKjlc1PVj26SpnLGeJBXD3JA==",
      "dependencies": {
        "@types/estree-jsx": "^1.0.0",
        "@types/hast": "^2.0.0",
        "@types/mdast": "^3.0.0",
        "@types/unist": "^2.0.0",
        "ccount": "^2.0.0",
        "mdast-util-from-markdown": "^1.1.0",
        "mdast-util-to-markdown": "^1.3.0",
        "parse-entities": "^4.0.0",
        "stringify-entities": "^4.0.0",
        "unist-util-remove-position": "^4.0.0",
        "unist-util-stringify-position": "^3.0.0",
        "vfile-message": "^3.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/mdast-util-mdx-jsx/node_modules/character-entities-legacy": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/character-entities-legacy/-/character-entities-legacy-3.0.0.tgz",
      "integrity": "sha512-RpPp0asT/6ufRm//AJVwpViZbGM/MkjQFxJccQRHmISF/22NBtsHqAWmL+/pmkPWoIUJdWyeVleTl1wydHATVQ==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/mdast-util-mdx-jsx/node_modules/character-reference-invalid": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/character-reference-invalid/-/character-reference-invalid-2.0.1.tgz",
      "integrity": "sha512-iBZ4F4wRbyORVsu0jPV7gXkOsGYjGHPmAyv+HiHG8gi5PtC9KI2j1+v8/tlibRvjoWX027ypmG/n0HtO5t7unw==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/mdast-util-mdx-jsx/node_modules/is-alphabetical": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/is-alphabetical/-/is-alphabetical-2.0.1.tgz",
      "integrity": "sha512-FWyyY60MeTNyeSRpkM2Iry0G9hpr7/9kD40mD/cGQEuilcZYS4okz8SN2Q6rLCJ8gbCt6fN+rC+6tMGS99LaxQ==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/mdast-util-mdx-jsx/node_modules/is-alphanumerical": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/is-alphanumerical/-/is-alphanumerical-2.0.1.tgz",
      "integrity": "sha512-hmbYhX/9MUMF5uh7tOXyK/n0ZvWpad5caBA17GsC6vyuCqaWliRG5K1qS9inmUhEMaOBIW7/whAnSwveW/LtZw==",
      "dependencies": {
        "is-alphabetical": "^2.0.0",
        "is-decimal": "^2.0.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/mdast-util-mdx-jsx/node_modules/is-decimal": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/is-decimal/-/is-decimal-2.0.1.tgz",
      "integrity": "sha512-AAB9hiomQs5DXWcRB1rqsxGUstbRroFOPPVAomNk/3XHR5JyEZChOyTWe2oayKnsSsr/kcGqF+z6yuH6HHpN0A==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/mdast-util-mdx-jsx/node_modules/is-hexadecimal": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/is-hexadecimal/-/is-hexadecimal-2.0.1.tgz",
      "integrity": "sha512-DgZQp241c8oO6cA1SbTEWiXeoxV42vlcJxgH+B3hi1AiqqKruZR3ZGF8In3fj4+/y/7rHvlOZLZtgJ/4ttYGZg==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/mdast-util-mdx-jsx/node_modules/parse-entities": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/parse-entities/-/parse-entities-4.0.1.tgz",
      "integrity": "sha512-SWzvYcSJh4d/SGLIOQfZ/CoNv6BTlI6YEQ7Nj82oDVnRpwe/Z/F1EMx42x3JAOwGBlCjeCH0BRJQbQ/opHL17w==",
      "dependencies": {
        "@types/unist": "^2.0.0",
        "character-entities": "^2.0.0",
        "character-entities-legacy": "^3.0.0",
        "character-reference-invalid": "^2.0.0",
        "decode-named-character-reference": "^1.0.0",
        "is-alphanumerical": "^2.0.0",
        "is-decimal": "^2.0.0",
        "is-hexadecimal": "^2.0.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/mdast-util-mdxjs-esm": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/mdast-util-mdxjs-esm/-/mdast-util-mdxjs-esm-1.3.1.tgz",
      "integrity": "sha512-SXqglS0HrEvSdUEfoXFtcg7DRl7S2cwOXc7jkuusG472Mmjag34DUDeOJUZtl+BVnyeO1frIgVpHlNRWc2gk/w==",
      "dependencies": {
        "@types/estree-jsx": "^1.0.0",
        "@types/hast": "^2.0.0",
        "@types/mdast": "^3.0.0",
        "mdast-util-from-markdown": "^1.0.0",
        "mdast-util-to-markdown": "^1.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/mdast-util-phrasing": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/mdast-util-phrasing/-/mdast-util-phrasing-3.0.1.tgz",
      "integrity": "sha512-WmI1gTXUBJo4/ZmSk79Wcb2HcjPJBzM1nlI/OUWA8yk2X9ik3ffNbBGsU+09BFmXaL1IBb9fiuvq6/KMiNycSg==",
      "dependencies": {
        "@types/mdast": "^3.0.0",
        "unist-util-is": "^5.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/mdast-util-to-hast": {
      "version": "12.3.0",
      "resolved": "https://registry.npmjs.org/mdast-util-to-hast/-/mdast-util-to-hast-12.3.0.tgz",
      "integrity": "sha512-pits93r8PhnIoU4Vy9bjW39M2jJ6/tdHyja9rrot9uujkN7UTU9SDnE6WNJz/IGyQk3XHX6yNNtrBH6cQzm8Hw==",
      "dependencies": {
        "@types/hast": "^2.0.0",
        "@types/mdast": "^3.0.0",
        "mdast-util-definitions": "^5.0.0",
        "micromark-util-sanitize-uri": "^1.1.0",
        "trim-lines": "^3.0.0",
        "unist-util-generated": "^2.0.0",
        "unist-util-position": "^4.0.0",
        "unist-util-visit": "^4.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/mdast-util-to-markdown": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/mdast-util-to-markdown/-/mdast-util-to-markdown-1.5.0.tgz",
      "integrity": "sha512-bbv7TPv/WC49thZPg3jXuqzuvI45IL2EVAr/KxF0BSdHsU0ceFHOmwQn6evxAh1GaoK/6GQ1wp4R4oW2+LFL/A==",
      "dependencies": {
        "@types/mdast": "^3.0.0",
        "@types/unist": "^2.0.0",
        "longest-streak": "^3.0.0",
        "mdast-util-phrasing": "^3.0.0",
        "mdast-util-to-string": "^3.0.0",
        "micromark-util-decode-string": "^1.0.0",
        "unist-util-visit": "^4.0.0",
        "zwitch": "^2.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/mdast-util-to-string": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/mdast-util-to-string/-/mdast-util-to-string-3.2.0.tgz",
      "integrity": "sha512-V4Zn/ncyN1QNSqSBxTrMOLpjr+IKdHl2v3KVLoWmDPscP4r9GcCi71gjgvUV1SFSKh92AjAG4peFuBl2/YgCJg==",
      "dependencies": {
        "@types/mdast": "^3.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/memory-pager": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/memory-pager/-/memory-pager-1.5.0.tgz",
      "integrity": "sha512-ZS4Bp4r/Zoeq6+NLJpP+0Zzm0pR8whtGPf1XExKLJBAczGMnSi3It14OiNCStjQjM6NU1okjQGSxgEZN8eBYKg==",
      "dev": true
    },
    "node_modules/merge-stream": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/merge-stream/-/merge-stream-2.0.0.tgz",
      "integrity": "sha512-abv/qOcuPfk3URPfDzmZU1LKmuw8kT+0nIHvKrKgFrwifol/doWcdA4ZqsWQ8ENrFKkd67Mfpo/LovbIUsbt3w==",
      "peer": true
    },
    "node_modules/merge2": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz",
      "integrity": "sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/micromark": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/micromark/-/micromark-3.2.0.tgz",
      "integrity": "sha512-uD66tJj54JLYq0De10AhWycZWGQNUvDI55xPgk2sQM5kn1JYlhbCMTtEeT27+vAhW2FBQxLlOmS3pmA7/2z4aA==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "@types/debug": "^4.0.0",
        "debug": "^4.0.0",
        "decode-named-character-reference": "^1.0.0",
        "micromark-core-commonmark": "^1.0.1",
        "micromark-factory-space": "^1.0.0",
        "micromark-util-character": "^1.0.0",
        "micromark-util-chunked": "^1.0.0",
        "micromark-util-combine-extensions": "^1.0.0",
        "micromark-util-decode-numeric-character-reference": "^1.0.0",
        "micromark-util-encode": "^1.0.0",
        "micromark-util-normalize-identifier": "^1.0.0",
        "micromark-util-resolve-all": "^1.0.0",
        "micromark-util-sanitize-uri": "^1.0.0",
        "micromark-util-subtokenize": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.1",
        "uvu": "^0.5.0"
      }
    },
    "node_modules/micromark-core-commonmark": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-core-commonmark/-/micromark-core-commonmark-1.1.0.tgz",
      "integrity": "sha512-BgHO1aRbolh2hcrzL2d1La37V0Aoz73ymF8rAcKnohLy93titmv62E0gP8Hrx9PKcKrqCZ1BbLGbP3bEhoXYlw==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "decode-named-character-reference": "^1.0.0",
        "micromark-factory-destination": "^1.0.0",
        "micromark-factory-label": "^1.0.0",
        "micromark-factory-space": "^1.0.0",
        "micromark-factory-title": "^1.0.0",
        "micromark-factory-whitespace": "^1.0.0",
        "micromark-util-character": "^1.0.0",
        "micromark-util-chunked": "^1.0.0",
        "micromark-util-classify-character": "^1.0.0",
        "micromark-util-html-tag-name": "^1.0.0",
        "micromark-util-normalize-identifier": "^1.0.0",
        "micromark-util-resolve-all": "^1.0.0",
        "micromark-util-subtokenize": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.1",
        "uvu": "^0.5.0"
      }
    },
    "node_modules/micromark-extension-mdx-expression": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/micromark-extension-mdx-expression/-/micromark-extension-mdx-expression-1.0.8.tgz",
      "integrity": "sha512-zZpeQtc5wfWKdzDsHRBY003H2Smg+PUi2REhqgIhdzAa5xonhP03FcXxqFSerFiNUr5AWmHpaNPQTBVOS4lrXw==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "@types/estree": "^1.0.0",
        "micromark-factory-mdx-expression": "^1.0.0",
        "micromark-factory-space": "^1.0.0",
        "micromark-util-character": "^1.0.0",
        "micromark-util-events-to-acorn": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0",
        "uvu": "^0.5.0"
      }
    },
    "node_modules/micromark-extension-mdx-jsx": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/micromark-extension-mdx-jsx/-/micromark-extension-mdx-jsx-1.0.5.tgz",
      "integrity": "sha512-gPH+9ZdmDflbu19Xkb8+gheqEDqkSpdCEubQyxuz/Hn8DOXiXvrXeikOoBA71+e8Pfi0/UYmU3wW3H58kr7akA==",
      "dependencies": {
        "@types/acorn": "^4.0.0",
        "@types/estree": "^1.0.0",
        "estree-util-is-identifier-name": "^2.0.0",
        "micromark-factory-mdx-expression": "^1.0.0",
        "micromark-factory-space": "^1.0.0",
        "micromark-util-character": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0",
        "uvu": "^0.5.0",
        "vfile-message": "^3.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/micromark-extension-mdx-md": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/micromark-extension-mdx-md/-/micromark-extension-mdx-md-1.0.1.tgz",
      "integrity": "sha512-7MSuj2S7xjOQXAjjkbjBsHkMtb+mDGVW6uI2dBL9snOBCbZmoNgDAeZ0nSn9j3T42UE/g2xVNMn18PJxZvkBEA==",
      "dependencies": {
        "micromark-util-types": "^1.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/micromark-extension-mdxjs": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/micromark-extension-mdxjs/-/micromark-extension-mdxjs-1.0.1.tgz",
      "integrity": "sha512-7YA7hF6i5eKOfFUzZ+0z6avRG52GpWR8DL+kN47y3f2KhxbBZMhmxe7auOeaTBrW2DenbbZTf1ea9tA2hDpC2Q==",
      "dependencies": {
        "acorn": "^8.0.0",
        "acorn-jsx": "^5.0.0",
        "micromark-extension-mdx-expression": "^1.0.0",
        "micromark-extension-mdx-jsx": "^1.0.0",
        "micromark-extension-mdx-md": "^1.0.0",
        "micromark-extension-mdxjs-esm": "^1.0.0",
        "micromark-util-combine-extensions": "^1.0.0",
        "micromark-util-types": "^1.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/micromark-extension-mdxjs-esm": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/micromark-extension-mdxjs-esm/-/micromark-extension-mdxjs-esm-1.0.5.tgz",
      "integrity": "sha512-xNRBw4aoURcyz/S69B19WnZAkWJMxHMT5hE36GtDAyhoyn/8TuAeqjFJQlwk+MKQsUD7b3l7kFX+vlfVWgcX1w==",
      "dependencies": {
        "@types/estree": "^1.0.0",
        "micromark-core-commonmark": "^1.0.0",
        "micromark-util-character": "^1.0.0",
        "micromark-util-events-to-acorn": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0",
        "unist-util-position-from-estree": "^1.1.0",
        "uvu": "^0.5.0",
        "vfile-message": "^3.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/micromark-factory-destination": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-factory-destination/-/micromark-factory-destination-1.1.0.tgz",
      "integrity": "sha512-XaNDROBgx9SgSChd69pjiGKbV+nfHGDPVYFs5dOoDd7ZnMAE+Cuu91BCpsY8RT2NP9vo/B8pds2VQNCLiu0zhg==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-character": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0"
      }
    },
    "node_modules/micromark-factory-label": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-factory-label/-/micromark-factory-label-1.1.0.tgz",
      "integrity": "sha512-OLtyez4vZo/1NjxGhcpDSbHQ+m0IIGnT8BoPamh+7jVlzLJBH98zzuCoUeMxvM6WsNeh8wx8cKvqLiPHEACn0w==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-character": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0",
        "uvu": "^0.5.0"
      }
    },
    "node_modules/micromark-factory-mdx-expression": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/micromark-factory-mdx-expression/-/micromark-factory-mdx-expression-1.0.9.tgz",
      "integrity": "sha512-jGIWzSmNfdnkJq05c7b0+Wv0Kfz3NJ3N4cBjnbO4zjXIlxJr+f8lk+5ZmwFvqdAbUy2q6B5rCY//g0QAAaXDWA==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "@types/estree": "^1.0.0",
        "micromark-util-character": "^1.0.0",
        "micromark-util-events-to-acorn": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0",
        "unist-util-position-from-estree": "^1.0.0",
        "uvu": "^0.5.0",
        "vfile-message": "^3.0.0"
      }
    },
    "node_modules/micromark-factory-space": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-factory-space/-/micromark-factory-space-1.1.0.tgz",
      "integrity": "sha512-cRzEj7c0OL4Mw2v6nwzttyOZe8XY/Z8G0rzmWQZTBi/jjwyw/U4uqKtUORXQrR5bAZZnbTI/feRV/R7hc4jQYQ==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-character": "^1.0.0",
        "micromark-util-types": "^1.0.0"
      }
    },
    "node_modules/micromark-factory-title": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-factory-title/-/micromark-factory-title-1.1.0.tgz",
      "integrity": "sha512-J7n9R3vMmgjDOCY8NPw55jiyaQnH5kBdV2/UXCtZIpnHH3P6nHUKaH7XXEYuWwx/xUJcawa8plLBEjMPU24HzQ==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-factory-space": "^1.0.0",
        "micromark-util-character": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0"
      }
    },
    "node_modules/micromark-factory-whitespace": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-factory-whitespace/-/micromark-factory-whitespace-1.1.0.tgz",
      "integrity": "sha512-v2WlmiymVSp5oMg+1Q0N1Lxmt6pMhIHD457whWM7/GUlEks1hI9xj5w3zbc4uuMKXGisksZk8DzP2UyGbGqNsQ==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-factory-space": "^1.0.0",
        "micromark-util-character": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0"
      }
    },
    "node_modules/micromark-util-character": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/micromark-util-character/-/micromark-util-character-1.2.0.tgz",
      "integrity": "sha512-lXraTwcX3yH/vMDaFWCQJP1uIszLVebzUa3ZHdrgxr7KEU/9mL4mVgCpGbyhvNLNlauROiNUq7WN5u7ndbY6xg==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0"
      }
    },
    "node_modules/micromark-util-chunked": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-chunked/-/micromark-util-chunked-1.1.0.tgz",
      "integrity": "sha512-Ye01HXpkZPNcV6FiyoW2fGZDUw4Yc7vT0E9Sad83+bEDiCJ1uXu0S3mr8WLpsz3HaG3x2q0HM6CTuPdcZcluFQ==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-symbol": "^1.0.0"
      }
    },
    "node_modules/micromark-util-classify-character": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-classify-character/-/micromark-util-classify-character-1.1.0.tgz",
      "integrity": "sha512-SL0wLxtKSnklKSUplok1WQFoGhUdWYKggKUiqhX+Swala+BtptGCu5iPRc+xvzJ4PXE/hwM3FNXsfEVgoZsWbw==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-character": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0"
      }
    },
    "node_modules/micromark-util-combine-extensions": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-combine-extensions/-/micromark-util-combine-extensions-1.1.0.tgz",
      "integrity": "sha512-Q20sp4mfNf9yEqDL50WwuWZHUrCO4fEyeDCnMGmG5Pr0Cz15Uo7KBs6jq+dq0EgX4DPwwrh9m0X+zPV1ypFvUA==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-chunked": "^1.0.0",
        "micromark-util-types": "^1.0.0"
      }
    },
    "node_modules/micromark-util-decode-numeric-character-reference": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-decode-numeric-character-reference/-/micromark-util-decode-numeric-character-reference-1.1.0.tgz",
      "integrity": "sha512-m9V0ExGv0jB1OT21mrWcuf4QhP46pH1KkfWy9ZEezqHKAxkj4mPCy3nIH1rkbdMlChLHX531eOrymlwyZIf2iw==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-symbol": "^1.0.0"
      }
    },
    "node_modules/micromark-util-decode-string": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-decode-string/-/micromark-util-decode-string-1.1.0.tgz",
      "integrity": "sha512-YphLGCK8gM1tG1bd54azwyrQRjCFcmgj2S2GoJDNnh4vYtnL38JS8M4gpxzOPNyHdNEpheyWXCTnnTDY3N+NVQ==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "decode-named-character-reference": "^1.0.0",
        "micromark-util-character": "^1.0.0",
        "micromark-util-decode-numeric-character-reference": "^1.0.0",
        "micromark-util-symbol": "^1.0.0"
      }
    },
    "node_modules/micromark-util-encode": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-encode/-/micromark-util-encode-1.1.0.tgz",
      "integrity": "sha512-EuEzTWSTAj9PA5GOAs992GzNh2dGQO52UvAbtSOMvXTxv3Criqb6IOzJUBCmEqrrXSblJIJBbFFv6zPxpreiJw==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ]
    },
    "node_modules/micromark-util-events-to-acorn": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/micromark-util-events-to-acorn/-/micromark-util-events-to-acorn-1.2.3.tgz",
      "integrity": "sha512-ij4X7Wuc4fED6UoLWkmo0xJQhsktfNh1J0m8g4PbIMPlx+ek/4YdW5mvbye8z/aZvAPUoxgXHrwVlXAPKMRp1w==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "@types/acorn": "^4.0.0",
        "@types/estree": "^1.0.0",
        "@types/unist": "^2.0.0",
        "estree-util-visit": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0",
        "uvu": "^0.5.0",
        "vfile-message": "^3.0.0"
      }
    },
    "node_modules/micromark-util-html-tag-name": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/micromark-util-html-tag-name/-/micromark-util-html-tag-name-1.2.0.tgz",
      "integrity": "sha512-VTQzcuQgFUD7yYztuQFKXT49KghjtETQ+Wv/zUjGSGBioZnkA4P1XXZPT1FHeJA6RwRXSF47yvJ1tsJdoxwO+Q==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ]
    },
    "node_modules/micromark-util-normalize-identifier": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-normalize-identifier/-/micromark-util-normalize-identifier-1.1.0.tgz",
      "integrity": "sha512-N+w5vhqrBihhjdpM8+5Xsxy71QWqGn7HYNUvch71iV2PM7+E3uWGox1Qp90loa1ephtCxG2ftRV/Conitc6P2Q==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-symbol": "^1.0.0"
      }
    },
    "node_modules/micromark-util-resolve-all": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-resolve-all/-/micromark-util-resolve-all-1.1.0.tgz",
      "integrity": "sha512-b/G6BTMSg+bX+xVCshPTPyAu2tmA0E4X98NSR7eIbeC6ycCqCeE7wjfDIgzEbkzdEVJXRtOG4FbEm/uGbCRouA==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-types": "^1.0.0"
      }
    },
    "node_modules/micromark-util-sanitize-uri": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/micromark-util-sanitize-uri/-/micromark-util-sanitize-uri-1.2.0.tgz",
      "integrity": "sha512-QO4GXv0XZfWey4pYFndLUKEAktKkG5kZTdUNaTAkzbuJxn2tNBOr+QtxR2XpWaMhbImT2dPzyLrPXLlPhph34A==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-character": "^1.0.0",
        "micromark-util-encode": "^1.0.0",
        "micromark-util-symbol": "^1.0.0"
      }
    },
    "node_modules/micromark-util-subtokenize": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-subtokenize/-/micromark-util-subtokenize-1.1.0.tgz",
      "integrity": "sha512-kUQHyzRoxvZO2PuLzMt2P/dwVsTiivCK8icYTeR+3WgbuPqfHgPPy7nFKbeqRivBvn/3N3GBiNC+JRTMSxEC7A==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ],
      "dependencies": {
        "micromark-util-chunked": "^1.0.0",
        "micromark-util-symbol": "^1.0.0",
        "micromark-util-types": "^1.0.0",
        "uvu": "^0.5.0"
      }
    },
    "node_modules/micromark-util-symbol": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-symbol/-/micromark-util-symbol-1.1.0.tgz",
      "integrity": "sha512-uEjpEYY6KMs1g7QfJ2eX1SQEV+ZT4rUD3UcF6l57acZvLNK7PBZL+ty82Z1qhK1/yXIY4bdx04FKMgR0g4IAag==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ]
    },
    "node_modules/micromark-util-types": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/micromark-util-types/-/micromark-util-types-1.1.0.tgz",
      "integrity": "sha512-ukRBgie8TIAcacscVHSiddHjO4k/q3pnedmzMQ4iwDcK0FtFCohKOlFbaOL/mPgfnPsL3C1ZyxJa4sbWrBl3jg==",
      "funding": [
        {
          "type": "GitHub Sponsors",
          "url": "https://github.com/sponsors/unifiedjs"
        },
        {
          "type": "OpenCollective",
          "url": "https://opencollective.com/unified"
        }
      ]
    },
    "node_modules/micromatch": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.5.tgz",
      "integrity": "sha512-DMy+ERcEW2q8Z2Po+WNXuw3c5YaUSFjAO5GsJqfEl7UjvtIuFKO6ZrKvcItdy98dwFI2N1tg3zNIdKaQT+aNdA==",
      "dependencies": {
        "braces": "^3.0.2",
        "picomatch": "^2.3.1"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/minimatch": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/minimist": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/minimist/-/minimist-1.2.8.tgz",
      "integrity": "sha512-2yyAR8qBkN3YuheJanUpWC5U3bb5osDywNB8RzDVlDwDHbocAJveqqj1u8+SVD7jkWT4yvsHCpWqqWqAxb0zCA==",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/minipass": {
      "version": "7.0.4",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-7.0.4.tgz",
      "integrity": "sha512-jYofLM5Dam9279rdkWzqHozUo4ybjdZmCsDHePy5V/PbBcVMiSZR97gmAy45aqi8CK1lG2ECd356FU86avfwUQ==",
      "dev": true,
      "engines": {
        "node": ">=16 || 14 >=14.17"
      }
    },
    "node_modules/mongodb": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/mongodb/-/mongodb-6.3.0.tgz",
      "integrity": "sha512-tt0KuGjGtLUhLoU263+xvQmPHEGTw5LbcNC73EoFRYgSHwZt5tsoJC110hDyO1kjQzpgNrpdcSza9PknWN4LrA==",
      "dev": true,
      "dependencies": {
        "@mongodb-js/saslprep": "^1.1.0",
        "bson": "^6.2.0",
        "mongodb-connection-string-url": "^3.0.0"
      },
      "engines": {
        "node": ">=16.20.1"
      },
      "peerDependencies": {
        "@aws-sdk/credential-providers": "^3.188.0",
        "@mongodb-js/zstd": "^1.1.0",
        "gcp-metadata": "^5.2.0",
        "kerberos": "^2.0.1",
        "mongodb-client-encryption": ">=6.0.0 <7",
        "snappy": "^7.2.2",
        "socks": "^2.7.1"
      },
      "peerDependenciesMeta": {
        "@aws-sdk/credential-providers": {
          "optional": true
        },
        "@mongodb-js/zstd": {
          "optional": true
        },
        "gcp-metadata": {
          "optional": true
        },
        "kerberos": {
          "optional": true
        },
        "mongodb-client-encryption": {
          "optional": true
        },
        "snappy": {
          "optional": true
        },
        "socks": {
          "optional": true
        }
      }
    },
    "node_modules/mongodb-connection-string-url": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/mongodb-connection-string-url/-/mongodb-connection-string-url-3.0.0.tgz",
      "integrity": "sha512-t1Vf+m1I5hC2M5RJx/7AtxgABy1cZmIPQRMXw+gEIPn/cZNF3Oiy+l0UIypUwVB5trcWHq3crg2g3uAR9aAwsQ==",
      "dev": true,
      "dependencies": {
        "@types/whatwg-url": "^11.0.2",
        "whatwg-url": "^13.0.0"
      }
    },
    "node_modules/mongodb-connection-string-url/node_modules/tr46": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-4.1.1.tgz",
      "integrity": "sha512-2lv/66T7e5yNyhAAC4NaKe5nVavzuGJQVVtRYLyQ2OI8tsJ61PMLlelehb0wi2Hx6+hT/OJUWZcw8MjlSRnxvw==",
      "dev": true,
      "dependencies": {
        "punycode": "^2.3.0"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/mongodb-connection-string-url/node_modules/webidl-conversions": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-7.0.0.tgz",
      "integrity": "sha512-VwddBukDzu71offAQR975unBIGqfKZpM+8ZX6ySk8nYhVoo5CYaZyzt3YBvYtRtO+aoGlqxPg/B87NGVZ/fu6g==",
      "dev": true,
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/mongodb-connection-string-url/node_modules/whatwg-url": {
      "version": "13.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-13.0.0.tgz",
      "integrity": "sha512-9WWbymnqj57+XEuqADHrCJ2eSXzn8WXIW/YSGaZtb2WKAInQ6CHfaUUcTyyver0p8BDg5StLQq8h1vtZuwmOig==",
      "dev": true,
      "dependencies": {
        "tr46": "^4.1.1",
        "webidl-conversions": "^7.0.0"
      },
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/mongoose": {
      "version": "8.2.4",
      "resolved": "https://registry.npmjs.org/mongoose/-/mongoose-8.2.4.tgz",
      "integrity": "sha512-da/r6zpG+2eAXuhBGUnL6jcBd03zlytoCc5/wq+LyTsmrY9hhPQmSpnugwnfqldtBmUOhB6iMLoV4hNtHRq+ww==",
      "dev": true,
      "dependencies": {
        "bson": "^6.2.0",
        "kareem": "2.5.1",
        "mongodb": "6.3.0",
        "mpath": "0.9.0",
        "mquery": "5.0.0",
        "ms": "2.1.3",
        "sift": "16.0.1"
      },
      "engines": {
        "node": ">=16.20.1"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/mongoose"
      }
    },
    "node_modules/mongoose/node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "dev": true
    },
    "node_modules/motion-dom": {
      "version": "12.10.1",
      "resolved": "https://registry.npmjs.org/motion-dom/-/motion-dom-12.10.1.tgz",
      "integrity": "sha512-rY8DNqgKh4LeFSQBkuXpe/7sycYS9RM+4luukjHpHogF1liSvIp0Hedx0q2QsWNz+AHuZ5bZQ9j9QZSUCA8bbw==",
      "license": "MIT",
      "dependencies": {
        "motion-utils": "^12.9.4"
      }
    },
    "node_modules/motion-utils": {
      "version": "12.9.4",
      "resolved": "https://registry.npmjs.org/motion-utils/-/motion-utils-12.9.4.tgz",
      "integrity": "sha512-BW3I65zeM76CMsfh3kHid9ansEJk9Qvl+K5cu4DVHKGsI52n76OJ4z2CUJUV+Mn3uEP9k1JJA3tClG0ggSrRcg==",
      "license": "MIT"
    },
    "node_modules/mpath": {
      "version": "0.9.0",
      "resolved": "https://registry.npmjs.org/mpath/-/mpath-0.9.0.tgz",
      "integrity": "sha512-ikJRQTk8hw5DEoFVxHG1Gn9T/xcjtdnOKIU1JTmGjZZlg9LST2mBLmcX3/ICIbgJydT2GOc15RnNy5mHmzfSew==",
      "dev": true,
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/mquery": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/mquery/-/mquery-5.0.0.tgz",
      "integrity": "sha512-iQMncpmEK8R8ncT8HJGsGc9Dsp8xcgYMVSbs5jgnm1lFHTZqMJTUWTDx1LBO8+mK3tPNZWFLBghQEIOULSTHZg==",
      "dev": true,
      "dependencies": {
        "debug": "4.x"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/mri": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/mri/-/mri-1.2.0.tgz",
      "integrity": "sha512-tzzskb3bG8LvYGFF/mDTpq3jpI6Q9wc3LEmBaghu+DdCssd1FakN7Bc0hVNmEyGq1bq3RgfkCb3cmQLpNPOroA==",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/ms": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.2.tgz",
      "integrity": "sha512-sGkPx+VjMtmA6MX27oA4FBFELFCZZ4S4XqeGOXCv68tT+jb3vk/RyaKWP0PTKyWtmLSM0b+adUTEvbs1PEaH2w=="
    },
    "node_modules/mz": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/mz/-/mz-2.7.0.tgz",
      "integrity": "sha512-z81GNO7nnYMEhrGh9LeymoE4+Yr0Wn5McHIZMK5cfQCl+NDX08sCZgUc9/6MHni9IWuFLm1Z3HTCXu2z9fN62Q==",
      "dev": true,
      "dependencies": {
        "any-promise": "^1.0.0",
        "object-assign": "^4.0.1",
        "thenify-all": "^1.0.0"
      }
    },
    "node_modules/nanoid": {
      "version": "3.3.7",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.7.tgz",
      "integrity": "sha512-eSRppjcPIatRIMC1U6UngP8XFcz8MQWGQdt1MTBQ7NaAmvXDfvNxbvWV3x2y6CdEUciCSsDHDQZbhYaB8QEo2g==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/natural-compare": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
      "integrity": "sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw=="
    },
    "node_modules/neo-async": {
      "version": "2.6.2",
      "resolved": "https://registry.npmjs.org/neo-async/-/neo-async-2.6.2.tgz",
      "integrity": "sha512-Yd3UES5mWCSqR+qNT93S3UoYUkqAZ9lLg8a7g9rimsWmYGK8cVToA4/sF3RrshdyV3sAGMXVUmpMYOw+dLpOuw==",
      "peer": true
    },
    "node_modules/next": {
      "version": "15.3.2",
      "resolved": "https://registry.npmjs.org/next/-/next-15.3.2.tgz",
      "integrity": "sha512-CA3BatMyHkxZ48sgOCLdVHjFU36N7TF1HhqAHLFOkV6buwZnvMI84Cug8xD56B9mCuKrqXnLn94417GrZ/jjCQ==",
      "license": "MIT",
      "dependencies": {
        "@next/env": "15.3.2",
        "@swc/counter": "0.1.3",
        "@swc/helpers": "0.5.15",
        "busboy": "1.6.0",
        "caniuse-lite": "^1.0.30001579",
        "postcss": "8.4.31",
        "styled-jsx": "5.1.6"
      },
      "bin": {
        "next": "dist/bin/next"
      },
      "engines": {
        "node": "^18.18.0 || ^19.8.0 || >= 20.0.0"
      },
      "optionalDependencies": {
        "@next/swc-darwin-arm64": "15.3.2",
        "@next/swc-darwin-x64": "15.3.2",
        "@next/swc-linux-arm64-gnu": "15.3.2",
        "@next/swc-linux-arm64-musl": "15.3.2",
        "@next/swc-linux-x64-gnu": "15.3.2",
        "@next/swc-linux-x64-musl": "15.3.2",
        "@next/swc-win32-arm64-msvc": "15.3.2",
        "@next/swc-win32-x64-msvc": "15.3.2",
        "sharp": "^0.34.1"
      },
      "peerDependencies": {
        "@opentelemetry/api": "^1.1.0",
        "@playwright/test": "^1.41.2",
        "babel-plugin-react-compiler": "*",
        "react": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
        "react-dom": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
        "sass": "^1.3.0"
      },
      "peerDependenciesMeta": {
        "@opentelemetry/api": {
          "optional": true
        },
        "@playwright/test": {
          "optional": true
        },
        "babel-plugin-react-compiler": {
          "optional": true
        },
        "sass": {
          "optional": true
        }
      }
    },
    "node_modules/next-plausible": {
      "version": "3.12.0",
      "resolved": "https://registry.npmjs.org/next-plausible/-/next-plausible-3.12.0.tgz",
      "integrity": "sha512-SSkEqKQ6PgR8fx3sYfIAT69k2xuCUXO5ngkSS19CjxY97lAoZxsfZpYednxB4zo0mHYv87JzhPynrdBPlCBVHg==",
      "funding": {
        "url": "https://github.com/4lejandrito/next-plausible?sponsor=1"
      },
      "peerDependencies": {
        "next": "^11.1.0 || ^12.0.0 || ^13.0.0 || ^14.0.0",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0",
        "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0"
      }
    },
    "node_modules/next-sitemap": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/next-sitemap/-/next-sitemap-4.2.3.tgz",
      "integrity": "sha512-vjdCxeDuWDzldhCnyFCQipw5bfpl4HmZA7uoo3GAaYGjGgfL4Cxb1CiztPuWGmS+auYs7/8OekRS8C2cjdAsjQ==",
      "funding": [
        {
          "url": "https://github.com/iamvishnusankar/next-sitemap.git"
        }
      ],
      "dependencies": {
        "@corex/deepmerge": "^4.0.43",
        "@next/env": "^13.4.3",
        "fast-glob": "^3.2.12",
        "minimist": "^1.2.8"
      },
      "bin": {
        "next-sitemap": "bin/next-sitemap.mjs",
        "next-sitemap-cjs": "bin/next-sitemap.cjs"
      },
      "engines": {
        "node": ">=14.18"
      },
      "peerDependencies": {
        "next": "*"
      }
    },
    "node_modules/next-sitemap/node_modules/@next/env": {
      "version": "13.5.6",
      "resolved": "https://registry.npmjs.org/@next/env/-/env-13.5.6.tgz",
      "integrity": "sha512-Yac/bV5sBGkkEXmAX5FWPS9Mmo2rthrOPRQQNfycJPkjUAUclomCPH7QFVCDQ4Mp2k2K1SSM6m0zrxYrOwtFQw=="
    },
    "node_modules/next/node_modules/postcss": {
      "version": "8.4.31",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.4.31.tgz",
      "integrity": "sha512-PS08Iboia9mts/2ygV3eLpY5ghnUcfLV/EXTOW1E2qYxJKGGBUtNjN76FYHnMs36RmARn41bC0AZmn+rR0OVpQ==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "dependencies": {
        "nanoid": "^3.3.6",
        "picocolors": "^1.0.0",
        "source-map-js": "^1.0.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/nextjs-toploader": {
      "version": "1.6.11",
      "resolved": "https://registry.npmjs.org/nextjs-toploader/-/nextjs-toploader-1.6.11.tgz",
      "integrity": "sha512-2mt+YDj3I7s8JGv136TRdJo9amd2BBeb2u1U4tyvZpR08eqeBgqp3xsw2Yu1AUT7C3NZQhbQN11EXwnlqsPEIA==",
      "dependencies": {
        "@types/nprogress": "^0.2.2",
        "nprogress": "^0.2.0",
        "prop-types": "^15.8.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/TheSGJ"
      },
      "peerDependencies": {
        "next": ">= 6.0.0",
        "react": ">= 16.0.0",
        "react-dom": ">= 16.0.0"
      }
    },
    "node_modules/node-releases": {
      "version": "2.0.14",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.14.tgz",
      "integrity": "sha512-y10wOWt8yZpqXmOgRo77WaHEmhYQYGNA6y421PKsKYWEK8aW+cqAphborZDhqfyKrbZEN92CN1X2KbafY2s7Yw=="
    },
    "node_modules/nodemailer": {
      "version": "6.9.13",
      "resolved": "https://registry.npmjs.org/nodemailer/-/nodemailer-6.9.13.tgz",
      "integrity": "sha512-7o38Yogx6krdoBf3jCAqnIN4oSQFx+fMa0I7dK1D+me9kBxx12D+/33wSb+fhOCtIxvYJ+4x4IMEhmhCKfAiOA==",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/normalize-path": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
      "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/normalize-range": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/normalize-range/-/normalize-range-0.1.2.tgz",
      "integrity": "sha512-bdok/XvKII3nUpklnV6P2hxtMNrCboOjAcyBuQnWEhO665FwrSNRxU+AqpsyvO6LgGYPspN+lu5CLtw4jPRKNA==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/nprogress": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/nprogress/-/nprogress-0.2.0.tgz",
      "integrity": "sha512-I19aIingLgR1fmhftnbWWO3dXc0hSxqHQHQb3H8m+K3TnEn/iSeTZZOyvKXWqQESMwuUVnatlCnZdLBZZt2VSA=="
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-hash": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/object-hash/-/object-hash-3.0.0.tgz",
      "integrity": "sha512-RSn9F68PjH9HqtltsSnqYC1XXoWe9Bju5+213R98cNGttag9q9yAOTzdbsqvIa7aNm5WffBZFpWYr2aWrklWAw==",
      "dev": true,
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.1",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.1.tgz",
      "integrity": "sha512-5qoj1RUiKOMsCCNLV1CBiPYE10sziTsnmNxkAI/rZhiD63CF7IqdFGC/XzjWjpSgLf0LxXX3bDFIh0E18f6UhQ==",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object-keys": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-1.1.1.tgz",
      "integrity": "sha512-NuAESUOUMrlIXOfHKzD6bpPu3tYt3xvjNdRIQ+FeT0lNb4K8WR70CaDxhuNguS2XG+GjkyMwOzsN5ZktImfhLA==",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.assign": {
      "version": "4.1.5",
      "resolved": "https://registry.npmjs.org/object.assign/-/object.assign-4.1.5.tgz",
      "integrity": "sha512-byy+U7gp+FVwmyzKPYhW2h5l3crpmGsxl7X2s8y43IgxvG4g3QZ6CffDtsNQy1WsmZpQbO+ybo0AlW7TY6DcBQ==",
      "dependencies": {
        "call-bind": "^1.0.5",
        "define-properties": "^1.2.1",
        "has-symbols": "^1.0.3",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object.entries": {
      "version": "1.1.8",
      "resolved": "https://registry.npmjs.org/object.entries/-/object.entries-1.1.8.tgz",
      "integrity": "sha512-cmopxi8VwRIAw/fkijJohSfpef5PdN0pMQJN6VC/ZKvn0LIknWD8KtgY6KlQdEc4tIjcQ3HxSMmnvtzIscdaYQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.fromentries": {
      "version": "2.0.8",
      "resolved": "https://registry.npmjs.org/object.fromentries/-/object.fromentries-2.0.8.tgz",
      "integrity": "sha512-k6E21FzySsSK5a21KRADBd/NGneRegFO5pLHfdQLpRDETUNJueLXs3WCzyQ3tFRDYgbq3KHGXfTbi2bs8WQ6rQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object.groupby": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/object.groupby/-/object.groupby-1.0.3.tgz",
      "integrity": "sha512-+Lhy3TQTuzXI5hevh8sBGqbmurHbbIjAi0Z4S63nthVLmLxfbj4T54a4CfZrXIrt9iP4mVAPYMo/v99taj3wjQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.hasown": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/object.hasown/-/object.hasown-1.1.4.tgz",
      "integrity": "sha512-FZ9LZt9/RHzGySlBARE3VF+gE26TxR38SdmqOqliuTnl9wrKulaQs+4dee1V+Io8VfxqzAfHu6YuRgUy8OHoTg==",
      "dependencies": {
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object.values": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/object.values/-/object.values-1.2.0.tgz",
      "integrity": "sha512-yBYjY9QX2hnRmZHAjG/f13MzmBzxzYgQhFrke06TTyKY5zSTEqkOeukBzIdVA3j3ulu8Qa3MbVFShV7T2RmGtQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/optionator": {
      "version": "0.9.3",
      "resolved": "https://registry.npmjs.org/optionator/-/optionator-0.9.3.tgz",
      "integrity": "sha512-JjCoypp+jKn1ttEFExxhetCKeJt9zhAgAve5FXHixTvFDW/5aEktX9bufBKLRRMdU7bNtpLfcGu94B3cdEJgjg==",
      "dependencies": {
        "@aashutoshrathi/word-wrap": "^1.2.3",
        "deep-is": "^0.1.3",
        "fast-levenshtein": "^2.0.6",
        "levn": "^0.4.1",
        "prelude-ls": "^1.2.1",
        "type-check": "^0.4.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
      "dependencies": {
        "p-limit": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/parent-module": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/parent-module/-/parent-module-1.0.1.tgz",
      "integrity": "sha512-GQ2EWRpQV8/o+Aw8YqtfZZPfNRWZYkbidE9k5rpl/hC3vtHHBfGm2Ifi6qWV+coDGkrUKZAxE3Lot5kcsRlh+g==",
      "dependencies": {
        "callsites": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/parse-entities": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/parse-entities/-/parse-entities-2.0.0.tgz",
      "integrity": "sha512-kkywGpCcRYhqQIchaWqZ875wzpS/bMKhz5HnN3p7wveJTkTtyAB/AlnS0f8DFSqYW1T82t6yEAkEcB+A1I3MbQ==",
      "dependencies": {
        "character-entities": "^1.0.0",
        "character-entities-legacy": "^1.0.0",
        "character-reference-invalid": "^1.0.0",
        "is-alphanumerical": "^1.0.0",
        "is-decimal": "^1.0.0",
        "is-hexadecimal": "^1.0.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/parse-entities/node_modules/character-entities": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/character-entities/-/character-entities-1.2.4.tgz",
      "integrity": "sha512-iBMyeEHxfVnIakwOuDXpVkc54HijNgCyQB2w0VfGQThle6NXn50zU6V/u+LDhxHcDUPojn6Kpga3PTAD8W1bQw==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-is-absolute": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/path-is-absolute/-/path-is-absolute-1.0.1.tgz",
      "integrity": "sha512-AVbw3UJ2e9bq64vSaS9Am0fje1Pa8pbGqTTsmXfaIiMpnr5DlDhfJOuLj9Sf95ZPVDAUerDfEk88MPmPe7UCQg==",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw=="
    },
    "node_modules/path-scurry": {
      "version": "1.10.2",
      "resolved": "https://registry.npmjs.org/path-scurry/-/path-scurry-1.10.2.tgz",
      "integrity": "sha512-7xTavNy5RQXnsjANvVvMkEjvloOinkAjv/Z6Ildz9v2RinZ4SBKTWFOVRbaF8p0vpHnyjV/UwNDdKuUv6M5qcA==",
      "dev": true,
      "dependencies": {
        "lru-cache": "^10.2.0",
        "minipass": "^5.0.0 || ^6.0.2 || ^7.0.0"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/path-scurry/node_modules/lru-cache": {
      "version": "10.2.0",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-10.2.0.tgz",
      "integrity": "sha512-2bIM8x+VAf6JT4bKAljS1qUWgMsqZRPGJS6FSahIMPVvctcNhyVp7AJu7quxOW9jwkryBReKZY5tY5JYv2n/7Q==",
      "dev": true,
      "engines": {
        "node": "14 || >=16.14"
      }
    },
    "node_modules/path-type": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-type/-/path-type-4.0.0.tgz",
      "integrity": "sha512-gDKb8aZMDeD/tZWs9P6+q0J9Mwkdl6xMV8TjnGP3qJVJ06bdMgkbBlLU8IdfOsIsFz2BW1rNVT3XuNEl8zPAvw==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/periscopic": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/periscopic/-/periscopic-3.1.0.tgz",
      "integrity": "sha512-vKiQ8RRtkl9P+r/+oefh25C3fhybptkHKCZSPlcXiJux2tJF55GnEj3BVn4A5gKfq9NWWXXrxkHBwVPUfH0opw==",
      "dependencies": {
        "@types/estree": "^1.0.0",
        "estree-walker": "^3.0.0",
        "is-reference": "^3.0.0"
      }
    },
    "node_modules/picocolors": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.0.0.tgz",
      "integrity": "sha512-1fygroTLlHu66zi26VoTDv8yRgm0Fccecssto+MhsZ0D/DGW2sm8E8AjW7NU5VVTRt5GxbeZ5qBuJr+HyLYkjQ=="
    },
    "node_modules/picomatch": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.1.tgz",
      "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pify": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/pify/-/pify-2.3.0.tgz",
      "integrity": "sha512-udgsAY+fTnvv7kI7aaxbqwWNb0AHiB0qBO89PZKPkoTmGOgdbrHDKD+0B2X4uTfJ/FT1R09r9gTsjUjNJotuog==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/pirates": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/pirates/-/pirates-4.0.6.tgz",
      "integrity": "sha512-saLsH7WeYYPiD25LDuLRRY/i+6HaPYr6G1OUlN39otzkSTxKnubR9RTxS3/Kk50s1g2JTgFwWQDQyplC5/SHZg==",
      "dev": true,
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/possible-typed-array-names": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/possible-typed-array-names/-/possible-typed-array-names-1.0.0.tgz",
      "integrity": "sha512-d7Uw+eZoloe0EHDIYoe+bQ5WXnGMOpmiZFTuMWCwpjzzkL2nTjcKiAk4hh8TjnGye2TwWOk3UXucZ+3rbmBa8Q==",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/postcss": {
      "version": "8.4.38",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.4.38.tgz",
      "integrity": "sha512-Wglpdk03BSfXkHoQa3b/oulrotAkwrlLDRSOb9D0bN86FdRyE9lppSp33aHNPgBa0JKCoB+drFLZkQoRRYae5A==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "dependencies": {
        "nanoid": "^3.3.7",
        "picocolors": "^1.0.0",
        "source-map-js": "^1.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/postcss-import": {
      "version": "15.1.0",
      "resolved": "https://registry.npmjs.org/postcss-import/-/postcss-import-15.1.0.tgz",
      "integrity": "sha512-hpr+J05B2FVYUAXHeK1YyI267J/dDDhMU6B6civm8hSY1jYJnBXxzKDKDswzJmtLHryrjhnDjqqp/49t8FALew==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.0.0",
        "read-cache": "^1.0.0",
        "resolve": "^1.1.7"
      },
      "engines": {
        "node": ">=14.0.0"
      },
      "peerDependencies": {
        "postcss": "^8.0.0"
      }
    },
    "node_modules/postcss-js": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/postcss-js/-/postcss-js-4.0.1.tgz",
      "integrity": "sha512-dDLF8pEO191hJMtlHFPRa8xsizHaM82MLfNkUHdUtVEV3tgTp5oj+8qbEqYM57SLfc74KSbw//4SeJma2LRVIw==",
      "dev": true,
      "dependencies": {
        "camelcase-css": "^2.0.1"
      },
      "engines": {
        "node": "^12 || ^14 || >= 16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/postcss/"
      },
      "peerDependencies": {
        "postcss": "^8.4.21"
      }
    },
    "node_modules/postcss-load-config": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/postcss-load-config/-/postcss-load-config-4.0.2.tgz",
      "integrity": "sha512-bSVhyJGL00wMVoPUzAVAnbEoWyqRxkjv64tUl427SKnPrENtq6hJwUojroMz2VB+Q1edmi4IfrAPpami5VVgMQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "dependencies": {
        "lilconfig": "^3.0.0",
        "yaml": "^2.3.4"
      },
      "engines": {
        "node": ">= 14"
      },
      "peerDependencies": {
        "postcss": ">=8.0.9",
        "ts-node": ">=9.0.0"
      },
      "peerDependenciesMeta": {
        "postcss": {
          "optional": true
        },
        "ts-node": {
          "optional": true
        }
      }
    },
    "node_modules/postcss-load-config/node_modules/lilconfig": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/lilconfig/-/lilconfig-3.1.1.tgz",
      "integrity": "sha512-O18pf7nyvHTckunPWCV1XUNXU1piu01y2b7ATJ0ppkUkk8ocqVWBrYjJBCwHDjD/ZWcfyrA0P4gKhzWGi5EINQ==",
      "dev": true,
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/antonk52"
      }
    },
    "node_modules/postcss-nested": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/postcss-nested/-/postcss-nested-6.0.1.tgz",
      "integrity": "sha512-mEp4xPMi5bSWiMbsgoPfcP74lsWLHkQbZc3sY+jWYd65CUwXrUaTp0fmNpa01ZcETKlIgUdFN/MpS2xZtqL9dQ==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.11"
      },
      "engines": {
        "node": ">=12.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/postcss/"
      },
      "peerDependencies": {
        "postcss": "^8.2.14"
      }
    },
    "node_modules/postcss-selector-parser": {
      "version": "6.0.16",
      "resolved": "https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-6.0.16.tgz",
      "integrity": "sha512-A0RVJrX+IUkVZbW3ClroRWurercFhieevHB38sr2+l9eUClMqome3LmEmnhlNy+5Mr2EYN6B2Kaw9wYdd+VHiw==",
      "dev": true,
      "dependencies": {
        "cssesc": "^3.0.0",
        "util-deprecate": "^1.0.2"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/postcss-value-parser": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/postcss-value-parser/-/postcss-value-parser-4.2.0.tgz",
      "integrity": "sha512-1NNCs6uurfkVbeXG4S8JFT9t19m45ICnif8zWLd5oPSZ50QnwMfK+H3jv408d4jw/7Bttv5axS5IiHoLaVNHeQ==",
      "dev": true
    },
    "node_modules/prelude-ls": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz",
      "integrity": "sha512-vkcDPrRZo1QZLbn5RLGPpg/WmIQ65qoWWhcGKf/b5eplkkarX0m9z8ppCat4mlOqUsWpyNuYgO3VRyrYHSzX5g==",
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/pretty-format": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/pretty-format/-/pretty-format-29.7.0.tgz",
      "integrity": "sha512-Pdlw/oPxN+aXdmM9R00JVC9WVFoCLTKJvDVLgmJ+qAffBMxsV85l/Lu7sNx4zSzPyoL2euImuEwHhOXdEgNFZQ==",
      "dev": true,
      "dependencies": {
        "@jest/schemas": "^29.6.3",
        "ansi-styles": "^5.0.0",
        "react-is": "^18.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/pretty-format/node_modules/ansi-styles": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-5.2.0.tgz",
      "integrity": "sha512-Cxwpt2SfTzTtXcfOlzGEee8O+c+MmUgGrNiBcXnuWxuFJHe6a5Hz7qwhwe5OgaSYI0IJvkLqWX1ASG+cJOkEiA==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/prismjs": {
      "version": "1.29.0",
      "resolved": "https://registry.npmjs.org/prismjs/-/prismjs-1.29.0.tgz",
      "integrity": "sha512-Kx/1w86q/epKcmte75LNrEoT+lX8pBpavuAbvJWRXar7Hz8jrtF+e3vY751p0R8H9HdArwaCTNDDzHg/ScJK1Q==",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/prop-types": {
      "version": "15.8.1",
      "resolved": "https://registry.npmjs.org/prop-types/-/prop-types-15.8.1.tgz",
      "integrity": "sha512-oj87CgZICdulUohogVAR7AjlC0327U4el4L6eAvOqCeudMDVU0NThNaV+b9Df4dXgSP1gXMTnPdhfe/2qDH5cg==",
      "dependencies": {
        "loose-envify": "^1.4.0",
        "object-assign": "^4.1.1",
        "react-is": "^16.13.1"
      }
    },
    "node_modules/prop-types/node_modules/react-is": {
      "version": "16.13.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-16.13.1.tgz",
      "integrity": "sha512-24e6ynE2H+OKt4kqsOvNd8kBpV65zoxbA4BVsEOB3ARVWQki/DHzaUoC5KuON/BiccDaCCTZBuOcfZs70kR8bQ=="
    },
    "node_modules/property-information": {
      "version": "6.4.1",
      "resolved": "https://registry.npmjs.org/property-information/-/property-information-6.4.1.tgz",
      "integrity": "sha512-OHYtXfu5aI2sS2LWFSN5rgJjrQ4pCy8i1jubJLe2QvMF8JJ++HXTUIVWFLfXJoaOfvYYjk2SN8J2wFUWIGXT4w==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/proxy-from-env": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/proxy-from-env/-/proxy-from-env-1.1.0.tgz",
      "integrity": "sha512-D+zkORCbA9f1tdWRK0RaCR3GPv50cMxcrz4X8k5LTSUD1Dkw47mKJEZQNunItRTkWwgtaUSo1RVFRIG9ZXiFYg=="
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/qs": {
      "version": "6.12.0",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.12.0.tgz",
      "integrity": "sha512-trVZiI6RMOkO476zLGaBIzszOdFPnCCXHPG9kn0yuS1uz6xdVxPfZdB3vUig9pxPFDM9BRAgz/YUIVQ1/vuiUg==",
      "dependencies": {
        "side-channel": "^1.0.6"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/queue-microtask": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz",
      "integrity": "sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ]
    },
    "node_modules/randombytes": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/randombytes/-/randombytes-2.1.0.tgz",
      "integrity": "sha512-vYl3iOX+4CKUWuxGi9Ukhie6fsqXqS9FE2Zaic4tNFD2N2QQaXOMFbuKK4QmDHC0JO6B1Zp41J0LpT0oR68amQ==",
      "peer": true,
      "dependencies": {
        "safe-buffer": "^5.1.0"
      }
    },
    "node_modules/react": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react/-/react-18.2.0.tgz",
      "integrity": "sha512-/3IjMdb2L9QbBdWiW5e3P2/npwMBaU9mHCSCUzNln0ZCYbcfTsGbTJrU/kGemdH2IWmB2ioZ+zkxtmq6g09fGQ==",
      "dependencies": {
        "loose-envify": "^1.1.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-dom": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-18.2.0.tgz",
      "integrity": "sha512-6IMTriUmvsjHUjNtEDudZfuDQUoWXVxKHhlEGSk81n4YFS+r/Kl99wXiwlVXtPBtJenozv2P+hxDsw9eA7Xo6g==",
      "dependencies": {
        "loose-envify": "^1.1.0",
        "scheduler": "^0.23.0"
      },
      "peerDependencies": {
        "react": "^18.2.0"
      }
    },
    "node_modules/react-hot-toast": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/react-hot-toast/-/react-hot-toast-2.4.1.tgz",
      "integrity": "sha512-j8z+cQbWIM5LY37pR6uZR6D4LfseplqnuAO4co4u8917hBUvXlEqyP1ZzqVLcqoyUesZZv/ImreoCeHVDpE5pQ==",
      "dependencies": {
        "goober": "^2.1.10"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "react": ">=16",
        "react-dom": ">=16"
      }
    },
    "node_modules/react-is": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-18.2.0.tgz",
      "integrity": "sha512-xWGDIW6x921xtzPkhiULtthJHoJvBbF3q26fzloPCK0hsvxtPVelvftw3zjbHWSkR2km9Z+4uxbDDK/6Zw9B8w==",
      "dev": true
    },
    "node_modules/react-syntax-highlighter": {
      "version": "15.5.0",
      "resolved": "https://registry.npmjs.org/react-syntax-highlighter/-/react-syntax-highlighter-15.5.0.tgz",
      "integrity": "sha512-+zq2myprEnQmH5yw6Gqc8lD55QHnpKaU8TOcFeC/Lg/MQSs8UknEA0JC4nTZGFAXC2J2Hyj/ijJ7NlabyPi2gg==",
      "dependencies": {
        "@babel/runtime": "^7.3.1",
        "highlight.js": "^10.4.1",
        "lowlight": "^1.17.0",
        "prismjs": "^1.27.0",
        "refractor": "^3.6.0"
      },
      "peerDependencies": {
        "react": ">= 0.14.0"
      }
    },
    "node_modules/react-tooltip": {
      "version": "5.26.3",
      "resolved": "https://registry.npmjs.org/react-tooltip/-/react-tooltip-5.26.3.tgz",
      "integrity": "sha512-MpYAws8CEHUd/RC4GaDCdoceph/T4KHM5vS5Dbk8FOmLMvvIht2ymP2htWdrke7K6lqPO8rz8+bnwWUIXeDlzg==",
      "dependencies": {
        "@floating-ui/dom": "^1.6.1",
        "classnames": "^2.3.0"
      },
      "peerDependencies": {
        "react": ">=16.14.0",
        "react-dom": ">=16.14.0"
      }
    },
    "node_modules/read-cache": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/read-cache/-/read-cache-1.0.0.tgz",
      "integrity": "sha512-Owdv/Ft7IjOgm/i0xvNDZ1LrRANRfew4b2prF3OWMQLxLfu3bS8FVhCsrSCMK4lR56Y9ya+AThoTpDCTxCmpRA==",
      "dev": true,
      "dependencies": {
        "pify": "^2.3.0"
      }
    },
    "node_modules/readdirp": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-3.6.0.tgz",
      "integrity": "sha512-hOS089on8RduqdbhvQ5Z37A0ESjsqz6qnRcffsMU3495FuTdqSm+7bhJ29JvIOsBDEEnan5DPu9t3To9VRlMzA==",
      "dev": true,
      "dependencies": {
        "picomatch": "^2.2.1"
      },
      "engines": {
        "node": ">=8.10.0"
      }
    },
    "node_modules/reflect.getprototypeof": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/reflect.getprototypeof/-/reflect.getprototypeof-1.0.6.tgz",
      "integrity": "sha512-fmfw4XgoDke3kdI6h4xcUz1dG8uaiv5q9gcEwLS4Pnth2kxT+GZ7YehS1JTMGBQmtV7Y4GFGbs2re2NqhdozUg==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.1",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.4",
        "globalthis": "^1.0.3",
        "which-builtin-type": "^1.1.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/refractor": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/refractor/-/refractor-3.6.0.tgz",
      "integrity": "sha512-MY9W41IOWxxk31o+YvFCNyNzdkc9M20NoZK5vq6jkv4I/uh2zkWcfudj0Q1fovjUQJrNewS9NMzeTtqPf+n5EA==",
      "dependencies": {
        "hastscript": "^6.0.0",
        "parse-entities": "^2.0.0",
        "prismjs": "~1.27.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/refractor/node_modules/prismjs": {
      "version": "1.27.0",
      "resolved": "https://registry.npmjs.org/prismjs/-/prismjs-1.27.0.tgz",
      "integrity": "sha512-t13BGPUlFDR7wRB5kQDG4jjl7XeuH6jbJGt11JHPL96qwsEHNX2+68tFXqc1/k+/jALsbSWJKUOT/hcYAZ5LkA==",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/regenerator-runtime": {
      "version": "0.14.1",
      "resolved": "https://registry.npmjs.org/regenerator-runtime/-/regenerator-runtime-0.14.1.tgz",
      "integrity": "sha512-dYnhHh0nJoMfnkZs6GmmhFknAGRrLznOu5nc9ML+EJxGvrx6H7teuevqVqCuPcPK//3eDrrjQhehXVx9cnkGdw=="
    },
    "node_modules/regexp.prototype.flags": {
      "version": "1.5.2",
      "resolved": "https://registry.npmjs.org/regexp.prototype.flags/-/regexp.prototype.flags-1.5.2.tgz",
      "integrity": "sha512-NcDiDkTLuPR+++OCKB0nWafEmhg/Da8aUPLPMQbK+bxKKCm1/S5he+AqYa4PlMCVBalb4/yxIRub6qkEx5yJbw==",
      "dependencies": {
        "call-bind": "^1.0.6",
        "define-properties": "^1.2.1",
        "es-errors": "^1.3.0",
        "set-function-name": "^2.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/remark-mdx": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/remark-mdx/-/remark-mdx-2.3.0.tgz",
      "integrity": "sha512-g53hMkpM0I98MU266IzDFMrTD980gNF3BJnkyFcmN+dD873mQeD5rdMO3Y2X+x8umQfbSE0PcoEDl7ledSA+2g==",
      "dependencies": {
        "mdast-util-mdx": "^2.0.0",
        "micromark-extension-mdxjs": "^1.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/remark-parse": {
      "version": "10.0.2",
      "resolved": "https://registry.npmjs.org/remark-parse/-/remark-parse-10.0.2.tgz",
      "integrity": "sha512-3ydxgHa/ZQzG8LvC7jTXccARYDcRld3VfcgIIFs7bI6vbRSxJJmzgLEIIoYKyrfhaY+ujuWaf/PJiMZXoiCXgw==",
      "dependencies": {
        "@types/mdast": "^3.0.0",
        "mdast-util-from-markdown": "^1.0.0",
        "unified": "^10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/remark-rehype": {
      "version": "10.1.0",
      "resolved": "https://registry.npmjs.org/remark-rehype/-/remark-rehype-10.1.0.tgz",
      "integrity": "sha512-EFmR5zppdBp0WQeDVZ/b66CWJipB2q2VLNFMabzDSGR66Z2fQii83G5gTBbgGEnEEA0QRussvrFHxk1HWGJskw==",
      "dependencies": {
        "@types/hast": "^2.0.0",
        "@types/mdast": "^3.0.0",
        "mdast-util-to-hast": "^12.1.0",
        "unified": "^10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/resolve": {
      "version": "1.22.8",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.8.tgz",
      "integrity": "sha512-oKWePCxqpd6FlLvGV1VU0x7bkPmmCNolxzjMf4NczoDnQcIWrAF+cPtZn5i6n+RfD2d9i0tzpKnG6Yk168yIyw==",
      "dependencies": {
        "is-core-module": "^2.13.0",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-from": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/resolve-from/-/resolve-from-4.0.0.tgz",
      "integrity": "sha512-pb/MYmXstAkysRFx8piNI1tGFNQIFA3vkE3Gq4EuA1dF6gHp/+vgZqsCGJapvy8N3Q+4o7FwvquPJcnZ7RYy4g==",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/resolve-pkg-maps": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/resolve-pkg-maps/-/resolve-pkg-maps-1.0.0.tgz",
      "integrity": "sha512-seS2Tj26TBVOC2NIc2rOe2y2ZO7efxITtLZcGSOnHHNOQ7CkiUBfw0Iw2ck6xkIhPwLhKNLS8BO+hEpngQlqzw==",
      "funding": {
        "url": "https://github.com/privatenumber/resolve-pkg-maps?sponsor=1"
      }
    },
    "node_modules/reusify": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.0.4.tgz",
      "integrity": "sha512-U9nH88a3fc/ekCF1l0/UP1IosiuIjyTh7hBvXVMHYgVcfGvt897Xguj2UOLDeI5BG2m7/uwyaLVT6fbtCwTyzw==",
      "engines": {
        "iojs": ">=1.0.0",
        "node": ">=0.10.0"
      }
    },
    "node_modules/rimraf": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/rimraf/-/rimraf-3.0.2.tgz",
      "integrity": "sha512-JZkJMZkAGFFPP2YqXZXPbMlMBgsxzE8ILs4lMIX/2o0L9UBw9O/Y3o6wFw/i9YLapcUJWwqbi3kdxIPdC62TIA==",
      "dependencies": {
        "glob": "^7.1.3"
      },
      "bin": {
        "rimraf": "bin.js"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/run-parallel": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
      "integrity": "sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "dependencies": {
        "queue-microtask": "^1.2.2"
      }
    },
    "node_modules/sade": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/sade/-/sade-1.8.1.tgz",
      "integrity": "sha512-xal3CZX1Xlo/k4ApwCFrHVACi9fBqJ7V+mwhBsuf/1IOKbBy098Fex+Wa/5QMubw09pSZ/u8EY8PWgevJsXp1A==",
      "dependencies": {
        "mri": "^1.1.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/safe-array-concat": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/safe-array-concat/-/safe-array-concat-1.1.2.tgz",
      "integrity": "sha512-vj6RsCsWBCf19jIeHEfkRMw8DPiBb+DMXklQ/1SGDHOMlHdPUkZXFQ2YdplS23zESTijAcurb1aSgJA3AgMu1Q==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "get-intrinsic": "^1.2.4",
        "has-symbols": "^1.0.3",
        "isarray": "^2.0.5"
      },
      "engines": {
        "node": ">=0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "peer": true
    },
    "node_modules/safe-regex-test": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/safe-regex-test/-/safe-regex-test-1.0.3.tgz",
      "integrity": "sha512-CdASjNJPvRa7roO6Ra/gLYBTzYzzPyyBXxIMdGW3USQLyjWEls2RgW5UBTXaQVp+OrpeCK3bLem8smtmheoRuw==",
      "dependencies": {
        "call-bind": "^1.0.6",
        "es-errors": "^1.3.0",
        "is-regex": "^1.1.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/scheduler": {
      "version": "0.23.0",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.23.0.tgz",
      "integrity": "sha512-CtuThmgHNg7zIZWAXi3AsyIzA3n4xx7aNyjwC2VJldO2LMVDhFK+63xGqq6CsJH4rTAt6/M+N4GhZiDYPx9eUw==",
      "dependencies": {
        "loose-envify": "^1.1.0"
      }
    },
    "node_modules/schema-utils": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/schema-utils/-/schema-utils-3.3.0.tgz",
      "integrity": "sha512-pN/yOAvcC+5rQ5nERGuwrjLlYvLTbCibnZ1I7B1LaiAz9BRBlE9GMgE/eqV30P7aJQUf7Ddimy/RsbYO/GrVGg==",
      "peer": true,
      "dependencies": {
        "@types/json-schema": "^7.0.8",
        "ajv": "^6.12.5",
        "ajv-keywords": "^3.5.2"
      },
      "engines": {
        "node": ">= 10.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/semver": {
      "version": "7.7.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.1.tgz",
      "integrity": "sha512-hlq8tAfn0m/61p4BVRcPzIGr6LKiMwo4VM6dGi6pt4qcRkmNzTcWq6eCEjEh+qXjkMDvPlOFFSGwQjoEa6gyMA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/serialize-javascript": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/serialize-javascript/-/serialize-javascript-6.0.2.tgz",
      "integrity": "sha512-Saa1xPByTTq2gdeFZYLLo+RFE35NHZkAbqZeWNd3BpzppeVisAqpDjcp8dyf6uIvEqJRd46jemmyA4iFIeVk8g==",
      "peer": true,
      "dependencies": {
        "randombytes": "^2.1.0"
      }
    },
    "node_modules/set-cookie-parser": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.6.0.tgz",
      "integrity": "sha512-RVnVQxTXuerk653XfuliOxBP81Sf0+qfQE73LIYKcyMYHG94AuH0kgrQpRDuTZnSmjpysHmzxJXKNfa6PjFhyQ=="
    },
    "node_modules/set-function-length": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/set-function-length/-/set-function-length-1.2.2.tgz",
      "integrity": "sha512-pgRc4hJ4/sNjWCSS9AmnS40x3bNMDTknHgL5UaMBTMyJnU90EgWh1Rz+MC9eFu4BuN/UwZjKQuY/1v3rM7HMfg==",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.2.4",
        "gopd": "^1.0.1",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/set-function-name": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/set-function-name/-/set-function-name-2.0.2.tgz",
      "integrity": "sha512-7PGFlmtwsEADb0WYyvCMa1t+yke6daIG4Wirafur5kcf+MhUnPms1UeR0CKQdTZD81yESwMHbtn+TR+dMviakQ==",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "functions-have-names": "^1.2.3",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/sharp": {
      "version": "0.34.1",
      "resolved": "https://registry.npmjs.org/sharp/-/sharp-0.34.1.tgz",
      "integrity": "sha512-1j0w61+eVxu7DawFJtnfYcvSv6qPFvfTaqzTQ2BLknVhHTwGS8sc63ZBF4rzkWMBVKybo4S5OBtDdZahh2A1xg==",
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "color": "^4.2.3",
        "detect-libc": "^2.0.3",
        "semver": "^7.7.1"
      },
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-darwin-arm64": "0.34.1",
        "@img/sharp-darwin-x64": "0.34.1",
        "@img/sharp-libvips-darwin-arm64": "1.1.0",
        "@img/sharp-libvips-darwin-x64": "1.1.0",
        "@img/sharp-libvips-linux-arm": "1.1.0",
        "@img/sharp-libvips-linux-arm64": "1.1.0",
        "@img/sharp-libvips-linux-ppc64": "1.1.0",
        "@img/sharp-libvips-linux-s390x": "1.1.0",
        "@img/sharp-libvips-linux-x64": "1.1.0",
        "@img/sharp-libvips-linuxmusl-arm64": "1.1.0",
        "@img/sharp-libvips-linuxmusl-x64": "1.1.0",
        "@img/sharp-linux-arm": "0.34.1",
        "@img/sharp-linux-arm64": "0.34.1",
        "@img/sharp-linux-s390x": "0.34.1",
        "@img/sharp-linux-x64": "0.34.1",
        "@img/sharp-linuxmusl-arm64": "0.34.1",
        "@img/sharp-linuxmusl-x64": "0.34.1",
        "@img/sharp-wasm32": "0.34.1",
        "@img/sharp-win32-ia32": "0.34.1",
        "@img/sharp-win32-x64": "0.34.1"
      }
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/side-channel": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.0.6.tgz",
      "integrity": "sha512-fDW/EZ6Q9RiO8eFG8Hj+7u/oW+XrPTIChwCOM2+th2A6OblDtYYIpve9m+KvI9Z4C9qSEXlaGR6bTEYHReuglA==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.4",
        "object-inspect": "^1.13.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/sift": {
      "version": "16.0.1",
      "resolved": "https://registry.npmjs.org/sift/-/sift-16.0.1.tgz",
      "integrity": "sha512-Wv6BjQ5zbhW7VFefWusVP33T/EM0vYikCaQ2qR8yULbsilAT8/wQaXvuQ3ptGLpoKx+lihJE3y2UTgKDyyNHZQ==",
      "dev": true
    },
    "node_modules/signal-exit": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-4.1.0.tgz",
      "integrity": "sha512-bzyZ1e88w9O1iNJbKnOlvYTrWPDl46O1bG0D3XInv+9tkPrxrN8jUUTiFlDkkmKWgn1M6CfIA13SuGqOa9Korw==",
      "dev": true,
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/simple-swizzle": {
      "version": "0.2.2",
      "resolved": "https://registry.npmjs.org/simple-swizzle/-/simple-swizzle-0.2.2.tgz",
      "integrity": "sha512-JA//kQgZtbuY83m+xT+tXJkmJncGMTFT+C+g2h2R9uxkYIrE2yy9sgmcLhCnw57/WSD+Eh3J97FPEDFnbXnDUg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "is-arrayish": "^0.3.1"
      }
    },
    "node_modules/slash": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/slash/-/slash-3.0.0.tgz",
      "integrity": "sha512-g9Q1haeby36OSStwb4ntCGGGaKsaVSjQ68fBxoQcutl5fS1vuY18H3wSt3jFyFtrkx+Kz0V1G85A4MyAdDMi2Q==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/source-map": {
      "version": "0.7.4",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.7.4.tgz",
      "integrity": "sha512-l3BikUxvPOcn5E74dZiq5BGsTb5yEwhaTSzccU6t4sDOH8NWJCstKO5QT2CvtFoK6F0saL7p9xHAqHOlCPJygA==",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/source-map-js": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.0.tgz",
      "integrity": "sha512-itJW8lvSA0TXEphiRoawsCksnlf8SyvmFzIhltqAHluXd88pkCd+cXJVHTDwdCr0IzwptSm035IHQktUu1QUMg==",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/source-map-support": {
      "version": "0.5.21",
      "resolved": "https://registry.npmjs.org/source-map-support/-/source-map-support-0.5.21.tgz",
      "integrity": "sha512-uBHU3L3czsIyYXKX88fdrGovxdSCoTGDRZ6SYXtSRxLZUzHg5P/66Ht6uoUlHu9EZod+inXhKo3qQgwXUT/y1w==",
      "peer": true,
      "dependencies": {
        "buffer-from": "^1.0.0",
        "source-map": "^0.6.0"
      }
    },
    "node_modules/source-map-support/node_modules/source-map": {
      "version": "0.6.1",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
      "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
      "peer": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/space-separated-tokens": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/space-separated-tokens/-/space-separated-tokens-2.0.2.tgz",
      "integrity": "sha512-PEGlAwrG8yXGXRjW32fGbg66JAlOAwbObuqVoJpv/mRgoWDQfgH1wDPvtzWyUSNAXBGSk8h755YDbbcEy3SH2Q==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/sparse-bitfield": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/sparse-bitfield/-/sparse-bitfield-3.0.3.tgz",
      "integrity": "sha512-kvzhi7vqKTfkh0PZU+2D2PIllw2ymqJKujUcyPMd9Y75Nv4nPbGJZXNhxsgdQab2BmlDct1YnfQCguEvHr7VsQ==",
      "dev": true,
      "dependencies": {
        "memory-pager": "^1.0.2"
      }
    },
    "node_modules/stack-utils": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/stack-utils/-/stack-utils-2.0.6.tgz",
      "integrity": "sha512-XlkWvfIm6RmsWtNJx+uqtKLS8eqFbxUg0ZzLXqY0caEy9l7hruX8IpiDnjsLavoBgqCCR71TqWO8MaXYheJ3RQ==",
      "dev": true,
      "dependencies": {
        "escape-string-regexp": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/stack-utils/node_modules/escape-string-regexp": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-2.0.0.tgz",
      "integrity": "sha512-UpzcLCXolUWcNu5HtVMHYdXJjArjsF9C0aNnquZYY4uW/Vu0miy5YoWvbV345HauVvcAUnpRuhMMcqTcGOY2+w==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/streamsearch": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/streamsearch/-/streamsearch-1.1.0.tgz",
      "integrity": "sha512-Mcc5wHehp9aXz1ax6bZUyY5afg9u2rv5cqQI3mRrYkGC8rW2hM02jWuwjtL++LS5qinSyhj2QfLyNsuc+VsExg==",
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/string-width": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-5.1.2.tgz",
      "integrity": "sha512-HnLOCR3vjcY8beoNLtcjZ5/nxn2afmME6lhrDrebokqMap+XbeW8n9TXpPDOqdGK5qcI3oT0GKTW6wC7EMiVqA==",
      "dev": true,
      "dependencies": {
        "eastasianwidth": "^0.2.0",
        "emoji-regex": "^9.2.2",
        "strip-ansi": "^7.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/string-width-cjs": {
      "name": "string-width",
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "dev": true,
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/string-width-cjs/node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "dev": true
    },
    "node_modules/string-width/node_modules/ansi-regex": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.0.1.tgz",
      "integrity": "sha512-n5M855fKb2SsfMIiFFoVrABHJC8QtHwVx+mHWP3QcEqBHYienj5dHSgjbxtC0WEZXYt4wcD6zrQElDPhFuZgfA==",
      "dev": true,
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/string-width/node_modules/strip-ansi": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.1.0.tgz",
      "integrity": "sha512-iq6eVVI64nQQTRYq2KtEg2d2uU7LElhTJwsH4YzIHZshxlgZms/wIc4VoDQTlG/IvVIrBKG06CrZnp0qv7hkcQ==",
      "dev": true,
      "dependencies": {
        "ansi-regex": "^6.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
      }
    },
    "node_modules/string.prototype.matchall": {
      "version": "4.0.11",
      "resolved": "https://registry.npmjs.org/string.prototype.matchall/-/string.prototype.matchall-4.0.11.tgz",
      "integrity": "sha512-NUdh0aDavY2og7IbBPenWqR9exH+E26Sv8e0/eTe1tltDGZL+GtBkDAnnyBtmekfK6/Dq3MkcGtzXFEd1LQrtg==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.4",
        "gopd": "^1.0.1",
        "has-symbols": "^1.0.3",
        "internal-slot": "^1.0.7",
        "regexp.prototype.flags": "^1.5.2",
        "set-function-name": "^2.0.2",
        "side-channel": "^1.0.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trim": {
      "version": "1.2.9",
      "resolved": "https://registry.npmjs.org/string.prototype.trim/-/string.prototype.trim-1.2.9.tgz",
      "integrity": "sha512-klHuCNxiMZ8MlsOihJhJEBJAiMVqU3Z2nEXWfWnIqjN0gEFS9J9+IxKozWWtQGcgoa1WUZzLjKPTr4ZHNFTFxw==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.0",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimend": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/string.prototype.trimend/-/string.prototype.trimend-1.0.8.tgz",
      "integrity": "sha512-p73uL5VCHCO2BZZ6krwwQE3kCzM7NKmis8S//xEC6fQonchbum4eP6kR4DLEjQFO3Wnj3Fuo8NM0kOSjVdHjZQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimstart": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/string.prototype.trimstart/-/string.prototype.trimstart-1.0.8.tgz",
      "integrity": "sha512-UXSH262CSZY1tfu3G3Secr6uGLCFVPMhIqHjlgCUtCCcgihYc/xKs9djMTMUOb2j1mVSeU8EU6NWc/iQKU6Gfg==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/stringify-entities": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/stringify-entities/-/stringify-entities-4.0.3.tgz",
      "integrity": "sha512-BP9nNHMhhfcMbiuQKCqMjhDP5yBCAxsPu4pHFFzJ6Alo9dZgY4VLDPutXqIjpRiMoKdp7Av85Gr73Q5uH9k7+g==",
      "dependencies": {
        "character-entities-html4": "^2.0.0",
        "character-entities-legacy": "^3.0.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/stringify-entities/node_modules/character-entities-legacy": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/character-entities-legacy/-/character-entities-legacy-3.0.0.tgz",
      "integrity": "sha512-RpPp0asT/6ufRm//AJVwpViZbGM/MkjQFxJccQRHmISF/22NBtsHqAWmL+/pmkPWoIUJdWyeVleTl1wydHATVQ==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi-cjs": {
      "name": "strip-ansi",
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "dev": true,
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-bom": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-3.0.0.tgz",
      "integrity": "sha512-vavAMRXOgBVNF6nyEEmL3DBK19iRpDcoIwW+swQ+CbGiu7lju6t+JklA1MHweoWtadgt4ISVUsXLyDq34ddcwA==",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/strip-json-comments": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/stripe": {
      "version": "13.11.0",
      "resolved": "https://registry.npmjs.org/stripe/-/stripe-13.11.0.tgz",
      "integrity": "sha512-yPxVJxUzP1QHhHeFnYjJl48QwDS1+5befcL7ju7+t+i88D5r0rbsL+GkCCS6zgcU+TiV5bF9eMGcKyJfLf8BZQ==",
      "dependencies": {
        "@types/node": ">=8.1.0",
        "qs": "^6.11.0"
      },
      "engines": {
        "node": ">=12.*"
      }
    },
    "node_modules/style-to-object": {
      "version": "0.4.4",
      "resolved": "https://registry.npmjs.org/style-to-object/-/style-to-object-0.4.4.tgz",
      "integrity": "sha512-HYNoHZa2GorYNyqiCaBgsxvcJIn7OHq6inEga+E6Ke3m5JkoqpQbnFssk4jwe+K7AhGa2fcha4wSOf1Kn01dMg==",
      "dependencies": {
        "inline-style-parser": "0.1.1"
      }
    },
    "node_modules/styled-jsx": {
      "version": "5.1.6",
      "resolved": "https://registry.npmjs.org/styled-jsx/-/styled-jsx-5.1.6.tgz",
      "integrity": "sha512-qSVyDTeMotdvQYoHWLNGwRFJHC+i+ZvdBRYosOFgC+Wg1vx4frN2/RG/NA7SYqqvKNLf39P2LSRA2pu6n0XYZA==",
      "license": "MIT",
      "dependencies": {
        "client-only": "0.0.1"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "peerDependencies": {
        "react": ">= 16.8.0 || 17.x.x || ^18.0.0-0 || ^19.0.0-0"
      },
      "peerDependenciesMeta": {
        "@babel/core": {
          "optional": true
        },
        "babel-plugin-macros": {
          "optional": true
        }
      }
    },
    "node_modules/sucrase": {
      "version": "3.35.0",
      "resolved": "https://registry.npmjs.org/sucrase/-/sucrase-3.35.0.tgz",
      "integrity": "sha512-8EbVDiu9iN/nESwxeSxDKe0dunta1GOlHufmSSXxMD2z2/tMZpDMpvXQGsc+ajGo8y2uYUmixaSRUc/QPoQ0GA==",
      "dev": true,
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.2",
        "commander": "^4.0.0",
        "glob": "^10.3.10",
        "lines-and-columns": "^1.1.6",
        "mz": "^2.7.0",
        "pirates": "^4.0.1",
        "ts-interface-checker": "^0.1.9"
      },
      "bin": {
        "sucrase": "bin/sucrase",
        "sucrase-node": "bin/sucrase-node"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      }
    },
    "node_modules/sucrase/node_modules/brace-expansion": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.0.1.tgz",
      "integrity": "sha512-XnAIvQ8eM+kC6aULx6wuQiwVsnzsi9d3WxzV3FpWTGA19F621kwdbsAcFKXgKUHZWsy+mY6iL1sHTxWEFCytDA==",
      "dev": true,
      "dependencies": {
        "balanced-match": "^1.0.0"
      }
    },
    "node_modules/sucrase/node_modules/glob": {
      "version": "10.3.12",
      "resolved": "https://registry.npmjs.org/glob/-/glob-10.3.12.tgz",
      "integrity": "sha512-TCNv8vJ+xz4QiqTpfOJA7HvYv+tNIRHKfUWw/q+v2jdgN4ebz+KY9tGx5J4rHP0o84mNP+ApH66HRX8us3Khqg==",
      "dev": true,
      "dependencies": {
        "foreground-child": "^3.1.0",
        "jackspeak": "^2.3.6",
        "minimatch": "^9.0.1",
        "minipass": "^7.0.4",
        "path-scurry": "^1.10.2"
      },
      "bin": {
        "glob": "dist/esm/bin.mjs"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/sucrase/node_modules/minimatch": {
      "version": "9.0.4",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-9.0.4.tgz",
      "integrity": "sha512-KqWh+VchfxcMNRAJjj2tnsSJdNbHsVgnkBhTNrW7AjVo6OvLtxw8zfT9oLw1JSohlFzJ8jCoTgaoXvJ+kHt6fw==",
      "dev": true,
      "dependencies": {
        "brace-expansion": "^2.0.1"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/tailwindcss": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-3.4.3.tgz",
      "integrity": "sha512-U7sxQk/n397Bmx4JHbJx/iSOOv5G+II3f1kpLpY2QeUv5DcPdcTsYLlusZfq1NthHS1c1cZoyFmmkex1rzke0A==",
      "dev": true,
      "dependencies": {
        "@alloc/quick-lru": "^5.2.0",
        "arg": "^5.0.2",
        "chokidar": "^3.5.3",
        "didyoumean": "^1.2.2",
        "dlv": "^1.1.3",
        "fast-glob": "^3.3.0",
        "glob-parent": "^6.0.2",
        "is-glob": "^4.0.3",
        "jiti": "^1.21.0",
        "lilconfig": "^2.1.0",
        "micromatch": "^4.0.5",
        "normalize-path": "^3.0.0",
        "object-hash": "^3.0.0",
        "picocolors": "^1.0.0",
        "postcss": "^8.4.23",
        "postcss-import": "^15.1.0",
        "postcss-js": "^4.0.1",
        "postcss-load-config": "^4.0.1",
        "postcss-nested": "^6.0.1",
        "postcss-selector-parser": "^6.0.11",
        "resolve": "^1.22.2",
        "sucrase": "^3.32.0"
      },
      "bin": {
        "tailwind": "lib/cli.js",
        "tailwindcss": "lib/cli.js"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/tapable": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/tapable/-/tapable-2.2.1.tgz",
      "integrity": "sha512-GNzQvQTOIP6RyTfE2Qxb8ZVlNmw0n88vp1szwWRimP02mnTsx3Wtn5qRdqY9w2XduFNUgvOwhNnQsjwCp+kqaQ==",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/terser": {
      "version": "5.30.0",
      "resolved": "https://registry.npmjs.org/terser/-/terser-5.30.0.tgz",
      "integrity": "sha512-Y/SblUl5kEyEFzhMAQdsxVHh+utAxd4IuRNJzKywY/4uzSogh3G219jqbDDxYu4MXO9CzY3tSEqmZvW6AoEDJw==",
      "peer": true,
      "dependencies": {
        "@jridgewell/source-map": "^0.3.3",
        "acorn": "^8.8.2",
        "commander": "^2.20.0",
        "source-map-support": "~0.5.20"
      },
      "bin": {
        "terser": "bin/terser"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/terser-webpack-plugin": {
      "version": "5.3.10",
      "resolved": "https://registry.npmjs.org/terser-webpack-plugin/-/terser-webpack-plugin-5.3.10.tgz",
      "integrity": "sha512-BKFPWlPDndPs+NGGCr1U59t0XScL5317Y0UReNrHaw9/FwhPENlq6bfgs+4yPfyP51vqC1bQ4rp1EfXW5ZSH9w==",
      "peer": true,
      "dependencies": {
        "@jridgewell/trace-mapping": "^0.3.20",
        "jest-worker": "^27.4.5",
        "schema-utils": "^3.1.1",
        "serialize-javascript": "^6.0.1",
        "terser": "^5.26.0"
      },
      "engines": {
        "node": ">= 10.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependencies": {
        "webpack": "^5.1.0"
      },
      "peerDependenciesMeta": {
        "@swc/core": {
          "optional": true
        },
        "esbuild": {
          "optional": true
        },
        "uglify-js": {
          "optional": true
        }
      }
    },
    "node_modules/terser/node_modules/commander": {
      "version": "2.20.3",
      "resolved": "https://registry.npmjs.org/commander/-/commander-2.20.3.tgz",
      "integrity": "sha512-GpVkmM8vF2vQUkj2LvZmD35JxeJOLCwJ9cUkugyk2nuhbv3+mJvpLYYt+0+USMxE+oj+ey/lJEnhZw75x/OMcQ==",
      "peer": true
    },
    "node_modules/text-table": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/text-table/-/text-table-0.2.0.tgz",
      "integrity": "sha512-N+8UisAXDGk8PFXP4HAzVR9nbfmVJ3zYLAWiTIoqC5v5isinhr+r5uaO8+7r3BMfuNIufIsA7RdpVgacC2cSpw=="
    },
    "node_modules/thenify": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/thenify/-/thenify-3.3.1.tgz",
      "integrity": "sha512-RVZSIV5IG10Hk3enotrhvz0T9em6cyHBLkH/YAZuKqd8hRkKhSfCGIcP2KUY0EPxndzANBmNllzWPwak+bheSw==",
      "dev": true,
      "dependencies": {
        "any-promise": "^1.0.0"
      }
    },
    "node_modules/thenify-all": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/thenify-all/-/thenify-all-1.6.0.tgz",
      "integrity": "sha512-RNxQH/qI8/t3thXJDwcstUO4zeqo64+Uy/+sNVRBx4Xn2OX+OZ9oP+iJnNFqplFra2ZUVeKCSa2oVWi3T4uVmA==",
      "dev": true,
      "dependencies": {
        "thenify": ">= 3.1.0 < 4"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/tr46": {
      "version": "0.0.3",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-0.0.3.tgz",
      "integrity": "sha512-N3WMsuqV66lT30CrXNbEjx4GEwlow3v6rr4mCcv6prnfwhS01rkgyFdjPNBYd9br7LpXV1+Emh01fHnq2Gdgrw=="
    },
    "node_modules/trim-lines": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/trim-lines/-/trim-lines-3.0.1.tgz",
      "integrity": "sha512-kRj8B+YHZCc9kQYdWfJB2/oUl9rA99qbowYYBtr4ui4mZyAQ2JpvVBd/6U2YloATfqBhBTSMhTpgBHtU0Mf3Rg==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/trough": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/trough/-/trough-2.2.0.tgz",
      "integrity": "sha512-tmMpK00BjZiUyVyvrBK7knerNgmgvcV/KLVyuma/SC+TQN167GrMRciANTz09+k3zW8L8t60jWO1GpfkZdjTaw==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/ts-api-utils": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/ts-api-utils/-/ts-api-utils-1.3.0.tgz",
      "integrity": "sha512-UQMIo7pb8WRomKR1/+MFVLTroIvDVtMX3K6OUir8ynLyzB8Jeriont2bTAtmNPa1ekAgN7YPDyf6V+ygrdU+eQ==",
      "engines": {
        "node": ">=16"
      },
      "peerDependencies": {
        "typescript": ">=4.2.0"
      }
    },
    "node_modules/ts-interface-checker": {
      "version": "0.1.13",
      "resolved": "https://registry.npmjs.org/ts-interface-checker/-/ts-interface-checker-0.1.13.tgz",
      "integrity": "sha512-Y/arvbn+rrz3JCKl9C4kVNfTfSm2/mEp5FSz5EsZSANGPSlQrpRI5M4PKF+mJnE52jOO90PnPSc3Ur3bTQw0gA==",
      "dev": true
    },
    "node_modules/tsconfig-paths": {
      "version": "3.15.0",
      "resolved": "https://registry.npmjs.org/tsconfig-paths/-/tsconfig-paths-3.15.0.tgz",
      "integrity": "sha512-2Ac2RgzDe/cn48GvOe3M+o82pEFewD3UPbyoUHHdKasHwJKjds4fLXWf/Ux5kATBKN20oaFGu+jbElp1pos0mg==",
      "dependencies": {
        "@types/json5": "^0.0.29",
        "json5": "^1.0.2",
        "minimist": "^1.2.6",
        "strip-bom": "^3.0.0"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/type-check": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz",
      "integrity": "sha512-XleUoc9uwGXqjWwXaUTZAmzMcFZ5858QA2vvx1Ur5xIcixXIP+8LnFDgRplU30us6teqdlskFfu+ae4K79Ooew==",
      "dependencies": {
        "prelude-ls": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/type-fest": {
      "version": "0.20.2",
      "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-0.20.2.tgz",
      "integrity": "sha512-Ne+eE4r0/iWnpAxD852z3A+N0Bt5RN//NjJwRd2VFHEmrywxf5vsZlh4R6lixl6B+wz/8d+maTSAkN1FIkI3LQ==",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/typed-array-buffer": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/typed-array-buffer/-/typed-array-buffer-1.0.2.tgz",
      "integrity": "sha512-gEymJYKZtKXzzBzM4jqa9w6Q1Jjm7x2d+sh19AdsD4wqnMPDYyvwpsIc2Q/835kHuo3BEQ7CjelGhfTsoBb2MQ==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "es-errors": "^1.3.0",
        "is-typed-array": "^1.1.13"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/typed-array-byte-length": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/typed-array-byte-length/-/typed-array-byte-length-1.0.1.tgz",
      "integrity": "sha512-3iMJ9q0ao7WE9tWcaYKIptkNBuOIcZCCT0d4MRvuuH88fEoEH62IuQe0OtraD3ebQEoTRk8XCBoknUNc1Y67pw==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "for-each": "^0.3.3",
        "gopd": "^1.0.1",
        "has-proto": "^1.0.3",
        "is-typed-array": "^1.1.13"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-byte-offset": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/typed-array-byte-offset/-/typed-array-byte-offset-1.0.2.tgz",
      "integrity": "sha512-Ous0vodHa56FviZucS2E63zkgtgrACj7omjwd/8lTEMEPFFyjfixMZ1ZXenpgCFBBt4EC1J2XsyVS2gkG0eTFA==",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.7",
        "for-each": "^0.3.3",
        "gopd": "^1.0.1",
        "has-proto": "^1.0.3",
        "is-typed-array": "^1.1.13"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-length": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/typed-array-length/-/typed-array-length-1.0.6.tgz",
      "integrity": "sha512-/OxDN6OtAk5KBpGb28T+HZc2M+ADtvRxXrKKbUwtsLgdoxgX13hyy7ek6bFRl5+aBs2yZzB0c4CnQfAtVypW/g==",
      "dependencies": {
        "call-bind": "^1.0.7",
        "for-each": "^0.3.3",
        "gopd": "^1.0.1",
        "has-proto": "^1.0.3",
        "is-typed-array": "^1.1.13",
        "possible-typed-array-names": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typescript": {
      "version": "5.4.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.4.3.tgz",
      "integrity": "sha512-KrPd3PKaCLr78MalgiwJnA25Nm8HAmdwN3mYUYZgG/wizIo9EainNVQI9/yDavtVFRN2h3k8uf3GLHuhDMgEHg==",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/unbox-primitive": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/unbox-primitive/-/unbox-primitive-1.0.2.tgz",
      "integrity": "sha512-61pPlCD9h51VoreyJ0BReideM3MDKMKnh6+V9L08331ipq6Q8OFXZYiqP6n/tbHx4s5I9uRhcye6BrbkizkBDw==",
      "dependencies": {
        "call-bind": "^1.0.2",
        "has-bigints": "^1.0.2",
        "has-symbols": "^1.0.3",
        "which-boxed-primitive": "^1.0.2"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/undici-types": {
      "version": "5.26.5",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-5.26.5.tgz",
      "integrity": "sha512-JlCMO+ehdEIKqlFxk6IfVoAUVmgz7cU7zD/h9XZ0qzeosSHmUJVOzSQvvYSYWXkFXC+IfLKSIffhv0sVZup6pA=="
    },
    "node_modules/unified": {
      "version": "10.1.2",
      "resolved": "https://registry.npmjs.org/unified/-/unified-10.1.2.tgz",
      "integrity": "sha512-pUSWAi/RAnVy1Pif2kAoeWNBa3JVrx0MId2LASj8G+7AiHWoKZNTomq6LG326T68U7/e263X6fTdcXIy7XnF7Q==",
      "dependencies": {
        "@types/unist": "^2.0.0",
        "bail": "^2.0.0",
        "extend": "^3.0.0",
        "is-buffer": "^2.0.0",
        "is-plain-obj": "^4.0.0",
        "trough": "^2.0.0",
        "vfile": "^5.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/unist-util-generated": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/unist-util-generated/-/unist-util-generated-2.0.1.tgz",
      "integrity": "sha512-qF72kLmPxAw0oN2fwpWIqbXAVyEqUzDHMsbtPvOudIlUzXYFIeQIuxXQCRCFh22B7cixvU0MG7m3MW8FTq/S+A==",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/unist-util-is": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/unist-util-is/-/unist-util-is-5.2.1.tgz",
      "integrity": "sha512-u9njyyfEh43npf1M+yGKDGVPbY/JWEemg5nH05ncKPfi+kBbKBJoTdsogMu33uhytuLlv9y0O7GH7fEdwLdLQw==",
      "dependencies": {
        "@types/unist": "^2.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/unist-util-position": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/unist-util-position/-/unist-util-position-4.0.4.tgz",
      "integrity": "sha512-kUBE91efOWfIVBo8xzh/uZQ7p9ffYRtUbMRZBNFYwf0RK8koUMx6dGUfwylLOKmaT2cs4wSW96QoYUSXAyEtpg==",
      "dependencies": {
        "@types/unist": "^2.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/unist-util-position-from-estree": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/unist-util-position-from-estree/-/unist-util-position-from-estree-1.1.2.tgz",
      "integrity": "sha512-poZa0eXpS+/XpoQwGwl79UUdea4ol2ZuCYguVaJS4qzIOMDzbqz8a3erUCOmubSZkaOuGamb3tX790iwOIROww==",
      "dependencies": {
        "@types/unist": "^2.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/unist-util-remove-position": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/unist-util-remove-position/-/unist-util-remove-position-4.0.2.tgz",
      "integrity": "sha512-TkBb0HABNmxzAcfLf4qsIbFbaPDvMO6wa3b3j4VcEzFVaw1LBKwnW4/sRJ/atSLSzoIg41JWEdnE7N6DIhGDGQ==",
      "dependencies": {
        "@types/unist": "^2.0.0",
        "unist-util-visit": "^4.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/unist-util-stringify-position": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/unist-util-stringify-position/-/unist-util-stringify-position-3.0.3.tgz",
      "integrity": "sha512-k5GzIBZ/QatR8N5X2y+drfpWG8IDBzdnVj6OInRNWm1oXrzydiaAT2OQiA8DPRRZyAKb9b6I2a6PxYklZD0gKg==",
      "dependencies": {
        "@types/unist": "^2.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/unist-util-visit": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/unist-util-visit/-/unist-util-visit-4.1.2.tgz",
      "integrity": "sha512-MSd8OUGISqHdVvfY9TPhyK2VdUrPgxkUtWSuMHF6XAAFuL4LokseigBnZtPnJMu+FbynTkFNnFlyjxpVKujMRg==",
      "dependencies": {
        "@types/unist": "^2.0.0",
        "unist-util-is": "^5.0.0",
        "unist-util-visit-parents": "^5.1.1"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/unist-util-visit-parents": {
      "version": "5.1.3",
      "resolved": "https://registry.npmjs.org/unist-util-visit-parents/-/unist-util-visit-parents-5.1.3.tgz",
      "integrity": "sha512-x6+y8g7wWMyQhL1iZfhIPhDAs7Xwbn9nRosDXl7qoPTSCy0yNxnKc+hWokFifWQIDGi154rdUqKvbCa4+1kLhg==",
      "dependencies": {
        "@types/unist": "^2.0.0",
        "unist-util-is": "^5.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/update-browserslist-db": {
      "version": "1.0.13",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.0.13.tgz",
      "integrity": "sha512-xebP81SNcPuNpPP3uzeW1NYXxI3rxyJzF3pD6sH4jE7o/IX+WtSpwnVU+qIsDPyk0d3hmFQ7mjqc6AtV604hbg==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "dependencies": {
        "escalade": "^3.1.1",
        "picocolors": "^1.0.0"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/uri-js": {
      "version": "4.4.1",
      "resolved": "https://registry.npmjs.org/uri-js/-/uri-js-4.4.1.tgz",
      "integrity": "sha512-7rKUyy33Q1yc98pQ1DAmLtwX109F7TIfWlW1Ydo8Wl1ii1SeHieeh0HHfPeL2fMXK6z0s8ecKs9frCuLJvndBg==",
      "dependencies": {
        "punycode": "^2.1.0"
      }
    },
    "node_modules/url-join": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/url-join/-/url-join-4.0.1.tgz",
      "integrity": "sha512-jk1+QP6ZJqyOiuEI9AEWQfju/nB2Pw466kbA0LEZljHwKeMgd9WrAEgEGxjPDD2+TNbbb37rTyhEfrCXfuKXnA=="
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "dev": true
    },
    "node_modules/uvu": {
      "version": "0.5.6",
      "resolved": "https://registry.npmjs.org/uvu/-/uvu-0.5.6.tgz",
      "integrity": "sha512-+g8ENReyr8YsOc6fv/NVJs2vFdHBnBNdfE49rshrTzDWOlUx4Gq7KOS2GD8eqhy2j+Ejq29+SbKH8yjkAqXqoA==",
      "dependencies": {
        "dequal": "^2.0.0",
        "diff": "^5.0.0",
        "kleur": "^4.0.3",
        "sade": "^1.7.3"
      },
      "bin": {
        "uvu": "bin.js"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/vfile": {
      "version": "5.3.7",
      "resolved": "https://registry.npmjs.org/vfile/-/vfile-5.3.7.tgz",
      "integrity": "sha512-r7qlzkgErKjobAmyNIkkSpizsFPYiUPuJb5pNW1RB4JcYVZhs4lIbVqk8XPk033CV/1z8ss5pkax8SuhGpcG8g==",
      "dependencies": {
        "@types/unist": "^2.0.0",
        "is-buffer": "^2.0.0",
        "unist-util-stringify-position": "^3.0.0",
        "vfile-message": "^3.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/vfile-message": {
      "version": "3.1.4",
      "resolved": "https://registry.npmjs.org/vfile-message/-/vfile-message-3.1.4.tgz",
      "integrity": "sha512-fa0Z6P8HUrQN4BZaX05SIVXic+7kE3b05PWAtPuYP9QLHsLKYR7/AlLW3NtOrpXRLeawpDLMsVkmk5DG0NXgWw==",
      "dependencies": {
        "@types/unist": "^2.0.0",
        "unist-util-stringify-position": "^3.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/unified"
      }
    },
    "node_modules/watchpack": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/watchpack/-/watchpack-2.4.1.tgz",
      "integrity": "sha512-8wrBCMtVhqcXP2Sup1ctSkga6uc2Bx0IIvKyT7yTFier5AXHooSI+QyQQAtTb7+E0IUCCKyTFmXqdqgum2XWGg==",
      "peer": true,
      "dependencies": {
        "glob-to-regexp": "^0.4.1",
        "graceful-fs": "^4.1.2"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/webidl-conversions": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-3.0.1.tgz",
      "integrity": "sha512-2JAn3z8AR6rjK8Sm8orRC0h/bcl/DqL7tRPdGZ4I1CjdF+EaMLmYxBHyXuKL849eucPFhvBoxMsflfOb8kxaeQ=="
    },
    "node_modules/webpack": {
      "version": "5.91.0",
      "resolved": "https://registry.npmjs.org/webpack/-/webpack-5.91.0.tgz",
      "integrity": "sha512-rzVwlLeBWHJbmgTC/8TvAcu5vpJNII+MelQpylD4jNERPwpBJOE2lEcko1zJX3QJeLjTTAnQxn/OJ8bjDzVQaw==",
      "peer": true,
      "dependencies": {
        "@types/eslint-scope": "^3.7.3",
        "@types/estree": "^1.0.5",
        "@webassemblyjs/ast": "^1.12.1",
        "@webassemblyjs/wasm-edit": "^1.12.1",
        "@webassemblyjs/wasm-parser": "^1.12.1",
        "acorn": "^8.7.1",
        "acorn-import-assertions": "^1.9.0",
        "browserslist": "^4.21.10",
        "chrome-trace-event": "^1.0.2",
        "enhanced-resolve": "^5.16.0",
        "es-module-lexer": "^1.2.1",
        "eslint-scope": "5.1.1",
        "events": "^3.2.0",
        "glob-to-regexp": "^0.4.1",
        "graceful-fs": "^4.2.11",
        "json-parse-even-better-errors": "^2.3.1",
        "loader-runner": "^4.2.0",
        "mime-types": "^2.1.27",
        "neo-async": "^2.6.2",
        "schema-utils": "^3.2.0",
        "tapable": "^2.1.1",
        "terser-webpack-plugin": "^5.3.10",
        "watchpack": "^2.4.1",
        "webpack-sources": "^3.2.3"
      },
      "bin": {
        "webpack": "bin/webpack.js"
      },
      "engines": {
        "node": ">=10.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependenciesMeta": {
        "webpack-cli": {
          "optional": true
        }
      }
    },
    "node_modules/webpack-sources": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/webpack-sources/-/webpack-sources-3.2.3.tgz",
      "integrity": "sha512-/DyMEOrDgLKKIG0fmvtz+4dUX/3Ghozwgm6iPp8KRhvn+eQf9+Q7GWxVNMk3+uCPWfdXYC4ExGBckIXdFEfH1w==",
      "peer": true,
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/webpack/node_modules/eslint-scope": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-5.1.1.tgz",
      "integrity": "sha512-2NxwbF/hZ0KpepYN0cNbo+FN6XoK7GaHlQhgx/hIZl6Va0bF45RQOOwhLIy8lQDbuCiadSLCBnH2CFYquit5bw==",
      "peer": true,
      "dependencies": {
        "esrecurse": "^4.3.0",
        "estraverse": "^4.1.1"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/webpack/node_modules/estraverse": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-4.3.0.tgz",
      "integrity": "sha512-39nnKffWz8xN1BU/2c79n9nB9HDzo0niYUqx6xyqUnyoAnQyyWpOTdZEeiCch8BBu515t4wp9ZmgVfVhn9EBpw==",
      "peer": true,
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/whatwg-url": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-5.0.0.tgz",
      "integrity": "sha512-saE57nupxk6v3HY35+jzBwYa0rKSy0XR8JSxZPwgLr7ys0IBzhGviA1/TUGJLmSVqs8pb9AnvICXEuOHLprYTw==",
      "dependencies": {
        "tr46": "~0.0.3",
        "webidl-conversions": "^3.0.0"
      }
    },
    "node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/which-boxed-primitive": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/which-boxed-primitive/-/which-boxed-primitive-1.0.2.tgz",
      "integrity": "sha512-bwZdv0AKLpplFY2KZRX6TvyuN7ojjr7lwkg6ml0roIy9YeuSr7JS372qlNW18UQYzgYK9ziGcerWqZOmEn9VNg==",
      "dependencies": {
        "is-bigint": "^1.0.1",
        "is-boolean-object": "^1.1.0",
        "is-number-object": "^1.0.4",
        "is-string": "^1.0.5",
        "is-symbol": "^1.0.3"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-builtin-type": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/which-builtin-type/-/which-builtin-type-1.1.3.tgz",
      "integrity": "sha512-YmjsSMDBYsM1CaFiayOVT06+KJeXf0o5M/CAd4o1lTadFAtacTUM49zoYxr/oroopFDfhvN6iEcBxUyc3gvKmw==",
      "dependencies": {
        "function.prototype.name": "^1.1.5",
        "has-tostringtag": "^1.0.0",
        "is-async-function": "^2.0.0",
        "is-date-object": "^1.0.5",
        "is-finalizationregistry": "^1.0.2",
        "is-generator-function": "^1.0.10",
        "is-regex": "^1.1.4",
        "is-weakref": "^1.0.2",
        "isarray": "^2.0.5",
        "which-boxed-primitive": "^1.0.2",
        "which-collection": "^1.0.1",
        "which-typed-array": "^1.1.9"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-collection": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/which-collection/-/which-collection-1.0.2.tgz",
      "integrity": "sha512-K4jVyjnBdgvc86Y6BkaLZEN933SwYOuBFkdmBu9ZfkcAbdVbpITnDmjvZ/aQjRXQrv5EPkTnD1s39GiiqbngCw==",
      "dependencies": {
        "is-map": "^2.0.3",
        "is-set": "^2.0.3",
        "is-weakmap": "^2.0.2",
        "is-weakset": "^2.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-typed-array": {
      "version": "1.1.15",
      "resolved": "https://registry.npmjs.org/which-typed-array/-/which-typed-array-1.1.15.tgz",
      "integrity": "sha512-oV0jmFtUky6CXfkqehVvBP/LSWJ2sy4vWMioiENyJLePrBO/yKyV9OyJySfAKosh+RYkIl5zJCNZ8/4JncrpdA==",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.7",
        "for-each": "^0.3.3",
        "gopd": "^1.0.1",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/wrap-ansi": {
      "version": "8.1.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-8.1.0.tgz",
      "integrity": "sha512-si7QWI6zUMq56bESFvagtmzMdGOtoxfR+Sez11Mobfc7tm+VkUckk9bW2UeffTGVUbOksxmSw0AA2gs8g71NCQ==",
      "dev": true,
      "dependencies": {
        "ansi-styles": "^6.1.0",
        "string-width": "^5.0.1",
        "strip-ansi": "^7.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrap-ansi-cjs": {
      "name": "wrap-ansi",
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "dev": true,
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrap-ansi-cjs/node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "dev": true
    },
    "node_modules/wrap-ansi-cjs/node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "dev": true,
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrap-ansi/node_modules/ansi-regex": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.0.1.tgz",
      "integrity": "sha512-n5M855fKb2SsfMIiFFoVrABHJC8QtHwVx+mHWP3QcEqBHYienj5dHSgjbxtC0WEZXYt4wcD6zrQElDPhFuZgfA==",
      "dev": true,
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/wrap-ansi/node_modules/ansi-styles": {
      "version": "6.2.1",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.1.tgz",
      "integrity": "sha512-bN798gFfQX+viw3R7yrGWRqnrN2oRkEkUjjl4JNn4E8GxxbjtG3FbrEIIY3l8/hrwUwIeCZvi4QuOTP4MErVug==",
      "dev": true,
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/wrap-ansi/node_modules/strip-ansi": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.1.0.tgz",
      "integrity": "sha512-iq6eVVI64nQQTRYq2KtEg2d2uU7LElhTJwsH4YzIHZshxlgZms/wIc4VoDQTlG/IvVIrBKG06CrZnp0qv7hkcQ==",
      "dev": true,
      "dependencies": {
        "ansi-regex": "^6.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ=="
    },
    "node_modules/ws": {
      "version": "8.16.0",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.16.0.tgz",
      "integrity": "sha512-HS0c//TP7Ina87TfiPUz1rQzMhHrl/SG2guqRcTOIUYD2q8uhUdNHZYJUaQ8aTGPzCh+c6oawMKW35nFl1dxyQ==",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/xtend": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/xtend/-/xtend-4.0.2.tgz",
      "integrity": "sha512-LKYU1iAXJXUgAXn9URjiu+MWhyUXHsvfp7mcuYm9dSUKK0/CjtrUwFAxD82/mCWbtLsGjFIad0wIsod4zrTAEQ==",
      "engines": {
        "node": ">=0.4"
      }
    },
    "node_modules/yaml": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/yaml/-/yaml-2.4.1.tgz",
      "integrity": "sha512-pIXzoImaqmfOrL7teGUBt/T7ZDnyeGBWyXQBvOVhLkWLN37GXv8NMLK406UY6dS51JfcQHsmcW5cJ441bHg6Lg==",
      "dev": true,
      "bin": {
        "yaml": "bin.mjs"
      },
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/zod": {
      "version": "3.22.4",
      "resolved": "https://registry.npmjs.org/zod/-/zod-3.22.4.tgz",
      "integrity": "sha512-iC+8Io04lddc+mVqQ9AZ7OQ2MrUKGN+oIQyq1vemgt46jwCwLfhq7/pwnBnNXXXZb8VTVLKwp9EDkx+ryxIWmg==",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    },
    "node_modules/zwitch": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/zwitch/-/zwitch-2.0.4.tgz",
      "integrity": "sha512-bXE4cR/kVZhKZX/RjPEflHaKVhUVl85noU3v6b8apfQEc1x4A+zBxjZ4lN8LqGd6WZ3dl98pY4o717VFmoPp+A==",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    }
  }
}

```

### package.json

```json
{
  "name": "ship-fast-code",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "postbuild": "next-sitemap",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@headlessui/react": "^1.7.18",
    "@mdx-js/loader": "^2.3.0",
    "@mdx-js/react": "^2.3.0",
    "@next/mdx": "^13.5.6",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/supabase-js": "^2.41.1",
    "axios": "^1.6.8",
    "crisp-sdk-web": "^1.0.22",
    "eslint": "8.47.0",
    "eslint-config-next": "13.4.19",
    "form-data": "^4.0.0",
    "framer-motion": "^12.10.1",
    "mailgun.js": "^9.4.1",
    "next": "^15.3.2",
    "next-plausible": "^3.12.0",
    "next-sitemap": "^4.2.3",
    "nextjs-toploader": "^1.6.11",
    "nodemailer": "^6.9.13",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-hot-toast": "^2.4.1",
    "react-syntax-highlighter": "^15.5.0",
    "react-tooltip": "^5.26.3",
    "stripe": "^13.11.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/mdx": "^2.0.12",
    "@types/mongoose": "^5.11.97",
    "@types/node": "^20.12.2",
    "@types/react": "^18.2.73",
    "@types/react-dom": "^18.2.23",
    "@types/react-syntax-highlighter": "^15.5.11",
    "autoprefixer": "^10.4.19",
    "daisyui": "^4.10.1",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.3"
  }
}

```

### .env

```text
SUPABASE_URL=https://rvwvnralrlsdtugtgict.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3ZucmFscmxzZHR1Z3RnaWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ0NzM0NCwiZXhwIjoyMDYxMDIzMzQ0fQ.hFRjn5zq24WmKEoCLbWDRUY6dUdEjlPS-c4OemCaFM4
NEXT_PUBLIC_SUPABASE_URL=https://rvwvnralrlsdtugtgict.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3ZucmFscmxzZHR1Z3RnaWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDczNDQsImV4cCI6MjA2MTAyMzM0NH0.6pBET5OCcZ8hfJrexg83vtXhmes9bnk7iFz3wCLHGWc


# -----------------------------------------------------------------------------
# Mailgun: https://shipfa.st/docs/features/emails
# -----------------------------------------------------------------------------
EMAIL_SERVER=
MAILGUN_API_KEY=



# -----------------------------------------------------------------------------
# Stripe: https://shipfa.st/docs/features/payments
# -----------------------------------------------------------------------------
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### middleware.js

```javascript
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

// The middleware is used to refresh the user's session before loading Server Component routes
export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();
  return res;
}

```

### tsconfig.json

```json
{
  "compilerOptions": {
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noImplicitAny": true,
    "jsx": "preserve",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "plugins": [
      {
        "name": "next"
      }
    ],
    "target": "ES2017"
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}

```

### .env.example

```example
# -----------------------------------------------------------------------------
# Mailgun: https://shipfa.st/docs/features/emails
# -----------------------------------------------------------------------------
EMAIL_SERVER=
MAILGUN_API_KEY=

# -----------------------------------------------------------------------------
# Database URI: https://shipfa.st/docs/features/supabase
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# -----------------------------------------------------------------------------
# Stripe: https://shipfa.st/docs/features/payments
# -----------------------------------------------------------------------------
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### config.ts

```typescript
import themes from "daisyui/src/theming/themes";
import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "ShipFast",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "The NextJS boilerplate with all you need to build your SaaS, AI tool, or any other web app.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "shipfa.st",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (mailgun.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1Niyy5AxyNprDp7iZIqEyD2h"
            : "price_456",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Starter",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Perfect for small projects",
        // The price you want to display, the one user will be charged on Stripe.
        price: 99,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 149,
        features: [
          {
            name: "NextJS boilerplate",
          },
          { name: "User oauth" },
          { name: "Database" },
          { name: "Emails" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1O5KtcAxyNprDp7iftKnrrpw"
            : "price_456",
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        name: "Advanced",
        description: "You need more power",
        price: 149,
        priceAnchor: 299,
        features: [
          {
            name: "NextJS boilerplate",
          },
          { name: "User oauth" },
          { name: "Database" },
          { name: "Emails" },
          { name: "1 year of updates" },
          { name: "24/7 support" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  mailgun: {
    // subdomain to use when sending emails, if you don't have a subdomain, just remove it. Highly recommended to have one (i.e. mg.yourdomain.com or mail.yourdomain.com)
    subdomain: "mg",
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `ShipFast <noreply@mg.shipfa.st>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Marc at ShipFast <marc@mg.shipfa.st>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "marc@mg.shipfa.st",
    // When someone replies to supportEmail sent by the app, forward it to the email below (otherwise it's lost). If you set supportEmail to empty, this will be ignored.
    forwardRepliesTo: "marc.louvion@gmail.com",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: themes["light"]["primary"],
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard",
  },
} as ConfigProps;

export default config;

```

### postcss.config.js

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

```

### .eslintrc.json

```json
{
  "extends": ["next/core-web-vitals", "eslint:recommended"],
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "rules": {
    // Your specific rules.
    "no-unused-vars": "warn"
  }
}

```

### .cursor/rules/naming-conventions.mdc

```mdc
---
description:
globs:
alwaysApply: false
---

```

### .cursor/rules/performance-optimization.mdc

```mdc
---
description:
globs:
alwaysApply: false
---

```

### .cursor/rules/ui-styling.mdc

```mdc
---
description:
globs:
alwaysApply: false
---

```

### .cursor/rules/project-structure.mdc

```mdc
---
description:
globs:
alwaysApply: false
---

```

### .cursor/rules/key-conventions.mdc

```mdc
---
description:
globs:
alwaysApply: false
---

```

### .cursor/rules/typescript-usage.mdc

```mdc
---
description:
globs:
alwaysApply: false
---

```

### .cursor/rules/code-style.mdc

```mdc
---
description: 
globs: 
alwaysApply: false
---
# Code Style and Structure

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.

File structure for components:
1. Exported component
2. Subcomponents
3. Helper functions
4. Static content
5. Types

Always follow these patterns when modifying or creating new code.

```

### .cursor/rules/syntax-formatting.mdc

```mdc
---
description:
globs:
alwaysApply: false
---

```

### types/next-auth.d.ts

```typescript
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id. */
      id: string;
    } & DefaultSession['user'];
  }
}

```

### types/index.ts

```typescript
export * from "./config";

```

### types/config.ts

```typescript
export type Theme =
  | "light"
  | "dark"
  | "cupcake"
  | "bumblebee"
  | "emerald"
  | "corporate"
  | "synthwave"
  | "retro"
  | "cyberpunk"
  | "valentine"
  | "halloween"
  | "garden"
  | "forest"
  | "aqua"
  | "lofi"
  | "pastel"
  | "fantasy"
  | "wireframe"
  | "black"
  | "luxury"
  | "dracula"
  | "";

export interface ConfigProps {
  appName: string;
  appDescription: string;
  domainName: string;
  crisp: {
    id?: string;
    onlyShowOnRoutes?: string[];
  };
  stripe: {
    plans: {
      isFeatured?: boolean;
      priceId: string;
      name: string;
      description?: string;
      price: number;
      priceAnchor?: number;
      features: {
        name: string;
      }[];
    }[];
  };
  aws?: {
    bucket?: string;
    bucketUrl?: string;
    cdn?: string;
  };
  mailgun: {
    subdomain: string;
    fromNoReply: string;
    fromAdmin: string;
    supportEmail?: string;
    forwardRepliesTo?: string;
  };
  colors: {
    theme: Theme;
    main: string;
  };
  auth: {
    loginUrl: string;
    callbackUrl: string;
  };
}

```

### app/layout.tsx

```tsx
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Viewport } from "next";
import PlausibleProvider from "next-plausible";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "./globals.css";

const font = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className={font.className}>
      {config.domainName && (
        <head>
          <PlausibleProvider domain={config.domainName} />
        </head>
      )}
      <body>
        {/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

```

### app/error.tsx

```tsx
"use client";

import Link from "next/link";
import ButtonSupport from "@/components/ButtonSupport";

// A simple error boundary to show a nice error page if something goes wrong (Error Boundary)
// Users can contanct support, go to the main page or try to reset/refresh to fix the error
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <>
      <div className="h-screen w-full flex flex-col justify-center items-center text-center gap-6 p-6">
        <div className="p-6 bg-white rounded-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            data-name="Layer 1"
            className="w-36 h-36 md:w-64 md:h-64"
            viewBox="0 0 509.04617 507.58297"
          >
            <path
              fill="#f2f2f2"
              d="M504.17 454.213c-6.3 13.08-17.91 22.81-30.08 30.72a189.914 189.914 0 0 1-42.66 20.65c-2.06.71-4.14 1.37-6.23 2h-84.51c-.59-.64-1.15-1.31-1.68-2-5.66-7.25-8.72-16.54-7.61-25.64 1.43-11.69 10.31-22.43 21.81-24.91 11.51-2.49 24.63 4.38 28.13 15.63 1.92-21.68 4.14-44.26 15.66-62.72 10.44-16.71 28.51-28.67 48.09-30.81a60.558 60.558 0 0 1 33.48 6.13c.95.48 1.89.98 2.81 1.5a56.015 56.015 0 0 1 16.14 13.77c12.21 15.46 15.2 37.93 6.65 55.68Z"
            />
            <path
              fill="#fff"
              d="M480.76 386.133a317.08 317.08 0 0 0-90.56 119.45c-.29.66-.58 1.33-.86 2h-3.98c.28-.67.56-1.34.85-2 3.85-9 8.1-17.84 12.77-26.45a321.861 321.861 0 0 1 34.91-51.66 316.97 316.97 0 0 1 44.26-43.95 1.93 1.93 0 0 1 .42-.26 2.032 2.032 0 0 1 2.81 1.5 1.478 1.478 0 0 1-.62 1.37Z"
            />
            <path
              fill="#ffb8b8"
              d="M167.214 293.587a9.497 9.497 0 0 0-1.203-14.513l-4.796-31.62-19.702 6.201 10.793 28.21a9.549 9.549 0 0 0 14.908 11.722Z"
            />
            <path
              className="fill-primary"
              d="m146.919 278.711-12.153-56.756a32.5 32.5 0 0 1 9.281-30.393c15.556-14.99 35.55-33.885 42.455-38.772a35.606 35.606 0 0 1 22.277-6.576l.166.018 10.454 9.88-22.773 37.489-34.571 21.66 3.847 55.63Z"
            />
            <rect
              width={59}
              height={8}
              x={134.48}
              y={201.583}
              fill="#ccc"
              rx={4}
            />
            <rect
              width={59}
              height={8}
              x={134.48}
              y={288.583}
              fill="#ccc"
              rx={4}
            />
            <path
              fill="#ccc"
              d="M164.48 506.583a2 2 0 0 1-1.992-1.823l-25.496-299a2 2 0 1 1 3.984-.354l23.475 276.252L187.26 205.41a2 2 0 1 1 3.985.344l-24.771 299a2 2 0 0 1-1.99 1.828Z"
            />
            <circle cx={221.715} cy={108.007} r={26.239} fill="#ffb8b8" />
            <path
              fill="#ffb8b8"
              d="m143.516 494.591-12.478-3.977 9.402-50.025 18.418 5.87-15.342 48.132z"
            />
            <path
              fill="#2f2e41"
              d="m142.822 505.66-40.172-12.805.332-1.043a15.829 15.829 0 0 1 19.864-10.262l25.109 8.004Z"
            />
            <path
              fill="#ffb8b8"
              d="M234.305 494.332h-13.097l-6.233-50.518h19.33v50.518z"
            />
            <path
              fill="#2f2e41"
              d="M196.45 505.994h40.162V491.09h-25.354a14.826 14.826 0 0 0-14.809 14.81ZM233.922 477.938l-4.42-.66c-13.407-1.997-14.21-2.117-16.339-3.051-1.087-.478-1.163-7.693-.51-48.256.478-29.774 1.075-66.83-.083-86.723a3.5 3.5 0 0 0-6.703-1.18c-9.976 23.037-26.712 74.59-37.787 108.704-3.852 11.866-6.895 21.239-8.82 26.857a4.524 4.524 0 0 1-5.354 2.898c-9.114-2.278-8.504-3.247-21.485-6.604a4.489 4.489 0 0 1-3.282-5.282c2.348-11.072 45.314-190.6 48.603-207.666a4.502 4.502 0 0 1 5.305-3.571c9.674 1.949 15.56 4.017 25.12 6.016 10.315 2.158 20.982 4.39 31.386 6.472a4.463 4.463 0 0 1 2.619 1.605c2.574 3.252 6.392 5.077 10.434 7.01 2.724 1.302-3.45 1.185-1.077 3.063 9.61 7.608-4.21 162.088-12.56 196.978a4.515 4.515 0 0 1-5.047 3.39ZM232.898 130.967c-1.532-6.5 6.212-20.487 4.68-26.987-1.037-4.402-11.388-1.41-13.804-5.233s-6.461-6.921-10.984-6.972c-5.198-.058-10.313 3.798-15.237 2.131-4.978-1.685-6.57-8.503-4.368-13.276s6.942-7.814 11.627-10.197c7.978-4.059 17.266-7.023 25.805-4.337 5.161 1.623 9.477 5.14 13.653 8.58 3.807 3.136 7.678 6.342 10.339 10.495 5.213 8.135 4.899 19.095.444 27.669s-12.574 14.865-21.519 18.517"
            />
            <path
              className="fill-primary"
              d="M168.47 282.233c2.832-4.73 7.132-26.897 12.434-64.103 3.61-25.4 6.755-51.206 8.316-64.389a6.339 6.339 0 0 1 3.56-5.001q1.518-.734 3.02-1.388c12.922-5.621 26.019-7.484 38.923-5.536a70.619 70.619 0 0 1 34.92 15.91l.117.112.03.158c.056.293 5.476 29.498-5.625 49.23-10.948 19.468-11.076 71.026-11.076 71.544v.663l-.637-.182c-17.032-4.866-82.825 3.648-83.488 3.735l-1.025.133Z"
            />
            <rect
              width={59}
              height={8}
              x={212.48}
              y={214.583}
              fill="#ccc"
              rx={4}
            />
            <rect
              width={59}
              height={8}
              x={212.48}
              y={301.583}
              fill="#ccc"
              rx={4}
            />
            <path
              fill="#ccc"
              d="M242.48 507.583a2 2 0 0 1-1.992-1.823l-25.496-287a2 2 0 1 1 3.984-.354l23.475 264.252L265.26 218.41a2 2 0 0 1 3.985.344l-24.771 287a2 2 0 0 1-1.99 1.828Z"
            />
            <path
              fill="#ffb8b8"
              d="M226.013 302.85a9.497 9.497 0 0 1 8.896-11.53l21.208-23.938 13.17 15.91-24.39 17.818a9.549 9.549 0 0 1-18.884 1.74Z"
            />
            <path
              className="fill-primary"
              d="m238.36 286.189 33.458-44.61-17.253-36.97 1.253-43.845 14.144-2.613.15.075a35.606 35.606 0 0 1 15.128 17.624c3.142 7.856 9.659 34.581 14.573 55.619a32.5 32.5 0 0 1-8.723 30.557l-41.043 41.043Z"
            />
            <path
              fill="#ccc"
              d="m98.11 495.178 45.773 11.02a3.922 3.922 0 0 0 4.555-2.125l39.32-104.542a3.221 3.221 0 0 0 .003-2.546 3.644 3.644 0 0 0-2.094-1.961l-34.415-13.143a4.139 4.139 0 0 0-3.374.187 3.511 3.511 0 0 0-1.84 2.252l-.002.005-24.29 92.138-.36.023c-.14.009-14.065.956-20.327 8.472a13.291 13.291 0 0 0-2.949 10.22Z"
            />
            <path
              fill="#3f3d56"
              d="M496 506.583a.997.997 0 0 1-1 1H1a1 1 0 0 1 0-2h494a.997.997 0 0 1 1 1Z"
            />
            <path
              fill="#b3b3b3"
              d="m131.05 438.563.21-1.989 41.733 4.42-.211 1.989zM126.801 454.875l.82-1.824 33.583 15.11-.82 1.824zM177.384 426.985l-39.583-13.11.821-1.824 39.583 13.11-.821 1.824zM181.384 417.985l-39.583-19.11.821-1.824 39.583 19.11-.821 1.824zM122.832 470.232l1.299-1.521 28.54 24.38-1.3 1.52zM114.207 477.62l1.821-.827 11.46 25.27-1.822.825z"
            />
            <path
              fill="#f2f2f2"
              d="M384.34 477.987V22.183c0-6.155.117-12.323 0-18.477-.005-.27 0-.539 0-.808 0-3.86-6-3.867-6 0v455.804c0 6.155-.117 12.323 0 18.477.005.27 0 .539 0 .808 0 3.86 6 3.867 6 0Z"
            />
            <path
              fill="#f2f2f2"
              d="M417.523 130.291h-72a6.508 6.508 0 0 1-6.5-6.5v-87.5a6.508 6.508 0 0 1 6.5-6.5h72a6.508 6.508 0 0 1 6.5 6.5v87.5a6.508 6.508 0 0 1-6.5 6.5Z"
            />
          </svg>
        </div>

        <p className="font-medium md:text-xl md:font-semibold">
          Something went wrong 🥲
        </p>

        <p className="text-red-500">{error?.message}</p>

        <div className="flex flex-wrap gap-4 justify-center">
          <button className="btn btn-sm" onClick={reset}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                clipRule="evenodd"
              />
            </svg>
            Refresh
          </button>
          <ButtonSupport />
          <Link href="/" className="btn btn-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
                clipRule="evenodd"
              />
            </svg>
            Home
          </Link>
        </div>
      </div>
    </>
  );
}

```

### app/page.tsx

```tsx
import { Suspense } from 'react'
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import FeaturesAccordion from "@/components/FeaturesAccordion";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import QuizCTA from "@/app/components/QuizCTA";

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <Hero />
        <Problem />
        <QuizCTA />
        <FeaturesAccordion />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
```

### app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  scroll-behavior: smooth !important;
}

/* It makes the HTML progress bar filling smooth when value change. */
progress::-webkit-progress-value {
  transition: 0.6s width ease-out;
}

@layer base {
  .btn-gradient {
    @apply !bg-gradient !bg-[length:300%_300%] hover:saturate-[1.2] shadow duration-100 !border-0 !border-transparent !bg-transparent animate-shimmer disabled:!bg-none disabled:!bg-gray-500/30  !text-white;
  }
  .btn {
    @apply !capitalize;
  }
  
  /* Add custom style for drag-over state */
  .drag-over {
    border-color: #3b82f6 !important; /* blue-500 */
    background-color: rgba(219, 234, 254, 0.5) !important; /* blue-100 with opacity */
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important; /* blue glow effect */
    transform: scale(1.02);
    transition: all 0.2s ease;
  }
  
  /* Additional styles for drag and drop functionality */
  [data-target-id]:empty.drag-over {
    background-color: rgba(219, 234, 254, 0.8) !important; /* brighter blue-100 for empty targets */
  }
  
  [data-option-id] {
    touch-action: none; /* Prevents browsers from handling touch events in ways that interfere with dragging */
  }
}

```

### app/not-found.tsx

```tsx
import Link from "next/link";
import ButtonSupport from "@/components/ButtonSupport";

// Simple 404 page with a button to go home and a button to contact support
// Show a cute SVG with your primary color
export default function Custom404() {
  return (
    <section className="relative bg-base-100 text-base-content h-screen w-full flex flex-col justify-center gap-8 items-center p-10">
      <div className="p-6 bg-white rounded-xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-56 h-56"
          viewBox="0 0 860.13137 571.14799"
        >
          <path
            fill="#f2f2f2"
            d="M435.735 160.527c-7.669-12.684-16.757-26.228-30.99-30.37-16.481-4.796-33.412 4.732-47.774 14.135a1392.157 1392.157 0 0 0-123.893 91.283l.043.493 92.451-6.376c22.265-1.535 45.296-3.283 64.972-13.816 7.467-3.996 14.745-9.335 23.206-9.707 10.511-.463 19.677 6.879 26.88 14.549 42.607 45.37 54.937 114.754 102.738 154.616a1516.995 1516.995 0 0 0-107.633-214.807Z"
          />
          <path
            fill="#e4e4e4"
            d="M697.636 545.355c-4.711-5.95-6.637-7.343-11.284-13.347q-56.765-73.417-106.708-151.793-33.924-53.23-64.483-108.504-14.549-26.278-28.3-52.969-10.67-20.695-20.864-41.638a841.984 841.984 0 0 1-5.711-12.009c-4.428-9.442-8.774-18.93-13.44-28.244-5.317-10.616-11.789-21.745-21.552-28.877a29.405 29.405 0 0 0-15.319-5.895c-7.948-.513-15.282 2.769-22.176 6.353-50.438 26.301-97.659 59.276-140.37 96.798A730.778 730.778 0 0 0 133.39 331.82c-1.009 1.44-3.393.064-2.375-1.384q6.01-8.498 12.257-16.813a734.817 734.817 0 0 1 187.6-174.986q18.248-11.825 37.182-22.542c6.362-3.603 12.752-7.16 19.251-10.497 6.372-3.272 13.137-6.215 20.416-6.325 24.77-.385 37.595 27.667 46.405 46.542q4.153 8.911 8.406 17.767 16.075 33.62 33.388 66.628 10.684 20.379 21.837 40.52 34.707 62.717 73.778 122.896c34.506 53.143 68.737 100.089 108.046 149.785 1.082 1.375-.852 3.337-1.944 1.943ZM244.982 191.378c-1.44-1.604-2.87-3.209-4.318-4.813-11.422-12.632-23.679-25.118-39.364-32.36a57.11 57.11 0 0 0-23.927-5.547c-8.562.028-16.932 2.274-24.843 5.418-3.74 1.494-7.399 3.19-11.001 4.996-4.116 2.072-8.16 4.281-12.183 6.51q-11.332 6.27-22.369 13.09-21.96 13.572-42.545 29.216-10.671 8.113-20.902 16.758-9.516 8.03-18.646 16.492c-1.302 1.201-3.245-.742-1.944-1.943a441.255 441.255 0 0 1 4.85-4.446q6.875-6.216 13.971-12.193 12.94-10.918 26.549-20.993 21.162-15.676 43.782-29.226 11.304-6.765 22.919-12.962a198.735 198.735 0 0 1 7.095-3.621 113.116 113.116 0 0 1 16.868-6.867 60.006 60.006 0 0 1 25.476-2.502 66.327 66.327 0 0 1 23.505 8.131c15.401 8.608 27.346 21.92 38.97 34.91 1.174 1.32-.76 3.272-1.943 1.952Z"
          />
          <path
            fill="#e4e4e4"
            d="m560.542 322.285 36.905-13.498 18.323-6.702c5.968-2.183 11.921-4.667 18.09-6.23a28.539 28.539 0 0 1 16.374.208 37.738 37.738 0 0 1 12.77 7.917 103.64 103.64 0 0 1 10.475 11.186c3.99 4.795 7.92 9.64 11.868 14.467q24.442 29.891 48.563 60.042 24.121 30.15 47.92 60.556 23.857 30.48 47.386 61.216 2.882 3.765 5.76 7.534c1.059 1.388 3.449.02 2.374-1.388q-23.702-31.045-47.735-61.835-24.092-30.864-48.516-61.466-24.425-30.601-49.179-60.937-6.167-7.558-12.354-15.099c-3.48-4.24-6.92-8.527-10.737-12.474-7.005-7.245-15.757-13.648-26.234-13.822-6.16-.102-12.121 1.853-17.844 3.923-6.17 2.232-12.325 4.506-18.486 6.76l-37.163 13.592-9.29 3.398c-1.65.603-.937 3.262.73 2.652Z"
          />
          <path
            fill="#f2f2f2"
            d="M196.443 170.1c-18.754-9.639-42.771-7.75-60.005 4.291a855.847 855.847 0 0 1 97.37 22.726c-13.282-7.784-23.672-19.98-37.365-27.017ZM136.253 174.358l-3.61 2.935a53.444 53.444 0 0 1 3.795-2.902c-.062-.01-.123-.022-.185-.033ZM661.615 322.42c-3.633-4.422-7.56-9.052-12.994-10.849l-5.073.2a575.436 575.436 0 0 0 153.267 175.221l-135.2-164.572ZM346.15 285.94a37.481 37.481 0 0 0 14.93 20.96c2.82 1.92 6.157 3.761 7.122 7.034a8.379 8.379 0 0 1-.873 6.15 24.884 24.884 0 0 1-3.862 5.041l-.136.512c-6.999-4.147-13.657-9.393-17.523-16.551s-4.405-16.539.342-23.146M579.15 488.94a37.481 37.481 0 0 0 14.93 20.96c2.82 1.92 6.157 3.761 7.122 7.034a8.379 8.379 0 0 1-.873 6.15 24.884 24.884 0 0 1-3.862 5.041l-.136.512c-6.999-4.147-13.657-9.393-17.523-16.551s-4.405-16.539.342-23.146M114.15 474.94a37.481 37.481 0 0 0 14.93 20.96c2.82 1.92 6.157 3.761 7.122 7.034a8.379 8.379 0 0 1-.873 6.15 24.884 24.884 0 0 1-3.862 5.041l-.136.512c-6.999-4.147-13.657-9.393-17.523-16.551s-4.405-16.539.342-23.146"
          />
          <circle cx={649.249} cy={51} r={51} className="fill-primary" />
          <path
            fill="#f0f0f0"
            d="M741.284 11.87c-24.717-3.34-52.935 10.02-59.341 34.124a21.597 21.597 0 0 0-41.094 2.109l2.83 2.026a372.275 372.275 0 0 0 160.659-.726C787.145 31.334 766 15.21 741.284 11.87ZM635.284 79.87c-24.717-3.34-52.935 10.02-59.341 34.124a21.597 21.597 0 0 0-41.094 2.109l2.83 2.026a372.275 372.275 0 0 0 160.659-.726C681.145 99.334 660 83.21 635.284 79.87Z"
          />
          <path
            fill="#ccc"
            d="M851.011 92.728a.982.982 0 0 1-.302-.047C586.303 9.063 353.265 19.998 204.33 43.895a1294.017 1294.017 0 0 0-60.403 11.161 1196.246 1196.246 0 0 0-15.597 3.378 1023.104 1023.104 0 0 0-18.532 4.306q-3.873.917-7.595 1.849a972.21 972.21 0 0 0-11.66 2.957 930.173 930.173 0 0 0-13.797 3.671.442.442 0 0 1-.051.015v.001a926.363 926.363 0 0 0-15.323 4.325c-2.698.78-5.304 1.548-7.8 2.307-.278.077-.525.151-.776.227l-.536.164c-.31.094-.617.187-.924.275l-.02.006h.001l-.811.253c-.968.293-1.912.579-2.841.864C23.119 87.22 9.626 92.604 9.493 92.656a1 1 0 1 1-.744-1.856c.134-.053 13.693-5.463 38.327-13.058.932-.286 1.88-.572 2.85-.866l.754-.235c.026-.01.051-.017.078-.025.305-.087.61-.18.92-.273l.536-.164c.268-.08.532-.16.802-.235a593.8 593.8 0 0 1 7.797-2.307 932.235 932.235 0 0 1 15.334-4.328c.017-.006.033-.01.05-.014v-.001a941.379 941.379 0 0 1 13.844-3.685 993.766 993.766 0 0 1 11.68-2.962q3.738-.93 7.61-1.852a1026.011 1026.011 0 0 1 18.563-4.313c5.299-1.183 10.555-2.322 15.622-3.383a1295.424 1295.424 0 0 1 60.497-11.178c149.149-23.932 382.52-34.884 647.299 48.854a1 1 0 0 1-.3 1.953Z"
          />
          <path
            fill="#3f3d56"
            d="M262.989 419.84a6.73 6.73 0 0 0-1.7-2.67 6.43 6.43 0 0 0-.92-.71c-2.61-1.74-6.51-2.13-8.99 0a5.81 5.81 0 0 0-.69.71q-1.11 1.365-2.28 2.67a88.226 88.226 0 0 1-3.96 4.24c-.39.38-.78.77-1.18 1.15-.23.23-.46.45-.69.67-.88.84-1.78 1.65-2.69 2.45-.48.43-.96.85-1.45 1.26-.73.61-1.46 1.22-2.2 1.81-.07.05-.14.1-.21.16-.02.01-.03.03-.05.04-.01 0-.02 0-.03.02a.179.179 0 0 0-.07.05c-.22.15-.37.25-.48.34.04-.02.08-.05.12-.07-.18.14-.37.28-.55.42a92.853 92.853 0 0 1-5.37 3.69 99.21 99.21 0 0 1-14.22 7.55c-.33.13-.67.27-1.01.4a85.97 85.97 0 0 1-40.85 6.02q-2.13-.165-4.26-.45c-1.64-.24-3.27-.53-4.89-.86a97.932 97.932 0 0 1-18.02-5.44 118.652 118.652 0 0 1-20.66-12.12c-1-.71-2.01-1.42-3.02-2.11 1.15-2.82 2.28-5.64 3.38-8.48.55-1.37 1.08-2.74 1.6-4.12 4.09-10.63 7.93-21.36 11.61-32.13q5.58-16.365 10.53-32.92.51-1.68.99-3.36 2.595-8.745 4.98-17.53c.15-.57.31-1.13.45-1.7q.69-2.52 1.35-5.04c1-3.79-1.26-8.32-5.24-9.23a7.634 7.634 0 0 0-9.22 5.24c-.43 1.62-.86 3.23-1.3 4.85q-3.165 11.745-6.66 23.41l-1.02 3.36q-7.71 25.41-16.93 50.31-1.11 3.015-2.25 6.01c-.37.98-.74 1.96-1.12 2.94-.73 1.93-1.48 3.86-2.23 5.79-.43 1.13-.87 2.26-1.31 3.38-.29.71-.57 1.42-.85 2.12a41.81 41.81 0 0 0-8.81-2.12l-.48-.06a27.397 27.397 0 0 0-7.01.06 23.914 23.914 0 0 0-17.24 10.66c-4.77 7.51-4.71 18.25 1.98 24.63 6.89 6.57 17.32 6.52 25.43 2.41a28.351 28.351 0 0 0 10.52-9.86 50.57 50.57 0 0 0 2.74-4.65c.21.14.42.28.63.43.8.56 1.6 1.13 2.39 1.69a111.738 111.738 0 0 0 14.51 8.91 108.359 108.359 0 0 0 34.62 10.47c.27.03.53.07.8.1 1.33.17 2.67.3 4.01.41a103.782 103.782 0 0 0 55.58-11.36q2.175-1.125 4.31-2.36 3.315-1.92 6.48-4.08c1.15-.78 2.27-1.57 3.38-2.4a101.042 101.042 0 0 0 13.51-11.95q2.355-2.475 4.51-5.11a8.061 8.061 0 0 0 2.2-5.3 7.564 7.564 0 0 0-.5-2.64Zm-165.59 23.82c.21-.15.42-.31.62-.47-.06.15-.35.32-.62.47Zm3.21-3.23c-.23.26-.44.52-.67.78a23.366 23.366 0 0 1-2.25 2.2c-.11.1-.23.2-.35.29a.01.01 0 0 0-.01.01 3.804 3.804 0 0 0-.42.22q-.645.39-1.32.72a17.005 17.005 0 0 1-2.71.75 16.8 16.8 0 0 1-2.13.02h-.02a14.823 14.823 0 0 1-1.45-.4c-.24-.12-.47-.26-.7-.4-.09-.08-.17-.16-.22-.21a2.44 2.44 0 0 1-.27-.29.01.01 0 0 0-.01-.01c-.11-.2-.23-.4-.34-.6a.031.031 0 0 1-.01-.02c-.08-.25-.15-.51-.21-.77a12.51 12.51 0 0 1 .01-1.37 13.467 13.467 0 0 1 .54-1.88 11.068 11.068 0 0 1 .69-1.26c.02-.04.12-.2.23-.38.01-.01.01-.01.01-.02.15-.17.3-.35.46-.51.27-.3.56-.56.85-.83a18.022 18.022 0 0 1 1.75-1.01 19.48 19.48 0 0 1 2.93-.79 24.99 24.99 0 0 1 4.41.04 30.301 30.301 0 0 1 4.1 1.01 36.945 36.945 0 0 1-2.77 4.54c-.04.06-.08.12-.12.17Zm-11.12-3.29a2.18 2.18 0 0 1-.31.39 1.409 1.409 0 0 1 .31-.39Z"
          />
          <path
            fill="#3f3d56"
            d="m232.929 317.71-.27 9.42q-.285 10.455-.59 20.92-.315 11.775-.66 23.54-.165 6.075-.34 12.15-.465 16.365-.92 32.72c-.03 1.13-.07 2.25-.1 3.38l-.45 16.23q-.255 8.805-.5 17.61-.18 6.6-.37 13.21l-2.7 95.79a7.648 7.648 0 0 1-7.5 7.5 7.561 7.561 0 0 1-7.5-7.5q.75-26.94 1.52-53.88.675-24.36 1.37-48.72l.45-16.06q.345-12.09.68-24.18c.03-1.13.07-2.25.1-3.38.02-.99.05-1.97.08-2.96l1.32-46.96q.27-9.24.52-18.49l.6-21.08c.09-3.09.17-6.17.26-9.26a7.648 7.648 0 0 1 7.5-7.5 7.561 7.561 0 0 1 7.5 7.5ZM644.357 319.791a893.238 893.238 0 0 1-28.161 87.941c-3.007 7.947-6.083 15.877-9.372 23.712l.756-1.791a54.583 54.583 0 0 1-5.59 10.612q-.229.32-.466.636 1.166-1.49.443-.589c-.254.3-.505.602-.768.895a23.664 23.664 0 0 1-2.249 2.204q-.301.257-.612.504l.938-.73c-.109.258-.873.598-1.11.744a18.254 18.254 0 0 1-2.405 1.218l1.791-.756a19.086 19.086 0 0 1-4.23 1.16l1.993-.267a17.02 17.02 0 0 1-4.298.046l1.994.268a14.002 14.002 0 0 1-3.405-.917l1.791.756a12.012 12.012 0 0 1-1.678-.896c-.272-.177-1.106-.809-.015.024 1.133.866.145.075-.088-.155-.194-.192-.37-.4-.56-.595-.882-.905.997 1.556.397.498a18.182 18.182 0 0 1-.878-1.637l.756 1.792a11.925 11.925 0 0 1-.728-2.651l.268 1.993a13.651 13.651 0 0 1-.003-3.404l-.268 1.993a15.964 15.964 0 0 1 .995-3.68l-.756 1.792a16.73 16.73 0 0 1 1.178-2.299 6.73 6.73 0 0 1 .728-1.071c.05.016-1.268 1.513-.57.757.184-.198.355-.406.54-.602.296-.314.613-.6.925-.898 1.045-.994-1.461.966-.256.18a19.049 19.049 0 0 1 2.75-1.5l-1.792.756a20.311 20.311 0 0 1 4.995-1.34l-1.994.268a25.628 25.628 0 0 1 6.46.076l-1.993-.267a33.21 33.21 0 0 1 7.892 2.22l-1.792-.757c5.39 2.314 10.163 5.75 14.928 9.118a111.95 111.95 0 0 0 14.506 8.907 108.388 108.388 0 0 0 34.622 10.474 103.933 103.933 0 0 0 92.586-36.752 8.078 8.078 0 0 0 2.197-5.304 7.632 7.632 0 0 0-2.197-5.303c-2.752-2.526-7.95-3.239-10.607 0a95.636 95.636 0 0 1-8.106 8.727q-2.018 1.914-4.143 3.71-1.213 1.026-2.46 2.011c-.394.31-1.62 1.138.263-.197-.432.306-.845.64-1.27.954a99.269 99.269 0 0 1-20.333 11.565l1.792-.756a96.836 96.836 0 0 1-24.172 6.623l1.994-.268a97.643 97.643 0 0 1-25.753-.038l1.993.268a99.8 99.8 0 0 1-24.857-6.77l1.792.755a116.025 116.025 0 0 1-21.736-12.59 86.877 86.877 0 0 0-11.113-6.995 42.824 42.824 0 0 0-14.438-4.388c-9.44-1.111-19.057 2.565-24.247 10.72-4.775 7.505-4.714 18.244 1.974 24.625 6.888 6.573 17.319 6.517 25.436 2.406 7.817-3.96 12.513-12.186 15.815-19.942 7.43-17.455 14.01-35.314 20.14-53.263q9.096-26.637 16.498-53.813.917-3.366 1.807-6.74c1.001-3.788-1.261-8.32-5.238-9.225a7.633 7.633 0 0 0-9.226 5.238Z"
          />
          <path
            fill="#3f3d56"
            d="m719.19 317.71-2.7 95.793-2.686 95.294-1.518 53.883a7.565 7.565 0 0 0 7.5 7.5 7.65 7.65 0 0 0 7.5-7.5l2.7-95.793 2.685-95.294 1.518-53.883a7.565 7.565 0 0 0-7.5-7.5 7.65 7.65 0 0 0-7.5 7.5Z"
          />
          <path
            d="M459.591 535.935h2.33V429.893h54.328v-2.322H461.92v-44.745h41.956q-.923-1.173-1.899-2.317H461.92v-29.553a65.378 65.378 0 0 0-2.329-.943v30.496H413.94v-37.865c-.782.036-1.552.09-2.329.155v37.71h-36.42v-28.25a54.63 54.63 0 0 0-2.317 1.092v27.158h-30.615v2.317h30.615v44.744h-30.615v2.323h30.615v106.042h2.317V429.893a36.413 36.413 0 0 1 36.42 36.42v69.622h2.33V429.893h45.651Zm-84.4-108.365v-44.744h36.42v44.745Zm38.748 0v-44.744h.914a44.741 44.741 0 0 1 44.738 44.745Z"
            opacity={0.2}
          />
          <path
            fill="#3f3d56"
            d="M445.369 504.14a63.059 63.059 0 0 1-20.05 33.7c-.74.64-1.48 1.26-2.25 1.87q-2.805.255-5.57.52c-1.53.14-3.04.29-4.54.43l-.27.03-.19-1.64-.76-6.64a37.623 37.623 0 0 1-3.3-32.44c2.64-7.12 7.42-13.41 12.12-19.65 6.49-8.62 12.8-17.14 13.03-27.65a60.544 60.544 0 0 1 7.9 13.33 16.432 16.432 0 0 0-5.12 3.77c-.41.45-.82 1.08-.54 1.62.24.46.84.57 1.36.63l3.76.39c1 .11 2 .21 3 .32a63.99 63.99 0 0 1 2.45 12.18 61.189 61.189 0 0 1-1.03 19.23Z"
          />
          <path
            className="fill-primary"
            d="M478.569 477.93c-5.9 4.29-9.35 10.46-12.03 17.26a16.628 16.628 0 0 0-7.17 4.58c-.41.45-.82 1.08-.54 1.62.24.46.84.57 1.36.63l3.76.39c-2.68 8.04-5.14 16.36-9.88 23.15a36.99 36.99 0 0 1-12.03 10.91 38.492 38.492 0 0 1-4.02 1.99q-7.62.585-14.95 1.25-2.805.255-5.57.52c-1.53.14-3.04.29-4.54.43q-.015-.825 0-1.65a63.304 63.304 0 0 1 15.25-39.86c.45-.52.91-1.03 1.38-1.54a61.792 61.792 0 0 1 16.81-12.7 62.654 62.654 0 0 1 32.17-6.98Z"
          />
          <path
            className="fill-primary"
            d="m419.229 535.1-1.15 3.4-.58 1.73c-1.53.14-3.04.29-4.54.43l-.27.03-4.96.51c-.43-.5-.86-1.01-1.28-1.53a62.03 62.03 0 0 1 8.07-87.11c-1.32 6.91.22 13.53 2.75 20.1-.27.11-.53.22-.78.34a16.432 16.432 0 0 0-5.12 3.77c-.41.45-.82 1.08-.54 1.62.24.46.84.57 1.36.63l3.76.39c1 .11 2 .21 3 .32l1.41.15c.07.15.13.29.2.44 2.85 6.18 5.92 12.39 7.65 18.83a43.666 43.666 0 0 1 1.02 4.91 37.604 37.604 0 0 1-10 31.04Z"
          />
          <path
            fill="#3f3d56"
            d="M519.887 390.06c-8.609-16.792-21.946-30.92-37.632-41.303a114.237 114.237 0 0 0-52.563-18.38q-3.69-.335-7.399-.393c-2.921-.043-46.866 12.632-61.587 22.982a114.295 114.295 0 0 0-35.333 39.527 102.5 102.5 0 0 0-12.126 51.634 113.564 113.564 0 0 0 14.703 51.476 110.475 110.475 0 0 0 36.444 38.745c15.338 9.787 30.745 35.736 48.855 36.652 18.246.923 39.054-23.555 55.695-30.987a104.425 104.425 0 0 0 41.725-34.005 110.25 110.25 0 0 0 19.6-48.948c2.573-18.083 1.374-36.733-4.802-54.016a111.86 111.86 0 0 0-5.58-12.983c-1.78-3.506-6.996-4.796-10.261-2.691a7.68 7.68 0 0 0-2.691 10.261q1.568 3.088 2.915 6.278l-.756-1.792a101.15 101.15 0 0 1 6.877 25.539l-.268-1.994a109.229 109.229 0 0 1-.066 28.682l.267-1.994a109.734 109.734 0 0 1-7.554 27.675l.756-1.792a104.212 104.212 0 0 1-6.672 13.098q-1.923 3.186-4.08 6.222c-.632.888-1.283 1.761-1.94 2.631-.855 1.136 1.168-1.483.283-.37-.15.19-.3.38-.452.57q-.681.852-1.382 1.688a93.613 93.613 0 0 1-10.176 10.383q-1.366 1.193-2.778 2.331c-.469.379-.932.773-1.42 1.125.018-.013 1.579-1.2.655-.51-.29.216-.579.435-.87.651q-2.91 2.156-5.974 4.092a103.485 103.485 0 0 1-14.756 7.713l1.792-.756a109.215 109.215 0 0 1-27.597 7.552l1.994-.268a108.154 108.154 0 0 1-28.589.05l1.994.268a99.835 99.835 0 0 1-25.096-6.784l1.792.756a93.643 93.643 0 0 1-13.416-6.991q-3.174-2-6.184-4.248c-.286-.213-.57-.43-.855-.645-.915-.691.658.51.67.518a19.169 19.169 0 0 1-1.534-1.225q-1.454-1.184-2.862-2.422a101.99 101.99 0 0 1-10.493-10.71q-1.213-1.433-2.374-2.91c-.335-.426-.946-1.29.404.53-.177-.24-.362-.475-.541-.713q-.647-.858-1.276-1.728-2.203-3.048-4.188-6.246a109.29 109.29 0 0 1-7.805-15.108l.756 1.791a106.588 106.588 0 0 1-7.34-26.837l.267 1.994a97.866 97.866 0 0 1-.048-25.636l-.268 1.994a94.673 94.673 0 0 1 6.595-23.959l-.757 1.792a101.557 101.557 0 0 1 7.196-13.857q2.065-3.323 4.377-6.484.526-.719 1.063-1.428c.324-.428 1.215-1.494-.306.388.15-.184.293-.374.44-.56q1.269-1.608 2.6-3.165a107.402 107.402 0 0 1 10.883-11.02q1.474-1.293 2.994-2.53.691-.562 1.391-1.113c.187-.147.376-.29.562-.438-1.998 1.59-.555.432-.102.092q3.134-2.348 6.436-4.46a103.644 103.644 0 0 1 15.386-8.109l-1.791.756c7.76-3.258 42.14-10.949 48.394-10.11l-1.994-.267a106.225 106.225 0 0 1 26.72 7.382l-1.792-.756a110.313 110.313 0 0 1 12.6 6.33q3.044 1.783 5.968 3.762 1.383.936 2.738 1.915.677.489 1.346.989c.248.185.494.372.741.558 1.04.779-1.431-1.129-.342-.267a110.843 110.843 0 0 1 10.368 9.253q2.401 2.445 4.637 5.045 1.147 1.335 2.246 2.708c.365.455 1.605 2.1.085.084.372.493.747.983 1.114 1.48a97.977 97.977 0 0 1 8.392 13.537c1.793 3.498 6.987 4.802 10.261 2.691a7.677 7.677 0 0 0 2.69-10.261Z"
          />
          <path
            fill="#3f3d56"
            d="M432.497 512.456a3.78 3.78 0 0 1-2.74-6.552l.26-1.03-.103-.247c-3.48-8.297-25.685 14.834-26.645 22.632a30.029 30.029 0 0 0 .527 10.328 120.392 120.392 0 0 1-10.952-50.003 116.202 116.202 0 0 1 .72-12.963q.598-5.293 1.658-10.51a121.787 121.787 0 0 1 24.151-51.617c6.874.383 12.898-.664 13.48-13.986.103-2.37 1.86-4.421 2.248-6.756a30.72 30.72 0 0 1-1.98.183l-.623.032-.077.004a3.745 3.745 0 0 1-3.076-6.101l.85-1.046c.43-.538.872-1.065 1.302-1.603a1.865 1.865 0 0 0 .14-.161c.495-.613.99-1.216 1.485-1.829a10.83 10.83 0 0 0-3.55-3.432c-4.96-2.904-11.802-.893-15.384 3.593-3.593 4.486-4.271 10.78-3.023 16.385a43.398 43.398 0 0 0 6.003 13.383c-.27.344-.549.677-.818 1.022a122.574 122.574 0 0 0-12.793 20.268c1.016-7.939-11.412-36.608-16.218-42.68-5.773-7.295-17.611-4.112-18.628 5.135l-.03.268q1.072.604 2.097 1.283a5.127 5.127 0 0 1-2.067 9.33l-.104.016c-9.556 13.644 21.077 49.155 28.745 41.182a125.11 125.11 0 0 0-6.735 31.692 118.664 118.664 0 0 0 .086 19.16l-.032-.226c-1.704-13.882-30.931-34.522-39.466-32.803-4.917.99-9.76.765-9.013 5.725l.036.237a34.442 34.442 0 0 1 3.862 1.861q1.07.605 2.096 1.283a5.127 5.127 0 0 1-2.067 9.33l-.104.016-.215.033c-4.35 14.966 27.907 39.12 47.517 31.434h.011a125.075 125.075 0 0 0 8.402 24.528h30.015c.107-.333.204-.678.301-1.011a34.102 34.102 0 0 1-8.305-.495c2.227-2.732 4.454-5.486 6.68-8.219a1.861 1.861 0 0 0 .14-.161c1.13-1.399 2.27-2.787 3.4-4.185v-.002a49.952 49.952 0 0 0-1.463-12.725Zm-34.37-67.613.015-.022-.016.043Zm-6.65 59.932-.257-.58c.01-.42.01-.84 0-1.27 0-.119-.022-.237-.022-.355.097.742.183 1.484.29 2.227Z"
          />
          <circle cx={95.249} cy={439} r={11} fill="#3f3d56" />
          <circle cx={227.249} cy={559} r={11} fill="#3f3d56" />
          <circle cx={728.249} cy={559} r={11} fill="#3f3d56" />
          <circle cx={755.249} cy={419} r={11} fill="#3f3d56" />
          <circle cx={723.249} cy={317} r={11} fill="#3f3d56" />
          <path
            fill="#3f3d56"
            d="M264.249 419a10.949 10.949 0 1 1-.21-2.16 10.992 10.992 0 0 1 .21 2.16Z"
          />
          <circle cx={484.249} cy={349} r={11} fill="#3f3d56" />
          <path
            fill="#3f3d56"
            d="M375.249 349a10.949 10.949 0 1 1-.21-2.16 10.992 10.992 0 0 1 .21 2.16ZM233.249 317a10.949 10.949 0 1 1-.21-2.16 10.992 10.992 0 0 1 .21 2.16Z"
          />
          <circle cx={599.249} cy={443} r={11} fill="#3f3d56" />
          <circle cx={426.249} cy={338} r={16} fill="#3f3d56" />
          <path
            fill="#cacaca"
            d="m858.94 570.84-857.75.308a1.19 1.19 0 1 1 0-2.381l857.75-.308a1.19 1.19 0 0 1 0 2.382Z"
          />
        </svg>
      </div>
      <p className="text-lg md:text-xl font-semibold">
        This page doesn&apos;t exist 😅
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/" className="btn btn-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
              clipRule="evenodd"
            />
          </svg>
          Home
        </Link>

        <ButtonSupport />
      </div>
    </section>
  );
}

```

### app/question-types/page.tsx

```tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuiz } from '../features/quiz/context/QuizContext';
import { Quiz, QuestionType } from '../types/quiz';

// Mock quiz metadata
const mockQuiz: Quiz = {
  id: 'question-types-demo',
  title: 'Question Types Demo',
  description: 'Demonstration of all available question types',
  difficulty: 'medium',
  quiz_topic: 'question-types-demo',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  questions: [],
};

// Sample questions for each type
const questionTypeSamples = [
  {
    id: 'single-selection-demo',
    type: 'single_selection',
    question: 'Which of these is a cloud service provider?',
    points: 1,
    quiz_tag: 'question-types-demo',
    difficulty: 'easy',
    explanation: 'AWS (Amazon Web Services) is a cloud service provider.',
    feedback_correct: 'Correct! AWS is a cloud service provider.',
    feedback_incorrect: 'Incorrect. AWS is the cloud service provider in this list.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    options: [
      { option_id: 'A', text: 'AWS' },
      { option_id: 'B', text: 'Windows 11' },
      { option_id: 'C', text: 'Firefox' },
      { option_id: 'D', text: 'MS Office' }
    ],
    correctAnswerOptionId: 'A'
  },
  {
    id: 'multi-choice-demo',
    type: 'multi',
    question: 'Which of these are cloud service providers? (Select all that apply)',
    points: 2,
    quiz_tag: 'question-types-demo',
    difficulty: 'medium',
    explanation: 'AWS, Azure, and Google Cloud are all cloud service providers.',
    feedback_correct: 'Correct! AWS, Azure, and Google Cloud are all cloud service providers.',
    feedback_incorrect: 'Incorrect. AWS, Azure, and Google Cloud are the cloud service providers in this list.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    options: [
      { option_id: 'A', text: 'AWS' },
      { option_id: 'B', text: 'Azure' },
      { option_id: 'C', text: 'Windows 11' },
      { option_id: 'D', text: 'Google Cloud' }
    ],
    correctAnswerOptionIds: ['A', 'B', 'D']
  }
  // More question types can be added here
];

const QuestionTypesPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  
  const availableTypes: Array<{
    type: QuestionType;
    name: string;
    description: string;
    available: boolean;
  }> = [
    {
      type: 'single_selection',
      name: 'Single Selection',
      description: 'User selects one correct answer from multiple choices.',
      available: true
    },
    {
      type: 'multi',
      name: 'Multiple Selection',
      description: 'User selects multiple correct answers from multiple choices.',
      available: true
    },
    {
      type: 'drag_and_drop',
      name: 'Drag and Drop',
      description: 'User matches items by dragging them to their corresponding targets.',
      available: false
    },
    {
      type: 'dropdown_selection',
      name: 'Dropdown Selection',
      description: 'User selects answers from dropdown menus within text.',
      available: false
    },
    {
      type: 'order',
      name: 'Ordering',
      description: 'User arranges items in the correct sequence.',
      available: false
    },
    {
      type: 'yes_no',
      name: 'Yes/No',
      description: 'User answers a question with yes or no.',
      available: false
    },
    {
      type: 'yesno_multi',
      name: 'Multiple Yes/No',
      description: 'User answers multiple statements with yes or no.',
      available: false
    }
  ];
  
  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-custom-dark-blue">
          Available Question Types
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTypes.map((typeInfo) => (
            <div 
              key={typeInfo.type}
              className={`bg-white p-6 rounded-lg shadow-lg transition-all duration-300 
                ${typeInfo.available 
                  ? 'cursor-pointer hover:shadow-xl transform hover:-translate-y-1' 
                  : 'opacity-60 cursor-not-allowed'
                }`}
              onClick={() => typeInfo.available && setSelectedType(typeInfo.type)}
            >
              <h2 className="text-xl font-bold mb-2 text-custom-primary">{typeInfo.name}</h2>
              <p className="text-gray-600 mb-4">{typeInfo.description}</p>
              <div className={`px-4 py-2 rounded-full text-sm font-medium text-center ${
                typeInfo.available 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
              }`}>
                {typeInfo.available ? 'Available' : 'Coming Soon'}
              </div>
            </div>
          ))}
        </div>
        
        {selectedType && (
          <div className="mt-12 bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-custom-dark-blue">
              {availableTypes.find(t => t.type === selectedType)?.name} Example
            </h2>
            
            {/* Display sample question based on selected type */}
            <div className="mb-8">
              {/* We would render the sample question here */}
              <p className="text-lg font-medium text-center text-custom-primary">
                Click the buttons below to see demos of this question type
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link
                href={`/question-types-demo/${selectedType}`}
                className="bg-custom-primary hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg text-center"
              >
                See Interactive Demo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionTypesPage;

```

### app/types/quiz.ts

```typescript
export type QuestionType =
  | 'drag_and_drop'
  | 'dropdown_selection'
  | 'multi'
  | 'single_selection'
  | 'order'
  | 'yes_no'
  | 'yesno_multi';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface BaseQuestion {
  id: string; // UUID
  type: QuestionType;
  question: string;
  points: number;
  quiz_tag: string; // Corresponds to Quiz.id
  difficulty: Difficulty;
  explanation?: string | null;
  feedback_correct: string;
  feedback_incorrect: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface SelectionOption {
  option_id: string;
  text: string;
  // Note: The database table `single_selection_options` does not have `question_id` directly in its TS type,
  // as options will be nested under a question. The `question_id` is for the DB relation.
}

// Updated SingleSelectionQuestion to include specific properties
export interface SingleSelectionQuestion extends BaseQuestion {
  type: 'single_selection';
  options: SelectionOption[];
  // The `single_selection_correct_answer` table stores `option_id` for the correct answer,
  // linked to the `question_id`.
  correctAnswerOptionId: string; 
}

// Multi-choice question where users can select multiple answers
export interface MultiChoiceQuestion extends BaseQuestion {
  type: 'multi';
  options: SelectionOption[];
  // An array of correct option IDs
  correctAnswerOptionIds: string[];
}

export interface DragAndDropTarget {
  target_id: string;
  text: string;
}

export interface DragAndDropOption {
  option_id: string;
  text: string;
}

export interface DragAndDropCorrectPair {
  option_id: string;
  target_id: string;
}

// Drag and drop question where users match options to targets
export interface DragAndDropQuestion extends BaseQuestion {
  type: 'drag_and_drop';
  targets: DragAndDropTarget[];
  options: DragAndDropOption[];
  correctPairs: DragAndDropCorrectPair[];
}

// AnyQuestion will be a union of all specific question types
export type AnyQuestion = SingleSelectionQuestion | MultiChoiceQuestion | DragAndDropQuestion; // Add more as implemented

export interface Quiz {
  id: string; // e.g. azure-a102
  title: string;
  description?: string | null;
  quiz_type?: string | null;
  settings?: Record<string, any> | null; // JSONB
  author?: string | null;
  difficulty: Difficulty;
  quiz_topic: string; // Usually same as id
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  questions: AnyQuestion[];
}
```

### app/privacy-policy/page.tsx

```tsx
import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR PRIVACY POLICY — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple privacy policy for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: ShipFast
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Purpose of Data Collection: Order processing
// - Data sharing: we do not share the data with any other parties
// - Children's Privacy: we do not collect any data from children
// - Updates to the Privacy Policy: users will be updated by email
// - Contact information: marc@shipfa.st

// Please write a simple privacy policy for my site. Add the current date.  Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: 2023-08-25

Thank you for visiting ShipFast ("we," "us," or "our"). This Privacy Policy outlines how we collect, use, and protect your personal and non-personal information when you use our website located at https://shipfa.st (the "Website").

By accessing or using the Website, you agree to the terms of this Privacy Policy. If you do not agree with the practices described in this policy, please do not use the Website.

1. Information We Collect

1.1 Personal Data

We collect the following personal information from you:

Name: We collect your name to personalize your experience and communicate with you effectively.
Email: We collect your email address to send you important information regarding your orders, updates, and communication.
Payment Information: We collect payment details to process your orders securely. However, we do not store your payment information on our servers. Payments are processed by trusted third-party payment processors.

1.2 Non-Personal Data

We may use web cookies and similar technologies to collect non-personal information such as your IP address, browser type, device information, and browsing patterns. This information helps us to enhance your browsing experience, analyze trends, and improve our services.

2. Purpose of Data Collection

We collect and use your personal data for the sole purpose of order processing. This includes processing your orders, sending order confirmations, providing customer support, and keeping you updated about the status of your orders.

3. Data Sharing

We do not share your personal data with any third parties except as required for order processing (e.g., sharing your information with payment processors). We do not sell, trade, or rent your personal information to others.

4. Children's Privacy

ShipFast is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us at the email address provided below.

5. Updates to the Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Any updates will be posted on this page, and we may notify you via email about significant changes.

6. Contact Information

If you have any questions, concerns, or requests related to this Privacy Policy, you can contact us at:

Email: marc@shipfa.st

For all other inquiries, please visit our Contact Us page on the Website.

By using ShipFast, you consent to the terms of this Privacy Policy.`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;

```

### app/features/quiz/index.ts

```typescript
// Export all components, hooks, and utilities from the quiz feature
// This makes importing from the feature more convenient

// Context
export { QuizProvider, useQuiz } from './context/QuizContext';

// Hooks
export { useQuizState } from './hooks/useQuizState';
export { useQuizScoring } from './hooks/useQuizScoring';

// Components
export { default as QuestionCard } from './components/QuestionCard';
export { default as QuestionHeader } from './components/QuestionHeader';
export { default as QuestionContent } from './components/QuestionContent';
export { default as FeedbackSection } from './components/FeedbackSection';
export { default as QuizNavigation } from './components/QuizNavigation';
export { default as QuizProgress } from './components/QuizProgress';
export { default as QuizCompletionSummary } from './components/QuizCompletionSummary';

// Question Types
export { default as QuestionTypeRenderer } from './components/question-types/QuestionTypeRenderer';
export { default as SingleSelectionComponent } from './components/question-types/SingleSelectionComponent';

// Services
export { QuizService } from './services/quizService';

// Pages
export { default as QuizPage } from './pages/QuizPage';

```

### app/features/quiz/context/QuizContext.tsx

```tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuizState, QuizState, QuizAction } from '../hooks/useQuizState';
import { useQuizScoring } from '../hooks/useQuizScoring';
import { AnyQuestion } from '../../../types/quiz';

// Define Context Type
interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  submitAndScoreAnswer: (question: AnyQuestion, answer: any) => Promise<void>;
}

// Create the Context
export const QuizContext = createContext<QuizContextType | undefined>(undefined);

// QuizProvider Component
interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  // Use our custom hooks
  const { state, dispatch } = useQuizState();
  const { submitAndScoreAnswer } = useQuizScoring(dispatch);

  // Create context value
  const contextValue: QuizContextType = {
    state,
    dispatch,
    submitAndScoreAnswer
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

// Custom hook to use the QuizContext
export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

```

### app/features/quiz/components/QuestionContent.tsx

```tsx
import React from 'react';

interface QuestionContentProps {
  question: string;
}

const QuestionContent: React.FC<QuestionContentProps> = ({ question }) => {
  return (
    <section className="question-section">
      <h2 className="text-xl md:text-2xl font-bold text-custom-dark-blue mb-6 relative inline-block pb-1.5">
        Question
        <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-custom-primary rounded-rounded-full"></span>
      </h2>
      <div className="question-text text-base md:text-lg text-custom-gray-1 mb-6 whitespace-pre-wrap">
        {question}
      </div>
    </section>
  );
};

export default QuestionContent;

```

### app/features/quiz/components/QuestionCard.tsx

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AnyQuestion } from '../../../types/quiz';
import { useQuiz } from '../context/QuizContext';
import QuestionHeader from '../components/QuestionHeader';
import QuestionContent from '../components/QuestionContent';
import FeedbackSection from '../components/FeedbackSection';
import QuestionTypeRenderer from './question-types/QuestionTypeRenderer';

interface QuestionCardProps {
  question: AnyQuestion;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { state, submitAndScoreAnswer } = useQuiz();
  // For multi-choice questions, we need to track selections locally before submission
  const [multiChoiceSelections, setMultiChoiceSelections] = useState<string[]>([]);
  
  const userAnswerDetails = state.userAnswers[question.id];
  const selectedAnswerForThisQuestion = userAnswerDetails?.answer || 
    (question.type === 'multi' ? multiChoiceSelections : undefined);
  const isSubmittedForThisQuestion = userAnswerDetails !== undefined;
  // Renamed from showCorrectAnswerStyling
  const shouldApplyFeedbackStyling = state.isQuizComplete || 
    (state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion);
    
  // Reset selections when question changes
  useEffect(() => {
    setMultiChoiceSelections([]);
  }, [question.id]);
  
  // Update local selections when user answer is available from context
  useEffect(() => {
    if (question.type === 'multi' && userAnswerDetails?.answer) {
      setMultiChoiceSelections(userAnswerDetails.answer);
    }
  }, [question.type, userAnswerDetails]);

  const handleLocalAnswerSelection = async (answerPayload: any) => {
    // For all question types, submit immediately when ready
    if (isSubmittedForThisQuestion && userAnswerDetails.isCorrect !== undefined) return;
    
    // For multi-choice, we need to check if we've reached the required selections
    if (question.type === 'multi') {
      setMultiChoiceSelections(answerPayload);
      
      // If we reached the exact number of correct answers needed, submit automatically
      const correctAnswersCount = (question as any).correctAnswerOptionIds?.length || 0;
      if (Array.isArray(answerPayload) && answerPayload.length === correctAnswersCount) {
        await submitAndScoreAnswer(question, answerPayload);
      }
      return;
    }
    
    // For other question types like single selection, submit immediately
    await submitAndScoreAnswer(question, answerPayload);
  };

  return (
    <div className="bg-white rounded-rounded-lg-ref shadow-shadow-strong p-7 md:p-10 mb-8 relative overflow-hidden animate-card-appear">
      {/* Card Decoration */}
      <div className="card-decoration absolute top-0 right-0 w-24 h-24 md:w-36 md:h-36 bg-primary-gradient opacity-5 rounded-bl-full z-0"></div>

      <div className="relative z-10">
        {/* Question Metadata */}
        <QuestionHeader 
          points={question.points} 
          difficulty={question.difficulty} 
        />

        {/* Question Content */}
        <QuestionContent question={question.question} />
        
        {/* Question Type-specific Component */}
        <QuestionTypeRenderer
          question={question}
          onAnswerSelect={handleLocalAnswerSelection}
          selectedAnswer={selectedAnswerForThisQuestion}
          isSubmitted={isSubmittedForThisQuestion}
          shouldApplyFeedbackStyling={shouldApplyFeedbackStyling} // Pass renamed prop
          isQuizReviewMode={state.isQuizComplete} // Pass new prop
        />

        {/* Explanation Box */}
        {((state.showFeedbackForCurrentQuestion && isSubmittedForThisQuestion) || state.isQuizComplete) && 
          question.explanation && (
            <FeedbackSection 
              type="explanation" 
              content={question.explanation} 
            />
        )}
        
        {/* Feedback Message Box (Correct/Incorrect) */}
        {state.showFeedbackForCurrentQuestion && 
         isSubmittedForThisQuestion && 
         userAnswerDetails?.isCorrect !== undefined && (
          <FeedbackSection
            type={userAnswerDetails.isCorrect ? "correct" : "incorrect"}
            content={userAnswerDetails.isCorrect 
              ? question.feedback_correct 
              : question.feedback_incorrect
            }
          />
        )}
      </div>
    </div>
  );
};

export default QuestionCard;

```

### app/features/quiz/components/QuizNavigation.tsx

```tsx
import React from 'react';
import { useQuiz } from '../context/QuizContext';

interface QuizNavigationProps {
  currentQuestionId: string;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({ currentQuestionId }) => {
  const { state, dispatch } = useQuiz();
  
  const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;
  const isFirstQuestion = state.currentQuestionIndex === 0;
  const hasAnsweredCurrent = !!state.userAnswers[currentQuestionId]; 

  // Button styles
  const btnBase = "inline-flex items-center justify-center px-8 h-12 border-none rounded-rounded-full font-semibold text-base cursor-pointer transition-all duration-200 relative overflow-hidden";
  const btnSecondaryCustom = `${btnBase} bg-gray-100 text-custom-gray-1 hover:bg-gray-200 hover:-translate-y-0.5`;
  const btnPrimaryCustom = `${btnBase} bg-primary-gradient text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5`;

  const handleNext = () => {
    if (isLastQuestion) {
      if (hasAnsweredCurrent) {
        dispatch({ type: 'COMPLETE_QUIZ' });
      } else {
        alert("Please submit your answer before finishing the quiz.");
      }
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };

  const handlePrevious = () => {
    dispatch({ type: 'PREVIOUS_QUESTION' });
  };

  return (
    <div className="navigation flex flex-col md:flex-row justify-between mt-10 gap-4">
      <button 
        onClick={handlePrevious}
        disabled={isFirstQuestion}
        className={`${btnSecondaryCustom} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full md:w-auto`}
      >
        Previous
      </button>
      
      <button 
        onClick={handleNext}
        disabled={isLastQuestion && !hasAnsweredCurrent}
        className={`${btnPrimaryCustom} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full md:w-auto`}
      >
        {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
        
        {/* Icon for next button */}
        {!isLastQuestion && 
          <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" fill="currentColor"/>
          </svg>
        }
      </button>
    </div>
  );
};

export default QuizNavigation;

```

### app/features/quiz/components/QuizCompletionSummary.tsx

```tsx
import React from 'react';
import { useQuiz } from '../context/QuizContext';
import { Quiz } from '../../../types/quiz';

interface QuizCompletionSummaryProps {
  quiz: Quiz;
}

const QuizCompletionSummary: React.FC<QuizCompletionSummaryProps> = ({ quiz }) => {
  const { state, dispatch } = useQuiz();
  
  // Calculate quiz statistics
  const totalQuestions = state.questions.length;
  const answeredQuestions = Object.keys(state.userAnswers).length;
  const correctAnswers = Object.values(state.userAnswers).filter(answer => answer.isCorrect).length;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
  // Determine performance message
  let performanceMessage = '';
  if (scorePercentage >= 90) {
    performanceMessage = 'Excellent job! You have a great understanding of the subject!';
  } else if (scorePercentage >= 70) {
    performanceMessage = 'Good work! You have a solid understanding of the subject.';
  } else if (scorePercentage >= 50) {
    performanceMessage = 'You\'re on the right track, but you might want to review the material again.';
  } else {
    performanceMessage = 'Keep practicing! Review the material and try again for a better score.';
  }

  return (
    <div className="min-h-screen bg-custom-light-bg flex flex-col justify-center items-center p-6 animate-fade-in">
      <div className="container mx-auto p-4 md:p-8 text-center bg-white shadow-shadow-strong rounded-rounded-lg-ref max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-custom-success">Quiz Completed!</h1>
        
        <p className="text-lg md:text-xl text-custom-gray-1 mb-8">
          You have completed the quiz: <span className="font-semibold">{quiz.title}</span>.
        </p>
        
        <div className="score-summary bg-gray-50 p-6 rounded-lg mb-8">
          <div className="score-circle mx-auto mb-4 w-32 h-32 rounded-full bg-primary-gradient flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{scorePercentage}%</span>
          </div>
          
          <div className="score-details text-left mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="stat-item">
              <p className="text-custom-gray-2">Total Questions</p>
              <p className="text-xl font-semibold text-custom-dark-blue">{totalQuestions}</p>
            </div>
            <div className="stat-item">
              <p className="text-custom-gray-2">Answered</p>
              <p className="text-xl font-semibold text-custom-dark-blue">{answeredQuestions}</p>
            </div>
            <div className="stat-item">
              <p className="text-custom-gray-2">Correct</p>
              <p className="text-xl font-semibold text-custom-success">{correctAnswers}</p>
            </div>
            <div className="stat-item">
              <p className="text-custom-gray-2">Incorrect</p>
              <p className="text-xl font-semibold text-custom-error">{answeredQuestions - correctAnswers}</p>
            </div>
          </div>
        </div>
        
        <div className="performance-message mb-8 p-4 bg-blue-50 text-custom-primary border border-custom-primary rounded-lg">
          {performanceMessage}
        </div>
        
        <div className="actions flex flex-col md:flex-row justify-center gap-4">
          <button 
            onClick={() => dispatch({ type: 'RESET_QUIZ' })} 
            className="btn-secondary-custom px-8 py-3 rounded-full"
          >
            Take Another Quiz
          </button>
          
          <button 
            onClick={() => window.location.href = '/quiz-test'} 
            className="btn-primary-custom px-8 py-3 rounded-full"
          >
            Browse All Quizzes
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizCompletionSummary;

```

### app/features/quiz/components/QuestionHeader.tsx

```tsx
import React from 'react';
import { Difficulty } from '../../../types/quiz';

interface QuestionHeaderProps {
  points: number;
  difficulty: Difficulty;
}

const QuestionHeader: React.FC<QuestionHeaderProps> = ({ points, difficulty }) => {
  const difficultyText = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  
  return (
    <div className="question-meta flex flex-col sm:flex-row gap-3 mb-6">
      <div className="meta-badge inline-flex items-center py-1.5 px-4 rounded-rounded-full font-semibold text-sm shadow-shadow-1 bg-custom-primary/[.1] text-custom-primary border-l-4 border-custom-primary">
        Points: {points}
      </div>
      <div className={`meta-badge inline-flex items-center py-1.5 px-4 rounded-rounded-full font-semibold text-sm shadow-shadow-1 bg-yellow-500/[.1] text-yellow-600 border-l-4 border-yellow-500`}>
        Difficulty: {difficultyText}
      </div>
    </div>
  );
};

export default QuestionHeader;

```

### app/features/quiz/components/FeedbackSection.tsx

```tsx
import React from 'react';

// Icons for feedback
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-custom-error">
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"/>
  </svg>
);

const CheckCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-custom-success">
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l6.06-6.061L15.65 8.527 11.003 13.17l-2.12-2.121L7.47 12.461l3.533 3.539z" fill="currentColor" />
    </svg>
);

const ExplanationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-custom-primary">
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z" fill="currentColor"/>
  </svg>
);

interface FeedbackSectionProps {
  type: 'explanation' | 'correct' | 'incorrect';
  content: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ type, content }) => {
  // Determine styles and icon based on feedback type
  let boxStyles = '';
  let textColor = '';
  let title = '';
  let Icon = InfoIcon;

  switch (type) {
    case 'explanation':
      boxStyles = 'bg-blue-500/[.05] border-custom-primary border-l-4';
      textColor = 'text-custom-primary';
      title = 'Explanation:';
      Icon = ExplanationIcon;
      break;
    case 'correct':
      boxStyles = 'bg-green-500/[.05] border-custom-success border-l-4';
      textColor = 'text-custom-success';
      title = content.split('!')[0] + '!';
      content = content.split('!').slice(1).join('!').trim();
      Icon = CheckCircleIcon;
      break;
    case 'incorrect':
      boxStyles = 'bg-red-500/[.05] border-custom-error border-l-4';
      textColor = 'text-custom-error';
      title = content.split('!')[0] + '!';
      content = content.split('!').slice(1).join('!').trim();
      Icon = InfoIcon;
      break;
  }

  return (
    <div className={`feedback-box ${boxStyles} rounded-rounded-md-ref p-5 mt-6 shadow-shadow-1 animate-fade-in-up`}>
      <h3 className={`feedback-header flex items-center gap-2 mb-2 font-bold ${textColor} text-lg`}>
        <Icon />
        {title}
      </h3>
      <div className="feedback-content text-custom-gray-1 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

export default FeedbackSection;

```

### app/features/quiz/components/QuizProgress.tsx

```tsx
import React from 'react';

interface QuizProgressProps {
  currentIndex: number;
  totalQuestions: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({ currentIndex, totalQuestions }) => {
  const progressPercentage = totalQuestions > 0 
    ? ((currentIndex + 1) / totalQuestions) * 100 
    : 0;

  return (
    <div className="progress-container relative my-8 mx-auto w-full max-w-xl">
      <div className="progress-info flex justify-between mb-2 font-medium text-sm">
        <div className="question-counter bg-primary-gradient text-white py-1 px-4 rounded-rounded-full shadow-shadow-1 text-xs md:text-sm">
          Question {currentIndex + 1} of {totalQuestions}
        </div>
      </div>
      
      <div className="progress-bar h-2 bg-gray-200 rounded-rounded-full overflow-hidden shadow-inner">
        <div 
          className="progress-fill h-full bg-primary-gradient rounded-rounded-full transition-all duration-300 ease-out shadow-md"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default QuizProgress;

```

### app/features/quiz/components/question-types/MultiChoiceComponent.tsx

```tsx
'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MultiChoiceQuestion, SelectionOption } from '../../../../types/quiz';

// Icons for options
const CorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-success-gradient shadow-md">✓</span>
));

const IncorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-error-gradient shadow-md">✗</span>
));

interface MultiChoiceComponentProps {
  question: MultiChoiceQuestion;
  onAnswerSelect: (optionIds: string[]) => void;
  selectedOptionIds?: string[];
  isSubmitted?: boolean;
  showCorrectAnswer?: boolean;
}

const MultiChoiceComponent: React.FC<MultiChoiceComponentProps> = ({
  question,
  onAnswerSelect,
  selectedOptionIds = [],
  isSubmitted = false,
  showCorrectAnswer = false,
}) => {
  // Determine the correct number of answers to select
  const correctAnswersCount = question.correctAnswerOptionIds.length;
  
  const handleOptionClick = (optionId: string) => {
    if (!isSubmitted) {
      // If option is already selected, allow deselecting it
      if (selectedOptionIds.includes(optionId)) {
        const newSelectedOptions = selectedOptionIds.filter(id => id !== optionId);
        onAnswerSelect(newSelectedOptions);
      } 
      // If we haven't reached the limit yet, allow selecting the option
      else if (selectedOptionIds.length < correctAnswersCount) {
        const newSelectedOptions = [...selectedOptionIds, optionId];
        onAnswerSelect(newSelectedOptions);
        
        // If we've reached the required number of selections, auto-submit
        if (newSelectedOptions.length === correctAnswersCount) {
          setTimeout(() => onAnswerSelect(newSelectedOptions), 150); // Small delay for better UX
        }
      }
      // If we've reached the limit, don't allow more selections
    }
  };

  return (
    <div className="options-container grid grid-cols-1 gap-4 mb-8">
      <p className="text-sm text-gray-500 mb-2 font-medium">
        Select {question.correctAnswerOptionIds.length} answer{question.correctAnswerOptionIds.length > 1 ? 's' : ''} ({selectedOptionIds.length}/{question.correctAnswerOptionIds.length} selected)
      </p>
      
      {question.options.map((option: SelectionOption, index: number) => {
        const isSelected = selectedOptionIds.includes(option.option_id);
        const isCorrect = question.correctAnswerOptionIds.includes(option.option_id);
        const optionLetter = String.fromCharCode(65 + index);
        
        // Determine option styles
        let baseStyle = "relative text-left p-5 border-2 rounded-rounded-md-ref bg-white transition-all duration-200 ease-in-out shadow-shadow-1 overflow-hidden";
        let stateStyle = "border-custom-gray-3"; 
        let hoverStyle = isSubmitted ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:shadow-shadow-2 hover:border-custom-primary";
        
        // Apply feedback styling if necessary
        if (isSubmitted || showCorrectAnswer) {
          if (isCorrect) {
            stateStyle = "border-custom-success bg-green-500/[.05]";
          } else if (isSelected && !isCorrect) {
            stateStyle = "border-custom-error bg-red-500/[.05]";
          } else {
            stateStyle = "border-custom-gray-3 bg-gray-50 opacity-70";
            hoverStyle = "cursor-default";
          }
        } else if (isSelected) {
          stateStyle = "border-custom-primary ring-2 ring-custom-primary shadow-shadow-2";
        }
        
        return (
          <motion.button
            key={option.option_id}
            type="button"
            onClick={() => handleOptionClick(option.option_id)}
            className={`${baseStyle} ${stateStyle} ${hoverStyle}`}
            disabled={isSubmitted}
            aria-pressed={isSelected}
            whileHover={{ scale: isSubmitted ? 1 : 1.02, transition: { duration: 0.15 } }} 
            whileTap={{ scale: isSubmitted ? 1 : 0.98, transition: { duration: 0.1 } }} 
            layout
          >
            {/* Accent border */}
            <span className={`absolute top-0 left-0 w-1 h-full transition-all duration-200 ease-in-out ${
              isSelected ? 'bg-custom-primary' : 
              isCorrect && (isSubmitted || showCorrectAnswer) ? 'bg-custom-success' : 
              isSelected && !isCorrect && (isSubmitted || showCorrectAnswer) ? 'bg-custom-error' : 
              'bg-custom-gray-3'
            } ${isSubmitted ? '' : 'group-hover:bg-custom-primary'}`}></span>

            <div className="option-content flex items-center justify-between pl-4">
              <div className="option-text text-base md:text-lg font-medium text-custom-gray-1">
                <span className="option-letter inline-block w-6 font-bold text-custom-primary mr-2">{optionLetter}.</span>
                {option.text}
              </div>
              
              {/* Checkbox indicator */}
              <div className={`w-6 h-6 border-2 rounded flex items-center justify-center mr-2 ${
                isSelected ? 'bg-custom-primary border-custom-primary' : 'border-gray-300'
              }`}>
                {isSelected && <span className="text-white">✓</span>}
              </div>
              
              {/* Show feedback icons when appropriate */}
              {(isSubmitted || showCorrectAnswer) && isCorrect && <CorrectIcon />}
              {(isSubmitted || showCorrectAnswer) && isSelected && !isCorrect && <IncorrectIcon />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(MultiChoiceComponent);

```

### app/features/quiz/components/question-types/DragAndDropQuestionComponent.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { DragAndDropQuestion, DragAndDropOption, DragAndDropTarget } from '@/app/types/quiz';

interface DragAndDropQuestionComponentProps {
  question: DragAndDropQuestion;
  onAnswerChange: (answers: Record<string, string | null>) => void; // Maps target_id to option_id or null
  userAnswer?: Record<string, string | null>; // Previously selected answers
  isSubmitted?: boolean;
  showFeedbackStyling?: boolean; // Renamed from showCorrectAnswer, used for styling
  isQuizReviewMode?: boolean; // New prop for review mode
  validateOnDrop?: boolean; // Auto-validate when all targets are filled
}

const DragAndDropQuestionComponent: React.FC<DragAndDropQuestionComponentProps> = ({ 
  question, 
  onAnswerChange, 
  userAnswer, 
  isSubmitted = false,
  showFeedbackStyling = false, // Updated prop
  isQuizReviewMode = false, // New prop
  validateOnDrop = true // Default to true for auto-validation
}) => {
  // State to track which option is placed in which target
  // Format: { target_id: option_id | null }
  const [placedAnswers, setPlacedAnswers] = useState<Record<string, string | null>>({});
  // State to track available (unplaced) options
  const [availableOptions, setAvailableOptions] = useState<DragAndDropOption[]>(question.options);
  // State to track if all targets are filled
  const [allTargetsFilled, setAllTargetsFilled] = useState<boolean>(false);
  // State to track if answers are being validated 
  const [autoValidating, setAutoValidating] = useState<boolean>(false);
  // Track the current dragged option ID for browsers that don't support dataTransfer properly
  const [currentDraggedOptionId, setCurrentDraggedOptionId] = useState<string | null>(null);

  // Helper function to check if all targets are filled
  const checkAllTargetsFilled = (answers: Record<string, string | null>): boolean => {
    // If no answers object or it's empty, targets can't be filled
    if (!answers || Object.keys(answers).length === 0) return false;
    
    // No targets means nothing to fill
    if (question.targets.length === 0) return false;
    
    // Check that every target has a valid non-null option assigned
    const allFilled = question.targets.every(target => {
      const targetId = target.target_id;
      // Make sure the target exists in answers and has a non-null value
      return targetId in answers && answers[targetId] !== null && answers[targetId] !== undefined;
    });
    
    return allFilled;
  };

  // Helper function to validate answers against correct pairs
  const validateAnswers = (answers: Record<string, string | null>): Record<string, boolean> => {
    const validationResults: Record<string, boolean> = {};
    
    question.targets.forEach(target => {
      const targetId = target.target_id;
      const placedOptionId = answers[targetId];
      
      if (placedOptionId) {
        const correctPair = question.correctPairs.find(p => p.target_id === targetId);
        validationResults[targetId] = correctPair ? correctPair.option_id === placedOptionId : false;
      } else {
        validationResults[targetId] = false; // Empty targets are incorrect
      }
    });
    
    return validationResults;
  };

  useEffect(() => {
    const initialAnswers: Record<string, string | null> = {};
    question.targets.forEach(target => {
      initialAnswers[target.target_id] = null;
    });

    let newPlacedAnswers = { ...initialAnswers };
    let newAvailableOptions = [...question.options];

    if (isQuizReviewMode) {
      const correctReviewAnswers: Record<string, string | null> = { ...initialAnswers };
      question.correctPairs.forEach(pair => {
        correctReviewAnswers[pair.target_id] = pair.option_id;
      });
      newPlacedAnswers = correctReviewAnswers;
      const usedOptionIdsInReview = Object.values(correctReviewAnswers).filter(id => id !== null) as string[];
      newAvailableOptions = question.options.filter(opt => !usedOptionIdsInReview.includes(opt.option_id));
    } else if (userAnswer && Object.keys(userAnswer).length > 0) {
      newPlacedAnswers = { ...initialAnswers, ...userAnswer };
      const usedOptionIdsUser = Object.values(newPlacedAnswers).filter(id => id !== null) as string[];
      newAvailableOptions = question.options.filter(opt => !usedOptionIdsUser.includes(opt.option_id));
    }
    
    setPlacedAnswers(newPlacedAnswers);
    setAvailableOptions(newAvailableOptions);

    const allFilledCurrent = checkAllTargetsFilled(newPlacedAnswers);
    setAllTargetsFilled(allFilledCurrent);
    
    if (validateOnDrop && allFilledCurrent && !isSubmitted && !isQuizReviewMode) {
      setAutoValidating(true);
      // Do NOT call onAnswerChange here in useEffect for initial load based on userAnswer.
      // Submission should only happen on explicit user action (drop) that completes all targets.
    } else {
      setAutoValidating(false);
    }
  }, [question, userAnswer, isQuizReviewMode, isSubmitted, validateOnDrop]); // Removed onAnswerChange from here

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, optionId: string) => {
    // Store the current dragged option ID in state (fallback for browsers with dataTransfer issues)
    setCurrentDraggedOptionId(optionId);
    
    try {
      // Set data in dataTransfer object
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', optionId);
    } catch (err) {
      console.warn('Could not set dataTransfer data:', err);
      // We'll rely on the state variable in this case
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    if (isSubmitted || isQuizReviewMode) return;

    let optionId = e.dataTransfer.getData('text/plain');
    if (!optionId && currentDraggedOptionId) {
      optionId = currentDraggedOptionId;
    }

    if (!optionId) return;

    const optionBeingMoved = question.options.find(opt => opt.option_id === optionId);
    if (!optionBeingMoved) return;

    setPlacedAnswers(prevPlacedAnswers => {
      let intermediateAnswers: Record<string, string | null> = { ...prevPlacedAnswers };
      const oldOptionIdInTarget = prevPlacedAnswers[targetId];

      // Clear the option from any other target it might have been in
      for (const tId in intermediateAnswers) {
        if (intermediateAnswers[tId] === optionId && tId !== targetId) {
          intermediateAnswers[tId] = null;
        }
      }
      
      intermediateAnswers[targetId] = optionId;
      const newAnswers = { ...intermediateAnswers };

      const currentlyAllFilled = checkAllTargetsFilled(newAnswers);
      setAllTargetsFilled(currentlyAllFilled); 

      // Update available options
      setAvailableOptions(prevOptions => {
        // Remove the dropped option
        let updatedOptions = prevOptions.filter(opt => opt.option_id !== optionId);
        // Add back the option that was previously in the target, if any, and it's not the one just dropped
        if (oldOptionIdInTarget && oldOptionIdInTarget !== optionId) {
          const oldOptionDetails = question.options.find(opt => opt.option_id === oldOptionIdInTarget);
          if (oldOptionDetails && !updatedOptions.some(opt => opt.option_id === oldOptionDetails.option_id)) {
            updatedOptions.push(oldOptionDetails);
          }
        }
        return updatedOptions;
      });
      
      if (validateOnDrop && currentlyAllFilled && !isSubmitted && !isQuizReviewMode) {
        setAutoValidating(true);
        onAnswerChange(newAnswers); // This will trigger submission in QuestionCard
      } else {
        setAutoValidating(false);
        // If you need to inform parent about intermediate changes without submitting:
        // onAnswerChange(newAnswers); // But be careful, as this is tied to submission logic in QuestionCard
      }
      return newAnswers;
    });
    setCurrentDraggedOptionId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleRemoveFromTarget = (targetId: string) => {
    if (isSubmitted || isQuizReviewMode) return;
    
    const optionId = placedAnswers[targetId];
    if (!optionId) return;
    
    setPlacedAnswers(prevPlacedAnswers => {
      const newAnswers: Record<string, string | null> = { ...prevPlacedAnswers, [targetId]: null };
      const currentlyAllFilled = checkAllTargetsFilled(newAnswers);
      setAllTargetsFilled(currentlyAllFilled);

      const removedOptionDetails = question.options.find(opt => opt.option_id === optionId);
      if (removedOptionDetails) {
        setAvailableOptions(prevOptions => {
          if (!prevOptions.some(opt => opt.option_id === removedOptionDetails.option_id)) {
            return [...prevOptions, removedOptionDetails];
          }
          return prevOptions;
        });
      }

      if (autoValidating && !currentlyAllFilled) {
          setAutoValidating(false);
      }
      // Do not call onAnswerChange here, as removing an item makes the answer incomplete.
      return newAnswers;
    });
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      {/* <h3 className="text-lg font-semibold mb-2">{question.question}</h3> */}
      
      {/* Available Options */}
      <div className="mb-4">
        <p className="font-medium">Available Items:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {availableOptions.map(option => (
            <div
              key={option.option_id}
              draggable={!isSubmitted && !isQuizReviewMode}
              onDragStart={(e) => handleDragStart(e, option.option_id)}
              className="p-2 bg-blue-100 border border-blue-300 rounded cursor-grab"
            >
              {option.text}
            </div>
          ))}
        </div>
      </div>

      {/* Targets */}
      <div>
        <p className="font-medium">Match items to the correct targets:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {question.targets.map(target => {
            const placedOptionId = placedAnswers[target.target_id];
            const placedOption = placedOptionId ? question.options.find(opt => opt.option_id === placedOptionId) : null;

            let borderColor = 'border-gray-300'; // Default border
            let hintText: string | null = null;

            // Determine if detailed feedback (styling, hints) should be applied to this target.
            // This is true if global feedback styling is on, AND (it's review mode OR the user filled all targets for their attempt).
            const applyDetailedTargetFeedback = showFeedbackStyling && (isQuizReviewMode || allTargetsFilled);

            if (applyDetailedTargetFeedback) {
              const correctPairForTarget = question.correctPairs.find(p => p.target_id === target.target_id);

              if (placedOptionId) { // An option is placed in this target
                if (correctPairForTarget && correctPairForTarget.option_id === placedOptionId) {
                  borderColor = 'border-green-500'; // User's placement is correct
                } else {
                  borderColor = 'border-red-500'; // User's placement is incorrect
                  if (correctPairForTarget) {
                    const correctOptionDetails = question.options.find(opt => opt.option_id === correctPairForTarget.option_id);
                    hintText = correctOptionDetails ? `(Correct: ${correctOptionDetails.text})` : '(Correct answer details not found)';
                  } else { // Placed an option where target should be empty (no correct pair defined)
                    hintText = '(This target should be empty)';
                  }
                }
              } else { // This target is empty in placedAnswers
                if (correctPairForTarget) { // Target should have been filled
                  borderColor = 'border-red-500'; // Incorrectly empty
                  const correctOptionDetails = question.options.find(opt => opt.option_id === correctPairForTarget.option_id);
                  hintText = correctOptionDetails ? `(Correct: ${correctOptionDetails.text})` : '(Correct answer details not found)';
                } else {
                  // Target is correctly empty (no correctPair for it)
                  borderColor = 'border-green-500'; // Style as correct (or neutral if preferred)
                }
              }
            }

            return (
              <div
                key={target.target_id}
                onDrop={(e) => handleDrop(e, target.target_id)}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`p-4 border-2 ${borderColor} rounded min-h-[80px] bg-gray-50 flex flex-col justify-between`}
              >
                <p className="font-semibold">{target.text}</p>
                {placedOption && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded flex justify-between items-center">
                    <span>{placedOption.text}</span>
                    {!isSubmitted && !isQuizReviewMode && (
                      <button
                        onClick={() => handleRemoveFromTarget(target.target_id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="Remove item"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                )}
                {hintText && <p className="text-xs mt-1">{hintText}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 border rounded bg-gray-50 text-xs">
          {/* ... existing dev info ... */}
        </div>
      )}
      
      {autoValidating && allTargetsFilled && !showFeedbackStyling && !isSubmitted && (
        <div className="mt-4 p-2 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-sm text-yellow-700">All targets filled. Your answer will be submitted.</p>
        </div>
      )}
      
      {allTargetsFilled && !autoValidating && !showFeedbackStyling && !isSubmitted && (
         <div className="mt-4 p-2 bg-green-100 border border-green-300 rounded">
           <p className="text-sm text-green-700">All targets filled. Ready to submit.</p>
         </div>
      )}
    </div>
  );
};

export default DragAndDropQuestionComponent;

```

### app/features/quiz/components/question-types/SingleSelectionComponent.tsx

```tsx
'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { SingleSelectionQuestion, SelectionOption } from '../../../../types/quiz';

// Icons for options
const CorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-success-gradient shadow-md">✓</span>
));

const IncorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-error-gradient shadow-md">✗</span>
));

interface SingleSelectionComponentProps {
  question: SingleSelectionQuestion;
  onAnswerSelect: (optionId: string) => void;
  selectedOptionId?: string | null;
  isSubmitted?: boolean;
  showCorrectAnswer?: boolean;
}

const SingleSelectionComponent: React.FC<SingleSelectionComponentProps> = ({
  question,
  onAnswerSelect,
  selectedOptionId,
  isSubmitted = false,
  showCorrectAnswer = false,
}) => {
  const handleOptionClick = (optionId: string) => {
    if (!isSubmitted) {
      onAnswerSelect(optionId);
    }
  };

  return (
    <div className="options-container grid grid-cols-1 gap-4 mb-8">
      {question.options.map((option: SelectionOption, index: number) => {
        const isSelected = selectedOptionId === option.option_id;
        const isCorrect = question.correctAnswerOptionId === option.option_id;
        const optionLetter = String.fromCharCode(65 + index);
        
        // Determine option styles
        let baseStyle = "relative text-left p-5 border-2 rounded-rounded-md-ref bg-white transition-all duration-200 ease-in-out shadow-shadow-1 overflow-hidden";
        let stateStyle = "border-custom-gray-3"; 
        let hoverStyle = isSubmitted ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:shadow-shadow-2 hover:border-custom-primary";
        
        // Apply feedback styling if necessary
        if (isSubmitted || showCorrectAnswer) {
          if (isCorrect) {
            stateStyle = "border-custom-success bg-green-500/[.05]";
          } else if (isSelected && !isCorrect) {
            stateStyle = "border-custom-error bg-red-500/[.05]";
          } else {
            stateStyle = "border-custom-gray-3 bg-gray-50 opacity-70";
            hoverStyle = "cursor-default";
          }
        } else if (isSelected) {
          stateStyle = "border-custom-primary ring-2 ring-custom-primary shadow-shadow-2";
        }
        
        return (
          <motion.button
            key={option.option_id}
            type="button"
            onClick={() => handleOptionClick(option.option_id)}
            className={`${baseStyle} ${stateStyle} ${hoverStyle}`}
            disabled={isSubmitted}
            aria-pressed={isSelected}
            whileHover={{ scale: isSubmitted ? 1 : 1.02, transition: { duration: 0.15 } }} 
            whileTap={{ scale: isSubmitted ? 1 : 0.98, transition: { duration: 0.1 } }} 
            layout
          >
            {/* Accent border */}
            <span className={`absolute top-0 left-0 w-1 h-full transition-all duration-200 ease-in-out ${
              isSelected ? 'bg-custom-primary' : 
              isCorrect && (isSubmitted || showCorrectAnswer) ? 'bg-custom-success' : 
              isSelected && !isCorrect && (isSubmitted || showCorrectAnswer) ? 'bg-custom-error' : 
              'bg-custom-gray-3'
            } ${isSubmitted ? '' : 'group-hover:bg-custom-primary'}`}></span>

            <div className="option-content flex items-center justify-between pl-4">
              <div className="option-text text-base md:text-lg font-medium text-custom-gray-1">
                <span className="option-letter inline-block w-6 font-bold text-custom-primary mr-2">{optionLetter}.</span>
                {option.text}
              </div>
              
              {/* Show feedback icons when appropriate */}
              {(isSubmitted || showCorrectAnswer) && isCorrect && <CorrectIcon />}
              {(isSubmitted || showCorrectAnswer) && isSelected && !isCorrect && <IncorrectIcon />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(SingleSelectionComponent);

```

### app/features/quiz/components/question-types/QuestionTypeRenderer.tsx

```tsx
import React, { memo } from 'react';
import { AnyQuestion, SingleSelectionQuestion, MultiChoiceQuestion, DragAndDropQuestion } from '../../../../types/quiz';
import SingleSelectionComponent from './SingleSelectionComponent';
import MultiChoiceComponent from './MultiChoiceComponent';
import DragAndDropQuestionComponent from './DragAndDropQuestionComponent';

interface QuestionTypeRendererProps {
  question: AnyQuestion;
  onAnswerSelect: (answer: any) => void;
  selectedAnswer: any;
  isSubmitted: boolean;
  shouldApplyFeedbackStyling: boolean; // Renamed from showCorrectAnswer
  isQuizReviewMode: boolean; // New prop
}

// Using Factory pattern to render appropriate component based on question type
const QuestionTypeRenderer: React.FC<QuestionTypeRendererProps> = ({
  question,
  onAnswerSelect,
  selectedAnswer,
  isSubmitted,
  shouldApplyFeedbackStyling, // Updated prop name
  isQuizReviewMode, // New prop
}) => {
  // Type guard to check if question is defined
  if (!question || !question.type) {
    return (
      <div className="p-4 my-4 border border-red-200 rounded bg-red-50">
        <p className="font-semibold text-red-700">Error: Invalid question object</p>
      </div>
    );
  }

  switch (question.type) {
    case 'single_selection':
      return (
        <SingleSelectionComponent 
          question={question as SingleSelectionQuestion} 
          onAnswerSelect={onAnswerSelect}
          selectedOptionId={selectedAnswer as string | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling} // Pass renamed prop
        />
      );
    case 'multi':
      return (
        <MultiChoiceComponent
          question={question as MultiChoiceQuestion}
          onAnswerSelect={onAnswerSelect}
          selectedOptionIds={selectedAnswer as string[] | undefined}
          isSubmitted={isSubmitted}
          showCorrectAnswer={shouldApplyFeedbackStyling} // Pass renamed prop
        />
      );
    case 'drag_and_drop':
      return (
        <DragAndDropQuestionComponent
          question={question as DragAndDropQuestion}
          onAnswerChange={onAnswerSelect}
          userAnswer={selectedAnswer as Record<string, string | null> | undefined}
          isSubmitted={isSubmitted}
          showFeedbackStyling={shouldApplyFeedbackStyling} // Pass renamed prop here
          isQuizReviewMode={isQuizReviewMode} // Pass new prop here
          validateOnDrop={true} // Enable immediate feedback validation
        />
      );
    default:
      return (
        <div className="p-4 my-4 border border-red-200 rounded bg-red-50">
          <p className="font-semibold text-red-700">Error: Unknown question type: {(question as any).type}</p>
        </div>
      );
  }
};

// Memoize the component to prevent unnecessary re-renders
export default memo(QuestionTypeRenderer);

```

### app/features/quiz/hooks/useQuizScoring.ts

```typescript
import { useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AnyQuestion } from '../../../types/quiz';
import { QuizAction } from './useQuizState';

// Initialize Supabase client for Edge Function calls
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseFunctionsClient: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabaseFunctionsClient = createClient(supabaseUrl, supabaseAnonKey);
}

// Hook for handling answer submission and scoring
export const useQuizScoring = (dispatch: React.Dispatch<QuizAction>) => {
  const submitAndScoreAnswer = useCallback(async (question: AnyQuestion, answer: any) => {
    if (!supabaseFunctionsClient) {
      console.error('Supabase client for functions not initialized.');
      return;
    }

    let submitPayload: QuizAction = {
      type: 'SUBMIT_ANSWER',
      payload: {
        questionId: question.id,
        answer,
        questionType: question.type,
      }
    };

    // For single selection and multi questions, we can do client-side validation
    if (question.type === 'single_selection') {
      submitPayload.payload.correctAnswerOptionId = question.correctAnswerOptionId;
    } else if (question.type === 'multi') {
      submitPayload.payload.correctAnswerOptionIds = (question as any).correctAnswerOptionIds;
    }

    // First update the UI immediately
    dispatch(submitPayload);

    try {
      // Then send to server for validation
      const { data: scoreData, error: functionError } = await supabaseFunctionsClient.functions.invoke(
        'score-answer', 
        {
          body: { 
            questionId: question.id, 
            userAnswer: answer, 
            questionType: question.type 
          }
        }
      );

      if (functionError) {
        console.error('Error invoking score-answer Edge Function:', functionError.message);
        return;
      }

      if (scoreData && scoreData.questionId === question.id) {
        dispatch({
          type: 'UPDATE_ANSWER_CORRECTNESS',
          payload: { 
            questionId: scoreData.questionId,
            isCorrect: scoreData.isCorrect,
            serverVerifiedCorrectAnswer: scoreData.correctAnswer 
          }
        });
      } else {
        console.error('Score data mismatch or missing from Edge Function response:', scoreData);
      }
    } catch (e: any) {
      console.error('Unexpected error during submitAndScoreAnswer:', e.message);
    }
  }, [dispatch]);

  return { submitAndScoreAnswer };
};

```

### app/features/quiz/hooks/useQuizState.ts

```typescript
import { useReducer } from 'react';
import { AnyQuestion, Quiz, QuestionType } from '../../../types/quiz';

// Define structure for storing answers
export interface UserAnswer {
  answer: any; 
  isCorrect?: boolean;
  timestamp: number;
}

export interface UserAnswersState {
  [questionId: string]: UserAnswer;
}

// Quiz State Definition
export interface QuizState {
  quiz: Quiz | null;
  questions: AnyQuestion[];
  currentQuestionIndex: number;
  userAnswers: UserAnswersState;
  isLoading: boolean;
  error: string | null;
  isQuizComplete: boolean;
  showFeedbackForCurrentQuestion: boolean;
}

// Action Types
export type QuizAction = 
  | { type: 'LOAD_QUIZ_START' }
  | { type: 'LOAD_QUIZ_SUCCESS'; payload: Quiz }
  | { type: 'LOAD_QUIZ_FAILURE'; payload: string }
  | { 
      type: 'SUBMIT_ANSWER'; 
      payload: { 
        questionId: string; 
        answer: any; 
        questionType: QuestionType; 
        correctAnswerOptionId?: string; 
        correctAnswerOptionIds?: string[];
      }
    }
  | { type: 'UPDATE_ANSWER_CORRECTNESS'; payload: { questionId: string; isCorrect: boolean, serverVerifiedCorrectAnswer?: any } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'RESET_QUIZ' }
  | { type: 'SHOW_FEEDBACK'; payload: { questionId: string } };

// Initial State
const initialState: QuizState = {
  quiz: null,
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  isLoading: false,
  error: null,
  isQuizComplete: false,
  showFeedbackForCurrentQuestion: false,
};

// Quiz Reducer
const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case 'LOAD_QUIZ_START':
      return { ...initialState, isLoading: true }; 
    case 'LOAD_QUIZ_SUCCESS':
      return {
        ...initialState,
        quiz: action.payload,
        questions: action.payload.questions,
        isLoading: false,
      };
    case 'LOAD_QUIZ_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    
    case 'SUBMIT_ANSWER':
      let isClientCorrect: boolean | undefined = undefined;
      
      if (action.payload.questionType === 'single_selection' && action.payload.correctAnswerOptionId !== undefined) {
        isClientCorrect = action.payload.answer === action.payload.correctAnswerOptionId;
      } else if (action.payload.questionType === 'multi' && action.payload.correctAnswerOptionIds !== undefined) {
        // For multi-selection questions, check if the selected answers match the correct answers exactly
        const selectedAnswers = action.payload.answer as string[];
        const correctAnswers = action.payload.correctAnswerOptionIds;
        
        // Check if arrays have the same elements (regardless of order)
        isClientCorrect = 
          selectedAnswers.length === correctAnswers.length && 
          selectedAnswers.every(id => correctAnswers.includes(id)) &&
          correctAnswers.every(id => selectedAnswers.includes(id));
      } else if (action.payload.questionType === 'drag_and_drop') {
        // For drag-and-drop, we'll rely on server validation
        console.log('Drag and drop answer submitted:', action.payload.answer);
        // Don't set isClientCorrect here, will be updated by server response
      }

      return {
        ...state,
        userAnswers: {
          ...state.userAnswers,
          [action.payload.questionId]: {
            answer: action.payload.answer,
            isCorrect: isClientCorrect,
            timestamp: Date.now(),
          },
        },
        showFeedbackForCurrentQuestion: true, 
      };

    case 'UPDATE_ANSWER_CORRECTNESS':
      if (!state.userAnswers[action.payload.questionId]) {
        console.warn('UPDATE_ANSWER_CORRECTNESS called for a question not in userAnswers', action.payload.questionId);
        return state; 
      }

      return {
        ...state,
        userAnswers: {
          ...state.userAnswers,
          [action.payload.questionId]: {
            ...state.userAnswers[action.payload.questionId],
            isCorrect: action.payload.isCorrect,
          },
        },
      };

    case 'NEXT_QUESTION':
      if (state.currentQuestionIndex < state.questions.length - 1) {
        const nextQuestionId = state.questions[state.currentQuestionIndex + 1]?.id;
        const nextQuestionHasAnswer = nextQuestionId ? state.userAnswers[nextQuestionId] !== undefined : false;
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex + 1,
          showFeedbackForCurrentQuestion: nextQuestionHasAnswer,
        };
      }
      return { ...state, isQuizComplete: true }; 

    case 'PREVIOUS_QUESTION':
      if (state.currentQuestionIndex > 0) {
        const prevQuestionId = state.questions[state.currentQuestionIndex - 1]?.id;
        const prevQuestionHasAnswer = prevQuestionId ? state.userAnswers[prevQuestionId] !== undefined : false;
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex - 1,
          showFeedbackForCurrentQuestion: prevQuestionHasAnswer,
        };
      }
      return state;

    case 'COMPLETE_QUIZ':
      return { ...state, isQuizComplete: true, showFeedbackForCurrentQuestion: true };

    case 'SHOW_FEEDBACK':
      return { ...state, showFeedbackForCurrentQuestion: true };

    case 'RESET_QUIZ':
      return initialState;
      
    default:
      return state;
  }
};

// Hook for Quiz State
export const useQuizState = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  
  return {
    state,
    dispatch
  };
};

```

### app/features/quiz/pages/QuizPage.tsx

```tsx
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useQuiz } from '../context/QuizContext';
import { QuizService } from '../services/quizService';
import QuestionCard from '../components/QuestionCard';
import QuizProgress from '../components/QuizProgress';
import QuizNavigation from '../components/QuizNavigation';
import QuizCompletionSummary from '../components/QuizCompletionSummary';

// Quiz Runner Component
const QuizPageContent: React.FC<{ quizId: string; questionType?: string }> = ({ quizId, questionType }) => {
  const { state, dispatch } = useQuiz();

  // Load quiz data on component mount or when quizId/questionType changes
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) return;
      
      // Reset quiz state when question type changes to avoid confusion
      dispatch({ type: 'RESET_QUIZ' });
      dispatch({ type: 'LOAD_QUIZ_START' });
      
      try {
        const quizData = await QuizService.fetchQuizById(quizId, questionType);
        dispatch({ type: 'LOAD_QUIZ_SUCCESS', payload: quizData });
      } catch (error: any) {
        console.error("Error fetching quiz data:", error);
        dispatch({ 
          type: 'LOAD_QUIZ_FAILURE', 
          payload: error.message || 'Error fetching quiz.' 
        });
      }
    };
    
    loadQuiz();
  }, [quizId, questionType, dispatch]);

  // Loading states
  if (state.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-dark-blue">Loading quiz...</p>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-error">Error: {state.error}</p>
      </div>
    );
  }

  // No quiz data
  if (!state.quiz) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-dark-blue">Quiz not found.</p>
      </div>
    );
  }
  
  // Quiz loaded but no questions match the filter
  if (state.questions.length === 0) {
    return (
      <div className="min-h-screen bg-custom-light-bg py-6 px-4 md:px-6">
        <div className="quiz-container max-w-3xl mx-auto">
          <header className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-blue mb-3 relative inline-block pb-2">
              {state.quiz.title}
              <span className="absolute left-1/4 bottom-0 w-1/2 h-1 bg-primary-gradient rounded-rounded-full"></span>
            </h1>
            
            {/* Filter by question type */}
            <div className="mb-6">
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                <Link 
                  href={`/quiz-test/${quizId}`}
                  className={`px-3 py-1 rounded-full text-sm ${!questionType ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
                >
                  All Questions
                </Link>
                <Link 
                  href={`/quiz-test/${quizId}/single_selection`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'single_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
                >
                  Single Selection
                </Link>
                <Link 
                  href={`/quiz-test/${quizId}/multi`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'multi' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
                >
                  Multiple Selection
                </Link>
                <Link 
                  href={`/quiz-test/${quizId}/drag_and_drop`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'drag_and_drop' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
                >
                  Drag and Drop
                </Link>
                <Link 
                  href={`/quiz-test/${quizId}/dropdown_selection`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'dropdown_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
                >
                  Dropdown
                </Link>
                <Link 
                  href={`/quiz-test/${quizId}/order`}
                  className={`px-3 py-1 rounded-full text-sm ${questionType === 'order' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
                >
                  Order
                </Link>
              </div>
              <div className="mt-2">
                <Link 
                  href={`/quiz-test/${quizId}`}
                  className="text-custom-primary text-sm hover:underline flex items-center justify-center"
                >
                  View all question types
                </Link>
              </div>
            </div>
          </header>
          
          <div className="flex justify-center items-center p-10 bg-white rounded-xl shadow-md">
            <p className="text-xl text-custom-dark-blue">
              {questionType 
                ? `No questions of type "${questionType}" available in this quiz.` 
                : "No questions available in this quiz."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];

  // Quiz completed state
  if (!currentQuestion && state.isQuizComplete) {
    return <QuizCompletionSummary quiz={state.quiz} />;
  }
  
  // No current question
  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-custom-light-bg">
        <p className="text-xl text-custom-dark-blue">No current question available.</p>
      </div>
    );
  }
  
  // Render quiz content
  return (
    <div className="min-h-screen bg-custom-light-bg py-6 px-4 md:px-6">
      <div className="quiz-container max-w-3xl mx-auto">
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-blue mb-3 relative inline-block pb-2">
            {state.quiz.title}
            <span className="absolute left-1/4 bottom-0 w-1/2 h-1 bg-primary-gradient rounded-rounded-full"></span>
          </h1>
          
          {/* Filter by question type */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            <Link 
              href={`/quiz-test/${quizId}`}
              className={`px-3 py-1 rounded-full text-sm ${!questionType ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
            >
              All Questions
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/single_selection`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'single_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
            >
              Single Selection
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/multi`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'multi' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
            >
              Multiple Selection
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/drag_and_drop`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'drag_and_drop' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
            >
              Drag and Drop
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/dropdown_selection`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'dropdown_selection' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
            >
              Dropdown
            </Link>
            <Link 
              href={`/quiz-test/${quizId}/order`}
              className={`px-3 py-1 rounded-full text-sm ${questionType === 'order' ? 'bg-custom-primary text-white' : 'bg-gray-200'}`}
            >
              Order
            </Link>
          </div>
          
          <QuizProgress 
            currentIndex={state.currentQuestionIndex} 
            totalQuestions={state.questions.length} 
          />
        </header>
        
        <QuestionCard question={currentQuestion} />
        
        <QuizNavigation currentQuestionId={currentQuestion.id} />
      </div>
    </div>
  );
};  // Main Quiz Page Component that can be used directly
const QuizPage: React.FC<{ quizId: string; questionType?: string }> = (props) => {
  return <QuizPageContent {...props} />;
};

export default QuizPage;

// Define list of available question types for easy import elsewhere
export const availableQuestionTypes = [
  { type: 'single_selection', name: 'Single Selection' },
  { type: 'multi', name: 'Multiple Selection' },
  { type: 'drag_and_drop', name: 'Drag and Drop' },
  { type: 'dropdown_selection', name: 'Dropdown' },
  { type: 'order', name: 'Order' }
];

```

### app/features/quiz/pages/QuizPage.tsx.new

```new

```

### app/features/quiz/services/quizApiClient.ts

```typescript

```

### app/features/quiz/services/quizService.ts

```typescript
import { Quiz } from '../../../types/quiz';

// Client-side service for fetching quiz data
export class QuizService {
  // Fetch quiz by ID with optional question type filter
  static async fetchQuizById(quizId: string, questionType?: string): Promise<Quiz> {
    const url = questionType 
      ? `/api/quiz/${quizId}?questionType=${questionType}`
      : `/api/quiz/${quizId}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch quiz: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

```

### app/blog/layout.tsx

```tsx
import { Suspense } from "react";
import HeaderBlog from "./_assets/components/HeaderBlog";
import Footer from "@/components/Footer";

export default async function LayoutBlog({ children }: { children: any }) {
  return (
    <div>
      <Suspense>
        <HeaderBlog />
      </Suspense>

      <main className="min-h-screen max-w-6xl mx-auto p-8">{children}</main>

      <div className="h-24" />

      <Footer />
    </div>
  );
}

```

### app/blog/page.tsx

```tsx
import { categories, articles } from "./_assets/content";
import CardArticle from "./_assets/components/CardArticle";
import CardCategory from "./_assets/components/CardCategory";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: `${config.appName} Blog | Stripe Chargeback Protection`,
  description:
    "Learn how to prevent chargebacks, how to accept payments online, and keep your Stripe account in good standing",
  canonicalUrlRelative: "/blog",
});

export default async function Blog() {
  const articlesToDisplay = articles
    .sort(
      (a, b) =>
        new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf()
    )
    .slice(0, 6);
  return (
    <>
      <section className="text-center max-w-xl mx-auto mt-12 mb-24 md:mb-32">
        <h1 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-6">
          The {config.appName} Blog
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          Learn how to ship your startup in days, not weeks. And get the latest
          updates about the boilerplate
        </p>
      </section>

      <section className="grid lg:grid-cols-2 mb-24 md:mb-32 gap-8">
        {articlesToDisplay.map((article, i) => (
          <CardArticle
            article={article}
            key={article.slug}
            isImagePriority={i <= 2}
          />
        ))}
      </section>

      <section>
        <p className="font-bold text-2xl lg:text-4xl tracking-tight text-center mb-8 md:mb-12">
          Browse articles by category
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <CardCategory key={category.slug} category={category} tag="div" />
          ))}
        </div>
      </section>
    </>
  );
}

```

### app/blog/_assets/content.tsx

```tsx
import type { JSX } from "react";
import Image, { StaticImageData } from "next/image";
import marcImg from "@/app/blog/_assets/images/authors/marc.png";
import introducingSupabaseImg from "@/public/blog/introducing-supabase/header.png";

// ==================================================================================================================================================================
// BLOG CATEGORIES 🏷️
// ==================================================================================================================================================================

export type categoryType = {
  slug: string;
  title: string;
  titleShort?: string;
  description: string;
  descriptionShort?: string;
};

// These slugs are used to generate pages in the /blog/category/[categoryI].js. It's a way to group articles by category.
const categorySlugs: { [key: string]: string } = {
  feature: "feature",
  tutorial: "tutorial",
};

// All the blog categories data display in the /blog/category/[categoryI].js pages.
export const categories: categoryType[] = [
  {
    // The slug to use in the URL, from the categorySlugs object above.
    slug: categorySlugs.feature,
    // The title to display the category title (h1), the category badge, the category filter, and more. Less than 60 characters.
    title: "New Features",
    // A short version of the title above, display in small components like badges. 1 or 2 words
    titleShort: "Features",
    // The description of the category to display in the category page. Up to 160 characters.
    description:
      "Here are the latest features we've added to ShipFast. I'm constantly improving our product to help you ship faster.",
    // A short version of the description above, only displayed in the <Header /> on mobile. Up to 60 characters.
    descriptionShort: "Latest features added to ShipFast.",
  },
  {
    slug: categorySlugs.tutorial,
    title: "How Tos & Tutorials",
    titleShort: "Tutorials",
    description:
      "Learn how to use ShipFast with these step-by-step tutorials. I'll show you how to ship faster and save time.",
    descriptionShort:
      "Learn how to use ShipFast with these step-by-step tutorials.",
  },
];

// ==================================================================================================================================================================
// BLOG AUTHORS 📝
// ==================================================================================================================================================================

export type authorType = {
  slug: string;
  name: string;
  job: string;
  description: string;
  avatar: StaticImageData | string;
  socials?: {
    name: string;
    icon: JSX.Element;
    url: string;
  }[];
};

// Social icons used in the author's bio.
const socialIcons: {
  [key: string]: {
    name: string;
    svg: JSX.Element;
  };
} = {
  twitter: {
    name: "Twitter",
    svg: (
      <svg
        version="1.1"
        id="svg5"
        x="0px"
        y="0px"
        viewBox="0 0 1668.56 1221.19"
        className="w-9 h-9"
        // Using a dark theme? ->  className="w-9 h-9 fill-white"
      >
        <g id="layer1" transform="translate(52.390088,-25.058597)">
          <path
            id="path1009"
            d="M283.94,167.31l386.39,516.64L281.5,1104h87.51l340.42-367.76L984.48,1104h297.8L874.15,558.3l361.92-390.99   h-87.51l-313.51,338.7l-253.31-338.7H283.94z M412.63,231.77h136.81l604.13,807.76h-136.81L412.63,231.77z"
          />
        </g>
      </svg>
    ),
  },
  linkedin: {
    name: "LinkedIn",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        // Using a dark theme? ->  className="w-6 h-6 fill-white"
        viewBox="0 0 24 24"
      >
        <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
      </svg>
    ),
  },
  github: {
    name: "GitHub",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        // Using a dark theme? ->  className="w-6 h-6 fill-white"
        viewBox="0 0 24 24"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
};

// These slugs are used to generate pages in the /blog/author/[authorId].js. It's a way to show all articles from an author.
const authorSlugs: {
  [key: string]: string;
} = {
  marc: "marc",
};

// All the blog authors data display in the /blog/author/[authorId].js pages.
export const authors: authorType[] = [
  {
    // The slug to use in the URL, from the authorSlugs object above.
    slug: authorSlugs.marc,
    // The name to display in the author's bio. Up to 60 characters.
    name: "Marc Lou",
    // The job to display in the author's bio. Up to 60 characters.
    job: "Maker of ByeDispute",
    // The description of the author to display in the author's bio. Up to 160 characters.
    description:
      "Marc is a developer and an entrepreneur. He's built 20 startups in the last 3 years. 6 were profitable and 3 were acquired. He's currently building ByeDispute, the #1 Stripe Chargebacks Protection tool.",
    // The avatar of the author to display in the author's bio and avatar badge. It's better to use a local image, but you can also use an external image (https://...)
    avatar: marcImg,
    // A list of social links to display in the author's bio.
    socials: [
      {
        name: socialIcons.twitter.name,
        icon: socialIcons.twitter.svg,
        url: "https://twitter.com/marc_louvion",
      },
      {
        name: socialIcons.linkedin.name,
        icon: socialIcons.linkedin.svg,
        url: "https://www.linkedin.com/in/marclouvion/",
      },
      {
        name: socialIcons.github.name,
        icon: socialIcons.github.svg,
        url: "https://github.com/Marc-Lou-Org/ship-fast",
      },
    ],
  },
];

// ==================================================================================================================================================================
// BLOG ARTICLES 📚
// ==================================================================================================================================================================

export type articleType = {
  slug: string;
  title: string;
  description: string;
  categories: categoryType[];
  author: authorType;
  publishedAt: string;
  image: {
    src?: StaticImageData;
    urlRelative: string;
    alt: string;
  };
  content: JSX.Element;
};

// These styles are used in the content of the articles. When you update them, all articles will be updated.
const styles: {
  [key: string]: string;
} = {
  h2: "text-2xl lg:text-4xl font-bold tracking-tight mb-4 text-base-content",
  h3: "text-xl lg:text-2xl font-bold tracking-tight mb-2 text-base-content",
  p: "text-base-content/90 leading-relaxed",
  ul: "list-inside list-disc text-base-content/90 leading-relaxed",
  li: "list-item",
  // Altnernatively, you can use the library react-syntax-highlighter to display code snippets.
  code: "text-sm font-mono bg-neutral text-neutral-content p-6 rounded-box my-4 overflow-x-scroll select-all",
  codeInline:
    "text-sm font-mono bg-base-300 px-1 py-0.5 rounded-box select-all",
};

// All the blog articles data display in the /blog/[articleId].js pages.
export const articles: articleType[] = [
  {
    // The unique slug to use in the URL. It's also used to generate the canonical URL.
    slug: "introducing-supabase",
    // The title to display in the article page (h1). Less than 60 characters. It's also used to generate the meta title.
    title: "Introducing Supabase to ShipFast",
    // The description of the article to display in the article page. Up to 160 characters. It's also used to generate the meta description.
    description:
      "Supabase is an open-source Firebase alternative. It's a great tool for building a backend for your app. It's now integrated with ShipFast!",
    // An array of categories of the article. It's used to generate the category badges, the category filter, and more.
    categories: [
      categories.find((category) => category.slug === categorySlugs.feature),
    ],
    // The author of the article. It's used to generate a link to the author's bio page.
    author: authors.find((author) => author.slug === authorSlugs.marc),
    // The date of the article. It's used to generate the meta date.
    publishedAt: "2023-11-20",
    image: {
      // The image to display in <CardArticle /> components.
      src: introducingSupabaseImg,
      // The relative URL of the same image to use in the Open Graph meta tags & the Schema Markup JSON-LD. It should be the same image as the src above.
      urlRelative: "/blog/introducing-supabase/header.jpg",
      alt: "Supabase and ShipFast logo combined",
    },
    // The actual content of the article that will be shown under the <h1> title in the article page.
    content: (
      <>
        <Image
          src={introducingSupabaseImg}
          alt="Supabase and ShipFast logo combined"
          width={700}
          height={500}
          priority={true}
          className="rounded-box"
          placeholder="blur"
        />
        <section>
          <h2 className={styles.h2}>Introduction</h2>
          <p className={styles.p}>
            Supabase is an open-source Firebase alternative. It&apos;s a great
            tool for building a backend for your app. It&apos;s now integrated
            with ShipFast!
          </p>
        </section>

        <section>
          <h3 className={styles.h3}>1. Create a supabase account</h3>
          <p className={styles.p}>
            First, go to{" "}
            <a href="https://supabase.com/" className="link link-primary">
              Supabase
            </a>{" "}
            and create an account. It&apos;s free for up to 10,000 rows per
            table.
            <br />
            Then create a new project and a new table. You can use the following
            SQL schema:
          </p>

          <pre className={styles.code}>
            <code>
              {`CREATE TABLE public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email text NOT NULL,
  password text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);`}
            </code>
          </pre>
        </section>

        <section>
          <h3 className={styles.h3}>2. Add your credentials to ShipFast</h3>
          <p className={styles.p}>
            Copy the <span className={styles.codeInline}>API URL</span> and{" "}
            <span className={styles.codeInline}>API Key</span> from your
            Supabase project settings and add them to your ShipFast project
            settings. Add these files to your project:
          </p>

          <ul className={styles.ul}>
            <li className={styles.li}>.env.local</li>
            <li className={styles.li}>.env.production</li>
          </ul>
        </section>
      </>
    ),
  },
];

```

### app/blog/_assets/components/HeaderBlog.tsx

```tsx
"use client";

import type { JSX } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Popover, Transition } from "@headlessui/react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/app/icon.png";
import config from "@/config";
import { categories } from "../content";
import ButtonSignin from "@/components/ButtonSignin";

const links: {
  href: string;
  label: string;
}[] = [
  {
    href: "/blog/",
    label: "All Posts",
  },
];

const cta: JSX.Element = (
  <ButtonSignin text="Prevent disputes" extraStyle="btn-primary md:btn-sm" />
);

const ButtonPopoverCategories = () => {
  return (
    <Popover className="relative z-30">
      {({ open }) => (
        <>
          <Popover.Button
            className="link no-underline flex flex-nowrap items-center gap-1 text-base-content/80 hover:text-base-content active:text-base-content focus:text-base-content duration-100"
            title="Open Blog categories"
          >
            Categories
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 duration-200 ${
                open ? "transform rotate-180 " : ""
              }`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Popover.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Popover.Panel className="absolute left-0 z-30 mt-3 w-screen max-w-full sm:max-w-sm transform">
              {({ close }) => (
                <div className="overflow-hidden rounded-box shadow-lg ring-1 ring-base-content ring-opacity-5">
                  <div className="relative grid gap-2 bg-base-100 p-2 overflow-hidden">
                    {categories.map((category) => (
                      <div key={category.slug} onClick={() => close()}>
                        <Link
                          className="block text-left p-3 -m-1 cursor-pointer hover:bg-base-200 rounded-box duration-200"
                          href={`/blog/category/${category.slug}`}
                        >
                          <div className="">
                            <p className="font-medium mb-0.5">
                              {category?.titleShort || category.title}
                            </p>
                            <p className="text-sm opacity-80">
                              {category?.descriptionShort ||
                                category.description}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

const ButtonAccordionCategories = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        type="button"
        className="link no-underline flex justify-between items-center w-full "
      >
        Categories
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 duration-200 ${
            isOpen ? "transform rotate-180 " : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <ul className="space-y-4">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/blog/category/${category.slug}`}
                className="text-base-content/80 hover:text-base-content duration-100 link link-hover"
              >
                {category?.titleShort || category.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

// This is the header that appears on all pages in the /blog folder.
// By default it shows the logo, the links, and the CTA.
// In the links, there's a popover with the categories.
const HeaderBlog = () => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // setIsOpen(false) when the route changes (i.e: when the user clicks on a link on mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [searchParams]);

  return (
    <header className="bg-base-200">
      <nav className="max-w-7xl flex items-center justify-between px-8 py-3 mx-auto">
        {/* Your logo/name on large screens */}
        <div className="flex lg:flex-1">
          <Link
            className="flex items-center gap-2 shrink-0 "
            href="/"
            title={`${config.appName} homepage`}
          >
            <Image
              src={logo}
              alt={`${config.appName} logo`}
              className="w-8"
              priority={true}
              width={32}
              height={32}
            />
            <span className="font-extrabold text-lg">{config.appName}</span>
          </Link>
        </div>
        {/* Burger button to open menu on mobile */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-box p-2.5"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-base-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Your links on large screens */}
        <div className="hidden lg:flex lg:justify-center lg:gap-12 lg:items-center">
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="link link-hover text-base-content/80 hover:text-base-content active:text-base-content focus:text-base-content duration-100"
              title={link.label}
            >
              {link.label}
            </Link>
          ))}

          <ButtonPopoverCategories />
        </div>

        {/* CTA on large screens */}
        <div className="hidden lg:flex lg:justify-end lg:flex-1">{cta}</div>
      </nav>

      {/* Mobile menu, show/hide based on menu state. */}
      <div className={`relative z-50 ${isOpen ? "" : "hidden"}`}>
        <div
          className={`fixed inset-y-0 right-0 z-10 w-full px-8 py-3 overflow-y-auto bg-base-200 sm:max-w-sm sm:ring-1 sm:ring-neutral/10 transform origin-right transition ease-in-out duration-300`}
        >
          {/* Your logo/name on small screens */}
          <div className="flex items-center justify-between">
            <Link
              className="flex items-center gap-2 shrink-0 "
              title={`${config.appName} homepage`}
              href="/"
            >
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                className="w-8"
                placeholder="blur"
                priority={true}
                width={32}
                height={32}
              />
              <span className="font-extrabold text-lg">{config.appName}</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-box p-2.5"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Your links on small screens */}
          <div className="flow-root mt-6">
            <div className="py-4">
              <div className="flex flex-col gap-y-4 items-start">
                {links.map((link) => (
                  <Link
                    href={link.href}
                    key={link.href}
                    className="link link-hover"
                    title={link.label}
                  >
                    {link.label}
                  </Link>
                ))}
                <ButtonAccordionCategories />
              </div>
            </div>
            <div className="divider"></div>
            {/* Your CTA on small screens */}
            <div className="flex flex-col">{cta}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderBlog;

```

### app/blog/_assets/components/BadgeCategory.tsx

```tsx
import Link from "next/link";
import { categoryType } from "../content";

// This is the category badge that appears in the article page and in <CardArticle /> component
const Category = ({
  category,
  extraStyle,
}: {
  category: categoryType;
  extraStyle?: string;
}) => {
  return (
    <Link
      href={`/blog/category/${category.slug}`}
      className={`badge badge-sm md:badge-md hover:badge-primary ${
        extraStyle ? extraStyle : ""
      }`}
      title={`Posts in ${category.title}`}
      rel="tag"
    >
      {category.titleShort}
    </Link>
  );
};

export default Category;

```

### app/blog/_assets/components/CardCategory.tsx

```tsx
import type { JSX } from "react";
import Link from "next/link";
import { categoryType } from "../content";

// This is the category card that appears in the home page and in the category page
const CardCategory = ({
  category,
  tag = "h2",
}: {
  category: categoryType;
  tag?: keyof JSX.IntrinsicElements;
}) => {
  const TitleTag = tag;

  return (
    <Link
      className="p-4 bg-base-200 text-base-content rounded-box duration-200 hover:bg-neutral hover:text-neutral-content"
      href={`/blog/category/${category.slug}`}
      title={category.title}
      rel="tag"
    >
      <TitleTag className="md:text-lg font-medium">
        {category?.titleShort || category.title}
      </TitleTag>
    </Link>
  );
};

export default CardCategory;

```

### app/blog/_assets/components/Avatar.tsx

```tsx
import Link from "next/link";
import Image from "next/image";
import { articleType } from "../content";

// This is the author avatar that appears in the article page and in <CardArticle /> component
const Avatar = ({ article }: { article: articleType }) => {
  return (
    <Link
      href={`/blog/author/${article.author.slug}`}
      title={`Posts by ${article.author.name}`}
      className="inline-flex items-center gap-2 group"
      rel="author"
    >
      <span itemProp="author">
        <Image
          src={article.author.avatar}
          // alt={`Avatar of ${article.author.name}`}
          alt=""
          className="w-7 h-7 rounded-full object-cover object-center"
          width={28}
          height={28}
        />
      </span>
      <span className="group-hover:underline">{article.author.name}</span>
    </Link>
  );
};

export default Avatar;

```

### app/blog/_assets/components/CardArticle.tsx

```tsx
import type { JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import BadgeCategory from "./BadgeCategory";
import Avatar from "./Avatar";
import { articleType } from "../content";

// This is the article card that appears in the home page, in the category page, and in the author's page
const CardArticle = ({
  article,
  tag = "h2",
  showCategory = true,
  isImagePriority = false,
}: {
  article: articleType;
  tag?: keyof JSX.IntrinsicElements;
  showCategory?: boolean;
  isImagePriority?: boolean;
}) => {
  const TitleTag = tag;

  return (
    <article className="card bg-base-200 rounded-box overflow-hidden">
      {article.image?.src && (
        <Link
          href={`/blog/${article.slug}`}
          className="link link-hover hover:link-primary"
          title={article.title}
          rel="bookmark"
        >
          <figure>
            <Image
              src={article.image.src}
              alt={article.image.alt}
              width={600}
              height={338}
              priority={isImagePriority}
              placeholder="blur"
              className="aspect-video object-center object-cover hover:scale-[1.03] duration-200 ease-in-out"
            />
          </figure>
        </Link>
      )}
      <div className="card-body">
        {/* CATEGORIES */}
        {showCategory && (
          <div className="flex flex-wrap gap-2">
            {article.categories.map((category) => (
              <BadgeCategory category={category} key={category.slug} />
            ))}
          </div>
        )}

        {/* TITLE WITH RIGHT TAG */}
        <TitleTag className="mb-1 text-xl md:text-2xl font-bold">
          <Link
            href={`/blog/${article.slug}`}
            className="link link-hover hover:link-primary"
            title={article.title}
            rel="bookmark"
          >
            {article.title}
          </Link>
        </TitleTag>

        <div className=" text-base-content/80 space-y-4">
          {/* DESCRIPTION */}
          <p className="">{article.description}</p>

          {/* AUTHOR & DATE */}
          <div className="flex items-center gap-4 text-sm">
            <Avatar article={article} />

            <span itemProp="datePublished">
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CardArticle;

```

### app/blog/category/[categoryId]/page.tsx

```tsx
import { categories, articles } from "../../_assets/content";
import CardArticle from "../../_assets/components/CardArticle";
import CardCategory from "../../_assets/components/CardCategory";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export async function generateMetadata({
  params,
}: {
  params: { categoryId: string };
}) {
  const category = categories.find(
    (category) => category.slug === params.categoryId
  );

  return getSEOTags({
    title: `${category.title} | Blog by ${config.appName}`,
    description: category.description,
    canonicalUrlRelative: `/blog/category/${category.slug}`,
  });
}

export default async function Category({
  params,
}: {
  params: { categoryId: string };
}) {
  const category = categories.find(
    (category) => category.slug === params.categoryId
  );
  const articlesInCategory = articles
    .filter((article) =>
      article.categories.map((c) => c.slug).includes(category.slug)
    )
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, 3);

  return (
    <>
      <section className="mt-12 mb-24 md:mb-32 max-w-3xl mx-auto text-center">
        <h1 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-6 md:mb-12">
          {category.title}
        </h1>
        <p className="md:text-lg opacity-80 max-w-xl mx-auto">
          {category.description}
        </p>
      </section>

      <section className="mb-24">
        <h2 className="font-bold text-2xl lg:text-4xl tracking-tight text-center mb-8 md:mb-12">
          Most recent articles in {category.title}
        </h2>

        <div className="grid lg:grid-cols-2 gap-8">
          {articlesInCategory.map((article) => (
            <CardArticle
              key={article.slug}
              article={article}
              tag="h3"
              showCategory={false}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-2xl lg:text-4xl tracking-tight text-center mb-8 md:mb-12">
          Other categories you might like
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories
            .filter((c) => c.slug !== category.slug)
            .map((category) => (
              <CardCategory key={category.slug} category={category} tag="h3" />
            ))}
        </div>
      </section>
    </>
  );
}

```

### app/blog/[articleId]/page.tsx

```tsx
import Link from "next/link";
import Script from "next/script";
import { articles } from "../_assets/content";
import BadgeCategory from "../_assets/components/BadgeCategory";
import Avatar from "../_assets/components/Avatar";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export async function generateMetadata({
  params,
}: {
  params: { articleId: string };
}) {
  const article = articles.find((article) => article.slug === params.articleId);

  return getSEOTags({
    title: article.title,
    description: article.description,
    canonicalUrlRelative: `/blog/${article.slug}`,
    extraTags: {
      openGraph: {
        title: article.title,
        description: article.description,
        url: `/blog/${article.slug}`,
        images: [
          {
            url: article.image.urlRelative,
            width: 1200,
            height: 660,
          },
        ],
        locale: "en_US",
        type: "website",
      },
    },
  });
}

export default async function Article({
  params,
}: {
  params: { articleId: string };
}) {
  const article = articles.find((article) => article.slug === params.articleId);
  const articlesRelated = articles
    .filter(
      (a) =>
        a.slug !== params.articleId &&
        a.categories.some((c) =>
          article.categories.map((c) => c.slug).includes(c.slug)
        )
    )
    .sort(
      (a, b) =>
        new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf()
    )
    .slice(0, 3);

  return (
    <>
      {/* SCHEMA JSON-LD MARKUP FOR GOOGLE */}
      <Script
        type="application/ld+json"
        id={`json-ld-article-${article.slug}`}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://${config.domainName}/blog/${article.slug}`,
            },
            name: article.title,
            headline: article.title,
            description: article.description,
            image: `https://${config.domainName}${article.image.urlRelative}`,
            datePublished: article.publishedAt,
            dateModified: article.publishedAt,
            author: {
              "@type": "Person",
              name: article.author.name,
            },
          }),
        }}
      />

      {/* GO BACK LINK */}
      <div>
        <Link
          href="/blog"
          className="link !no-underline text-base-content/80 hover:text-base-content inline-flex items-center gap-1"
          title="Back to Blog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to Blog
        </Link>
      </div>

      <article>
        {/* HEADER WITH CATEGORIES AND DATE AND TITLE */}
        <section className="my-12 md:my-20 max-w-[800px]">
          <div className="flex items-center gap-4 mb-6">
            {article.categories.map((category) => (
              <BadgeCategory
                category={category}
                key={category.slug}
                extraStyle="!badge-lg"
              />
            ))}
            <span className="text-base-content/80" itemProp="datePublished">
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 md:mb-8">
            {article.title}
          </h1>

          <p className="text-base-content/80 md:text-lg max-w-[700px]">
            {article.description}
          </p>
        </section>

        <div className="flex flex-col md:flex-row">
          {/* SIDEBAR WITH AUTHORS AND 3 RELATED ARTICLES */}
          <section className="max-md:pb-4 md:pl-12 max-md:border-b md:border-l md:order-last md:w-72 shrink-0 border-base-content/10">
            <p className="text-base-content/80 text-sm mb-2 md:mb-3">
              Posted by
            </p>
            <Avatar article={article} />

            {articlesRelated.length > 0 && (
              <div className="hidden md:block mt-12">
                <p className=" text-base-content/80 text-sm  mb-2 md:mb-3">
                  Related reading
                </p>
                <div className="space-y-2 md:space-y-5">
                  {articlesRelated.map((article) => (
                    <div className="" key={article.slug}>
                      <p className="mb-0.5">
                        <Link
                          href={`/blog/${article.slug}`}
                          className="link link-hover hover:link-primary font-medium"
                          title={article.title}
                          rel="bookmark"
                        >
                          {article.title}
                        </Link>
                      </p>
                      <p className="text-base-content/80 max-w-full text-sm">
                        {article.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ARTICLE CONTENT */}
          <section className="w-full max-md:pt-4 md:pr-20 space-y-12 md:space-y-20">
            {article.content}
          </section>
        </div>
      </article>
    </>
  );
}

```

### app/blog/author/[authorId]/page.tsx

```tsx
import Image from "next/image";
import { authors, articles } from "../../_assets/content";
import CardArticle from "../../_assets/components/CardArticle";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export async function generateMetadata({
  params,
}: {
  params: { authorId: string };
}) {
  const author = authors.find((author) => author.slug === params.authorId);

  return getSEOTags({
    title: `${author.name}, Author at ${config.appName}'s Blog`,
    description: `${author.name}, Author at ${config.appName}'s Blog`,
    canonicalUrlRelative: `/blog/author/${author.slug}`,
  });
}

export default async function Author({
  params,
}: {
  params: { authorId: string };
}) {
  const author = authors.find((author) => author.slug === params.authorId);
  const articlesByAuthor = articles
    .filter((article) => article.author.slug === author.slug)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf()
    );

  return (
    <>
      <section className="max-w-3xl mx-auto flex flex-col md:flex-row gap-8 mt-12 mb-24 md:mb-32">
        <div>
          <p className="text-xs uppercase tracking-wide text-base-content/80 mb-2">
            Authors
          </p>
          <h1 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-2">
            {author.name}
          </h1>
          <p className="md:text-lg mb-6 md:mb-10 font-medium">{author.job}</p>
          <p className="md:text-lg text-base-content/80">
            {author.description}
          </p>
        </div>

        <div className="max-md:order-first flex md:flex-col gap-4 shrink-0">
          <Image
            src={author.avatar}
            width={256}
            height={256}
            alt={author.name}
            priority={true}
            className="rounded-box w-[12rem] md:w-[16rem] "
          />

          {author.socials?.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4">
              {author.socials.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="btn btn-square"
                  // Using a dark theme? -> className="btn btn-square btn-neutral"
                  title={`Go to ${author.name} profile on ${social.name}`}
                  target="_blank"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-2xl lg:text-4xl tracking-tight text-center mb-8 md:mb-12">
          Most recent articles by {author.name}
        </h2>

        <div className="grid lg:grid-cols-2 gap-8">
          {articlesByAuthor.map((article) => (
            <CardArticle key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </>
  );
}

```

### app/quiz-type-filters/layout.tsx

```tsx
import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz Type Filters | Test Your Knowledge',
  description: 'Filter quizzes by question type - single selection, multiple choice, drag and drop, and more!',
};

export default function QuizTypeFiltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

```

### app/quiz-type-filters/page.tsx

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { availableQuestionTypes } from '../features/quiz/pages/QuizPage';

// Sample quizzes - in a real implementation you'd fetch these from an API
const SAMPLE_QUIZZES = [
  { id: 'azure-a102', title: 'Microsoft Azure A102 Certification' },
  { id: 'aws-fundamentals', title: 'AWS Cloud Fundamentals' },
  { id: 'react-basics', title: 'React Basics Quiz' },
];

export default function QuizTypesPage() {
  const [quizzes, setQuizzes] = useState(SAMPLE_QUIZZES);
  const [isLoading, setIsLoading] = useState(false);
  
  // In a real implementation, you'd fetch quizzes from the API
  // useEffect(() => {
  //   const fetchQuizzes = async () => {
  //     setIsLoading(true);
  //     try {
  //       const response = await fetch('/api/quizzes');
  //       const data = await response.json();
  //       setQuizzes(data);
  //     } catch (error) {
  //       console.error("Error fetching quizzes:", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   
  //   fetchQuizzes();
  // }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <p className="text-xl text-custom-dark-blue">Loading quizzes...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-custom-dark-blue">
          Quizzes with Question Type Filtering
        </h1>
        
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-custom-primary">{quiz.title}</h2>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-700">Take quiz with all question types:</h3>
              <Link 
                href={`/quiz-test/${quiz.id}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-4"
              >
                All Questions
              </Link>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">Filter by question type:</h3>
              <div className="flex flex-wrap gap-2">
                {availableQuestionTypes.map((type) => (
                  <Link
                    key={type.type}
                    href={`/quiz-test/${quiz.id}/${type.type}`}
                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    {type.name} Questions
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

```

### app/dashboard/layout.tsx

```tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import config from "@/config";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
export default async function LayoutPrivate({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(config.auth.loginUrl);
  }

  return <>{children}</>;
}

```

### app/dashboard/page.tsx

```tsx
import ButtonAccount from "@/components/ButtonAccount";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Private Page</h1>
      </section>
    </main>
  );
}

```

### app/tos/page.tsx

```tsx
import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR TERMS & SERVICES — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: ShipFast
// - Contact information: marc@shipfa.st
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - Ownership: when buying a package, users can download code to create apps. They own the code but they do not have the right to resell it. They can ask for a full refund within 7 day after the purchase.
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://shipfa.st/privacy-policy
// - Governing Law: France
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Terms and Conditions for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: September 26, 2023

Welcome to ShipFast!

These Terms of Service ("Terms") govern your use of the ShipFast website at https://shipfa.st ("Website") and the services provided by ShipFast. By using our Website and services, you agree to these Terms.

1. Description of ShipFast

ShipFast is a platform that offers a JavaScript code boilerplate to assist entrepreneurs in launching their startups more efficiently.

2. Ownership and Usage Rights

When you purchase a package from ShipFast, you gain the right to download and use the code provided for creating applications. You own the code you create but do not have the right to resell it. We offer a full refund within 7 days of purchase, as specified in our refund policy.

3. User Data and Privacy

We collect and store user data, including name, email, and payment information, as necessary to provide our services. For details on how we handle your data, please refer to our Privacy Policy at https://shipfa.st/privacy-policy.

4. Non-Personal Data Collection

We use web cookies to collect non-personal data for the purpose of improving our services and user experience.

5. Governing Law

These Terms are governed by the laws of France.

6. Updates to the Terms

We may update these Terms from time to time. Users will be notified of any changes via email.

For any questions or concerns regarding these Terms of Service, please contact us at marc@shipfa.st.

Thank you for using ShipFast!`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;

```

### app/components/QuizCTA.tsx

```tsx
import Link from 'next/link';

const QuizCTA = () => {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Up for a Challenge? Test Your Skills!
        </h2>
        <p className="mb-8 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
          Our brand new interactive quizzes are here! Start with our engaging Single Selection questions
          and prove your expertise. More question types are on the way. Dare to see your score?
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link
            href="/quiz-test/azure-a102" // Assuming 'azure-a102' is a valid quiz ID
            className="inline-block bg-white hover:bg-gray-100 text-purple-700 font-bold py-3 px-10 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            Take the Challenge!
          </Link>
          <Link
            href="/quiz-type-filters"
            className="inline-block bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-10 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            Filtered Quizzes
          </Link>
        </div>
      </div>
    </section>
  );
};

export default QuizCTA; 
```

### app/question-types-demo/type-client-page.tsx

```tsx

```

### app/question-types-demo/[type]/page.tsx

```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { AnyQuestion, MultiChoiceQuestion, SingleSelectionQuestion, QuestionType } from '../../types/quiz';
import SingleSelectionComponent from '../../features/quiz/components/question-types/SingleSelectionComponent';
import MultiChoiceComponent from '../../features/quiz/components/question-types/MultiChoiceComponent';
import { fetchRandomQuestionByTypeAndFilters } from '../../lib/supabaseQuizService'; // Import the new service function

export default function QuestionTypeDemo({ params }: { params: { type: string } }) {
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state
  const [error, setError] = useState<string | null>(null); // Added error state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmittedDemo, setIsSubmittedDemo] = useState(false);
  const [showCorrectAnswerDemo, setShowCorrectAnswerDemo] = useState(false);

  const [filters, setFilters] = useState({
    difficulty: 'all',
    tags: [] as string[]
  });
  const questionType = params.type as QuestionType;
  
  const loadQuestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCurrentQuestion(null); // Clear previous question
    try {
      const question = await fetchRandomQuestionByTypeAndFilters(questionType, filters);
      if (question) {
        setCurrentQuestion(question);
      } else {
        setError('No question found matching your criteria.');
      }
    } catch (err: any) {
      console.error("Error fetching question:", err);
      setError(err.message || 'Failed to fetch question.');
    } finally {
      setIsLoading(false);
    }
  }, [questionType, filters]); // Added dependencies to useCallback

  useEffect(() => {
    loadQuestion();
    // Reset selections when question or filters change
    setSelectedOption(null);
    setSelectedOptions([]);
    setIsSubmittedDemo(false);
    setShowCorrectAnswerDemo(false);
  }, [loadQuestion]); // useEffect now depends on loadQuestion

  const handleSingleSelect = (optionId: string) => {
    if (!isSubmittedDemo) {
      setSelectedOption(optionId);
    }
  };

  const handleMultiSelect = (optionIds: string[]) => {
    if (!isSubmittedDemo) {
      setSelectedOptions(optionIds);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <p className="text-xl text-custom-dark-blue">Loading question...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-lg text-gray-700">{error}</p>
          <button 
            onClick={loadQuestion} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            Try Again
          </button>
          <a
            href="/question-types"
            className="mt-6 inline-block px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Question Types
          </a>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Question Available</h1>
          <p className="text-lg text-gray-700">
            Could not load a question of type "{questionType}" with the current filters (Difficulty: {filters.difficulty}, Tags: {filters.tags.join(', ') || 'None'}).
          </p>
          <button 
            onClick={loadQuestion} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            Try Fetching Again
          </button>
          <a
            href="/question-types"
            className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Question Types
          </a>
        </div>
      </div>
    );
  }

  const pageTitle = currentQuestion 
    ? `${currentQuestion.type.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())} Question Demo` 
    : 'Question Demo';

  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-custom-dark-blue">
          {pageTitle}
        </h1>
        
        {/* Filter section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <h2 className="text-xl font-semibold mb-2 md:mb-0 text-custom-primary">Filters</h2>
            <button 
              onClick={() => setFilters({ difficulty: 'all', tags: [] })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Reset Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Difficulty filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              >
                <option value="all">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            {/* Tags filter - simplified with checkboxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="space-x-4">
                {['question-types-demo', 'cloud-services'].map(tag => (
                  <label key={tag} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600"
                      checked={filters.tags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                        } else {
                          setFilters(prev => ({ 
                            ...prev, 
                            tags: prev.tags.filter(t => t !== tag) 
                          }));
                        }
                      }}
                    />
                    <span className="ml-2 text-gray-700">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-custom-primary">Instructions</h2>
          <p className="text-gray-700">
            {currentQuestion.type === 'single_selection' && 'Select the correct answer from the options below.'}
            {currentQuestion.type === 'multi' && `Select all correct answers from the options below. (Correct: ${(currentQuestion as MultiChoiceQuestion).correctAnswerOptionIds.length})`}
            {/* Add instructions for other question types as they are implemented */}
          </p>
        </div>
        
        {/* Question display area */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {currentQuestion.type === 'single_selection' && (
            <SingleSelectionComponent
              question={currentQuestion as SingleSelectionQuestion}
              selectedOptionId={selectedOption}
              onAnswerSelect={handleSingleSelect}
              isSubmitted={isSubmittedDemo}
              showCorrectAnswer={showCorrectAnswerDemo}
            />
          )}
          {currentQuestion.type === 'multi' && (
            <MultiChoiceComponent
              question={currentQuestion as MultiChoiceQuestion}
              selectedOptionIds={selectedOptions}
              onAnswerSelect={handleMultiSelect}
              isSubmitted={isSubmittedDemo}
              showCorrectAnswer={showCorrectAnswerDemo}
            />
          )}
          {/* Add other question type components here as needed */}

          {/* Demo Controls */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-custom-dark-blue">Demo Controls</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setIsSubmittedDemo(!isSubmittedDemo)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors text-sm ${
                  isSubmittedDemo ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isSubmittedDemo ? 'Unlock Answers (View Mode)' : 'Lock Answers (Submit)'}
              </button>
              <button
                onClick={() => setShowCorrectAnswerDemo(!showCorrectAnswerDemo)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors text-sm ${
                  showCorrectAnswerDemo ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {showCorrectAnswerDemo ? 'Hide Feedback' : 'Show Feedback'}
              </button>
            </div>
            {isSubmittedDemo && (
              <p className="mt-3 text-xs text-gray-600">
                Answers are {selectedOption || selectedOptions.length > 0 ? 'locked' : 'not selected but locked'}. Toggle "Show Feedback" to see correctness.
              </p>
            )}
             {!isSubmittedDemo && (
              <p className="mt-3 text-xs text-gray-600">
                Select an answer. Then "Lock Answers" to simulate submission.
              </p>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="mt-8 text-center">
          <a
            href="/question-types"
            className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Question Types
          </a>
        </div>
      </div>
    </div>
  );
}

```

### app/signin/layout.tsx

```tsx
import { ReactNode } from "react";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: `Sign-in to ${config.appName}`,
  canonicalUrlRelative: "/auth/signin",
});

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

```

### app/signin/page.tsx

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Provider } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import config from "@/config";

// This a login/singup page for Supabase Auth.
// Successfull login redirects to /api/auth/callback where the Code Exchange is processed (see app/api/auth/callback/route.js).
export default function Login() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const handleSignup = async (
    e: any,
    options: {
      type: string;
      provider?: Provider;
    }
  ) => {
    e?.preventDefault();

    setIsLoading(true);

    try {
      const { type, provider } = options;
      const redirectURL = window.location.origin + "/api/auth/callback";

      if (type === "oauth") {
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectURL,
          },
        });
      } else if (type === "magic_link") {
        await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectURL,
          },
        });

        toast.success("Check your emails!");

        setIsDisabled(true);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-8 md:p-24" data-theme={config.colors.theme}>
      <div className="text-center mb-4">
        <Link href="/" className="btn btn-ghost btn-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Home
        </Link>
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-12">
        Sign-in to {config.appName}{" "}
      </h1>

      <div className="space-y-8 max-w-xl mx-auto">
        <button
          className="btn btn-block"
          onClick={(e) =>
            handleSignup(e, { type: "oauth", provider: "google" })
          }
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 48 48"
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
          )}
          Sign-up with Google
        </button>

        <div className="divider text-xs text-base-content/50 font-medium">
          OR
        </div>

        <form
          className="form-control w-full space-y-4"
          onSubmit={(e) => handleSignup(e, { type: "magic_link" })}
        >
          <input
            required
            type="email"
            value={email}
            autoComplete="email"
            placeholder="tom@cruise.com"
            className="input input-bordered w-full placeholder:opacity-60"
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            className="btn btn-primary btn-block"
            disabled={isLoading || isDisabled}
            type="submit"
          >
            {isLoading && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
            Send Magic Link
          </button>
        </form>
      </div>
    </main>
  );
}

```

### app/lib/supabaseQuizService.ts

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  BaseQuestion, 
  AnyQuestion, 
  SingleSelectionQuestion, 
  MultiChoiceQuestion,
  SelectionOption,
  DragAndDropTarget,
  DragAndDropOption,
  DragAndDropCorrectPair,
  DragAndDropQuestion,
  Quiz // Will be needed for fetchQuizById
} from '../types/quiz';

// Initialize Supabase client
// Using hardcoded values from .env file for debugging
const supabaseUrl = "https://rvwvnralrlsdtugtgict.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3ZucmFscmxzZHR1Z3RnaWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQ0NzM0NCwiZXhwIjoyMDYxMDIzMzQ0fQ.hFRjn5zq24WmKEoCLbWDRUY6dUdEjlPS-c4OemCaFM4";

console.log('Supabase Environment Variables:');
console.log('URL:', supabaseUrl ? 'Defined' : 'Undefined');
console.log('Service Role Key:', supabaseServiceRoleKey ? 'Defined' : 'Undefined');

// No need to check for undefined since we're using hardcoded values
// if (!supabaseUrl || !supabaseServiceRoleKey) {
//   throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
// }

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false } // Recommended for server-side clients
});

export async function enrichQuestionWithDetails(
  baseQuestion: BaseQuestion
): Promise<AnyQuestion | null> {
  if (baseQuestion.type === 'single_selection') {
    try {
      // Fetch options for the single selection question
      const { data: optionsData, error: optionsError } = await supabase
        .from('single_selection_options')
        .select('option_id, text')
        .eq('question_id', baseQuestion.id);

      if (optionsError) {
        console.error(`Error fetching options for question ${baseQuestion.id}:`, optionsError.message);
        return null;
      }

      // Fetch the correct answer for the single selection question
      const { data: correctAnswerData, error: correctAnswerError } = await supabase
        .from('single_selection_correct_answer')
        .select('option_id')
        .eq('question_id', baseQuestion.id)
        .single(); // Expecting only one row

      if (correctAnswerError) {
        // .single() throws an error if no row is found, or more than one is found.
        // We can check the error code/details if needed, e.g. PostgrestError PGRST116 (0 rows)
        if (correctAnswerError.code === 'PGRST116') {
            console.warn(`No correct answer found for single_selection question ${baseQuestion.id}. (PGRST116)`);
        } else {
            console.error(`Error fetching correct answer for question ${baseQuestion.id}:`, correctAnswerError.message);
        }
        return null;
      }

      if (!correctAnswerData) { // Should be redundant if .single() succeeded, but good for safety
        console.warn(`No correct answer data returned for single_selection question ${baseQuestion.id} despite no error.`);
        return null;
      }

      const typedOptions: SelectionOption[] = (optionsData || []).map((opt: any) => ({
        option_id: opt.option_id,
        text: opt.text,
      }));

      const correctAnswerOptionId = correctAnswerData.option_id;

      // It's possible optionsData is empty, which might be valid for a question under construction.
      // However, a correct answer ID must exist.
      if (!correctAnswerOptionId) {
        console.warn(`Correct answer option_id missing after fetch for single_selection question ${baseQuestion.id}`);
        return null; // Critical data missing
      }
      
      const singleSelectionQuestion: SingleSelectionQuestion = {
        ...baseQuestion,
        type: 'single_selection',
        options: typedOptions,
        correctAnswerOptionId: correctAnswerOptionId,
      };
      return singleSelectionQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching single_selection question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else if (baseQuestion.type === 'multi') {
    try {
      // Fetch options for the multi-choice question
      const { data: optionsData, error: optionsError } = await supabase
        .from('multi_options')
        .select('option_id, text')
        .eq('question_id', baseQuestion.id);

      if (optionsError) {
        console.error(`Error fetching options for multi question ${baseQuestion.id}:`, optionsError.message);
        return null;
      }

      // Fetch the correct answers for the multi-choice question
      const { data: correctAnswersData, error: correctAnswersError } = await supabase
        .from('multi_correct_answers')
        .select('option_id')
        .eq('question_id', baseQuestion.id);

      if (correctAnswersError) {
        console.error(`Error fetching correct answers for multi question ${baseQuestion.id}:`, correctAnswersError.message);
        return null;
      }

      const typedOptions: SelectionOption[] = (optionsData || []).map((opt: any) => ({
        option_id: opt.option_id,
        text: opt.text,
      }));

      const correctAnswerOptionIds = (correctAnswersData || []).map((ans: any) => ans.option_id);

      if (!correctAnswerOptionIds.length) {
        console.warn(`No correct answer options found for multi question ${baseQuestion.id}`);
        return null; // Critical data missing
      }
      
      const multiChoiceQuestion: MultiChoiceQuestion = {
        ...baseQuestion,
        type: 'multi',
        options: typedOptions,
        correctAnswerOptionIds: correctAnswerOptionIds,
      };
      return multiChoiceQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching multi question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else if (baseQuestion.type === 'drag_and_drop') {
    try {
      // Fetch targets for the drag and drop question
      const { data: targetsData, error: targetsError } = await supabase
        .from('drag_and_drop_targets')
        .select('target_id, text')
        .eq('question_id', baseQuestion.id);

      if (targetsError) {
        console.error(`Error fetching targets for drag_and_drop question ${baseQuestion.id}:`, targetsError.message);
        return null;
      }

      // Fetch options for the drag and drop question
      const { data: optionsData, error: optionsError } = await supabase
        .from('drag_and_drop_options')
        .select('option_id, text')
        .eq('question_id', baseQuestion.id);

      if (optionsError) {
        console.error(`Error fetching options for drag_and_drop question ${baseQuestion.id}:`, optionsError.message);
        return null;
      }

      // Fetch correct pairs for the drag and drop question
      const { data: correctPairsData, error: correctPairsError } = await supabase
        .from('drag_and_drop_correct_pairs')
        .select('option_id, target_id')
        .eq('question_id', baseQuestion.id);

      if (correctPairsError) {
        console.error(`Error fetching correct pairs for drag_and_drop question ${baseQuestion.id}:`, correctPairsError.message);
        return null;
      }

      const typedTargets: DragAndDropTarget[] = (targetsData || []).map((target: any) => ({
        target_id: target.target_id,
        text: target.text,
      }));

      const typedOptions: DragAndDropOption[] = (optionsData || []).map((option: any) => ({
        option_id: option.option_id,
        text: option.text,
      }));

      const typedCorrectPairs: DragAndDropCorrectPair[] = (correctPairsData || []).map((pair: any) => ({
        option_id: pair.option_id,
        target_id: pair.target_id,
      }));

      // Check if we have the minimum required data
      if (!typedTargets.length) {
        console.warn(`No targets found for drag_and_drop question ${baseQuestion.id}`);
        return null;
      }
      if (!typedOptions.length) {
        console.warn(`No options found for drag_and_drop question ${baseQuestion.id}`);
        return null;
      }
      if (!typedCorrectPairs.length) {
        console.warn(`No correct pairs found for drag_and_drop question ${baseQuestion.id}`);
        return null;
      }

      const dragAndDropQuestion: DragAndDropQuestion = {
        ...baseQuestion,
        type: 'drag_and_drop',
        targets: typedTargets,
        options: typedOptions,
        correctPairs: typedCorrectPairs,
      };
      return dragAndDropQuestion;

    } catch (error: any) {
      console.error(`Unexpected error enriching drag_and_drop question ${baseQuestion.id}:`, error.message || error);
      return null;
    }
  } else {
    console.warn(`enrichQuestionWithDetails: Unhandled question type '${baseQuestion.type}' for Q ID ${baseQuestion.id}. Returning null.`);
    return null; 
  }
}

export async function fetchQuizById(
  quizId: string,
  questionType?: string
): Promise<Quiz | null> {
  try {
    // 1. Fetch quiz metadata
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) {
      if (quizError.code === 'PGRST116') { // Not found
        console.warn(`Quiz with ID '${quizId}' not found.`);
      } else {
        console.error(`Error fetching quiz ${quizId}:`, quizError.message);
      }
      return null;
    }
    if (!quizData) {
      console.warn(`No data for quiz ${quizId} despite no error.`);
      return null;
    }

    // 2. Fetch base questions for the quiz, with optional type filter
    let query = supabase
      .from('questions')
      .select('*') // Select all base question fields
      .eq('quiz_tag', quizId);
      
    // Apply type filter if provided
    if (questionType) {
      query = query.eq('type', questionType);
    }
    
    // Execute the query
    const { data: baseQuestionsData, error: questionsError } = await query;

    if (questionsError) {
      console.error(`Error fetching questions for quiz ${quizId}:`, questionsError.message);
      return null;
    }

    // 3. Enrich each question with its specific details
    const enrichedQuestionsPromises = (baseQuestionsData || []).map(bq => 
      enrichQuestionWithDetails(bq as BaseQuestion)
    );
    const resolvedQuestions = await Promise.all(enrichedQuestionsPromises);
    const successfullyEnrichedQuestions = resolvedQuestions.filter(q => q !== null) as AnyQuestion[];

    if (baseQuestionsData && successfullyEnrichedQuestions.length !== baseQuestionsData.length) {
      console.warn(`Not all questions for quiz ${quizId} could be successfully enriched.`);
    }

    return {
      ...(quizData as Quiz), // Spread fetched quiz metadata
      questions: successfullyEnrichedQuestions, // Add the array of enriched questions
    };

  } catch (error: any) {
    console.error(`Unexpected error in fetchQuizById for quiz ${quizId}:`, error.message || error);
    return null;
  }
}

// New function to fetch a random question by type and filters
export async function fetchRandomQuestionByTypeAndFilters(
  type: string, // Should be QuestionType, but using string for broader initial compatibility
  filters: { difficulty?: string; tags?: string[] }
): Promise<AnyQuestion | null> {
  try {
    let query = supabase
      .from('questions')
      .select('*')
      .eq('type', type);

    if (filters.difficulty && filters.difficulty !== 'all') {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters.tags && filters.tags.length > 0) {
      // Assuming quiz_tag can be used for general tagging for now
      // If you have a separate tags table or array column, this would need adjustment
      query = query.in('quiz_tag', filters.tags);
    }

    // Fetch multiple to then pick one randomly, or use a database-specific random function
    // For simplicity, fetching a few and picking the first one.
    // For true randomness and performance on large datasets, a DB function like RANDOM() or TABLESAMPLE is better.
    query = query.limit(10); // Fetch up to 10 matching questions

    const { data: baseQuestionsData, error: questionsError } = await query;

    if (questionsError) {
      console.error(`Error fetching questions by type ${type} and filters:`, questionsError.message);
      return null;
    }

    if (!baseQuestionsData || baseQuestionsData.length === 0) {
      console.warn(`No questions found for type ${type} with current filters.`);
      return null;
    }

    // Pick a random question from the fetched ones
    const randomIndex = Math.floor(Math.random() * baseQuestionsData.length);
    const randomBaseQuestion = baseQuestionsData[randomIndex] as BaseQuestion;

    if (!randomBaseQuestion) {
      return null;
    }

    // Enrich the selected base question with its specific details
    return await enrichQuestionWithDetails(randomBaseQuestion);

  } catch (error: any) {
    console.error(`Unexpected error in fetchRandomQuestionByTypeAndFilters for type ${type}:`, error.message || error);
    return null;
  }
}
```

### app/api/webhook/mailgun/route.ts

```typescript
import { NextResponse, NextRequest } from "next/server";
import { sendEmail } from "@/libs/mailgun";
import config from "@/config";

// This route is used to receive emails from Mailgun and forward them to our customer support email.
// See more: https://shipfa.st/docs/features/emails
export async function POST(req: NextRequest) {
  try {
    // extract the email content, subject and sender
    const formData = await req.formData();
    const sender = formData.get("From");
    const subject = formData.get("Subject");
    const html = formData.get("body-html");

    // send email to the admin if forwardRepliesTo is et & emailData exists
    if (config.mailgun.forwardRepliesTo && html && subject && sender) {
      await sendEmail({
        to: config.mailgun.forwardRepliesTo,
        subject: `${config?.appName} | ${subject}`,
        html: `<div><p><b>- Subject:</b> ${subject}</p><p><b>- From:</b> ${sender}</p><p><b>- Content:</b></p><div>${html}</div></div>`,
        replyTo: String(sender),
      });
    }

    return NextResponse.json({});
  } catch (e) {
    console.error(e?.message);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

```

### app/api/webhook/stripe/route.ts

```typescript
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { SupabaseClient } from "@supabase/supabase-js";
import configFile from "@/config";
import { findCheckoutSession } from "@/libs/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
  typescript: true,
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req: NextRequest) {
  const body = await req.text();

  const signature = headers().get("stripe-signature");

  let eventType;
  let event;

  // Create a private supabase client using the secret service_role API key
  const supabase = new SupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  eventType = event.type;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Checkout.Session = event.data
          .object as Stripe.Checkout.Session;

        const session = await findCheckoutSession(stripeObject.id);

        const customerId = session?.customer;
        const priceId = session?.line_items?.data[0]?.price.id;
        const userId = stripeObject.client_reference_id;
        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

        if (!plan) break;

        // Update the profile where id equals the userId (in table called 'profiles') and update the customer_id, price_id, and has_access (provisioning)
        await supabase
          .from("profiles")
          .update({
            customer_id: customerId,
            price_id: priceId,
            has_access: true,
          })
          .eq("id", userId);

        // Extra: send email with user link, product page, etc...
        // try {
        //   await sendEmail(...);
        // } catch (e) {
        //   console.error("Email issue:" + e?.message);
        // }

        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        break;
      }

      case "customer.subscription.updated": {
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        // You don't need to do anything here, because Stripe will let us know when the subscription is canceled for good (at the end of the billing cycle) in the "customer.subscription.deleted" event
        // You can update the user data to show a "Cancel soon" badge for instance
        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        const stripeObject: Stripe.Subscription = event.data
          .object as Stripe.Subscription;
        const subscription = await stripe.subscriptions.retrieve(
          stripeObject.id
        );

        await supabase
          .from("profiles")
          .update({ has_access: false })
          .eq("customer_id", subscription.customer);
        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Invoice = event.data
          .object as Stripe.Invoice;
        const priceId = stripeObject.lines.data[0].price.id;
        const customerId = stripeObject.customer;

        // Find profile where customer_id equals the customerId (in table called 'profiles')
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("customer_id", customerId)
          .single();

        // Make sure the invoice is for the same plan (priceId) the user subscribed to
        if (profile.price_id !== priceId) break;

        // Grant the profile access to your product. It's a boolean in the database, but could be a number of credits, etc...
        await supabase
          .from("profiles")
          .update({ has_access: true })
          .eq("customer_id", customerId);

        break;
      }

      case "invoice.payment_failed":
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired

        break;

      default:
      // Unhandled event type
    }
  } catch (e) {
    console.error("stripe error: ", e.message);
  }

  return NextResponse.json({});
}

```

### app/api/auth/callback/route.ts

```typescript
import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import config from "@/config";

export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl);
}

```

### app/api/quiz/[quizId]/route.ts

```typescript
import { NextResponse } from 'next/server';
import { fetchQuizById } from '../../../lib/supabaseQuizService'; // We'll keep using the server-side service for API routes

export async function GET(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  const quizId = params.quizId;
  
  // Extract questionType from URL if present
  const url = new URL(request.url);
  const questionType = url.searchParams.get('questionType');

  if (!quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
  }

  try {
    // Pass questionType to the fetchQuizById function
    const quiz = await fetchQuizById(quizId, questionType || undefined);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error(`API Error fetching quiz ${quizId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch quiz', details: error.message }, { status: 500 });
  }
} 
```

### app/api/lead/route.ts

```typescript
import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// This route is used to store the leads that are generated from the landing page.
// The API call is initiated by <ButtonLead /> component
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.from("leads").insert({ email: body.email });

    return NextResponse.json({});
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

```

### app/api/stripe/create-portal/route.ts

```typescript
import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createCustomerPortal } from "@/libs/stripe";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const body = await req.json();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // User who are not logged in can't make a purchase
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to view billing information." },
        { status: 401 }
      );
    } else if (!body.returnUrl) {
      return NextResponse.json(
        { error: "Return URL is required" },
        { status: 400 }
      );
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session?.user?.id)
      .single();

    if (!data?.customer_id) {
      return NextResponse.json(
        {
          error: "You don't have a billing account yet. Make a purchase first.",
        },
        { status: 400 }
      );
    }

    const stripePortalUrl = await createCustomerPortal({
      customerId: data.customer_id,
      returnUrl: body.returnUrl,
    });

    return NextResponse.json({
      url: stripePortalUrl,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

```

### app/api/stripe/create-checkout/route.ts

```typescript
import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createCheckout } from "@/libs/stripe";

// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It's called by the <ButtonCheckout /> component
// Users must be authenticated. It will prefill the Checkout data with their email and/or credit card (if any)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // User who are not logged in can't make a purchase
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to make a purchase." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { priceId, mode, successUrl, cancelUrl } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    } else if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "Success and cancel URLs are required" },
        { status: 400 }
      );
    } else if (!body.mode) {
      return NextResponse.json(
        {
          error:
            "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)",
        },
        { status: 400 }
      );
    }

    // Search for a profile with unique ID equals to the user session ID (in table called 'profiles')
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session?.user?.id)
      .single();

    // If no profile found, create one. This is used to store the Stripe customer ID
    if (!data) {
      await supabase.from("profiles").insert([
        {
          id: session.user.id,
          price_id: body.priceId,
          email: session?.user?.email,
        },
      ]);
    }

    const stripeSessionURL = await createCheckout({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      clientReferenceId: session.user.id,
      user: {
        email: session?.user?.email,
        // If the user has already purchased, it will automatically prefill it's credit card
        customerId: data?.customer_id,
      },
      // If you send coupons from the frontend, you can pass it here
      // couponId: body.couponId,
    });

    return NextResponse.json({ url: stripeSessionURL });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

```

### app/api/questions/route.ts

```typescript

```

### app/quiz-test/[quizId]/page-new.tsx

```tsx
'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

// Simple wrapper component that provides the QuizContext
export default async function QuizTestPage({ params }: { params: { quizId: string } }) {
  // Using async function to address the "params should be awaited" warning
  const quizId = params.quizId;
  
  return (
    <QuizProvider>
      <QuizPage quizId={quizId} />
    </QuizProvider>
  );
}

```

### app/quiz-test/[quizId]/page-server.tsx

```tsx
import React from 'react';
import ClientQuizPage from './client-page';

// This is a server component that can properly handle async params
export default async function QuizTestPage({ params }: { params: { quizId: string } }) {
  // Server-side logic can go here if needed
  const quizId = params.quizId;
  
  // Render the client component with the quizId
  return <ClientQuizPage quizId={quizId} />;
}

```

### app/quiz-test/[quizId]/type-client-page.tsx

```tsx
'use client';

import React from 'react';
import { QuizProvider } from '../../../../features/quiz/context/QuizContext';
import QuizPage from '../../../../features/quiz/pages/QuizPage';

interface QuizTypeClientPageProps {
  quizId: string;
  questionType: string;
}

export default function QuizTypeClientPage({ quizId, questionType }: QuizTypeClientPageProps) {
  return (
    <QuizProvider>
      <QuizPage quizId={quizId} questionType={questionType} />
    </QuizProvider>
  );
}

```

### app/quiz-test/[quizId]/page-updated.tsx

```tsx
'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizRunnerComponent from '../../features/quiz/pages/QuizPage';

// Page component serving as a wrapper
const QuizPage: React.FC<{ params: { quizId: string } }> = ({ params }) => {
  return (
    <QuizProvider>
      <QuizRunnerComponent quizId={params.quizId} />
    </QuizProvider>
  );
};

export default QuizPage;

```

### app/quiz-test/[quizId]/page.tsx

```tsx
import React from 'react';
import ClientQuizPage from './client-page';

// This is a server component that properly handles async params in Next.js 15
export default async function QuizTestPage({ params }: { params: { quizId: string } }) {
  // Using server component to access params properly
  const quizId = params.quizId;
  
  // Pass the quizId to the client component
  return <ClientQuizPage quizId={quizId} />;
}
```

### app/quiz-test/[quizId]/page.tsx.bak

```bak
'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

  useEffect(() => {
    if (quizId) {
      dispatch({ type: 'LOAD_QUIZ_START' });
      // In a real app, you would call an API route here
      // which internally uses fetchQuizById from quizService.ts.
      // For now, to demonstrate, we are directly calling it.
      // This has implications: quizService.ts uses server-side env vars and Supabase client.
      // This will NOT work directly on the client if quizService.ts is not refactored
      // or if fetchQuizById is not exposed via an API endpoint.
      
      // TEMPORARY: Simulating API call for now for UI structure
      // Replace this with actual API call
      const loadQuiz = async () => {
        try {
          // This direct call to fetchQuizById from client won't work with server-side Supabase client.
          // const quizData = await fetchQuizById(quizId);
          // Instead, this needs to be an API call:
          const response = await fetch(`/api/quiz/${quizId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch quiz: ${response.statusText}`);
          }
          const quizData = await response.json();

          if (quizData && !quizData.error) {
            dispatch({ type: 'LOAD_QUIZ_SUCCESS', payload: quizData });
          } else {
            dispatch({ type: 'LOAD_QUIZ_FAILURE', payload: quizData.error || 'Failed to load quiz data.' });
          }
        } catch (error: any) {
          console.error("Error fetching quiz data:", error);
          dispatch({ type: 'LOAD_QUIZ_FAILURE', payload: error.message || 'Error fetching quiz.' });
        }
      };
      loadQuiz();
    }
  }, [quizId, dispatch]);

  // Calculate progress for the progress bar
  const progressPercentage = state.questions.length > 0 
    ? ((state.currentQuestionIndex + 1) / state.questions.length) * 100 
    : 0;

  if (state.isLoading) return <div className="flex justify-center items-center min-h-screen bg-custom-light-bg"><p className="text-xl text-custom-dark-blue">Loading quiz...</p></div>;
  if (state.error) return <div className="flex justify-center items-center min-h-screen bg-custom-light-bg"><p className="text-xl text-custom-error">Error: {state.error}</p></div>;
  if (!state.quiz || state.questions.length === 0) return <div className="flex justify-center items-center min-h-screen bg-custom-light-bg"><p className="text-xl text-custom-dark-blue">Quiz not found or no questions available.</p></div>;

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const isLastQuestion = state.questions.length > 0 && state.currentQuestionIndex === state.questions.length - 1;

  if (!currentQuestion && state.isQuizComplete) {
    return (
        <div className="min-h-screen bg-custom-light-bg flex flex-col justify-center items-center p-6 animate-fade-in">
            <div className="container mx-auto p-4 md:p-8 text-center bg-white shadow-shadow-strong rounded-rounded-lg-ref">
                <h1 className="text-3xl md:text-4xl font-bold mb-6 text-custom-success">Quiz Completed!</h1>
                <p className="text-lg md:text-xl text-custom-gray-1 mb-8">You have completed the quiz: <span className="font-semibold">{state.quiz.title}</span>.</p>
                {/* TODO: Display score or summary here */}
                <button 
                    onClick={() => dispatch({ type: 'RESET_QUIZ' })} 
                    className="btn-primary-custom"
                >
                    Take Another Quiz
                </button>
            </div>
        </div>
    );
  }
  if (!currentQuestion) return <div className="flex justify-center items-center min-h-screen bg-custom-light-bg"><p className="text-xl text-custom-dark-blue">No current question available.</p></div>;
  
  // Define button styles based on reference
  const btnBase = "inline-flex items-center justify-center px-8 h-12 border-none rounded-rounded-full font-semibold text-base cursor-pointer transition-all duration-200 relative overflow-hidden";
  const btnSecondaryCustom = `${btnBase} bg-gray-100 text-custom-gray-1 hover:bg-gray-200 hover:-translate-y-0.5`;
  const btnPrimaryCustom = `${btnBase} bg-primary-gradient text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5`;
  // Note: Ripple effect from reference is complex for pure Tailwind; focusing on static/hover styles.

  return (
    <div className="min-h-screen bg-custom-light-bg py-6 px-4 md:px-6">
      <div className="quiz-container max-w-3xl mx-auto">
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-blue mb-3 relative inline-block pb-2">
            {state.quiz.title}
            <span className="absolute left-1/4 bottom-0 w-1/2 h-1 bg-primary-gradient rounded-rounded-full"></span>
          </h1>
          
          <div className="progress-container relative my-8 mx-auto w-full max-w-xl">
            <div className="progress-info flex justify-between mb-2 font-medium text-sm">
              <div className="question-counter bg-primary-gradient text-white py-1 px-4 rounded-rounded-full shadow-shadow-1 text-xs md:text-sm">
                Question {state.currentQuestionIndex + 1} of {state.questions.length}
              </div>
              {/* Score could go here if available: <div className="score-display">Score: ...</div> */}
            </div>
            <div className="progress-bar h-2 bg-gray-200 rounded-rounded-full overflow-hidden shadow-inner">
              <div 
                className="progress-fill h-full bg-primary-gradient rounded-rounded-full transition-all duration-300 ease-out shadow-md"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </header>
        
        {/* QuestionCard will be animated with animate-card-appear inside its own component if possible */}
        <QuestionCard question={currentQuestion} />

        <div className="navigation flex flex-col md:flex-row justify-between mt-10 gap-4">
          <button 
            onClick={() => dispatch({ type: 'PREVIOUS_QUESTION' })}
            disabled={state.currentQuestionIndex === 0}
            className={`${btnSecondaryCustom} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full md:w-auto`}
          >
            Previous
          </button>
          <button 
            onClick={() => {
              if (isLastQuestion) {
                if (state.userAnswers[currentQuestion.id]) {
                  dispatch({ type: 'COMPLETE_QUIZ' });
                } else {
                  alert("Please submit your answer before finishing the quiz.");
                }
              } else {
                dispatch({ type: 'NEXT_QUESTION' });
              }
            }}
            disabled={isLastQuestion && !state.userAnswers[currentQuestion.id]}
            className={`${btnPrimaryCustom} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full md:w-auto`}
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            {/* Icon can be added here */}
            {!isLastQuestion && 
              <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" fill="currentColor"/>
              </svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizPage: React.FC<{ params: { quizId: string } }> = ({ params }) => {
  return (
    <QuizProvider>
      <QuizRunner quizId={params.quizId} />
    </QuizProvider>
  );
};

export default QuizPage; 
```

### app/quiz-test/[quizId]/client-page.tsx

```tsx
'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

// This is a client component that receives the quizId and optional questionType as props
interface ClientQuizPageProps {
  quizId: string;
  questionType?: string;
}

export default function ClientQuizPage({ quizId, questionType }: ClientQuizPageProps) {
  return (
    <QuizProvider>
      <QuizPage quizId={quizId} questionType={questionType} />
    </QuizProvider>
  );
}

```

### app/quiz-test/[quizId]/page-fixed.tsx

```tsx
'use client';

import React from 'react';
import { QuizProvider } from '../../features/quiz/context/QuizContext';
import QuizPage from '../../features/quiz/pages/QuizPage';

// Simple wrapper component that provides the QuizContext
const QuizTestPage: React.FC<{ params: { quizId: string } }> = ({ params }) => {
  return (
    <QuizProvider>
      <QuizPage quizId={params.quizId} />
    </QuizProvider>
  );
};

export default QuizTestPage;

```

### app/quiz-test/[quizId]/[questionType]/page.tsx

```tsx
import React from 'react';
import ClientQuizPage from '../client-page';

// This is a server component that properly handles async params in Next.js 15
export default async function QuizTestByTypePage({ params }: { params: { quizId: string, questionType: string } }) {
  // Using server component to access params properly
  const { quizId, questionType } = params;
  
  // Pass the quizId and questionType to the client component
  return <ClientQuizPage quizId={quizId} questionType={questionType} />;
}

```

### app/quiz-test/[quizId]/questions/page.tsx

```tsx
import React from 'react';
import Link from 'next/link';
import { fetchQuizById } from '../../../lib/supabaseQuizService';

export default async function QuestionTypesListPage({ params }: { params: { quizId: string } }) {
  const quizId = params.quizId;
  
  // Fetch the quiz data to get all available question types
  const quiz = await fetchQuizById(quizId);
  
  if (!quiz) {
    return (
      <div className="min-h-screen bg-custom-light-bg py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-custom-dark-blue mb-6">Quiz Not Found</h1>
          <p className="mb-6">The quiz you're looking for could not be found.</p>
          <Link href="/" className="text-custom-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  // Get unique question types from the quiz
  const questionTypes = Array.from(
    new Set(quiz.questions.map(question => question.type))
  );
  
  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-custom-dark-blue mb-6">{quiz.title}</h1>
        <p className="mb-6">Select a question type to practice:</p>
        
        <div className="mb-8">
          <Link 
            href={`/quiz-test/${quizId}`} 
            className="inline-block bg-custom-primary text-white px-4 py-2 rounded-lg mb-4 mr-4 hover:bg-custom-primary-dark transition"
          >
            All Questions ({quiz.questions.length})
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questionTypes.map(type => {
            const count = quiz.questions.filter(q => q.type === type).length;
            return (
              <Link 
                key={type} 
                href={`/quiz-test/${quizId}/questions/${type}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-custom-dark-blue mb-2">
                  {type.replace('_', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase())}
                </h3>
                <p className="text-gray-600">{count} questions</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

```

### app/quiz-test/[quizId]/questions/[type]/page.tsx

```tsx
import React from 'react';
import QuizTypeClientPage from '../../../type-client-page';

// This is a server component that properly handles async params in Next.js
export default async function QuizByTypeAndQuestionTypePage({ params }: { params: { quizId: string, type: string } }) {
  // Using server component to access params properly
  const { quizId, type } = params;
  
  // Pass the quizId and questionType to the client component
  return <QuizTypeClientPage quizId={quizId} questionType={type} />;
}

```

### app/data/quizzes/azure-a102/sample_multi_question.json

```json
{
  "questions": [
    {
      "id": "multi-select-01",
      "type": "multi",
      "question": "Which of the following are Azure Cognitive Services? (Select 2)",
      "points": 2,
      "quiz_tag": "azure-a102",
      "difficulty": "medium",
      "explanation": "Azure Cognitive Services include Language, Computer Vision, Speech, and Decision services. Azure Blob Storage is a storage service, Azure Virtual Network is a networking service, and Azure Kubernetes Service is a container orchestration service.",
      "feedback_correct": "Correct! You've identified the Azure Cognitive Services correctly.",
      "feedback_incorrect": "Not quite. Review the Azure Cognitive Services offerings.",
      "created_at": "2023-05-01T00:00:00Z",
      "updated_at": "2023-05-01T00:00:00Z",
      "options": [
        {
          "option_id": "A",
          "text": "Azure Blob Storage"
        },
        {
          "option_id": "B",
          "text": "Azure Language Service"
        },
        {
          "option_id": "C",
          "text": "Azure Kubernetes Service"
        },
        {
          "option_id": "D",
          "text": "Azure Computer Vision"
        },
        {
          "option_id": "E",
          "text": "Azure Virtual Network"
        }
      ],
      "correctAnswerOptionIds": ["B", "D"]
    }
  ]
}

```

### app/debug-components/page.tsx

```tsx
'use client';

import React, { useState } from 'react';
import SingleSelectionComponent from '../features/quiz/components/question-types/SingleSelectionComponent';
import MultiChoiceComponent from '../features/quiz/components/question-types/MultiChoiceComponent';
import { SingleSelectionQuestion, MultiChoiceQuestion } from '../types/quiz';

// Sample questions for debugging
const singleSelectionQuestion: SingleSelectionQuestion = {
  id: 'debug-single',
  type: 'single_selection',
  question: 'Which of the following is a JavaScript framework?',
  points: 1,
  quiz_tag: 'debug',
  difficulty: 'easy',
  explanation: 'React is a JavaScript library/framework for building user interfaces.',
  feedback_correct: 'Correct! React is a JavaScript framework.',
  feedback_incorrect: 'Incorrect. React is the JavaScript framework in this list.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  options: [
    { option_id: 'A', text: 'Python' },
    { option_id: 'B', text: 'React' },
    { option_id: 'C', text: 'Java' },
    { option_id: 'D', text: 'C#' }
  ],
  correctAnswerOptionId: 'B'
};

const multiChoiceQuestion: MultiChoiceQuestion = {
  id: 'debug-multi',
  type: 'multi',
  question: 'Which of the following are JavaScript frameworks/libraries? (Select all that apply)',
  points: 2,
  quiz_tag: 'debug',
  difficulty: 'medium',
  explanation: 'React, Angular, and Vue.js are all JavaScript frameworks/libraries.',
  feedback_correct: 'Correct! You identified all the JavaScript frameworks correctly.',
  feedback_incorrect: 'Incorrect. React, Angular, and Vue.js are the JavaScript frameworks in this list.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  options: [
    { option_id: 'A', text: 'React' },
    { option_id: 'B', text: 'Python' },
    { option_id: 'C', text: 'Angular' },
    { option_id: 'D', text: 'Vue.js' }
  ],
  correctAnswerOptionIds: ['A', 'C', 'D']
};

const DebugComponentsPage: React.FC = () => {
  const [singleSelectionAnswer, setSingleSelectionAnswer] = useState<string | undefined>();
  const [multiChoiceAnswers, setMultiChoiceAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  
  const resetAnswers = () => {
    setSingleSelectionAnswer(undefined);
    setMultiChoiceAnswers([]);
    setIsSubmitted(false);
    setShowCorrectAnswer(false);
  };
  
  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-custom-dark-blue">
          Question Components Debug Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-custom-primary">Control Panel</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              onClick={resetAnswers}
            >
              Reset Answers
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              onClick={() => setIsSubmitted(!isSubmitted)}
            >
              {isSubmitted ? 'Unsubmit Answers' : 'Submit Answers'}
            </button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded"
              onClick={() => setShowCorrectAnswer(!showCorrectAnswer)}
            >
              {showCorrectAnswer ? 'Hide Correct Answers' : 'Show Correct Answers'}
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Current State:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Single Selection Answer:</strong> {singleSelectionAnswer || 'None'}</p>
                <p><strong>Is Submitted:</strong> {isSubmitted ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p><strong>Multi Choice Answers:</strong> {multiChoiceAnswers.length ? multiChoiceAnswers.join(', ') : 'None'}</p>
                <p><strong>Show Correct Answer:</strong> {showCorrectAnswer ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-12">
          {/* Single Selection Component */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-custom-dark-blue border-b pb-2">
              Single Selection Component
            </h2>
            <div className="mb-4">
              <p className="font-medium text-lg">{singleSelectionQuestion.question}</p>
            </div>
            <SingleSelectionComponent 
              question={singleSelectionQuestion}
              onAnswerSelect={setSingleSelectionAnswer}
              selectedOptionId={singleSelectionAnswer}
              isSubmitted={isSubmitted}
              showCorrectAnswer={showCorrectAnswer}
            />
          </div>
          
          {/* Multi Choice Component */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-custom-dark-blue border-b pb-2">
              Multi Choice Component
            </h2>
            <div className="mb-4">
              <p className="font-medium text-lg">{multiChoiceQuestion.question}</p>
            </div>
            <MultiChoiceComponent 
              question={multiChoiceQuestion}
              onAnswerSelect={setMultiChoiceAnswers}
              selectedOptionIds={multiChoiceAnswers}
              isSubmitted={isSubmitted}
              showCorrectAnswer={showCorrectAnswer}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugComponentsPage;

```

### libs/gpt.ts

```typescript
import axios from 'axios';

// Use this if you want to make a call to OpenAI GPT-4 for instance. userId is used to identify the user on openAI side.
export const sendOpenAi = async (
  messages: any[], // TODO: type this
  userId: number,
  max = 100,
  temp = 1
) => {
  const url = 'https://api.openai.com/v1/chat/completions';

  console.log('Ask GPT >>>');
  messages.map((m) =>
    console.log(' - ' + m.role.toUpperCase() + ': ' + m.content)
  );

  const body = JSON.stringify({
    model: 'gpt-4',
    messages,
    max_tokens: max,
    temperature: temp,
    user: userId,
  });

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const res = await axios.post(url, body, options);

    const answer = res.data.choices[0].message.content;
    const usage = res?.data?.usage;

    console.log('>>> ' + answer);
    console.log(
      'TOKENS USED: ' +
        usage?.total_tokens +
        ' (prompt: ' +
        usage?.prompt_tokens +
        ' / response: ' +
        usage?.completion_tokens +
        ')'
    );
    console.log('\n');

    return answer;
  } catch (e) {
    console.error('GPT Error: ' + e?.response?.status, e?.response?.data);
    return null;
  }
};

```

### libs/stripe.ts

```typescript
import Stripe from "stripe";

interface CreateCheckoutParams {
  priceId: string;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  couponId?: string | null;
  clientReferenceId?: string;
  user?: {
    customerId?: string;
    email?: string;
  };
}

interface CreateCustomerPortalParams {
  customerId: string;
  returnUrl: string;
}

// This is used to create a Stripe Checkout for one-time payments. It's usually triggered with the <ButtonCheckout /> component. Webhooks are used to update the user's state in the database.
export const createCheckout = async ({
  user,
  mode,
  clientReferenceId,
  successUrl,
  cancelUrl,
  priceId,
  couponId,
}: CreateCheckoutParams): Promise<string> => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-08-16", // TODO: update this when Stripe updates their API
      typescript: true,
    });

    const extraParams: {
      customer?: string;
      customer_creation?: "always";
      customer_email?: string;
      invoice_creation?: { enabled: boolean };
      payment_intent_data?: { setup_future_usage: "on_session" };
      tax_id_collection?: { enabled: boolean };
    } = {};

    if (user?.customerId) {
      extraParams.customer = user.customerId;
    } else {
      if (mode === "payment") {
        extraParams.customer_creation = "always";
        // The option below costs 0.4% (up to $2) per invoice. Alternatively, you can use https://zenvoice.io/ to create unlimited invoices automatically.
        // extraParams.invoice_creation = { enabled: true };
        extraParams.payment_intent_data = { setup_future_usage: "on_session" };
      }
      if (user?.email) {
        extraParams.customer_email = user.email;
      }
      extraParams.tax_id_collection = { enabled: true };
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode,
      allow_promotion_codes: true,
      client_reference_id: clientReferenceId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      discounts: couponId
        ? [
            {
              coupon: couponId,
            },
          ]
        : [],
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...extraParams,
    });

    return stripeSession.url;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// This is used to create Customer Portal sessions, so users can manage their subscriptions (payment methods, cancel, etc..)
export const createCustomerPortal = async ({
  customerId,
  returnUrl,
}: CreateCustomerPortalParams): Promise<string> => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-08-16", // TODO: update this when Stripe updates their API
    typescript: true,
  });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return portalSession.url;
};

// This is used to get the uesr checkout session and populate the data so we get the planId the user subscribed to
export const findCheckoutSession = async (sessionId: string) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-08-16", // TODO: update this when Stripe updates their API
      typescript: true,
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    return session;
  } catch (e) {
    console.error(e);
    return null;
  }
};

```

### libs/mailgun.ts

```typescript
import config from "@/config";
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "dummy",
});

if (!process.env.MAILGUN_API_KEY && process.env.NODE_ENV === "development") {
  console.group("⚠️ MAILGUN_API_KEY missing from .env");
  console.error("It's not mandatory but it's required to send emails.");
  console.error("If you don't need it, remove the code from /libs/mailgun.js");
  console.groupEnd();
}

/**
 * Sends an email using the provided parameters.
 *
 * @async
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plain text content of the email.
 * @param {string} html - The HTML content of the email.
 * @param {string} replyTo - The email address to set as the "Reply-To" address.
 * @returns {Promise} A Promise that resolves when the email is sent.
 */
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}): Promise<any> => {
  const data = {
    from: config.mailgun.fromAdmin,
    to: [to],
    subject,
    text,
    html,
    ...(replyTo && { "h:Reply-To": replyTo }),
  };

  await mg.messages.create(
    (config.mailgun.subdomain ? `${config.mailgun.subdomain}.` : "") +
      config.domainName,
    data
  );
};

```

### libs/seo.tsx

```tsx
import type { Metadata } from "next";
import config from "@/config";

// These are all the SEO tags you can add to your pages.
// It prefills data with default title/description/OG, etc.. and you can cusotmize it for each page.
// It's already added in the root layout.js so you don't have to add it to every pages
// But I recommend to set the canonical URL for each page (export const metadata = getSEOTags({canonicalUrlRelative: "/"});)
// See https://shipfa.st/docs/features/seo
export const getSEOTags = ({
  title,
  description,
  keywords,
  openGraph,
  canonicalUrlRelative,
  extraTags,
}: Metadata & {
  canonicalUrlRelative?: string;
  extraTags?: Record<string, any>;
} = {}) => {
  return {
    // up to 50 characters (what does your app do for the user?) > your main should be here
    title: title || config.appName,
    // up to 160 characters (how does your app help the user?)
    description: description || config.appDescription,
    // some keywords separated by commas. by default it will be your app name
    keywords: keywords || [config.appName],
    applicationName: config.appName,
    // set a base URL prefix for other fields that require a fully qualified URL (.e.g og:image: og:image: 'https://yourdomain.com/share.png' => '/share.png')
    metadataBase: new URL(
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/"
        : `https://${config.domainName}/`
    ),

    openGraph: {
      title: openGraph?.title || config.appName,
      description: openGraph?.description || config.appDescription,
      url: openGraph?.url || `https://${config.domainName}/`,
      siteName: openGraph?.title || config.appName,
      // If you add an opengraph-image.(jpg|jpeg|png|gif) image to the /app folder, you don't need the code below
      // images: [
      //   {
      //     url: `https://${config.domainName}/share.png`,
      //     width: 1200,
      //     height: 660,
      //   },
      // ],
      locale: "en_US",
      type: "website",
    },

    twitter: {
      title: openGraph?.title || config.appName,
      description: openGraph?.description || config.appDescription,
      // If you add an twitter-image.(jpg|jpeg|png|gif) image to the /app folder, you don't need the code below
      // images: [openGraph?.image || defaults.og.image],
      card: "summary_large_image",
      creator: "@marc_louvion",
    },

    // If a canonical URL is given, we add it. The metadataBase will turn the relative URL into a fully qualified URL
    ...(canonicalUrlRelative && {
      alternates: { canonical: canonicalUrlRelative },
    }),

    // If you want to add extra tags, you can pass them here
    ...extraTags,
  };
};

// Strctured Data for Rich Results on Google. Learn more: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
// Find your type here (SoftwareApp, Book...): https://developers.google.com/search/docs/appearance/structured-data/search-gallery
// Use this tool to check data is well structure: https://search.google.com/test/rich-results
// You don't have to use this component, but it increase your chances of having a rich snippet on Google.
// I recommend this one below to your /page.js for software apps: It tells Google your AppName is a Software, and it has a rating of 4.8/5 from 12 reviews.
// Fill the fields with your own data
// See https://shipfa.st/docs/features/seo
export const renderSchemaTags = () => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "http://schema.org",
          "@type": "SoftwareApplication",
          name: config.appName,
          description: config.appDescription,
          image: `https://${config.domainName}/icon.png`,
          url: `https://${config.domainName}/`,
          author: {
            "@type": "Person",
            name: "Marc Lou",
          },
          datePublished: "2023-08-01",
          applicationCategory: "EducationalApplication",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "12",
          },
          offers: [
            {
              "@type": "Offer",
              price: "9.00",
              priceCurrency: "USD",
            },
          ],
        }),
      }}
    ></script>
  );
};

```

### libs/api.ts

```typescript
import axios from "axios";
import { toast } from "react-hot-toast";
import { redirect } from "next/navigation";
import config from "@/config";

// use this to interact with our own API (/app/api folder) from the front-end side
// See https://shipfa.st/docs/tutorials/api-call
const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    let message = "";

    if (error.response?.status === 401) {
      // User not auth, ask to re login
      toast.error("Please login");
      // Sends the user to the login page
      redirect(config.auth.loginUrl);
    } else if (error.response?.status === 403) {
      // User not authorized, must subscribe/purchase/pick a plan
      message = "Pick a plan to use this feature";
    } else {
      message =
        error?.response?.data?.error || error.message || error.toString();
    }

    error.message =
      typeof message === "string" ? message : JSON.stringify(message);

    console.error(error.message);

    // Automatically display errors to the user
    if (error.message) {
      toast.error(error.message);
    } else {
      toast.error("something went wrong...");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

```

### components/LayoutClient.tsx

```tsx
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Crisp } from "crisp-sdk-web";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import config from "@/config";

// Crisp customer chat support:
// This component is separated from ClientLayout because it needs to be wrapped with <SessionProvider> to use useSession() hook
const CrispChat = (): null => {
  const pathname = usePathname();

  const supabase = createClientComponentClient();
  const [data, setData] = useState(null);

  // This is used to get the user data from Supabase Auth (if logged in) => user ID is used to identify users in Crisp
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setData(session.user);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (config?.crisp?.id) {
      // Set up Crisp
      Crisp.configure(config.crisp.id);

      // (Optional) If onlyShowOnRoutes array is not empty in config.js file, Crisp will be hidden on the routes in the array.
      // Use <AppButtonSupport> instead to show it (user clicks on the button to show Crisp—it cleans the UI)
      if (
        config.crisp.onlyShowOnRoutes &&
        !config.crisp.onlyShowOnRoutes?.includes(pathname)
      ) {
        Crisp.chat.hide();
        Crisp.chat.onChatClosed(() => {
          Crisp.chat.hide();
        });
      }
    }
  }, [pathname]);

  // Add User Unique ID to Crisp to easily identify users when reaching support (optional)
  useEffect(() => {
    if (data?.user && config?.crisp?.id) {
      Crisp.session.setData({ userId: data.user?.id });
    }
  }, [data]);

  return null;
};

// All the client wrappers are here (they can't be in server components)
// 1. NextTopLoader: Show a progress bar at the top when navigating between pages
// 2. Toaster: Show Success/Error messages anywhere from the app with toast()
// 3. Tooltip: Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content=""
// 4. CrispChat: Set Crisp customer chat support (see above)
const ClientLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {/* Content inside app/page.js files  */}
      {children}

      {/* Show Success/Error messages anywhere from the app with toast() */}
      <Toaster
        toastOptions={{
          duration: 3000,
        }}
      />

      {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
      <Tooltip
        id="tooltip"
        className="z-[60] !opacity-100 max-w-sm shadow-lg"
      />

      {/* Set Crisp customer chat support */}
      <CrispChat />
    </>
  );
};

export default ClientLayout;

```

### components/ButtonLead.tsx

```tsx
"use client";

import React, { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";

// This component is used to collect the emails from the landing page
// You'd use this if your product isn't ready yet or you want to collect leads
// For instance: A popup to send a freebie, joining a waitlist, etc.
// It calls the /api/lead/route.js route and store a Lead document in the database
const ButtonLead = ({ extraStyle }: { extraStyle?: string }) => {
  const inputRef = useRef(null);
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    setIsLoading(true);
    try {
      await apiClient.post("/lead", { email });

      toast.success("Thanks for joining the waitlist!");

      // just remove the focus on the input
      inputRef.current.blur();
      setEmail("");
      setIsDisabled(true);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form
      className={`w-full max-w-xs space-y-3 ${extraStyle ? extraStyle : ""}`}
      onSubmit={handleSubmit}
    >
      <input
        required
        type="email"
        value={email}
        ref={inputRef}
        autoComplete="email"
        placeholder="tom@cruise.com"
        className="input input-bordered w-full placeholder:opacity-60"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        className="btn btn-primary btn-block"
        type="submit"
        disabled={isDisabled}
      >
        Join waitlist
        {isLoading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    </form>
  );
};

export default ButtonLead;

```

### components/ButtonAccount.tsx

```tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Popover, Transition } from "@headlessui/react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import apiClient from "@/libs/api";

// A button to show user some account actions
//  1. Billing: open a Stripe Customer Portal to manage their billing (cancel subscription, update payment method, etc.).
//     You have to manually activate the Customer Portal in your Stripe Dashboard (https://dashboard.stripe.com/test/settings/billing/portal)
//     This is only available if the customer has a customerId (they made a purchase previously)
//  2. Logout: sign out and go back to homepage
// See more at https://shipfa.st/docs/components/buttonAccount
const ButtonAccount = () => {
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      setUser(data.user);
    };

    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleBilling = async () => {
    setIsLoading(true);

    try {
      const { url }: { url: string } = await apiClient.post(
        "/stripe/create-portal",
        {
          returnUrl: window.location.href,
        }
      );

      window.location.href = url;
    } catch (e) {
      console.error(e);
    }

    setIsLoading(false);
  };

  return (
    <Popover className="relative z-10">
      {({ open }) => (
        <>
          <Popover.Button className="btn">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user?.user_metadata?.avatar_url}
                alt={"Profile picture"}
                className="w-6 h-6 rounded-full shrink-0"
                referrerPolicy="no-referrer"
                width={24}
                height={24}
              />
            ) : (
              <span className="w-8 h-8 bg-base-100 flex justify-center items-center rounded-full shrink-0 capitalize">
                {user?.email?.charAt(0)}
              </span>
            )}

            {user?.user_metadata?.name ||
              user?.email?.split("@")[0] ||
              "Account"}

            {isLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-5 h-5 duration-200 opacity-50 ${
                  open ? "transform rotate-180 " : ""
                }`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </Popover.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Popover.Panel className="absolute left-0 z-10 mt-3 w-screen max-w-[16rem] transform">
              <div className="overflow-hidden rounded-xl shadow-xl ring-1 ring-base-content ring-opacity-5 bg-base-100 p-1">
                <div className="space-y-0.5 text-sm">
                  <button
                    className="flex items-center gap-2 hover:bg-base-300 duration-200 py-1.5 px-4 w-full rounded-lg font-medium"
                    onClick={handleBilling}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Billing
                  </button>
                  <button
                    className="flex items-center gap-2 hover:bg-error/20 hover:text-error duration-200 py-1.5 px-4 w-full rounded-lg font-medium"
                    onClick={handleSignOut}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export default ButtonAccount;

```

### components/Hero.tsx

```tsx
import Image from "next/image";
import TestimonialsAvatars from "./TestimonialsAvatars";
import config from "@/config";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        <a
          href="https://www.producthunt.com/posts/shipfast-2?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-shipfast&#0045;2"
          target="_blank"
          className=" -mb-4 md:-mb-6 group"
          title="Product Hunt link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 122 37"
            className="w-32 md:w-36 fill-base-content/80 group-hover:fill-base-content"
          >
            <path d="M104.953 36.286c-4.22 1.634-5.936.086-5.936-.891 1.495-.126 5.067-.331 5.936.891Zm5.356-1.336a5.486 5.486 0 0 1-7.083-.497c1.44-.4 5.372-.874 7.083.497Zm-7.139-3.176c.16 2.033-1.922 3.176-4.17 3.341.41-2.045 2.509-2.958 4.17-3.341Zm4.032-1.874c.238.869-.089 3.228-3.323 4.164.139-1.593.986-3.667 3.323-4.164Zm6.413 2.365a5.005 5.005 0 0 1-6.385.571c1.296-.668 4.408-1.57 6.385-.571Zm-3.417-4.706c.443.856.537 3.295-2.326 4.763-.166-1.57.465-4.255 2.326-4.763Zm7.083.948a4.389 4.389 0 0 1-2.657 2.217 4.243 4.243 0 0 1-3.39-.44c1.805-1.697 4.685-2.348 6.047-1.777Zm-4.28-4.547c1.284 2.24-.073 4.798-1.485 5.849-.628-2.082-.052-4.351 1.484-5.849Zm6.662-.097c.155 3.479-3.478 3.29-5.184 3.313.537-.731 3.522-3.381 5.184-3.313Zm-4.48-3.25c.675.743 1.688 3.599-.555 5.929-.703-1.685-.858-4.272.554-5.929Zm6.385-1.542c.116 2.81-2.249 4.232-4.53 4.21.686-1.354 2.52-3.964 4.53-4.21Zm-4.785-1.936c1.512.89 1.34 3.764.448 5.26-1.002-1.393-1.75-3.124-.448-5.26Zm4.884-2.633c.748 2.559-1.45 4.29-2.769 4.438.338-1.222.781-3.387 2.77-4.438Zm-4.607-.851c1.667.835 2.457 2.832 1.833 4.632-1.163-.937-2.564-2.919-1.833-4.632Zm4.685-3.096c1.03 3.113-1.335 4.13-2.215 4.38.105-1.324.947-3.963 2.215-4.38Zm-4.619-.817c.676.195 2.603 1.777 2.254 4.61-1.268-.714-2.808-2.074-2.254-4.61Zm3.921-3.9c1.152 3.826-.77 5.397-1.401 5.71-.1-1.21-.222-4.037 1.401-5.71Zm-4.264.096c1.207.337 2.73 2.553 2.658 4.684-1.196-.548-2.985-2.827-2.658-4.684Zm.36-5.934c2.802 2.896 3.195 5.18 2.376 7.996-1.269-1.142-2.282-4.569-2.376-7.996ZM17.047 36.286c4.22 1.634 5.936.086 5.936-.891-1.495-.126-5.067-.331-5.936.891ZM11.69 34.95a5.486 5.486 0 0 0 7.083-.497c-1.44-.4-5.372-.874-7.083.497Zm7.139-3.176c-.16 2.033 1.922 3.176 4.17 3.341-.41-2.045-2.509-2.958-4.17-3.341ZM14.798 29.9c-.238.869.089 3.228 3.323 4.164-.139-1.593-.986-3.667-3.323-4.164Zm-6.413 2.365a5.005 5.005 0 0 0 6.385.571c-1.296-.668-4.408-1.57-6.385-.571Zm3.417-4.706c-.443.856-.537 3.295 2.326 4.763.166-1.57-.465-4.255-2.326-4.763Zm-7.083.948a4.389 4.389 0 0 0 2.657 2.217 4.243 4.243 0 0 0 3.39-.44c-1.805-1.697-4.685-2.348-6.047-1.777Zm4.28-4.547c-1.284 2.24.073 4.798 1.485 5.849.628-2.082.052-4.351-1.484-5.849Zm-6.662-.097c-.155 3.479 3.478 3.29 5.184 3.313-.537-.731-3.522-3.381-5.184-3.313Zm4.48-3.25c-.675.743-1.688 3.599.555 5.929.703-1.685.858-4.272-.554-5.929ZM.433 19.071c-.116 2.81 2.249 4.232 4.53 4.21-.686-1.354-2.52-3.964-4.53-4.21Zm4.785-1.936c-1.512.89-1.34 3.764-.448 5.26 1.002-1.393 1.75-3.124.448-5.26ZM.333 14.502c-.748 2.559 1.45 4.29 2.769 4.438-.338-1.222-.781-3.387-2.77-4.438Zm4.607-.851c-1.667.835-2.457 2.832-1.833 4.632 1.163-.937 2.564-2.919 1.833-4.632ZM.255 10.555c-1.03 3.113 1.335 4.13 2.215 4.38-.105-1.324-.947-3.963-2.215-4.38Zm4.619-.817c-.676.195-2.603 1.777-2.254 4.61 1.268-.714 2.808-2.074 2.254-4.61Zm-3.921-3.9c-1.152 3.826.77 5.397 1.401 5.71.1-1.21.222-4.037-1.401-5.71Zm4.264.096c-1.207.337-2.73 2.553-2.658 4.684 1.196-.548 2.985-2.827 2.658-4.684ZM4.857 0C2.055 2.896 1.662 5.18 2.481 7.996 3.75 6.854 4.763 3.427 4.857 0Zm47.017 35.234c2.394 0 4.302-1.476 4.302-3.762 0-1.71-1.062-2.7-2.16-3.15.864-.378 1.728-1.26 1.728-2.7 0-2.142-1.818-3.366-3.834-3.366-1.656 0-2.952.81-3.636 1.89a.285.285 0 0 0 .072.396l1.26 1.224c.144.144.306.162.414-.036.324-.576.9-.954 1.602-.954.81 0 1.44.54 1.44 1.332 0 .612-.36 1.296-1.386 1.296h-.486c-.18 0-.306.09-.306.288v1.638c0 .18.126.288.306.288h.504c1.26 0 1.692.846 1.692 1.53 0 .81-.576 1.566-1.692 1.566-.828 0-1.404-.45-1.89-1.026-.144-.144-.288-.144-.396-.036l-1.35 1.242a.258.258 0 0 0-.054.378c.684 1.08 1.998 1.962 3.87 1.962ZM60.208 35c.162 0 .288-.108.288-.27v-4.248c0-1.314.684-2.034 1.818-2.034.27 0 .468.036.648.09.252.054.378 0 .378-.234v-1.746c0-.162-.036-.27-.162-.36-.144-.108-.378-.234-.81-.234-1.026 0-1.584.72-1.872 1.674l-.09-1.17c0-.216-.108-.288-.27-.288h-2.124c-.162 0-.27.108-.27.27v8.28c0 .162.108.27.27.27h2.196Zm8.1.216c1.26 0 2.16-.504 2.754-1.35l.036.864c0 .162.126.27.288.27h1.98c.162 0 .306-.108.306-.27V22.4c0-.162-.126-.27-.288-.27H71.17c-.162 0-.27.108-.27.27v4.662c-.594-.702-1.44-1.098-2.592-1.098-2.448 0-4.14 2.016-4.14 4.626 0 2.628 1.692 4.626 4.14 4.626Zm.594-2.502c-1.17 0-2.052-.828-2.052-2.124 0-1.278.882-2.124 2.052-2.124 1.206 0 2.034.846 2.034 2.106 0 1.296-.828 2.142-2.034 2.142ZM20.72 15c.09 0 .15-.06.15-.15v-2.26h.72c1.69 0 2.49-.93 2.49-2.29 0-1.36-.8-2.3-2.49-2.3h-2.15c-.09 0-.15.06-.15.15v6.7c0 .09.06.15.15.15h1.28Zm.15-5.6h.68c.53 0 1.02.17 1.02.9 0 .72-.49.89-1.02.89h-.68V9.4Zm5.5 5.6c.09 0 .16-.06.16-.15v-2.36c0-.73.38-1.13 1.01-1.13.15 0 .26.02.36.05.14.03.21 0 .21-.13v-.97c0-.09-.02-.15-.09-.2-.08-.06-.21-.13-.45-.13-.57 0-.88.4-1.04.93l-.05-.65c0-.12-.06-.16-.15-.16h-1.18c-.09 0-.15.06-.15.15v4.6c0 .09.06.15.15.15h1.22Zm4.77.12c1.48 0 2.58-1.12 2.58-2.57 0-1.45-1.1-2.57-2.58-2.57s-2.57 1.12-2.57 2.57c0 1.45 1.09 2.57 2.57 2.57Zm0-1.4c-.62 0-1.1-.45-1.1-1.17s.48-1.17 1.1-1.17c.62 0 1.1.45 1.1 1.17s-.48 1.17-1.1 1.17Zm5.49 1.4c.7 0 1.2-.28 1.53-.75l.02.48c0 .09.07.15.16.15h1.1c.09 0 .17-.06.17-.15V8c0-.09-.07-.15-.16-.15h-1.23c-.09 0-.15.06-.15.15v2.59c-.33-.39-.8-.61-1.44-.61-1.36 0-2.3 1.12-2.3 2.57 0 1.46.94 2.57 2.3 2.57Zm.33-1.39c-.65 0-1.14-.46-1.14-1.18 0-.71.49-1.18 1.14-1.18.67 0 1.13.47 1.13 1.17 0 .72-.46 1.19-1.13 1.19Zm5.52 1.39c.71 0 1.16-.35 1.44-.85l.04.57c0 .12.07.16.16.16h1.17c.09 0 .16-.06.16-.15v-4.6c0-.09-.07-.15-.16-.15h-1.21c-.09 0-.16.06-.16.15v2.48c0 .65-.33.99-.85.99-.54 0-.82-.34-.82-.99v-2.48c0-.09-.07-.15-.16-.15h-1.22c-.09 0-.15.06-.15.15v2.84c0 1.28.74 2.03 1.76 2.03Zm6.44 0c.79 0 1.45-.35 1.87-.9.06-.07.05-.15-.01-.21l-.69-.66c-.08-.08-.19-.08-.26-.01-.27.25-.53.38-.86.38-.74 0-1.18-.56-1.18-1.2 0-.63.44-1.14 1.16-1.14.34 0 .6.12.86.38.08.07.19.07.27-.01l.69-.66c.06-.06.07-.15.01-.21-.42-.55-1.08-.9-1.9-.9-1.48 0-2.56 1.1-2.56 2.54 0 1.47 1.1 2.6 2.6 2.6Zm4.77 0c.34 0 .88-.06.88-.31v-.83c0-.1-.08-.15-.18-.14-.13.01-.22.01-.31.01-.25 0-.42-.14-.42-.41v-2.16h.75c.09 0 .15-.06.15-.15v-.88c0-.09-.06-.15-.15-.15h-.75V8.95c0-.09-.07-.15-.16-.15h-1.23c-.09 0-.16.06-.16.15v1.15h-.61c-.09 0-.15.06-.15.15v.88c0 .09.06.15.15.15h.61v2.33c0 1.14.77 1.51 1.58 1.51Zm5.95 0c1.48 0 2.58-1.12 2.58-2.57 0-1.45-1.1-2.57-2.58-2.57s-2.57 1.12-2.57 2.57c0 1.45 1.09 2.57 2.57 2.57Zm0-1.4c-.62 0-1.1-.45-1.1-1.17s.48-1.17 1.1-1.17c.62 0 1.1.45 1.1 1.17s-.48 1.17-1.1 1.17ZM64.79 15c.09 0 .16-.06.16-.15v-3.57h.98c.09 0 .15-.06.15-.15v-.88c0-.09-.06-.15-.15-.15h-.98v-.49c0-.33.11-.57.58-.57.11 0 .25.03.42.06.07.01.13 0 .13-.07V8.02c0-.06-.03-.13-.09-.16-.3-.15-.52-.17-.82-.17-1.09 0-1.76.52-1.76 1.72v.69h-.58c-.09 0-.15.06-.15.15v.88c0 .09.06.15.15.15h.58v3.57c0 .09.06.15.15.15h1.23Zm6.08.12c.34 0 .88-.06.88-.31v-.83c0-.1-.08-.15-.18-.14-.13.01-.22.01-.31.01-.25 0-.42-.14-.42-.41v-2.16h.75c.09 0 .15-.06.15-.15v-.88c0-.09-.06-.15-.15-.15h-.75V8.95c0-.09-.07-.15-.16-.15h-1.23c-.09 0-.16.06-.16.15v1.15h-.61c-.09 0-.15.06-.15.15v.88c0 .09.06.15.15.15h.61v2.33c0 1.14.77 1.51 1.58 1.51Zm4.65-5.14c-.7 0-1.15.35-1.43.85V8c0-.09-.07-.15-.16-.15h-1.22c-.09 0-.15.06-.15.15v6.85c0 .09.06.15.15.15h1.22c.09 0 .16-.06.16-.15v-2.48c0-.65.32-.99.85-.99.54 0 .82.34.82.99v2.48c0 .09.07.15.16.15h1.21c.09 0 .16-.06.16-.15v-2.84c0-1.28-.75-2.03-1.77-2.03Zm5.34 5.14c.69 0 1.32-.2 1.74-.62.09-.08.09-.16.05-.22l-.41-.58c-.06-.07-.1-.09-.18-.05-.41.23-.75.27-1.08.27-.7 0-1.16-.26-1.33-.79h2.82c.45 0 .58-.3.58-.8 0-1.26-.87-2.35-2.37-2.35-1.51 0-2.52 1.11-2.52 2.55 0 1.49 1.09 2.59 2.7 2.59Zm-1.23-3.05c.12-.58.55-.83 1.06-.83s.9.24 1 .83h-2.06Zm8.27 3.05c.7 0 1.2-.28 1.53-.75l.02.48c0 .09.07.15.16.15h1.1c.09 0 .17-.06.17-.15V8c0-.09-.07-.15-.16-.15h-1.23c-.09 0-.15.06-.15.15v2.59c-.33-.39-.8-.61-1.44-.61-1.36 0-2.3 1.12-2.3 2.57 0 1.46.94 2.57 2.3 2.57Zm.33-1.39c-.65 0-1.14-.46-1.14-1.18 0-.71.49-1.18 1.14-1.18.67 0 1.13.47 1.13 1.17 0 .72-.46 1.19-1.13 1.19Zm5.81 1.39c.7 0 1.2-.28 1.53-.75l.02.48c0 .09.07.15.16.15h1.1c.09 0 .17-.06.17-.15v-4.6c0-.09-.07-.15-.16-.15h-1.11c-.09 0-.16.06-.16.15l-.02.47c-.32-.46-.81-.74-1.53-.74-1.36 0-2.3 1.12-2.3 2.57 0 1.46.94 2.57 2.3 2.57Zm.33-1.39c-.65 0-1.14-.46-1.14-1.18 0-.71.49-1.18 1.14-1.18.67 0 1.13.47 1.13 1.17 0 .72-.46 1.19-1.13 1.19Zm5.96 3.17c.08 0 .15-.04.18-.12l2.6-6.51c.04-.11-.02-.17-.13-.17h-1.24c-.08 0-.16.04-.19.12l-1.08 3-1.08-3c-.03-.08-.11-.12-.19-.12h-1.24c-.11 0-.17.06-.13.17l1.9 4.74-.72 1.71c-.05.12.01.18.13.18h1.19Z"></path>
          </svg>
        </a>

        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4">
          Ship your startup in days, not weeks
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          The NextJS boilerplate with all you need to build your SaaS, AI tool,
          or any other web app. From idea to production in 5 minutes.
        </p>
        <button className="btn btn-primary btn-wide">
          Get {config.appName}
        </button>

        <TestimonialsAvatars priority={true} />
      </div>
      <div className="lg:w-full">
        <Image
          src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80"
          alt="Product Demo"
          className="w-full"
          priority={true}
          width={500}
          height={500}
        />
      </div>
    </section>
  );
};

export default Hero;

```

### components/ButtonSignin.tsx

```tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import config from "@/config";

// A simple button to sign in with our providers (Google & Magic Links).
// It automatically redirects user to callbackUrl (config.auth.callbackUrl) after login, which is normally a private page for users to manage their accounts.
// If the user is already logged in, it will show their profile picture & redirect them to callbackUrl immediately.
const ButtonSignin = ({
  text = "Get started",
  extraStyle,
}: {
  text?: string;
  extraStyle?: string;
}) => {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      setUser(data.user);
    };

    getUser();
  }, [supabase]);

  if (user) {
    return (
      <Link
        href={config.auth.callbackUrl}
        className={`btn ${extraStyle ? extraStyle : ""}`}
      >
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user?.user_metadata?.avatar_url}
            alt={user?.user_metadata?.name || "Account"}
            className="w-6 h-6 rounded-full shrink-0"
            referrerPolicy="no-referrer"
            width={24}
            height={24}
          />
        ) : (
          <span className="w-6 h-6 bg-base-300 flex justify-center items-center rounded-full shrink-0">
            {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0)}
          </span>
        )}
        {user?.user_metadata?.name || user?.email || "Account"}
      </Link>
    );
  }

  return (
    <Link
      className={`btn ${extraStyle ? extraStyle : ""}`}
      href={config.auth.loginUrl}
    >
      {text}
    </Link>
  );
};

export default ButtonSignin;

```

### components/Pricing.tsx

```tsx
import config from "@/config";
import ButtonCheckout from "./ButtonCheckout";

// <Pricing/> displays the pricing plans for your app
// It's your Stripe config in config.js.stripe.plans[] that will be used to display the plans
// <ButtonCheckout /> renders a button that will redirect the user to Stripe checkout called the /api/stripe/create-checkout API endpoint with the correct priceId

const Pricing = () => {
  return (
    <section className="bg-base-200 overflow-hidden" id="pricing">
      <div className="py-24 px-8 max-w-5xl mx-auto">
        <div className="flex flex-col text-center w-full mb-20">
          <p className="font-medium text-primary mb-8">Pricing</p>
          <h2 className="font-bold text-3xl lg:text-5xl tracking-tight">
            Save hours of repetitive code and ship faster!
          </h2>
        </div>

        <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8">
          {config.stripe.plans.map((plan) => (
            <div key={plan.priceId} className="relative w-full max-w-lg">
              {plan.isFeatured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <span
                    className={`badge text-xs text-primary-content font-semibold border-0 bg-primary`}
                  >
                    POPULAR
                  </span>
                </div>
              )}

              {plan.isFeatured && (
                <div
                  className={`absolute -inset-[1px] rounded-[9px] bg-primary z-10`}
                ></div>
              )}

              <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-base-100 p-8 rounded-lg">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-lg lg:text-xl font-bold">{plan.name}</p>
                    {plan.description && (
                      <p className="text-base-content/80 mt-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {plan.priceAnchor && (
                    <div className="flex flex-col justify-end mb-[4px] text-lg ">
                      <p className="relative">
                        <span className="absolute bg-base-content h-[1.5px] inset-x-0 top-[53%]"></span>
                        <span className="text-base-content/80">
                          ${plan.priceAnchor}
                        </span>
                      </p>
                    </div>
                  )}
                  <p className={`text-5xl tracking-tight font-extrabold`}>
                    ${plan.price}
                  </p>
                  <div className="flex flex-col justify-end mb-[4px]">
                    <p className="text-xs text-base-content/60 uppercase font-semibold">
                      USD
                    </p>
                  </div>
                </div>
                {plan.features && (
                  <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-[18px] h-[18px] opacity-80 shrink-0"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>

                        <span>{feature.name} </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <ButtonCheckout priceId={plan.priceId} />

                  <p className="flex items-center justify-center gap-2 text-sm text-center text-base-content/80 font-medium relative">
                    Pay once. Access forever.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

```

### components/FeaturesListicle.tsx

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { JSX } from "react";

// List of features to display:
// - name: name of the feature
// - description: description of the feature (can be any JSX)
// - svg: icon of the feature
const features: {
  name: string;
  description: JSX.Element;
  svg: JSX.Element;
}[] = [
  {
    name: "Emails",
    description: (
      <>
        <ul className="space-y-1">
          {[
            "Send transactional emails",
            "DNS setup to avoid spam folder (DKIM, DMARC, SPF in subdomain)",
            "Webhook to receive & forward emails",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-[18px] h-[18px] inline shrink-0 opacity-80"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>

              {item}
            </li>
          ))}
          <li className="flex items-center gap-3 text-accent font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-[18px] h-[18px] inline shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Time saved: 2 hours
          </li>
        </ul>
      </>
    ),
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
        />
      </svg>
    ),
  },
  {
    name: "Payments",
    description: (
      <>
        <ul className="space-y-2">
          {[
            "Create checkout sessions",
            "Handle webhooks to update user's account",
            "Tips to setup your account & reduce chargebacks",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-[18px] h-[18px] inline shrink-0 opacity-80"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>

              {item}
            </li>
          ))}
          <li className="flex items-center gap-3 text-accent font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-[18px] h-[18px] inline shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Time saved: 2 hours
          </li>
        </ul>
      </>
    ),
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
    ),
  },
  {
    name: "Login",
    description: (
      <>
        <ul className="space-y-2">
          {[
            "Magic links setup",
            "Login with Google walkthrough",
            "Save user data in MongoDB",
            "Private/protected pages & API calls",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-[18px] h-[18px] inline shrink-0 opacity-80"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>

              {item}
            </li>
          ))}
          <li className="flex items-center gap-3 text-accent font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-[18px] h-[18px] inline shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Time saved: 3 hours
          </li>
        </ul>
      </>
    ),
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    name: "Database",
    description: (
      <>
        <ul className="space-y-2">
          {["Mongoose schema", "Mongoose plugins to make your life easier"].map(
            (item) => (
              <li key={item} className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-[18px] h-[18px] inline shrink-0 opacity-80"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>

                {item}
              </li>
            )
          )}
          <li className="flex items-center gap-3 text-accent font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-[18px] h-[18px] inline shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Time saved: 2 hours
          </li>
        </ul>
      </>
    ),
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
        />
      </svg>
    ),
  },
  {
    name: "SEO",
    description: (
      <>
        <ul className="space-y-2">
          {[
            "All meta tags to rank on Google",
            "OpenGraph tags to share on social media",
            "Automated sitemap generation to fasten Google indexing",
            "Structured data markup for Rich Snippets",
            "SEO-optimized UI components",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-[18px] h-[18px] inline shrink-0 opacity-80"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>

              {item}
            </li>
          ))}
          <li className="flex items-center gap-3 text-accent font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-[18px] h-[18px] inline shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Time saved: 6 hours
          </li>
        </ul>
      </>
    ),
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
  {
    name: "Style",
    description: (
      <>
        <ul className="space-y-2">
          {[
            "Components, animations & sections (like the pricing page below)",
            "20+ themes with daisyUI",
            "Automatic dark mode",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-[18px] h-[18px] inline shrink-0 opacity-80"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>

              {item}
            </li>
          ))}
          <li className="flex items-center gap-3 text-accent font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-[18px] h-[18px] inline shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Time saved: 5 hours
          </li>
        </ul>
      </>
    ),
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
        />
      </svg>
    ),
  },
];

// A list of features with a listicle style.
// - Click on a feature to display its description.
// - Good to use when multiples features are available.
// - Autoscroll the list of features (optional).
const FeaturesListicle = () => {
  const featuresEndRef = useRef<null>(null);
  const [featureSelected, setFeatureSelected] = useState<string>(
    features[0].name
  );
  const [hasClicked, setHasClicked] = useState<boolean>(false);

  // (Optional) Autoscroll the list of features so user know it's interactive.
  // Stop scrolling when user scroll after the featuresEndRef element (end of section)
  // emove useEffect is not needed.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasClicked) {
        const index = features.findIndex(
          (feature) => feature.name === featureSelected
        );
        const nextIndex = (index + 1) % features.length;
        setFeatureSelected(features[nextIndex].name);
      }
    }, 5000);

    try {
      // stop the interval when the user scroll after the featuresRef element
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            console.log("STOP AUTO CHANGE");
            clearInterval(interval);
          }
        },
        {
          root: null,
          rootMargin: "0px",
          threshold: 0.5,
        }
      );
      if (featuresEndRef.current) {
        observer.observe(featuresEndRef.current);
      }
    } catch (e) {
      console.error(e);
    }

    return () => clearInterval(interval);
  }, [featureSelected, hasClicked]);

  return (
    <section className="py-24" id="features">
      <div className="max-w-3xl mx-auto">
        <div className="bg-base-100 max-md:px-8 max-w-3xl">
          <p className="text-accent font-medium text-sm font-mono mb-3">
            {/* Pure decoration, you can remove it */}
            const launch_time = &quot;Today&quot;;
          </p>
          <h2 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-8">
            {/* 💡 COPY TIP: Remind visitors about the value of your product. Why do they need it? */}
            Supercharge your app instantly, launch faster, make $
          </h2>
          <div className="text-base-content/80 leading-relaxed mb-8 lg:text-lg">
            {/* 💡 COPY TIP: Explain how your product delivers what you promise in the headline. */}
            Login users, process payments and send emails at lightspeed. Spend
            your time building your startup, not integrating APIs. ShipFast
            provides you with the boilerplate code you need to launch, FAST.
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-4 md:flex justify-start gap-4 md:gap-12 max-md:px-8 max-w-3xl mx-auto mb-8">
          {features.map((feature) => (
            <span
              key={feature.name}
              onClick={() => {
                if (!hasClicked) setHasClicked(true);
                setFeatureSelected(feature.name);
              }}
              className={`flex flex-col items-center justify-center gap-3 select-none cursor-pointer p-2 duration-200 group`}
            >
              <span
                className={`duration-100 ${
                  featureSelected === feature.name
                    ? "text-primary"
                    : "text-base-content/30 group-hover:text-base-content/50"
                }`}
              >
                {feature.svg}
              </span>
              <span
                className={`font-semibold text-sm ${
                  featureSelected === feature.name
                    ? "text-primary"
                    : "text-base-content/50"
                }`}
              >
                {feature.name}
              </span>
            </span>
          ))}
        </div>
        <div className="bg-base-200">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-center md:justify-start md:items-center gap-12">
            <div
              className="text-base-content/80 leading-relaxed space-y-4 px-12 md:px-0 py-12 max-w-xl animate-opacity"
              key={featureSelected}
            >
              <h3 className="font-semibold text-base-content text-lg">
                {features.find((f) => f.name === featureSelected)["name"]}
              </h3>

              {features.find((f) => f.name === featureSelected)["description"]}
            </div>
          </div>
        </div>
      </div>
      {/* Just used to know it's the end of the autoscroll feature (optional, see useEffect) */}
      <p className="opacity-0" ref={featuresEndRef}></p>
    </section>
  );
};

export default FeaturesListicle;

```

### components/TestimonialRating.tsx

```tsx
const TestimonialRating = () => {
  return (
    <div className="flex -gap-1 items-center mt-auto">
      <svg
        viewBox="0 0 773 1262"
        className="w-8 fill-base-content/40 rotate-12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M390 5.7334C310.667 41.7334 272.533 76.6667 257.867 126.8C255.6 134.8 254.933 141.333 254.4 161.6C253.733 185.2 253.867 186.8 256.533 191.067C258 193.467 260.8 196.267 262.667 197.067C275.2 202.8 307.333 193.6 329.333 178C339.467 170.8 355.733 153.867 363.067 142.667C370 132.133 380.4 110.933 385.333 97.3334C391.867 78.8001 398.267 52.0001 398.667 40.8001C398.933 34.8001 400.4 23.7334 401.867 16.0001C405.067 0.133402 405.067 6.88146e-05 403.733 6.88146e-05C403.067 6.88146e-05 396.933 2.66674 390 5.7334Z" />
        <path d="M183.6 52.2666C162.267 92.1333 150.133 124.533 145.2 154.667C142.267 172.267 143.467 213.333 147.333 228.933C152.267 249.733 163.333 270.667 174.667 281.2C179.6 285.733 181.467 286.667 186.133 286.667C197.333 286.667 210.4 273.867 220.8 252.667C228 238 234.533 215.067 233.467 208.667C232.8 205.6 232.933 205.067 234.133 206.667C235.2 208.267 235.467 208 234.8 205.333C234.533 203.467 234.667 196.267 235.2 189.333C237.2 166.4 233.733 141.867 224.533 114.667C219.067 98.1333 207.067 70.9333 197.733 53.5999L190.4 39.7333L183.6 52.2666Z" />
        <path d="M353.333 177.867C324.8 187.467 313.333 192.133 296.933 200.667C251.067 224.933 223.067 255.733 212.667 293.333C209.467 305.333 206.4 333.067 208 336.8C209.333 340 209.6 340.8 209.867 343.333C210.133 347.6 217.2 353.333 223.333 354.4C230.133 355.6 251.867 354 256.4 352C258 351.333 259.333 350.933 259.333 351.2C259.333 351.467 252.533 356.8 244.4 363.067C197.733 398.4 172.667 430.8 162.533 468.667C160.667 475.867 160 482.8 160 498.667C160 510 160.533 521.067 161.067 523.333C161.733 526.267 161.733 526.8 160.667 525.333C159.733 523.867 159.6 525.6 160.133 531.333C163.067 558.667 177.6 561.6 212.667 541.733C225.733 534.4 237.067 525.2 245.067 515.333C252.267 506.4 264 484.267 269.067 470C273.733 456.933 279.733 429.6 278.667 425.6C278.133 423.333 278.4 422.667 279.467 423.467C280.667 424.133 280.8 423.467 280.267 421.067C279.733 419.333 280.267 411.2 281.333 403.2C282.4 395.2 283.6 379.067 284 367.333C284.933 343.6 285.6 337.2 287.2 337.733C289.467 338.267 306 324.933 315.733 314.667C332 297.467 344.133 277.333 356.667 246.667C366.133 223.467 371.467 203.467 367.467 206C366.133 206.667 370.933 187.867 374.667 177.333C376.933 170.8 376.933 170.667 375.733 170.667C375.067 170.667 365.067 173.867 353.333 177.867Z" />
        <path d="M93.6 223.333C85.4667 250.533 83.0667 259.2 80.1333 272.667C74.1333 300.667 72.2667 319.6 73.3333 342C73.8667 352.933 74.2667 363.467 74.2667 365.333C74.4 379.867 80.4 403.467 87.6 418C95.3333 433.333 109.333 450.667 120.533 458.8C128.667 464.667 135.067 465.6 142.133 462C146.933 459.467 153.6 449.2 158.4 437.2C166.267 417.467 168 405.067 167.867 370.667C167.867 353.867 167.333 348 164.933 339.067C156.933 309.333 140.667 279.6 112.267 243.333C93.3333 219.2 94.5333 220.4 93.6 223.333Z" />
        <path d="M24.1333 436.933C24.8 447.067 25.3333 459.333 25.3333 464.267C25.3333 469.067 25.6 472.667 26 472C26.4 471.467 26.8 474.933 26.9333 479.733C27.2 491.733 33.0667 521.2 38.8 538.533C52.9333 582 77.4667 611.867 112.933 628.667C137.6 640.4 149.067 634.133 151.067 607.6C151.6 601.6 152 586.4 151.867 574C151.867 552 151.733 550.933 147.467 538.667C135.333 503.2 110 473.867 65.7333 444.267C54.2667 436.533 24.9333 418.667 23.8667 418.667C23.3333 418.667 23.6 426.933 24.1333 436.933Z" />
        <path d="M261.867 506.267C208.8 562.133 185.067 610.8 188 658C188.4 666 189.067 677.467 189.333 683.333C190.267 701.6 197.067 721.333 204.267 726C213.467 732.133 224 728.933 241.067 715.067C257.2 701.733 268.8 686.667 276.267 668.933C281.733 655.867 286.133 639.2 286.667 628.667C286.933 624.267 287.867 613.467 288.667 604.667C290.267 588.533 289.733 566 287.2 546.667C285.2 530.8 277.6 492 276.533 492C276 492 269.467 498.4 261.867 506.267Z" />
        <path d="M0.666656 607.6C0.666656 607.867 3.06666 612.933 6.13332 618.8C12.4 631.467 14.4 636.4 12.8 635.467C10.8 634.133 10.4 640.667 12 647.067C16.1333 663.2 47.3333 709.467 66.9333 728.133C83.4667 744 104.4 757.733 118 761.6C122.8 762.933 124.533 763.733 122 763.333C119.467 762.933 111.6 761.733 104.667 760.667C89.0667 758.4 57.6 756 41.0667 756H28.6667L35.7333 766.933C45.3333 781.867 45.3333 781.867 43.6 780.8C41.2 779.333 40.1333 786.267 41.8667 792C45.2 803.2 76.6667 842.133 95.7333 858.933C108.4 870 125.333 881.333 136.267 886.267C149.333 892 162.133 896 168.533 896.133L174.667 896.267L168.667 897.333C165.333 898 152.133 900.133 139.333 902.133C126.533 904.133 115.733 906 115.333 906.267C115.067 906.533 115.333 907.2 116 907.733C119.6 910.267 134.4 926.933 132.4 926.267C130 925.467 128.667 927.6 128.667 932.533C128.667 937.6 135.733 946.933 147.467 957.467C194 999.2 231.6 1017.47 272.667 1017.87C281.067 1017.87 290.133 1017.6 292.667 1016.93C295.2 1016.4 288 1019.2 276.667 1023.07C245.2 1034 235.333 1037.73 235.333 1038.67C235.333 1039.07 239.2 1042.4 244 1045.87C251.333 1051.2 257.6 1057.07 252.933 1054.13C251.2 1053.07 248.667 1057.33 248.667 1061.33C248.667 1074.53 313.467 1109.47 354 1118.13C370.667 1121.73 397.6 1121.47 413.2 1117.6C428.267 1113.87 448 1104.53 454.4 1098.27C459.6 1092.93 461.867 1086 459.467 1081.73C458.4 1079.47 458.933 1078.53 463.333 1075.2C466.267 1073.07 468.667 1070.93 468.667 1070.4C468.667 1069.87 465.2 1065.07 460.933 1059.73C439.333 1032.67 411.867 1016 379.867 1010.53C368 1008.53 330.8 1009.73 316.667 1012.53C299.2 1016 297.067 1016 308.8 1012.93C315.6 1011.2 322.4 1008.4 325.067 1006.27C330.133 1002.4 333.2 995.067 331.867 989.867C331.2 987.467 332 986.4 335.2 984.667C337.467 983.6 339.333 982.133 339.333 981.6C339.333 981.067 337.2 976.533 334.667 971.6C312.933 929.333 278.133 904.8 230.533 898.533C215.467 896.533 213.6 896 218.4 894.533C225.2 892.667 229.6 886.8 230.267 878.8C230.4 876.133 231.467 874.4 232.933 873.867C236 872.933 236 873.067 231.333 858.667C216.933 814.8 190.667 787.467 146 770.4C140.533 768.4 138.133 767.067 140.667 767.6C143.2 768.267 151.6 768.667 159.333 768.667C170.133 768.667 174.4 768.133 178.267 766.267C183.467 763.6 188 756.133 186.933 752C186.533 750.4 187.2 749.333 188.8 748.933C191.867 748.133 191.867 746.133 189.333 732.4C181.2 689.733 156.133 656.667 116.8 636.667C95.8667 626.133 64.2667 617.067 28 611.333C16.2667 609.6 5.33332 607.867 3.73332 607.467C1.99999 607.2 0.666656 607.2 0.666656 607.6Z" />
        <path d="M294.933 673.067C254.267 727.467 235.867 774 238.667 815.333C239.067 822.667 239.733 834 240 840.667C240.667 855.733 244 867.867 251.067 879.733C256.933 889.6 262.8 895.467 268.133 896.8C281.733 900.267 313.333 867.733 324.4 839.067C328.933 827.467 333.333 807.733 332.133 804.667C331.733 803.467 332 799.467 332.8 795.6C333.467 791.867 334.133 780 334.133 769.333C334.267 748.667 332.133 731.467 326.533 708.667C322.133 690.4 310.933 654.667 309.733 654.667C309.067 654.667 302.4 662.933 294.933 673.067Z" />
        <path d="M370 776.133C344.8 827.467 336.133 860.4 336.933 901.6C337.2 913.067 337.733 921.733 338.267 920.933C338.933 920 338.933 921.2 338.533 923.467C336 936.533 348.8 970.667 362.667 988.4C372.8 1001.2 381.467 1004.4 390.667 998.667C400 992.933 416.667 966.667 422.533 948.667C425.2 940.267 428.667 922.4 427.867 921.067C427.467 920.533 427.867 913.867 428.667 906.267C432.133 872 421.867 832.533 396.667 783.333C391.067 772.267 385.067 761.333 383.6 758.8L380.8 754.133L370 776.133Z" />
        <path d="M460 850.933C459.733 851.867 458.133 861.333 456.4 872C453.867 888.4 453.467 897.067 453.333 929.333C453.067 970.533 454.267 982.8 460 1003.33C468.8 1034.27 487.2 1060.67 511.733 1076.93C527.733 1087.6 536.933 1086.27 544.4 1072.4C549.2 1063.2 554.267 1045.07 554.8 1034.67C554.933 1030.67 555.467 1020.13 556 1011.33C557.2 993.333 555.867 982.933 550.533 966.133C541.733 938.4 524.133 912 493.333 880.133C473.733 859.867 460.8 848.533 460 850.933Z" />
        <path d="M574.133 973.6C581.067 990.8 583.333 997.467 582 996.667C581.2 996.133 580.667 998.267 580.667 1002.27C580.667 1012.67 596 1044 614.267 1070.8C642.933 1113.07 684.8 1138.67 725.2 1138.67C741.733 1138.67 747.333 1135.07 749.2 1123.73C749.333 1122.27 750.267 1120.67 751.2 1120.13C752.533 1119.2 752.667 1116.53 751.467 1107.07C742.667 1034.4 698 995.6 596.267 972.133C583.333 969.067 572.4 966.667 572 966.667C571.6 966.667 572.667 969.867 574.133 973.6Z" />
        <path d="M511.6 1090.8C485.867 1094.13 453.6 1107.33 422.667 1127.33C408.267 1136.53 380.8 1156.4 380.667 1157.47C380.667 1158 384.4 1159.6 389.067 1161.33C397.867 1164.53 401.333 1166.67 397.733 1166.67C396.4 1166.67 395.2 1168.27 394.667 1170.67C392.8 1179.33 400.667 1184.67 424.8 1191.2C501.067 1211.87 555.733 1203.6 594.133 1165.33C604.133 1155.47 607.6 1147.87 604.933 1142.13C603.733 1139.33 604.133 1138 608.8 1131.87C611.6 1128 614 1124.53 614 1124.13C614 1123.73 610.667 1120.93 606.667 1118C576.133 1095.73 544.133 1086.53 511.6 1090.8Z" />
        <path d="M674.667 1147.47C637.867 1153.6 596.4 1177.73 550 1219.6L542.8 1226.27L552.667 1229.33C558.133 1231.07 561.6 1232.67 560.4 1232.93C557.333 1233.73 555.867 1239.33 557.733 1243.33C559.867 1248 567.733 1251.47 582.8 1254.53C658.533 1269.87 711.867 1259.47 749.467 1222.13C758.667 1212.93 764.133 1204.8 764.667 1199.33C765.333 1193.73 764.667 1190.53 763.067 1191.47C761.467 1192.53 761.467 1192.4 768.267 1181.73C770.667 1177.87 772.667 1174.27 772.667 1173.47C772.667 1171.47 766.133 1167.33 753.067 1160.8C725.467 1146.93 701.6 1142.8 674.667 1147.47Z" />
      </svg>
      <div>
        <p className="text-base-content/80 text-sm text-center">
          1000+ happy users
        </p>
        <div className="flex flex-row justify-center gap-0 pt-1">
          {[...Array(5)].map((e, i) => (
            <span key={i}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-yellow-500"
              >
                <path
                  fillRule="evenodd"
                  d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          ))}
        </div>
      </div>
      <svg
        className="w-8 fill-base-content/40 -rotate-12"
        viewBox="0 0 773 1262"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M369.133 2.26663C371.667 12.1333 375.667 39.7333 374.6 39.0666C371.267 37.0666 378.067 67.8666 386.467 93.2C396.067 121.733 408.867 144.267 425.667 161.867C446.067 183.333 471.4 196.533 495.267 198.267C514.467 199.733 518.467 195.333 519.8 171.867C523.933 100.4 482.2 49.4666 384.2 5.99997C376.733 2.66663 370.2 -3.47677e-05 369.667 -3.47677e-05C369 -3.47677e-05 368.867 1.06663 369.133 2.26663Z" />
        <path d="M575.933 53.4666C558.067 86.9333 545.133 121.6 540.2 148.8C536.2 171.2 537.133 206.267 542.2 226C548.467 250.4 563.667 275.733 576.867 283.867C579.533 285.467 583.533 286.667 586.867 286.667C596.067 286.667 605.267 276.667 616.333 254.8C622.467 242.667 628.867 220 627.8 214.267C627.267 211.733 627.533 210.8 628.6 211.467C629.533 212.133 629.667 211.867 629.133 210.8C628.467 209.867 628.867 203.2 629.667 196C634.333 159.333 621.267 110.533 591.8 55.4666L583.4 39.7333L575.933 53.4666Z" />
        <path d="M397.667 171.333C397.667 172.133 402.2 188.133 406.6 203.2C407.133 204.933 406.867 205.333 405.667 204.667C404.333 203.867 404.067 205.2 404.6 210.8C406.2 226.133 426.067 272.133 440.2 293.467C443.933 299.067 451.267 308.267 456.6 314C466.733 324.933 487 341.2 487 338.533C487 337.6 487.267 337.2 487.667 337.6C488.467 338.267 491.533 396.133 491.4 406.667C491.267 411.733 491.667 413.2 492.333 411.333C493.133 409.6 493.267 410.933 492.733 414.667C491.933 422 497.533 450.4 503.133 467.2C508.333 482.8 520.067 505.467 527.933 515.333C535.933 525.2 547.267 534.4 560.333 541.733C581.667 553.733 594.467 557.067 602.867 552.667C608.6 549.733 612.867 540.4 611.933 532.933C611.533 529.867 611.667 528.267 612.2 529.2C612.867 530.133 613.267 528.133 613.4 524.4C613.4 520.933 613.533 509.867 613.667 500C614.067 476.8 610.067 459.2 600.067 439.6C588.6 416.933 561.267 387.2 530.733 364.133C513.933 351.467 507.667 346.267 515.4 351.2C519 353.6 541.667 355.733 549.667 354.4C555.8 353.333 562.867 347.6 563.133 343.333C563.533 339.6 563.667 338.933 564.733 337.867C566.333 336.267 565.8 318.4 563.667 306.533C558.6 277.067 546.733 255.467 523.533 233.333C499.4 210.267 457.533 188.4 411.133 174.667C405.8 173.067 400.467 171.467 399.533 171.067C398.467 170.667 397.667 170.8 397.667 171.333Z" />
        <path d="M671 230.933C651.8 255.733 647.4 261.6 639.267 274C614.333 312.133 603.533 345.067 604.6 380.8C604.733 389.733 605.533 396.8 606.067 396.4C606.6 396 606.733 397.333 606.2 399.2C604.2 407.333 612.867 437.067 621.267 451.067C626.867 460.267 632.2 464 639.933 464C647.4 464 658.733 455.333 670.333 441.067C680.333 428.4 686.733 416.8 691.667 402.267C698.333 382.4 699.667 368.933 699.533 329.333C699.4 305.867 698.867 299.467 695.933 284.133C692.467 266.267 680.333 221.333 679 221.467C678.6 221.467 675 225.733 671 230.933Z" />
        <path d="M734.467 427.333C664.334 469.6 630.334 508 622.2 554.667C620.067 567.333 620.2 597.2 622.467 603.333C623.134 604.933 623 605.467 622.067 604.933C619.934 603.6 623.8 621.867 626.6 626.667C632.334 636.533 643.4 636.8 662.334 627.467C692.467 612.533 714.467 588.133 728.6 553.6C737.267 532.4 746.334 494.267 744.867 485.467C744.467 482.8 744.6 481.333 745.267 482.267C745.934 483.067 746.334 481.2 746.334 477.6C746.467 474.133 747.134 462.933 748.067 452.667C749 442.4 749.934 430.533 750.334 426.267C750.734 422.133 750.467 418.667 749.934 418.667C749.4 418.667 742.467 422.533 734.467 427.333Z" />
        <path d="M495.267 498C486.733 535.2 484.067 559.733 484.6 594.267C484.867 609.733 485.267 622.267 485.667 622C486.067 621.733 486.467 624.933 486.467 629.067C486.733 638.4 492.067 658.933 497.533 670.933C507.667 693.467 528.6 716.133 548.333 726.133C560.333 732.133 569.667 728.933 575.533 716.933C582.733 702.133 585 685.6 584.867 648.667C584.867 631.2 584.333 627.067 581.267 615.733C571.933 581.733 549.267 545.733 513.8 509.067L496.733 491.467L495.267 498Z" />
        <path d="M765.667 608.133C734.734 612.933 721.134 615.467 706.334 619.333C641.8 635.6 604.867 665.467 589 714.267C585.534 724.8 581.4 746.533 582.6 748.267C582.867 748.933 584.467 749.333 586.067 749.467C587.667 749.467 588.2 749.867 587.4 750.267C585.134 751.067 585.267 755.333 587.667 759.867C591 766.4 597.667 768.667 614.334 768.667C622.467 768.667 630.867 768.133 633 767.6C635.267 766.933 631.267 768.8 624.2 771.733C606.067 779.067 590.867 788.533 578.734 799.867C561.667 815.867 549.8 834.933 542.467 858.4C538.2 871.867 538.2 873.067 542.067 874.667C543.667 875.333 544.334 875.867 543.534 875.867C542.467 876 542.334 877.467 542.867 880.4C544.867 889.2 548.334 893.067 555.4 894.667C559.534 895.6 559.534 895.6 556.334 896.267C554.467 896.667 546.734 898 539 899.2C496.067 906 465.267 926.667 443.8 963.067C440.467 968.667 436.867 975.333 435.8 977.867C433.934 982.267 433.934 982.267 438.867 985.067C441.534 986.667 443 988 442.334 988C440.334 988 440.067 993.2 441.8 998.4C443.667 1004 451.934 1010.13 459.134 1011.33C462.067 1011.87 464.334 1012.53 463.934 1012.8C463.667 1013.07 456.6 1012.4 448.2 1011.2C427.667 1008.27 395.534 1009.2 382.334 1012.93C353.534 1021.2 330.2 1037.47 309.667 1063.6L304.2 1070.53L309.534 1074.8C314.067 1078.4 314.734 1079.47 313.534 1081.6C311.267 1086 313.4 1092.93 318.6 1098.27C325 1104.53 344.734 1113.87 359.8 1117.6C375.4 1121.47 402.334 1121.73 419 1118.13C459 1109.6 524.334 1074.4 524.334 1061.47C524.334 1057.6 521.934 1053.07 520.2 1054C519.534 1054.53 519 1054.53 519 1054.27C519 1053.87 523.534 1050.4 529 1046.4C534.467 1042.53 539 1038.93 539 1038.53C539 1038.13 536.2 1036.8 532.734 1035.6C486.2 1019.6 476.467 1016.13 481 1016.93C488.867 1018.53 513.134 1018 522.334 1016.13C550.067 1010.4 580.6 995.067 607.134 973.2C639.267 946.667 649 934.133 642.467 927.6C640.734 926 641.667 924.4 649.267 916.133C654.067 910.8 657.8 906.4 657.534 906.133C657 905.867 643.267 903.467 609.667 898.133C600.334 896.533 599.4 896.267 604.467 896.133C610.867 896 623.667 892 636.6 886.267C655.134 878 679 859.333 696.734 839.333C710.6 823.733 726.734 802.133 729.934 794.933C732.734 788.667 732.734 781.733 729.934 782.4C727.8 782.8 728.6 781.2 737.667 766.933L744.334 756.667L734.734 756.267C722.6 755.733 686.467 758.133 669.667 760.667C645.8 764.133 645.8 764.133 654.2 761.867C666.6 758.4 686.734 745.867 702.867 731.2C728.6 708 765.134 650.533 761.934 638.4C761.667 637.067 760.867 636.4 760.2 636.8C758.6 637.733 760.6 632.8 767 620C770.067 614 772.334 608.667 772.067 608.133C771.8 607.6 769 607.6 765.667 608.133ZM641.267 766.133C640.867 766.533 639.667 766.667 638.734 766.267C637.667 765.867 638.067 765.467 639.534 765.467C641 765.333 641.8 765.733 641.267 766.133ZM469.267 1014.13C468.867 1014.53 467.667 1014.67 466.734 1014.27C465.667 1013.87 466.067 1013.47 467.534 1013.47C469 1013.33 469.8 1013.73 469.267 1014.13ZM474.6 1015.47C474.2 1015.87 473 1016 472.067 1015.6C471 1015.2 471.4 1014.8 472.867 1014.8C474.334 1014.67 475.134 1015.07 474.6 1015.47Z" />
        <path d="M457.933 670.4C451.8 689.067 445.667 712.933 442.2 731.333C439.8 743.867 438.467 800.533 440.6 799.2C441.133 798.8 441.267 800.267 440.867 802.533C439.8 807.867 443.667 826.4 448.6 839.067C458.6 865.067 488.2 897.333 501.933 897.333C509.533 897.333 518.467 888 525.533 872.667C532.6 857.733 534.467 842.8 534.2 804.667C534.067 788.667 533.533 782.533 531.133 773.6C522.333 740 503.667 704.933 474.733 667.6C469.533 660.8 464.867 654.933 464.467 654.4C463.933 653.867 461 661.067 457.933 670.4Z" />
        <path d="M387.133 764.133C370.6 793.333 356.467 826.267 350.333 849.733C345.133 869.867 344.067 880.933 344.867 906.533C345.8 938.133 350.067 954.133 363 975.467C381.133 1005.47 394.067 1008.93 410.333 988.4C422.867 972.267 433.133 946.667 434.467 928C434.733 923.2 435.533 913.2 436.2 905.733C439.667 867.333 428.733 825.733 400.733 770.133L392.733 754.133L387.133 764.133Z" />
        <path d="M291.533 868.933C253 906.8 233.533 934.533 223 966.533C218.733 979.867 215.667 1001.33 217 1010.53C217.4 1013.87 218.067 1022.67 218.333 1030C219.267 1052.4 227.133 1076.27 235.533 1081.6C245.8 1088 261.667 1080.13 281.8 1058.93C294.333 1045.87 302.6 1032.4 309.133 1014.8C314.067 1001.6 318.067 983.6 317 979.867C316.467 978.4 316.733 977.333 317.667 977.333C318.733 977.333 319 976.267 318.6 974.533C318.2 973.067 318.733 964.267 319.933 954.933C321.267 943.067 321.667 932 321.133 918C320.2 892.533 314.733 849.333 312.467 849.333C312.067 849.333 302.6 858.133 291.533 868.933Z" />
        <path d="M180.2 971.333C99 989.733 54.8667 1017.2 34.0667 1062.4C26.2 1079.33 19.4 1112.67 22.3333 1119.6C23 1120.93 23.6667 1123.47 23.9333 1125.2C25.6667 1135.2 31.8 1138.67 47.8 1138.67C89.9333 1138.67 131.133 1112.53 161.667 1066.27C176.333 1044.27 191.267 1013.6 192.067 1004.27C192.467 998.933 192.333 997.2 191.133 997.867C189.667 998.8 190.733 995.867 198.2 977.467C201.933 968.4 202.333 966.667 200.733 966.8C200.067 966.8 190.867 968.933 180.2 971.333Z" />
        <path d="M227.4 1091.2C206.733 1095.2 185.133 1104.67 167.933 1117.33L159 1124L164.333 1131.2C169.267 1137.73 169.667 1138.67 168.2 1141.87C165.4 1148 168.733 1155.33 178.867 1165.33C217.267 1203.6 271.933 1211.87 348.2 1191.2C372.2 1184.67 380.2 1179.33 378.333 1170.8C377.933 1168.67 376.467 1166.67 375.267 1166.4C374.067 1166.13 377.667 1164 383.4 1161.73L393.933 1157.73L377.133 1145.47C336.6 1115.73 303.8 1099.2 273.133 1092.8C258.067 1089.73 238.867 1089.07 227.4 1091.2Z" />
        <path d="M58.8667 1147.47C53.2667 1148.4 44.3333 1150.8 38.8667 1152.8C28.7333 1156.4 8.73332 1166.27 3.26665 1170.53L0.0666504 1172.93L5.53332 1181.73C8.46665 1186.67 10.3333 1190.67 9.66665 1190.67C7.26665 1190.67 8.19998 1201.33 11.1333 1206.8C12.6 1209.73 18.2 1216.53 23.4 1221.87C60.6 1259.47 114.333 1270 190.2 1254.53C205.267 1251.47 213.133 1248 215.267 1243.33C217.133 1239.33 215.667 1233.73 212.6 1233.07C211.4 1232.67 215 1231.07 220.733 1229.2L231.133 1226L218.733 1215.2C170.467 1173.47 135.8 1153.87 98.4667 1147.33C84.3333 1144.93 72.6 1144.93 58.8667 1147.47Z" />
      </svg>
    </div>
  );
};

export default TestimonialRating;

```

### components/WithWithout.tsx

```tsx
// A useful component when your product is challenging the status quo.
// Highlight the current pain points (left) and how your product is solving them (right)
// Try to match the lines from left to right, so the user can easily compare the two columns
const WithWithout = () => {
  return (
    <section className="bg-base-100">
      <div className="max-w-5xl mx-auto px-8 py-16 md:py-32 ">
        <h2 className="text-center font-extrabold text-3xl md:text-5xl tracking-tight mb-12 md:mb-20">
          Tired of managing Stripe invoices?
        </h2>

        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-8 md:gap-12">
          <div className="bg-error/20 text-error p-8 md:p-12 rounded-lg w-full ">
            <h3 className="font-bold text-lg mb-4">
              Stripe invoices without ZenVoice
            </h3>

            <ul className="list-disc list-inside space-y-1.5 ">
              {/* Pains the user is experiencing by not using your product */}
              {[
                "Manually create invoices",
                "Or pay up to $2 per invoice",
                "Waste hours in customer support",
                "Can’t update details once sent (VAT, Tax ID)",
                "Can't make invoices for previous purchases",
              ].map((item, index) => (
                <li key={index} className="flex gap-2 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-4 h-4 shrink-0 opacity-75"
                  >
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-success/20 text-success p-8 md:p-12 rounded-lg w-full">
            <h3 className="font-bold text-lg mb-4">
              Stripe invoices + ZenVoice
            </h3>

            <ul className="list-disc list-inside space-y-1.5 ">
              {/* Features of your product fixing the pain (try to match each with/withot lines) */}
              {[
                "Self-serve invoices",
                `One-time payment for unlimited invoices`,
                "No more customer support",
                "Editable invoices to stay compliant",
                "Invoices for any payment, even past ones",
              ].map((item, index) => (
                <li key={index} className="flex gap-2 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-4 h-4 shrink-0 opacity-75"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                      clipRule="evenodd"
                    />
                  </svg>

                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WithWithout;

```

### components/FeaturesGrid.tsx

```tsx
/* eslint-disable @next/next/no-img-element */
import React from "react";

const features = [
  {
    title: "Collect user feedback",
    description:
      "Use your Insighto's board to let users submit features they want.",
    styles: "bg-primary text-primary-content",
    demo: (
      <div className="overflow-hidden h-full flex items-stretch">
        <div className="w-full translate-x-12 bg-base-200 rounded-t-box h-full p-6">
          <p className="font-medium uppercase tracking-wide text-base-content/60 text-sm mb-3">
            Suggest a feature
          </p>
          <div className="relative textarea py-4 h-full mr-12 bg-base-200 group-hover:bg-base-100 group-hover:border-base-content/10 text-base-content">
            <div className="absolute left-4 top-4 group-hover:hidden flex items-center ">
              <span>Notifica</span>
              <span className="w-[2px] h-6 bg-primary animate-pulse"></span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 duration-500">
              Notifications should be visible only on certain pages.
            </div>
            <div className="opacity-0 group-hover:opacity-100 duration-1000 flex items-center gap-0.5">
              <span>Terms & privacy pages don&apos;t need them</span>
              <span className="w-[2px] h-6 bg-primary animate-pulse"></span>
            </div>
            <button className="btn shadow-lg btn-primary absolute right-4 bottom-6 opacity-0 group-hover:opacity-100 duration-1000">
              Submit
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Prioritize features",
    description: "Users upvote features they want. You know what to ship next.",
    styles: "md:col-span-2 bg-base-300 text-base-content",
    demo: (
      <div className="px-6 max-w-[600px] flex flex-col gap-4 overflow-hidden">
        {[
          {
            text: "Add LemonSqueezy integration to the boilerplate",
            secondaryText: "Yes, ship this! ✅",
            votes: 48,
            transition: "group-hover:-mt-36 group-hover:md:-mt-28 duration-500",
          },
          {
            text: "A new pricing table for metered billing",
            secondaryText: "Maybe ship this 🤔",
            votes: 12,
          },
          {
            text: "A new UI library for the dashboard",
            secondaryText: "But don't ship that ❌",
            votes: 1,
          },
        ].map((feature, i) => (
          <div
            className={`p-4 bg-base-100 text-base-content rounded-box flex justify-between mb-2 gap-4 ${feature?.transition}`}
            key={i}
          >
            <div>
              <p className="font-semibold mb-1">{feature.text}</p>
              <p className="text-base-content-secondary">
                {feature.secondaryText}
              </p>
            </div>
            <button
              className={`px-4 py-2 rounded-box group text-center text-lg duration-150 border border-transparent bg-primary text-primary-content`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-5 h-5 ease-in-out duration-150 -translate-y-0.5 group-hover:translate-y-0`}
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
              {feature.votes}
            </button>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Your brand, your board",
    description: "Customize your Insighto board with 7 themes.",
    styles: "md:col-span-2 bg-base-100 text-base-content",
    demo: (
      <div className="flex left-0 w-full h-full pt-0 lg:pt-8 overflow-hidden -mt-4">
        <div className="-rotate-[8deg] flex min-w-max overflow-x-visible h-full lg:pt-4">
          {[
            {
              buttonStyles: "bg-primary text-primary-content",
              css: "-ml-1 rotate-[6deg] w-72 h-72 z-30 bg-base-200 text-base-content rounded-2xl group-hover:-ml-64 group-hover:opacity-0 group-hover:scale-75 transition-all duration-500 p-4",
            },
            {
              buttonStyles: "bg-secondary text-secondary-content",
              css: "rotate-[6deg] bg-base-200 text-base-content w-72 h-72 -mr-20 -ml-20 z-20 rounded-xl p-4",
            },
            {
              buttonStyles: "bg-accent text-accent-content",
              css: "rotate-[6deg] bg-base-200 text-base-content z-10 w-72 h-72 rounded-xl p-4",
            },
            {
              buttonStyles: "bg-neutral text-neutral-content",
              css: "rotate-[6deg] bg-base-200 text-base-content w-72 h-72 -ml-20 rounded-xl p-4",
            },
            {
              buttonStyles: "bg-base-100 text-base-content",
              css: "rotate-[6deg] bg-base-200 text-base-content w-72 h-72 -ml-10 -z-10 rounded-xl p-4 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300",
            },
          ].map((theme, i) => (
            <div className={theme.css} key={i}>
              <div className="font-medium uppercase tracking-wide text-base-content/60 text-sm mb-3">
                Trending feedback
              </div>
              <div className="space-y-2">
                <div className="p-4 bg-base-100 rounded-box flex justify-between">
                  <div>
                    <p className="font-semibold mb-1">Clickable cards</p>
                    <p className="opacity-80">Make cards more accessible</p>
                  </div>
                  <button
                    className={`px-4 py-2 rounded-box group text-center text-lg duration-150 border border-transparent ${theme.buttonStyles}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-5 h-5 ease-in-out duration-150 -translate-y-0.5 group-hover:translate-y-0`}
                    >
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                    8
                  </button>
                </div>
                <div className="p-4 bg-base-100 rounded-box flex justify-between ">
                  <div>
                    <p className="font-semibold mb-1">Bigger images</p>
                    <p className="opacity-80">Make cards more accessible</p>
                  </div>
                  <button
                    className={`px-4 py-2 rounded-box group text-center text-lg duration-150 border border-transparent ${theme.buttonStyles}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-5 h-5 ease-in-out duration-150 -translate-y-0.5 group-hover:translate-y-0`}
                    >
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                    5
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Discover new ideas",
    description: "Users can chat and discuss features.",
    styles: "bg-neutral text-neutral-content",
    demo: (
      <div className="text-neutral-content px-6 space-y-4">
        {[
          {
            id: 1,
            text: "Can we have a feature to add a custom domain to IndiePage?",
            userImg:
              "https://pbs.twimg.com/profile_images/1514863683574599681/9k7PqDTA_400x400.jpg",
            userName: "Marc Lou",
            createdAt: "2024-09-01T00:00:00Z",
          },
          {
            id: 2,
            text: "I'd definitelly pay for that 🤩",
            userImg:
              "https://pbs.twimg.com/profile_images/1778434561556320256/knBJT1OR_400x400.jpg",
            userName: "Dan K.",
            createdAt: "2024-09-02T00:00:00Z",
            transition:
              "opacity-0 group-hover:opacity-100 duration-500 translate-x-1/4 group-hover:translate-x-0",
          },
        ]?.map((reply) => (
          <div
            key={reply.id}
            className={`px-6 py-4 bg-neutral-content text-neutral rounded-box ${reply?.transition}`}
          >
            <div className="mb-2 whitespace-pre-wrap">{reply.text}</div>
            <div className="text-neutral/80 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="avatar">
                  <div className="w-7 rounded-full">
                    <img src={reply.userImg} alt={reply.userName} />
                  </div>
                </div>
                <div className=""> {reply.userName} </div>
              </div>
              •
              <div>
                {new Date(reply.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];
const FeaturesGrid = () => {
  return (
    <section className="flex justify-center items-center w-full bg-base-200/50 text-base-content py-20 lg:py-32">
      <div className="flex flex-col max-w-[82rem] gap-16 md:gap-20 px-4">
        <h2 className="max-w-3xl font-black text-4xl md:text-6xl tracking-[-0.01em]">
          Ship features <br /> users{" "}
          <span className="underline decoration-dashed underline-offset-8 decoration-base-300">
            really want
          </span>
        </h2>
        <div className="flex flex-col w-full h-fit gap-4 lg:gap-10 text-text-default max-w-[82rem]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-10">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`${feature.styles} rounded-3xl flex flex-col gap-6 w-full h-[22rem] lg:h-[25rem] pt-6 overflow-hidden group`}
              >
                <div className="px-6 space-y-2">
                  <h3 className="font-bold text-xl lg:text-3xl tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="opacity-80">{feature.description}</p>
                </div>
                {feature.demo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;

```

### components/ButtonPopover.tsx

```tsx
"use client";

import { Popover, Transition } from "@headlessui/react";

const ButtonPopover = () => {
  return (
    <Popover className="relative z-10">
      {({ open }) => (
        <>
          <Popover.Button className="btn">
            Popover Button
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 duration-200 ${
                open ? "transform rotate-180 " : ""
              }`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Popover.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Popover.Panel className="absolute left-0 z-10 mt-3 w-screen max-w-full sm:max-w-sm lg:max-w-2xl transform">
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-base-content ring-opacity-5">
                <div className="relative grid gap-4 bg-base-100 p-4 lg:grid-cols-2">
                  <div className="text-sm flex items-center gap-3 p-2 cursor-pointer hover:bg-base-200 rounded-lg duration-200">
                    <span className="flex items-center justify-center w-12 h-12 shrink-0 rounded-lg bg-orange-500/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 stroke-orange-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                        />
                      </svg>
                    </span>
                    <div className="">
                      <p className="font-bold">Get Started</p>
                      <p className="opacity-70">
                        Loreum ipseum de la madre de papa
                      </p>
                    </div>
                  </div>
                  <div className="text-sm flex items-center gap-3 p-2 cursor-pointer hover:bg-base-200 rounded-lg duration-200">
                    <span className="flex items-center justify-center w-12 h-12 shrink-0 rounded-lg bg-yellow-500/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 stroke-yellow-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                    </span>
                    <div className="">
                      <p className="font-bold">Rewards</p>
                      <p className="opacity-70">
                        Loreum ipseum de el papi de la mama
                      </p>
                    </div>
                  </div>
                  <div className="text-sm flex items-center gap-3 p-2 cursor-pointer hover:bg-base-200 rounded-lg duration-200">
                    <span className="flex items-center justify-center w-12 h-12 shrink-0 rounded-lg bg-green-500/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 stroke-green-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                        />
                      </svg>
                    </span>
                    <div className="">
                      <p className="font-bold">Academics</p>
                      <p className="opacity-70">
                        Loreum ipseum de la madre de papa
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export default ButtonPopover;

```

### components/FeaturesAccordion.tsx

```tsx
"use client";

import { useState, useRef } from "react";
import type { JSX } from "react";
import Image from "next/image";

interface Feature {
  title: string;
  description: string;
  type?: "video" | "image";
  path?: string;
  format?: string;
  alt?: string;
  svg?: JSX.Element;
}

// The features array is a list of features that will be displayed in the accordion.
// - title: The title of the feature
// - description: The description of the feature (when clicked)
// - type: The type of media (video or image)
// - path: The path to the media (for better SEO, try to use a local path)
// - format: The format of the media (if type is 'video')
// - alt: The alt text of the image (if type is 'image')
const features = [
  {
    title: "Emails",
    description:
      "Send transactional emails, setup your DNS to avoid spam folder (DKIM, DMARC, SPF in subdomain), and listen to webhook to receive & forward emails",
    type: "video",
    path: "https://d3m8mk7e1mf7xn.cloudfront.net/app/newsletter.webm",
    format: "video/webm",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
        />
      </svg>
    ),
  },
  {
    title: "Payments",
    description:
      "Create checkout sessions, handle webhooks to update user's account (subscriptions, one-time payments...) and tips to setup your account & reduce chargebacks",
    type: "image",
    path: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80",
    alt: "A computer",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
    ),
  },
  {
    title: "Authentication",
    description:
      "Magic links setup, login with Google walkthrough, save user in MongoDB/Supabase, private/protected pages & API calls",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: "Style",
    description:
      "Components, animations & sections (like this features section), 20+ themes with daisyUI, automatic dark mode",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
        />
      </svg>
    ),
  },
] as Feature[];

// An SEO-friendly accordion component including the title and a description (when clicked.)
const Item = ({
  feature,
  isOpen,
  setFeatureSelected,
}: {
  index: number;
  feature: Feature;
  isOpen: boolean;
  setFeatureSelected: () => void;
}) => {
  const accordion = useRef(null);
  const { title, description, svg } = feature;

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-medium text-left md:text-lg"
        onClick={(e) => {
          e.preventDefault();
          setFeatureSelected();
        }}
        aria-expanded={isOpen}
      >
        <span className={`duration-100 ${isOpen ? "text-primary" : ""}`}>
          {svg}
        </span>
        <span
          className={`flex-1 text-base-content ${
            isOpen ? "text-primary font-semibold" : ""
          }`}
        >
          <h3 className="inline">{title}</h3>
        </span>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out text-base-content-secondary overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{description}</div>
      </div>
    </li>
  );
};

// A component to display the media (video or image) of the feature. If the type is not specified, it will display an empty div.
// Video are set to autoplay for best UX.
const Media = ({ feature }: { feature: Feature }) => {
  const { type, path, format, alt } = feature;
  const style = "rounded-2xl aspect-square w-full sm:w-[26rem]";
  const size = {
    width: 500,
    height: 500,
  };

  if (type === "video") {
    return (
      <video
        className={style}
        autoPlay
        muted
        loop
        playsInline
        controls
        width={size.width}
        height={size.height}
      >
        <source src={path} type={format} />
      </video>
    );
  } else if (type === "image") {
    return (
      <Image
        src={path}
        alt={alt}
        className={`${style} object-cover object-center`}
        width={size.width}
        height={size.height}
      />
    );
  } else {
    return <div className={`${style} !border-none`}></div>;
  }
};

// A component to display 2 to 5 features in an accordion.
// By default, the first feature is selected. When a feature is clicked, the others are closed.
const FeaturesAccordion = () => {
  const [featureSelected, setFeatureSelected] = useState<number>(0);

  return (
    <section
      className="py-24 md:py-32 space-y-24 md:space-y-32 max-w-7xl mx-auto bg-base-100 "
      id="features"
    >
      <div className="px-8">
        <h2 className="font-extrabold text-4xl lg:text-6xl tracking-tight mb-12 md:mb-24">
          All you need to ship your startup fast
          <span className="bg-neutral text-neutral-content px-2 md:px-4 ml-1 md:ml-1.5 leading-relaxed whitespace-nowrap">
            and get profitable
          </span>
        </h2>
        <div className=" flex flex-col md:flex-row gap-12 md:gap-24">
          <div className="grid grid-cols-1 items-stretch gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
            <ul className="w-full">
              {features.map((feature, i) => (
                <Item
                  key={feature.title}
                  index={i}
                  feature={feature}
                  isOpen={featureSelected === i}
                  setFeatureSelected={() => setFeatureSelected(i)}
                />
              ))}
            </ul>

            <Media feature={features[featureSelected]} key={featureSelected} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesAccordion;

```

### components/Testimonial1Small.tsx

```tsx
import Image from "next/image";

// A one or two sentences testimonial from a customer.
// Highlight the outcome for your customer (how did your product changed her/his life?) or the pain it's removing — Use <span className="bg-warning/25 px-1.5"> to highlight a part of the sentence
const Testimonial1Small = () => {
  return (
    <section className="bg-base-100">
      <div className="space-y-6 md:space-y-8 max-w-lg mx-auto px-8 py-16 md:py-32 ">
        <div className="rating !flex justify-center">
          {[...Array(5)].map((_, i) => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-warning"
              key={i}
            >
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                clipRule="evenodd"
              />
            </svg>
          ))}
        </div>
        <div className="text-base leading-relaxed space-y-2 max-w-md mx-auto text-center">
          <p>
            <span className="bg-warning/25 px-1.5">
              I don&apos;t want to pay Stripe $2 for every invoice.
            </span>{" "}
            I don&apos;t want to spend 10 minutes manually crafting every
            invoice either.
          </p>
          <p>
            Zenvoice solved this problem once and for all. The app is simple,
            but it nails the job perfectly.
          </p>
        </div>
        <div className="flex justify-center items-center gap-3 md:gap-4">
          <Image
            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=4140&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt={`XYZ feedback for ZenVoice`}
            width={48}
            height={48}
          />
          <div>
            <p className="font-semibold">Someone Nice</p>
            <p className="text-base-content/80 text-sm">23.1K followers on 𝕏</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial1Small;

```

### components/TestimonialsAvatars.tsx

```tsx
import Image from "next/image";

const avatars: {
  alt: string;
  src: string;
}[] = [
  {
    alt: "User",
    // Ideally, load from a statically generated image for better SEO performance (import userImage from "@/public/userImage.png")
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3276&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1488161628813-04466f872be2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3376&q=80",
  },
];

const TestimonialsAvatars = ({ priority }: { priority?: boolean }) => {
  return (
    <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-3">
      {/* AVATARS */}
      <div className={`-space-x-5 avatar-group justy-start`}>
        {avatars.map((image, i) => (
          <div className="avatar w-12 h-12" key={i}>
            <Image
              src={image.src}
              alt={image.alt}
              priority={priority}
              width={50}
              height={50}
            />
          </div>
        ))}
      </div>

      {/* RATING */}
      <div className="flex flex-col justify-center items-center md:items-start gap-1">
        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-yellow-500"
              key={i}
            >
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                clipRule="evenodd"
              />
            </svg>
          ))}
        </div>

        <div className="text-base text-base-content/80">
          <span className="font-semibold text-base-content">32</span> makers
          ship faster
        </div>
      </div>
    </div>
  );
};

export default TestimonialsAvatars;

```

### components/ButtonSupport.tsx

```tsx
"use client";

import { Crisp } from "crisp-sdk-web";
import config from "@/config";

// Use this button if chat is hidden on some routes. config.js has onlyShowOnRoutes set to ["/"] so it will be hidden on all routes except the home page.
// If Crisp is not enable, it will open the support email in the default email client.
const ButtonSupport = () => {
  const handleClick = () => {
    if (config.crisp?.id) {
      Crisp.chat.show();
      Crisp.chat.open();
    } else if (config.mailgun?.supportEmail) {
      // open default email client in new window with "need help with ${config.appName}" as subject
      window.open(
        `mailto:${config.mailgun.supportEmail}?subject=Need help with ${config.appName}`,
        "_blank"
      );
    }
  };

  return (
    <button
      className="btn btn-sm"
      onClick={handleClick}
      data-tooltip-id="tooltip"
      data-tooltip-content="Talk to support"
      title="Chat with support"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path
          fillRule="evenodd"
          d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM8 8a1 1 0 11-2 0 1 1 0 012 0zm5 1a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      Support
    </button>
  );
};

export default ButtonSupport;

```

### components/Footer.tsx

```tsx
import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import logo from "@/app/icon.png";

// Add the Footer to the bottom of your landing page and more.
// The support link is connected to the config.js file. If there's no config.mailgun.supportEmail, the link won't be displayed.

const Footer = () => {
  return (
    <footer className="bg-base-200 border-t border-base-content/10">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <div className=" flex lg:items-start md:flex-row md:flex-nowrap flex-wrap flex-col">
          <div className="w-64 flex-shrink-0 md:mx-0 mx-auto text-center md:text-left">
            <Link
              href="/#"
              aria-current="page"
              className="flex gap-2 justify-center md:justify-start items-center"
            >
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                priority={true}
                className="w-6 h-6"
                width={24}
                height={24}
              />
              <strong className="font-extrabold tracking-tight text-base md:text-lg">
                {config.appName}
              </strong>
            </Link>

            <p className="mt-3 text-sm text-base-content/80">
              {config.appDescription}
            </p>
            <p className="mt-3 text-sm text-base-content/60">
              Copyright © {new Date().getFullYear()} - All rights reserved
            </p>
          </div>
          <div className="flex-grow flex flex-wrap justify-center -mb-10 md:mt-0 mt-10 text-center">
            <div className="lg:w-1/3 md:w-1/2 w-full px-4">
              <div className="footer-title font-semibold text-base-content tracking-widest text-sm md:text-left mb-3">
                LINKS
              </div>

              <div className="flex flex-col justify-center items-center md:items-start gap-2 mb-10 text-sm">
                {config.mailgun.supportEmail && (
                  <a
                    href={`mailto:${config.mailgun.supportEmail}`}
                    target="_blank"
                    className="link link-hover"
                    aria-label="Contact Support"
                  >
                    Support
                  </a>
                )}
                <Link href="/#pricing" className="link link-hover">
                  Pricing
                </Link>
                <Link href="/blog" className="link link-hover">
                  Blog
                </Link>
                <a href="/#" target="_blank" className="link link-hover">
                  Affiliates
                </a>
              </div>
            </div>

            <div className="lg:w-1/3 md:w-1/2 w-full px-4">
              <div className="footer-title font-semibold text-base-content tracking-widest text-sm md:text-left mb-3">
                LEGAL
              </div>

              <div className="flex flex-col justify-center items-center md:items-start gap-2 mb-10 text-sm">
                <Link href="/tos" className="link link-hover">
                  Terms of services
                </Link>
                <Link href="/privacy-policy" className="link link-hover">
                  Privacy policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

```

### components/BetterIcon.tsx

```tsx
import React from "react";

// A better way to illustrate with icons
// Pass any SVG icon as children (recommended width/height : w-6 h-6)
// By default, it's using your primary color for styling
const BetterIcon = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-primary/20 text-primary">
      {children}
    </div>
  );
};

export default BetterIcon;

```

### components/Testimonials11.tsx

```tsx
"use client";

import { JSX, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { StaticImageData } from "next/image";
import config from "@/config";

// Use this object to add an icon to the testimonial (optional) like the Product Hunt logo for instance.
// Only change the values if you add more referrings sites (currently Twitter & Product Hunt)
const refTypes: {
  productHunt: {
    id: string;
    ariaLabel: string;
    svg: JSX.Element;
  };
  twitter: {
    id: string;
    ariaLabel: string;
    svg: JSX.Element;
  };
  video: {
    id: string;
    ariaLabel?: null;
    svg?: null;
  };
  other: { id: string; ariaLabel?: null; svg?: null };
} = {
  productHunt: {
    id: "product_hunt",
    ariaLabel: "See user review on Product Hunt",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 26.245 26.256"
        className="w-[18px] h-[18px]"
      >
        <path
          d="M26.254 13.128c0 7.253-5.875 13.128-13.128 13.128S-.003 20.382-.003 13.128 5.872 0 13.125 0s13.128 5.875 13.128 13.128"
          fill="#da552f"
        />
        <path
          d="M14.876 13.128h-3.72V9.2h3.72c1.083 0 1.97.886 1.97 1.97s-.886 1.97-1.97 1.97m0-6.564H8.53v13.128h2.626v-3.938h3.72c2.538 0 4.595-2.057 4.595-4.595s-2.057-4.595-4.595-4.595"
          fill="#fff"
        />
      </svg>
    ),
  },
  twitter: {
    id: "twitter",
    ariaLabel: "See user post on Twitter",
    svg: (
      <svg
        className="w-5 h-5 fill-[#00aCee]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z"></path>
      </svg>
    ),
  },
  video: {
    id: "video",
  },
  other: { id: "other" },
};

// The list of your testimonials. It needs 11 items to fill the grid. The last one (11th) is featured on large devices (span 2 columns + big font)
const list: {
  username?: string;
  name: string;
  text: string;
  type?: (typeof refTypes)[keyof typeof refTypes];
  link?: string;
  img?: string | StaticImageData;
  videoPoster?: string;
  videoSrc?: string;
  videoWidth?: number;
  videoHeight?: number;
  videoType?: "video/ogg" | "video/mp4" | "video/webm";
}[] = [
  {
    // Show @username for social media like Twitter. Does not link anywhere but cool to display
    username: "marclou",
    name: "Marc Lou",
    text: "Really easy to use. The tutorials are really useful and explains how everything works. Hope to ship my next project really fast!",
    // use refTypes.other if you don't want to display an icon
    type: refTypes.twitter,
    // Link to the person's testimonial. It's more trustable
    link: "https://twitter.com/marc_louvion",
    // A statically imported image (usually from your public folder—recommended) or a link to the person's avatar. Shows a fallback letter if not provided
    img: "https://pbs.twimg.com/profile_images/1514863683574599681/9k7PqDTA_400x400.jpg",
    // You can display video testimonials to build more trust. Just swap the type above to "video" and add at least the video source below
    // videoSrc: "/jack.mp4"
  },
  {
    username: "the_mcnaveen",
    name: "Naveen",
    text: "Setting up everything from the ground up is a really hard, and time consuming process. What you pay for will save your time for sure.",
    type: refTypes.twitter,
    link: "https://twitter.com/the_mcnaveen",
  },
  {
    username: "wahab",
    name: "Wahab Shaikh",
    text: "Easily saves 15+ hrs for me setting up trivial stuff. Now, I can directly focus on shipping features rather than hours of setting up the same technologies from scratch. Feels like a super power! :D",
    type: refTypes.productHunt,
    link: "https://www.producthunt.com/products/shipfast-2/reviews?review=667971",
  },
  {
    name: "Sean",
    text: "Just purchased and cloned and *holy shit!* I realllyyy like what I'm seeing here!",
    type: refTypes.other,
  },
  {
    username: "krishna",
    name: "Krishna Kant",
    text: "Finally a good boilerplate for Nextjs, now I dont have to cry about it comparing with laravel ecosystem.",
    type: refTypes.productHunt,
    link: "https://www.producthunt.com/posts/shipfast-2?comment=2707061",
  },
  {
    username: "imgyf",
    name: "Yifan Goh",
    text: "It's a game changer  🚀 Comes with easy to follow tutorial, and saves you a ton of time. What's not to love?",
    type: refTypes.twitter,
    link: "https://twitter.com/imgyf/status/1697549891080532236?s=20",
  },
  {
    name: "Yazdun",
    text: "Yo Marc, I got the boilerplate, it's fantastic man you just save me 10 hours on each project",
    type: refTypes.other,
  },
  {
    name: "Marc Lou",
    text: "The tool is exactly what I didn't even know I needed.",
    videoPoster: "https://d1wkquwg5s1b04.cloudfront.net/demo/marcPoster.jpg",
    videoSrc: "https://d1wkquwg5s1b04.cloudfront.net/demo/marcVideo.mp4",
    videoHeight: 250,
    videoWidth: 500,
    type: refTypes.video,
  },
  {
    username: "zawwadx",
    name: "Zawwad Ul Sami",
    text: "It's an amazing minimalist, lightweight boilerplate with well-organized code. It has almost all the core features you would want in a SaaS boilerplate. As a new team last year it actually took us months to build a similar set of features at a stable level.",
    type: refTypes.twitter,
  },
  {
    username: "dan",
    name: "Dan Mindru",
    text: "Probably one of the most powerful things you can 'npm install' that I've seen",
    type: refTypes.productHunt,
    link: "https://www.producthunt.com/posts/shipfast-2?comment=2706763",
  },
  // The last testimonial is featured on big devices (span 2 columns + big font) 👇
  {
    username: "VicPivots",
    name: "Victor Abeledo",
    text: "Marc, I got your boilerplate and having the payments setup with Stripe + user auth is a blessing. This will save me like a week of work for each new side project I spin up. I appreciate that is well documented, as well. 100% worth it 🚀🚀🚀",
    type: refTypes.twitter,
    link: "https://twitter.com/VicPivots/status/1697352442986250413?s=20",
  },
];

// A single testimonial, to be rendered in  a list
const Testimonial = ({ i }: { i: number }) => {
  const testimonial = list[i];

  if (!testimonial) return null;

  if (testimonial.type === refTypes.video) {
    return <VideoTestimonial i={i} />;
  }

  return (
    <li key={i}>
      <figure className="relative h-full p-6 bg-base-100 rounded-lg">
        <blockquote className="relative">
          <p className="text-sm text-base-content/80">{testimonial.text}</p>
        </blockquote>
        <figcaption className="relative flex items-center justify-start gap-4 pt-4 mt-4 border-t border-base-content/5">
          <div className="overflow-hidden rounded-full bg-base-300 shrink-0">
            {testimonial.img ? (
              <Image
                className="w-10 h-10 rounded-full object-cover"
                src={list[i].img}
                alt={`${list[i].name}'s testimonial for ${config.appName}`}
                width={48}
                height={48}
              />
            ) : (
              <span className="w-10 h-10 rounded-full flex justify-center items-center text-lg font-medium bg-base-300">
                {testimonial.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="w-full flex items-end justify-between gap-2">
            <div>
              <div className="text-sm font-medium text-base-content">
                {testimonial.name}
              </div>
              {testimonial.username && (
                <div className="mt-0.5 text-sm text-base-content/80">
                  @{testimonial.username}
                </div>
              )}
            </div>

            {testimonial.link && testimonial.type?.svg && (
              <a
                href={testimonial.link}
                target="_blank"
                className="shrink-0 "
                aria-label={testimonial.type?.ariaLabel}
              >
                {testimonial.type?.svg}
              </a>
            )}
          </div>
        </figcaption>
      </figure>
    </li>
  );
};

// A video tesionial to build trust. 2 or 3 on a wall of love is perfect.
const VideoTestimonial = ({ i }: { i: number }) => {
  const vidRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (vidRef.current?.readyState != 0) {
      setIsLoading(false);
    }
  }, [vidRef?.current?.readyState]);

  const handlePlayVideo = () => {
    if (isPlaying) {
      vidRef.current.pause();
      setIsPlaying(false);
    } else {
      vidRef.current.play();
      setIsPlaying(true);

      if (vidRef.current?.readyState === 0) setIsLoading(true);
    }
  };

  const testimonial = list[i];

  if (!testimonial) return null;

  return (
    <li
      key={i}
      className="break-inside-avoid max-md:flex justify-center bg-base-100 rounded-lg overflow-hidden flex flex-col"
    >
      <div className="relative w-full">
        {isLoading && (
          <span className="z-40 !h-24 !w-24 !bg-gray-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 loading loading-ring"></span>
        )}
        <video
          className="w-full"
          ref={vidRef}
          poster={testimonial.videoPoster}
          preload="metadata"
          playsInline
          width={testimonial.videoWidth}
          height={testimonial.videoHeight}
          onLoadedData={() => {
            console.log("Video is loaded!");
            setIsLoading(false);
          }}
        >
          <source
            src={testimonial.videoSrc}
            type={testimonial.videoType || "video/mp4"}
          />
          Your browser does not support the videos
        </video>

        {!isPlaying && (
          <div className="absolute bottom-0 -inset-x-4 bg-gray-900/50 blur-lg h-24 translate-y-1/4 animate-opacity"></div>
        )}

        <div className="absolute w-full bottom-0 z-20">
          <div className="flex justify-between items-end p-4">
            <button
              className="group cursor-pointer"
              type="button"
              title="Play video"
              aria-label="Play video"
              onClick={handlePlayVideo}
            >
              {isPlaying ? (
                // PAUSE
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className=" w-14 h-14 fill-gray-50 group-hover:scale-[1.05] duration-100 ease-in drop-shadow-lg animate-opacity"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // PLAY
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-14 h-14 fill-gray-50 group-hover:scale-[1.05] duration-100 ease-in drop-shadow-lg animate-opacity"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {!isPlaying && (
              <div className="animate-opacity text-right">
                <p className="text-gray-50 font-medium drop-shadow">
                  {testimonial.name}
                </p>
                <div className="rating">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-accent drop-shadow"
                      key={i}
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-20 bg-accent text-accent-content text-base leading-tight font-medium p-4 select-none">
        <p>&quot;{testimonial.text}&quot;</p>
      </div>
    </li>
  );
};

const Testimonials11 = () => {
  return (
    <section className="bg-base-200" id="testimonials">
      <div className="py-24 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col text-center w-full mb-20">
          <div className="mb-8">
            <h2 className="sm:text-5xl text-4xl font-extrabold text-base-content">
              212 makers are already shipping faster!
            </h2>
          </div>
          <p className="lg:w-2/3 mx-auto leading-relaxed text-base text-base-content/80">
            Don&apos;t take our word for it. Here&apos;s what they have to say
            about {config.appName}.
          </p>
        </div>

        <ul
          role="list"
          className="grid max-w-2xl grid-cols-1 gap-6 mx-auto sm:gap-8 md:grid-cols-2 lg:max-w-none lg:grid-cols-4"
        >
          <li>
            <ul role="list" className="flex flex-col gap-y-6 sm:gap-y-8">
              {[...Array(3)].map((e, i) => (
                <Testimonial key={i} i={i} />
              ))}
            </ul>
          </li>

          <li className="hidden md:grid order-none md:order-first lg:order-none col-span-2 grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* BIG FEATURED TESTIMONIAL — THE LAST ONE IN THE LIST (11th) */}
            <ul className="col-span-2">
              <li>
                <figure className="relative h-full p-6 bg-base-100 rounded-lg">
                  <blockquote className="relative p-4">
                    <p className="text-lg font-medium text-base-content">
                      {list[list.length - 1].text}
                    </p>
                  </blockquote>
                  <figcaption className="relative flex items-center justify-start gap-4 pt-4 mt-4 border-t border-base-content/5">
                    <div className="overflow-hidden rounded-full bg-base-300 shrink-0">
                      {list[list.length - 1].img ? (
                        <Image
                          className="w-12 h-12 rounded-full object-cover"
                          src={list[list.length - 1].img}
                          alt={`${
                            list[list.length - 1].name
                          }'s testimonial for ${config.appName}`}
                          width={48}
                          height={48}
                        />
                      ) : (
                        <span className="w-12 h-12 rounded-full flex justify-center items-center text-xl font-medium bg-base-300">
                          {list[list.length - 1].name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-base font-medium text-base-content">
                        {list[list.length - 1].name}
                      </div>
                      {list[list.length - 1].username && (
                        <div className="mt-1 text-base text-base-content/80">
                          @{list[list.length - 1].username}
                        </div>
                      )}
                    </div>
                  </figcaption>
                </figure>
              </li>
            </ul>
            <ul role="list" className="flex flex-col gap-y-6 sm:gap-y-8">
              {[...Array(2)].map((e, i) => (
                <Testimonial key={i} i={i + 3} />
              ))}
            </ul>
            <ul role="list" className="flex flex-col gap-y-6 sm:gap-y-8">
              {[...Array(2)].map((e, i) => (
                <Testimonial key={i} i={i + 5} />
              ))}
            </ul>
          </li>
          <li>
            <ul role="list" className="flex flex-col gap-y-6 sm:gap-y-8">
              {[...Array(3)].map((e, i) => (
                <Testimonial key={i} i={i + 7} />
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Testimonials11;

```

### components/CTA.tsx

```tsx
import Image from "next/image";
import config from "@/config";

const CTA = () => {
  return (
    <section className="relative hero overflow-hidden min-h-screen">
      <Image
        src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80"
        alt="Background"
        className="object-cover w-full"
        fill
      />
      <div className="relative hero-overlay bg-neutral bg-opacity-70"></div>
      <div className="relative hero-content text-center text-neutral-content p-8">
        <div className="flex flex-col items-center max-w-xl p-8 md:p-0">
          <h2 className="font-bold text-3xl md:text-5xl tracking-tight mb-8 md:mb-12">
            Boost your app, launch, earn
          </h2>
          <p className="text-lg opacity-80 mb-12 md:mb-16">
            Don&apos;t waste time integrating APIs or designing a pricing
            section...
          </p>

          <button className="btn btn-primary btn-wide">
            Get {config.appName}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;

```

### components/Header.tsx

```tsx
"use client";

import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
import logo from "@/app/icon.png";
import config from "@/config";

const links: {
  href: string;
  label: string;
}[] = [
  {
    href: "/#pricing",
    label: "Pricing",
  },
  {
    href: "/#testimonials",
    label: "Reviews",
  },
  {
    href: "/#faq",
    label: "FAQ",
  },
];

const cta: JSX.Element = <ButtonSignin extraStyle="btn-primary" />;

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Get Started or Login) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
const Header = () => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // setIsOpen(false) when the route changes (i.e: when the user clicks on a link on mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [searchParams]);

  return (
    <header className="bg-base-200">
      <nav
        className="container flex items-center justify-between px-8 py-4 mx-auto"
        aria-label="Global"
      >
        {/* Your logo/name on large screens */}
        <div className="flex lg:flex-1">
          <Link
            className="flex items-center gap-2 shrink-0 "
            href="/"
            title={`${config.appName} homepage`}
          >
            <Image
              src={logo}
              alt={`${config.appName} logo`}
              className="w-8"
              placeholder="blur"
              priority={true}
              width={32}
              height={32}
            />
            <span className="font-extrabold text-lg">{config.appName}</span>
          </Link>
        </div>
        {/* Burger button to open menu on mobile */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-base-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Your links on large screens */}
        <div className="hidden lg:flex lg:justify-center lg:gap-12 lg:items-center">
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="link link-hover"
              title={link.label}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA on large screens */}
        <div className="hidden lg:flex lg:justify-end lg:flex-1">{cta}</div>
      </nav>

      {/* Mobile menu, show/hide based on menu state. */}
      <div className={`relative z-50 ${isOpen ? "" : "hidden"}`}>
        <div
          className={`fixed inset-y-0 right-0 z-10 w-full px-8 py-4 overflow-y-auto bg-base-200 sm:max-w-sm sm:ring-1 sm:ring-neutral/10 transform origin-right transition ease-in-out duration-300`}
        >
          {/* Your logo/name on small screens */}
          <div className="flex items-center justify-between">
            <Link
              className="flex items-center gap-2 shrink-0 "
              title={`${config.appName} homepage`}
              href="/"
            >
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                className="w-8"
                placeholder="blur"
                priority={true}
                width={32}
                height={32}
              />
              <span className="font-extrabold text-lg">{config.appName}</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Your links on small screens */}
          <div className="flow-root mt-6">
            <div className="py-4">
              <div className="flex flex-col gap-y-4 items-start">
                {links.map((link) => (
                  <Link
                    href={link.href}
                    key={link.href}
                    className="link link-hover"
                    title={link.label}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="divider"></div>
            {/* Your CTA on small screens */}
            <div className="flex flex-col">{cta}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

```

### components/ButtonGradient.tsx

```tsx
"use client";

import React from "react";

const ButtonGradient = ({
  title = "Gradient Button",
  onClick = () => {},
}: {
  title?: string;
  onClick?: () => void;
}) => {
  return (
    <button className="btn btn-gradient animate-shimmer" onClick={onClick}>
      {title}
    </button>
  );
};

export default ButtonGradient;

```

### components/ButtonCheckout.tsx

```tsx
"use client";

import { useState } from "react";
import apiClient from "@/libs/api";
import config from "@/config";

// This component is used to create Stripe Checkout Sessions
// It calls the /api/stripe/create-checkout route with the priceId, successUrl and cancelUrl
// Users must be authenticated. It will prefill the Checkout data with their email and/or credit card (if any)
// You can also change the mode to "subscription" if you want to create a subscription instead of a one-time payment
const ButtonCheckout = ({
  priceId,
  mode = "payment",
}: {
  priceId: string;
  mode?: "payment" | "subscription";
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      const { url }: { url: string } = await apiClient.post(
        "/stripe/create-checkout",
        {
          priceId,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
          mode,
        }
      );

      window.location.href = url;
    } catch (e) {
      console.error(e);
    }

    setIsLoading(false);
  };

  return (
    <button
      className="btn btn-primary btn-block group"
      onClick={() => handlePayment()}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <svg
          className="w-5 h-5 fill-primary-content group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-200"
          viewBox="0 0 375 509"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M249.685 14.125C249.685 11.5046 248.913 8.94218 247.465 6.75675C246.017 4.57133 243.957 2.85951 241.542 1.83453C239.126 0.809546 236.463 0.516683 233.882 0.992419C231.301 1.46815 228.917 2.69147 227.028 4.50999L179.466 50.1812C108.664 118.158 48.8369 196.677 2.11373 282.944C0.964078 284.975 0.367442 287.272 0.38324 289.605C0.399039 291.938 1.02672 294.226 2.20377 296.241C3.38082 298.257 5.06616 299.929 7.09195 301.092C9.11775 302.255 11.4133 302.867 13.75 302.869H129.042V494.875C129.039 497.466 129.791 500.001 131.205 502.173C132.62 504.345 134.637 506.059 137.01 507.106C139.383 508.153 142.01 508.489 144.571 508.072C147.131 507.655 149.516 506.503 151.432 504.757L172.698 485.394C247.19 417.643 310.406 338.487 359.975 250.894L373.136 227.658C374.292 225.626 374.894 223.327 374.882 220.99C374.87 218.653 374.243 216.361 373.065 214.341C371.887 212.322 370.199 210.646 368.17 209.482C366.141 208.318 363.841 207.706 361.5 207.707H249.685V14.125Z" />
        </svg>
      )}
      Get {config?.appName}
    </button>
  );
};

export default ButtonCheckout;

```

### components/Modal.tsx

```tsx
"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

import React from "react";

interface ModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// A simple modal component which can be shown/hidden with a boolean and a function
// Because of the setIsModalOpen function, you can't use it in a server component.
const Modal = ({ isModalOpen, setIsModalOpen }: ModalProps) => {
  return (
    <Transition appear show={isModalOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => setIsModalOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-focus bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full overflow-hidden items-start md:items-center justify-center p-2">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-3xl h-full overflow-visible transform text-left align-middle shadow-xl transition-all rounded-xl bg-base-100 p-6 md:p-8">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h2" className="font-semibold">
                    I&apos;m a modal
                  </Dialog.Title>
                  <button
                    className="btn btn-square btn-ghost btn-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>

                <section>And here is my content</section>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;

```

### components/FAQ.tsx

```tsx
"use client";

import { useRef, useState } from "react";
import type { JSX } from "react";

// <FAQ> component is a lsit of <Item> component
// Just import the FAQ & add your FAQ content to the const faqList arrayy below.

interface FAQItemProps {
  question: string;
  answer: JSX.Element;
}

const faqList: FAQItemProps[] = [
  {
    question: "What do I get exactly?",
    answer: <div className="space-y-2 leading-relaxed">Loreum Ipseum</div>,
  },
  {
    question: "Can I get a refund?",
    answer: (
      <p>
        Yes! You can request a refund within 7 days of your purchase. Reach out
        by email.
      </p>
    ),
  },
  {
    question: "I have another question",
    answer: (
      <div className="space-y-2 leading-relaxed">Cool, contact us by email</div>
    ),
  },
];

const FaqItem = ({ item }: { item: FAQItemProps }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto fill-current`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{item?.answer}</div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    <section className="bg-base-200" id="faq">
      <div className="py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">FAQ</p>
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently Asked Questions
          </p>
        </div>

        <ul className="basis-1/2">
          {faqList.map((item, i) => (
            <FaqItem key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;

```

### components/Problem.tsx

```tsx
const Arrow = ({ extraStyle }: { extraStyle: string }) => {
  return (
    <svg
      className={`shrink-0 w-12 fill-neutral-content opacity-70 ${extraStyle}`}
      viewBox="0 0 138 138"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M72.9644 5.31431C98.8774 43.8211 83.3812 88.048 54.9567 120.735C54.4696 121.298 54.5274 122.151 55.0896 122.639C55.6518 123.126 56.5051 123.068 56.9922 122.506C86.2147 88.9044 101.84 43.3918 75.2003 3.80657C74.7866 3.18904 73.9486 3.02602 73.3287 3.44222C72.7113 3.85613 72.5484 4.69426 72.9644 5.31431Z"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M56.5084 121.007C56.9835 118.685 57.6119 115.777 57.6736 115.445C59.3456 106.446 59.5323 97.67 58.4433 88.5628C58.3558 87.8236 57.6824 87.2948 56.9433 87.3824C56.2042 87.4699 55.6756 88.1435 55.7631 88.8828C56.8219 97.7138 56.6432 106.225 55.0203 114.954C54.926 115.463 53.5093 121.999 53.3221 123.342C53.2427 123.893 53.3688 124.229 53.4061 124.305C53.5887 124.719 53.8782 124.911 54.1287 125.015C54.4123 125.13 54.9267 125.205 55.5376 124.926C56.1758 124.631 57.3434 123.699 57.6571 123.487C62.3995 120.309 67.4155 116.348 72.791 113.634C77.9171 111.045 83.3769 109.588 89.255 111.269C89.9704 111.475 90.7181 111.057 90.9235 110.342C91.1288 109.626 90.7117 108.878 89.9963 108.673C83.424 106.794 77.3049 108.33 71.5763 111.223C66.2328 113.922 61.2322 117.814 56.5084 121.007Z"
        />
      </g>
    </svg>
  );
};
const Step = ({ emoji, text }: { emoji: string; text: string }) => {
  return (
    <div className="w-full md:w-48 flex flex-col gap-2 items-center justify-center">
      <span className="text-4xl">{emoji}</span>
      <h3 className="font-bold">{text}</h3>
    </div>
  );
};

// Problem Agitation: A crucial, yet overlooked, component for a landing page that sells.
// It goes under your Hero section, and above your Features section.
// Your Hero section makes a promise to the customer: "Our product will help you achieve XYZ".
// Your Problem section explains what happens to the customer if its problem isn't solved.
// The copy should NEVER mention your product. Instead, it should dig the emotional outcome of not fixing a problem.
// For instance:
// - Hero: "ShipFast helps developers launch startups fast"
// - Problem Agitation: "Developers spend too much time adding features, get overwhelmed, and quit." (not about ShipFast at all)
// - Features: "ShipFast has user auth, Stripe, emails all set up for you"
const Problem = () => {
  return (
    <section className="bg-neutral text-neutral-content">
      <div className="max-w-7xl mx-auto px-8 py-16 md:py-32 text-center">
        <h2 className="max-w-3xl mx-auto font-extrabold text-4xl md:text-5xl tracking-tight mb-6 md:mb-8">
          80% of startups fail because founders never launch
        </h2>
        <p className="max-w-xl mx-auto text-lg opacity-90 leading-relaxed mb-12 md:mb-20">
          Emails, DNS records, user authentication... There&apos;s so much going
          on.
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-6">
          <Step emoji="🧑‍💻" text="8 hrs to add Stripe" />

          <Arrow extraStyle="max-md:-scale-x-100 md:-rotate-90" />

          <Step emoji="😮‍💨" text="Struggle to find time" />

          <Arrow extraStyle="md:-scale-x-100 md:-rotate-90" />

          <Step emoji="😔" text="Quit project" />
        </div>
      </div>
    </section>
  );
};

export default Problem;

```

### components/Testimonials1.tsx

```tsx
import Image from "next/image";

// A beautiful single testimonial with a user name and and company logo logo
const Testimonial = () => {
  return (
    <section
      className="relative isolate overflow-hidden bg-base-100 px-8 py-24 sm:py-32"
      id="testimonials"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.base-300),theme(colors.base-100))] opacity-20" />
      <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-base-100 shadow-lg ring-1 ring-base-content/10 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
      <div className="mx-auto max-w-2xl lg:max-w-5xl">
        <figure className="mt-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="relative rounded-xl border border-base-content/5 bg-base-content/5 p-1.5 sm:-rotate-1">
              <Image
                width={320}
                height={320}
                className="rounded-lg max-w-[320px] md:max-w-[280px] lg:max-w-[320px] object-center border-2 border-white/10 shadow-md"
                // Ideally, load from a statically generated image for better SEO performance (import userImage from "@/public/userImage.png")
                // If you're using a static image, add placeholder="blur"
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2488&q=80"
                alt="A testimonial from a happy customer"
              />
            </div>

            <div>
              <blockquote className="text-xl font-medium leading-8 text-base-content sm:text-2xl sm:leading-10">
                I got your boilerplate and having the payments setup with Stripe
                + user auth is a blessing. This will save me like a week of work
                for each new side project I spin up. I appreciate that is well
                documented, as well. 100% worth it!
              </blockquote>
              <figcaption className="mt-10 flex items-center justify-start gap-5">
                <div className="text-base">
                  <div className="font-semibold text-base-content mb-0.5">
                    Amanda Lou
                  </div>
                  <div className="text-base-content/60">
                    Indie Maker &amp; Developer
                  </div>
                </div>

                <Image
                  width={150}
                  height={50}
                  className="w-20 md:w-24"
                  // Ideally, load from a statically generated image for better SEO performance (import userImage from "@/public/userImage.png")
                  src="https://logos-world.net/wp-content/uploads/2020/10/Reddit-Logo.png"
                  alt="Reddit logo"
                />
              </figcaption>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
};

export default Testimonial;

```

### components/Testimonials3.tsx

```tsx
import Image from "next/image";
import { StaticImageData } from "next/image";
import config from "@/config";

// The list of your testimonials. It needs 3 items to fill the row.
const list: {
  username?: string;
  name: string;
  text: string;
  img?: string | StaticImageData;
}[] = [
  {
    // Optional, use for social media like Twitter. Does not link anywhere but cool to display
    username: "marclou",
    // REQUIRED
    name: "Marc Lou",
    // REQUIRED
    text: "Really easy to use. The tutorials are really useful and explains how everything works. Hope to ship my next project really fast!",
    // Optional, a statically imported image (usually from your public folder—recommended) or a link to the person's avatar. Shows a fallback letter if not provided
    img: "https://pbs.twimg.com/profile_images/1514863683574599681/9k7PqDTA_400x400.jpg",
  },
  {
    username: "the_mcnaveen",
    name: "Naveen",
    text: "Setting up everything from the ground up is a really hard, and time consuming process. What you pay for will save your time for sure.",
  },
  {
    username: "wahab",
    name: "Wahab Shaikh",
    text: "Easily saves 15+ hrs for me setting up trivial stuff. Now, I can directly focus on shipping features rather than hours of setting up the same technologies from scratch. Feels like a super power! :D",
  },
];

// A single testimonial, to be rendered in  a list
const Testimonial = ({ i }: { i: number }) => {
  const testimonial = list[i];

  if (!testimonial) return null;

  return (
    <li key={i}>
      <figure className="relative max-w-lg h-full p-6 md:p-10 bg-base-200 rounded-2xl max-md:text-sm flex flex-col">
        <blockquote className="relative flex-1">
          <p className="text-base-content/80 leading-relaxed">
            {testimonial.text}
          </p>
        </blockquote>
        <figcaption className="relative flex items-center justify-start gap-4 pt-4 mt-4 md:gap-8 md:pt-8 md:mt-8 border-t border-base-content/5">
          <div className="w-full flex items-center justify-between gap-2">
            <div>
              <div className="font-medium text-base-content md:mb-0.5">
                {testimonial.name}
              </div>
              {testimonial.username && (
                <div className="mt-0.5 text-sm text-base-content/80">
                  @{testimonial.username}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-full bg-base-300 shrink-0">
              {testimonial.img ? (
                <Image
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                  src={list[i].img}
                  alt={`${list[i].name}'s testimonial for ${config.appName}`}
                  width={48}
                  height={48}
                />
              ) : (
                <span className="w-10 h-10 md:w-12 md:h-12 rounded-full flex justify-center items-center text-lg font-medium bg-base-300">
                  {testimonial.name.charAt(0)}
                </span>
              )}
            </div>
          </div>
        </figcaption>
      </figure>
    </li>
  );
};

const Testimonials3 = () => {
  return (
    <section id="testimonials">
      <div className="py-24 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col text-center w-full mb-20">
          <div className="mb-8">
            <h2 className="sm:text-5xl text-4xl font-extrabold text-base-content">
              212 makers are already shipping faster!
            </h2>
          </div>
          <p className="lg:w-2/3 mx-auto leading-relaxed text-base text-base-content/80">
            Don&apos;t take our word for it. Here&apos;s what they have to say
            about ShipFast.
          </p>
        </div>

        <ul
          role="list"
          className="flex flex-col items-center lg:flex-row lg:items-stretch gap-6 lg:gap-8"
        >
          {[...Array(3)].map((e, i) => (
            <Testimonial key={i} i={i} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Testimonials3;

```

