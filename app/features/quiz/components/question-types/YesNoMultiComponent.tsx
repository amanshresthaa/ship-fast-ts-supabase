'use client';

import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { YesNoMultiQuestion } from '@/app/types/quiz';
import { YesNoMultiController } from '../../controllers/YesNoMultiController';
import { useAutoValidation } from '../../hooks/useAutoValidation';
import { CorrectIcon, IncorrectIcon } from './FeedbackIcons';

interface YesNoMultiComponentProps {
  question: YesNoMultiQuestion;
  onAnswerSelect: (answers: boolean[]) => void;
  selectedAnswers?: boolean[] | undefined;
  isSubmitted?: boolean;
  showCorrectAnswer?: boolean;
}

const YesNoMultiComponent: React.FC<YesNoMultiComponentProps> = ({
  question,
  onAnswerSelect,
  selectedAnswers,
  isSubmitted = false,
  showCorrectAnswer = false,
}) => {
  // Create controller instance
  const controller = new YesNoMultiController(question);
  
  // Get statements from controller
  const statements = controller.getStatements();
  
  // Calculate initial answers based on provided answers or create a new array with null values
  // Use null instead of undefined to ensure proper reset between questions
  const initialAnswers = selectedAnswers && selectedAnswers.length === controller.getStatements().length
    ? selectedAnswers
    : new Array(controller.getStatements().length).fill(null);
  
  // Use auto-validation hook with auto-submit and immediate feedback
  const [answers, setAnswers, isValidating, isComplete] = useAutoValidation(
    controller,
    initialAnswers,
    (ans) => {
      if (ans.every(a => a === true || a === false)) onAnswerSelect(ans);
    },
    true // validateOnComplete: auto-submit when all answers are complete
  );

  
  // Reset answers when question changes
  useEffect(() => {
    // Clear any previous answers on new question
    setAnswers(new Array(controller.getStatements().length).fill(null));
  }, [question.id]);

  // Handle changing a single statement's answer
  const handleAnswerChange = (index: number, value: boolean) => {
    if (isSubmitted) return;
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    
    // Check if all statements are answered after this change
    const allAnswered = newAnswers.every(a => a === true || a === false);
    if (allAnswered) {
      // Explicitly call onAnswerSelect to ensure immediate feedback
      onAnswerSelect(newAnswers);
    }
  };

  return (
    <div key={question.id} className="mb-8">
      <div className="space-y-6">
        {statements.map((statement, index) => (
          <div key={statement.statement_id} className="bg-white p-5 rounded-rounded-md-ref shadow-shadow-1">
            <h3 className="text-base font-medium text-custom-gray-1 mb-3">
              {statement.text}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Yes button */}
              <motion.button
                type="button"
                onClick={() => handleAnswerChange(index, true)}
                className={`
                  relative text-left p-4 border-2 rounded-rounded-md-ref bg-white 
                  transition-all duration-200 ease-in-out overflow-hidden
                  ${isSubmitted ? "cursor-default" : "cursor-pointer hover:shadow-shadow-2 hover:border-custom-primary"}
                  ${answers[index] === true 
                    ? "border-custom-primary shadow-shadow-2" 
                    : "border-custom-gray-3"}
                  ${(isSubmitted || showCorrectAnswer) && controller.isStatementAnswerCorrect(index, true) 
                    ? "border-custom-success bg-green-500/[.05]" 
                    : ""}
                  ${(isSubmitted || showCorrectAnswer) && answers[index] === true && !controller.isStatementAnswerCorrect(index, true) 
                    ? "border-custom-error bg-red-500/[.05]" 
                    : ""}
                `}
                disabled={isSubmitted}
                aria-pressed={answers[index] === true}
                whileHover={{ scale: isSubmitted ? 1 : 1.02, transition: { duration: 0.15 } }} 
                whileTap={{ scale: isSubmitted ? 1 : 0.98, transition: { duration: 0.1 } }} 
                layout
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-custom-gray-1">Yes</span>
                  
                  {/* Show feedback icon when submitted or in show correct answer mode */}
                  {(isSubmitted || showCorrectAnswer) && (
                    <div className="ml-3">
                      {controller.isStatementAnswerCorrect(index, true) ? (
                        <CorrectIcon />
                      ) : (
                        answers[index] === true && <IncorrectIcon />
                      )}
                    </div>
                  )}
                </div>
              </motion.button>

              {/* No button */}
              <motion.button
                type="button"
                onClick={() => handleAnswerChange(index, false)}
                className={`
                  relative text-left p-4 border-2 rounded-rounded-md-ref bg-white 
                  transition-all duration-200 ease-in-out overflow-hidden
                  ${isSubmitted ? "cursor-default" : "cursor-pointer hover:shadow-shadow-2 hover:border-custom-primary"}
                  ${answers[index] === false 
                    ? "border-custom-primary shadow-shadow-2" 
                    : "border-custom-gray-3"}
                  ${(isSubmitted || showCorrectAnswer) && controller.isStatementAnswerCorrect(index, false) 
                    ? "border-custom-success bg-green-500/[.05]" 
                    : ""}
                  ${(isSubmitted || showCorrectAnswer) && answers[index] === false && !controller.isStatementAnswerCorrect(index, false) 
                    ? "border-custom-error bg-red-500/[.05]" 
                    : ""}
                `}
                disabled={isSubmitted}
                aria-pressed={answers[index] === false}
                whileHover={{ scale: isSubmitted ? 1 : 1.02, transition: { duration: 0.15 } }} 
                whileTap={{ scale: isSubmitted ? 1 : 0.98, transition: { duration: 0.1 } }} 
                layout
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-custom-gray-1">No</span>
                  
                  {/* Show feedback icon when submitted or in show correct answer mode */}
                  {(isSubmitted || showCorrectAnswer) && (
                    <div className="ml-3">
                      {controller.isStatementAnswerCorrect(index, false) ? (
                        <CorrectIcon />
                      ) : (
                        answers[index] === false && <IncorrectIcon />
                      )}
                    </div>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        ))}
      </div>
      
      {!isSubmitted && answers.some(a => a !== true && a !== false) && (
        <div className="text-sm text-gray-500 mt-4">
          Please answer all statements to continue.
        </div>
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(YesNoMultiComponent);
