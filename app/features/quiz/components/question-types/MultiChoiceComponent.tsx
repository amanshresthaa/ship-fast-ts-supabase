// app/features/quiz/components/question-types/MultiChoiceComponent.tsx
'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MultiChoiceQuestion, SelectionOption } from '../../../../types/quiz';
import { MultiChoiceController } from '../../controllers/MultiChoiceController';
import { useAutoValidation } from '../../hooks/useAutoValidation';

const CorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-success-gradient shadow-md">✓</span>
));

const IncorrectIcon = memo(() => (
  <span className="option-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-error-gradient shadow-md">✗</span>
));

interface MultiChoiceComponentProps {
  question: MultiChoiceQuestion;
  onAnswerSelect: (optionIds: string[]) => void;
  selectedOptionIds?: string[];
  isSubmitted?: boolean;
  showCorrectAnswer?: boolean;
}

const MultiChoiceComponent: React.FC<MultiChoiceComponentProps> = ({
  question,
  onAnswerSelect,
  selectedOptionIds,
  isSubmitted = false,
  showCorrectAnswer = false,
}) => {
  const controller = new MultiChoiceController(question);
  const initialSelections = selectedOptionIds || [];
  
  const [currentSelections, setCurrentSelectionsInternal] = useAutoValidation<
    MultiChoiceQuestion, 
    string[]
  >(
    controller,
    initialSelections,
    onAnswerSelect,
    true
  );
  
  const correctAnswersCount = controller.getRequiredSelectionCount();
  
  const handleOptionClick = (optionId: string) => {
    if (!isSubmitted) {
      let newSelectedOptions: string[];
      
      if (currentSelections.includes(optionId)) {
        newSelectedOptions = currentSelections.filter(id => id !== optionId);
      } 
      else if (currentSelections.length < correctAnswersCount) {
        newSelectedOptions = [...currentSelections, optionId];
      }
      else {
        return;
      }
      
      setCurrentSelectionsInternal(newSelectedOptions);
      
      // If all required selections are made, directly trigger the answer submission
      // This is consistent with SingleSelectionComponent and YesNoComponent
      if (newSelectedOptions.length === correctAnswersCount) {
        onAnswerSelect(newSelectedOptions);
      }
    }
  };
  
  return (
    <div className="options-container grid grid-cols-1 gap-4 mb-8">
      <p className="text-sm text-gray-500 mb-2 font-medium">
        Select {correctAnswersCount} answer{correctAnswersCount > 1 ? 's' : ''} ({currentSelections.length}/{correctAnswersCount} selected)
      </p>
      
      {question.options.map((option: SelectionOption, index: number) => {
        const isSelected = currentSelections.includes(option.option_id);
        const isCorrect = controller.isOptionCorrect(option.option_id);
        const optionLetter = String.fromCharCode(65 + index);
        
        let baseStyle = "relative text-left p-5 border-2 rounded-rounded-md-ref bg-white transition-all duration-200 ease-in-out shadow-shadow-1 overflow-hidden";
        let stateStyle = "border-custom-gray-3"; 
        let hoverStyle = isSubmitted ? "cursor-default" : "cursor-pointer hover:-translate-y-1 hover:shadow-shadow-2 hover:border-custom-primary";
        
        if (isSubmitted || showCorrectAnswer) {
          if (isCorrect) {
            stateStyle = "border-custom-success bg-green-500/[.05]";
          } else if (isSelected && !isCorrect) {
            stateStyle = "border-custom-error bg-red-500/[.05]";
          } else {
            stateStyle = "border-custom-gray-3 bg-gray-50 opacity-70";
            hoverStyle = "cursor-default";
          }
        } else if (isSelected) {
          stateStyle = "border-custom-primary ring-2 ring-custom-primary shadow-shadow-2";
        }
        
        return (
          <motion.button
            key={option.option_id}
            type="button"
            onClick={() => handleOptionClick(option.option_id)}
            className={`${baseStyle} ${stateStyle} ${hoverStyle}`}
            disabled={isSubmitted}
            aria-pressed={isSelected}
            whileHover={{ scale: isSubmitted ? 1 : 1.02, transition: { duration: 0.15 } }} 
            whileTap={{ scale: isSubmitted ? 1 : 0.98, transition: { duration: 0.1 } }} 
            layout
          >
            <span className={`absolute top-0 left-0 w-1 h-full transition-all duration-200 ease-in-out ${
              isSelected ? 'bg-custom-primary' : 
              isCorrect && (isSubmitted || showCorrectAnswer) ? 'bg-custom-success' : 
              isSelected && !isCorrect && (isSubmitted || showCorrectAnswer) ? 'bg-custom-error' : 
              'bg-custom-gray-3'
            } ${isSubmitted ? '' : 'group-hover:bg-custom-primary'}`}></span>

            <div className="option-content flex items-center justify-between pl-4">
              <div className="option-text text-base md:text-lg font-medium text-custom-gray-1">
                <span className="option-letter inline-block w-6 font-bold text-custom-primary mr-2">{optionLetter}.</span>
                {option.text}
              </div>
              
              <div className={`w-6 h-6 border-2 rounded flex items-center justify-center mr-2 ${
                isSelected ? 'bg-custom-primary border-custom-primary' : 'border-gray-300'
              }`}>
                {isSelected && <span className="text-white">✓</span>}
              </div>
              
              {(isSubmitted || showCorrectAnswer) && isCorrect && <CorrectIcon />}
              {(isSubmitted || showCorrectAnswer) && isSelected && !isCorrect && <IncorrectIcon />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default memo(MultiChoiceComponent);