// Quick test to verify the Fisher-Yates shuffle algorithm

function shuffleArray(array) {
  const shuffled = [...array]; // Create a copy to avoid mutating the original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Test the shuffle function
const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log('Original:', original);

for (let i = 0; i < 5; i++) {
  const shuffled = shuffleArray(original);
  console.log(`Shuffle ${i + 1}:`, shuffled);
}

// Test with mixed types (simulating question types)
const questions = [
  { id: 1, type: 'single_selection' },
  { id: 2, type: 'multi' },
  { id: 3, type: 'drag_and_drop' },
  { id: 4, type: 'single_selection' },
  { id: 5, type: 'order' },
  { id: 6, type: 'multi' },
];

console.log('\nQuestion type test:');
console.log('Original types:', questions.map(q => q.type).join(', '));

const shuffledQuestions = shuffleArray(questions);
console.log('Shuffled types:', shuffledQuestions.map(q => q.type).join(', '));
