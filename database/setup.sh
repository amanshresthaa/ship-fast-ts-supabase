#!/bin/bash
# Database Setup Script
# This script sets up the complete database schema from organized files

set -e  # Exit on any error

echo "🚀 Starting database setup..."

# Check if we're in the right directory
if [ ! -d "database" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to run SQL file
run_sql_file() {
    local file=$1
    echo "  📄 Running $file..."
    if [ -n "$DATABASE_URL" ]; then
        psql "$DATABASE_URL" -f "$file"
    else
        psql -f "$file"
    fi
}

echo "📋 Setting up database schema..."

# 1. Schema files (in order)
echo "  🏗️  Creating schema..."
run_sql_file "database/schema/01_extensions.sql"
run_sql_file "database/schema/02_types_enums.sql"
run_sql_file "database/schema/03_core_tables.sql"
run_sql_file "database/schema/04_question_types.sql"
run_sql_file "database/schema/05_user_progress.sql"
run_sql_file "database/schema/06_spaced_repetition.sql"
run_sql_file "database/schema/07_permissions.sql"

# 2. Function files (in order)
echo "  ⚙️  Creating functions..."
run_sql_file "database/functions/01_utility_functions.sql"
run_sql_file "database/functions/02_sm2_algorithm.sql"
run_sql_file "database/functions/03_triggers.sql"
run_sql_file "database/functions/04_analytics.sql"

echo "✅ Database setup completed successfully!"
echo ""
echo "📊 Database features enabled:"
echo "  ✅ Core quiz and question tables"
echo "  ✅ 7 question types supported"
echo "  ✅ User progress tracking"
echo "  ✅ Spaced repetition with SM-2 algorithm"
echo "  ✅ Row Level Security (RLS)"
echo "  ✅ Performance optimized indexes"
echo "  ✅ Analytics functions"
echo ""
echo "🎯 Next steps:"
echo "  1. Run migrations if updating existing database"
echo "  2. Import quiz data if needed"
echo "  3. Test spaced repetition functionality"
echo ""
echo "🔗 Spaced repetition endpoints available:"
echo "  - /api/quiz/review-questions"
echo "  - /api/quiz/response"
echo "  - /api/quiz/adaptive-session"
