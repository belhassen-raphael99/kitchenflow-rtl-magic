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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          is_active: boolean | null
          name_internal: string
          name_website: string
          notes: string | null
          price: number | null
          quantity_per_serving: number | null
          recipe_id: string | null
          size_option: string | null
          unit_type: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          name_internal: string
          name_website: string
          notes?: string | null
          price?: number | null
          quantity_per_serving?: number | null
          recipe_id?: string | null
          size_option?: string | null
          unit_type?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          name_internal?: string
          name_website?: string
          notes?: string | null
          price?: number | null
          quantity_per_serving?: number | null
          recipe_id?: string | null
          size_option?: string | null
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      demo_tokens: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string | null
          expires_at: string | null
          id: string
          otp_attempts: number | null
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          otp_attempts?: number | null
          token?: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          otp_attempts?: number | null
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_items: {
        Row: {
          created_at: string | null
          department: string | null
          event_id: string
          id: string
          name: string
          notes: string | null
          quantity: number
          recipe_id: string | null
          servings: number | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          event_id: string
          id?: string
          name: string
          notes?: string | null
          quantity?: number
          recipe_id?: string | null
          servings?: number | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          event_id?: string
          id?: string
          name?: string
          notes?: string | null
          quantity?: number
          recipe_id?: string | null
          servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          date: string
          delivery_address: string | null
          delivery_proof_url: string | null
          delivery_slip_generated: boolean | null
          delivery_slip_url: string | null
          delivery_time: string | null
          event_type: string | null
          guests: number
          id: string
          invoice_amount: number | null
          invoice_status: string | null
          name: string
          notes: string | null
          status: string
          time: string
          updated_at: string | null
        }
        Insert: {
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          date: string
          delivery_address?: string | null
          delivery_proof_url?: string | null
          delivery_slip_generated?: boolean | null
          delivery_slip_url?: string | null
          delivery_time?: string | null
          event_type?: string | null
          guests?: number
          id?: string
          invoice_amount?: number | null
          invoice_status?: string | null
          name: string
          notes?: string | null
          status?: string
          time?: string
          updated_at?: string | null
        }
        Update: {
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          date?: string
          delivery_address?: string | null
          delivery_proof_url?: string | null
          delivery_slip_generated?: boolean | null
          delivery_slip_url?: string | null
          delivery_time?: string | null
          event_type?: string | null
          guests?: number
          id?: string
          invoice_amount?: number | null
          invoice_status?: string | null
          name?: string
          notes?: string | null
          status?: string
          time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          related_id: string | null
          related_table: string | null
          severity: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          severity?: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          severity?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      production_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          quantity: number
          reserve_item_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          quantity: number
          reserve_item_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          quantity?: number
          reserve_item_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_reserve_item_id_fkey"
            columns: ["reserve_item_id"]
            isOneToOne: false
            referencedRelation: "reserve_items"
            referencedColumns: ["id"]
          },
        ]
      }
      production_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number
          department: string
          id: string
          min_quantity: number | null
          notes: string | null
          product_name: string
          storage_type: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          department: string
          id?: string
          min_quantity?: number | null
          notes?: string | null
          product_name: string
          storage_type?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          department?: string
          id?: string
          min_quantity?: number | null
          notes?: string | null
          product_name?: string
          storage_type?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      production_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_quantity: number
          created_at: string | null
          date: string
          department: string
          event_id: string | null
          id: string
          name: string
          notes: string | null
          priority: number
          recipe_id: string | null
          reserve_item_id: string | null
          started_at: string | null
          status: string
          target_quantity: number
          task_type: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_quantity?: number
          created_at?: string | null
          date?: string
          department?: string
          event_id?: string | null
          id?: string
          name: string
          notes?: string | null
          priority?: number
          recipe_id?: string | null
          reserve_item_id?: string | null
          started_at?: string | null
          status?: string
          target_quantity?: number
          task_type?: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_quantity?: number
          created_at?: string | null
          date?: string
          department?: string
          event_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          priority?: number
          recipe_id?: string | null
          reserve_item_id?: string | null
          started_at?: string | null
          status?: string
          target_quantity?: number
          task_type?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_reserve_item_id_fkey"
            columns: ["reserve_item_id"]
            isOneToOne: false
            referencedRelation: "reserve_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          login_methods: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          login_methods?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          login_methods?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_lists: {
        Row: {
          generated_at: string | null
          generated_by: string | null
          id: string
          items: Json
          notes: string | null
          status: string | null
        }
        Insert: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string | null
        }
        Update: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          quantity: number
          recipe_id: string
          unit: string
          warehouse_item_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          quantity?: number
          recipe_id: string
          unit?: string
          warehouse_item_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          quantity?: number
          recipe_id?: string
          unit?: string
          warehouse_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_warehouse_item_id_fkey"
            columns: ["warehouse_item_id"]
            isOneToOne: false
            referencedRelation: "warehouse_items"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          assembly_type: string | null
          category: string
          cook_time: number | null
          cost_per_serving: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          instructions: string[] | null
          max_capacity_grams: number | null
          name: string
          prep_time: number | null
          qty_x2: Json | null
          qty_x3: Json | null
          selling_price: number | null
          servings: number
          updated_at: string | null
        }
        Insert: {
          assembly_type?: string | null
          category?: string
          cook_time?: number | null
          cost_per_serving?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          max_capacity_grams?: number | null
          name: string
          prep_time?: number | null
          qty_x2?: Json | null
          qty_x3?: Json | null
          selling_price?: number | null
          servings?: number
          updated_at?: string | null
        }
        Update: {
          assembly_type?: string | null
          category?: string
          cook_time?: number | null
          cost_per_serving?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          max_capacity_grams?: number | null
          name?: string
          prep_time?: number | null
          qty_x2?: Json | null
          qty_x3?: Json | null
          selling_price?: number | null
          servings?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      reserve_items: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          location: string | null
          min_stock: number
          name: string
          notes: string | null
          production_date: string | null
          production_day_label: string | null
          quantity: number
          recipe_id: string | null
          shelf_life_days: number | null
          storage_type: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          min_stock?: number
          name: string
          notes?: string | null
          production_date?: string | null
          production_day_label?: string | null
          quantity?: number
          recipe_id?: string | null
          shelf_life_days?: number | null
          storage_type?: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          min_stock?: number
          name?: string
          notes?: string | null
          production_date?: string | null
          production_day_label?: string | null
          quantity?: number
          recipe_id?: string | null
          shelf_life_days?: number | null
          storage_type?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reserve_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      security_questions: {
        Row: {
          answer_hash: string
          created_at: string | null
          id: string
          question: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_hash: string
          created_at?: string | null
          id?: string
          question: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_hash?: string
          created_at?: string | null
          id?: string
          question?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_id: string | null
          id: string
          item_id: string
          item_name: string | null
          item_type: string
          movement_type: string
          quantity_after: number | null
          quantity_before: number | null
          quantity_change: number | null
          reason: string | null
          task_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          item_id: string
          item_name?: string | null
          item_type: string
          movement_type: string
          quantity_after?: number | null
          quantity_before?: number | null
          quantity_change?: number | null
          reason?: string | null
          task_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          item_id?: string
          item_name?: string | null
          item_type?: string
          movement_type?: string
          quantity_after?: number | null
          quantity_before?: number | null
          quantity_change?: number | null
          reason?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "production_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name?: string
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
      warehouse_items: {
        Row: {
          category_id: string | null
          code: string | null
          created_at: string
          id: string
          item_notes: string | null
          last_restocked_at: string | null
          min_stock: number
          name: string
          price: number | null
          quantity: number
          status: string
          supplier_id: string | null
          unit: string
          updated_at: string
          waste_percent: number | null
        }
        Insert: {
          category_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          item_notes?: string | null
          last_restocked_at?: string | null
          min_stock?: number
          name: string
          price?: number | null
          quantity?: number
          status?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
          waste_percent?: number | null
        }
        Update: {
          category_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          item_notes?: string | null
          last_restocked_at?: string | null
          min_stock?: number
          name?: string
          price?: number | null
          quantity?: number
          status?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
          waste_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_demo_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          used: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "employee" | "demo"
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
      app_role: ["admin", "employee", "demo"],
    },
  },
} as const
