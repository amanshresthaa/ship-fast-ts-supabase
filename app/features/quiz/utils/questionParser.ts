export const parseDropdownQuestion = (questionText: string | undefined): (string | { placeholder: string })[] => {
  const parts: (string | { placeholder: string })[] = [];
  if (!questionText) {
    return parts;
  }

  // Normalize the question text - convert all escaped brackets to regular brackets
  // and handle any line breaks properly
  const processedQuestion = questionText
    .replace(/\\n/g, '\n') // Handle escaped newlines first if they are double escaped e.g. \\n
    .replace(/\n/g, '\n') // Handle single escaped newlines e.g. \n
    .replace(/\\([\[\]])/g, '$1'); // Corrected: Handle escaped brackets e.g. \[ or \]

  // Regex to find placeholders like [option_set1] or [key_name]
  const placeholderRegex = /\[([^\]]+)\]/g; // Corrected: Regex to match [placeholder_key]
  let lastIndex = 0;
  let match;

  while ((match = placeholderRegex.exec(processedQuestion)) !== null) {
    // Add text before the placeholder
    if (match.index > lastIndex) {
      parts.push(processedQuestion.substring(lastIndex, match.index));
    }
    // Add the placeholder object
    parts.push({ placeholder: match[1] });
    lastIndex = placeholderRegex.lastIndex;
  }

  // Add any remaining text after the last placeholder
  if (lastIndex < processedQuestion.length) {
    parts.push(processedQuestion.substring(lastIndex));
  }
  return parts;
};
