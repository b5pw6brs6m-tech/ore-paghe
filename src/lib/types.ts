export type Role = 'admin' | 'worker'

export type Session = {
  userId: string
  email: string
}

export type Profile = {
  id: string
  full_name: string
  role: Role
}

export type Worker = {
  id: string
  admin_id: string
  user_id: string | null
  name: string
  hourly_rate: number
  link_code: string
  active: boolean
  created_at: string
}

export type Entry = {
  id: string
  worker_id: string
  work_date: string        // YYYY-MM-DD
  start_time: string | null // HH:MM
  end_time: string | null   // HH:MM
  break_minutes: number
  hours: number
  hourly_rate: number      // tariffa "congelata" al momento della registrazione
  note: string | null
  created_at: string
}

export type Payment = {
  id: string
  worker_id: string
  paid_on: string          // YYYY-MM-DD
  amount: number
  method: string | null
  note: string | null
  created_at: string
}

export type NewEntry = {
  worker_id: string
  work_date: string
  start_time: string | null
  end_time: string | null
  break_minutes: number
  hours: number
  note: string | null
}

export type NewPayment = {
  worker_id: string
  paid_on: string
  amount: number
  method: string | null
  note: string | null
}

export type Summary = {
  totalHours: number
  totalEarned: number
  totalPaid: number
  balance: number
  days: number
}
