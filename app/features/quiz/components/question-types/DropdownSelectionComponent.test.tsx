import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DropdownSelectionComponent from './DropdownSelectionComponent';
import { DropdownSelectionQuestion } from '@/app/types/quiz';

// Mock the useDropdownSelection hook
const mockHandleSelectChange = jest.fn();
const mockUseDropdownSelection = jest.fn(() => ({
  selectedAnswers: {},
  isCorrectMap: {},
  allCorrect: false,
  handleSelectChange: mockHandleSelectChange,
}));
jest.mock('../../hooks/useDropdownSelection', () => mockUseDropdownSelection);

// Mock the parseDropdownQuestion utility
const mockParseDropdownQuestion = jest.fn();
jest.mock('../../utils/questionParser', () => ({
  parseDropdownQuestion: mockParseDropdownQuestion,
}));

const mockQuestion: DropdownSelectionQuestion = {
  id: 'ddq1',
  type: 'dropdown',
  questionText: 'The capital of [P1] is [P2].',
  options: {
    P1: ['France', 'Germany'],
    P2: ['Paris', 'Berlin'],
  },
  correctAnswers: {
    P1: 'France',
    P2: 'Paris',
  },
  placeholders: ['P1', 'P2'], // Added for completeness, though parsing is mocked
};

const mockParsedOutput = {
  parts: ['The capital of ', ' is ', '.'],
  placeholders: ['P1', 'P2'],
};

describe('DropdownSelectionComponent', () => {
  let mockOnSelectionChange: jest.Mock;

  beforeEach(() => {
    mockOnSelectionChange = jest.fn();
    mockHandleSelectChange.mockClear();
    mockUseDropdownSelection.mockClear().mockReturnValue({
      selectedAnswers: {},
      isCorrectMap: {},
      allCorrect: false,
      handleSelectChange: mockHandleSelectChange,
    });
    mockParseDropdownQuestion.mockClear().mockReturnValue(mockParsedOutput);
  });

  it('renders parsed question parts and select elements for placeholders', () => {
    render(
      <DropdownSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange} // This prop is passed to the hook
        showFeedback={false}
        isDisabled={false}
        // selectedAnswers and onAnswerChange are no longer direct props
      />
    );

    expect(mockParseDropdownQuestion).toHaveBeenCalledWith(mockQuestion.questionText);
    expect(screen.getByText('The capital of')).toBeInTheDocument();
    expect(screen.getByText('is')).toBeInTheDocument(); // Adjusted for new parsing
    expect(screen.getByText('.')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(mockParsedOutput.placeholders.length);

    // Check if select elements for P1 and P2 are present
    expect(screen.getByTestId('dropdown-P1')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-P2')).toBeInTheDocument();
  });

  it('calls handleSelectChange from hook when a dropdown value changes', () => {
    render(
      <DropdownSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    const selectP1 = screen.getByTestId('dropdown-P1');
    fireEvent.change(selectP1, { target: { value: 'France' } });
    expect(mockHandleSelectChange).toHaveBeenCalledWith('P1', 'France');
  });

  it('renders correct options in select dropdowns', () => {
    render(
      <DropdownSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    const selectP1 = screen.getByTestId('dropdown-P1');
    expect(selectP1.children).toHaveLength(mockQuestion.options.P1.length + 1); // +1 for default option
    mockQuestion.options.P1.forEach(opt => {
      expect(screen.getByRole('option', { name: opt })).toBeInTheDocument();
    });

    const selectP2 = screen.getByTestId('dropdown-P2');
    expect(selectP2.children).toHaveLength(mockQuestion.options.P2.length + 1);
    mockQuestion.options.P2.forEach(opt => {
      // Need to be more specific if options are repeated across dropdowns
      // For this test, assuming unique options or test one dropdown at a time for options
      const optionElements = screen.getAllByRole('option', { name: opt });
      expect(optionElements.some(el => selectP2.contains(el))).toBe(true);
    });
  });

  it('sets select values based on selectedAnswers from hook', () => {
    mockUseDropdownSelection.mockReturnValue({
      selectedAnswers: { P1: 'Germany', P2: 'Berlin' },
      isCorrectMap: {},
      allCorrect: false,
      handleSelectChange: mockHandleSelectChange,
    });

    render(
      <DropdownSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    expect(screen.getByTestId('dropdown-P1')).toHaveValue('Germany');
    expect(screen.getByTestId('dropdown-P2')).toHaveValue('Berlin');
  });

  it('applies correct feedback class when showFeedback is true and answer is correct', () => {
    mockUseDropdownSelection.mockReturnValue({
      selectedAnswers: { P1: 'France' },
      isCorrectMap: { P1: true },
      allCorrect: false,
      handleSelectChange: mockHandleSelectChange,
    });

    render(
      <DropdownSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        showFeedback={true}
        isDisabled={false}
      />
    );
    expect(screen.getByTestId('dropdown-P1')).toHaveClass('border-green-500');
  });

  it('applies incorrect feedback class when showFeedback is true and answer is incorrect', () => {
    mockUseDropdownSelection.mockReturnValue({
      selectedAnswers: { P1: 'Germany' },
      isCorrectMap: { P1: false },
      allCorrect: false,
      handleSelectChange: mockHandleSelectChange,
    });

    render(
      <DropdownSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        showFeedback={true}
        isDisabled={false}
      />
    );
    expect(screen.getByTestId('dropdown-P1')).toHaveClass('border-red-500');
  });

  it('does not apply feedback classes when showFeedback is false', () => {
    mockUseDropdownSelection.mockReturnValue({
      selectedAnswers: { P1: 'France' }, // Correct answer
      isCorrectMap: { P1: true }, // Hook might still calculate this
      allCorrect: false,
      handleSelectChange: mockHandleSelectChange,
    });

    render(
      <DropdownSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        showFeedback={false} // Feedback is off
        isDisabled={false}
      />
    );
    const dropdown = screen.getByTestId('dropdown-P1');
    expect(dropdown).not.toHaveClass('border-green-500');
    expect(dropdown).not.toHaveClass('border-red-500');
  });

  it('disables select elements when isDisabled is true', () => {
    render(
      <DropdownSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        showFeedback={false}
        isDisabled={true}
      />
    );
    const selects = screen.getAllByRole('combobox');
    selects.forEach(select => {
      expect(select).toBeDisabled();
    });
  });

  it('does not call handleSelectChange if isDisabled is true', () => {
    render(
      <DropdownSelectionComponent
        question={mockQuestion}
        onSelectionChange={mockOnSelectionChange}
        showFeedback={false}
        isDisabled={true}
      />
    );
    const selectP1 = screen.getByTestId('dropdown-P1');
    fireEvent.change(selectP1, { target: { value: 'France' } });
    expect(mockHandleSelectChange).not.toHaveBeenCalled();
  });

});
