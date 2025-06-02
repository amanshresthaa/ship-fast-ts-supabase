import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Quiz Help</span>
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* Navigation Help */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>Navigation</span>
              </h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Use <strong>Previous</strong> and <strong>Next</strong> buttons to navigate between questions</li>
                <li>• Click any number in the <strong>Question Map</strong> to jump directly to that question</li>
                <li>• On mobile, tap the menu button (☰) to access the question map and statistics</li>
              </ul>
            </div>

            {/* Answer Help */}
            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Answering Questions</span>
              </h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• You can change your answers at any time before submitting</li>
                <li>• Questions are automatically saved as you answer them</li>
                <li>• Green numbers indicate correctly answered questions</li>
                <li>• Red numbers indicate incorrect answers</li>
                <li>• Gray numbers are unanswered questions</li>
              </ul>
            </div>

            {/* Flag Help */}
            <div className="bg-yellow-50 rounded-xl p-4">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
                <span>Flagging Questions</span>
              </h4>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• Click the <strong>Flag</strong> button to mark questions you want to review later</li>
                <li>• Flagged questions show a yellow dot in the question map</li>
                <li>• Use flags to mark difficult questions or ones you&apos;re unsure about</li>
                <li>• The sidebar shows your total flagged questions count</li>
              </ul>
            </div>

            {/* Timer Help */}
            <div className="bg-red-50 rounded-xl p-4">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Timer & Submission</span>
              </h4>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• The timer shows your remaining time in the top navigation</li>
                <li>• The quiz will auto-submit when time expires</li>
                <li>• You can submit manually at any time using the <strong>Submit Quiz</strong> button</li>
                <li>• A confirmation dialog will appear before final submission</li>
              </ul>
            </div>

            {/* Support */}
            <div className="bg-purple-50 rounded-xl p-4">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>Need More Help?</span>
              </h4>
              <div className="text-sm text-purple-800">
                <p className="mb-2">If you&apos;re experiencing technical issues or have questions about the quiz content:</p>
                <div className="space-y-1">
                  <p>• Email: <strong>support@quizplatform.com</strong></p>
                  <p>• Phone: <strong>1-800-QUIZ-HELP</strong></p>
                  <p>• Live Chat: Available 24/7 in the bottom-right corner</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
