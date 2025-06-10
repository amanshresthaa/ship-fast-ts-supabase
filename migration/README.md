# 🗄️ Supabase Quiz Migration Suite

A comprehensive migration system for migrating quiz data from JSON files to Supabase database.

## 📁 Directory Structure

```
migration/
├── 🚀 migrate.js                    # Main migration runner
├── 📖 README.md                     # This documentation
│
├── 📂 config/                       # Configuration files
│   └── migration.config.js          # Migration settings & quiz definitions
│
├── 📂 data/                         # Quiz data (copied from app/data)
│   └── quizzes/                     # Quiz JSON files
│       ├── azure-a102/              # Azure AI-102 quiz data
│       └── project-management/      # Project Management quiz data
│
├── 📂 schemas/                      # Database schema files
│   └── supabase_database.sql        # Complete database schema
│
├── 📂 scripts/                      # Migration scripts
│   ├── apply-schema.js              # Schema application & verification
│   ├── migrate-quiz-data.js         # Azure AI-102 quiz migration
│   ├── migrate-project-management.js # Project Management quiz migration
│   ├── verify-migration.js          # Data verification & validation
│   └── migration-summary.js         # Comprehensive migration report
│
├── 📂 utils/                        # Common utilities
│   └── database.js                  # Database connection & utility functions
│
└── 📂 logs/                         # Migration execution logs
    └── [timestamp-based logs]       # Detailed execution logs
```

## 🚀 Quick Start

### 1. Run Complete Migration
```bash
# Run all migration steps
node migration/migrate.js

# Or navigate to migration directory
cd migration && node migrate.js
```

### 2. Run Specific Operations
```bash
# Only verify existing data
node migrate.js --verify-only

# Only generate summary report
node migrate.js --summary-only

# Show help
node migrate.js --help
```

### 3. Run Individual Scripts
```bash
cd migration

# 1. Check/apply database schema
node scripts/apply-schema.js

# 2. Migrate Azure AI-102 quiz
node scripts/migrate-quiz-data.js

# 3. Migrate Project Management quiz
node scripts/migrate-project-management.js

# 4. Verify all migrations
node scripts/verify-migration.js

# 5. Generate summary report
node scripts/migration-summary.js
```

## 📊 Migration Results

### ✅ Successfully Migrated Quizzes

1. **Azure AI-102: AI Engineer Associate Practice Quiz**
   - **ID**: azure-a102
   - **Questions**: 147 total
   - **Types**: 7 question types
     - `drag_and_drop`: 9 questions
     - `dropdown_selection`: 4 questions
     - `multi`: 24 questions
     - `order`: 19 questions
     - `single_selection`: 67 questions
     - `yes_no`: 17 questions
     - `yesno_multi`: 7 questions

2. **Project Management Professional (PMP) Agile Practice Quiz**
   - **ID**: project-management
   - **Questions**: 235 total
   - **Types**: 3 question types
     - `yes_no`: 114 questions
     - `single_selection`: 69 questions
     - `multi`: 52 questions

### 📈 Database Statistics
- **Total Questions**: 382
- **Total Quizzes**: 2
- **Question Types**: 7 unique types
- **Database Tables**: 15 tables with full relational structure

## ⚙️ Configuration

The migration system is configured through `config/migration.config.js`:

### Quiz Data Sources
- **Azure AI-102**: Uses `quiz_metadata.json` + `clean_*.json` files
- **Project Management**: Uses multiple `topic-*.json` files

### Question Type Normalization
The system automatically normalizes question types:
- `single` → `single_selection`
- `single_select` → `single_selection`
- `multi_select` → `multi`
- `true_false` → `yes_no`
- `drag_drop` → `drag_and_drop`
- `ordering` → `order`

## 🔧 Technical Details

### Environment Requirements
- Node.js with required packages: `@supabase/supabase-js`, `fs-extra`, `uuid`, `dotenv`
- Supabase project with proper environment variables in `.env`
- Database schema applied (handled automatically)

### Database Schema
The system uses a comprehensive relational schema with:
- `quizzes` - Quiz metadata
- `questions` - Question base data
- Specialized tables for each question type (e.g., `single_selection_options`, `drag_and_drop_targets`)
- Automatic timestamp triggers for audit trails

### Data Validation
- Comprehensive validation during migration
- Verification scripts to ensure data integrity
- Error logging and rollback capabilities
- Detailed migration reports

## 📋 Logs and Monitoring

All migration operations are logged with timestamps:
- **Success logs**: Detailed operation results
- **Error logs**: Failure analysis and troubleshooting info
- **Verification logs**: Data integrity check results
- **Summary reports**: Complete migration overview

## 🛠️ Troubleshooting

### Common Issues

1. **Schema not applied**
   ```bash
   node scripts/apply-schema.js
   ```

2. **Environment variables missing**
   - Check `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

3. **Data path issues**
   - Verify quiz data exists in `migration/data/quizzes/`

4. **Permission errors**
   - Ensure service role key has proper database permissions

### Manual Verification
```bash
# Check database connection
node scripts/verify-migration.js

# Generate fresh summary
node scripts/migration-summary.js
```

## 🎯 Migration Status: COMPLETE ✅

🚀 **Ready for production use!**  
🧪 **Ready for testing and validation!**  
📱 **Web interface can now load quiz data from database!**
