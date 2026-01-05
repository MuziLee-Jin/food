import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const bucket = process.env.SUPABASE_BUCKET || 'dish-images'

const missing = []
if (!supabaseUrl) missing.push('SUPABASE_URL')
if (!supabaseKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
if (missing.length > 0) {
  console.warn(`Storage env missing: ${missing.join(', ')}`)
}

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null
