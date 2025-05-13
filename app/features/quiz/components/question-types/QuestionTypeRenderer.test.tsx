import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionTypeRenderer from './QuestionTypeRenderer';
import { QuizQuestion, SingleSelectionQuestion, MultiChoiceQuestion, DropdownSelectionQuestion, DragAndDropQuestion } from '@/app/types/quiz';

// Mock child components
jest.mock('./SingleSelectionComponent', () => jest.fn(() => <div data-testid="single-selection-mock">SingleSelectionComponent</div>));
jest.mock('./MultiChoiceComponent', () => jest.fn(() => <div data-testid="multi-choice-mock">MultiChoiceComponent</div>));
jest.mock('./DropdownSelectionComponent', () => jest.fn(() => <div data-testid="dropdown-selection-mock">DropdownSelectionComponent</div>));
jest.mock('./DragAndDropQuestionComponent', () => jest.fn(() => <div data-testid="drag-and-drop-mock">DragAndDropQuestionComponent</div>));

const mockSingleSelectionQuestion: SingleSelectionQuestion = {
  id: 'q1',
  type: 'single-selection',
  questionText: 'Single selection question?',
  options: ['A', 'B'],
  correctAnswer: 'A',
};

const mockMultiChoiceQuestion: MultiChoiceQuestion = {
  id: 'q2',
  type: 'multi-choice',
  questionText: 'Multi-choice question?',
  options: ['A', 'B', 'C'],
  correctAnswers: ['A', 'C'],
};

const mockDropdownQuestion: DropdownSelectionQuestion = {
  id: 'q3',
  type: 'dropdown',
  questionText: 'Dropdown [P1] question [P2]?',
  options: { P1: ['Opt1'], P2: ['Opt2'] },
  correctAnswers: { P1: 'Opt1', P2: 'Opt2' },
  placeholders: ['P1', 'P2'],
};

const mockDragAndDropQuestion: DragAndDropQuestion = {
  id: 'q4',
  type: 'drag-and-drop',
  questionText: 'Drag and drop question?',
  options: ['Item1', 'Item2'],
  targets: ['TargetA', 'TargetB'],
  correctMatches: { Item1: 'TargetA' }, 
};

describe('QuestionTypeRenderer', () => {
  const mockOnSelectionChange = jest.fn();
  const mockOnAnswersChange = jest.fn(); // For multi-choice
  const mockOnDropdownChange = jest.fn(); // For dropdown
  const mockOnMatchChange = jest.fn(); // For drag-and-drop

  const SingleSelectionComponentMock = require('./SingleSelectionComponent') as jest.Mock;
  const MultiChoiceComponentMock = require('./MultiChoiceComponent') as jest.Mock;
  const DropdownSelectionComponentMock = require('./DropdownSelectionComponent') as jest.Mock;
  const DragAndDropQuestionComponentMock = require('./DragAndDropQuestionComponent') as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders SingleSelectionComponent for single-selection questions and passes props', () => {
    const props = {
      question: mockSingleSelectionQuestion as QuizQuestion,
      onSelectionChange: mockOnSelectionChange,
      selectedAnswer: 'A',
      showFeedback: true,
      isDisabled: false,
    };
    render(<QuestionTypeRenderer {...props} />);
    expect(screen.getByTestId('single-selection-mock')).toBeInTheDocument();
    expect(SingleSelectionComponentMock).toHaveBeenCalledWith(
      {
        question: mockSingleSelectionQuestion,
        onSelectionChange: mockOnSelectionChange,
        selectedAnswer: 'A',
        showFeedback: true,
        isDisabled: false,
      },
      {}
    );
  });

  it('renders MultiChoiceComponent for multi-choice questions and passes props', () => {
    const props = {
      question: mockMultiChoiceQuestion as QuizQuestion,
      onSelectionChange: mockOnAnswersChange, // Corrected prop name for multi-choice
      selectedAnswers: ['A'],
      showFeedback: false,
      isDisabled: true,
    };
    render(<QuestionTypeRenderer {...props} />);
    expect(screen.getByTestId('multi-choice-mock')).toBeInTheDocument();
    expect(MultiChoiceComponentMock).toHaveBeenCalledWith(
      {
        question: mockMultiChoiceQuestion,
        onSelectionChange: mockOnAnswersChange, // Corrected prop name
        selectedAnswers: ['A'],
        showFeedback: false,
        isDisabled: true,
      },
      {}
    );
  });

  it('renders DropdownSelectionComponent for dropdown questions and passes props', () => {
    const props = {
      question: mockDropdownQuestion as QuizQuestion,
      onSelectionChange: mockOnDropdownChange, // Prop for DropdownSelectionComponent
      // selectedAnswers for Dropdown is managed by its hook, not passed directly to renderer like this
      // The renderer passes onSelectionChange which the hook uses.
      showFeedback: true,
      isDisabled: false,
    };
    render(<QuestionTypeRenderer {...props} />);
    expect(screen.getByTestId('dropdown-selection-mock')).toBeInTheDocument();
    expect(DropdownSelectionComponentMock).toHaveBeenCalledWith(
      {
        question: mockDropdownQuestion,
        onSelectionChange: mockOnDropdownChange,
        showFeedback: true,
        isDisabled: false,
      },
      {}
    );
  });

  it('renders DragAndDropQuestionComponent for drag-and-drop questions and passes props', () => {
    const props = {
      question: mockDragAndDropQuestion as QuizQuestion,
      onMatchChange: mockOnMatchChange, // Corrected prop name for drag-and-drop
      // matches for DragAndDrop is managed by its hook
      showFeedback: false,
      isDisabled: true,
    };
    render(<QuestionTypeRenderer {...props} />);
    expect(screen.getByTestId('drag-and-drop-mock')).toBeInTheDocument();
    expect(DragAndDropQuestionComponentMock).toHaveBeenCalledWith(
      {
        question: mockDragAndDropQuestion,
        onMatchChange: mockOnMatchChange, // Corrected prop name
        showFeedback: false,
        isDisabled: true,
      },
      {}
    );
  });

  it('renders nothing and logs an error for an unknown question type', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const unknownQuestion = { id: 'q-unknown', type: 'unknown-type', questionText: 'Test' } as unknown as QuizQuestion;
    const { container } = render(
      <QuestionTypeRenderer
        question={unknownQuestion}
        onSelectionChange={mockOnSelectionChange}
        showFeedback={false}
        isDisabled={false}
      />
    );
    expect(container.firstChild).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown question type:', 'unknown-type');
    consoleErrorSpy.mockRestore();
  });

  it('passes showFeedback=false by default if not provided', () => {
    const props = {
      question: mockSingleSelectionQuestion as QuizQuestion,
      onSelectionChange: mockOnSelectionChange,
      selectedAnswer: 'A',
      isDisabled: false,
      // showFeedback is omitted
    };
    render(<QuestionTypeRenderer {...props} />);    
    expect(SingleSelectionComponentMock).toHaveBeenCalledWith(
      expect.objectContaining({ showFeedback: false }),
      {}
    );
  });

  it('passes isDisabled=false by default if not provided', () => {
    const props = {
      question: mockSingleSelectionQuestion as QuizQuestion,
      onSelectionChange: mockOnSelectionChange,
      selectedAnswer: 'A',
      showFeedback: true,
      // isDisabled is omitted
    };
    render(<QuestionTypeRenderer {...props} />);    
    expect(SingleSelectionComponentMock).toHaveBeenCalledWith(
      expect.objectContaining({ isDisabled: false }),
      {}
    );
  });
});
