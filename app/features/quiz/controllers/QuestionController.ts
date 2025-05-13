import { AnyQuestion } from "@/app/types/quiz";
import { AnswerValidator, CorrectnessMap } from "../validators/AnswerValidator";

/**
 * Abstract base controller for question components
 * Manages state and validation logic for question interactions
 */
export abstract class QuestionController<Q extends AnyQuestion, A> {
  protected question: Q;
  protected validator: AnswerValidator<Q, A>;
  
  /**
   * Creates an instance of QuestionController
   * @param question The question this controller manages
   * @param validator The validator for the question's answers
   */
  constructor(question: Q, validator: AnswerValidator<Q, A>) {
    this.question = question;
    this.validator = validator;
  }
  
  /**
   * Gets the question this controller manages
   */
  getQuestion(): Q {
    return this.question;
  }
  
  /**
   * Checks if the answer is complete and ready to be submitted
   * @param answer The current answer state
   * @returns True if the answer can be submitted
   */
  isAnswerComplete(answer: A): boolean {
    return this.validator.isComplete(answer);
  }
  
  /**
   * Validates the correctness of each part of the answer
   * @param answer The answer to validate
   * @returns Map of answer parts to correctness booleans
   */
  validateAnswer(answer: A): CorrectnessMap {
    return this.validator.getCorrectnessMap(answer);
  }
  
  /**
   * Calculates the overall score for an answer (0-1)
   * @param answer The answer to score
   * @returns Proportion of correct elements (0-1)
   */
  getScore(answer: A): number {
    return this.validator.getCorrectnessScore(answer);
  }
  
  /**
   * Checks if the answer is completely correct
   * @param answer The answer to check
   * @returns True if the answer is entirely correct
   */
  isCorrect(answer: A): boolean {
    return this.validator.isCorrect(answer);
  }
}
