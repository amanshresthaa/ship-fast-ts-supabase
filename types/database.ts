export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      adaptive_quiz_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          question_ids: string[]
          quiz_topic: string
          session_id: string
          session_settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          question_ids?: string[]
          quiz_topic: string
          session_id?: string
          session_settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          question_ids?: string[]
          quiz_topic?: string
          session_id?: string
          session_settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drag_and_drop_correct_pairs: {
        Row: {
          option_id: string
          question_id: string
          target_id: string
        }
        Insert: {
          option_id: string
          question_id: string
          target_id: string
        }
        Update: {
          option_id?: string
          question_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drag_and_drop_correct_pairs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drag_and_drop_correct_pairs_question_id_option_id_fkey"
            columns: ["question_id", "option_id"]
            isOneToOne: false
            referencedRelation: "drag_and_drop_options"
            referencedColumns: ["question_id", "option_id"]
          },
          {
            foreignKeyName: "drag_and_drop_correct_pairs_question_id_target_id_fkey"
            columns: ["question_id", "target_id"]
            isOneToOne: false
            referencedRelation: "drag_and_drop_targets"
            referencedColumns: ["question_id", "target_id"]
          },
        ]
      }
      drag_and_drop_options: {
        Row: {
          option_id: string
          question_id: string
          text: string
        }
        Insert: {
          option_id: string
          question_id: string
          text: string
        }
        Update: {
          option_id?: string
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "drag_and_drop_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      drag_and_drop_targets: {
        Row: {
          question_id: string
          target_id: string
          text: string
        }
        Insert: {
          question_id: string
          target_id: string
          text: string
        }
        Update: {
          question_id?: string
          target_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "drag_and_drop_targets_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      dropdown_selection_options: {
        Row: {
          is_correct: boolean
          option_id: string
          question_id: string
          text: string
        }
        Insert: {
          is_correct: boolean
          option_id: string
          question_id: string
          text: string
        }
        Update: {
          is_correct?: boolean
          option_id?: string
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropdown_selection_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      dropdown_selection_targets: {
        Row: {
          key: string
          question_id: string
          value: string
        }
        Insert: {
          key: string
          question_id: string
          value: string
        }
        Update: {
          key?: string
          question_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropdown_selection_targets_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_correct_answers: {
        Row: {
          option_id: string
          question_id: string
        }
        Insert: {
          option_id: string
          question_id: string
        }
        Update: {
          option_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_correct_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_correct_answers_question_id_option_id_fkey"
            columns: ["question_id", "option_id"]
            isOneToOne: true
            referencedRelation: "multi_options"
            referencedColumns: ["question_id", "option_id"]
          },
        ]
      }
      multi_options: {
        Row: {
          option_id: string
          question_id: string
          text: string
        }
        Insert: {
          option_id: string
          question_id: string
          text: string
        }
        Update: {
          option_id?: string
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_correct_order: {
        Row: {
          item_id: string
          position: number
          question_id: string
        }
        Insert: {
          item_id: string
          position: number
          question_id: string
        }
        Update: {
          item_id?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_correct_order_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_correct_order_question_id_item_id_fkey"
            columns: ["question_id", "item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["question_id", "item_id"]
          },
        ]
      }
      order_items: {
        Row: {
          item_id: string
          question_id: string
          text: string
        }
        Insert: {
          item_id: string
          question_id: string
          text: string
        }
        Update: {
          item_id?: string
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_responses: {
        Row: {
          confidence_level: number | null
          id: string
          is_correct: boolean
          question_id: string
          quiz_session_id: string | null
          response_time_ms: number
          submitted_at: string
          updated_at: string
          user_answer_data: Json
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          id?: string
          is_correct: boolean
          question_id: string
          quiz_session_id?: string | null
          response_time_ms: number
          submitted_at?: string
          updated_at?: string
          user_answer_data: Json
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          id?: string
          is_correct?: boolean
          question_id?: string
          quiz_session_id?: string | null
          response_time_ms?: number
          submitted_at?: string
          updated_at?: string
          user_answer_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          explanation: string | null
          feedback_correct: string
          feedback_incorrect: string
          id: string
          points: number
          question: string
          quiz_tag: string
          quiz_topic: string | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          explanation?: string | null
          feedback_correct: string
          feedback_incorrect: string
          id?: string
          points: number
          question: string
          quiz_tag: string
          quiz_topic?: string | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          explanation?: string | null
          feedback_correct?: string
          feedback_incorrect?: string
          id?: string
          points?: number
          question?: string
          quiz_tag?: string
          quiz_topic?: string | null
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_questions_quiz"
            columns: ["quiz_tag"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          author: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          quiz_topic: string | null
          quiz_type: string | null
          settings: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id: string
          quiz_topic?: string | null
          quiz_type?: string | null
          settings?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          quiz_topic?: string | null
          quiz_type?: string | null
          settings?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      single_selection_correct_answer: {
        Row: {
          option_id: string
          question_id: string
        }
        Insert: {
          option_id: string
          question_id: string
        }
        Update: {
          option_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "single_selection_correct_answer_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "single_selection_correct_answer_question_id_option_id_fkey"
            columns: ["question_id", "option_id"]
            isOneToOne: false
            referencedRelation: "single_selection_options"
            referencedColumns: ["question_id", "option_id"]
          },
        ]
      }
      single_selection_options: {
        Row: {
          option_id: string
          question_id: string
          text: string
        }
        Insert: {
          option_id: string
          question_id: string
          text: string
        }
        Update: {
          option_id?: string
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "single_selection_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_question_performance: {
        Row: {
          avg_response_time_ms: number | null
          correct_attempts: number
          correct_streak: number
          created_at: string
          ease_factor: number
          id: string
          incorrect_streak: number
          interval_days: number
          last_reviewed_at: string | null
          next_review_date: string
          priority_score: number
          question_id: string
          repetitions: number
          total_attempts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_response_time_ms?: number | null
          correct_attempts?: number
          correct_streak?: number
          created_at?: string
          ease_factor?: number
          id?: string
          incorrect_streak?: number
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_date?: string
          priority_score?: number
          question_id: string
          repetitions?: number
          total_attempts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_response_time_ms?: number | null
          correct_attempts?: number
          correct_streak?: number
          created_at?: string
          ease_factor?: number
          id?: string
          incorrect_streak?: number
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_date?: string
          priority_score?: number
          question_id?: string
          repetitions?: number
          total_attempts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_performance_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_progress: {
        Row: {
          created_at: string
          current_question_index: number
          id: string
          is_explicitly_completed: boolean
          last_saved_at: string
          question_type_filter: string | null
          quiz_id: string
          user_answers: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          current_question_index?: number
          id?: string
          is_explicitly_completed?: boolean
          last_saved_at?: string
          question_type_filter?: string | null
          quiz_id: string
          user_answers?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          current_question_index?: number
          id?: string
          is_explicitly_completed?: boolean
          last_saved_at?: string
          question_type_filter?: string | null
          quiz_id?: string
          user_answers?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_progress_quiz"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      yes_no_answer: {
        Row: {
          correct_answer: boolean
          question_id: string
        }
        Insert: {
          correct_answer: boolean
          question_id: string
        }
        Update: {
          correct_answer?: boolean
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yes_no_answer_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      yesno_multi_correct_answers: {
        Row: {
          correct_answer: boolean
          question_id: string
          statement_id: string
        }
        Insert: {
          correct_answer: boolean
          question_id: string
          statement_id: string
        }
        Update: {
          correct_answer?: boolean
          question_id?: string
          statement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yesno_multi_correct_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yesno_multi_correct_answers_question_id_statement_id_fkey"
            columns: ["question_id", "statement_id"]
            isOneToOne: true
            referencedRelation: "yesno_multi_statements"
            referencedColumns: ["question_id", "statement_id"]
          },
        ]
      }
      yesno_multi_statements: {
        Row: {
          question_id: string
          statement_id: string
          text: string
        }
        Insert: {
          question_id: string
          statement_id: string
          text: string
        }
        Update: {
          question_id?: string
          statement_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "yesno_multi_statements_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty: "easy" | "medium" | "hard"
      question_type:
        | "drag_and_drop"
        | "dropdown_selection"
        | "multi"
        | "single_selection"
        | "order"
        | "yes_no"
        | "yesno_multi"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      difficulty: ["easy", "medium", "hard"],
      question_type: [
        "drag_and_drop",
        "dropdown_selection",
        "multi",
        "single_selection",
        "order",
        "yes_no",
        "yesno_multi",
      ],
    },
  },
} as const
