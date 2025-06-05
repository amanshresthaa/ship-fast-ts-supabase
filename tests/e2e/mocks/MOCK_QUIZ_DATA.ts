import { Quiz } from '../../../app/types/quiz';

export const MOCK_QUIZ_DATA: Quiz = {
  id: 'azure-a102',
  title: 'Mocked Azure AI Quiz',
  description: 'A comprehensive quiz covering all question types for E2E testing',
  quiz_type: 'practice',
  settings: {},
  author: 'Test Author',
  difficulty: 'medium',
  quiz_topic: 'azure-a102',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  questions: [
    // 1. Single Selection Question
    {
      id: 'q1-single-selection',
      type: 'single_selection',
      question: 'What is the primary purpose of Azure Cognitive Services?',
      points: 10,
      quiz_tag: 'azure-a102',
      difficulty: 'easy',
      explanation: 'Azure Cognitive Services provide AI capabilities without requiring deep ML expertise.',
      feedback_correct: 'Correct! Azure Cognitive Services are pre-built AI services.',
      feedback_incorrect: 'Not quite. Azure Cognitive Services provide ready-to-use AI capabilities.',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      options: [
        { option_id: 'opt1', text: 'To provide pre-built AI services' },
        { option_id: 'opt2', text: 'To train custom ML models from scratch' },
        { option_id: 'opt3', text: 'To manage Azure storage accounts' },
        { option_id: 'opt4', text: 'To deploy virtual machines' }
      ],
      correctAnswerOptionId: 'opt1'
    },

    // 2. Multi Selection Question
    {
      id: 'q2-multi-selection',
      type: 'multi',
      question: 'Which of the following are Azure Cognitive Services categories? (Select all that apply)',
      points: 15,
      quiz_tag: 'azure-a102',
      difficulty: 'medium',
      explanation: 'Azure Cognitive Services are organized into Vision, Speech, Language, and Decision categories.',
      feedback_correct: 'Excellent! You identified all the main Cognitive Services categories.',
      feedback_incorrect: 'Review the main categories of Azure Cognitive Services.',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      options: [
        { option_id: 'multi-opt1', text: 'Vision' },
        { option_id: 'multi-opt2', text: 'Speech' },
        { option_id: 'multi-opt3', text: 'Language' },
        { option_id: 'multi-opt4', text: 'Decision' },
        { option_id: 'multi-opt5', text: 'Networking' },
        { option_id: 'multi-opt6', text: 'Storage' }
      ],
      correctAnswerOptionIds: ['multi-opt1', 'multi-opt2', 'multi-opt3', 'multi-opt4']
    },

    // 3. Order Question
    {
      id: 'q3-order',
      type: 'order',
      question: 'Arrange the following steps in the correct order for implementing a Custom Vision project:',
      points: 20,
      quiz_tag: 'azure-a102',
      difficulty: 'medium',
      explanation: 'The correct workflow starts with creating a project, then gathering data, training, and finally testing.',
      feedback_correct: 'Perfect! You understand the Custom Vision workflow.',
      feedback_incorrect: 'Review the typical workflow for Custom Vision projects.',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      items: [
        { item_id: 'order-item1', text: 'Create Custom Vision project' },
        { item_id: 'order-item2', text: 'Upload and tag training images' },
        { item_id: 'order-item3', text: 'Train the model' },
        { item_id: 'order-item4', text: 'Test the model with new images' }
      ],
      correctOrder: ['order-item1', 'order-item2', 'order-item3', 'order-item4']
    },

    // 4. Drag and Drop Question
    {
      id: 'q4-drag-drop',
      type: 'drag_and_drop',
      question: 'Match each Azure Cognitive Service to its primary function:',
      points: 25,
      quiz_tag: 'azure-a102',
      difficulty: 'medium',
      explanation: 'Each service has a specific purpose within the Cognitive Services ecosystem.',
      feedback_correct: 'Great job matching the services to their functions!',
      feedback_incorrect: 'Review the specific purposes of each Cognitive Service.',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      targets: [
        { target_id: 'target1', text: 'Image Recognition' },
        { target_id: 'target2', text: 'Text Translation' },
        { target_id: 'target3', text: 'Speech-to-Text' },
        { target_id: 'target4', text: 'Anomaly Detection' }
      ],
      options: [
        { option_id: 'drag-opt1', text: 'Computer Vision' },
        { option_id: 'drag-opt2', text: 'Translator' },
        { option_id: 'drag-opt3', text: 'Speech Service' },
        { option_id: 'drag-opt4', text: 'Anomaly Detector' }
      ],
      correctPairs: [
        { option_id: 'drag-opt1', target_id: 'target1' },
        { option_id: 'drag-opt2', target_id: 'target2' },
        { option_id: 'drag-opt3', target_id: 'target3' },
        { option_id: 'drag-opt4', target_id: 'target4' }
      ]
    },

    // 5. Dropdown Selection Question
    {
      id: 'q5-dropdown',
      type: 'dropdown_selection',
      question: 'Complete the sentence: Azure Form Recognizer can extract {dropdown1} from documents and Azure Text Analytics can perform {dropdown2} on text data.',
      points: 15,
      quiz_tag: 'azure-a102',
      difficulty: 'medium',
      explanation: 'Form Recognizer extracts structured data, while Text Analytics performs sentiment analysis.',
      feedback_correct: 'Correct! You understand the capabilities of these services.',
      feedback_incorrect: 'Review what Form Recognizer and Text Analytics can do.',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      options: [
        { option_id: 'dd-opt1', text: 'structured data', is_correct: true },
        { option_id: 'dd-opt2', text: 'images', is_correct: false },
        { option_id: 'dd-opt3', text: 'sentiment analysis', is_correct: true },
        { option_id: 'dd-opt4', text: 'video processing', is_correct: false },
        { option_id: 'dd-opt5', text: 'audio transcription', is_correct: false },
        { option_id: 'dd-opt6', text: 'metadata', is_correct: false }
      ],
      placeholderTargets: {
        'dropdown1': {
          key: 'dropdown1',
          correctOptionText: 'structured data'
        },
        'dropdown2': {
          key: 'dropdown2',
          correctOptionText: 'sentiment analysis'
        }
      }
    },

    // 6. Yes/No Question
    {
      id: 'q6-yes-no',
      type: 'yes_no',
      question: 'Can Azure Cognitive Services be used without writing custom machine learning code?',
      points: 10,
      quiz_tag: 'azure-a102',
      difficulty: 'easy',
      explanation: 'Azure Cognitive Services provide pre-built APIs that can be used directly.',
      feedback_correct: 'Yes! That\'s the main advantage of Cognitive Services.',
      feedback_incorrect: 'Actually, Cognitive Services are designed to be used without custom ML code.',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      correctAnswer: true
    },

    // 7. Yes/No Multi Statement Question
    {
      id: 'q7-yesno-multi',
      type: 'yesno_multi',
      question: 'Evaluate the following statements about Azure Cognitive Services:',
      points: 20,
      quiz_tag: 'azure-a102',
      difficulty: 'hard',
      explanation: 'Understanding the capabilities and limitations of Cognitive Services is important.',
      feedback_correct: 'Excellent! You have a solid understanding of Cognitive Services.',
      feedback_incorrect: 'Review the capabilities and pricing model of Cognitive Services.',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      statements: [
        { statement_id: 'stmt1', text: 'Azure Cognitive Services require a paid subscription' },
        { statement_id: 'stmt2', text: 'Custom Vision can be trained with your own images' },
        { statement_id: 'stmt3', text: 'Speech Service only supports English language' },
        { statement_id: 'stmt4', text: 'Text Analytics can detect the language of input text' }
      ],
      correctAnswers: [false, true, false, true] // Free tier available, Custom Vision is trainable, multiple languages supported, language detection available
    }
  ]
};
