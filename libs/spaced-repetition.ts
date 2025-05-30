import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AdaptiveQuizSessionData {
  user_id: string;
  quiz_topic: string;
  question_ids: string[];
  session_settings?: Record<string, any>;
}

export interface AdaptiveQuizSession {
  session_id: string;
  user_id: string;
  quiz_topic: string;
  question_ids: string[];
  session_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export class SpacedRepetitionService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Creates a new adaptive quiz session record
   */
  async createAdaptiveQuizSession(
    sessionData: AdaptiveQuizSessionData
  ): Promise<{ session: AdaptiveQuizSession | null; error: string | null }> {
    try {
      // Validate input
      if (!sessionData.user_id || !sessionData.quiz_topic || !Array.isArray(sessionData.question_ids)) {
        return { 
          session: null, 
          error: 'Missing required fields: user_id, quiz_topic, question_ids' 
        };
      }

      if (sessionData.question_ids.length === 0) {
        return { 
          session: null, 
          error: 'question_ids array cannot be empty' 
        };
      }

      // Validate that all question_ids are valid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = sessionData.question_ids.filter(id => !uuidRegex.test(id));
      if (invalidIds.length > 0) {
        return { 
          session: null, 
          error: `Invalid question IDs: ${invalidIds.join(', ')}` 
        };
      }

      // Verify questions exist
      const { data: questions, error: questionsError } = await this.supabase
        .from('questions')
        .select('id')
        .in('id', sessionData.question_ids);

      if (questionsError) {
        console.error('Error validating questions:', questionsError);
        return { 
          session: null, 
          error: 'Failed to validate questions' 
        };
      }

      if (!questions || questions.length !== sessionData.question_ids.length) {
        const foundIds = questions?.map(q => q.id) || [];
        const missingIds = sessionData.question_ids.filter(id => !foundIds.includes(id));
        return { 
          session: null, 
          error: `Questions not found: ${missingIds.join(', ')}` 
        };
      }

      // Insert the session record
      const { data: session, error: insertError } = await this.supabase
        .from('adaptive_quiz_sessions')
        .insert({
          user_id: sessionData.user_id,
          quiz_topic: sessionData.quiz_topic,
          question_ids: sessionData.question_ids,
          session_settings: sessionData.session_settings || {}
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating adaptive quiz session:', insertError);
        return { 
          session: null, 
          error: 'Failed to create quiz session' 
        };
      }

      return { session, error: null };

    } catch (error) {
      console.error('Unexpected error in createAdaptiveQuizSession:', error);
      return { 
        session: null, 
        error: 'Internal service error' 
      };
    }
  }

  /**
   * Marks an adaptive quiz session as completed
   */
  async completeAdaptiveQuizSession(
    sessionId: string, 
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('adaptive_quiz_sessions')
        .update({ 
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error completing adaptive quiz session:', error);
        return { success: false, error: 'Failed to complete session' };
      }

      return { success: true, error: null };

    } catch (error) {
      console.error('Unexpected error in completeAdaptiveQuizSession:', error);
      return { success: false, error: 'Internal service error' };
    }
  }

  /**
   * Gets adaptive quiz sessions for a user
   */
  async getUserAdaptiveQuizSessions(
    userId: string, 
    options?: {
      quiz_topic?: string;
      completed?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ sessions: AdaptiveQuizSession[]; error: string | null }> {
    try {
      let query = this.supabase
        .from('adaptive_quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.quiz_topic) {
        query = query.eq('quiz_topic', options.quiz_topic);
      }

      if (options?.completed !== undefined) {
        if (options.completed) {
          query = query.not('completed_at', 'is', null);
        } else {
          query = query.is('completed_at', null);
        }
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data: sessions, error } = await query;

      if (error) {
        console.error('Error fetching adaptive quiz sessions:', error);
        return { sessions: [], error: 'Failed to fetch sessions' };
      }

      return { sessions: sessions || [], error: null };

    } catch (error) {
      console.error('Unexpected error in getUserAdaptiveQuizSessions:', error);
      return { sessions: [], error: 'Internal service error' };
    }
  }

  /**
   * Gets a specific adaptive quiz session
   */
  async getAdaptiveQuizSession(
    sessionId: string, 
    userId: string
  ): Promise<{ session: AdaptiveQuizSession | null; error: string | null }> {
    try {
      const { data: session, error } = await this.supabase
        .from('adaptive_quiz_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return { session: null, error: 'Session not found' };
        }
        console.error('Error fetching adaptive quiz session:', error);
        return { session: null, error: 'Failed to fetch session' };
      }

      return { session, error: null };

    } catch (error) {
      console.error('Unexpected error in getAdaptiveQuizSession:', error);
      return { session: null, error: 'Internal service error' };
    }
  }
}

// Factory function to create a service instance with a Supabase client
export function createSpacedRepetitionService(supabase: SupabaseClient): SpacedRepetitionService {
  return new SpacedRepetitionService(supabase);
}
