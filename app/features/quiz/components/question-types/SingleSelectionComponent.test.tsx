import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SingleSelectionComponent from './SingleSelectionComponent';
import { SingleSelectionQuestion } from '@/app/types/quiz';

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

const mockQuestion: SingleSelectionQuestion = {
  id: 'q1',
  type: 'single-selection',
  questionText: 'What is the capital of France?',
  options: ['Paris', 'London', 'Berlin', 'Madrid'],
  correctAnswer: 'Paris',
};

describe('SingleSelectionComponent', () => {
  let mockOnSelectionChange: jest.Mock;

  beforeEach(() => {
    mockOnSelectionChange = jest.fn();
    // Clear mock calls for QuizOption if it's a Jest mock function
    const QuizOptionMock = require('../shared/QuizOption') as jest.Mock;
    QuizOptionMock.mockClear();
  });

  it('renders the question text', () => {
    render(
      <SingleSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswer={null}
        showFeedback={false}
        isDisabled={false}
      />
    );
    expect(screen.getByText(mockQuestion.questionText)).toBeInTheDocument();
  });

  it('renders all options using QuizOption', () => {
    render(
      <SingleSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswer={null}
        showFeedback={false}
        isDisabled={false}
      />
    );
    mockQuestion.options.forEach(option => {
      expect(screen.getByTestId(`quiz-option-${option}`)).toBeInTheDocument();
    });
    const QuizOptionMock = require('../shared/QuizOption') as jest.Mock;
    expect(QuizOptionMock).toHaveBeenCalledTimes(mockQuestion.options.length);
  });

  it('calls onSelectionChange with the selected option when an option is clicked', () => {
    render(
      <SingleSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswer={null}
        showFeedback={false}
        isDisabled={false}
      />
    );
    const optionToSelect = mockQuestion.options[0];
    fireEvent.click(screen.getByTestId(`quiz-option-${optionToSelect}`));
    expect(mockOnSelectionChange).toHaveBeenCalledWith(optionToSelect);
  });

  it('passes correct props to QuizOption when an answer is selected', () => {
    const selected = 'Paris';
    render(
      <SingleSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswer={selected}
        showFeedback={false}
        isDisabled={false}
      />
    );
    const QuizOptionMock = require('../shared/QuizOption') as jest.Mock;
    mockQuestion.options.forEach((option, index) => {
      expect(QuizOptionMock.mock.calls[index][0]).toMatchObject({
        optionText: option,
        isSelected: option === selected,
        showFeedback: false, // showFeedback is false in this test
        // isCorrect is not passed directly if showFeedback is false, but QuizOption handles it
      });
    });
  });

  it('passes correct props to QuizOption when showFeedback is true', () => {
    const selected = 'Paris'; // Correct answer
    render(
      <SingleSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswer={selected}
        showFeedback={true}
        isDisabled={false}
      />
    );
    const QuizOptionMock = require('../shared/QuizOption') as jest.Mock;
    mockQuestion.options.forEach((option, index) => {
      expect(QuizOptionMock.mock.calls[index][0]).toMatchObject({
        optionText: option,
        isSelected: option === selected,
        showFeedback: true,
        isCorrect: option === mockQuestion.correctAnswer,
      });
    });
  });

  it('passes correct props to QuizOption when showFeedback is true and a wrong answer is selected', () => {
    const selected = 'London'; // Incorrect answer
    render(
      <SingleSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswer={selected}
        showFeedback={true}
        isDisabled={false}
      />
    );
    const QuizOptionMock = require('../shared/QuizOption') as jest.Mock;
    mockQuestion.options.forEach((option, index) => {
      expect(QuizOptionMock.mock.calls[index][0]).toMatchObject({
        optionText: option,
        isSelected: option === selected,
        showFeedback: true,
        isCorrect: option === mockQuestion.correctAnswer,
      });
    });
  });

  it('passes isDisabled prop to QuizOption when component is disabled', () => {
    render(
      <SingleSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswer={null}
        showFeedback={false}
        isDisabled={true}
      />
    );
    const QuizOptionMock = require('../shared/QuizOption') as jest.Mock;
    mockQuestion.options.forEach((_, index) => {
      expect(QuizOptionMock.mock.calls[index][0].isDisabled).toBe(true);
    });
  });

  it('does not call onSelectionChange if isDisabled is true and an option is clicked', () => {
    render(
      <SingleSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        selectedAnswer={null}
        showFeedback={false}
        isDisabled={true}
      />
    );
    const optionToSelect = mockQuestion.options[0];
    // The mocked QuizOption is a button, fireEvent.click should respect the disabled prop on the mock itself.
    // If the mock wasn't a button or didn't handle disabled, this test might need adjustment.
    fireEvent.click(screen.getByTestId(`quiz-option-${optionToSelect}`));
    expect(mockOnSelectionChange).not.toHaveBeenCalled();
  });
});
