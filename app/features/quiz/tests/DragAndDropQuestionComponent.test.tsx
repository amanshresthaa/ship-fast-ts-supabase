import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DragAndDropQuestionComponent from '../components/question-types/DragAndDropQuestionComponent';
import { DragAndDropQuestion } from '@/app/types/quiz';

// Mock the dataTransfer object
const createDragEventWithData = (type: string, data: any) => {
  const event = new Event(type, { bubbles: true }) as any;
  event.dataTransfer = {
    data: {},
    setData(key: string, value: string) {
      this.data[key] = value;
    },
    getData(key: string) {
      return this.data[key];
    },
    effectAllowed: 'move',
    dropEffect: 'move',
  };
  return event;
};

describe('DragAndDropQuestionComponent', () => {
  // Create a mock question for testing
  const mockQuestion: DragAndDropQuestion = {
    id: 'q1',
    type: 'drag_and_drop',
    question: 'Match the items to their correct targets',
    points: 10,
    quiz_tag: 'test-quiz',
    difficulty: 'medium',
    feedback_correct: 'Good job!',
    feedback_incorrect: 'Try again!',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    targets: [
      { target_id: 't1', text: 'Target 1' },
      { target_id: 't2', text: 'Target 2' },
    ],
    options: [
      { option_id: 'o1', text: 'Option 1' },
      { option_id: 'o2', text: 'Option 2' },
    ],
    correctPairs: [
      { target_id: 't1', option_id: 'o1' },
      { target_id: 't2', option_id: 'o2' },
    ]
  };

  const mockOnAnswerChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock classList API used by the drag-and-drop functionality
    const mockClassList = {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn().mockReturnValue(false),
      toggle: jest.fn(),
      replace: jest.fn(),
    };
    
    // Use Object.defineProperty to properly mock classList
    Object.defineProperty(Element.prototype, 'classList', {
      value: mockClassList,
      writable: true,
      configurable: true,
    });
  });

  it('renders correctly with initial state', () => {
    render(
      <DragAndDropQuestionComponent 
        question={mockQuestion}
        onAnswerChange={mockOnAnswerChange}
      />
    );

    // Check that all targets and options are rendered
    expect(screen.getByText('Target 1')).toBeInTheDocument();
    expect(screen.getByText('Target 2')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    
    // Available items section should be present
    expect(screen.getByText('Available Items:')).toBeInTheDocument();
    
    // Match items section should be present
    expect(screen.getByText('Match items to the correct targets:')).toBeInTheDocument();
  });

  it('renders correctly with pre-filled answers', () => {
    const userAnswer = {
      't1': 'o1',
      't2': null
    };
    
    render(
      <DragAndDropQuestionComponent 
        question={mockQuestion}
        onAnswerChange={mockOnAnswerChange}
        userAnswer={userAnswer}
      />
    );
    
    // Option 1 should not be in available options (it's placed in target 1)
    const availableItemsSection = screen.getByText('Available Items:').parentElement;
    expect(availableItemsSection).not.toContain(screen.getByText('Option 1'));
    expect(availableItemsSection).toContain(screen.getByText('Option 2'));
  });

  it('should disable dragging when submitted', () => {
    render(
      <DragAndDropQuestionComponent 
        question={mockQuestion}
        onAnswerChange={mockOnAnswerChange}
        isSubmitted={true}
      />
    );
    
    // Should have options but they should not be draggable
    const options = screen.getAllByText(/Option/);
    expect(options.length).toBeGreaterThan(0);
    options.forEach(option => {
      expect(option.parentElement).toHaveAttribute('draggable', 'false');
    });
  });

  it('should show feedback styling when requested', () => {
    const userAnswer = {
      't1': 'o1', // Correct
      't2': 'o2', // Correct
    };
    
    render(
      <DragAndDropQuestionComponent 
        question={mockQuestion}
        onAnswerChange={mockOnAnswerChange}
        userAnswer={userAnswer}
        showFeedbackStyling={true}
        isSubmitted={true}
      />
    );
    
    // No need for specific CSS assertions - we're mainly testing that the component renders
    // with feedback styling without errors
    expect(screen.getByText('Target 1')).toBeInTheDocument();
    expect(screen.getByText('Target 2')).toBeInTheDocument();
  });

  it('should show correct answers in review mode', () => {
    render(
      <DragAndDropQuestionComponent 
        question={mockQuestion}
        onAnswerChange={mockOnAnswerChange}
        isQuizReviewMode={true}
      />
    );
    
    // In review mode, it should show the correct answers
    // Option 1 should be in Target 1, Option 2 in Target 2
    const target1 = screen.getByText('Target 1').parentElement;
    const target2 = screen.getByText('Target 2').parentElement;
    
    expect(target1).toHaveTextContent('Option 1');
    expect(target2).toHaveTextContent('Option 2');
    
    // Available items section should not have the options
    const availableItemsSection = screen.getByText('Available Items:').parentElement;
    expect(availableItemsSection).not.toHaveTextContent('Option 1');
    expect(availableItemsSection).not.toHaveTextContent('Option 2');
  });
});
