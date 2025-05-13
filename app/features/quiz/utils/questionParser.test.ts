import { parseDropdownQuestion } from './questionParser';

describe('parseDropdownQuestion', () => {
  it('should correctly parse question text with multiple placeholders', () => {
    const questionText = 'The capital of [France] is [Paris].';
    const expected = {
      parts: ['The capital of ', ' is ', '.'],
      placeholders: ['France', 'Paris'],
    };
    expect(parseDropdownQuestion(questionText)).toEqual(expected);
  });

  it('should handle question text with no placeholders', () => {
    const questionText = 'What is your name?';
    const expected = {
      parts: ['What is your name?'],
      placeholders: [],
    };
    expect(parseDropdownQuestion(questionText)).toEqual(expected);
  });

  it('should handle question text starting with a placeholder', () => {
    const questionText = '[Color] is my favorite color.';
    const expected = {
      parts: ['', ' is my favorite color.'],
      placeholders: ['Color'],
    };
    expect(parseDropdownQuestion(questionText)).toEqual(expected);
  });

  it('should handle question text ending with a placeholder', () => {
    const questionText = 'My favorite food is [Pizza]';
    const expected = {
      parts: ['My favorite food is ', ''],
      placeholders: ['Pizza'],
    };
    expect(parseDropdownQuestion(questionText)).toEqual(expected);
  });

  it('should handle question text with only a placeholder', () => {
    const questionText = '[Placeholder]';
    const expected = {
      parts: ['', ''],
      placeholders: ['Placeholder'],
    };
    expect(parseDropdownQuestion(questionText)).toEqual(expected);
  });

  it('should handle empty string as input', () => {
    const questionText = '';
    const expected = {
      parts: [''],
      placeholders: [],
    };
    expect(parseDropdownQuestion(questionText)).toEqual(expected);
  });

  it('should handle placeholders with spaces and special characters', () => {
    const questionText = 'The item [Item Name 123!*] costs [Price$].';
    const expected = {
      parts: ['The item ', ' costs ', '.'],
      placeholders: ['Item Name 123!*', 'Price$'],
    };
    expect(parseDropdownQuestion(questionText)).toEqual(expected);
  });

  it('should handle consecutive placeholders', () => {
    const questionText = '[One][Two][Three]';
    const expected = {
      parts: ['', '', '', ''],
      placeholders: ['One', 'Two', 'Three'],
    };
    expect(parseDropdownQuestion(questionText)).toEqual(expected);
  });
});
