import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderQuestionComponent from '../components/question-types/OrderQuestionComponent';
import { OrderQuestion } from '@/app/types/quiz';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layout, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    )
  }
}));

describe('OrderQuestionComponent', () => {
  // Create a mock question for testing
  const mockQuestion: OrderQuestion = {
    id: 'q1',
    type: 'order',
    question: 'Place these items in the correct order',
    points: 10,
    quiz_tag: 'test-quiz',
    difficulty: 'medium',
    feedback_correct: 'Good job!',
    feedback_incorrect: 'Try again!',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    items: [
      { item_id: 'i1', text: 'First Item' },
      { item_id: 'i2', text: 'Second Item' },
      { item_id: 'i3', text: 'Third Item' },
      { item_id: 'i4', text: 'Fourth Item' },
    ],
    correctOrder: ['i1', 'i2', 'i3', 'i4']
  };

  const mockOnAnswerSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with items in initial order', () => {
    render(
      <OrderQuestionComponent 
        question={mockQuestion}
        onAnswerSelect={mockOnAnswerSelect}
      />
    );
    
    // Check that all items are rendered
    expect(screen.getByText('First Item')).toBeInTheDocument();
    expect(screen.getByText('Second Item')).toBeInTheDocument();
    expect(screen.getByText('Third Item')).toBeInTheDocument();
    expect(screen.getByText('Fourth Item')).toBeInTheDocument();

    // Check that the component sections are displayed
    expect(screen.getByText('Available Items:')).toBeInTheDocument();
    expect(screen.getByText('Ordered Sequence:')).toBeInTheDocument();
  });

  it('should disable dragging when submitted', () => {
    render(
      <OrderQuestionComponent 
        question={mockQuestion}
        onAnswerSelect={mockOnAnswerSelect}
        isSubmitted={true}
      />
    );
    
    // Get all draggable elements by looking for div elements containing items
    const draggableElements = screen.getAllByText(/Item/).map(el => 
      el.closest('div[draggable]')
    ).filter(Boolean);
    
    // Check that all elements have draggable="false"
    draggableElements.forEach(element => {
      expect(element).toHaveAttribute('draggable', 'false');
    });
  });

  it('should show feedback styling when requested', () => {
    // Create a user answer with items in wrong order
    const userAnswer = { '0': 'i2', '1': 'i1', '2': 'i4', '3': 'i3' };
    
    render(
      <OrderQuestionComponent 
        question={mockQuestion}
        onAnswerSelect={mockOnAnswerSelect}
        userAnswer={userAnswer}
        isSubmitted={true}
        showCorrectAnswer={true}
      />
    );

    // Check that the "Correct Order" section is displayed
    expect(screen.getByText('Correct Order:')).toBeInTheDocument();
  });

  it('should initialize with user answer if provided', () => {
    // Create a specific user answer order
    const userAnswer = { 'slot_0': 'i4', 'slot_1': 'i3', 'slot_2': 'i2', 'slot_3': 'i1' };
    
    render(
      <OrderQuestionComponent 
        question={mockQuestion}
        onAnswerSelect={mockOnAnswerSelect}
        userAnswer={userAnswer}
      />
    );

    // Check that items appear in the user's order in the ordered sequence section
    // Look for items within slot containers specifically 
    const slotItems = screen.getAllByText(/Item/).filter(el => 
      el.closest('div[class*="relative pl-10"]')
    );
    expect(slotItems[0].textContent).toBe('Fourth Item');
    expect(slotItems[1].textContent).toBe('Third Item');
    expect(slotItems[2].textContent).toBe('Second Item');
    expect(slotItems[3].textContent).toBe('First Item');
  });

  // Note: Testing drag and drop interactions is complex and often requires
  // more sophisticated setup with user-event or custom testing utilities.
  // For this basic test suite, we'll focus on rendering and props handling.
});
