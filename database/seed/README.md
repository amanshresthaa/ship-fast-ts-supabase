# Seed Data

This directory is reserved for seed data files that populate the database with initial content.

## Current Status

The database currently contains migrated Azure A102 quiz data:
- **147 questions** successfully migrated from Azure A102 certification
- Questions include various types: single_selection, multi, drag_and_drop, etc.
- All questions properly categorized with difficulty levels and topics

## Seed Data Structure

If you need to add seed data in the future, organize files as:

```
seed/
├── README.md           # This file
├── quizzes.sql         # Quiz metadata seed data
├── questions/          # Question data by topic
│   ├── azure-a102.sql  # Azure A102 questions (already migrated)
│   └── other-topics.sql
└── users/              # Test user data (if needed)
    └── test_users.sql
```

## Notes

- The Azure A102 data has already been migrated and is available in the production database
- No additional seed files are currently needed
- All migrated questions are properly configured for spaced repetition functionality
