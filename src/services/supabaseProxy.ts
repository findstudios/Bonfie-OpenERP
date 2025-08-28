import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Development proxy configuration to bypass CORS
const isDevelopment = import.meta.env.DEV
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables')
}

// Create a proxy client that handles CORS in development
export const createSupabaseClient = () => {
  const supabaseKey = supabaseServiceKey || supabaseAnonKey

  // In development, we'll use a different approach
  if (isDevelopment) {
    // Create client with custom fetch that adds CORS headers
    return createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'tutoring-center-frontend'
        },
        fetch: async (url: string, options: RequestInit = {}) => {
          // For development, we'll make the request directly
          try {
            const response = await fetch(url, {
              ...options,
              mode: 'cors',
              credentials: 'same-origin'
            })
            return response
          } catch (error) {
            console.error('Fetch error:', error)
            throw error
          }
        }
      }
    })
  }

  // Production client
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'tutoring-center-frontend'
      }
    }
  })
}

export const supabaseProxy = createSupabaseClient()
