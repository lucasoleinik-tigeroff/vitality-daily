export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      coach_conversations: {
        Row: {
          coach_response: string
          created_at: string
          id: string
          response_source: string
          tokens_used: number | null
          user_id: string
          user_message: string
        }
        Insert: {
          coach_response: string
          created_at?: string
          id?: string
          response_source?: string
          tokens_used?: number | null
          user_id: string
          user_message: string
        }
        Update: {
          coach_response?: string
          created_at?: string
          id?: string
          response_source?: string
          tokens_used?: number | null
          user_id?: string
          user_message?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["content_status"]
          target_week: number | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          target_week?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          target_week?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_tips: {
        Row: {
          body: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["content_status"]
          target_metric: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          target_metric?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          target_metric?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          activity_minutes: number | null
          activity_type: string | null
          created_at: string
          hydration_oz: number | null
          id: string
          log_date: string
          notes: string | null
          sleep_hours: number | null
          sleep_quality: Database["public"]["Enums"]["sleep_quality"] | null
          stress_level: Database["public"]["Enums"]["stress_level"] | null
          supplement_taken: boolean | null
          supplement_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_minutes?: number | null
          activity_type?: string | null
          created_at?: string
          hydration_oz?: number | null
          id?: string
          log_date: string
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: Database["public"]["Enums"]["sleep_quality"] | null
          stress_level?: Database["public"]["Enums"]["stress_level"] | null
          supplement_taken?: boolean | null
          supplement_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_minutes?: number | null
          activity_type?: string | null
          created_at?: string
          hydration_oz?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: Database["public"]["Enums"]["sleep_quality"] | null
          stress_level?: Database["public"]["Enums"]["stress_level"] | null
          supplement_taken?: boolean | null
          supplement_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ebook_access: {
        Row: {
          accessed_at: string
          ebook_id: string
          id: string
          user_id: string
        }
        Insert: {
          accessed_at?: string
          ebook_id: string
          id?: string
          user_id: string
        }
        Update: {
          accessed_at?: string
          ebook_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_access_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebooks: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          publish_date: string | null
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          publish_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          publish_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          assigned_protocol_id: string | null
          created_at: string
          current_habits: string[] | null
          email: string
          height_feet: number | null
          height_inches: number | null
          id: string
          journey_start_date: string | null
          last_log_date: string | null
          main_concern: string | null
          main_goal: string | null
          name: string | null
          onboarding_completed: boolean
          privacy_accepted_at: string | null
          status: Database["public"]["Enums"]["user_status"]
          streak_count: number
          terms_accepted_at: string | null
          updated_at: string
          waist_inches: number | null
          weight_lbs: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          assigned_protocol_id?: string | null
          created_at?: string
          current_habits?: string[] | null
          email: string
          height_feet?: number | null
          height_inches?: number | null
          id: string
          journey_start_date?: string | null
          last_log_date?: string | null
          main_concern?: string | null
          main_goal?: string | null
          name?: string | null
          onboarding_completed?: boolean
          privacy_accepted_at?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          streak_count?: number
          terms_accepted_at?: string | null
          updated_at?: string
          waist_inches?: number | null
          weight_lbs?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          assigned_protocol_id?: string | null
          created_at?: string
          current_habits?: string[] | null
          email?: string
          height_feet?: number | null
          height_inches?: number | null
          id?: string
          journey_start_date?: string | null
          last_log_date?: string | null
          main_concern?: string | null
          main_goal?: string | null
          name?: string | null
          onboarding_completed?: boolean
          privacy_accepted_at?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          streak_count?: number
          terms_accepted_at?: string | null
          updated_at?: string
          waist_inches?: number | null
          weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_protocol_id_fkey"
            columns: ["assigned_protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_completions: {
        Row: {
          completed_items: number[]
          completion_date: string
          created_at: string
          id: string
          protocol_id: string
          total_items: number
          user_id: string
        }
        Insert: {
          completed_items?: number[]
          completion_date: string
          created_at?: string
          id?: string
          protocol_id: string
          total_items: number
          user_id: string
        }
        Update: {
          completed_items?: number[]
          completion_date?: string
          created_at?: string
          id?: string
          protocol_id?: string
          total_items?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_completions_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocols: {
        Row: {
          created_at: string
          description: string | null
          id: string
          items: string[]
          name: string
          status: Database["public"]["Enums"]["content_status"]
          target_segment: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          items?: string[]
          name: string
          status?: Database["public"]["Enums"]["content_status"]
          target_segment?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          items?: string[]
          name?: string
          status?: Database["public"]["Enums"]["content_status"]
          target_segment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_health_metrics: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"]
          bmi: number
          bmi_category: string
          bmr_kcal: number
          created_at: string
          hr_max: number
          hr_moderate_high: number
          hr_moderate_low: number
          hr_vigorous_high: number
          hr_vigorous_low: number
          hydration_target_oz: number
          id: string
          snapshot_date: string
          tdee_kcal: number
          user_id: string
          waist_inches: number
          waist_risk_category: string
          weight_lbs: number
        }
        Insert: {
          activity_level: Database["public"]["Enums"]["activity_level"]
          bmi: number
          bmi_category: string
          bmr_kcal: number
          created_at?: string
          hr_max: number
          hr_moderate_high: number
          hr_moderate_low: number
          hr_vigorous_high: number
          hr_vigorous_low: number
          hydration_target_oz: number
          id?: string
          snapshot_date?: string
          tdee_kcal: number
          user_id: string
          waist_inches: number
          waist_risk_category: string
          weight_lbs: number
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"]
          bmi?: number
          bmi_category?: string
          bmr_kcal?: number
          created_at?: string
          hr_max?: number
          hr_moderate_high?: number
          hr_moderate_low?: number
          hr_vigorous_high?: number
          hr_vigorous_low?: number
          hydration_target_oz?: number
          id?: string
          snapshot_date?: string
          tdee_kcal?: number
          user_id?: string
          waist_inches?: number
          waist_risk_category?: string
          weight_lbs?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vitality_scores: {
        Row: {
          created_at: string
          id: string
          score: number
          score_date: string
          status: Database["public"]["Enums"]["score_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score: number
          score_date: string
          status?: Database["public"]["Enums"]["score_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number
          score_date?: string
          status?: Database["public"]["Enums"]["score_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active"
      app_role: "admin" | "user"
      content_status: "draft" | "published"
      score_status: "improving" | "stable" | "needs_attention"
      sleep_quality: "poor" | "ok" | "great"
      stress_level: "low" | "medium" | "high"
      user_status: "active" | "suspended" | "deleted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
      ],
      app_role: ["admin", "user"],
      content_status: ["draft", "published"],
      score_status: ["improving", "stable", "needs_attention"],
      sleep_quality: ["poor", "ok", "great"],
      stress_level: ["low", "medium", "high"],
      user_status: ["active", "suspended", "deleted"],
    },
  },
} as const
