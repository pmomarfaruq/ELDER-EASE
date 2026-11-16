export type Language = 'en' | 'ml';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  blood_group: string;
  allergies: string;
  medical_conditions: string;
  address: string;
  language: Language;
  large_text: boolean;
  high_contrast: boolean;
  created_at: string;
}

export interface HealthRecord {
  id: string;
  user_id: string;
  record_type: 'vitals' | 'note';
  systolic: number | null;
  diastolic: number | null;
  blood_sugar: number | null;
  sugar_context: 'fasting' | 'post_meal' | 'random';
  heart_rate: number | null;
  weight_kg: number | null;
  title: string;
  notes: string;
  recorded_at: string;
  created_at: string;
}

export interface MedicineReminder {
  id: string;
  user_id: string;
  medicine_name: string;
  dosage: string;
  schedule_time: string;
  frequency: string;
  instructions: string;
  active: number;
  created_at: string;
}

export interface MedicineLog {
  id: string;
  user_id: string;
  reminder_id: string;
  medicine_name: string;
  dosage: string;
  scheduled_for: string;
  status: 'taken' | 'skipped';
  logged_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  is_primary: number;
  created_at: string;
}

export interface SosAlert {
  id: string;
  user_id: string;
  triggered_at: string;
  latitude: number | null;
  longitude: number | null;
  location_shared: number;
  location_label: string;
  notified_contacts_json: string;
  notes: string;
  status: 'sent' | 'resolved';
  resolved_at: string | null;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  share_health: number;
  share_medicines: number;
  share_appointments: number;
  share_location: number;
  created_at: string;
}

export interface FamilyMessage {
  id: string;
  user_id: string;
  family_member_id: string;
  sender_role: 'senior' | 'family';
  sender_name: string;
  message_text: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_name: string;
  specialty: string;
  hospital_name: string;
  appointment_date: string;
  appointment_time: string;
  notes: string;
  reminder_enabled: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
}
