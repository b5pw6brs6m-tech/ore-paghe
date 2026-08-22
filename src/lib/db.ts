import type { Api } from './api'
import { localApi } from './localApi'
import { cloudConfigurato, supabaseApi } from './supabaseApi'

/**
 * Se le variabili VITE_SUPABASE_* sono presenti l'app parla col cloud,
 * altrimenti gira in modalità dimostrativa sul dispositivo.
 */
export const db: Api = cloudConfigurato ? supabaseApi : localApi
export const isDemo = !cloudConfigurato
