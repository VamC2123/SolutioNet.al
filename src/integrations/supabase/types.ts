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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      comment_votes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          vote_type: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          vote_type: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          vote_type?: string
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "comment_votes_comment_id_fkey", columns: ["comment_id"], referencedRelation: "comments", referencedColumns: ["id"] },
          { foreignKeyName: "comment_votes_user_id_fkey", columns: ["user_id"], referencedRelation: "profiles", referencedColumns: ["id"] },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          problem_id: string
          updated_at: string
          user_id: string
          parent_id: string | null
          upvotes: number
          downvotes: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          problem_id: string
          updated_at?: string
          user_id: string
          parent_id?: string | null
          upvotes?: number
          downvotes?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          problem_id?: string
          updated_at?: string
          user_id?: string
          parent_id?: string | null
          upvotes?: number
          downvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          id: string
          problem_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          problem_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          problem_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          abstract: string
          author_id: string
          created_at: string
          description: string
          domain: string
          downvotes: number | null
          external_links: Json | null
          id: string
          pid: string
          proposed_solution: string
          social_links: Json | null
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number | null
        }
        Insert: {
          abstract: string
          author_id: string
          created_at?: string
          description: string
          domain: string
          downvotes?: number | null
          external_links?: Json | null
          id?: string
          pid: string
          proposed_solution: string
          social_links?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number | null
        }
        Update: {
          abstract?: string
          author_id?: string
          created_at?: string
          description?: string
          domain?: string
          downvotes?: number | null
          external_links?: Json | null
          id?: string
          pid?: string
          proposed_solution?: string
          social_links?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "problems_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string
          github_url: string | null
          id: string
          linkedin_url: string | null
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saves: {
        Row: {
          created_at: string
          id: string
          problem_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          problem_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          problem_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          abstract: string
          author_id: string
          created_at: string
          detailed_solution_url: string
          domain: string
          id: string
          problem_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          abstract: string
          author_id: string
          created_at?: string
          detailed_solution_url: string
          domain: string
          id?: string
          problem_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          abstract?: string
          author_id?: string
          created_at?: string
          detailed_solution_url?: string
          domain?: string
          id?: string
          problem_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solutions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          problem_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          problem_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          problem_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
