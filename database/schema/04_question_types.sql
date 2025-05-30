-- Question Type Specific Tables
-- This file contains all tables for different question types

-- ------------------------------------------------------------------
-- DRAG AND DROP QUESTION TYPE
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drag_and_drop_targets (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  target_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, target_id)
);

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
-- DROPDOWN SELECTION QUESTION TYPE
-- ------------------------------------------------------------------
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
-- MULTI-SELECT QUESTION TYPE
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
    REFERENCES public.multi_options(question_id, option_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- SINGLE SELECTION QUESTION TYPE
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
    REFERENCES public.single_selection_options(question_id, option_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- ORDER QUESTION TYPE
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (question_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.order_correct_order (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  position    INTEGER NOT NULL CHECK (position >= 1),
  PRIMARY KEY (question_id, item_id), -- Ensures each item has only one position
  UNIQUE (question_id, position),      -- Ensures each position is used only once per question
  FOREIGN KEY (question_id, item_id)
    REFERENCES public.order_items(question_id, item_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- YES/NO QUESTION TYPE
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yes_no_answer (
  question_id    UUID REFERENCES public.questions(id) ON DELETE CASCADE PRIMARY KEY,
  correct_answer BOOLEAN NOT NULL
);

-- ------------------------------------------------------------------
-- YES/NO MULTI QUESTION TYPE
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
    REFERENCES public.yesno_multi_statements(question_id, statement_id) ON DELETE CASCADE
);
