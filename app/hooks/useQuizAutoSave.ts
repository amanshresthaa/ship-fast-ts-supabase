import { useCallback, useEffect, useRef } from 'react';
import { useQuiz } from '../features/quiz/context/QuizContext';
import { QuizProgressService } from '../features/quiz/services/quizProgressService';

/**
 * Hook to automatically save quiz progress periodically and on relevant state changes.
 * Uses a debounce mechanism to prevent too frequent saves.
 * 
 * @param isEnabled - Whether auto-saving is enabled
 * @param debounceMs - Debounce time in milliseconds
 * @param saveOnUnmount - Whether to save when the component unmounts
 * @returns Object with methods to control auto-saving
 */
export const useQuizAutoSave = (
  isEnabled: boolean = true,
  debounceMs: number = 2000,
  saveOnUnmount: boolean = true
) => {
  const { state } = useQuiz();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveCountRef = useRef(0);
  const lastSavedStateRef = useRef({
    currentQuestionIndex: -1,
    userAnswers: {},
  });

  // Clear any existing timer to prevent memory leaks
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    clearTimer();
    
    // Check if state has actually changed to avoid unnecessary saves
    if (!isEnabled || 
        (state.currentQuestionIndex === lastSavedStateRef.current.currentQuestionIndex && 
         JSON.stringify(state.userAnswers) === JSON.stringify(lastSavedStateRef.current.userAnswers))) {
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const saved = await QuizProgressService.saveProgress({
          quizId: state.quiz!.id,
          questionTypeFilter: state.quiz!.quiz_type || null,
          currentQuestionIndex: state.currentQuestionIndex,
          userAnswers: state.userAnswers,
          isExplicitlyCompleted: state.isQuizComplete,
        });
        if (saved) {
          saveCountRef.current += 1;
          lastSavedStateRef.current = {
            currentQuestionIndex: state.currentQuestionIndex,
            userAnswers: { ...state.userAnswers },
          };
        }
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, debounceMs);
  }, [isEnabled, state.currentQuestionIndex, state.userAnswers, state.quiz, state.isQuizComplete, debounceMs, clearTimer]);

  // Use ref to track previous state to avoid unnecessary saves
  const prevStateRef = useRef({
    currentQuestionIndex: -1,
    userAnswers: {} as any,
  });

  // Trigger save when relevant state changes
  useEffect(() => {
    // Skip if not enabled or quiz isn't loaded yet
    if (!isEnabled || state.isLoading || state.questions.length === 0) {
      return;
    }

    // Skip if state hasn't meaningfully changed
    const currentQuestionIndex = state.currentQuestionIndex;
    const userAnswers = state.userAnswers;
    
    if (
      prevStateRef.current.currentQuestionIndex === currentQuestionIndex &&
      JSON.stringify(prevStateRef.current.userAnswers) === JSON.stringify(userAnswers)
    ) {
      return;
    }
    
    // Update prev state ref
    prevStateRef.current = {
      currentQuestionIndex,
      userAnswers: { ...userAnswers },
    };
    
    // Trigger debounced save
    debouncedSave();
  }, [
    isEnabled,
    state.isLoading,
    state.questions.length,
    state.currentQuestionIndex,
    state.userAnswers,
    debouncedSave,
  ]);

  // Save on unmount if needed
  useEffect(() => {
    return () => {
      clearTimer();
      if (saveOnUnmount && isEnabled && state.quiz) {
        QuizProgressService.saveProgress({
          quizId: state.quiz.id,
          questionTypeFilter: state.quiz.quiz_type || null,
          currentQuestionIndex: state.currentQuestionIndex,
          userAnswers: state.userAnswers,
          isExplicitlyCompleted: state.isQuizComplete,
        }).catch(console.error);
      }
    };
  }, [clearTimer, saveOnUnmount, isEnabled, state]);

  // Force an immediate save
  const forceSave = useCallback(async (): Promise<boolean> => {
    clearTimer();
    try {
      const result = await QuizProgressService.saveProgress({
        quizId: state.quiz!.id,
        questionTypeFilter: state.quiz!.quiz_type || null,
        currentQuestionIndex: state.currentQuestionIndex,
        userAnswers: state.userAnswers,
        isExplicitlyCompleted: state.isQuizComplete,
      });
      if (result) {
        saveCountRef.current += 1;
        lastSavedStateRef.current = {
          currentQuestionIndex: state.currentQuestionIndex,
          userAnswers: { ...state.userAnswers },
        };
      }
      return result;
    } catch (error) {
      console.error("Force save error:", error);
      return false;
    }
  }, [clearTimer, state]);

  return {
    forceSave,
    saveCount: saveCountRef.current,
    disable: () => clearTimer(),
    lastSaved: lastSavedStateRef.current,
  };
};