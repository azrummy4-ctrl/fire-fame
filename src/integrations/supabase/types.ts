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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          id: string
          provider: string
          provider_ref: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          bonus_points: number
          ff_uid: string
          id: string
          ign: string
          joined_at: string
          kills: number
          paid_amount: number
          placement: number | null
          placement_points: number
          prize_amount: number
          slot_number: number | null
          total_points: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          bonus_points?: number
          ff_uid: string
          id?: string
          ign: string
          joined_at?: string
          kills?: number
          paid_amount?: number
          placement?: number | null
          placement_points?: number
          prize_amount?: number
          slot_number?: number | null
          total_points?: number
          tournament_id: string
          user_id: string
        }
        Update: {
          bonus_points?: number
          ff_uid?: string
          id?: string
          ign?: string
          joined_at?: string
          kills?: number
          paid_amount?: number
          placement?: number | null
          placement_points?: number
          prize_amount?: number
          slot_number?: number | null
          total_points?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          ff_uid: string | null
          id: string
          ign: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ff_uid?: string | null
          id: string
          ign?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ff_uid?: string | null
          id?: string
          ign?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
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
      tournaments: {
        Row: {
          banner_url: string | null
          category: string
          created_at: string
          created_by: string | null
          entry_fee: number
          id: string
          map: string
          max_players: number
          mode: string
          name: string
          per_kill: number
          prize_pool: number
          prize_split: Json
          results_published: boolean
          room_id: string | null
          room_password: string | null
          room_published: boolean
          rules: string[]
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          entry_fee?: number
          id?: string
          map?: string
          max_players?: number
          mode?: string
          name: string
          per_kill?: number
          prize_pool?: number
          prize_split?: Json
          results_published?: boolean
          room_id?: string | null
          room_password?: string | null
          room_published?: boolean
          rules?: string[]
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          entry_fee?: number
          id?: string
          map?: string
          max_players?: number
          mode?: string
          name?: string
          per_kill?: number
          prize_pool?: number
          prize_split?: Json
          results_published?: boolean
          room_id?: string | null
          room_password?: string | null
          room_published?: boolean
          rules?: string[]
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          note: string | null
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          type?: string
          user_id?: string
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
      wallets: {
        Row: {
          balance: number
          locked: number
          updated_at: string
          user_id: string
          winnings: number
        }
        Insert: {
          balance?: number
          locked?: number
          updated_at?: string
          user_id: string
          winnings?: number
        }
        Update: {
          balance?: number
          locked?: number
          updated_at?: string
          user_id?: string
          winnings?: number
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: string
          status: string
          updated_at: string
          upi_id: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          method?: string
          status?: string
          updated_at?: string
          upi_id: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          method?: string
          status?: string
          updated_at?: string
          upi_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_publish_results: {
        Args: { _tournament_id: string }
        Returns: undefined
      }
      admin_publish_room: {
        Args: {
          _room_id: string
          _room_password: string
          _tournament_id: string
        }
        Returns: {
          banner_url: string | null
          category: string
          created_at: string
          created_by: string | null
          entry_fee: number
          id: string
          map: string
          max_players: number
          mode: string
          name: string
          per_kill: number
          prize_pool: number
          prize_split: Json
          results_published: boolean
          room_id: string | null
          room_password: string | null
          room_published: boolean
          rules: string[]
          starts_at: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tournaments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_host: {
        Args: { _enable: boolean; _user_id: string }
        Returns: undefined
      }
      admin_settle_deposit: {
        Args: { _decision: string; _id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          provider: string
          provider_ref: string | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "deposits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_settle_withdrawal: {
        Args: { _decision: string; _id: string; _note?: string }
        Returns: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: string
          status: string
          updated_at: string
          upi_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_manage_tournament: { Args: { _tid: string }; Returns: boolean }
      create_deposit: {
        Args: { _amount: number; _provider_ref: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          provider: string
          provider_ref: string | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "deposits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_room_details: {
        Args: { _tournament_id: string }
        Returns: {
          room_id: string
          room_password: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_tournament:
        | {
            Args: { _tournament_id: string }
            Returns: {
              bonus_points: number
              ff_uid: string
              id: string
              ign: string
              joined_at: string
              kills: number
              paid_amount: number
              placement: number | null
              placement_points: number
              prize_amount: number
              slot_number: number | null
              total_points: number
              tournament_id: string
              user_id: string
            }
            SetofOptions: {
              from: "*"
              to: "participants"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { _slot?: number; _tournament_id: string }
            Returns: {
              bonus_points: number
              ff_uid: string
              id: string
              ign: string
              joined_at: string
              kills: number
              paid_amount: number
              placement: number | null
              placement_points: number
              prize_amount: number
              slot_number: number | null
              total_points: number
              tournament_id: string
              user_id: string
            }
            SetofOptions: {
              from: "*"
              to: "participants"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      request_redeem: {
        Args: { _amount: number; _method: string; _upi?: string }
        Returns: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: string
          status: string
          updated_at: string
          upi_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_withdrawal: {
        Args: { _amount: number; _upi: string }
        Returns: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: string
          status: string
          updated_at: string
          upi_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      wallet_apply: {
        Args: {
          _amount: number
          _note: string
          _ref: string
          _type: string
          _user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user" | "host"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user", "host"],
    },
  },
} as const
