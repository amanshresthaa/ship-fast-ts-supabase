# Quiz Data Migration

This folder contains the database migration scripts for the quiz application.

## Files

- `supabase_database.sql` - Complete database schema with tables, indexes, and constraints
- `migrate-quiz-data.js` - Node.js script to migrate Azure AI-102 quiz data from JSON files to Supabase
- `migrate-project-management.js` - Node.js script to migrate Project Management quiz data to Supabase
- `apply-schema.js` - Helper script to test database connection and verify schema
- `verify-migration.js` - Script to verify all quiz migrations

## Migration Results

✅ **Multiple Quiz Migrations Completed Successfully!**

### Quiz 1: Azure AI-102 Engineer Associate
- **Quiz ID**: azure-a102
- **Quiz Title**: Azure AI-102: AI Engineer Associate Practice Quiz
- **Total Questions**: 147
- **Question Types**:
  - drag_and_drop: 9 questions
  - dropdown_selection: 4 questions
  - multi: 24 questions
  - order: 19 questions
  - single_selection: 67 questions
  - yes_no: 17 questions
  - yesno_multi: 7 questions

### Quiz 2: Project Management Professional (PMP)
- **Quiz ID**: project-management
- **Quiz Title**: Project Management Professional (PMP) Agile Practice Quiz
- **Total Questions**: 235
- **Question Types**:
  - yes_no: 114 questions
  - single_selection: 69 questions
  - multi: 52 questions

### Combined Database Stats
- ✅ **Total Quizzes**: 2
- ✅ **Total Questions**: 382
- ✅ **Question Types Supported**: 7 different types

### Database Tables Populated
- ✅ quizzes (2 records)
- ✅ questions (382 records)
- ✅ drag_and_drop_targets (21 records)
- ✅ drag_and_drop_options (39 records)
- ✅ drag_and_drop_correct_pairs (21 records)
- ✅ dropdown_selection_options (28 records)
- ✅ dropdown_selection_targets (9 records)
- ✅ multi_options (409 records)
- ✅ multi_correct_answers (253 records)
- ✅ single_selection_options (543 records)
- ✅ single_selection_correct_answer (111 records)
- ✅ order_items (107 records)
- ✅ order_correct_order (60 records)
- ✅ yes_no_answer (131 records)
- ✅ yesno_multi_statements (23 records)
- ✅ yesno_multi_correct_answers (23 records)

## Usage

### To run Azure quiz migration:
```bash
cd migration
node migrate-quiz-data.js
```

### To run Project Management quiz migration:
```bash
cd migration
node migrate-project-management.js
```

### To verify all migrations:
```bash
cd migration
node verify-migration.js
```

### To test database connection:
```bash
cd migration
node apply-schema.js
```

## Log Files

Migration logs are stored in the `logs/` directory with timestamps for debugging and audit purposes.

## Environment Variables Required

Make sure these are set in your `.env` file:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Next Steps

Both quizzes are now ready for use in the application. You can:

1. Test the quiz functionality through the web interface
2. Run the quiz API endpoints
3. Add additional quizzes by following the same migration pattern
4. Test both Azure and Project Management quiz types

## Migration Date

Last successful migration: June 9, 2025

## Notes

- The Project Management quiz required question type normalization (single → single_selection, multi_select → multi, single_select → single_selection)
- Both quizzes support different question type combinations
- Total migration time: < 5 minutes for both quizzes
