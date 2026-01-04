const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = process.env.SUPABASE_BUCKET || 'dish-images'

const missing = []
if (!supabaseUrl) missing.push('SUPABASE_URL')
if (!supabaseKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
if (missing.length > 0) {
  throw new Error(`Storage env missing: ${missing.join(', ')}`)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

module.exports = { supabase, bucket }
