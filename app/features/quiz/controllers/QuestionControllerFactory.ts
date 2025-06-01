import { 
  SingleSelectionQuestion, 
  MultiChoiceQuestion, 
  DragAndDropQuestion, 
  DropdownSelectionQuestion,
  OrderQuestion,
  YesNoQuestion,
  YesNoMultiQuestion,
  AnyQuestion 
} from "@/app/types/quiz";
import { SingleSelectionController } from "./SingleSelectionController";
import { MultiChoiceController } from "./MultiChoiceController";
import { DragAndDropController } from "./DragAndDropController";
import { DropdownSelectionController } from "./DropdownSelectionController";
import { OrderController } from "./OrderController";
import { YesNoController } from "./YesNoController";
import { YesNoMultiController } from "./YesNoMultiController";
import { QuestionController } from "./QuestionController";

/**
 * Instantiates and returns the appropriate controller for a given question based on its type.
 *
 * @param question - The question object to create a controller for.
 * @returns An instance of the controller corresponding to the question's type.
 *
 * @throws {Error} If the question type is not supported by any controller.
 */
export function createQuestionController(question: AnyQuestion): QuestionController<any, any> {
  switch (question.type) {
    case 'single_selection':
      return new SingleSelectionController(question as SingleSelectionQuestion);
    case 'multi':
      return new MultiChoiceController(question as MultiChoiceQuestion);
    case 'drag_and_drop':
      return new DragAndDropController(question as DragAndDropQuestion);
    case 'dropdown_selection':
      return new DropdownSelectionController(question as DropdownSelectionQuestion);
    case 'order':
      return new OrderController(question as OrderQuestion);
    case 'yes_no':
      return new YesNoController(question as YesNoQuestion);
    case 'yesno_multi':
      return new YesNoMultiController(question as YesNoMultiQuestion);
    default:
      throw new Error(`No controller available for question type: ${(question as any).type}`);
  }
}
