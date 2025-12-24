/**
 * Supabase Database Types
 *
 * This file should be auto-generated using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > shared/types/database.types.ts
 *
 * For now, we define the expected schema manually.
 * Replace with generated types once Supabase project is created.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wilayas: {
        Row: {
          id: number
          name: string
          name_ar: string
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id: number
          name: string
          name_ar: string
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: number
          name?: string
          name_ar?: string
          latitude?: number | null
          longitude?: number | null
        }
      }
      profiles: {
        Row: {
          id: string
          phone: string | null
          full_name: string | null
          role: 'student' | 'merchant' | 'admin'
          wilaya_id: number | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          phone?: string | null
          full_name?: string | null
          role?: 'student' | 'merchant' | 'admin'
          wilaya_id?: number | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          full_name?: string | null
          role?: 'student' | 'merchant' | 'admin'
          wilaya_id?: number | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          name_ar: string
          icon: string | null
          parent_id: number | null
        }
        Insert: {
          id?: number
          name: string
          name_ar: string
          icon?: string | null
          parent_id?: number | null
        }
        Update: {
          id?: number
          name?: string
          name_ar?: string
          icon?: string | null
          parent_id?: number | null
        }
      }
      products: {
        Row: {
          id: string
          merchant_id: string
          category_id: number | null
          title: string
          title_ar: string | null
          description: string | null
          price: number
          original_price: number | null
          images: string[]
          wilaya_id: number | null
          status: 'draft' | 'active' | 'sold' | 'archived'
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          category_id?: number | null
          title: string
          title_ar?: string | null
          description?: string | null
          price: number
          original_price?: number | null
          images?: string[]
          wilaya_id?: number | null
          status?: 'draft' | 'active' | 'sold' | 'archived'
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          category_id?: number | null
          title?: string
          title_ar?: string | null
          description?: string | null
          price?: number
          original_price?: number | null
          images?: string[]
          wilaya_id?: number | null
          status?: 'draft' | 'active' | 'sold' | 'archived'
          views_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          product_id: string
          status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          payment_method: 'cod' | 'edahabia' | 'cib' | null
          payment_id: string | null
          total_amount: number
          shipping_address: string | null
          shipping_wilaya: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          product_id: string
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          payment_method?: 'cod' | 'edahabia' | 'cib' | null
          payment_id?: string | null
          total_amount: number
          shipping_address?: string | null
          shipping_wilaya?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          product_id?: string
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          payment_method?: 'cod' | 'edahabia' | 'cib' | null
          payment_id?: string | null
          total_amount?: number
          shipping_address?: string | null
          shipping_wilaya?: number | null
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'student' | 'merchant' | 'admin'
      product_status: 'draft' | 'active' | 'sold' | 'archived'
      order_status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
      payment_method: 'cod' | 'edahabia' | 'cib'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
