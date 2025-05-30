#!/usr/bin/env node
/**
 * Quiz Data Validator and Cleaner
 * 
 * This utility validates and cleans up quiz JSON files before migration.
 * It can fix common issues like missing IDs, incomplete data structures,
 * and inconsistent formatting.
 * 
 * Usage: node validate-quiz-data.js [options]
 * Options:
 *   --fix: Automatically fix issues and update files
 *   --report: Generate detailed validation report
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const shouldReport = args.includes('--report');

const QUIZ_DIR = path.join(__dirname, 'app', 'data', 'quizzes', 'azure-a102');
const REPORT_FILE = path.join(__dirname, 'logs', 'validation-report.json');

// ------------------------------------------------------------------
// Validation Functions
// ------------------------------------------------------------------
function validateAndFixQuestion(question, index, filename) {
  const issues = [];
  const fixes = [];
  
  // Fix missing ID
  if (!question.id) {
    const newId = `${filename.replace('.json', '')}-${index}-${uuidv4().slice(0, 8)}`;
    if (shouldFix) {
      question.id = newId;
      fixes.push(`Generated ID: ${newId}`);
    } else {
      issues.push('Missing ID');
    }
  }
  
  // Fix missing type
  if (!question.type) {
    issues.push('Missing question type');
  }
  
  // Fix missing question text
  if (!question.question && !question.questionText) {
    issues.push('Missing question text');
  } else if (question.questionText && !question.question) {
    if (shouldFix) {
      question.question = question.questionText;
      fixes.push('Moved questionText to question field');
    }
  }
  
  // Fix missing points
  if (question.points === undefined || question.points === null) {
    if (shouldFix) {
      question.points = 1;
      fixes.push('Set default points to 1');
    } else {
      issues.push('Missing points');
    }
  }
  
  // Fix missing difficulty
  if (!question.difficulty) {
    if (shouldFix) {
      question.difficulty = 'medium';
      fixes.push('Set default difficulty to medium');
    } else {
      issues.push('Missing difficulty');
    }
  }
  
  // Fix missing quiz_tag
  if (!question.quiz_tag) {
    if (shouldFix) {
      question.quiz_tag = 'azure-a102';
      fixes.push('Set default quiz_tag');
    } else {
      issues.push('Missing quiz_tag');
    }
  }
  
  // Fix feedback structure
  if (!question.feedback) {
    if (shouldFix) {
      question.feedback = {
        correct: 'Correct!',
        incorrect: 'Incorrect. Please review the explanation.'
      };
      fixes.push('Added default feedback');
    } else {
      issues.push('Missing feedback');
    }
  } else {
    if (!question.feedback.correct) {
      if (shouldFix) {
        question.feedback.correct = 'Correct!';
        fixes.push('Added default correct feedback');
      } else {
        issues.push('Missing correct feedback');
      }
    }
    if (!question.feedback.incorrect) {
      if (shouldFix) {
        question.feedback.incorrect = 'Incorrect. Please review the explanation.';
        fixes.push('Added default incorrect feedback');
      } else {
        issues.push('Missing incorrect feedback');
      }
    }
  }
  
  // Fix missing explanation
  if (!question.explanation) {
    if (shouldFix) {
      question.explanation = 'No explanation provided.';
      fixes.push('Added default explanation');
    } else {
      issues.push('Missing explanation');
    }
  }
  
  // Type-specific validations and fixes
  switch (question.type) {
    case 'drag_and_drop':
      validateDragAndDrop(question, issues, fixes);
      break;
    case 'dropdown_selection':
      validateDropdown(question, issues, fixes);
      break;
    case 'multi':
      validateMulti(question, issues, fixes);
      break;
    case 'single_selection':
      validateSingle(question, issues, fixes);
      break;
    case 'order':
      validateOrder(question, issues, fixes);
      break;
    case 'yes_no':
      validateYesNo(question, issues, fixes);
      break;
    case 'yesno_multi':
      validateYesNoMulti(question, issues, fixes);
      break;
  }
  
  return { question, issues, fixes };
}

function validateDragAndDrop(question, issues, fixes) {
  if (!question.targets || !Array.isArray(question.targets)) {
    if (shouldFix) {
      question.targets = [];
      fixes.push('Initialized empty targets array');
    } else {
      issues.push('Missing or invalid targets array');
    }
  }
  
  if (!question.options || !Array.isArray(question.options)) {
    if (shouldFix) {
      question.options = [];
      fixes.push('Initialized empty options array');
    } else {
      issues.push('Missing or invalid options array');
    }
  }
  
  if (!question.correct_pairs || !Array.isArray(question.correct_pairs)) {
    if (shouldFix) {
      question.correct_pairs = [];
      fixes.push('Initialized empty correct_pairs array');
    } else {
      issues.push('Missing or invalid correct_pairs array');
    }
  }
  
  // Validate individual items
  question.targets?.forEach((target, idx) => {
    if (!target.id) {
      if (shouldFix) {
        target.id = `target-${idx + 1}`;
        fixes.push(`Generated target ID: target-${idx + 1}`);
      } else {
        issues.push(`Target ${idx} missing ID`);
      }
    }
    if (!target.text) {
      issues.push(`Target ${idx} missing text`);
    }
  });
  
  question.options?.forEach((option, idx) => {
    if (!option.id) {
      if (shouldFix) {
        option.id = `option-${idx + 1}`;
        fixes.push(`Generated option ID: option-${idx + 1}`);
      } else {
        issues.push(`Option ${idx} missing ID`);
      }
    }
    if (!option.text) {
      issues.push(`Option ${idx} missing text`);
    }
  });
}

function validateDropdown(question, issues, fixes) {
  if (!question.options || !Array.isArray(question.options)) {
    if (shouldFix) {
      question.options = [];
      fixes.push('Initialized empty options array');
    } else {
      issues.push('Missing or invalid options array');
    }
  }
  
  if (!question.target || typeof question.target !== 'object') {
    if (shouldFix) {
      question.target = {};
      fixes.push('Initialized empty target object');
    } else {
      issues.push('Missing or invalid target object');
    }
  }
}

function validateMulti(question, issues, fixes) {
  if (!question.options || !Array.isArray(question.options)) {
    if (shouldFix) {
      question.options = [];
      fixes.push('Initialized empty options array');
    } else {
      issues.push('Missing or invalid options array');
    }
  }
  
  if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
    if (shouldFix) {
      question.correctAnswers = [];
      fixes.push('Initialized empty correctAnswers array');
    } else {
      issues.push('Missing or invalid correctAnswers array');
    }
  }
}

function validateSingle(question, issues, fixes) {
  if (!question.options || !Array.isArray(question.options)) {
    if (shouldFix) {
      question.options = [];
      fixes.push('Initialized empty options array');
    } else {
      issues.push('Missing or invalid options array');
    }
  }
  
  if (!question.correctAnswers || !Array.isArray(question.correctAnswers) || !question.correctAnswers[0]) {
    issues.push('Missing or invalid correctAnswers[0]');
  }
}

function validateOrder(question, issues, fixes) {
  if (!question.items || !Array.isArray(question.items)) {
    if (shouldFix) {
      question.items = [];
      fixes.push('Initialized empty items array');
    } else {
      issues.push('Missing or invalid items array');
    }
  }
  
  if (!question.correctOrder || !Array.isArray(question.correctOrder)) {
    if (shouldFix) {
      question.correctOrder = [];
      fixes.push('Initialized empty correctOrder array');
    } else {
      issues.push('Missing or invalid correctOrder array');
    }
  }
}

function validateYesNo(question, issues, fixes) {
  if (question.correctAnswer === undefined || question.correctAnswer === null) {
    issues.push('Missing correctAnswer');
  }
}

function validateYesNoMulti(question, issues, fixes) {
  if (!question.statements || !Array.isArray(question.statements)) {
    if (shouldFix) {
      question.statements = [];
      fixes.push('Initialized empty statements array');
    } else {
      issues.push('Missing or invalid statements array');
    }
  }
  
  if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
    if (shouldFix) {
      question.correctAnswers = [];
      fixes.push('Initialized empty correctAnswers array');
    } else {
      issues.push('Missing or invalid correctAnswers array');
    }
  }
}

// ------------------------------------------------------------------
// Main Validation Logic
// ------------------------------------------------------------------
async function validateQuizFiles() {
  console.log('🔍 Starting quiz data validation...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      filesProcessed: 0,
      questionsProcessed: 0,
      questionsWithIssues: 0,
      questionsFixed: 0,
      totalIssues: 0,
      totalFixes: 0
    },
    files: {}
  };
  
  try {
    const files = await fs.readdir(QUIZ_DIR);
    const jsonFiles = files.filter(f => f.startsWith('clean_') && f.endsWith('.json'));
    
    for (const filename of jsonFiles) {
      const filePath = path.join(QUIZ_DIR, filename);
      console.log(`📄 Processing ${filename}...`);
      
      const fileReport = {
        path: filePath,
        questions: [],
        summary: {
          totalQuestions: 0,
          questionsWithIssues: 0,
          questionsFixed: 0,
          totalIssues: 0,
          totalFixes: 0
        }
      };
      
      try {
        const data = await fs.readJson(filePath);
        
        if (!data.questions || !Array.isArray(data.questions)) {
          console.log(`⚠️  ${filename}: No questions array found`);
          continue;
        }
        
        // Filter out incomplete questions (objects with only quiz_tag or difficulty)
        const validQuestions = data.questions.filter(q => {
          const hasMinimalData = q.id || q.question || q.questionText || q.type;
          return hasMinimalData;
        });
        
        if (validQuestions.length !== data.questions.length) {
          console.log(`⚠️  ${filename}: Filtered out ${data.questions.length - validQuestions.length} incomplete questions`);
        }
        
        fileReport.summary.totalQuestions = validQuestions.length;
        
        const processedQuestions = [];
        
        for (let i = 0; i < validQuestions.length; i++) {
          const question = validQuestions[i];
          const result = validateAndFixQuestion(question, i, filename);
          
          processedQuestions.push(result.question);
          
          const questionReport = {
            id: result.question.id || `index-${i}`,
            type: result.question.type || 'unknown',
            issues: result.issues,
            fixes: result.fixes
          };
          
          fileReport.questions.push(questionReport);
          
          if (result.issues.length > 0) {
            fileReport.summary.questionsWithIssues++;
            fileReport.summary.totalIssues += result.issues.length;
          }
          
          if (result.fixes.length > 0) {
            fileReport.summary.questionsFixed++;
            fileReport.summary.totalFixes += result.fixes.length;
          }
        }
        
        // Update the original data structure with processed questions
        data.questions = processedQuestions;
        
        // Write back the fixed file if we made changes
        if (shouldFix && fileReport.summary.totalFixes > 0) {
          await fs.writeJson(filePath, data, { spaces: 2 });
          console.log(`✅ Fixed and saved ${filename}`);
        }
        
      } catch (err) {
        console.log(`❌ Error processing ${filename}:`, err.message);
        fileReport.error = err.message;
      }
      
      report.files[filename] = fileReport;
      report.summary.filesProcessed++;
      report.summary.questionsProcessed += fileReport.summary.totalQuestions;
      report.summary.questionsWithIssues += fileReport.summary.questionsWithIssues;
      report.summary.questionsFixed += fileReport.summary.questionsFixed;
      report.summary.totalIssues += fileReport.summary.totalIssues;
      report.summary.totalFixes += fileReport.summary.totalFixes;
    }
    
    // Generate report
    if (shouldReport) {
      await fs.ensureDir(path.dirname(REPORT_FILE));
      await fs.writeJson(REPORT_FILE, report, { spaces: 2 });
      console.log(`📊 Detailed report saved to: ${REPORT_FILE}`);
    }
    
    // Print summary
    console.log('\\n📈 Validation Summary:');
    console.log(`   Files processed: ${report.summary.filesProcessed}`);
    console.log(`   Questions processed: ${report.summary.questionsProcessed}`);
    console.log(`   Questions with issues: ${report.summary.questionsWithIssues}`);
    console.log(`   Total issues found: ${report.summary.totalIssues}`);
    
    if (shouldFix) {
      console.log(`   Questions fixed: ${report.summary.questionsFixed}`);
      console.log(`   Total fixes applied: ${report.summary.totalFixes}`);
    } else {
      console.log('\\n💡 Run with --fix to automatically fix issues');
    }
    
    if (shouldReport) {
      console.log(`\\n📄 Detailed report: ${REPORT_FILE}`);
    } else {
      console.log('\\n💡 Run with --report to generate detailed validation report');
    }
    
  } catch (err) {
    console.error('❌ Validation failed:', err.message);
    process.exit(1);
  }
}

// ------------------------------------------------------------------
// Execute if run directly
// ------------------------------------------------------------------
if (require.main === module) {
  validateQuizFiles();
}

module.exports = { validateQuizFiles, validateAndFixQuestion };
