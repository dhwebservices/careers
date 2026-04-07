export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  portalBaseUrl: import.meta.env.VITE_PORTAL_BASE_URL || 'http://localhost:5173',
  workerUrl: import.meta.env.VITE_WORKER_URL || 'https://dh-email-worker.aged-silence-66a7.workers.dev',
}

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)
