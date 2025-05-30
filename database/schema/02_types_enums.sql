-- Custom Types and Enums
-- This file contains all custom PostgreSQL types and enums used in the application

-- Question type enumeration
CREATE TYPE question_type AS ENUM (
  'drag_and_drop',
  'dropdown_selection',
  'multi',
  'single_selection',
  'order',
  'yes_no',
  'yesno_multi'
);

-- Difficulty level enumeration
CREATE TYPE difficulty AS ENUM ('easy','medium','hard');
