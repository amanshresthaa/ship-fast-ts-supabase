import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuizOption from './QuizOption'; // Adjust the import path as necessary

// Mock the FeedbackIcon component
jest.mock('./FeedbackIcon', () => ({ type, className }: { type: string, className?: string }) => (
  <div data-testid={`feedback-icon-${type}`} className={className}>
    {type === 'correct' ? '✓' : '✗'}
  </div>
));

describe('QuizOption', () => {
  const mockOnClick = jest.fn();
  const optionText = 'Test Option';

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders the option text', () => {
    render(
      <QuizOption
        optionText={optionText}
        onClick={mockOnClick}
        isSelected={false}
        showFeedback={false}
        isCorrect={false}
      />
    );
    expect(screen.getByText(optionText)).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    render(
      <QuizOption
        optionText={optionText}
        onClick={mockOnClick}
        isSelected={false}
        showFeedback={false}
        isCorrect={false}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when isSelected is true', () => {
    render(
      <QuizOption
        optionText={optionText}
        onClick={mockOnClick}
        isSelected={true}
        showFeedback={false}
        isCorrect={false}
      />
    );
    expect(screen.getByRole('button')).toHaveClass('ring-2 ring-blue-500 shadow-lg');
  });

  it('does not apply selected styles when isSelected is false', () => {
    render(
      <QuizOption
        optionText={optionText}
        onClick={mockOnClick}
        isSelected={false}
        showFeedback={false}
        isCorrect={false}
      />
    );
    expect(screen.getByRole('button')).not.toHaveClass('ring-2 ring-blue-500 shadow-lg');
  });

  describe('Feedback Display', () => {
    it('shows correct feedback icon when showFeedback is true and isCorrect is true', () => {
      render(
        <QuizOption
          optionText={optionText}
          onClick={mockOnClick}
          isSelected={true}
          showFeedback={true}
          isCorrect={true}
        />
      );
      expect(screen.getByTestId('feedback-icon-correct')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('border-green-500');
    });

    it('shows incorrect feedback icon when showFeedback is true and isCorrect is false', () => {
      render(
        <QuizOption
          optionText={optionText}
          onClick={mockOnClick}
          isSelected={true}
          showFeedback={true}
          isCorrect={false}
        />
      );
      expect(screen.getByTestId('feedback-icon-incorrect')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('border-red-500');
    });

    it('does not show feedback icon when showFeedback is false, even if selected and isCorrect', () => {
      render(
        <QuizOption
          optionText={optionText}
          onClick={mockOnClick}
          isSelected={true}
          showFeedback={false}
          isCorrect={true}
        />
      );
      expect(screen.queryByTestId('feedback-icon-correct')).not.toBeInTheDocument();
      expect(screen.queryByTestId('feedback-icon-incorrect')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).not.toHaveClass('border-green-500');
      expect(screen.getByRole('button')).not.toHaveClass('border-red-500');
    });

    it('does not show feedback icon if not selected, even if showFeedback is true', () => {
      render(
        <QuizOption
          optionText={optionText}
          onClick={mockOnClick}
          isSelected={false}
          showFeedback={true}
          isCorrect={true} // or false, doesn't matter if not selected
        />
      );
      expect(screen.queryByTestId('feedback-icon-correct')).not.toBeInTheDocument();
      expect(screen.queryByTestId('feedback-icon-incorrect')).not.toBeInTheDocument();
    });
  });

  it('applies disabled attribute when isDisabled is true', () => {
    render(
      <QuizOption
        optionText={optionText}
        onClick={mockOnClick}
        isSelected={false}
        showFeedback={false}
        isCorrect={false}
        isDisabled={true}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveClass('opacity-50 cursor-not-allowed');
  });

  it('does not apply disabled attribute when isDisabled is false or undefined', () => {
    render(
      <QuizOption
        optionText={optionText}
        onClick={mockOnClick}
        isSelected={false}
        showFeedback={false}
        isCorrect={false}
        isDisabled={false}
      />
    );
    expect(screen.getByRole('button')).not.toBeDisabled();
    expect(screen.getByRole('button')).not.toHaveClass('opacity-50 cursor-not-allowed');
  });
});
