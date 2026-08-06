export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type ReminderType = 'confirmation' | 'reminder_24h' | 'reminder_1h'
export type ReminderStatus = 'pending' | 'sent' | 'failed'
export type DepositStatus = 'not_required' | 'pending' | 'verified' | 'rejected'
export type Plan = 'trial' | 'starter' | 'pro'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled'

export interface Business {
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
  plan: Plan
  trial_ends_at: string
  subscription_status: SubscriptionStatus
}

export interface Staff {
  id: string
  business_id: string
  name: string
  avatar_url: string | null
  bio: string | null
  is_active: boolean
  created_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  duration_min: number
  price: number | null
  description: string | null
  is_active: boolean
  created_at: string
}

export interface Schedule {
  id: string
  staff_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export interface Appointment {
  id: string
  business_id: string
  staff_id: string | null
  service_id: string | null
  client_name: string
  client_phone: string
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  deposit_status: DepositStatus
  deposit_ref: string | null
  staff?: Staff
  service?: Service
}

export interface Reminder {
  id: string
  appointment_id: string
  type: ReminderType
  scheduled_at: string
  sent_at: string | null
  status: ReminderStatus
  error_message: string | null
  created_at: string
}

export interface BookingFormData {
  service_id: string
  staff_id: string
  date: string
  time: string
  client_name: string
  client_phone: string
  deposit_ref?: string
}
