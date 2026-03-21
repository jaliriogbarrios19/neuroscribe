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
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          minutes_balance: number
          cc_balance: number
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          minutes_balance?: number
          cc_balance?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          minutes_balance?: number
          cc_balance?: number
          created_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          folder_id: string | null
          title: string
          content: string | null
          type: 'transcript' | 'summary' | 'paper'
          tokens_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_id?: string | null
          title: string
          content?: string | null
          type: 'transcript' | 'summary' | 'paper'
          tokens_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string | null
          title?: string
          content?: string | null
          type?: 'transcript' | 'summary' | 'paper'
          tokens_used?: number
          created_at?: string
        }
      }
    }
  }
}
