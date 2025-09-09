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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      rescue_orgs: {
        Row: {
          created_at: string
          district: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          source_url: string | null
          species_supported: string[] | null
          state: string | null
          type: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          source_url?: string | null
          species_supported?: string[] | null
          state?: string | null
          type?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          source_url?: string | null
          species_supported?: string[] | null
          state?: string | null
          type?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      safety_guidelines: {
        Row: {
          authority_notes: string | null
          authority_to_contact: string | null
          created_at: string
          donts: string[] | null
          dos: string[] | null
          first_aid: string | null
          id: string
          situation: string
          source_url: string | null
          species_common_name: string | null
          updated_at: string
        }
        Insert: {
          authority_notes?: string | null
          authority_to_contact?: string | null
          created_at?: string
          donts?: string[] | null
          dos?: string[] | null
          first_aid?: string | null
          id?: string
          situation: string
          source_url?: string | null
          species_common_name?: string | null
          updated_at?: string
        }
        Update: {
          authority_notes?: string | null
          authority_to_contact?: string | null
          created_at?: string
          donts?: string[] | null
          dos?: string[] | null
          first_aid?: string | null
          id?: string
          situation?: string
          source_url?: string | null
          species_common_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      species: {
        Row: {
          behaviour: string | null
          category: string | null
          common_name: string
          created_at: string
          description: string | null
          dos_donts: string | null
          id: string
          image_ref: string | null
          image_url: string | null
          keywords: string[] | null
          risk_level: string | null
          scientific_name: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          behaviour?: string | null
          category?: string | null
          common_name: string
          created_at?: string
          description?: string | null
          dos_donts?: string | null
          id?: string
          image_ref?: string | null
          image_url?: string | null
          keywords?: string[] | null
          risk_level?: string | null
          scientific_name?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          behaviour?: string | null
          category?: string | null
          common_name?: string
          created_at?: string
          description?: string | null
          dos_donts?: string | null
          id?: string
          image_ref?: string | null
          image_url?: string | null
          keywords?: string[] | null
          risk_level?: string | null
          scientific_name?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          ngo_name: string | null
          ngo_phone: string | null
          notes: string | null
          occurred_at: string
          species: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          ngo_name?: string | null
          ngo_phone?: string | null
          notes?: string | null
          occurred_at?: string
          species?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          ngo_name?: string | null
          ngo_phone?: string | null
          notes?: string | null
          occurred_at?: string
          species?: string | null
          user_id?: string
        }
        Relationships: []
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
