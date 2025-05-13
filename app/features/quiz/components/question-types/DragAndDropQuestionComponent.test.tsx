import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DragAndDropQuestionComponent from './DragAndDropQuestionComponent';
import { DragAndDropQuestion } from '@/app/types/quiz';

// Mock the useDragAndDropQuiz hook
const mockHandleDrop = jest.fn();
const mockHandleRemoveMatch = jest.fn();
const mockUseDragAndDropQuiz = jest.fn();
jest.mock('../../hooks/useDragAndDropQuiz', () => mockUseDragAndDropQuiz);

// Mock framer-motion
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'), // Import and retain default exports
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: jest.fn(({ children, ...props }: any) => <div {...props}>{children}</div>),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    span: jest.fn(({ children, ...props }: any) => <span {...props}>{children}</span>),
  },
}));

const mockQuestion: DragAndDropQuestion = {
  id: 'dnd1',
  type: 'drag-and-drop',
  questionText: 'Match countries to capitals:',
  options: ['Paris', 'Berlin', 'Madrid'],
  targets: ['France', 'Germany', 'Spain'],
  correctMatches: { Paris: 'France', Berlin: 'Germany', Madrid: 'Spain' },
};

describe('DragAndDropQuestionComponent', () => {
  let mockOnMatchChange: jest.Mock;

  beforeEach(() => {
    mockOnMatchChange = jest.fn();
    mockHandleDrop.mockClear();
    mockHandleRemoveMatch.mockClear();
    mockUseDragAndDropQuiz.mockImplementation(() => ({
      matches: {},
      isCorrectMap: {},
      allMatchedCorrectly: false,
      unmatchedOptions: mockQuestion.options,
      handleDrop: mockHandleDrop,
      handleRemoveMatch: mockHandleRemoveMatch,
    }));
  });

  it('renders the question text', () => {
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    expect(screen.getByText(mockQuestion.questionText)).toBeInTheDocument();
  });

  it('renders unmatched options as draggable items', () => {
    mockUseDragAndDropQuiz.mockImplementation(() => ({
      matches: {},
      isCorrectMap: {},
      allMatchedCorrectly: false,
      unmatchedOptions: ['Paris', 'Berlin'],
      handleDrop: mockHandleDrop,
      handleRemoveMatch: mockHandleRemoveMatch,
    }));
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    expect(screen.getByTestId('draggable-option-Paris')).toBeInTheDocument();
    expect(screen.getByTestId('draggable-option-Berlin')).toBeInTheDocument();
    expect(screen.queryByTestId('draggable-option-Madrid')).not.toBeInTheDocument();
  });

  it('renders all targets as drop zones', () => {
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    mockQuestion.targets.forEach(target => {
      expect(screen.getByTestId(`drop-target-${target}`)).toBeInTheDocument();
    });
  });

  it('displays matched items in their targets', () => {
    mockUseDragAndDropQuiz.mockImplementation(() => ({
      matches: { France: 'Paris' },
      isCorrectMap: {},
      allMatchedCorrectly: false,
      unmatchedOptions: ['Berlin', 'Madrid'],
      handleDrop: mockHandleDrop,
      handleRemoveMatch: mockHandleRemoveMatch,
    }));
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    const franceTarget = screen.getByTestId('drop-target-France');
    expect(franceTarget).toHaveTextContent('Paris');
    // Check that Paris is not in the unmatched options list
    expect(screen.queryByTestId('draggable-option-Paris')).not.toBeInTheDocument();
  });

  // Drag and drop interactions are hard to test directly with RTL without a complex setup.
  // We will test if the drop handler from the hook is called by simulating the onDrop event on the target.
  it('calls handleDrop from hook when an item is dropped (simulated)', () => {
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    const targetElement = screen.getByTestId('drop-target-France');
    // Simulate the dataTransfer object for the drop event
    const mockDataTransfer = {
      getData: jest.fn(() => 'Paris'), // Simulate dragged item's ID/text
    };
    fireEvent.drop(targetElement, { dataTransfer: mockDataTransfer });
    expect(mockHandleDrop).toHaveBeenCalledWith('France', 'Paris');
  });

  it('calls handleRemoveMatch from hook when a matched item is clicked', () => {
    mockUseDragAndDropQuiz.mockImplementation(() => ({
      matches: { France: 'Paris' }, // Item 'Paris' is matched to 'France'
      isCorrectMap: {},
      allMatchedCorrectly: false,
      unmatchedOptions: ['Berlin', 'Madrid'],
      handleDrop: mockHandleDrop,
      handleRemoveMatch: mockHandleRemoveMatch,
    }));
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    const matchedItemInTarget = screen.getByTestId('matched-item-France');
    fireEvent.click(matchedItemInTarget);
    expect(mockHandleRemoveMatch).toHaveBeenCalledWith('France');
  });

  it('applies correct feedback class to target when showFeedback is true and match is correct', () => {
    mockUseDragAndDropQuiz.mockImplementation(() => ({
      matches: { France: 'Paris' },
      isCorrectMap: { France: true },
      allMatchedCorrectly: false,
      unmatchedOptions: ['Berlin', 'Madrid'],
      handleDrop: mockHandleDrop,
      handleRemoveMatch: mockHandleRemoveMatch,
    }));
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={true}
        isDisabled={false}
      />
    );
    expect(screen.getByTestId('drop-target-France')).toHaveClass('border-green-500');
  });

  it('applies incorrect feedback class to target when showFeedback is true and match is incorrect', () => {
    mockUseDragAndDropQuiz.mockImplementation(() => ({
      matches: { France: 'Berlin' }, // Incorrect match
      isCorrectMap: { France: false },
      allMatchedCorrectly: false,
      unmatchedOptions: ['Paris', 'Madrid'],
      handleDrop: mockHandleDrop,
      handleRemoveMatch: mockHandleRemoveMatch,
    }));
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={true}
        isDisabled={false}
      />
    );
    expect(screen.getByTestId('drop-target-France')).toHaveClass('border-red-500');
  });

  it('does not apply feedback classes when showFeedback is false', () => {
    mockUseDragAndDropQuiz.mockImplementation(() => ({
      matches: { France: 'Paris' },
      isCorrectMap: { France: true }, // Hook might still calculate this
      allMatchedCorrectly: false,
      unmatchedOptions: ['Berlin', 'Madrid'],
      handleDrop: mockHandleDrop,
      handleRemoveMatch: mockHandleRemoveMatch,
    }));
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={false} // Feedback off
        isDisabled={false}
      />
    );
    const target = screen.getByTestId('drop-target-France');
    expect(target).not.toHaveClass('border-green-500');
    expect(target).not.toHaveClass('border-red-500');
  });

  it('disables draggable options and drop targets when isDisabled is true', () => {
    mockUseDragAndDropQuiz.mockImplementation(() => ({
      matches: { France: 'Paris' },
      isCorrectMap: {},
      allMatchedCorrectly: false,
      unmatchedOptions: ['Berlin', 'Madrid'],
      handleDrop: mockHandleDrop,
      handleRemoveMatch: mockHandleRemoveMatch,
    }));
    render(
      <DragAndDropQuestionComponent
        question={mockQuestion}
        onMatchChange={mockOnMatchChange}
        showFeedback={false}
        isDisabled={true}
      />
    );
    // Check draggable options
    const berlinOption = screen.getByTestId('draggable-option-Berlin');
    expect(berlinOption).toHaveAttribute('draggable', 'false');
    expect(berlinOption).toHaveClass('cursor-not-allowed');

    // Check matched item (should not be clickable to remove)
    const matchedItem = screen.getByTestId('matched-item-France');
    fireEvent.click(matchedItem);
    expect(mockHandleRemoveMatch).not.toHaveBeenCalled();

    // Check drop target (should not allow drop)
    const targetElement = screen.getByTestId('drop-target-Germany');
    const mockDataTransfer = { getData: jest.fn(() => 'Berlin') };
    fireEvent.drop(targetElement, { dataTransfer: mockDataTransfer });
    expect(mockHandleDrop).not.toHaveBeenCalled();
  });
});
