# E2E Quiz Testing Suite

This directory contains comprehensive End-to-End (E2E) tests for the quiz-taking lifecycle, implemented as part of a 5-day sprint plan.

## Quick Start

### Prerequisites
```bash
# Start the development server (required for E2E tests)
npm run dev
```

### Run Tests
```bash
# Quick test run - main lifecycle test
npm run test:e2e:quiz

# Run with Page Object Model
npm run test:e2e:quiz-pom

# Debug mode (Playwright UI)
npm run test:e2e:quiz-debug

# All E2E tests with HTML report
npm run test:e2e:quiz-all
```

### Using the Test Runner Script
```bash
# Default run
./tests/e2e/run-quiz-tests.sh

# Specific commands
./tests/e2e/run-quiz-tests.sh lifecycle  # Main test suite
./tests/e2e/run-quiz-tests.sh debug     # Debug mode
./tests/e2e/run-quiz-tests.sh all       # All tests with report
./tests/e2e/run-quiz-tests.sh help      # Show all options
```

## Test Coverage

### ✅ Complete Quiz Lifecycle
- Quiz selection from list
- Quiz configuration modal
- Question answering flow
- Navigation (Next/Previous)
- Quiz submission
- Completion summary

### ✅ All 7 Question Types
1. **Single Selection** - Radio button questions
2. **Multi Selection** - Checkbox questions  
3. **Order Questions** - Drag items to arrange sequence
4. **Drag and Drop** - Match items to targets
5. **Dropdown Selection** - Fill-in-the-blank with dropdowns
6. **Yes/No** - Binary choice questions
7. **Yes/No Multi** - Multiple statement evaluation

### ✅ User Interactions
- Click interactions (buttons, options)
- Drag and drop operations
- Dropdown selections
- Modal interactions
- Form submissions

## File Structure

```
tests/e2e/
├── mocks/
│   └── MOCK_QUIZ_DATA.ts              # Test data (Azure AI-102 quiz)
├── models/
│   └── QuizPage.ts                    # Page Object Model
├── quiz-lifecycle.spec.ts             # Main comprehensive test
├── quiz-lifecycle-pom.spec.ts         # POM-based implementation
├── run-quiz-tests.sh                  # Test runner script
├── E2E_QUIZ_TESTING_SPRINT_DOCUMENTATION.md
└── README.md                          # This file
```

## Key Features

### 🚀 Fast & Reliable
- Mock API responses (no database dependency)
- Consistent test data
- Robust element selectors with fallbacks

### 🧩 Maintainable
- Page Object Model implementation
- Reusable interaction methods
- Clear separation of concerns

### 🔍 Comprehensive
- All question types covered
- Edge cases handled (navigation, validation)
- Multiple assertion strategies

## Test Philosophy

### Mock-First Approach
Tests use mock data instead of real database calls for:
- **Speed**: No network latency
- **Reliability**: Consistent data every run
- **Independence**: No external dependencies

### Fallback Selectors
Each element uses multiple selector strategies:
1. `data-testid` attributes (preferred)
2. Text content matching
3. CSS classes (fallback)

### Graceful Degradation
Tests continue even when optional elements aren't found, focusing on core functionality.

## Sprint Implementation

This test suite was implemented following a structured 5-day sprint:

- **Day 1**: Quiz initiation flow
- **Day 2**: Click-based questions
- **Day 3**: Complex interactive questions  
- **Day 4**: Navigation and submission
- **Day 5**: Completion and refactoring (POM)

## Running in CI/CD

```yaml
# Example GitHub Actions step
- name: Run E2E Quiz Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:e2e:quiz
```

## Troubleshooting

### Common Issues

**Tests fail with "Development server not running"**
```bash
# Start dev server first
npm run dev
# Then run tests in another terminal
npm run test:e2e:quiz
```

**Elements not found**
- Check if the app UI has changed
- Verify mock data matches expected question content
- Use debug mode to inspect: `npm run test:e2e:quiz-debug`

**Slow test execution**
- Ensure mock API routes are working
- Check for unnecessary `waitForTimeout()` calls
- Verify `waitForLoadState('networkidle')` usage

### Debug Mode
Use Playwright's UI mode for debugging:
```bash
npm run test:e2e:quiz-debug
```

This opens an interactive UI where you can:
- Step through tests
- Inspect elements
- View console logs
- Take screenshots

## Contributing

When adding new question types or modifying the quiz flow:

1. **Update Mock Data**: Add examples in `MOCK_QUIZ_DATA.ts`
2. **Extend Page Object**: Add new methods in `QuizPage.ts`
3. **Update Tests**: Include new interactions in test specs
4. **Update Documentation**: Reflect changes in this README

## Performance Metrics

Typical test execution times:
- **Single test run**: ~30-60 seconds
- **Full lifecycle test**: ~45 seconds
- **All E2E tests**: ~2-3 minutes

These times include browser startup, page navigation, and all question interactions.
