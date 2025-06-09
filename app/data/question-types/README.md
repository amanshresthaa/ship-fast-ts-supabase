# Question Types Documentation

## Overview
This directory contains the structured definition, examples, tests, and validation for all supported question types in the quiz system.

## Directory Structure

```
app/data/question-types/
├── schemas/           # JSON schema definitions for each question type
├── examples/          # Example questions for each type (wrapped in {"questions": [...]} format)
├── tests/            # Comprehensive test suite
├── validation/       # Validation scripts
└── README.md         # This documentation
```

## Supported Question Types

1. **Single Selection** - Single choice questions with radio buttons
2. **Multi-Select** - Multiple choice questions with checkboxes  
3. **Yes/No** - Simple binary choice questions
4. **Yes/No Multi** - Multiple yes/no questions grouped together
5. **Drag and Drop** - Interactive drag-and-drop matching questions
6. **Dropdown Selection** - Questions with dropdown answer selection
7. **Order** - Questions requiring items to be placed in correct sequence

## Schema Files

### Question Type Schemas
- **Schema files**: `{question_type}.json` (e.g., `single_selection.json`)
- **Example files**: `{question_type}_examples.json` (e.g., `single_selection_examples.json`)

### Metadata Schema
- **quiz_metadata.json** - JSON schema defining the structure for quiz metadata including:
  - Quiz identification (id, title, description)
  - Version and authorship information
  - Quiz settings (randomization, scoring, time limits)
  - Tags and categorization

## Example Format

All example files follow the azure quiz folder pattern:
```json
{
  "questions": [
    {
      "id": "unique_id",
      "question": "Question text",
      "type": "question_type",
      // ... type-specific fields
    }
  ]
}
```

Each examples folder also includes a `quiz_metadata.json` file with metadata about the examples.

## Metadata Format

Quiz metadata follows this structure:
```json
{
  "metadata": {
    "id": "unique-quiz-id",
    "title": "Quiz Title",
    "description": "Detailed description",
    "version": "1.0.0",
    "lastUpdated": "2024-12-19",
    "author": "author-name",
    "source": "optional-source-url",
    "quizType": "mixed",
    "quiz_tags": ["tag1", "tag2"],
    "settings": {
      "randomizeQuestions": false,
      "randomizeOptions": false,
      "passingScore": 70,
      "showFeedback": true,
      "timeLimit": null,
      "attemptsAllowed": null
    }
  },
  "quiz_topic": "Short topic description"
}
```

## Usage

### Running Validation
```bash
node app/data/question-types/validation/validate-question-types.js
```

### Running Tests
```bash
node app/data/question-types/tests/question-type-tests.js
```

## Test Results

- **Total Tests**: 338
- **Success Rate**: 100%
- **Coverage**: All question types and their structural validation

## Validation Results

- **Files Validated**: 15 (8 schemas + 7 examples + 1 metadata)
- **Total Questions**: 31 example questions across all types
- **All Files Valid**: ✅
- **Metadata Schema**: ✅ Includes comprehensive validation

## Migration Notes

This structure was migrated from the original `/app/data/structure/` directory to provide:
- Better organization with dedicated folders for different purposes
- Comprehensive testing and validation
- Consistent formatting matching the azure quiz folder pattern
- Easy maintenance and extensibility for new question types

## Adding New Question Types

1. Create schema file: `schemas/{new_type}.json`
2. Create examples file: `examples/{new_type}_examples.json`
3. Add validation rules to `validation/validate-question-types.js`
4. Add test cases to `tests/question-type-tests.js`
5. Run validation and tests to ensure everything works

## Dependencies

The validation and test scripts are standalone Node.js files with no external dependencies beyond the built-in `fs` and `path` modules.
