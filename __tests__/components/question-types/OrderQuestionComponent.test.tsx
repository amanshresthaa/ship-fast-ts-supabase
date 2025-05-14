import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderQuestionComponent from '@/app/features/quiz/components/question-types/OrderQuestionComponent';
import { OrderQuestion, OrderQuestionAnswer } from '@/app/types/quiz';
import { OrderController } from '@/app/features/quiz/controllers/OrderController';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
}));

// Mock useAutoValidation hook
const mockSetPlacedAnswers = jest.fn();
const mockOnAnswerSelect = jest.fn();

jest.mock('@/app/features/quiz/hooks/useAutoValidation', () => ({
  useAutoValidation: jest.fn((controller, initialAnswer, onAnswerChangeCallback) => {
    // Simulate the hook's behavior for testing purposes
    const [answer, setAnswer] = React.useState(initialAnswer);
    const allItemsOrdered = controller.isAnswerComplete(answer);
    React.useEffect(() => {
      // Call onAnswerChangeCallback when all items are ordered, similar to the real hook
      if (allItemsOrdered) {
        onAnswerChangeCallback(answer);
      }
    }, [answer, allItemsOrdered, onAnswerChangeCallback]);
    
    // Allow tests to update the answer via mockSetPlacedAnswers
    const customSetAnswer = (newAnswer: OrderQuestionAnswer) => {
        setAnswer(newAnswer);
        mockSetPlacedAnswers(newAnswer); // also call the mock for direct assertion if needed
    }
    return [answer, customSetAnswer, false, allItemsOrdered];
  }),
}));

const mockQuestion: OrderQuestion = {
  id: 'order-q1',
  type: 'order',
  text: 'Arrange these items correctly:',
  items: [
    { item_id: 'item1', text: 'First Item' },
    { item_id: 'item2', text: 'Second Item' },
    { item_id: 'item3', text: 'Third Item' },
  ],
  correctOrder: ['item1', 'item2', 'item3'],
  question_meta: {
    difficulty: 'medium',
    estimated_time: 60,
    topic: 'Ordering',
    skill: 'Sequencing',
  },
  slotCount: 3,
};

// Helper to simulate drag and drop
const simulateDragDrop = (draggedElement: HTMLElement, dropZone: HTMLElement, dragData: object) => {
  fireEvent.dragStart(draggedElement, {
    dataTransfer: {
      setData: (format: string, data: string) => {
        // Mock setData if needed, or rely on currentDraggedItemId state
      },
      getData: (format: string) => JSON.stringify(dragData), // Provide data for drop
      effectAllowed: 'move',
    }
  });

  fireEvent.dragEnter(dropZone);
  fireEvent.dragOver(dropZone, { dataTransfer: { dropEffect: 'move' } });
  fireEvent.drop(dropZone, {
    dataTransfer: {
      getData: (format: string) => JSON.stringify(dragData),
    }
  });
  fireEvent.dragLeave(dropZone);
};


describe('OrderQuestionComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the state of useAutoValidation mock for each test if needed
    // For instance, reset placedAnswers to initial state if it's managed outside the mock's internal state
  });

  it('renders available items and empty slots correctly', () => {
    render(<OrderQuestionComponent question={mockQuestion} onAnswerSelect={mockOnAnswerSelect} />);

    expect(screen.getByText('Available Items:')).toBeInTheDocument();
    expect(screen.getByText('First Item')).toBeInTheDocument();
    expect(screen.getByText('Second Item')).toBeInTheDocument();
    expect(screen.getByText('Third Item')).toBeInTheDocument();

    expect(screen.getByText('Ordered Sequence:')).toBeInTheDocument();
    const slots = screen.getAllByText('Drop an item here');
    expect(slots.length).toBe(mockQuestion.slotCount);
  });

  it('updates state when an item is dragged from available to an empty slot', () => {
    render(<OrderQuestionComponent question={mockQuestion} onAnswerSelect={mockOnAnswerSelect} />); 
    
    const availableItem1 = screen.getByText('First Item').closest('div[draggable="true"]');
    const firstSlot = screen.getAllByText('Drop an item here')[0].closest('div[class*="border-dashed"]');

    expect(availableItem1).toBeInTheDocument();
    expect(firstSlot).toBeInTheDocument();

    if (availableItem1 && firstSlot) {
      // Simulate drag data
      const dragData = { itemId: 'item1', sourceType: 'available' };
      
      act(() => {
        simulateDragDrop(availableItem1, firstSlot, dragData);
      });

      // Check if onAnswerSelect was called by useAutoValidation due to state change
      // This depends on how useAutoValidation is mocked and how setPlacedAnswers is called by the component
      // We expect setPlacedAnswers (from useAutoValidation) to be called by the component's drop handler.
      // Then, the useEffect within the mocked useAutoValidation should trigger onAnswerSelect if complete.
      
      // Verify that the item text is now in the slot (or that onAnswerSelect was called with the new state)
      // This requires the mocked useAutoValidation to correctly update the 'placedAnswers' state used by the component.
      // As the mock directly calls setAnswer, the component should re-render with the new state.
      expect(screen.getByText('First Item').closest('div[class*="border-gray-300"]')).not.toHaveClass('border-dashed'); // No longer a dashed empty slot
      expect(screen.queryByText('Drop an item here')).toBeNull(); // Assuming only one item dropped for now, so one less empty slot text
    }
  });

  it('disables drag and drop when isSubmitted is true', () => {
    render(<OrderQuestionComponent question={mockQuestion} onAnswerSelect={mockOnAnswerSelect} isSubmitted={true} />);
    const availableItem = screen.getByText('First Item').closest('div[draggable="false"]');
    expect(availableItem).toBeInTheDocument(); // Draggable should be false
  });

  it('disables drag and drop when isQuizReviewMode is true', () => {
    render(<OrderQuestionComponent question={mockQuestion} onAnswerSelect={mockOnAnswerSelect} isQuizReviewMode={true} />);
    const availableItemContainer = screen.getByText('All items placed.'); // In review mode, available items are empty
    expect(availableItemContainer).toBeInTheDocument();
    // Slots should show correct items, not be draggable
    const firstSlotItem = screen.getByText('First Item').closest('div[draggable="false"]');
    expect(firstSlotItem).toBeInTheDocument();
  });

  it('shows correct/incorrect feedback when showCorrectAnswer is true', () => {
    const userAnswer: OrderQuestionAnswer = {
      'slot_0': 'item1', // Correct
      'slot_1': 'item3', // Incorrect
      'slot_2': 'item2', // Incorrect
    };
    render(
      <OrderQuestionComponent 
        question={mockQuestion} 
        onAnswerSelect={mockOnAnswerSelect} 
        userAnswer={userAnswer} 
        isSubmitted={true} 
        showCorrectAnswer={true} 
      />
    );

    // Check for feedback icons or styles
    const correctSlot = screen.getByText('First Item').closest('div');
    expect(correctSlot).toHaveClass('border-green-500');

    const incorrectSlot1 = screen.getByText('Third Item').closest('div');
    expect(incorrectSlot1).toHaveClass('border-red-500');
    expect(screen.getByText('Correct: Second Item')).toBeInTheDocument(); // Feedback for incorrect item

    const incorrectSlot2 = screen.getByText('Second Item').closest('div');
    expect(incorrectSlot2).toHaveClass('border-red-500');
    expect(screen.getByText('Correct: Third Item')).toBeInTheDocument(); // Feedback for incorrect item
  });

   it('calls onAnswerSelect when all items are placed and validateOnComplete is true', () => {
    // This test relies heavily on the mock of useAutoValidation correctly calling onAnswerSelect
    // when the answer becomes complete.
    render(<OrderQuestionComponent question={mockQuestion} onAnswerSelect={mockOnAnswerSelect} validateOnComplete={true} />);

    const availableItem1 = screen.getByText('First Item').closest('div[draggable="true"]');
    const availableItem2 = screen.getByText('Second Item').closest('div[draggable="true"]');
    const availableItem3 = screen.getByText('Third Item').closest('div[draggable="true"]');

    const slots = screen.getAllByText('Drop an item here').map(el => el.closest('div[class*="border-dashed"]'));

    if (availableItem1 && availableItem2 && availableItem3 && slots.length === 3) {
      act(() => {
        simulateDragDrop(availableItem1, slots[0]!, { itemId: 'item1', sourceType: 'available' });
      });
      // onAnswerSelect should not be called yet
      expect(mockOnAnswerSelect).not.toHaveBeenCalled(); 

      act(() => {
        simulateDragDrop(availableItem2, slots[1]!, { itemId: 'item2', sourceType: 'available' });
      });
      expect(mockOnAnswerSelect).not.toHaveBeenCalled();
      
      act(() => {
        simulateDragDrop(availableItem3, slots[2]!, { itemId: 'item3', sourceType: 'available' });
      });
      
      // Now that all items are placed, the mocked useAutoValidation's useEffect should trigger onAnswerSelect
      expect(mockOnAnswerSelect).toHaveBeenCalledWith({
        'slot_0': 'item1',
        'slot_1': 'item2',
        'slot_2': 'item3',
      });
    }
  });

  // Add more tests for other D&D scenarios:
  // - Dragging from slot to slot (swap)
  // - Dragging from slot to slot (move to empty)
  // - Dragging from slot back to available items
  // - Dragging from available to a filled slot (replace)
  // - Fallback logic for dataTransfer issues (might be hard to test without more direct state manipulation access)
});

