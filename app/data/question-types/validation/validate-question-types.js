/**
 * Question Type Validation Script
 * Validates all question types and their examples for structural integrity
 */

const fs = require('fs');
const path = require('path');

class QuestionTypeValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validationResults = {};
  }

  // Common validation rules for all question types
  validateCommonFields(question, questionType) {
    const requiredFields = ['id', 'type', 'question', 'points'];
    const errors = [];

    // Check required fields
    requiredFields.forEach(field => {
      if (!question[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate type matches expected
    if (question.type !== questionType) {
      errors.push(`Type mismatch: expected '${questionType}', got '${question.type}'`);
    }

    // Validate points is a number
    if (question.points && typeof question.points !== 'number') {
      errors.push('Points must be a number');
    }

    // Validate question is not empty
    if (question.question && question.question.trim().length === 0) {
      errors.push('Question text cannot be empty');
    }

    return errors;
  }

  // Validate drag and drop questions
  validateDragAndDrop(question) {
    const errors = this.validateCommonFields(question, 'drag_and_drop');

    if (!question.targets || !Array.isArray(question.targets)) {
      errors.push('Missing or invalid targets array');
    } else {
      question.targets.forEach((target, index) => {
        if (!target.id || !target.text) {
          errors.push(`Target ${index}: missing id or text`);
        }
      });
    }

    if (!question.options || !Array.isArray(question.options)) {
      errors.push('Missing or invalid options array');
    } else {
      question.options.forEach((option, index) => {
        if (!option.id || !option.text) {
          errors.push(`Option ${index}: missing id or text`);
        }
      });
    }

    if (!question.correct_pairs || !Array.isArray(question.correct_pairs)) {
      errors.push('Missing or invalid correct_pairs array');
    }

    return errors;
  }

  // Validate dropdown selection questions
  validateDropdownSelection(question) {
    const errors = this.validateCommonFields(question, 'dropdown_selection');

    if (!question.options || !Array.isArray(question.options)) {
      errors.push('Missing or invalid options array');
    } else {
      let correctCount = 0;
      question.options.forEach((option, index) => {
        if (!option.id || !option.text || typeof option.is_correct !== 'boolean') {
          errors.push(`Option ${index}: missing id, text, or is_correct field`);
        }
        if (option.is_correct) correctCount++;
      });

      if (correctCount !== 1) {
        errors.push('Dropdown questions must have exactly one correct answer');
      }
    }

    return errors;
  }

  // Validate multi-select questions
  validateMulti(question) {
    const errors = this.validateCommonFields(question, 'multi');

    if (!question.options || !Array.isArray(question.options)) {
      errors.push('Missing or invalid options array');
    }

    if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
      errors.push('Missing or invalid correctAnswers array');
    } else if (question.correctAnswers.length === 0) {
      errors.push('Multi-select questions must have at least one correct answer');
    }

    return errors;
  }

  // Validate order questions
  validateOrder(question) {
    const errors = this.validateCommonFields(question, 'order');

    if (!question.items || !Array.isArray(question.items)) {
      errors.push('Missing or invalid items array');
    }

    if (!question.correctOrder || !Array.isArray(question.correctOrder)) {
      errors.push('Missing or invalid correctOrder array');
    } else if (question.items && question.correctOrder.length !== question.items.length) {
      errors.push('correctOrder length must match items length');
    }

    return errors;
  }

  // Validate single selection questions
  validateSingleSelection(question) {
    const errors = this.validateCommonFields(question, 'single_selection');

    if (!question.options || !Array.isArray(question.options)) {
      errors.push('Missing or invalid options array');
    }

    if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
      errors.push('Missing or invalid correctAnswers array');
    } else if (question.correctAnswers.length !== 1) {
      errors.push('Single selection questions must have exactly one correct answer');
    }

    return errors;
  }

  // Validate yes/no questions
  validateYesNo(question) {
    const errors = this.validateCommonFields(question, 'yes_no');

    if (!question.correctAnswer || !['yes', 'no'].includes(question.correctAnswer)) {
      errors.push('correctAnswer must be either "yes" or "no"');
    }

    return errors;
  }

  // Validate yes/no multi questions
  validateYesNoMulti(question) {
    const errors = this.validateCommonFields(question, 'yesno_multi');

    if (!question.statements || !Array.isArray(question.statements)) {
      errors.push('Missing or invalid statements array');
    }

    if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
      errors.push('Missing or invalid correctAnswers array');
    } else {
      question.correctAnswers.forEach((answer, index) => {
        if (!['yes', 'no'].includes(answer)) {
          errors.push(`correctAnswers[${index}] must be either "yes" or "no"`);
        }
      });

      if (question.statements && question.correctAnswers.length !== question.statements.length) {
        errors.push('correctAnswers length must match statements length');
      }
    }

    return errors;
  }

  // Validate a single question based on its type
  validateQuestion(question) {
    switch (question.type) {
      case 'drag_and_drop':
        return this.validateDragAndDrop(question);
      case 'dropdown_selection':
        return this.validateDropdownSelection(question);
      case 'multi':
        return this.validateMulti(question);
      case 'order':
        return this.validateOrder(question);
      case 'single_selection':
        return this.validateSingleSelection(question);
      case 'yes_no':
        return this.validateYesNo(question);
      case 'yesno_multi':
        return this.validateYesNoMulti(question);
      default:
        return [`Unknown question type: ${question.type}`];
    }
  }

  // Validate JSON file structure
  validateJSONFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Validate a question file (schema or example)
  validateQuestionFile(filePath, isExample = false) {
    const result = {
      file: path.basename(filePath),
      valid: true,
      errors: [],
      warnings: [],
      questionCount: 0
    };

    const jsonResult = this.validateJSONFile(filePath);
    if (!jsonResult.valid) {
      result.valid = false;
      result.errors.push(`JSON parsing error: ${jsonResult.error}`);
      return result;
    }

    const data = jsonResult.data;

    if (isExample) {
      // For examples, expect {questions: [...]} format
      if (!data.questions || !Array.isArray(data.questions)) {
        result.valid = false;
        result.errors.push('Example file must have a "questions" array');
        return result;
      }

      result.questionCount = data.questions.length;

      data.questions.forEach((question, index) => {
        const questionErrors = this.validateQuestion(question);
        if (questionErrors.length > 0) {
          result.valid = false;
          result.errors.push(`Question ${index + 1}: ${questionErrors.join(', ')}`);
        }
      });
    } else {
      // For schemas, expect single question structure with example
      if (!data.structure) {
        result.valid = false;
        result.errors.push('Schema file must have a "structure" field');
        return result;
      }

      if (!data.example) {
        result.warnings.push('Schema file should have an "example" field');
      } else {
        const questionErrors = this.validateQuestion(data.example);
        if (questionErrors.length > 0) {
          result.valid = false;
          result.errors.push(`Example in schema: ${questionErrors.join(', ')}`);
        }
      }

      result.questionCount = 1;
    }

    return result;
  }

  // Validate metadata against schema
  validateMetadataAgainstSchema(metadataPath, schemaPath) {
    const result = { valid: true, errors: [] };
    
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      
      // Basic validation against schema structure
      if (!metadata.metadata) {
        result.errors.push('Missing metadata object');
      } else {
        const meta = metadata.metadata;
        
        // Required fields validation
        const requiredFields = ['id', 'title', 'description', 'version', 'lastUpdated', 'author', 'quizType'];
        requiredFields.forEach(field => {
          if (!meta[field]) {
            result.errors.push(`Missing required field: metadata.${field}`);
          }
        });
        
        // Type validations
        if (meta.version && !/^\d+\.\d+\.\d+$/.test(meta.version)) {
          result.errors.push('Version must follow semantic versioning (x.y.z)');
        }
        
        if (meta.lastUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(meta.lastUpdated)) {
          result.errors.push('lastUpdated must be in YYYY-MM-DD format');
        }
        
        if (meta.settings) {
          if (typeof meta.settings.passingScore !== 'number' || meta.settings.passingScore < 0 || meta.settings.passingScore > 100) {
            result.errors.push('passingScore must be a number between 0 and 100');
          }
        }
      }
      
      if (!metadata.quiz_topic) {
        result.errors.push('Missing quiz_topic field');
      }
      
      if (result.errors.length > 0) {
        result.valid = false;
      }
      
    } catch (error) {
      result.valid = false;
      result.errors.push(`Schema validation error: ${error.message}`);
    }
    
    return result;
  }

  // Run validation on all files
  async validateAll() {
    const basePath = path.dirname(__dirname);
    const schemasPath = path.join(basePath, 'schemas');
    const examplesPath = path.join(basePath, 'examples');

    console.log('🔍 Starting Question Type Validation...\n');

    // Validate schema files
    console.log('📋 Validating Schema Files:');
    const schemaFiles = fs.readdirSync(schemasPath)
      .filter(file => file.endsWith('.json') && file !== 'consolidated.json');

    for (const file of schemaFiles) {
      const filePath = path.join(schemasPath, file);
      
      // Skip quiz_metadata.json from question validation (it's a schema, not a question structure)
      if (file === 'quiz_metadata.json') {
        const jsonResult = this.validateJSONFile(filePath);
        console.log(`  ${jsonResult.valid ? '✅' : '❌'} ${file} (metadata schema)`);
        if (!jsonResult.valid) {
          console.log(`    🔸 ${jsonResult.error}`);
        }
        continue;
      }
      
      const result = this.validateQuestionFile(filePath, false);
      
      console.log(`  ${result.valid ? '✅' : '❌'} ${result.file}`);
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`    🔸 ${error}`));
      }
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => console.log(`    ⚠️  ${warning}`));
      }

      this.validationResults[file] = result;
    }

    // Validate example files
    console.log('\n📚 Validating Example Files:');
    const exampleFiles = fs.readdirSync(examplesPath)
      .filter(file => file.endsWith('.json') && file !== 'quiz_metadata.json');

    for (const file of exampleFiles) {
      const filePath = path.join(examplesPath, file);
      const result = this.validateQuestionFile(filePath, true);
      
      console.log(`  ${result.valid ? '✅' : '❌'} ${result.file} (${result.questionCount} questions)`);
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`    🔸 ${error}`));
      }
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => console.log(`    ⚠️  ${warning}`));
      }

      this.validationResults[file] = result;
    }

    // Validate quiz metadata
    console.log('\n📝 Validating Quiz Metadata:');
    const metadataPath = path.join(examplesPath, 'quiz_metadata.json');
    const metadataSchemaPath = path.join(schemasPath, 'quiz_metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      const metadataResult = this.validateJSONFile(metadataPath);
      if (metadataResult.valid) {
        // Validate against schema
        const schemaValidation = this.validateMetadataAgainstSchema(metadataPath, metadataSchemaPath);
        console.log(`  ${schemaValidation.valid ? '✅' : '❌'} quiz_metadata.json`);
        if (!schemaValidation.valid) {
          schemaValidation.errors.forEach(error => console.log(`    🔸 ${error}`));
        }
      } else {
        console.log(`  ❌ quiz_metadata.json`);
        console.log(`    🔸 ${metadataResult.error}`);
      }
    }

    // Summary
    const totalFiles = Object.keys(this.validationResults).length;
    const validFiles = Object.values(this.validationResults).filter(r => r.valid).length;
    const totalQuestions = Object.values(this.validationResults)
      .reduce((sum, r) => sum + r.questionCount, 0);

    console.log('\n📊 Validation Summary:');
    console.log(`  📁 Files validated: ${totalFiles}`);
    console.log(`  ✅ Valid files: ${validFiles}`);
    console.log(`  ❌ Invalid files: ${totalFiles - validFiles}`);
    console.log(`  📝 Total questions: ${totalQuestions}`);

    return this.validationResults;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new QuestionTypeValidator();
  validator.validateAll().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = QuestionTypeValidator;
