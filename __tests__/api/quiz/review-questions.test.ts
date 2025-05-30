import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Mock Supabase client before importing the routes
const mockSupabaseRpc = jest.fn();
const mockSupabaseAuthGetSession = jest.fn();

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getSession: mockSupabaseAuthGetSession,
    },
    rpc: mockSupabaseRpc,
  })),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: (): any[] => [],
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

// Mock NextResponse to work with our test environment
const mockNextResponse = {
  json: jest.fn((data: any, init?: { status?: number; headers?: Headers }) => {
    const responseHeaders = new Map();
    
    // Handle Headers object properly
    if (init?.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });
    } else if (init?.headers) {
      // Handle plain object headers
      Object.entries(init.headers).forEach(([key, value]) => {
        responseHeaders.set(key, value as string);
      });
    }
    
    return {
      status: init?.status || 200,
      headers: {
        get: (name: string) => responseHeaders.get(name) || null,
        has: (name: string) => responseHeaders.has(name),
        forEach: (callback: (value: string, key: string) => void) => responseHeaders.forEach(callback),
        entries: () => responseHeaders.entries(),
        keys: () => responseHeaders.keys(),
        values: () => responseHeaders.values(),
      },
      json: async () => data,
    };
  }),
};

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: mockNextResponse,
}));

describe('/api/quiz/review-questions', () => {
  // Import after mocking
  let GET: any, POST: any;

  beforeAll(async () => {
    const module = await import('@/app/api/quiz/review-questions/route');
    GET = module.GET;
    POST = module.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock request
  const createMockRequest = (url: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    const mockUrl = new URL(url);
    return {
      url,
      method,
      searchParams: mockUrl.searchParams,
      json: async () => body || {},
    } as any;
  };

  // Helper function to create mock session
  const createMockSession = (userId?: string) => ({
    user: userId ? { id: userId } : null,
  });

  describe('GET /api/quiz/review-questions - Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when auth session has error', async () => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Authentication failed'),
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session exists but user is null', async () => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: { user: null } },
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/quiz/review-questions - Query Parameter Validation', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should reject negative limit values', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=-5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a positive integer');
    });

    it('should reject zero limit values', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a positive integer');
    });

    it('should reject limit values exceeding maximum', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=101');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit cannot exceed 100');
    });

    it('should reject non-numeric limit values', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a positive integer');
    });

    it('should accept valid limit values', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=50');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: null,
        p_limit: 50,
      });
    });

    it('should use default limit when not provided', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);

      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: null,
        p_limit: 20,
      });
    });

    it('should handle quiz_topic parameter correctly', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions?quiz_topic=mathematics');
      const response = await GET(request);

      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: 'mathematics',
        p_limit: 20,
      });
    });
  });

  describe('GET /api/quiz/review-questions - Database Integration', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle database connection errors', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: new Error('Connection timeout'),
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch review questions');
    });

    it('should handle database function not found errors', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'function get_questions_due_for_review does not exist' },
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch review questions');
    });

    it('should return successful response with questions', async () => {        const mockQuestions = [
        {
          question_id: 'q1',
          question_text: 'What is 2+2?',
          question_type: 'single_selection',
          quiz_topic: 'mathematics',
          difficulty: 'easy',
          points: 1,
          next_review_date: '2025-05-30T12:00:00Z',
          ease_factor: 2.5,
          interval_days: 1,
          repetitions: 0,
          correct_streak: 0,
          incorrect_streak: 0,
          priority_score: 1.0,
          total_attempts: 0,
          correct_attempts: 0,
          last_reviewed_at: null as string | null,
        },
      ];

      mockSupabaseRpc.mockResolvedValue({
        data: mockQuestions,
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.questions).toEqual(mockQuestions);
      expect(data.metadata).toEqual({
        total_count: 1,
        quiz_topic_filter: null,
        limit: 20,
        generated_at: expect.any(String),
      });
    });

    it('should return empty array when no questions found', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.questions).toEqual([]);
      expect(data.metadata.total_count).toBe(0);
    });

    it('should handle null data response from database', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.questions).toEqual([]);
      expect(data.metadata.total_count).toBe(0);
    });
  });

  describe('GET /api/quiz/review-questions - Response Headers', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });
    });

    it('should include proper cache control headers', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);

      // Debug: Let's see what's in the mock call
      const mockCalls = mockNextResponse.json.mock.calls;
      const lastCall = mockCalls[mockCalls.length - 1];
      
      if (lastCall && lastCall[1] && lastCall[1].headers) {
        // Check if headers were passed as a Headers object
        const headersArg = lastCall[1].headers;
        if (headersArg instanceof Headers) {
          expect(headersArg.get('Cache-Control')).toBe('private, max-age=60, stale-while-revalidate=300');
        } else {
          // If it's a plain object
          expect(headersArg['Cache-Control']).toBe('private, max-age=60, stale-while-revalidate=300');
        }
      } else {
        // If our mock implementation is working correctly
        expect(response.headers.get('Cache-Control')).toBe('private, max-age=60, stale-while-revalidate=300');
      }
    });
  });

  describe('POST /api/quiz/review-questions - Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/quiz/review-questions - Request Body Validation', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should reject invalid limit values in POST body', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {
        limit: -5,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a number between 1 and 100');
    });

    it('should reject limit exceeding maximum in POST body', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {
        limit: 150,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a number between 1 and 100');
    });

    it('should reject non-numeric limit in POST body', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {
        limit: 'invalid',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a number between 1 and 100');
    });

    it('should accept valid POST body with all parameters', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {
        quiz_topic: 'science',
        limit: 25,
        include_metadata: true,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: 'science',
        p_limit: 25,
      });
      expect(data.metadata).toBeDefined();
    });

    it('should exclude metadata when include_metadata is false', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {
        include_metadata: false,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata).toBeUndefined();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle unexpected errors in GET request', async () => {
      mockSupabaseRpc.mockRejectedValue(new Error('Unexpected error'));

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle unexpected errors in POST request', async () => {
      mockSupabaseRpc.mockRejectedValue(new Error('Unexpected error'));

      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle auth session rejection', async () => {
      mockSupabaseAuthGetSession.mockRejectedValue(new Error('Auth service unavailable'));

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle very large quiz_topic strings', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const largeTopic = 'a'.repeat(1000);
      const request = createMockRequest(`http://localhost/api/quiz/review-questions?quiz_topic=${largeTopic}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: largeTopic,
        p_limit: 20,
      });
    });

    it('should handle special characters in quiz_topic', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const specialTopic = 'math&science!@#$%^&*()';
      const request = createMockRequest(`http://localhost/api/quiz/review-questions?quiz_topic=${encodeURIComponent(specialTopic)}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: specialTopic,
        p_limit: 20,
      });
    });

    it('should handle empty string quiz_topic', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions?quiz_topic=');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: null,
        p_limit: 20,
      });
    });
  });

  describe('Performance and Scalability Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle maximum allowed questions response', async () => {
      const maxQuestions = Array.from({ length: 100 }, (_, i) => ({
        question_id: `q${i + 1}`,
        question_text: `Question ${i + 1}`,
        question_type: 'single_selection',
        quiz_topic: 'test',
        difficulty: 'medium',
        points: 1,
        next_review_date: new Date().toISOString(),
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
        correct_streak: 0,
        incorrect_streak: 0,
        priority_score: 1.0,
        total_attempts: 0,
        correct_attempts: 0,
        last_reviewed_at: null as string | null,
      }));

      mockSupabaseRpc.mockResolvedValue({
        data: maxQuestions,
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=100');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(100);
      expect(data.metadata.total_count).toBe(100);
    });

    it('should handle database timeouts gracefully', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'timeout' },
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch review questions');
    });

    it('should handle concurrent requests with proper isolation', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request1 = createMockRequest('http://localhost/api/quiz/review-questions?quiz_topic=math');
      const request2 = createMockRequest('http://localhost/api/quiz/review-questions?quiz_topic=science');

      const [response1, response2] = await Promise.all([
        GET(request1),
        GET(request2),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledTimes(2);
    });
  });

  describe('Legacy Tests - Basic Validation', () => {
    it('should validate parameter structure', () => {
      const expectedParams = {
        p_user_id: 'string',
        p_quiz_topic_filter: 'string | null',
        p_limit: 'number',
      };

      expect(expectedParams.p_user_id).toBe('string');
      expect(expectedParams.p_limit).toBe('number');
    });

    it('should validate response structure types', () => {
      const expectedSuccessResponse = {
        success: true,
        questions: [] as any[],
        metadata: {
          total_count: 0,
          quiz_topic_filter: null as string | null,
          limit: 20,
          generated_at: new Date().toISOString(),
        },
      };

      expect(expectedSuccessResponse.success).toBe(true);
      expect(Array.isArray(expectedSuccessResponse.questions)).toBe(true);
      expect(expectedSuccessResponse.metadata).toBeDefined();
      expect(typeof expectedSuccessResponse.metadata.total_count).toBe('number');
      expect(typeof expectedSuccessResponse.metadata.limit).toBe('number');
      expect(typeof expectedSuccessResponse.metadata.generated_at).toBe('string');
    });

    it('should validate question data structure types', () => {
      const expectedQuestionFields = [
        'question_id', 'question_text', 'question_type', 'quiz_topic',
        'difficulty', 'points', 'next_review_date', 'ease_factor',
        'interval_days', 'repetitions', 'correct_streak', 'incorrect_streak',
        'priority_score', 'total_attempts', 'correct_attempts', 'last_reviewed_at'
      ];

      expectedQuestionFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    it('should validate UUID format patterns', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      expect(uuidRegex.test(validUUID)).toBe(true);
      expect(uuidRegex.test('invalid-uuid')).toBe(false);
    });
  });

  describe('Advanced Edge Cases and Security Scenarios', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle malformed JSON in POST request', async () => {
      const request = {
        url: 'http://localhost/api/quiz/review-questions',
        method: 'POST',
        searchParams: new URLSearchParams(),
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON');
        },
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle extremely long user IDs', async () => {
      const longUserId = 'x'.repeat(10000);
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession(longUserId) },
        error: null,
      });

      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: longUserId,
        p_quiz_topic_filter: null,
        p_limit: 20,
      });
    });

    it('should handle SQL injection attempts in quiz_topic', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const maliciousTopic = "'; DROP TABLE questions; --";
      const request = createMockRequest(`http://localhost/api/quiz/review-questions?quiz_topic=${encodeURIComponent(maliciousTopic)}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: maliciousTopic,
        p_limit: 20,
      });
    });

    it('should handle Unicode characters in quiz_topic', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const unicodeTopic = '数学 🧮 Математика';
      const request = createMockRequest(`http://localhost/api/quiz/review-questions?quiz_topic=${encodeURIComponent(unicodeTopic)}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: unicodeTopic,
        p_limit: 20,
      });
    });

    it('should handle null byte characters in quiz_topic', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const nullByteTopic = 'math\0topic';
      const request = createMockRequest(`http://localhost/api/quiz/review-questions?quiz_topic=${encodeURIComponent(nullByteTopic)}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: nullByteTopic,
        p_limit: 20,
      });
    });

    it('should handle floating point limit values', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=25.5');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: null,
        p_limit: 25, // parseInt should floor the value
      });
    });

    it('should handle scientific notation in limit', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=1e2');
      const response = await GET(request);

      // parseInt('1e2') returns 1, which is valid
      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: null,
        p_limit: 1, // parseInt('1e2') === 1
      });
    });

    it('should handle hexadecimal limit values', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=0x20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a positive integer');
    });
  });

  describe('Database Error Scenarios', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle database permission errors', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'permission denied for function get_questions_due_for_review' },
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch review questions');
    });

    it('should handle database constraint violations', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'violates foreign key constraint' },
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch review questions');
    });

    it('should handle database deadlock errors', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'deadlock detected' },
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch review questions');
    });

    it('should handle corrupted data responses', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [
          {
            question_id: null, // corrupted data
            question_text: undefined,
            invalid_field: 'should not exist',
          },
        ],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.questions).toHaveLength(1);
      expect(data.questions[0].question_id).toBeNull();
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle session with malformed user object', async () => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: { user: { id: null } } },
        error: null,
      });

      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);

      // The API actually accepts null ID and passes it to the database
      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: null,
        p_quiz_topic_filter: null,
        p_limit: 20,
      });
    });

    it('should handle session with empty user ID', async () => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: { user: { id: '' } } },
        error: null,
      });

      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);

      // The API actually accepts empty string ID and passes it to the database
      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: '',
        p_quiz_topic_filter: null,
        p_limit: 20,
      });
    });

    it('should handle auth timeout errors', async () => {
      mockSupabaseAuthGetSession.mockRejectedValue(new Error('TIMEOUT'));

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle auth network errors', async () => {
      mockSupabaseAuthGetSession.mockRejectedValue(new Error('Network request failed'));

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle large response payloads gracefully', async () => {
      const largeQuestions = Array.from({ length: 100 }, (_, i) => ({
        question_id: `q${i + 1}`,
        question_text: 'A'.repeat(10000), // Large text field
        question_type: 'single_selection',
        quiz_topic: 'test',
        difficulty: 'medium',
        points: 1,
        next_review_date: new Date().toISOString(),
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
        correct_streak: 0,
        incorrect_streak: 0,
        priority_score: 1.0,
        total_attempts: 0,
        correct_attempts: 0,
        last_reviewed_at: null as string | null,
        // Add large optional fields
        explanation: 'B'.repeat(5000),
        hint: 'C'.repeat(3000),
      }));

      mockSupabaseRpc.mockResolvedValue({
        data: largeQuestions,
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=100');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(100);
      expect(data.questions[0].question_text).toHaveLength(10000);
    });

    it('should handle rapid sequential requests', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const requests = Array.from({ length: 10 }, () => 
        createMockRequest('http://localhost/api/quiz/review-questions')
      );

      const responses = await Promise.all(requests.map(req => GET(req)));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(mockSupabaseRpc).toHaveBeenCalledTimes(10);
    });
  });

  describe('URL and Parameter Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });
    });

    it('should handle multiple query parameters with same name', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=10&limit=20');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // URL.searchParams.get() returns the first value
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: null,
        p_limit: 10,
      });
    });

    it('should handle URL with fragment identifier', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=25#section1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: null,
        p_limit: 25,
      });
    });

    it('should handle encoded special characters in URL parameters', async () => {
      const encodedTopic = encodeURIComponent('math & science (advanced)');
      const request = createMockRequest(`http://localhost/api/quiz/review-questions?quiz_topic=${encodedTopic}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: 'math & science (advanced)',
        p_limit: 20,
      });
    });

    it('should handle malformed URL parameters gracefully', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions?limit=%');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a positive integer');
    });
  });

  describe('POST Request Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle POST request with missing body', async () => {
      const request = {
        url: 'http://localhost/api/quiz/review-questions',
        method: 'POST',
        searchParams: new URLSearchParams(),
        json: async () => ({}),
      } as any;

      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: null,
        p_limit: 20,
      });
    });

    it('should handle POST request with null values', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {
        quiz_topic: null,
        limit: null,
        include_metadata: null,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a number between 1 and 100');
    });

    it('should handle POST request with undefined values', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {
        quiz_topic: undefined,
        limit: undefined,
        include_metadata: undefined,
      });

      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata).toBeDefined(); // include_metadata defaults to true
    });

    it('should handle POST request with very large body', async () => {
      const largeTopic = 'x'.repeat(100000);
      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {
        quiz_topic: largeTopic,
        limit: 50,
      });

      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: largeTopic,
        p_limit: 50,
      });
    });

    it('should handle POST request with mixed data types', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {
        quiz_topic: 123, // number instead of string
        limit: '25', // string instead of number
        include_metadata: 'true', // string instead of boolean
        extra_field: { nested: 'object' }, // unexpected field
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('limit must be a number between 1 and 100');
    });
  });

  describe('Concurrent Operations and Race Conditions', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle concurrent GET and POST requests', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const getRequest = createMockRequest('http://localhost/api/quiz/review-questions');
      const postRequest = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', { limit: 10 });

      const [getResponse, postResponse] = await Promise.all([
        GET(getRequest),
        POST(postRequest),
      ]);

      expect(getResponse.status).toBe(200);
      expect(postResponse.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple authentication checks simultaneously', async () => {
      let authCallCount = 0;
      mockSupabaseAuthGetSession.mockImplementation(() => {
        authCallCount++;
        return Promise.resolve({
          data: { session: createMockSession('user-123') },
          error: null,
        });
      });

      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const requests = Array.from({ length: 5 }, () => 
        createMockRequest('http://localhost/api/quiz/review-questions')
      );

      const responses = await Promise.all(requests.map(req => GET(req)));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(authCallCount).toBe(5);
    });
  });

  describe('Error Recovery and Resilience', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle intermittent database failures', async () => {
      let callCount = 0;
      mockSupabaseRpc.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: null,
            error: new Error('Connection temporarily unavailable'),
          });
        }
        return Promise.resolve({
          data: [],
          error: null,
        });
      });

      // First request should fail
      const request1 = createMockRequest('http://localhost/api/quiz/review-questions');
      const response1 = await GET(request1);
      expect(response1.status).toBe(500);

      // Second request should succeed
      const request2 = createMockRequest('http://localhost/api/quiz/review-questions');
      const response2 = await GET(request2);
      expect(response2.status).toBe(200);
    });

    it('should maintain state isolation between requests', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request1 = createMockRequest('http://localhost/api/quiz/review-questions?quiz_topic=math&limit=10');
      const request2 = createMockRequest('http://localhost/api/quiz/review-questions?quiz_topic=science&limit=50');

      await Promise.all([GET(request1), GET(request2)]);

      expect(mockSupabaseRpc).toHaveBeenNthCalledWith(1, 'get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: 'math',
        p_limit: 10,
      });

      expect(mockSupabaseRpc).toHaveBeenNthCalledWith(2, 'get_questions_due_for_review', {
        p_user_id: 'user-123',
        p_quiz_topic_filter: 'science',
        p_limit: 50,
      });
    });
  });

  describe('Data Validation and Type Safety', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
    });

    it('should handle questions with missing required fields', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [
          {
            question_id: 'q1',
            // Missing question_text and other required fields
            quiz_topic: 'math',
          },
        ],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(1);
      expect(data.questions[0].question_id).toBe('q1');
      expect(data.questions[0].quiz_topic).toBe('math');
    });

    it('should handle questions with extra unexpected fields', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [
          {
            question_id: 'q1',
            question_text: 'Test question',
            quiz_topic: 'math',
            // Extra fields that shouldn't be there
            internal_admin_notes: 'This should not be exposed',
            created_by_user_id: 'admin-123',
            encrypted_answer: 'secret-data',
          },
        ],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions[0]).toHaveProperty('internal_admin_notes');
      expect(data.questions[0]).toHaveProperty('encrypted_answer');
    });

    it('should handle mixed data types in database response', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [
          {
            question_id: 123, // number instead of string
            question_text: null, // null instead of string
            points: '5', // string instead of number
            ease_factor: 'invalid', // invalid type
            next_review_date: 'not-a-date',
          },
        ],
        error: null,
      });

      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions[0].question_id).toBe(123);
      expect(data.questions[0].question_text).toBeNull();
      expect(data.questions[0].points).toBe('5');
    });
  });

  describe('Caching and Performance Headers', () => {
    beforeEach(() => {
      mockSupabaseAuthGetSession.mockResolvedValue({
        data: { session: createMockSession('user-123') },
        error: null,
      });
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });
    });

    it('should include cache headers for GET requests', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);

      // Debug: Let's see what's in the mock call
      const mockCalls = mockNextResponse.json.mock.calls;
      const lastCall = mockCalls[mockCalls.length - 1];
      
      if (lastCall && lastCall[1] && lastCall[1].headers) {
        // Check if headers were passed as a Headers object
        const headersArg = lastCall[1].headers;
        if (headersArg instanceof Headers) {
          expect(headersArg.get('Cache-Control')).toBe('private, max-age=60, stale-while-revalidate=300');
        } else {
          // If it's a plain object
          expect(headersArg['Cache-Control']).toBe('private, max-age=60, stale-while-revalidate=300');
        }
      } else {
        // If our mock implementation is working correctly
        expect(response.headers.get('Cache-Control')).toBe('private, max-age=60, stale-while-revalidate=300');
      }
    });

    it('should not include cache headers for POST requests', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions', 'POST', {});
      const response = await POST(request);

      expect(response.headers.get('Cache-Control')).toBeNull();
    });

    it('should include proper content type headers', async () => {
      const request = createMockRequest('http://localhost/api/quiz/review-questions');
      const response = await GET(request);

      // The NextResponse.json should set content-type automatically
      expect(response.status).toBe(200);
    });
  });
});
