# Database Organization

This directory contains all database-related files organized into logical components for better maintainability.

## Directory Structure

```
database/
├── README.md                   # This file
├── schema/                     # Database schema files
│   ├── 01_extensions.sql       # PostgreSQL extensions
│   ├── 02_types_enums.sql      # Custom types and enums
│   ├── 03_core_tables.sql      # Core quiz and question tables
│   ├── 04_question_types.sql   # Question type specific tables
│   ├── 05_user_progress.sql    # User progress tracking
│   ├── 06_spaced_repetition.sql # Spaced repetition tables
│   └── 07_permissions.sql      # RLS policies and permissions
├── functions/                  # Database functions
│   ├── 01_utility_functions.sql # Utility functions (timestamps, etc.)
│   ├── 02_sm2_algorithm.sql    # SM-2 spaced repetition functions
│   ├── 03_triggers.sql         # Database triggers
│   └── 04_analytics.sql        # Analytics and reporting functions
├── migrations/                 # Migration scripts
│   ├── 001_fix_order_correct_order_schema.sql
│   ├── 002_spaced_repetition_schema.sql
│   └── README.md
└── seed/                       # Seed data (if any)
    └── README.md
```

## Setup Instructions

### Initial Database Setup
To set up the database from scratch, run the schema files in order:

```bash
# 1. Run schema files in order
psql -f database/schema/01_extensions.sql
psql -f database/schema/02_types_enums.sql
psql -f database/schema/03_core_tables.sql
psql -f database/schema/04_question_types.sql
psql -f database/schema/05_user_progress.sql
psql -f database/schema/06_spaced_repetition.sql
psql -f database/schema/07_permissions.sql

# 2. Run function files in order
psql -f database/functions/01_utility_functions.sql
psql -f database/functions/02_sm2_algorithm.sql
psql -f database/functions/03_triggers.sql
psql -f database/functions/04_analytics.sql
```

### Migration Updates
For existing databases, use the migration files:

```bash
# Run migrations in order
psql -f database/migrations/001_fix_order_correct_order_schema.sql
psql -f database/migrations/002_spaced_repetition_schema.sql
```

## Features

### Core Quiz System
- **Quizzes**: Quiz metadata and configuration
- **Questions**: Question content and metadata
- **Question Types**: Support for 7 different question types:
  - `drag_and_drop`: Drag items to targets
  - `dropdown_selection`: Select from dropdowns
  - `multi`: Multiple choice (multiple answers)
  - `single_selection`: Single choice
  - `order`: Order items in sequence
  - `yes_no`: Simple yes/no questions
  - `yesno_multi`: Multiple yes/no statements

### User Progress Tracking
- **User Quiz Progress**: Track user progress through quizzes
- **Question Responses**: Detailed response logging
- **Performance Analytics**: Response time, confidence levels

### Spaced Repetition System
- **SM-2 Algorithm**: Implements the SuperMemo SM-2 algorithm
- **User Question Performance**: Track learning progress per question
- **Adaptive Quiz Sessions**: Intelligent question selection
- **Review Scheduling**: Automatic scheduling of review questions

### Security
- **Row Level Security (RLS)**: All user data is protected
- **User Isolation**: Users can only access their own data
- **Proper Permissions**: Granular access control

## Database Schema Overview

### Core Tables
- `quizzes` - Quiz metadata
- `questions` - Question content and configuration
- `user_quiz_progress` - User progress through quizzes

### Question Type Tables
Each question type has dedicated tables for options and correct answers.

### Spaced Repetition Tables
- `question_responses` - Detailed response logging
- `user_question_performance` - SM-2 algorithm data per user/question
- `adaptive_quiz_sessions` - Session management for adaptive quizzes

### Key Functions
- `fn_calculate_sm2_review_details()` - Core SM-2 algorithm
- `calculate_next_review_date()` - Wrapper for easier SM-2 calculations
- `get_questions_due_for_review()` - Retrieve questions for spaced repetition
- `get_user_spaced_repetition_stats()` - User progress analytics

## Performance Optimizations

- Comprehensive indexing strategy
- Optimized queries for review question retrieval
- Efficient composite indexes for common query patterns
- Partial indexes for specific use cases

## Migration Status

✅ **Core Schema**: Fully implemented and tested
✅ **Spaced Repetition**: Complete SM-2 algorithm implementation
✅ **Question Types**: All 7 question types supported
✅ **User Progress**: Comprehensive tracking system
✅ **Security**: RLS policies implemented
✅ **Performance**: Optimized indexes in place
✅ **Azure A102 Data**: Successfully migrated (147 questions)
