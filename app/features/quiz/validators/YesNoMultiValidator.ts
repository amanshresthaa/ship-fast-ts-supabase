import { YesNoMultiQuestion } from '@/app/types/quiz';
import { AnswerValidator, CorrectnessMap } from './AnswerValidator';

/**
 * Validator for multi-statement yes/no questions
 * Works with boolean[] answer type (array of true/false values)
 */
export class YesNoMultiValidator extends AnswerValidator<YesNoMultiQuestion, boolean[]> {
  /**
   * Checks if all statements have been answered
   * @param answers Array of boolean answers corresponding to each statement
   * @returns True if all statements have been answered
   */
  isComplete(answers: boolean[]): boolean {
    // Check if answers array exists and has the expected length
    if (!answers || !Array.isArray(answers)) return false;
    
    // The answers array should match the number of statements in the question
    if (answers.length !== this.question.statements.length) return false;
    
    // Each statement must have an answer (not null or undefined)
    return answers.every(answer => answer !== null && answer !== undefined);
  }
  
  /**
   * Validates the correctness of each statement's answer
   * @param answers Array of boolean answers
   * @returns Map with entries for each statement's correctness
   */
  getCorrectnessMap(answers: boolean[]): CorrectnessMap {
    const correctnessMap: CorrectnessMap = {};
    
    // If no answers, return empty map
    if (!answers || !Array.isArray(answers)) {
      return correctnessMap;
    }
    
    // Check each answer against the correct answers
    this.question.statements.forEach((statement, index) => {
      // Only check items that have been answered and are within range
      if (index < answers.length && answers[index] !== null && answers[index] !== undefined) {
        // Compare user answer with correct answer for this statement
        const isCorrect = answers[index] === this.question.correctAnswers[index];
        correctnessMap[statement.statement_id] = isCorrect;
      }
    });
    
    return correctnessMap;
  }
}
