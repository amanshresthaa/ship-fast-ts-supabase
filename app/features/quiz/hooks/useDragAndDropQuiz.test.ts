import { renderHook, act } from '@testing-library/react';
import useDragAndDropQuiz from './useDragAndDropQuiz';
import { DragAndDropQuestion } from '@/app/types/quiz';

const mockQuestion: DragAndDropQuestion = {
  id: 'ddq1',
  type: 'drag-and-drop',
  questionText: 'Match the capitals to their countries:',
  options: ['Paris', 'Berlin', 'Madrid'],
  targets: ['France', 'Germany', 'Spain'],
  correctMatches: {
    Paris: 'France',
    Berlin: 'Germany',
    Madrid: 'Spain',
  },
};

const mockQuestionWithLessOptions: DragAndDropQuestion = {
  id: 'ddq2',
  type: 'drag-and-drop',
  questionText: 'Match the fruit to its color:',
  options: ['Apple', 'Banana'],
  targets: ['Red', 'Yellow', 'Green'], // More targets than options
  correctMatches: {
    Apple: 'Red',
    Banana: 'Yellow',
  },
};


describe('useDragAndDropQuiz', () => {
  let mockOnMatchChange: jest.Mock;

  beforeEach(() => {
    mockOnMatchChange = jest.fn();
  });

  it('should initialize with empty matches, empty isCorrectMap, and allMatchedCorrectly as false', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: false,
        onMatchChange: mockOnMatchChange,
      })
    );
    expect(result.current.matches).toEqual({});
    expect(result.current.isCorrectMap).toEqual({});
    expect(result.current.allMatchedCorrectly).toBe(false);
    expect(result.current.unmatchedOptions).toEqual(mockQuestion.options);
  });

  it('handleDrop should add a match and call onMatchChange', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: false,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => {
      result.current.handleDrop('France', 'Paris');
    });

    expect(result.current.matches).toEqual({ France: 'Paris' });
    expect(mockOnMatchChange).toHaveBeenCalledWith({ France: 'Paris' });
    expect(result.current.unmatchedOptions).toEqual(['Berlin', 'Madrid']);
  });

  it('handleDrop should update isCorrectMap when showFeedback is true (correct match)', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: true,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => {
      result.current.handleDrop('France', 'Paris');
    });

    expect(result.current.matches).toEqual({ France: 'Paris' });
    expect(result.current.isCorrectMap).toEqual({ France: true });
  });

  it('handleDrop should update isCorrectMap when showFeedback is true (incorrect match)', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: true,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => {
      result.current.handleDrop('France', 'Berlin'); // Berlin is not capital of France
    });

    expect(result.current.matches).toEqual({ France: 'Berlin' });
    expect(result.current.isCorrectMap).toEqual({ France: false });
    expect(result.current.unmatchedOptions).toEqual(['Paris', 'Madrid']);
  });

  it('handleDrop should not update isCorrectMap when showFeedback is false', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: false,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => {
      result.current.handleDrop('France', 'Paris'); // Correct match
    });
    expect(result.current.isCorrectMap).toEqual({});

    act(() => {
      result.current.handleDrop('Germany', 'Madrid'); // Incorrect match
    });
    expect(result.current.isCorrectMap).toEqual({});
    expect(result.current.matches).toEqual({ France: 'Paris', Germany: 'Madrid' });
  });

  it('allMatchedCorrectly should be true when all targets are correctly matched', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: true,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => result.current.handleDrop('France', 'Paris'));
    expect(result.current.allMatchedCorrectly).toBe(false);
    act(() => result.current.handleDrop('Germany', 'Berlin'));
    expect(result.current.allMatchedCorrectly).toBe(false);
    act(() => result.current.handleDrop('Spain', 'Madrid'));

    expect(result.current.matches).toEqual({ France: 'Paris', Germany: 'Berlin', Spain: 'Madrid' });
    expect(result.current.isCorrectMap).toEqual({ France: true, Germany: true, Spain: true });
    expect(result.current.allMatchedCorrectly).toBe(true);
    expect(result.current.unmatchedOptions).toEqual([]);
  });

  it('allMatchedCorrectly should be false if any match is incorrect', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: true,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => result.current.handleDrop('France', 'Paris'));
    act(() => result.current.handleDrop('Germany', 'Madrid')); // Incorrect
    act(() => result.current.handleDrop('Spain', 'Berlin')); // Incorrect

    expect(result.current.allMatchedCorrectly).toBe(false);
  });

  it('allMatchedCorrectly should be false if not all targets are matched', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: true,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => result.current.handleDrop('France', 'Paris'));
    expect(result.current.allMatchedCorrectly).toBe(false);
  });

  it('handleRemoveMatch should remove a match, update unmatchedOptions, and call onMatchChange', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: true,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => result.current.handleDrop('France', 'Paris'));
    act(() => result.current.handleDrop('Germany', 'Berlin'));
    expect(result.current.matches).toEqual({ France: 'Paris', Germany: 'Berlin' });
    expect(result.current.unmatchedOptions).toEqual(['Madrid']);
    expect(result.current.isCorrectMap).toEqual({ France: true, Germany: true });

    act(() => result.current.handleRemoveMatch('France'));

    expect(result.current.matches).toEqual({ Germany: 'Berlin' });
    expect(result.current.unmatchedOptions).toEqual(['Madrid', 'Paris']); // Paris is back
    expect(result.current.isCorrectMap).toEqual({ Germany: true }); // France entry removed
    expect(mockOnMatchChange).toHaveBeenCalledWith({ Germany: 'Berlin' });
    expect(result.current.allMatchedCorrectly).toBe(false);
  });

  it('handleDrop should replace an existing match for a target', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: true,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => result.current.handleDrop('France', 'Berlin')); // Initial incorrect match
    expect(result.current.matches).toEqual({ France: 'Berlin' });
    expect(result.current.isCorrectMap).toEqual({ France: false });
    expect(result.current.unmatchedOptions).toEqual(['Paris', 'Madrid']);

    act(() => result.current.handleDrop('France', 'Paris')); // Corrected match
    expect(result.current.matches).toEqual({ France: 'Paris' });
    expect(result.current.isCorrectMap).toEqual({ France: true });
    // Berlin should be back in unmatched, Paris removed
    expect(result.current.unmatchedOptions).toEqual(expect.arrayContaining(['Berlin', 'Madrid']));
    expect(result.current.unmatchedOptions).not.toContain('Paris');
    expect(result.current.unmatchedOptions.length).toBe(2);
  });

  it('should correctly calculate unmatchedOptions when options are reused for different targets', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: false,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => result.current.handleDrop('France', 'Paris'));
    act(() => result.current.handleDrop('Germany', 'Paris')); // Paris used again

    expect(result.current.matches).toEqual({ France: 'Paris', Germany: 'Paris' });
    // Paris should be removed from unmatchedOptions because it's used, even if for multiple targets
    expect(result.current.unmatchedOptions).toEqual(['Berlin', 'Madrid']);
  });

  it('should reset isCorrectMap when showFeedback changes from true to false', () => {
    const { result, rerender } = renderHook(
      ({ sf }) => useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: sf,
        onMatchChange: mockOnMatchChange,
      }),
      { initialProps: { sf: true } }
    );

    act(() => result.current.handleDrop('France', 'Paris'));
    act(() => result.current.handleDrop('Germany', 'Madrid')); // Incorrect
    expect(result.current.isCorrectMap).toEqual({ France: true, Germany: false });

    rerender({ sf: false });
    expect(result.current.isCorrectMap).toEqual({});
  });

  it('should re-evaluate isCorrectMap when showFeedback changes from false to true', () => {
    const { result, rerender } = renderHook(
      ({ sf }) => useDragAndDropQuiz({
        question: mockQuestion,
        showFeedback: sf,
        onMatchChange: mockOnMatchChange,
      }),
      { initialProps: { sf: false } }
    );

    act(() => result.current.handleDrop('France', 'Paris'));
    act(() => result.current.handleDrop('Germany', 'Madrid')); // Incorrect
    expect(result.current.isCorrectMap).toEqual({});

    rerender({ sf: true });
    expect(result.current.isCorrectMap).toEqual({ France: true, Germany: false });
  });

  it('allMatchedCorrectly should be true for questionWithLessOptions when all options are correctly matched to targets', () => {
    const { result } = renderHook(() =>
      useDragAndDropQuiz({
        question: mockQuestionWithLessOptions,
        showFeedback: true,
        onMatchChange: mockOnMatchChange,
      })
    );

    act(() => result.current.handleDrop('Red', 'Apple'));
    expect(result.current.allMatchedCorrectly).toBe(false);
    act(() => result.current.handleDrop('Yellow', 'Banana'));

    expect(result.current.matches).toEqual({ Red: 'Apple', Yellow: 'Banana' });
    expect(result.current.isCorrectMap).toEqual({ Red: true, Yellow: true });
    expect(result.current.allMatchedCorrectly).toBe(true);
    expect(result.current.unmatchedOptions).toEqual([]);
  });

});
