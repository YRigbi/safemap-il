export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; name: string | null; email: string | null; avatar_url: string | null; created_at: string }
        Insert: { id: string; name?: string | null; email?: string | null; avatar_url?: string | null }
        Update: { name?: string | null; email?: string | null; avatar_url?: string | null }
      }
      cities: {
        Row: { id: number; name: string; zone: string; lat: number; lng: number; migun_time: number; created_at: string }
        Insert: never
        Update: never
      }
      user_locations: {
        Row: { id: string; user_id: string; city_name: string; lat: number | null; lng: number | null; status: string; recorded_at: string }
        Insert: { user_id: string; city_name: string; lat?: number | null; lng?: number | null; status?: string }
        Update: { city_name?: string; lat?: number | null; lng?: number | null; status?: string }
      }
      shelter_sessions: {
        Row: { id: string; user_id: string; city_name: string; entered_at: string; exited_at: string | null; duration_mins: number | null }
        Insert: { user_id: string; city_name: string; entered_at?: string; exited_at?: string | null }
        Update: { exited_at?: string | null }
      }
      groups: {
        Row: { id: string; name: string; icon: string | null; owner_id: string; invite_token: string | null; created_at: string }
        Insert: { name: string; icon?: string | null; owner_id: string }
        Update: { name?: string; icon?: string | null }
      }
      group_members: {
        Row: { group_id: string; user_id: string; joined_at: string }
        Insert: { group_id: string; user_id: string }
        Update: never
      }
      oref_alerts: {
        Row: { id: number; alert_id: string | null; cities: string[]; title: string | null; description: string | null; category: number | null; triggered_at: string }
        Insert: { alert_id?: string | null; cities: string[]; title?: string | null; description?: string | null; category?: number | null }
        Update: never
      }
    }
  }
}

// ── App types ──────────────────────────────────
export type UserStatus = 'safe' | 'shelter' | 'moving' | 'help'

export interface City {
  id: number
  name: string
  zone: string
  lat: number
  lng: number
  migun_time: number
}

export interface Friend {
  id: string
  name: string
  email: string
  avatar_url: string | null
  city_name: string
  status: UserStatus
  recorded_at: string
  lat: number | null
  lng: number | null
}

export interface Group {
  id: string
  name: string
  icon: string
  owner_id: string
  invite_token: string
  members: Friend[]
}

export interface ShelterSession {
  id: string
  city_name: string
  entered_at: string
  exited_at: string | null
  duration_mins: number | null
}

export interface LocationHistory {
  id: string
  city_name: string
  status: UserStatus
  recorded_at: string
}
