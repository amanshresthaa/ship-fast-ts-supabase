# Schema Update: Quiz Sub-Types

This document outlines the recent changes to the database schema to introduce "Quiz Sub-Types". This feature allows for better categorization and organization of quizzes and their related questions.

## Overview of Changes

The primary change is the introduction of a new table, `quiz_sub_types`, and the addition of foreign key columns to the `quizzes` and `questions` tables to link them to this new table.

## New Table: `quiz_sub_types`

This table stores the different sub-categories or specializations for quizzes.

**Columns:**

| Column     | Type        | Constraints                     | Description                                                     |
|------------|-------------|---------------------------------|-----------------------------------------------------------------|
| `id`       | `SERIAL`    | `PRIMARY KEY`                   | Auto-incrementing unique identifier for the sub-type.           |
| `name`     | `TEXT`      | `NOT NULL`, `UNIQUE`            | The unique name of the quiz sub-type (e.g., `computer-vision`). |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`   | Timestamp of when the record was created.                       |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`   | Timestamp of when the record was last updated.                  |

**Initial Data:**

The table is populated with the following initial sub-types:
- `computer-vision`
- `knowledge-mining`
- `nlp-solutions`
- `solution-planning`

## Changes to Existing Tables

### 1. `quizzes` Table

A new column `quiz_sub_type_id` has been added to associate quizzes with a sub-type.

| Column             | Type    | Constraints                                      | Description                                                        |
|--------------------|---------|--------------------------------------------------|--------------------------------------------------------------------|
| `quiz_sub_type_id` | `INTEGER` | `FK REFERENCES quiz_sub_types(id) ON DELETE SET NULL` | Foreign key linking to the `quiz_sub_types` table.               |

An index `idx_quizzes_quiz_sub_type_id` has been created on this column for performance.

### 2. `questions` Table

A new column `quiz_sub_type_id` has been added to associate questions with a sub-type, typically inherited from the parent quiz.

| Column             | Type    | Constraints                                      | Description                                                                 |
|--------------------|---------|--------------------------------------------------|-----------------------------------------------------------------------------|
| `quiz_sub_type_id` | `INTEGER` | `FK REFERENCES quiz_sub_types(id) ON DELETE SET NULL` | Foreign key linking to the `quiz_sub_types` table.                        |

An index `idx_questions_quiz_sub_type_id` has been created on this column for performance.

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    quiz_sub_types ||--o{ quizzes : "has many"
    quiz_sub_types ||--o{ questions : "has many (indirectly or directly)"
    quizzes        ||--o{ questions : "contains"

    quiz_sub_types {
        SERIAL id PK
        TEXT name UNIQUE
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    quizzes {
        INTEGER id PK
        TEXT quiz_topic
        TEXT difficulty_level
        INTEGER quiz_sub_type_id FK "nullable"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        -- other quiz fields
    }

    questions {
        INTEGER id PK
        TEXT question_text
        INTEGER quiz_tag FK "references quizzes.id"
        INTEGER quiz_sub_type_id FK "nullable"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        -- other question fields
    }
```

## Migration Scripts

The following migration scripts were created to implement these changes:

1.  `migrations/001_create_quiz_sub_types_table.sql`: Creates the `quiz_sub_types` table.
2.  `migrations/002_populate_quiz_sub_types.sql`: Populates `quiz_sub_types` with initial data.
3.  `migrations/003_add_sub_type_fk_to_quizzes.sql`: Adds `quiz_sub_type_id` to the `quizzes` table and sets up the foreign key.
4.  `migrations/004_populate_quizzes_sub_type_id.sql`: Placeholder script to populate `quiz_sub_type_id` for existing quizzes (requires manual logic).
5.  `migrations/005_add_sub_type_fk_to_questions.sql`: Adds `quiz_sub_type_id` to the `questions` table and sets up the foreign key.
6.  `migrations/006_populate_questions_sub_type_id.sql`: Populates `quiz_sub_type_id` in `questions` based on their parent quiz's sub-type.

## Notes

- The `trigger_set_timestamp()` function is assumed to be globally available for managing `updated_at` columns.
- Population of `quiz_sub_type_id` for existing quizzes in `004_populate_quizzes_sub_type_id.sql` requires specific business logic to be implemented.
- The `ON DELETE SET NULL` behavior for foreign keys means that if a `quiz_sub_type` is deleted, the corresponding `quiz_sub_type_id` in `quizzes` and `questions` will be set to `NULL`. This can be changed to `ON DELETE RESTRICT` or other actions based on requirements.
