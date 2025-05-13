# Quiz Component Architecture

## Overview
The quiz components follow a Model-View-Controller pattern:

- **Models**: Question types defined in `app/types/quiz.ts`
- **Controllers**: Question-specific controllers that manage state and validation logic 
- **Views**: React components that render the UI and handle user interactions
- **Validators**: Classes that validate user answers against correct answers

## Controller Pattern
Each question type has its own controller that extends the base `QuestionController` class. The controller is responsible for:

1. Managing the question state
2. Validating user answers
3. Determining if an answer is complete and can be submitted
4. Providing utility methods specific to the question type

```
┌───────────────┐    uses     ┌───────────────┐
│    React      │◄───────────►│  Controller   │
│   Component   │             │               │
└───────────────┘             └───────┬───────┘
                                      │ uses
                                      ▼
                              ┌───────────────┐
                              │   Validator   │
                              │               │
                              └───────────────┘
```

## Hooks
The `useAutoValidation` hook provides consistent auto-validation behavior across all question types. It:

1. Tracks the current answer state
2. Determines when an answer is complete
3. Triggers submission when appropriate
4. Avoids duplicate submissions

## Usage Example

```tsx
// Component using controller and hook pattern
const MyQuestionComponent: React.FC<Props> = ({ 
  question, 
  onAnswerSelect, 
  selectedAnswer 
}) => {
  // Create controller instance
  const controller = new MyQuestionController(question);
  
  // Use auto-validation hook
  const [answer, setAnswer, isValidating, isComplete] = useAutoValidation(
    controller, 
    selectedAnswer, 
    onAnswerSelect
  );

  // Component rendering and event handlers
  // ...
};
```

## Adding a New Question Type

1. Create a new validator in `validators/` extending `AnswerValidator`
2. Create a new controller in `controllers/` extending `QuestionController`
3. Add the controller to `QuestionControllerFactory.ts`
4. Create/update the component to use the controller and hook
5. Add the component to `QuestionTypeRenderer.tsx`

## Testing
Controllers and validators have unit tests to ensure they correctly handle:

- Answer completeness checking
- Correctness validation
- Edge cases
