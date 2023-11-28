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
      recipes: {
        Row: {
          active_time: string
          cook_time: string
          created_at: string
          description: string
          ingredients: string[]
          instructions: string[]
          name: string
          session_id: string
          slug: string
          tags: string[]
          total_time: string
          user_id: string
          yield: string
        }
        Insert: {
          active_time: string
          cook_time: string
          created_at?: string
          description: string
          ingredients: string[]
          instructions: string[]
          name: string
          session_id: string
          slug: string
          tags: string[]
          total_time: string
          user_id: string
          yield: string
        }
        Update: {
          active_time?: string
          cook_time?: string
          created_at?: string
          description?: string
          ingredients?: string[]
          instructions?: string[]
          name?: string
          session_id?: string
          slug?: string
          tags?: string[]
          total_time?: string
          user_id?: string
          yield?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
