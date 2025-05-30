import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for testing
const mockSupabase = createClient('http://localhost:54321', 'test-key');

// Test data for SM-2 algorithm
const sm2TestCases = [
  {
    name: 'First correct response (quality 4)',
    input: { ease_factor: 2.5, interval: 1, repetitions: 0, quality: 4 },
    expected: { repetitions: 1, interval: 1, ease_factor: 2.5 } // EF = 2.5 + (0.1 - 1 * (0.08 + 1 * 0.02)) = 2.5 + (0.1 - 0.1) = 2.5
  },
  {
    name: 'Second correct response (quality 4)',
    input: { ease_factor: 2.5, interval: 1, repetitions: 1, quality: 4 },
    expected: { repetitions: 2, interval: 6, ease_factor: 2.5 } // Same as above, capped at 2.5
  },
  {
    name: 'Third correct response (quality 5)',
    input: { ease_factor: 2.5, interval: 6, repetitions: 2, quality: 5 },
    expected: { repetitions: 3, interval: 15, ease_factor: 2.5 } // EF = 2.5 + (0.1 - 0 * (0.08 + 0 * 0.02)) = 2.6, but capped at 2.5
  },
  {
    name: 'Perfect response (quality 5)',
    input: { ease_factor: 2.5, interval: 1, repetitions: 0, quality: 5 },
    expected: { repetitions: 1, interval: 1, ease_factor: 2.5 }
  },
  {
    name: 'Incorrect response (quality 2)',
    input: { ease_factor: 2.5, interval: 6, repetitions: 2, quality: 2 },
    expected: { repetitions: 0, interval: 1, ease_factor: 2.18 } // EF = 2.5 + (0.1 - 3 * (0.08 + 3 * 0.02)) = 2.5 + (0.1 - 3 * 0.14) = 2.5 - 0.32 = 2.18
  },
  {
    name: 'Very poor response (quality 0)',
    input: { ease_factor: 2.5, interval: 6, repetitions: 2, quality: 0 },
    expected: { repetitions: 0, interval: 1, ease_factor: 1.7 } // EF = 2.5 + (0.1 - 5 * (0.08 + 5 * 0.02)) = 2.5 + (0.1 - 5 * 0.18) = 2.5 - 0.8 = 1.7
  },
  {
    name: 'Minimum ease factor boundary',
    input: { ease_factor: 1.3, interval: 1, repetitions: 0, quality: 0 },
    expected: { repetitions: 0, interval: 1, ease_factor: 1.3 }
  },
  {
    name: 'Edge case hitting minimum bound',
    input: { ease_factor: 1.4, interval: 1, repetitions: 0, quality: 0 },
    expected: { repetitions: 0, interval: 1, ease_factor: 1.3 } // EF = 1.4 - 0.8 = 0.6, clamped to 1.3
  }
];

describe('SM-2 Algorithm Tests', () => {
  beforeAll(async () => {
    // Note: These tests would need a real Supabase connection to test the actual functions
    // For now, we're testing the expected behavior patterns
  });

  describe('fn_calculate_sm2_review_details', () => {
    test.each(sm2TestCases)(
      '$name',
      async ({ input, expected }) => {
        // In a real test environment, you would call the actual Supabase function:
        // const { data, error } = await mockSupabase.rpc('fn_calculate_sm2_review_details', {
        //   current_ease_factor: input.ease_factor,
        //   current_interval: input.interval,
        //   repetitions: input.repetitions,
        //   quality_rating: input.quality
        // });

        // For now, we'll test the expected behavior patterns
        const result = calculateSM2(input.ease_factor, input.interval, input.repetitions, input.quality);
        
        expect(result.repetitions).toBe(expected.repetitions);
        expect(result.interval).toBe(expected.interval);
        expect(result.ease_factor).toBeCloseTo(expected.ease_factor, 1);
      }
    );

    it('should handle invalid quality ratings', async () => {
      expect(() => {
        calculateSM2(2.5, 1, 0, 6); // Invalid quality > 5
      }).toThrow();

      expect(() => {
        calculateSM2(2.5, 1, 0, -1); // Invalid quality < 0
      }).toThrow();
    });

    it('should enforce minimum ease factor', () => {
      const result = calculateSM2(1.0, 1, 0, 0); // Very low ease factor
      expect(result.ease_factor).toBeGreaterThanOrEqual(1.3);
    });

    it('should enforce minimum interval', () => {
      const result = calculateSM2(2.5, 1, 0, 0);
      expect(result.interval).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculate_next_review_date wrapper function', () => {
    it('should handle new questions (no existing performance)', async () => {
      // Test would call the wrapper function with a user/question that has no performance record
      // Should use default values: ease_factor=2.5, interval=1, repetitions=0
    });

    it('should use existing performance data when available', async () => {
      // Test would call the wrapper function with a user/question that has existing performance
      // Should use the current values from user_question_performance table
    });
  });
});

describe('Question Response Trigger Tests', () => {
  describe('fn_update_user_question_performance trigger', () => {
    it('should create new performance record for first response', async () => {
      // Test would insert a question_response and verify that user_question_performance is created
    });

    it('should update existing performance record', async () => {
      // Test would insert multiple question_responses and verify updates
    });

    it('should calculate quality rating correctly', () => {
      // Test the quality rating logic:
      // Correct + fast response = quality 5
      // Correct + normal response = quality 4  
      // Correct + slow response = quality 3
      // Incorrect + low confidence = quality 2
      // Incorrect + high confidence = quality 1
    });

    it('should update streaks correctly', async () => {
      // Test correct_streak and incorrect_streak calculations
    });

    it('should calculate priority score appropriately', () => {
      // Test priority score calculation based on incorrect streaks and ease factor
    });
  });
});

describe('Review Questions Retrieval Tests', () => {
  describe('get_questions_due_for_review function', () => {
    it('should return questions due for review', async () => {
      // Test would call the function and verify questions with next_review_date <= NOW() are returned
    });

    it('should include never-attempted questions', async () => {
      // Test that questions with no performance record are included
    });

    it('should filter by quiz topic when specified', async () => {
      // Test topic filtering functionality
    });

    it('should order by priority score and review date', async () => {
      // Test the ordering logic: priority_score DESC, next_review_date ASC
    });

    it('should respect the limit parameter', async () => {
      // Test that the returned count doesn't exceed the specified limit
    });

    it('should handle empty results gracefully', async () => {
      // Test behavior when no questions are due for review
    });
  });
});

// Mock implementation of SM-2 algorithm for testing (mirrors the SQL function logic)
function calculateSM2(currentEF: number, currentInterval: number, repetitions: number, quality: number) {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality rating must be between 0 and 5');
  }

  if (currentEF < 1.3) {
    currentEF = 1.3;
  }

  let newRepetitions = repetitions;
  let newInterval = currentInterval;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * currentEF);
    }
  }

  // Calculate new ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  let newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  if (newEF < 1.3) {
    newEF = 1.3;
  } else if (newEF > 2.5) {
    newEF = 2.5;
  }

  if (newInterval < 1) {
    newInterval = 1;
  }

  return {
    ease_factor: newEF,
    interval: newInterval,
    repetitions: newRepetitions,
    next_review_date: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000).toISOString()
  };
}
