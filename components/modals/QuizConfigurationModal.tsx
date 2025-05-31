/**
 * TDD REFACTOR PHASE: Quiz Configuration Modal - Optimized Implementation
 * This component has been refactored for better maintainability and performance
 * 
 * Features:
 * - Mobile-first responsive design with bottom sheet pattern
 * - Full accessibility (ARIA, keyboard navigation, focus management)
 * - Question type selection with visual feedback
 * - Two quiz modes: Full and Focused
 * - Screen reader announcements
 * - Touch-friendly interactions
 * - Performance optimizations with memoization
 * - Custom hooks for better separation of concerns
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Constants for better maintainability
const ANIMATION_DURATIONS = {
  enter: 'ease-out duration-300',
  leave: 'ease-in duration-200'
} as const;

const QUIZ_MODES = {
  FULL: 'full',
  FOCUSED: 'focused'
} as const;

// Type definitions
export interface QuestionType {
  id: string;
  name: string;
  icon: string;
}

export interface QuizData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  availableQuestionTypes: QuestionType[];
}

export interface QuizConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (config: { questionTypes: string[]; mode: 'full' | 'focused' }) => void;
  quizData: QuizData;
}

// Custom hook for question type selection logic
const useQuestionTypeSelection = (availableTypes: QuestionType[]) => {
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const toggleQuestionType = useCallback((questionTypeId: string) => {
    setSelectedQuestionTypes(prev => {
      const isSelected = prev.includes(questionTypeId);
      const questionTypeName = availableTypes.find(qt => qt.id === questionTypeId)?.name || '';
      
      let newSelection: string[];
      if (isSelected) {
        newSelection = prev.filter(id => id !== questionTypeId);
        setAnnouncement(`${questionTypeName} deselected`);
      } else {
        newSelection = [...prev, questionTypeId];
        setAnnouncement(`${questionTypeName} selected`);
      }
      
      return newSelection;
    });
  }, [availableTypes]);

  const resetSelection = useCallback(() => {
    setSelectedQuestionTypes([]);
    setAnnouncement('');
  }, []);

  return {
    selectedQuestionTypes,
    announcement,
    toggleQuestionType,
    resetSelection
  };
};

// Custom hook for modal focus management
const useModalFocus = (isOpen: boolean) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  return { closeButtonRef };
};

// Component styling constants
const STYLES = {
  questionTypeButton: {
    base: 'flex items-center p-3 rounded-md border-2 transition-colors min-h-[44px]',
    selected: 'border-blue-500 bg-blue-50 text-blue-900',
    unselected: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
  },
  focusedQuizButton: {
    enabled: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }
} as const;

export const QuizConfigurationModal: React.FC<QuizConfigurationModalProps> = React.memo(({
  isOpen,
  onClose,
  onStartQuiz,
  quizData
}) => {
  // Custom hooks for better separation of concerns
  const {
    selectedQuestionTypes,
    announcement,
    toggleQuestionType,
    resetSelection
  } = useQuestionTypeSelection(quizData.availableQuestionTypes);

  const { closeButtonRef } = useModalFocus(isOpen);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetSelection();
    }
  }, [isOpen, resetSelection]);

  // Memoized quiz start handlers
  const handleFullQuizStart = useCallback(() => {
    onStartQuiz({
      questionTypes: quizData.availableQuestionTypes.map(qt => qt.id),
      mode: QUIZ_MODES.FULL
    });
  }, [onStartQuiz, quizData.availableQuestionTypes]);

  const handleFocusedQuizStart = useCallback(() => {
    onStartQuiz({
      questionTypes: selectedQuestionTypes,
      mode: QUIZ_MODES.FOCUSED
    });
  }, [onStartQuiz, selectedQuestionTypes]);

  // Memoized event handlers
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Memoized computed values
  const isFocusedQuizEnabled = useMemo(() => selectedQuestionTypes.length > 0, [selectedQuestionTypes]);

  // Early return for performance
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={onClose}
        onKeyDown={handleKeyDown}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Transition.Child
          as={Fragment}
          enter={ANIMATION_DURATIONS.enter}
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave={ANIMATION_DURATIONS.leave}
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className="fixed inset-0 bg-black/50"
            data-testid="modal-backdrop"
            onClick={handleBackdropClick}
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter={ANIMATION_DURATIONS.enter}
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave={ANIMATION_DURATIONS.leave}
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md sm:max-w-lg md:max-w-2xl transform overflow-hidden rounded-t-lg sm:rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <Dialog.Title 
                    id="modal-title"
                    as="h2" 
                    className="text-lg font-semibold text-gray-900"
                  >
                    Configure Your Quiz
                  </Dialog.Title>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-transparent rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6" id="modal-description">
                  {/* Quiz Info Section */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-blue-600 mb-2">
                      {quizData.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {quizData.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quizData.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Start Section */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Start</h4>
                    <button
                      type="button"
                      onClick={handleFullQuizStart}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m3-16H8a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" />
                      </svg>
                      Start Full Quiz (All Question Types)
                    </button>
                  </div>

                  {/* Question Type Selection */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Customize Your Practice</h4>
                    <p className="text-sm text-gray-600 mb-4">Select specific question types to focus on.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quizData.availableQuestionTypes.map((questionType) => {
                        const isSelected = selectedQuestionTypes.includes(questionType.id);
                        return (
                          <button
                            key={questionType.id}
                            type="button"
                            onClick={() => toggleQuestionType(questionType.id)}
                            aria-pressed={isSelected}
                            className={`${STYLES.questionTypeButton.base} ${
                              isSelected
                                ? STYLES.questionTypeButton.selected
                                : STYLES.questionTypeButton.unselected
                            }`}
                          >
                            <span className="text-lg mr-3">{questionType.icon}</span>
                            <span className="font-medium">{questionType.name}</span>
                            {isSelected && (
                              <svg className="w-5 h-5 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Focused Quiz Button */}
                    <button
                      type="button"
                      onClick={handleFocusedQuizStart}
                      disabled={!isFocusedQuizEnabled}
                      className={`w-full flex items-center justify-center px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] ${
                        isFocusedQuizEnabled
                          ? STYLES.focusedQuizButton.enabled
                          : STYLES.focusedQuizButton.disabled
                      }`}
                    >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Focused Quiz
                  </button>

                  {/* Copyright */}
                  <p className="text-center text-xs text-gray-400 mt-4">
                    © 2025 QuizPlatform. All rights reserved.
                  </p>
                </div>

                {/* Screen Reader Announcements */}
                <div 
                  role="status" 
                  aria-live="polite" 
                  aria-atomic="true"
                  className="sr-only"
                >
                  {announcement}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});

// Display name for better debugging
QuizConfigurationModal.displayName = 'QuizConfigurationModal';
