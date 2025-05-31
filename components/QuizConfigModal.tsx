"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { Quiz } from "../app/types/quiz";

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
}

const availableQuestionTypes = [
  { type: 'single_selection', name: 'Single Selection', icon: '📝' },
  { type: 'multi', name: 'Multiple Selection', icon: '☑️' },
  { type: 'drag_and_drop', name: 'Drag and Drop', icon: '🔄' },
  { type: 'dropdown_selection', name: 'Dropdown', icon: '📋' },
  { type: 'order', name: 'Order Questions', icon: '📊' },
  { type: 'yes_no', name: 'Yes/No', icon: '✅' },
  { type: 'yesno_multi', name: 'Yes/No Multi', icon: '✔️' },
];

const QuizConfigModal = ({ isOpen, onClose, quiz }: QuizConfigModalProps) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const router = useRouter();

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleStartFullQuiz = () => {
    router.push(`/quiz/${quiz.id}`);
    onClose();
  };

  const handleStartFocusedQuiz = () => {
    if (selectedTypes.length === 0) {
      return; // Do nothing if no types selected
    }
    
    if (selectedTypes.length === 1) {
      // Single type: use the existing single type route
      router.push(`/quiz/${quiz.id}/type/${selectedTypes[0]}`);
    } else {
      // Multiple types: use the general quiz page with types parameter
      const typeParams = selectedTypes.join(',');
      router.push(`/quiz/${quiz.id}?types=${typeParams}`);
    }
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform bg-white rounded-xl shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Configure Your Quiz
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Quiz Time Section */}
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Time!</h2>
                    <p className="text-gray-600 mb-4">Select your learning path for the quiz below.</p>
                  </div>

                  {/* Quiz Details */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">{quiz.title}</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      {quiz.description || "Prepare for your certification with this comprehensive practice quiz. Test your knowledge across various question formats."}
                    </p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Azure</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">AI</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Certification Prep</span>
                    </div>
                  </div>

                  {/* Quick Start */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Start</h3>
                    <button
                      onClick={handleStartFullQuiz}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                      </svg>
                      Start Full Quiz (All Question Types)
                    </button>
                  </div>

                  {/* Customize Your Practice */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Customize Your Practice</h3>
                    <p className="text-gray-600 text-sm mb-4">Select specific question types to focus on.</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {availableQuestionTypes.map((type) => (
                        <label
                          key={type.type}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                            selectedTypes.includes(type.type)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type.type)}
                            onChange={() => handleTypeToggle(type.type)}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{type.icon}</span>
                            <span className="text-sm font-medium text-gray-900">{type.name}</span>
                          </div>
                          {selectedTypes.includes(type.type) && (
                            <svg className="w-5 h-5 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={handleStartFocusedQuiz}
                      disabled={selectedTypes.length === 0}
                      className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                        selectedTypes.length > 0
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Focused Quiz
                      {selectedTypes.length > 0 && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          {selectedTypes.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
                  <p className="text-center text-xs text-gray-500">
                    © 2025 QuizPlatform. All rights reserved.
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QuizConfigModal;
