export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      body_parts: {
        Row: {
          id: string;
          key: string;
          name_ko: string;
          color_hex: string;
          display_order: number;
        };
        Insert: {
          id?: string;
          key: string;
          name_ko: string;
          color_hex: string;
          display_order: number;
        };
        Update: {
          id?: string;
          key?: string;
          name_ko?: string;
          color_hex?: string;
          display_order?: number;
        };
      };
      exercise_definitions: {
        Row: {
          id: string;
          owner_user_id: string | null;
          name: string;
          primary_body_part_id: string;
          exercise_type: string;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id?: string | null;
          name: string;
          primary_body_part_id: string;
          exercise_type: string;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string | null;
          name?: string;
          primary_body_part_id?: string;
          exercise_type?: string;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_definitions: {
        Row: {
          id: string;
          owner_user_id: string | null;
          name: string;
          is_system: boolean;
          is_shared: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id?: string | null;
          name: string;
          is_system?: boolean;
          is_shared?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string | null;
          name?: string;
          is_system?: boolean;
          is_shared?: boolean | null;
          created_at?: string;
        };
      };
      machine_definitions: {
        Row: {
          id: string;
          owner_user_id: string | null;
          brand_id: string | null;
          brand_name_fallback: string | null;
          name: string;
          primary_body_part_id: string | null;
          is_system: boolean;
          is_shared: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id?: string | null;
          brand_id?: string | null;
          brand_name_fallback?: string | null;
          name: string;
          primary_body_part_id?: string | null;
          is_system?: boolean;
          is_shared?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string | null;
          brand_id?: string | null;
          brand_name_fallback?: string | null;
          name?: string;
          primary_body_part_id?: string | null;
          is_system?: boolean;
          is_shared?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      machine_setting_templates: {
        Row: {
          id: string;
          machine_id: string;
          field_key: string;
          field_label: string;
          field_type: string;
          options_json: Json | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          machine_id: string;
          field_key: string;
          field_label: string;
          field_type: string;
          options_json?: Json | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          machine_id?: string;
          field_key?: string;
          field_label?: string;
          field_type?: string;
          options_json?: Json | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_date: string;
          title: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_date: string;
          title?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_date?: string;
          title?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_session_body_parts: {
        Row: {
          id: string;
          session_id: string;
          body_part_id: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          body_part_id: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          body_part_id?: string;
        };
      };
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_definition_id: string;
          machine_id: string | null;
          order_index: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_definition_id: string;
          machine_id?: string | null;
          order_index: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_definition_id?: string;
          machine_id?: string | null;
          order_index?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      session_exercise_setting_values: {
        Row: {
          id: string;
          session_exercise_id: string;
          template_id: string;
          value_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_exercise_id: string;
          template_id: string;
          value_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_exercise_id?: string;
          template_id?: string;
          value_text?: string;
          created_at?: string;
        };
      };
      session_exercise_sets: {
        Row: {
          id: string;
          session_exercise_id: string;
          set_number: number;
          weight_value: number | null;
          reps: number | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_exercise_id: string;
          set_number: number;
          weight_value?: number | null;
          reps?: number | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_exercise_id?: string;
          set_number?: number;
          weight_value?: number | null;
          reps?: number | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
