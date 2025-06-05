'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { AnyQuestion, MultiChoiceQuestion, SingleSelectionQuestion, QuestionType, DropdownSelectionQuestion, OrderQuestion, OrderQuestionAnswer } from '../../types/quiz'; // Added OrderQuestion and OrderQuestionAnswer
import SingleSelectionComponent from '../../features/quiz/components/question-types/SingleSelectionComponent';
import MultiChoiceComponent from '../../features/quiz/components/question-types/MultiChoiceComponent';
import DropdownSelectionComponent from '../../features/quiz/components/question-types/DropdownSelectionComponent'; // Import DropdownSelectionComponent
import OrderQuestionComponent from '../../features/quiz/components/question-types/OrderQuestionComponent'; // Import OrderQuestionComponent
import { fetchRandomQuestionByTypeAndFilters } from '../../lib/supabaseQuizService'; // Import the new service function

export default function QuestionTypeDemo({ params }: { params: Promise<{ type: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ type: string } | null>(null);
  
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state
  const [error, setError] = useState<string | null>(null); // Added error state
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // single_selection
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // multi
  const [dropdownSelections, setDropdownSelections] = useState<Record<string, string | null>>({}); // dropdown_selection
  const [orderedItems, setOrderedItems] = useState<Record<string, string | null>>({}); // order
  const [isSubmittedDemo, setIsSubmittedDemo] = useState(false);
  const [showCorrectAnswerDemo, setShowCorrectAnswerDemo] = useState(false);

  const [filters, setFilters] = useState({
    difficulty: 'all',
    tags: [] as string[]
  });
  const questionType = resolvedParams?.type as QuestionType;
  
  const loadQuestion = useCallback(async () => {
    if (!questionType) return; // Don't load if questionType is not available yet
    
    setIsLoading(true);
    setError(null);
    setCurrentQuestion(null); // Clear previous question
    try {
      const question = await fetchRandomQuestionByTypeAndFilters(questionType, filters);
      if (question) {
        setCurrentQuestion(question);
      } else {
        setError('No question found matching your criteria.');
      }
    } catch (err: any) {
      console.error("Error fetching question:", err);
      setError(err.message || 'Failed to fetch question.');
    } finally {
      setIsLoading(false);
    }
  }, [questionType, filters]); // Added dependencies to useCallback

  useEffect(() => {
    if (resolvedParams) { // Only run when params are resolved
      loadQuestion();
      // Reset selections when question or filters change
      setSelectedOption(null);
      setSelectedOptions([]);
      setDropdownSelections({}); // Reset dropdown selections
      setOrderedItems({}); // Reset order selections
      setIsSubmittedDemo(false);
      setShowCorrectAnswerDemo(false);
    }
  }, [loadQuestion, resolvedParams]); // useEffect now depends on loadQuestion and resolvedParams

  const handleSingleSelect = (optionId: string) => {
    if (!isSubmittedDemo) {
      setSelectedOption(optionId);
    }
  };

  const handleMultiSelect = (optionIds: string[]) => {
    if (!isSubmittedDemo) {
      setSelectedOptions(optionIds);
    }
  };

  const handleDropdownSelect = (selections: Record<string, string | null>) => {
    if (!isSubmittedDemo) {
      setDropdownSelections(selections);
    }
  };
  
  const handleOrderSelect = (answer: Record<string, string | null>) => {
    if (!isSubmittedDemo) {
      setOrderedItems(answer);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <p className="text-xl text-custom-dark-blue">Loading question...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-lg text-gray-700">{error}</p>
          <button 
            onClick={loadQuestion} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            Try Again
          </button>
          <a
            href="/question-types"
            className="mt-6 inline-block px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Question Types
          </a>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-custom-light-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Question Available</h1>
          <p className="text-lg text-gray-700">
            Could not load a question of type &quot;{questionType}&quot; with the current filters (Difficulty: {filters.difficulty}, Tags: {filters.tags.join(', ') || 'None'}).
          </p>
          <button 
            onClick={loadQuestion} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            Try Fetching Again
          </button>
          <a
            href="/question-types"
            className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Question Types
          </a>
        </div>
      </div>
    );
  }

  const pageTitle = currentQuestion 
    ? `${currentQuestion.type.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())} Question Demo` 
    : 'Question Demo';

  return (
    <div className="min-h-screen bg-custom-light-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-custom-dark-blue">
          {pageTitle}
        </h1>
        
        {/* Filter section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <h2 className="text-xl font-semibold mb-2 md:mb-0 text-custom-primary">Filters</h2>
            <button 
              onClick={() => setFilters({ difficulty: 'all', tags: [] })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Reset Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Difficulty filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              >
                <option value="all">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            {/* Tags filter - simplified with checkboxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="space-x-4">
                {['question-types-demo', 'cloud-services'].map(tag => (
                  <label key={tag} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600"
                      checked={filters.tags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                        } else {
                          setFilters(prev => ({ 
                            ...prev, 
                            tags: prev.tags.filter(t => t !== tag) 
                          }));
                        }
                      }}
                    />
                    <span className="ml-2 text-gray-700">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-custom-primary">Instructions</h2>
          <p className="text-gray-700">
            {currentQuestion.type === 'single_selection' && 'Select the correct answer from the options below.'}
            {currentQuestion.type === 'multi' && `Select all correct answers from the options below. (Correct: ${(currentQuestion as MultiChoiceQuestion).correctAnswerOptionIds.length})`}
            {currentQuestion.type === 'dropdown_selection' && 'Select the correct option for each placeholder in the text.'}
            {/* Add instructions for other question types as they are implemented */}
          </p>
        </div>
        
        {/* Question display area */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {currentQuestion.type === 'single_selection' && (
            <SingleSelectionComponent
              question={currentQuestion as SingleSelectionQuestion}
              selectedOptionId={selectedOption}
              onAnswerSelect={handleSingleSelect}
              isSubmitted={isSubmittedDemo}
              showCorrectAnswer={showCorrectAnswerDemo}
            />
          )}
          {currentQuestion.type === 'multi' && (
            <MultiChoiceComponent
              question={currentQuestion as MultiChoiceQuestion}
              selectedOptionIds={selectedOptions}
              onAnswerSelect={handleMultiSelect}
              isSubmitted={isSubmittedDemo}
              showCorrectAnswer={showCorrectAnswerDemo}
            />
          )}
          {currentQuestion.type === 'dropdown_selection' && (
            <DropdownSelectionComponent
              question={currentQuestion as DropdownSelectionQuestion}
              selectedAnswer={dropdownSelections} // Pass current dropdown selections
              onAnswerSelect={handleDropdownSelect} // Handle updates to dropdown selections
              isSubmitted={isSubmittedDemo}
              showCorrectAnswer={showCorrectAnswerDemo}
              validateOnComplete={true} // Add the new prop to wait for all dropdowns to be filled
            />
          )}
          {currentQuestion.type === 'order' && (
            <OrderQuestionComponent
              question={currentQuestion as OrderQuestion}
              onAnswerSelect={handleOrderSelect}
              userAnswer={orderedItems}
              isSubmitted={isSubmittedDemo}
              showCorrectAnswer={showCorrectAnswerDemo}
              isQuizReviewMode={false}
              validateOnComplete={true}
            />
          )}
          {/* Add other question type components here as needed */}

          {/* Demo Controls */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-custom-dark-blue">Demo Controls</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setIsSubmittedDemo(!isSubmittedDemo)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors text-sm ${
                  isSubmittedDemo ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isSubmittedDemo ? 'Unlock Answers (View Mode)' : 'Lock Answers (Submit)'}
              </button>
              <button
                onClick={() => setShowCorrectAnswerDemo(!showCorrectAnswerDemo)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors text-sm ${
                  showCorrectAnswerDemo ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {showCorrectAnswerDemo ? 'Hide Feedback' : 'Show Feedback'}
              </button>
            </div>
            {isSubmittedDemo && (
              <p className="mt-3 text-xs text-gray-600">
                Answers are {selectedOption || selectedOptions.length > 0 || Object.values(dropdownSelections).some(s => s !== null) ? 'locked' : 'not selected but locked'}. Toggle &quot;Show Feedback&quot; to see correctness.
              </p>
            )}
             {!isSubmittedDemo && (
              <p className="mt-3 text-xs text-gray-600">
                Select an answer. Then &quot;Lock Answers&quot; to simulate submission.
              </p>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="mt-8 text-center">
          <a
            href="/question-types"
            className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Question Types
          </a>
        </div>
      </div>
    </div>
  );
}
