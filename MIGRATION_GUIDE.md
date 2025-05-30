# Quiz Data Migration Guide

## Overview
This guide will help you migrate your Azure A102 quiz data into your Supabase database. We've created enhanced migration tools that include data validation, cleanup, and comprehensive error handling.

## Prerequisites

### 1. Database Schema
Make sure your database schema is applied first:
```bash
# Apply the fixed schema to your Supabase database
# Copy the contents of supabase_database.sql and run it in your Supabase SQL editor
```

### 2. Environment Variables
Update your `.env` file with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Migration Tools Available

### 1. Data Validation Tool (`validate-quiz-data.js`)
Validates and optionally fixes issues in your quiz JSON files.

**Features:**
- Validates question structure and completeness
- Identifies missing required fields
- Can automatically fix common issues
- Generates detailed validation reports
- Filters out incomplete questions

**Usage:**
```bash
# Validate data and generate report
npm run validate-quiz

# Validate and automatically fix issues
npm run validate-and-fix

# Or run directly
node validate-quiz-data.js --report
node validate-quiz-data.js --fix --report
```

### 2. Enhanced Migration Tool (`enhanced-migrate-quiz-data.js`)
Migrates your quiz data to the database with comprehensive error handling.

**Features:**
- Data validation before migration
- Graceful handling of incomplete data
- Dry-run mode for testing
- Comprehensive logging
- Progress tracking
- Support for all question types

**Usage:**
```bash
# Test migration without writing to database
npm run migrate-dry-run

# Run actual migration
npm run migrate-quiz

# Or run directly
node enhanced-migrate-quiz-data.js --dry-run
node enhanced-migrate-quiz-data.js
```

### 3. Legacy Migration Tool (`migrate-quiz-data.js`)
The original migration script (backup option).

## Step-by-Step Migration Process

### Step 1: Prepare Your Environment
```bash
# Ensure all dependencies are installed
npm install

# Set up migration environment
npm run setup-migration
```

### Step 2: Validate Your Data
```bash
# Check for data issues
npm run validate-quiz
```

Review the validation report in `logs/validation-report.json`. If issues are found, you can:

```bash
# Automatically fix common issues
npm run validate-and-fix
```

### Step 3: Test Migration
```bash
# Run dry-run to test migration without writing to database
npm run migrate-dry-run
```

This will:
- Validate your database connection
- Process all question files
- Show what would be migrated
- Identify any remaining issues

### Step 4: Run Migration
```bash
# Run the actual migration
npm run migrate-quiz
```

## Current Data Status

Based on your quiz files, here's what we have:

### Quiz Metadata ✅
- **Quiz ID:** azure-a102
- **Title:** Azure AI Engineer A102 Practice Quiz
- **Description:** Covers implementation and management of Azure AI services
- **Total Question Types:** 7 different types

### Question Files Status
1. **Drag & Drop** (clean_drag_and_drop_questions.json) - ✅ Complete
2. **Dropdown Selection** (clean_dropdown_selection_questions.json) - ✅ Complete  
3. **Multi Choice** (clean_multi_questions.json) - ✅ Complete
4. **Single Selection** (clean_single_selection_questions.json) - ✅ Complete
5. **Order** (clean_order_questions.json) - ✅ Complete
6. **Yes/No** (clean_yes_no_questions.json) - ✅ Complete
7. **Yes/No Multi** (clean_yesno_multi_questions.json) - ✅ Complete

### Known Issues (Automatically Handled)
- Some questions have incomplete data structures
- Some questions are missing required fields
- The enhanced migration tool filters these out automatically

## Database Tables That Will Be Populated

### Core Tables
- `quizzes` - Quiz metadata
- `questions` - Base question data

### Question-Specific Tables
- `drag_and_drop_targets`, `drag_and_drop_options`, `drag_and_drop_correct_pairs`
- `dropdown_selection_options`, `dropdown_selection_targets`
- `multi_options`, `multi_correct_answers`
- `single_selection_options`, `single_selection_correct_answer`
- `order_items`, `order_correct_order`
- `yes_no_answer`
- `yesno_multi_statements`, `yesno_multi_correct_answers`

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your `.env` file has correct Supabase credentials
   - Verify your service role key has the right permissions

2. **Schema Errors**
   - Ensure `supabase_database.sql` has been applied to your database
   - Check that all tables exist with correct column names

3. **Data Validation Errors**
   - Run `npm run validate-and-fix` to automatically fix common issues
   - Check the logs for specific error details

4. **Missing Questions After Migration**
   - Some questions may have been filtered out due to incomplete data
   - Check the migration logs to see which questions were skipped

### Log Files
All operations create detailed log files in the `logs/` directory:
- `migration-[timestamp].log` - Migration logs
- `validation-report.json` - Data validation results

## Migration Command Reference

```bash
# Setup and validation
npm run setup-migration     # Prepare environment
npm run validate-quiz       # Validate data only
npm run validate-and-fix    # Fix and validate data

# Migration
npm run migrate-dry-run     # Test migration
npm run migrate-quiz        # Run migration
npm run migrate-legacy      # Use original script

# Direct commands
node setup-migration.js
node validate-quiz-data.js --report --fix
node enhanced-migrate-quiz-data.js --dry-run
node enhanced-migrate-quiz-data.js
```

## What's Next After Migration

1. **Verify Data:** Check your Supabase database to confirm all data migrated correctly
2. **Test Quiz Functionality:** Use your quiz application to test question display and answering
3. **Performance:** The migration includes indexes for optimal query performance
4. **Spaced Repetition:** Your schema includes spaced repetition features for adaptive learning

## Need Help?

If you encounter issues:
1. Check the log files in the `logs/` directory
2. Run validation with `--report` flag for detailed analysis
3. Use `--dry-run` mode to test without writing to database
4. Check that your database schema matches the expected structure

The enhanced migration tools are designed to handle edge cases gracefully and provide detailed feedback about what's happening during the migration process.
