# React Quiz Application Architecture Documentation

## Architecture Overview

The React Quiz Application follows a feature-based architecture pattern with a clear separation of concerns. The application is built on Next.js and utilizes React's Context API for state management.

```
app/
  features/
    quiz/
      components/         # Reusable UI components
      context/            # Context providers for state management
      hooks/              # Custom React hooks
      pages/              # Page components
      services/           # Data fetching and business logic
      utils/              # Utility functions and helpers
      index.ts            # Barrel file for convenient exports
```

## Component Hierarchy

```
QuizPage
├── QuizProvider (Context)
│   └── QuizRunner
│       ├── QuizProgress
│       ├── QuestionCard
│       │   ├── QuestionHeader
│       │   ├── QuestionContent
│       │   ├── QuestionTypeRenderer
│       │   │   └── [Question Type Component]
│       │   └── FeedbackSection
│       └── QuizNavigation
└── QuizCompletionSummary (when quiz is complete)
```

## State Management Flow

1. **State Management**: Using React's Context API with a reducer pattern
   - `useQuizState` hook encapsulates the reducer logic
   - `QuizContext` provides the state and dispatch functions to components

2. **Data Flow**:
   ```
   User Action → Dispatch Action → Reducer → State Update → UI Update
   ```

3. **API Integration**:
   - API calls are abstracted in the `QuizService`
   - `useQuizScoring` hook handles answer validation

## Design Patterns Implemented

1. **Factory Pattern**: `QuestionTypeRenderer` selects the appropriate component based on question type
2. **Provider Pattern**: `QuizProvider` provides state and functions to the component tree
3. **Custom Hook Pattern**: Encapsulated logic in reusable hooks like `useQuizState` and `useQuizScoring`
4. **Reducer Pattern**: State management using actions and reducers similar to Redux

## SOLID Principles Implementation

1. **Single Responsibility Principle**:
   - Each component has a single responsibility
   - `QuestionCard` only handles rendering
   - `QuizService` only handles data fetching
   - State logic is separated into hooks

2. **Open/Closed Principle**:
   - New question types can be added without modifying existing components
   - `QuestionTypeRenderer` is designed to be extended

3. **Interface Segregation**:
   - Components only receive the props they need
   - Smaller, focused interfaces for each component

4. **Dependency Inversion**:
   - Components depend on abstractions (hooks, context)
   - Concrete implementations can be swapped

## Performance Optimization Techniques

1. **Memoization**:
   - Components are memoized with React.memo to prevent unnecessary re-renders
   - Complex calculations are memoized

2. **Code Splitting**:
   - Question type components are separated for potential code splitting
   - Page-level code splitting with Next.js

3. **Lazy Loading**:
   - Question types are rendered only when needed

## Testing Strategy

1. **Component Testing**:
   - Unit tests for individual components
   - Mock context providers for testing components in isolation

2. **Hook Testing**:
   - Test custom hooks with React Testing Library's renderHook

3. **Integration Testing**:
   - Test complete features with simulated user interactions

4. **Test Coverage**:
   - Aim for >80% test coverage for critical components and hooks

## Style Guide and Coding Conventions

1. **Component Structure**:
   - Props interface defined at the top of each component
   - Default exports for components
   - Component functions use named arrow function syntax

2. **Naming Conventions**:
   - PascalCase for component names
   - camelCase for variables and functions
   - Descriptive names that indicate purpose

3. **File Organization**:
   - One component per file
   - Related components grouped in folders
   - Index files for convenient imports

## Onboarding Guide for New Developers

1. **Getting Started**:
   - Clone the repository
   - Install dependencies with `npm install`
   - Run the development server with `npm run dev`

2. **Adding a New Question Type**:
   1. Create a new component in `app/features/quiz/components/question-types/`
   2. Extend the `AnyQuestion` type in `app/types/quiz.ts`
   3. Add the new case in `QuestionTypeRenderer.tsx`

3. **State Management**:
   - Add new action types to `QuizAction` in `useQuizState.ts`
   - Implement handler in the reducer function

4. **API Integration**:
   - Add new methods to `QuizService` as needed
   - Follow existing patterns for data fetching and error handling

## Before and After Refactoring Examples

### Before: Monolithic Component

```tsx
// QuestionCard with mixed responsibilities
const QuestionCard = ({ question, onAnswerSelect, selectedAnswer }) => {
  // UI rendering logic mixed with business logic
  const handleAnswerSelection = (answer) => {
    // Complex validation
    // API calls
    // Feedback logic
    onAnswerSelect(answer);
  };
  
  // Rendering different question types inline
  const renderQuestionType = () => {
    if (question.type === 'single_selection') {
      return <SingleSelectionOptions />;
    } else if (question.type === 'multi') {
      return <MultiChoiceOptions />;
    }
  };
  
  return (
    <div>
      <h2>{question.title}</h2>
      {renderQuestionType()}
      // More UI rendering
    </div>
  );
};
```

### After: Component Composition

```tsx
// Focused QuestionCard with clear responsibilities
const QuestionCard = ({ question }) => {
  const { submitAndScoreAnswer } = useQuiz();
  
  const handleLocalAnswerSelection = async (answerPayload) => {
    await submitAndScoreAnswer(question, answerPayload);
  };
  
  return (
    <div>
      <QuestionHeader points={question.points} difficulty={question.difficulty} />
      <QuestionContent question={question.question} />
      <QuestionTypeRenderer
        question={question}
        onAnswerSelect={handleLocalAnswerSelection}
        // other props
      />
      <FeedbackSection type={feedbackType} content={feedbackContent} />
    </div>
  );
};
```

## Implementation Timeline

1. **Phase 1**: Restructure project architecture (1-2 days)
2. **Phase 2**: Refactor state management with custom hooks (1-2 days)
3. **Phase 3**: Implement component separation and modularization (2-3 days)
4. **Phase 4**: Add performance optimizations (1-2 days)
5. **Phase 5**: Implement proper testing (2-3 days)
6. **Phase 6**: Documentation and developer guides (1 day)
