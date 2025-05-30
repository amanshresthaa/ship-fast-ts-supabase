import { createMocks } from 'node-mocks-http';

// Mock the Supabase client and service BEFORE importing the route
jest.mock('@/libs/spaced-repetition');
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    getAll: jest.fn((): any[] => []),
  })),
}));

// Create mock functions that can be used across tests
const mockSupabaseGetUser = jest.fn();

// Mock Supabase auth helpers
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: mockSupabaseGetUser,
    },
  })),
}));

// Now import the route AFTER mocking
import { POST } from '@/app/api/quiz/adaptive-session/route';
import { createSpacedRepetitionService } from '@/libs/spaced-repetition';

const mockCreateSpacedRepetitionService = createSpacedRepetitionService as jest.Mock;

describe('/api/quiz/adaptive-session POST', () => {
  let mockServiceInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceInstance = {
      createAdaptiveQuizSession: jest.fn(),
    };
    mockCreateSpacedRepetitionService.mockReturnValue(mockServiceInstance);
    // @ts-ignore
    global.Request = jest.fn().mockImplementation((input, init) => ({
        json: () => Promise.resolve(init.body ? JSON.parse(init.body) : {}),
        // ... other request properties/methods if needed
    }));
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabaseGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error' } });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        quiz_topic: 'test-topic',
        question_ids: ['a1b2c3d4-e5f6-7890-1234-567890abcdef'],
      },
    });

    const response = await POST(req as any);
    const jsonResponse = await response.json();

    expect(response.status).toBe(401);
    expect(jsonResponse.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid request body (missing quiz_topic)', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        question_ids: ['a1b2c3d4-e5f6-7890-1234-567890abcdef'],
      },
    });

    const response = await POST(req as any);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse.error).toBe('Invalid request body');
    expect(jsonResponse.details.fieldErrors.quiz_topic).toBeDefined();
  });

  it('should return 400 for invalid request body (empty question_ids)', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        quiz_topic: 'test-topic',
        question_ids: [],
      },
    });

    const response = await POST(req as any);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse.error).toBe('Invalid request body');
    expect(jsonResponse.details.fieldErrors.question_ids).toBeDefined();
  });

  it('should return 400 for invalid UUID in question_ids', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        quiz_topic: 'test-topic',
        question_ids: ['invalid-uuid'],
      },
    });

    const response = await POST(req as any);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse.error).toBe('Invalid request body');
    expect(jsonResponse.details.fieldErrors.question_ids).toBeDefined();
  });


  it('should return 201 and session data on successful creation', async () => {
    const mockSessionData = {
      session_id: 'session-789',
      quiz_topic: 'test-topic',
      question_ids: ['a1b2c3d4-e5f6-7890-1234-567890abcdef'],
      created_at: new Date().toISOString(),
      session_settings: { difficulty: 'hard' },
    };
    mockServiceInstance.createAdaptiveQuizSession.mockResolvedValueOnce({ session: mockSessionData, error: null });

    const requestBody = {
      quiz_topic: 'test-topic',
      question_ids: ['a1b2c3d4-e5f6-7890-1234-567890abcdef'],
      session_settings: { difficulty: 'hard' },
    };

    // @ts-ignore
    const req = new Request('http://localhost/api/quiz/adaptive-session', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req as any);
    const jsonResponse = await response.json();

    expect(response.status).toBe(201);
    expect(jsonResponse.message).toBe('Adaptive quiz session created successfully');
    expect(jsonResponse.session.session_id).toBe(mockSessionData.session_id);
    expect(jsonResponse.session.quiz_topic).toBe(mockSessionData.quiz_topic);
    expect(mockServiceInstance.createAdaptiveQuizSession).toHaveBeenCalledWith({
      user_id: 'user-123',
      quiz_topic: requestBody.quiz_topic,
      question_ids: requestBody.question_ids,
      session_settings: requestBody.session_settings,
    });
  });

  it('should return 500 if service fails to create session', async () => {
    mockServiceInstance.createAdaptiveQuizSession.mockResolvedValueOnce({ session: null, error: 'Service failure' });

    const requestBody = {
      quiz_topic: 'test-topic',
      question_ids: ['a1b2c3d4-e5f6-7890-1234-567890abcdef'],
    };

    // @ts-ignore
    const req = new Request('http://localhost/api/quiz/adaptive-session', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req as any);
    const jsonResponse = await response.json();

    expect(response.status).toBe(500);
    expect(jsonResponse.error).toBe('Failed to create adaptive quiz session');
    expect(jsonResponse.details).toBe('Service failure');
  });

   it('should return 400 if question_ids exceed max limit (50)', async () => {
    const tooManyQuestionIds = Array(51).fill(null).map((_, i) => `a1b2c3d4-e5f6-7890-1234-567890abcde${i.toString(16).padStart(2, '0')}`);
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        quiz_topic: 'test-topic',
        question_ids: tooManyQuestionIds,
      },
    });

    const response = await POST(req as any);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse.error).toBe('Invalid request body');
    expect(jsonResponse.details.fieldErrors.question_ids).toBeDefined();
    expect(jsonResponse.details.fieldErrors.question_ids[0]).toContain('Cannot select more than 50 questions');
  });
});
