import { renderHook, act } from '@testing-library/react';
import useDropdownSelection from './useDropdownSelection';
import { DropdownSelectionQuestion } from '@/app/types/quiz';

const mockQuestion: DropdownSelectionQuestion = {
  id: 'q1',
  type: 'dropdown',
  questionText: '[P1] is the capital of [P2].',
  options: {
    P1: ['Paris', 'Berlin', 'London'],
    P2: ['France', 'Germany', 'UK'],
  },
  correctAnswers: {
    P1: 'Paris',
    P2: 'France',
  },
  placeholders: ['P1', 'P2'], // Ensure this is part of the mock if your hook uses it directly
};

const mockQuestionSinglePlaceholder: DropdownSelectionQuestion = {
  id: 'q2',
  type: 'dropdown',
  questionText: 'The best fruit is [F1].',
  options: {
    F1: ['Apple', 'Banana', 'Orange'],
  },
  correctAnswers: {
    F1: 'Banana',
  },
  placeholders: ['F1'],
};

describe('useDropdownSelection', () => {
  let mockOnSelectionChange: jest.Mock;

  beforeEach(() => {
    mockOnSelectionChange = jest.fn();
  });

  it('should initialize with empty selectedAnswers, empty isCorrectMap, and allCorrect as false', () => {
    const { result } = renderHook(() =>
      useDropdownSelection({
        question: mockQuestion,
        showFeedback: false,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    expect(result.current.selectedAnswers).toEqual({});
    expect(result.current.isCorrectMap).toEqual({});
    expect(result.current.allCorrect).toBe(false);
  });

  it('handleSelectChange should update selectedAnswers and call onSelectionChange', () => {
    const { result } = renderHook(() =>
      useDropdownSelection({
        question: mockQuestion,
        showFeedback: false,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.handleSelectChange('P1', 'Paris');
    });

    expect(result.current.selectedAnswers).toEqual({ P1: 'Paris' });
    expect(mockOnSelectionChange).toHaveBeenCalledWith({ P1: 'Paris' });
    expect(result.current.allCorrect).toBe(false); // Not all selected yet
  });

  it('handleSelectChange should update isCorrectMap when showFeedback is true (correct answer)', () => {
    const { result } = renderHook(() =>
      useDropdownSelection({
        question: mockQuestion,
        showFeedback: true,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.handleSelectChange('P1', 'Paris');
    });

    expect(result.current.selectedAnswers).toEqual({ P1: 'Paris' });
    expect(result.current.isCorrectMap).toEqual({ P1: true });
    expect(mockOnSelectionChange).toHaveBeenCalledWith({ P1: 'Paris' });
  });

  it('handleSelectChange should update isCorrectMap when showFeedback is true (incorrect answer)', () => {
    const { result } = renderHook(() =>
      useDropdownSelection({
        question: mockQuestion,
        showFeedback: true,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.handleSelectChange('P1', 'Berlin');
    });

    expect(result.current.selectedAnswers).toEqual({ P1: 'Berlin' });
    expect(result.current.isCorrectMap).toEqual({ P1: false });
    expect(mockOnSelectionChange).toHaveBeenCalledWith({ P1: 'Berlin' });
  });

  it('handleSelectChange should not update isCorrectMap when showFeedback is false', () => {
    const { result } = renderHook(() =>
      useDropdownSelection({
        question: mockQuestion,
        showFeedback: false,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.handleSelectChange('P1', 'Paris'); // Correct answer
    });
    expect(result.current.isCorrectMap).toEqual({});

    act(() => {
      result.current.handleSelectChange('P2', 'Germany'); // Incorrect answer
    });
    expect(result.current.isCorrectMap).toEqual({});
    expect(result.current.selectedAnswers).toEqual({ P1: 'Paris', P2: 'Germany' });
  });

  it('allCorrect should be true when all answers are correct and all placeholders filled', () => {
    const { result } = renderHook(() =>
      useDropdownSelection({
        question: mockQuestion,
        showFeedback: true, // showFeedback doesn't impact allCorrect directly, but good to test
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.handleSelectChange('P1', 'Paris');
    });
    expect(result.current.allCorrect).toBe(false);

    act(() => {
      result.current.handleSelectChange('P2', 'France');
    });

    expect(result.current.selectedAnswers).toEqual({ P1: 'Paris', P2: 'France' });
    expect(result.current.isCorrectMap).toEqual({ P1: true, P2: true });
    expect(result.current.allCorrect).toBe(true);
  });

  it('allCorrect should be false if any answer is incorrect, even if all placeholders filled', () => {
    const { result } = renderHook(() =>
      useDropdownSelection({
        question: mockQuestion,
        showFeedback: true,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.handleSelectChange('P1', 'Paris');
    });
    act(() => {
      result.current.handleSelectChange('P2', 'Germany'); // Incorrect
    });

    expect(result.current.selectedAnswers).toEqual({ P1: 'Paris', P2: 'Germany' });
    expect(result.current.isCorrectMap).toEqual({ P1: true, P2: false });
    expect(result.current.allCorrect).toBe(false);
  });

  it('allCorrect should be false if not all placeholders are filled', () => {
    const { result } = renderHook(() =>
      useDropdownSelection({
        question: mockQuestion, // 2 placeholders
        showFeedback: true,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.handleSelectChange('P1', 'Paris'); // Only one filled
    });

    expect(result.current.allCorrect).toBe(false);
  });

  it('should correctly determine allCorrect for a single placeholder question', () => {
    const { result } = renderHook(() =>
      useDropdownSelection({
        question: mockQuestionSinglePlaceholder,
        showFeedback: true,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    expect(result.current.allCorrect).toBe(false);

    act(() => {
      result.current.handleSelectChange('F1', 'Banana'); // Correct answer
    });
    expect(result.current.selectedAnswers).toEqual({ F1: 'Banana' });
    expect(result.current.isCorrectMap).toEqual({ F1: true });
    expect(result.current.allCorrect).toBe(true);

    act(() => {
      result.current.handleSelectChange('F1', 'Apple'); // Incorrect answer
    });
    expect(result.current.selectedAnswers).toEqual({ F1: 'Apple' });
    expect(result.current.isCorrectMap).toEqual({ F1: false });
    expect(result.current.allCorrect).toBe(false);
  });

   it('should reset isCorrectMap when showFeedback changes from true to false', () => {
    const { result, rerender } = renderHook(
      ({ showFeedback }) => useDropdownSelection({
        question: mockQuestion,
        showFeedback,
        onSelectionChange: mockOnSelectionChange,
      }),
      { initialProps: { showFeedback: true } }
    );

    act(() => {
      result.current.handleSelectChange('P1', 'Paris'); // Correct
      result.current.handleSelectChange('P2', 'Germany'); // Incorrect
    });

    expect(result.current.isCorrectMap).toEqual({ P1: true, P2: false });

    rerender({ showFeedback: false });

    // isCorrectMap should clear or reset because feedback is now hidden
    // The current hook implementation re-evaluates isCorrectMap on every render if showFeedback is true,
    // and sets it to {} if showFeedback is false. So, this should pass.
    expect(result.current.isCorrectMap).toEqual({});
  });

  it('should re-evaluate isCorrectMap when showFeedback changes from false to true', () => {
    const { result, rerender } = renderHook(
      ({ showFeedback }) => useDropdownSelection({
        question: mockQuestion,
        showFeedback,
        onSelectionChange: mockOnSelectionChange,
      }),
      { initialProps: { showFeedback: false } }
    );

    act(() => {
      result.current.handleSelectChange('P1', 'Paris'); // Correct
      result.current.handleSelectChange('P2', 'Germany'); // Incorrect
    });

    expect(result.current.isCorrectMap).toEqual({}); // No feedback shown initially

    rerender({ showFeedback: true });

    // isCorrectMap should now be populated based on selectedAnswers and correctAnswers
    expect(result.current.isCorrectMap).toEqual({ P1: true, P2: false });
  });
});
