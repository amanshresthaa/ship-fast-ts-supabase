import { AnyQuestion } from "@/app/types/quiz";

/**
 * Represents the result of validating an answer
 * Maps target IDs to boolean indicating correctness
 */
export type CorrectnessMap = Record<string, boolean>;

/**
 * Abstract AnswerValidator class
 * Provides a common interface for validating different question types
 */
export abstract class AnswerValidator<Q extends AnyQuestion, A> {
  protected question: Q;

  /**
   * Creates an instance of AnswerValidator
   * @param question The question to validate answers against
   */
  constructor(question: Q) {
    this.question = question;
  }

  /**
   * Checks if the answer is complete
   * @param answer The answer to check
   * @returns True if the answer is complete and can be submitted
   */
  abstract isComplete(answer: A): boolean;

  /**
   * Gets a map showing correctness of each part of the answer
   * @param answer The answer to validate
   * @returns Object mapping target/option IDs to boolean indicating correctness
   */
  abstract getCorrectnessMap(answer: A): CorrectnessMap;

  /**
   * Calculates the overall correctness score
   * @param answer The answer to score
   * @returns A value from 0 to 1 representing percentage correct
   */
  getCorrectnessScore(answer: A): number {
    const correctnessMap = this.getCorrectnessMap(answer);
    const totalItems = Object.keys(correctnessMap).length;
    
    if (totalItems === 0) return 0;
    
    const correctItems = Object.values(correctnessMap)
      .filter(isCorrect => isCorrect)
      .length;
      
    return correctItems / totalItems;
  }

  /**
   * Determines if the answer is entirely correct
   * @param answer The answer to check
   * @returns True if all parts of the answer are correct
   */
  isCorrect(answer: A): boolean {
    const correctnessMap = this.getCorrectnessMap(answer);
    return Object.values(correctnessMap).every(isCorrect => isCorrect);
  }
}
