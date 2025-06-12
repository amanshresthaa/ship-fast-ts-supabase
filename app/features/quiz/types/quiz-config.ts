/**
 * Quiz configuration types and defaults
 * Defines the structure for quiz settings and behavior
 */

import { QuestionType, QuestionDifficulty } from './';

// ========================
// 1. Quiz Configuration
// ========================

/** Available feedback modes */
export type FeedbackMode = 'immediate' | 'deferred' | 'none';

/** Available navigation modes */
export type NavigationMode = 'linear' | 'nonlinear' | 'free';

/** Available result display options */
export type ResultDisplay = 'detailed' | 'summary' | 'score_only' | 'none';

/** Available question selection strategies */
export type QuestionSelection = 'sequential' | 'random' | 'adaptive' | 'weighted';

/** Available time limit behaviors */
export type TimeLimitBehavior = 'submit' | 'warn' | 'disable';

/** Available answer review options */
export type ReviewOption = 'all' | 'incorrect' | 'none' | 'flagged';

// ========================
// 2. Quiz Configuration Interface
// ========================

/**
 * Complete quiz configuration with all available options
 */
export interface QuizConfig {
  // Core settings
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  version: string;
  
  // Appearance
  theme?: QuizTheme;
  branding?: QuizBranding;
  layout?: QuizLayout;
  
  // Behavior
  navigation: NavigationMode;
  questionSelection: QuestionSelection;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  allowBackNavigation: boolean;
  allowQuestionReview: boolean;
  allowQuestionFlagging: boolean;
  preventWindowClose: boolean;
  requireFullScreen: boolean;
  
  // Timing
  timeLimit?: number; // in minutes
  timeLimitBehavior: TimeLimitBehavior;
  timeLimitWarningThreshold: number; // in seconds
  perQuestionTimeLimit?: number; // in seconds
  
  // Scoring
  passingScore: number; // 0-100
  pointsPerQuestion: number;
  negativeMarking: boolean;
  negativeMarkingPercentage: number; // 0-100
  showScore: boolean;
  showPassFail: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  showFeedback: boolean;
  
  // Feedback
  feedbackMode: FeedbackMode;
  feedbackOnIncorrect: boolean;
  feedbackOnCorrect: boolean;
  showFeedbackOnComplete: boolean;
  
  // Results
  resultDisplay: ResultDisplay;
  showResultsPage: boolean;
  showReviewPage: boolean;
  allowRetry: boolean;
  maxAttempts?: number;
  showScoreByCategory: boolean;
  showScoreByDifficulty: boolean;
  showTimeSpent: boolean;
  
  // Security
  requireAuthentication: boolean;
  requirePassword: boolean;
  password?: string;
  preventCopyPaste: boolean;
  disableRightClick: boolean;
  disableKeyboardShortcuts: boolean;
  
  // Accessibility
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  highContrastMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Integration
  lmsIntegration?: LMSIntegration;
  analytics?: AnalyticsConfig;
  webhookUrls?: string[];
  
  // Metadata
  tags?: string[];
  categories?: string[];
  difficultyLevels?: QuestionDifficulty[];
  questionTypes?: QuestionType[];
  
  // Advanced
  customCss?: string;
  customJs?: string;
  metadata?: Record<string, any>;
  
  // Dates
  availableFrom?: string; // ISO date string
  availableTo?: string;   // ISO date string
  createdAt: string;      // ISO date string
  updatedAt: string;      // ISO date string
  
  // Owner/Author
  createdBy?: string;
  updatedBy?: string;
  ownerId?: string;
  
  // Versioning
  isDraft: boolean;
  isPublished: boolean;
  publishedAt?: string;   // ISO date string
  versionNotes?: string;
}

// ========================
// 3. Supporting Interfaces
// ========================

/** Theme configuration for the quiz */
export interface QuizTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  boxShadow?: string;
  customCss?: string;
}

/** Branding options for the quiz */
export interface QuizBranding {
  logoUrl?: string;
  logoLink?: string;
  faviconUrl?: string;
  headerText?: string;
  footerText?: string;
  showBranding: boolean;
  showWatermark: boolean;
  customHeader?: string;
  customFooter?: string;
}

/** Layout configuration for the quiz */
export interface QuizLayout {
  showProgressBar: boolean;
  showQuestionNumbers: boolean;
  showQuestionCount: boolean;
  showTimer: boolean;
  showScore: boolean;
  showQuestionNavigation: boolean;
  showQuestionList: boolean;
  singleColumnLayout: boolean;
  fullScreenMode: boolean;
  responsive: boolean;
}

/** Learning Management System integration settings */
export interface LMSIntegration {
  lmsType?: 'moodle' | 'canvas' | 'blackboard' | 'schoology' | 'other';
  ltiEnabled: boolean;
  ltiKey?: string;
  ltiSecret?: string;
  ltiLaunchUrl?: string;
  scormEnabled: boolean;
  scormVersion?: '1.2' | '2004';
  xapiEnabled: boolean;
  xapiEndpoint?: string;
  xapiAuth?: string;
}

/** Analytics and tracking configuration */
export interface AnalyticsConfig {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  hotjarId?: string;
  mixpanelToken?: string;
  customTrackingCode?: string;
  trackPageViews: boolean;
  trackEvents: boolean;
  trackErrors: boolean;
  trackTimeSpent: boolean;
  trackQuestionResponses: boolean;
}

// ========================
// 4. Default Configuration
// ========================

/** Default quiz configuration */
export const defaultQuizConfig: QuizConfig = {
  // Core settings
  id: '',
  title: 'Untitled Quiz',
  version: '1.0.0',
  
  // Appearance
  theme: {
    primaryColor: '#4a6cf7',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  
  // Behavior
  navigation: 'linear',
  questionSelection: 'sequential',
  shuffleQuestions: false,
  shuffleAnswers: false,
  allowBackNavigation: true,
  allowQuestionReview: true,
  allowQuestionFlagging: true,
  preventWindowClose: false,
  requireFullScreen: false,
  
  // Timing
  timeLimitBehavior: 'submit',
  timeLimitWarningThreshold: 60, // 1 minute
  
  // Scoring
  passingScore: 70,
  pointsPerQuestion: 1,
  negativeMarking: false,
  negativeMarkingPercentage: 25,
  showScore: true,
  showPassFail: true,
  showCorrectAnswers: true,
  showExplanations: true,
  showFeedback: true,
  
  // Feedback
  feedbackMode: 'immediate',
  feedbackOnIncorrect: true,
  feedbackOnCorrect: true,
  showFeedbackOnComplete: true,
  
  // Results
  resultDisplay: 'detailed',
  showResultsPage: true,
  showReviewPage: true,
  allowRetry: false,
  showScoreByCategory: true,
  showScoreByDifficulty: true,
  showTimeSpent: true,
  
  // Security
  requireAuthentication: false,
  requirePassword: false,
  preventCopyPaste: false,
  disableRightClick: false,
  disableKeyboardShortcuts: false,
  
  // Accessibility
  enableKeyboardNavigation: true,
  enableScreenReaderSupport: true,
  highContrastMode: false,
  fontSize: 'medium',
  
  // Layout
  layout: {
    showProgressBar: true,
    showQuestionNumbers: true,
    showQuestionCount: true,
    showTimer: true,
    showScore: true,
    showQuestionNavigation: true,
    showQuestionList: true,
    singleColumnLayout: false,
    fullScreenMode: false,
    responsive: true,
  },
  
  // Branding
  branding: {
    showBranding: true,
    showWatermark: false,
  },
  
  // Metadata
  isDraft: true,
  isPublished: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ========================
// 5. Helper Functions
// ========================

/** Merge user config with defaults */
export function mergeWithDefaults(
  userConfig: Partial<QuizConfig>
): QuizConfig {
  return {
    ...defaultQuizConfig,
    ...userConfig,
    theme: {
      ...defaultQuizConfig.theme,
      ...(userConfig.theme || {}),
    },
    layout: {
      ...defaultQuizConfig.layout!,
      ...(userConfig.layout || {}),
    },
    branding: {
      ...defaultQuizConfig.branding!,
      ...(userConfig.branding || {}),
    },
  };
}

/** Validate quiz configuration */
export function validateQuizConfig(
  config: Partial<QuizConfig>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (config.passingScore !== undefined && (config.passingScore < 0 || config.passingScore > 100)) {
    errors.push('Passing score must be between 0 and 100');
  }
  
  if (config.timeLimit !== undefined && config.timeLimit <= 0) {
    errors.push('Time limit must be greater than 0');
  }
  
  if (config.maxAttempts !== undefined && config.maxAttempts <= 0) {
    errors.push('Max attempts must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/** Get default configuration for a specific question type */
export function getDefaultQuestionConfig(type: QuestionType) {
  const baseConfig = {
    points: 1,
    required: true,
    timeLimit: undefined as number | undefined,
    feedback: {
      correct: 'Correct!',
      incorrect: 'Incorrect. Please try again.',
    },
  };
  
  switch (type) {
    case 'single_selection':
      return {
        ...baseConfig,
        shuffleOptions: true,
        showOtherOption: false,
        otherOptionLabel: 'Other (please specify)',
      };
      
    case 'multi_selection':
      return {
        ...baseConfig,
        shuffleOptions: true,
        minSelections: 1,
        maxSelections: undefined as number | undefined,
        showOtherOption: false,
        otherOptionLabel: 'Other (please specify)',
      };
      
    case 'true_false':
    case 'yes_no':
      return baseConfig;
      
    case 'short_answer':
      return {
        ...baseConfig,
        caseSensitive: false,
        trimWhitespace: true,
        minLength: 1,
        maxLength: 1000,
        multiline: false,
        rows: 3,
      };
      
    case 'order':
    case 'yesno_multi':
    case 'drag_and_drop':
    case 'matching':
      return baseConfig;
      
    default:
      return baseConfig;
  }
}
