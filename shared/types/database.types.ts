Initialising login role...
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          name: string
          name_ar: string
          parent_id: number | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          name_ar: string
          parent_id?: number | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          name_ar?: string
          parent_id?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_rules: {
        Row: {
          coupon_id: string
          created_at: string | null
          id: string
          rule_type: string
          target_ids: Json | null
          target_wilayas: Json | null
        }
        Insert: {
          coupon_id: string
          created_at?: string | null
          id?: string
          rule_type: string
          target_ids?: Json | null
          target_wilayas?: Json | null
        }
        Update: {
          coupon_id?: string
          created_at?: string | null
          id?: string
          rule_type?: string
          target_ids?: Json | null
          target_wilayas?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_rules_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          discount_amount: number
          id: string
          order_id: string | null
          target_id: string | null
          used_at: string | null
          used_on: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          id?: string
          order_id?: string | null
          target_id?: string | null
          used_at?: string | null
          used_on: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          target_id?: string | null
          used_at?: string | null
          used_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string
          code: string | null
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_public: boolean | null
          max_total_uses: number | null
          max_uses_per_user: number | null
          merchant_id: string | null
          min_purchase_amount: number | null
          promoted_until: string | null
          promotion_tier: string | null
          start_date: string | null
          target_audience: string | null
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          applies_to?: string
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          max_total_uses?: number | null
          max_uses_per_user?: number | null
          merchant_id?: string | null
          min_purchase_amount?: number | null
          promoted_until?: string | null
          promotion_tier?: string | null
          start_date?: string | null
          target_audience?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          applies_to?: string
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          max_total_uses?: number | null
          max_uses_per_user?: number | null
          merchant_id?: string | null
          min_purchase_amount?: number | null
          promoted_until?: string | null
          promotion_tier?: string | null
          start_date?: string | null
          target_audience?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          cancelled_at: string | null
          event_id: string
          id: string
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          event_id: string
          id?: string
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          event_id?: string
          id?: string
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category_id: number | null
          cover_image: string | null
          created_at: string | null
          current_attendees: number | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_free: boolean | null
          is_online: boolean | null
          location_address: string | null
          location_name: string
          max_attendees: number | null
          online_url: string | null
          organizer_id: string | null
          price: number | null
          promoted_until: string | null
          promotion_tier: string | null
          registration_url: string | null
          start_date: string
          title: string
          title_ar: string | null
          updated_at: string | null
          wilaya_id: number | null
        }
        Insert: {
          category_id?: number | null
          cover_image?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_online?: boolean | null
          location_address?: string | null
          location_name: string
          max_attendees?: number | null
          online_url?: string | null
          organizer_id?: string | null
          price?: number | null
          promoted_until?: string | null
          promotion_tier?: string | null
          registration_url?: string | null
          start_date: string
          title: string
          title_ar?: string | null
          updated_at?: string | null
          wilaya_id?: number | null
        }
        Update: {
          category_id?: number | null
          cover_image?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_online?: boolean | null
          location_address?: string | null
          location_name?: string
          max_attendees?: number | null
          online_url?: string | null
          organizer_id?: string | null
          price?: number | null
          promoted_until?: string | null
          promotion_tier?: string | null
          registration_url?: string | null
          start_date?: string
          title?: string
          title_ar?: string | null
          updated_at?: string | null
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          buyer_notes: string | null
          cancelled_at: string | null
          coupon_id: string | null
          created_at: string | null
          delivered_at: string | null
          discount_amount: number | null
          id: string
          paid_at: string | null
          payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          product_id: string
          seller_id: string
          seller_notes: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_wilaya: number | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          buyer_notes?: string | null
          cancelled_at?: string | null
          coupon_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          product_id: string
          seller_id: string
          seller_notes?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_wilaya?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          buyer_notes?: string | null
          cancelled_at?: string | null
          coupon_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          product_id?: string
          seller_id?: string
          seller_notes?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_wilaya?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_wilaya_fkey"
            columns: ["shipping_wilaya"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: number | null
          created_at: string | null
          delivery_fee: number | null
          description: string | null
          id: string
          images: string[] | null
          is_promoted: boolean | null
          merchant_id: string
          original_price: number | null
          price: number
          promoted_until: string | null
          promotion_tier: string | null
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number | null
          title: string
          title_ar: string | null
          updated_at: string | null
          views_count: number | null
          wilaya_id: number | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          delivery_fee?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_promoted?: boolean | null
          merchant_id: string
          original_price?: number | null
          price: number
          promoted_until?: string | null
          promotion_tier?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
          views_count?: number | null
          wilaya_id?: number | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          delivery_fee?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_promoted?: boolean | null
          merchant_id?: string
          original_price?: number | null
          price?: number
          promoted_until?: string | null
          promotion_tier?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
          views_count?: number | null
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bac_number: string | null
          commerce_register: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          matricule: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          wilaya_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          bac_number?: string | null
          commerce_register?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          matricule?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          wilaya_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          bac_number?: string | null
          commerce_register?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          matricule?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_packages: {
        Row: {
          created_at: string | null
          description: string | null
          duration_days: number
          id: number
          is_active: boolean | null
          name: string
          name_ar: string
          price: number
          tier: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_days: number
          id?: number
          is_active?: boolean | null
          name: string
          name_ar: string
          price: number
          tier: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: number
          is_active?: boolean | null
          name?: string
          name_ar?: string
          price?: number
          tier?: string
        }
        Relationships: []
      }
      promotion_purchases: {
        Row: {
          amount: number
          coupon_id: string | null
          created_at: string | null
          ends_at: string | null
          event_id: string | null
          id: string
          merchant_id: string
          package_id: number | null
          payment_id: string | null
          payment_status: string | null
          product_id: string | null
          starts_at: string | null
        }
        Insert: {
          amount: number
          coupon_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          event_id?: string | null
          id?: string
          merchant_id: string
          package_id?: number | null
          payment_id?: string | null
          payment_status?: string | null
          product_id?: string | null
          starts_at?: string | null
        }
        Update: {
          amount?: number
          coupon_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          event_id?: string | null
          id?: string
          merchant_id?: string
          package_id?: number | null
          payment_id?: string | null
          payment_status?: string | null
          product_id?: string | null
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_purchases_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_purchases_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "promotion_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_coupons: {
        Row: {
          coupon_id: string
          id: string
          saved_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          saved_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          saved_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      wilayas: {
        Row: {
          created_at: string | null
          id: number
          latitude: number | null
          longitude: number | null
          name: string
          name_ar: string
        }
        Insert: {
          created_at?: string | null
          id: number
          latitude?: number | null
          longitude?: number | null
          name: string
          name_ar: string
        }
        Update: {
          created_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_ar?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_event_registration: { Args: { p_event_id: string }; Returns: Json }
      create_order_atomic: {
        Args: {
          p_buyer_id: string
          p_notes: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_product_id: string
          p_shipping_address: string
          p_shipping_wilaya: number
          p_total_amount: number
        }
        Returns: Json
      }
      expire_promotions: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      increment_coupon_usage: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      increment_product_views: {
        Args: { product_uuid: string }
        Returns: undefined
      }
      register_for_event: { Args: { p_event_id: string }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      order_status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
      payment_method: "cod" | "edahabia" | "cib"
      product_status: "draft" | "active" | "reserved" | "sold" | "archived"
      user_role: "student" | "merchant" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: ["pending", "paid", "shipped", "delivered", "cancelled"],
      payment_method: ["cod", "edahabia", "cib"],
      product_status: ["draft", "active", "reserved", "sold", "archived"],
      user_role: ["student", "merchant", "admin"],
    },
  },
} as const
