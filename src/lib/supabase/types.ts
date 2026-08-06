// Tipos de la base de datos, escritos a mano contra supabase/migrations/*.sql.
//
// Idealmente esto se genera con:
//   npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/supabase/types.ts
// pero ese comando necesita un proyecto Supabase ya creado y logueado (`supabase login`
// / `supabase link`), y este repo todavia no tiene uno vinculado (no hay .env con
// NEXT_PUBLIC_SUPABASE_URL). Una vez que exista el proyecto, correr ese comando
// reemplaza este archivo por la version generada y automaticamente actualizada.
//
// Mientras tanto, este archivo reemplaza el `export type Database = unknown`
// original y documenta el esquema real. NO esta parametrizado en los tres
// clientes de src/lib/supabase/*.ts todavia: se probo (`createServerClient<Database>`)
// y rompio la build entera con errores "Property 'x' does not exist on type 'never'"
// en decenas de archivos — supabase-js exige que cada tabla incluya tambien
// `Relationships` (y el schema `Views`/`Functions`/`Enums`) para poder resolver
// selects con joins embebidos (`staff(*)`, `service:services(*)`), y esas partes
// son dificiles de escribir a mano de forma correcta sin un proyecto real contra
// el cual validarlas. Hasta que exista un proyecto Supabase vinculado y se corra
// `supabase gen types` de verdad, los tres clientes se quedan sin generic y cada
// resultado de query se sigue casteando a mano con `as Appointment[]` etc.
// Mantener este archivo sincronizado con las migraciones al agregar columnas.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          logo_url: string | null
          phone: string | null
          address: string | null
          timezone: string
          is_active: boolean
          created_at: string
          updated_at: string
          deposit_enabled: boolean
          deposit_amount: number | null
          yape_phone: string | null
          yape_qr_url: string | null
          plan: 'trial' | 'starter' | 'pro'
          trial_ends_at: string
          subscription_status: 'active' | 'past_due' | 'cancelled'
        }
        Insert: Partial<Database['public']['Tables']['businesses']['Row']> & {
          owner_id: string
          name: string
          slug: string
        }
        Update: Partial<Database['public']['Tables']['businesses']['Row']>
      }
      staff: {
        Row: {
          id: string
          business_id: string
          name: string
          avatar_url: string | null
          bio: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['staff']['Row']> & {
          business_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['staff']['Row']>
      }
      services: {
        Row: {
          id: string
          business_id: string
          name: string
          duration_min: number
          price: number | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['services']['Row']> & {
          business_id: string
          name: string
          duration_min: number
        }
        Update: Partial<Database['public']['Tables']['services']['Row']>
      }
      staff_services: {
        Row: { staff_id: string; service_id: string }
        Insert: { staff_id: string; service_id: string }
        Update: Partial<{ staff_id: string; service_id: string }>
      }
      schedules: {
        Row: {
          id: string
          staff_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
        }
        Insert: Partial<Database['public']['Tables']['schedules']['Row']> & {
          staff_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Update: Partial<Database['public']['Tables']['schedules']['Row']>
      }
      appointments: {
        Row: {
          id: string
          business_id: string
          staff_id: string | null
          service_id: string | null
          client_name: string
          client_phone: string
          starts_at: string
          ends_at: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          created_at: string
          deposit_status: 'not_required' | 'pending' | 'verified' | 'rejected'
          deposit_ref: string | null
        }
        Insert: Partial<Database['public']['Tables']['appointments']['Row']> & {
          business_id: string
          client_name: string
          client_phone: string
          starts_at: string
          ends_at: string
        }
        Update: Partial<Database['public']['Tables']['appointments']['Row']>
      }
      reminders: {
        Row: {
          id: string
          appointment_id: string
          type: 'confirmation' | 'reminder_24h' | 'reminder_1h'
          scheduled_at: string
          sent_at: string | null
          status: 'pending' | 'sent' | 'failed'
          error_message: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['reminders']['Row']> & {
          appointment_id: string
          type: 'confirmation' | 'reminder_24h' | 'reminder_1h'
          scheduled_at: string
        }
        Update: Partial<Database['public']['Tables']['reminders']['Row']>
      }
    }
  }
}
