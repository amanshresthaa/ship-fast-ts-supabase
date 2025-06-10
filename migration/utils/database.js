/**
 * Database Utilities
 * Common database operations for migrations
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class DatabaseUtils {
  constructor() {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
    }
    
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('quizzes')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      return { success: false, message: `Database connection failed: ${error.message}` };
    }
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName) {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get table record count
   */
  async getTableCount(tableName) {
    try {
      const { count, error } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.warn(`Could not get count for table ${tableName}:`, error.message);
      return 0;
    }
  }

  /**
   * Check if quiz exists by ID
   */
  async quizExists(quizId) {
    try {
      const { data, error } = await this.supabase
        .from('quizzes')
        .select('id')
        .eq('id', quizId)
        .single();
      
      return !error && data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete all data for a specific quiz
   */
  async deleteQuizData(quizId) {
    try {
      // Delete in reverse dependency order
      const tables = [
        'drag_and_drop_correct_pairs',
        'drag_and_drop_options',
        'drag_and_drop_targets',
        'dropdown_selection_options',
        'dropdown_selection_targets',
        'multi_correct_answers',
        'multi_options',
        'single_selection_correct_answer',
        'single_selection_options',
        'order_correct_order',
        'order_items',
        'yes_no_answer',
        'yesno_multi_correct_answers',
        'yesno_multi_statements',
        'questions',
        'quizzes'
      ];

      for (const table of tables) {
        await this.supabase
          .from(table)
          .delete()
          .eq('quiz_id', quizId);
      }

      return { success: true, message: `Quiz ${quizId} data deleted successfully` };
    } catch (error) {
      return { success: false, message: `Failed to delete quiz data: ${error.message}` };
    }
  }

  /**
   * Batch insert with error handling
   */
  async batchInsert(tableName, data, batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const { data: insertedData, error } = await this.supabase
          .from(tableName)
          .insert(batch)
          .select();
        
        if (error) throw error;
        results.push(...(insertedData || []));
      } catch (error) {
        console.error(`Batch insert failed for ${tableName}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}

module.exports = DatabaseUtils;
