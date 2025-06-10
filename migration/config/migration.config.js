/**
 * Migration Configuration
 * Centralized configuration for all migration operations
 */

const path = require('path');

const MIGRATION_CONFIG = {
  // Database Configuration
  database: {
    schemaFile: path.join(__dirname, '../schemas/supabase_database.sql'),
    connectionTimeout: 30000,
    maxRetries: 3
  },

  // Quiz Data Configuration
  quizzes: {
    dataPath: path.join(__dirname, '../data/quizzes'),
    supportedFormats: ['json'],
    batchSize: 50, // Process questions in batches
    availableQuizzes: [
      {
        id: 'azure-a102',
        name: 'Azure AI-102: AI Engineer Associate Practice Quiz',
        path: 'azure-a102',
        format: 'metadata_with_clean_files',
        metadataFile: 'quiz_metadata.json',
        questionFiles: 'clean_*.json'
      },
      {
        id: 'project-management',
        name: 'Project Management Professional (PMP) Agile Practice Quiz',
        path: 'project-management/project-management',
        format: 'topic_files',
        questionFiles: 'topic-*.json'
      }
    ]
  },

  // Question Type Mappings
  questionTypes: {
    normalizations: {
      'single': 'single_selection',
      'single_select': 'single_selection',
      'multi_select': 'multi',
      'multiple_choice': 'single_selection',
      'true_false': 'yes_no',
      'drag_drop': 'drag_and_drop',
      'ordering': 'order'
    },
    supported: [
      'single_selection',
      'multi',
      'yes_no',
      'yesno_multi',
      'drag_and_drop',
      'order',
      'dropdown_selection'
    ]
  },

  // Logging Configuration
  logging: {
    dir: path.join(__dirname, '../logs'),
    level: 'info',
    includeTimestamp: true,
    includeDetails: true
  },

  // Migration Scripts Paths
  scripts: {
    applySchema: path.join(__dirname, '../scripts/apply-schema.js'),
    migrateAzureQuiz: path.join(__dirname, '../scripts/migrate-quiz-data.js'),
    migrateProjectManagement: path.join(__dirname, '../scripts/migrate-project-management.js'),
    verify: path.join(__dirname, '../scripts/verify-migration.js'),
    summary: path.join(__dirname, '../scripts/migration-summary.js')
  },

  // Validation Rules
  validation: {
    required_quiz_fields: ['id', 'title', 'description', 'topic', 'difficulty', 'type'],
    required_question_fields: ['id', 'question', 'type'],
    max_question_length: 5000,
    max_option_length: 1000
  }
};

module.exports = MIGRATION_CONFIG;
