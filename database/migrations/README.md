# Database Migrations

This directory contains migration scripts for updating existing databases.

## Migration Files

### 001_fix_order_correct_order_schema.sql
- **Date**: 2025-05-30
- **Description**: Fixes the order_correct_order table schema by adding the missing position column
- **Status**: ✅ Applied
- **Purpose**: Ensures proper ordering functionality for order-type questions

### 002_spaced_repetition_schema.sql
- **Date**: 2025-05-30  
- **Description**: Creates or updates all tables needed for the spaced repetition system
- **Status**: ✅ Applied
- **Purpose**: Implements complete spaced repetition functionality with SM-2 algorithm

## Migration Status

All migrations have been successfully applied to the database. The spaced repetition system is fully functional with:

- ✅ Question response tracking
- ✅ User performance analytics
- ✅ SM-2 algorithm implementation
- ✅ Adaptive quiz sessions
- ✅ Row Level Security policies
- ✅ Proper indexing for performance

## Running Migrations

To apply migrations to a new database:

```bash
# Apply migrations in order
psql -f database/migrations/001_fix_order_correct_order_schema.sql
psql -f database/migrations/002_spaced_repetition_schema.sql
```

## Migration Log

- **2025-05-30**: Applied 001_fix_order_correct_order_schema.sql - Fixed order table schema
- **2025-05-30**: Applied 002_spaced_repetition_schema.sql - Complete spaced repetition implementation
- **2025-05-30**: Migrated Azure A102 quiz data - 147 questions successfully imported
