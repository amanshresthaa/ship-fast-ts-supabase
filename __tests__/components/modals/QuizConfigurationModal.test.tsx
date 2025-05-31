/**
 * TDD Test Suite for Quiz Configuration Modal
 * Following Red-Green-Refactor methodology
 * 
 * RED PHASE: These tests will fail initially - that's the point!
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizConfigurationModal } from '@/components/modals/QuizConfigurationModal';

// Mock quiz data matching the screenshots
const mockQuizData = {
  id: 'azure-ai-102',
  title: 'Azure AI Engineer AI-102 Practice Quiz',
  description: 'Prepare for your Azure AI Engineer certification with this comprehensive practice quiz. Test your knowledge across various question formats.',
  tags: ['Azure', 'AI', 'Certification Prep'],
  availableQuestionTypes: [
    { id: 'single-selection', name: 'Single Selection', icon: '🔘' },
    { id: 'multiple-selection', name: 'Multiple Selection', icon: '☑️' },
    { id: 'drag-and-drop', name: 'Drag and Drop', icon: '🔄' },
    { id: 'dropdown', name: 'Dropdown', icon: '📋' },
    { id: 'order-questions', name: 'Order Questions', icon: '📊' },
    { id: 'yes-no', name: 'Yes/No', icon: '✓' },
    { id: 'yes-no-multi', name: 'Yes/No Multi', icon: '✅' }
  ]
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onStartQuiz: jest.fn(),
  quizData: mockQuizData
};

describe('QuizConfigurationModal - TDD Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RED PHASE: Failing Tests - Modal Structure & Accessibility', () => {
    test('should render modal with proper ARIA attributes', () => {
      render(<QuizConfigurationModal {...defaultProps} />);
      
      // Should have proper modal dialog structure
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
    });

    test('should display quiz title and description', () => {
      render(<QuizConfigurationModal {...defaultProps} />);
      
      expect(screen.getByText('Configure Your Quiz')).toBeInTheDocument();
      expect(screen.getByText('Azure AI Engineer AI-102 Practice Quiz')).toBeInTheDocument();
      expect(screen.getByText(/Prepare for your Azure AI Engineer certification/)).toBeInTheDocument();
    });

    test('should display quiz tags', () => {
      render(<QuizConfigurationModal {...defaultProps} />);
      
      expect(screen.getByText('Azure')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Certification Prep')).toBeInTheDocument();
    });

    test('should have accessible close button', () => {
      render(<QuizConfigurationModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('RED PHASE: Quick Start Section', () => {
    test('should display "Start Full Quiz" button with play icon', () => {
      render(<QuizConfigurationModal {...defaultProps} />);
      
      const fullQuizButton = screen.getByRole('button', { name: /start full quiz.*all question types/i });
      expect(fullQuizButton).toBeInTheDocument();
      expect(fullQuizButton).toHaveClass('bg-blue-600'); // Primary button styling
    });

    test('should call onStartQuiz with all question types when full quiz clicked', async () => {
      const user = userEvent.setup();
      render(<QuizConfigurationModal {...defaultProps} />);
      
      const fullQuizButton = screen.getByRole('button', { name: /start full quiz.*all question types/i });
      await user.click(fullQuizButton);
      
      expect(defaultProps.onStartQuiz).toHaveBeenCalledWith({
        questionTypes: mockQuizData.availableQuestionTypes.map(type => type.id),
        mode: 'full'
      });
    });
  });

  describe('RED PHASE: Question Type Selection', () => {
    test('should display all available question types as selectable buttons', () => {
      render(<QuizConfigurationModal {...defaultProps} />);
      
      // Should have section title
      expect(screen.getByText('Customize Your Practice')).toBeInTheDocument();
      expect(screen.getByText('Select specific question types to focus on.')).toBeInTheDocument();
      
      // Should display all question type buttons
      mockQuizData.availableQuestionTypes.forEach(type => {
        // Find button with icon and text - the button name includes both emoji and text
        expect(screen.getByRole('button', { name: new RegExp(`${type.icon}\\s+${type.name}`, 'i') })).toBeInTheDocument();
      });
    });

    test('should allow multiple question type selection', async () => {
      const user = userEvent.setup();
      render(<QuizConfigurationModal {...defaultProps} />);
      
      const singleSelectionBtn = screen.getByRole('button', { name: /single selection/i });
      const multipleSelectionBtn = screen.getByRole('button', { name: /multiple selection/i });
      
      await user.click(singleSelectionBtn);
      await user.click(multipleSelectionBtn);
      
      expect(singleSelectionBtn).toHaveAttribute('aria-pressed', 'true');
      expect(multipleSelectionBtn).toHaveAttribute('aria-pressed', 'true');
    });

    test('should enable "Start Focused Quiz" button when question types selected', async () => {
      const user = userEvent.setup();
      render(<QuizConfigurationModal {...defaultProps} />);
      
      // Initially disabled
      const focusedQuizButton = screen.getByRole('button', { name: /start focused quiz/i });
      expect(focusedQuizButton).toBeDisabled();
      
      // Select a question type
      const singleSelectionBtn = screen.getByRole('button', { name: /single selection/i });
      await user.click(singleSelectionBtn);
      
      // Should be enabled now
      expect(focusedQuizButton).toBeEnabled();
    });

    test('should call onStartQuiz with selected question types for focused quiz', async () => {
      const user = userEvent.setup();
      render(<QuizConfigurationModal {...defaultProps} />);
      
      // Select specific question types
      await user.click(screen.getByRole('button', { name: /single selection/i }));
      await user.click(screen.getByRole('button', { name: /drag and drop/i }));
      
      const focusedQuizButton = screen.getByRole('button', { name: /start focused quiz/i });
      await user.click(focusedQuizButton);
      
      expect(defaultProps.onStartQuiz).toHaveBeenCalledWith({
        questionTypes: ['single-selection', 'drag-and-drop'],
        mode: 'focused'
      });
    });
  });

  describe('RED PHASE: Mobile-First Responsive Design', () => {
    test('should use mobile-first modal layout', () => {
      render(<QuizConfigurationModal {...defaultProps} />);
      
      // Look for the modal panel by finding an element with the expected responsive classes
      const modalPanel = screen.getByRole('dialog').querySelector('.w-full.max-w-md');
      
      // Should have mobile-first responsive classes
      expect(modalPanel).toHaveClass('w-full', 'max-w-md', 'sm:max-w-lg', 'md:max-w-2xl');
    });

    test('should have touch-friendly button sizes on mobile', () => {
      render(<QuizConfigurationModal {...defaultProps} />);
      
      const questionTypeButtons = screen.getAllByRole('button').filter((btn: HTMLElement) => 
        mockQuizData.availableQuestionTypes.some(type => 
          btn.textContent?.includes(type.name)
        )
      );
      
      questionTypeButtons.forEach((button: HTMLElement) => {
        // Minimum 44px touch target (using Tailwind classes)
        expect(button).toHaveClass('min-h-[44px]');
      });
    });
  });

  describe('RED PHASE: Keyboard Navigation & Focus Management', () => {
    test('should trap focus within modal', async () => {
      const user = userEvent.setup();
      render(<QuizConfigurationModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      const fullQuizButton = screen.getByRole('button', { name: /start full quiz/i });
      
      // Focus should start on first interactive element
      expect(closeButton).toHaveFocus();
      
      // Tab should cycle through interactive elements
      await user.tab();
      expect(fullQuizButton).toHaveFocus();
    });

    test('should close modal on Escape key', async () => {
      const user = userEvent.setup();
      render(<QuizConfigurationModal {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('should close modal when clicking backdrop', async () => {
      const user = userEvent.setup();
      render(<QuizConfigurationModal {...defaultProps} />);
      
      // Click on backdrop (outside modal content)
      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('RED PHASE: Performance & Accessibility', () => {
    test('should not render when closed', () => {
      render(<QuizConfigurationModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('should have proper contrast ratios for text elements', () => {
      render(<QuizConfigurationModal {...defaultProps} />);
      
      // Primary action button should have high contrast
      const fullQuizButton = screen.getByRole('button', { name: /start full quiz/i });
      expect(fullQuizButton).toHaveClass('text-white', 'bg-blue-600');
      
      // Secondary elements should have appropriate contrast
      const description = screen.getByText(/prepare for your azure/i);
      expect(description).toHaveClass('text-gray-600');
    });

    test('should announce changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<QuizConfigurationModal {...defaultProps} />);
      
      // Should have aria-live region for selection feedback
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: /single selection/i }));
      
      // Should announce selection
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/single selection selected/i);
      });
    });
  });
});
