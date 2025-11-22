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
      admin_actions_log: {
        Row: {
          action_type: string
          admin_id: string | null
          affected_id: string | null
          affected_table: string | null
          created_at: string | null
          id: string
          note: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          affected_id?: string | null
          affected_table?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          affected_id?: string | null
          affected_table?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          confirmations: number | null
          created_at: string | null
          crypto_currency: string
          expires_at: string | null
          id: string
          payment_id: string | null
          required_confirmations: number | null
          status: string
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          confirmations?: number | null
          created_at?: string | null
          crypto_currency?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          required_confirmations?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          confirmations?: number | null
          created_at?: string | null
          crypto_currency?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          required_confirmations?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          email_type: string
          id: string
          recipient: string
          sent_at: string | null
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          email_type: string
          id?: string
          recipient: string
          sent_at?: string | null
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          email_type?: string
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          name_snapshot: string
          order_id: string
          price_snapshot: number
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name_snapshot: string
          order_id: string
          price_snapshot: number
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name_snapshot?: string
          order_id?: string
          price_snapshot?: number
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_number: string
          payment_method: string | null
          product_name: string
          status: string
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_number: string
          payment_method?: string | null
          product_name: string
          status: string
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_number?: string
          payment_method?: string | null
          product_name?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          balance_label: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number
          price_label: string | null
        }
        Insert: {
          active?: boolean | null
          balance_label?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price?: number
          price_label?: string | null
        }
        Update: {
          active?: boolean | null
          balance_label?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
          price_label?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          telegram_handle: string | null
          updated_at: string | null
          wallet_address: string | null
          wallet_balance: number | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          telegram_handle?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_balance?: number | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          telegram_handle?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          crypto_currency: string
          id: string
          payment_id: string | null
          payment_method: string | null
          reference_id: string | null
          proof_url: string | null
          sender_info: string | null
          status: string
          tx_hash: string | null
          type: string
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          crypto_currency?: string
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          reference_id?: string | null
          proof_url?: string | null
          sender_info?: string | null
          status?: string
          tx_hash?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          crypto_currency?: string
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          reference_id?: string | null
          proof_url?: string | null
          sender_info?: string | null
          status?: string
          tx_hash?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          id: string
          payment_method: string
          account_info: string
          display_name: string | null
          instructions: string | null
          is_active: boolean | null
          min_amount: number | null
          max_amount: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          payment_method: string
          account_info: string
          display_name?: string | null
          instructions?: string | null
          is_active?: boolean | null
          min_amount?: number | null
          max_amount?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          payment_method?: string
          account_info?: string
          display_name?: string | null
          instructions?: string | null
          is_active?: boolean | null
          min_amount?: number | null
          max_amount?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          nickname: string | null
          updated_at: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          nickname?: string | null
          updated_at?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          nickname?: string | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      wallet_addresses: {
        Row: {
          address: string
          created_at: string | null
          currency: string
          id: string
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          currency: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          currency?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_transaction_status: {
        Args: { p_admin_id: string; p_new_status: string; p_tx_id: string }
        Returns: Json
      }
      create_purchase: {
        Args: {
          p_payment_method?: string
          p_price: number
          p_product_id: string
          p_product_name: string
          p_user_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      link_wallet: {
        Args: {
          p_is_primary?: boolean
          p_nickname?: string
          p_user_id: string
          p_wallet_address: string
        }
        Returns: Json
      }
      set_primary_wallet: {
        Args: { p_user_id: string; p_wallet_id: string }
        Returns: undefined
      }
      get_user_by_wallet: {
        Args: { p_wallet_address: string }
        Returns: { email: string; is_primary: boolean; user_id: string }[]
      }
      update_wallet_balance: {
        Args: { p_amount: number; p_type: string; p_user_id: string }
        Returns: undefined
      }
      submit_fiat_deposit: {
        Args: {
          p_user_id: string
          p_amount: number
          p_payment_method: string
          p_reference_id?: string | null
          p_proof_url?: string | null
          p_sender_info?: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
