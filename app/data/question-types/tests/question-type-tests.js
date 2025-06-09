/**
 * Question Type Test Suite
 * Comprehensive tests for all question types and their functionality
 */

const fs = require('fs');
const path = require('path');

class QuestionTypeTestSuite {
  constructor() {
    this.testResults = {};
    this.totalTests = 0;
    this.passedTests = 0;
  }

  // Test helper functions
  assert(condition, message) {
    this.totalTests++;
    if (condition) {
      this.passedTests++;
      return { passed: true, message };
    } else {
      return { passed: false, message };
    }
  }

  assertEqual(actual, expected, message) {
    return this.assert(actual === expected, 
      `${message}: expected ${expected}, got ${actual}`);
  }

  assertArrayEqual(actual, expected, message) {
    return this.assert(JSON.stringify(actual) === JSON.stringify(expected),
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }

  assertTruthy(value, message) {
    return this.assert(!!value, message);
  }

  // Load test data
  loadQuestionData() {
    const basePath = path.dirname(__dirname);
    const examplesPath = path.join(basePath, 'examples');
    const questionData = {};

    const exampleFiles = fs.readdirSync(examplesPath)
      .filter(file => file.endsWith('_examples.json'));

    exampleFiles.forEach(file => {
      const filePath = path.join(examplesPath, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const questionType = file.replace('_examples.json', '');
      questionData[questionType] = content.questions;
    });

    return questionData;
  }

  // Test drag and drop question structure
  testDragAndDropStructure() {
    const tests = [];
    const questions = this.loadQuestionData()['drag_and_drop'];

    questions.forEach((question, index) => {
      tests.push(this.assertEqual(question.type, 'drag_and_drop', 
        `Drag and drop question ${index + 1} type`));
      
      tests.push(this.assertTruthy(question.targets && question.targets.length > 0,
        `Drag and drop question ${index + 1} has targets`));
      
      tests.push(this.assertTruthy(question.options && question.options.length > 0,
        `Drag and drop question ${index + 1} has options`));
      
      tests.push(this.assertTruthy(question.correct_pairs && question.correct_pairs.length > 0,
        `Drag and drop question ${index + 1} has correct pairs`));

      // Test that all correct pairs reference valid targets and options
      question.correct_pairs.forEach((pair, pairIndex) => {
        const targetExists = question.targets.some(t => t.id === pair.target_id);
        const optionExists = question.options.some(o => o.id === pair.option_id);
        
        tests.push(this.assert(targetExists,
          `Drag and drop question ${index + 1}, pair ${pairIndex + 1}: target_id exists`));
        
        tests.push(this.assert(optionExists,
          `Drag and drop question ${index + 1}, pair ${pairIndex + 1}: option_id exists`));
      });
    });

    return tests;
  }

  // Test dropdown selection question structure
  testDropdownSelectionStructure() {
    const tests = [];
    const questions = this.loadQuestionData()['dropdown_selection'];

    questions.forEach((question, index) => {
      tests.push(this.assertEqual(question.type, 'dropdown_selection',
        `Dropdown question ${index + 1} type`));
      
      tests.push(this.assertTruthy(question.options && question.options.length > 0,
        `Dropdown question ${index + 1} has options`));

      // Test that exactly one option is correct
      const correctCount = question.options.filter(opt => opt.is_correct).length;
      tests.push(this.assertEqual(correctCount, 1,
        `Dropdown question ${index + 1} has exactly one correct answer`));

      // Test that all options have required fields
      question.options.forEach((option, optIndex) => {
        tests.push(this.assertTruthy(option.id,
          `Dropdown question ${index + 1}, option ${optIndex + 1} has id`));
        
        tests.push(this.assertTruthy(option.text,
          `Dropdown question ${index + 1}, option ${optIndex + 1} has text`));
        
        tests.push(this.assert(typeof option.is_correct === 'boolean',
          `Dropdown question ${index + 1}, option ${optIndex + 1} has boolean is_correct`));
      });
    });

    return tests;
  }

  // Test multi-select question structure
  testMultiSelectStructure() {
    const tests = [];
    const questions = this.loadQuestionData()['multi'];

    questions.forEach((question, index) => {
      tests.push(this.assertEqual(question.type, 'multi',
        `Multi question ${index + 1} type`));
      
      tests.push(this.assertTruthy(question.options && question.options.length > 0,
        `Multi question ${index + 1} has options`));
      
      tests.push(this.assertTruthy(question.correctAnswers && question.correctAnswers.length > 0,
        `Multi question ${index + 1} has correct answers`));

      // Test that all correct answers reference valid option IDs
      question.correctAnswers.forEach((answerId, ansIndex) => {
        const optionExists = question.options.some(opt => opt.id === answerId);
        tests.push(this.assert(optionExists,
          `Multi question ${index + 1}, correct answer ${ansIndex + 1}: option exists`));
      });
    });

    return tests;
  }

  // Test order question structure
  testOrderStructure() {
    const tests = [];
    const questions = this.loadQuestionData()['order'];

    questions.forEach((question, index) => {
      tests.push(this.assertEqual(question.type, 'order',
        `Order question ${index + 1} type`));
      
      tests.push(this.assertTruthy(question.items && question.items.length > 0,
        `Order question ${index + 1} has items`));
      
      tests.push(this.assertTruthy(question.correctOrder && question.correctOrder.length > 0,
        `Order question ${index + 1} has correct order`));

      // Test that correct order length matches items length
      tests.push(this.assertEqual(question.correctOrder.length, question.items.length,
        `Order question ${index + 1}: correct order length matches items length`));

      // Test that all correct order IDs reference valid items
      question.correctOrder.forEach((itemId, orderIndex) => {
        const itemExists = question.items.some(item => item.id === itemId);
        tests.push(this.assert(itemExists,
          `Order question ${index + 1}, position ${orderIndex + 1}: item exists`));
      });

      // Test that correct order contains all item IDs exactly once
      const itemIds = question.items.map(item => item.id).sort();
      const orderIds = question.correctOrder.slice().sort();
      tests.push(this.assertArrayEqual(orderIds, itemIds,
        `Order question ${index + 1}: correct order contains all items exactly once`));
    });

    return tests;
  }

  // Test single selection question structure
  testSingleSelectionStructure() {
    const tests = [];
    const questions = this.loadQuestionData()['single_selection'];

    questions.forEach((question, index) => {
      tests.push(this.assertEqual(question.type, 'single_selection',
        `Single selection question ${index + 1} type`));
      
      tests.push(this.assertTruthy(question.options && question.options.length > 0,
        `Single selection question ${index + 1} has options`));
      
      tests.push(this.assertTruthy(question.correctAnswers && question.correctAnswers.length === 1,
        `Single selection question ${index + 1} has exactly one correct answer`));

      // Test that correct answer references valid option ID
      const correctAnswer = question.correctAnswers[0];
      const optionExists = question.options.some(opt => opt.id === correctAnswer);
      tests.push(this.assert(optionExists,
        `Single selection question ${index + 1}: correct answer references valid option`));
    });

    return tests;
  }

  // Test yes/no question structure
  testYesNoStructure() {
    const tests = [];
    const questions = this.loadQuestionData()['yes_no'];

    questions.forEach((question, index) => {
      tests.push(this.assertEqual(question.type, 'yes_no',
        `Yes/No question ${index + 1} type`));
      
      tests.push(this.assert(['yes', 'no'].includes(question.correctAnswer),
        `Yes/No question ${index + 1} has valid correct answer (yes/no)`));
    });

    return tests;
  }

  // Test yes/no multi question structure
  testYesNoMultiStructure() {
    const tests = [];
    const questions = this.loadQuestionData()['yesno_multi'];

    questions.forEach((question, index) => {
      tests.push(this.assertEqual(question.type, 'yesno_multi',
        `Yes/No Multi question ${index + 1} type`));
      
      tests.push(this.assertTruthy(question.statements && question.statements.length > 0,
        `Yes/No Multi question ${index + 1} has statements`));
      
      tests.push(this.assertTruthy(question.correctAnswers && question.correctAnswers.length > 0,
        `Yes/No Multi question ${index + 1} has correct answers`));

      // Test that correct answers length matches statements length
      tests.push(this.assertEqual(question.correctAnswers.length, question.statements.length,
        `Yes/No Multi question ${index + 1}: correct answers length matches statements length`));

      // Test that all correct answers are yes/no
      question.correctAnswers.forEach((answer, ansIndex) => {
        tests.push(this.assert(['yes', 'no'].includes(answer),
          `Yes/No Multi question ${index + 1}, answer ${ansIndex + 1}: valid yes/no value`));
      });
    });

    return tests;
  }

  // Test common question fields
  testCommonFields() {
    const tests = [];
    const allQuestions = this.loadQuestionData();

    Object.entries(allQuestions).forEach(([questionType, questions]) => {
      questions.forEach((question, index) => {
        // Test required fields
        tests.push(this.assertTruthy(question.id,
          `${questionType} question ${index + 1} has id`));
        
        tests.push(this.assertTruthy(question.type,
          `${questionType} question ${index + 1} has type`));
        
        tests.push(this.assertTruthy(question.question,
          `${questionType} question ${index + 1} has question text`));
        
        tests.push(this.assert(typeof question.points === 'number' && question.points > 0,
          `${questionType} question ${index + 1} has valid points`));

        // Test optional feedback structure
        if (question.feedback) {
          tests.push(this.assertTruthy(question.feedback.correct,
            `${questionType} question ${index + 1} feedback has correct text`));
          
          tests.push(this.assertTruthy(question.feedback.incorrect,
            `${questionType} question ${index + 1} feedback has incorrect text`));
        }

        // Test unique IDs within question type
        const allIds = questions.map(q => q.id);
        const uniqueIds = [...new Set(allIds)];
        tests.push(this.assertEqual(allIds.length, uniqueIds.length,
          `${questionType}: all question IDs are unique`));
      });
    });

    return tests;
  }

  // Run all tests
  runAllTests() {
    console.log('🧪 Starting Question Type Test Suite...\n');

    const testSuites = [
      { name: 'Common Fields', test: () => this.testCommonFields() },
      { name: 'Drag and Drop', test: () => this.testDragAndDropStructure() },
      { name: 'Dropdown Selection', test: () => this.testDropdownSelectionStructure() },
      { name: 'Multi-Select', test: () => this.testMultiSelectStructure() },
      { name: 'Order Questions', test: () => this.testOrderStructure() },
      { name: 'Single Selection', test: () => this.testSingleSelectionStructure() },
      { name: 'Yes/No Questions', test: () => this.testYesNoStructure() },
      { name: 'Yes/No Multi', test: () => this.testYesNoMultiStructure() }
    ];

    testSuites.forEach(suite => {
      console.log(`📋 Testing ${suite.name}:`);
      const tests = suite.test();
      const passed = tests.filter(t => t.passed).length;
      const failed = tests.filter(t => !t.passed).length;
      
      console.log(`  ✅ Passed: ${passed}`);
      if (failed > 0) {
        console.log(`  ❌ Failed: ${failed}`);
        tests.filter(t => !t.passed).forEach(test => {
          console.log(`    🔸 ${test.message}`);
        });
      }
      console.log('');
      
      this.testResults[suite.name] = { passed, failed, tests };
    });

    // Summary
    console.log('📊 Test Summary:');
    console.log(`  🧪 Total tests: ${this.totalTests}`);
    console.log(`  ✅ Passed: ${this.passedTests}`);
    console.log(`  ❌ Failed: ${this.totalTests - this.passedTests}`);
    console.log(`  📈 Success rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

    return this.testResults;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const testSuite = new QuestionTypeTestSuite();
  testSuite.runAllTests();
}

module.exports = QuestionTypeTestSuite;
