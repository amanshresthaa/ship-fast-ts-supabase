import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultiChoiceComponent from './MultiChoiceComponent';
import { MultiChoiceQuestion } from '@/app/types/quiz';

// Mock the QuizOption component
jest.mock('../shared/QuizOption', () => {
  // eslint-disable-next-line react/display-name
  return jest.fn(({ optionText, onClick, isSelected, showFeedback, isCorrect, isDisabled }) => (
    <button
      data-testid={`quiz-option-${optionText}`}
      onClick={onClick}
      data-selected={isSelected}
      data-showfeedback={showFeedback}
      data-iscorrect={isCorrect}
      disabled={isDisabled}
    >
      {optionText}
    </button>
  ));
});

const mockQuestion: MultiChoiceQuestion = {
  id: 'q-multi-1',
  type: 'multi-choice',
  questionText: 'Which of the following are primary colors?',
  options: ['Red', 'Green', 'Blue', 'Yellow'],
  correctAnswers: ['Red', 'Blue', 'Yellow'], // Assuming standard primary colors for light
};

describe('MultiChoiceComponent', () => {
  let mockOnSelectionChange: jest.Mock;
  const QuizOptionMock = require('../shared/QuizOption') as jest.Mock;

  beforeEach(() => {
    mockOnSelectionChange = jest.fn();
    QuizOptionMock.mockClear();
  });

  it('renders the question text', () => {
    render(
      <MultiChoiceComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswers={[]}
        showFeedback={false}
        isDisabled={false}
      />
    );
    expect(screen.getByText(mockQuestion.questionText)).toBeInTheDocument();
  });

  it('renders all options using QuizOption', () => {
    render(
      <MultiChoiceComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswers={[]}
        showFeedback={false}
        isDisabled={false}
      />
    );
    mockQuestion.options.forEach(option => {
      expect(screen.getByTestId(`quiz-option-${option}`)).toBeInTheDocument();
    });
    expect(QuizOptionMock).toHaveBeenCalledTimes(mockQuestion.options.length);
  });

  it('calls onSelectionChange with the new selection when an option is clicked (add to selection)', () => {
    render(
      <MultiChoiceComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswers={['Red']}
        showFeedback={false}
        isDisabled={false}
      />
    );
    fireEvent.click(screen.getByTestId('quiz-option-Green'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['Red', 'Green']);
  });

  it('calls onSelectionChange with the updated selection when an option is clicked (remove from selection)', () => {
    render(
      <MultiChoiceComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswers={['Red', 'Green']}
        showFeedback={false}
        isDisabled={false}
      />
    );
    fireEvent.click(screen.getByTestId('quiz-option-Red'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['Green']);
  });

  it('passes correct props to QuizOption based on selectedAnswers', () => {
    const selected = ['Red', 'Blue'];
    render(
      <MultiChoiceComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswers={selected}
        showFeedback={false}
        isDisabled={false}
      />
    );
    mockQuestion.options.forEach((option, index) => {
      expect(QuizOptionMock.mock.calls[index][0]).toMatchObject({
        optionText: option,
        isSelected: selected.includes(option),
        showFeedback: false,
      });
    });
  });

  it('passes correct props to QuizOption when showFeedback is true', () => {
    const selected = ['Red', 'Green']; // Red is correct, Green is not
    render(
      <MultiChoiceComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswers={selected}
        showFeedback={true}
        isDisabled={false}
      />
    );
    mockQuestion.options.forEach((option, index) => {
      expect(QuizOptionMock.mock.calls[index][0]).toMatchObject({
        optionText: option,
        isSelected: selected.includes(option),
        showFeedback: true,
        isCorrect: mockQuestion.correctAnswers.includes(option),
      });
    });
  });

  it('passes isDisabled prop to QuizOption when component is disabled', () => {
    render(
      <MultiChoiceComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswers={[]}
        showFeedback={false}
        isDisabled={true}
      />
    );
    mockQuestion.options.forEach((_, index) => {
      expect(QuizOptionMock.mock.calls[index][0].isDisabled).toBe(true);
    });
  });

  it('does not call onSelectionChange if isDisabled is true and an option is clicked', () => {
    render(
      <MultiChoiceComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswers={[]}
        showFeedback={false}
        isDisabled={true}
      />
    );
    fireEvent.click(screen.getByTestId(`quiz-option-${mockQuestion.options[0]}`));
    expect(mockOnSelectionChange).not.toHaveBeenCalled();
  });
});
