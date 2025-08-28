import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gsbxbubimqajwbxhnfqy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYnhidWJpbXFhandieGhuZnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NjUzMDAsImV4cCI6MjA2ODQ0MTMwMH0.Cqszp5gz97GiPiHGcH0BydUe3Zn1hrzhmnm3aiwW114'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})