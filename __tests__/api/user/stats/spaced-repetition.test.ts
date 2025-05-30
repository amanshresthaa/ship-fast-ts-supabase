import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/user/stats/spaced-repetition/route';

// Mock NextResponse
jest.mock('next/server', () => {
  const mockResponse = jest.fn((body: any, init?: any) => ({
    json: async () => body,
    status: init?.status || 200,
    headers: new Map(Object.entries(init?.headers || {}))
  }));
  
  (mockResponse as any).json = jest.fn((data: any, init?: any) => ({
    json: async () => data,
    status: init?.status || 200,
    headers: new Map(Object.entries(init?.headers || {}))
  }));

  return {
    NextRequest: jest.fn(),
    NextResponse: mockResponse
  };
});

// Mock Next.js components
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn((): any[] => []),
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

// Mock Supabase client
const mockSupabaseRpc = jest.fn();
const mockSupabaseAuthGetUser = jest.fn();

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: mockSupabaseAuthGetUser,
    },
    rpc: mockSupabaseRpc,
  })),
}));

describe('/api/user/stats/spaced-repetition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/stats/spaced-repetition', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseAuthGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Authentication error' },
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/user/stats/spaced-repetition',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return default stats when user has no data', async () => {
      mockSupabaseAuthGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/user/stats/spaced-repetition',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        totalQuestionsReviewed: 0,
        questionsDueToday: 0,
        questionsDueThisWeek: 0,
        averageEaseFactor: 2.5,
        accuracyRate: 0,
        masteredQuestions: 0,
        strugglingQuestions: 0,
        averageResponseTimeSeconds: 0,
        longestStreak: 0,
        currentStreak: 0,
        questionsStudiedToday: 0,
        totalStudyTimeMinutesToday: 0,
        calculatedAt: expect.any(Number),
      });
    });

    it('should return actual stats when user has data', async () => {
      const mockStats = {
        totalQuestionsReviewed: 25,
        questionsDueToday: 5,
        questionsDueThisWeek: 12,
        averageEaseFactor: 2.7,
        accuracyRate: 85.5,
        masteredQuestions: 8,
        strugglingQuestions: 2,
        averageResponseTimeSeconds: 15.3,
        longestStreak: 7,
        currentStreak: 3,
        questionsStudiedToday: 5,
        totalStudyTimeMinutesToday: 25,
        calculatedAt: 1640995200,
      };

      mockSupabaseAuthGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabaseRpc.mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/user/stats/spaced-repetition',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockStats);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_user_spaced_repetition_stats', {
        p_user_id: 'user-123',
      });
    });

    it('should return 500 if database function returns error', async () => {
      mockSupabaseAuthGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error', details: 'Connection failed' },
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/user/stats/spaced-repetition',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch user statistics');
    });

    it('should handle function-level errors returned in data', async () => {
      mockSupabaseAuthGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabaseRpc.mockResolvedValue({
        data: {
          error: true,
          message: 'Function execution failed',
        },
        error: null,
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/user/stats/spaced-repetition',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to calculate statistics');
      expect(data.details).toBe('Function execution failed');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseAuthGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabaseRpc.mockRejectedValue(new Error('Unexpected error'));

      const { req } = createMocks({
        method: 'GET',
        url: '/api/user/stats/spaced-repetition',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('OPTIONS /api/user/stats/spaced-repetition', () => {
    it('should return CORS headers for OPTIONS request', async () => {
      const { req } = createMocks({
        method: 'OPTIONS',
        url: '/api/user/stats/spaced-repetition',
      });

      // Import OPTIONS function
      const { OPTIONS } = await import('@/app/api/user/stats/spaced-repetition/route');
      const response = await OPTIONS(req as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });
  });
});
