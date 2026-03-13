import { createClient } from '@supabase/supabase-js'
const sb = createClient('https://rkfffveonaskewwzghex.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const { data, error } = await sb.schema('case').from('cases').upsert([{ case_no: 'TEST-001', hvdc_code: 'TEST-001', site: 'AGI', flow_code: 3 }])
if (error) { console.log('ERROR:', JSON.stringify(error, null, 2)); process.exit(1) }
else { console.log('OK, data:', JSON.stringify(data)) }
