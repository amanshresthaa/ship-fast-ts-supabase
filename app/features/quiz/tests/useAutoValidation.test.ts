import { renderHook, act } from '@testing-library/react';
import { useAutoValidation } from '../hooks/useAutoValidation';
import { SingleSelectionController } from '../controllers/SingleSelectionController';
import { SingleSelectionQuestion } from '@/app/types/quiz';

// Mock controller
jest.mock('../controllers/SingleSelectionController');

describe('useAutoValidation', () => {
  // Create a mock question for testing
  const mockQuestion: SingleSelectionQuestion = {
    id: 'q1',
    type: 'single_selection',
    question: 'Test question?',
    points: 10,
    quiz_tag: 'test-quiz',
    difficulty: 'medium',
    feedback_correct: 'Good job!',
    feedback_incorrect: 'Try again!',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    options: [
      { option_id: 'a', text: 'Option A' },
      { option_id: 'b', text: 'Option B' },
    ],
    correctAnswerOptionId: 'b'
  };

  // Set up mocks for the controller methods
  const mockIsAnswerComplete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the controller implementation
    (SingleSelectionController as jest.Mock).mockImplementation(() => ({
      isAnswerComplete: mockIsAnswerComplete,
      validateAnswer: jest.fn(),
      getScore: jest.fn(),
      isCorrect: jest.fn(),
      getQuestion: () => mockQuestion
    }));
  });

  it('should initialize with the provided initial answer', () => {
    mockIsAnswerComplete.mockReturnValue(false);
    
    const mockController = new SingleSelectionController(mockQuestion);
    const mockOnAnswerChange = jest.fn();
    
    const { result } = renderHook(() => 
      useAutoValidation(mockController, 'a', mockOnAnswerChange)
    );
    
    const [answer] = result.current;
    expect(answer).toBe('a');
  });

  it('should update answer state when setAnswer is called', () => {
    mockIsAnswerComplete.mockReturnValue(false);
    
    const mockController = new SingleSelectionController(mockQuestion);
    const mockOnAnswerChange = jest.fn();
    
    const { result } = renderHook(() => 
      useAutoValidation(mockController, null, mockOnAnswerChange)
    );
    
    act(() => {
      const setAnswer = result.current[1];
      setAnswer('a');
    });
    
    const [answer] = result.current;
    expect(answer).toBe('a');
  });

  it('should trigger onAnswerChange exactly once when answer becomes complete', () => {
    // First call to isAnswerComplete returns false, then true after update
    mockIsAnswerComplete.mockReturnValueOnce(false).mockReturnValueOnce(true);
    
    const mockController = new SingleSelectionController(mockQuestion);
    const mockOnAnswerChange = jest.fn();
    
    const { result } = renderHook(() => 
      useAutoValidation(mockController, null, mockOnAnswerChange)
    );
    
    // Initial render should not trigger onAnswerChange
    expect(mockOnAnswerChange).not.toHaveBeenCalled();
    
    // Update the answer
    act(() => {
      const setAnswer = result.current[1];
      setAnswer('a');
    });
    
    // Should call onAnswerChange exactly once
    expect(mockOnAnswerChange).toHaveBeenCalledTimes(1);
    expect(mockOnAnswerChange).toHaveBeenCalledWith('a');
    
    // Update the answer again
    act(() => {
      const setAnswer = result.current[1];
      setAnswer('b');
    });
    
    // Should still have been called only once total
    expect(mockOnAnswerChange).toHaveBeenCalledTimes(1);
  });

  it('should not auto-validate when validateOnComplete is false', () => {
    mockIsAnswerComplete.mockReturnValue(true);
    
    const mockController = new SingleSelectionController(mockQuestion);
    const mockOnAnswerChange = jest.fn();
    
    renderHook(() => 
      useAutoValidation(mockController, null, mockOnAnswerChange, false)
    );
    
    // Should not trigger onAnswerChange automatically
    expect(mockOnAnswerChange).not.toHaveBeenCalled();
  });
});
