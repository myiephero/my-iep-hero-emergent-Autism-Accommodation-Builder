import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const authHelpers = {
  // Sign up new user
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  // Sign in user
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  },

  // Listen for auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// User profile helpers
export const userHelpers = {
  // Create user profile
  createProfile: async (userId, profileData) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
    return { data, error }
  },

  // Get user profile
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
    return { data, error }
  },

  // Get advocates for parent assignment
  getAvailableAdvocates: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'advocate')
      .eq('is_active', true)
      .order('rating', { ascending: false })
    return { data, error }
  }
}

// Server-side Supabase client for API routes
export const createServerSupabaseClient = (req, res) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Auth middleware for API routes
export const withAuth = async (req) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization token provided' }
  }

  const token = authHeader.split(' ')[1]
  const supabaseServer = createServerSupabaseClient()
  
  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  
  if (error || !user) {
    return { user: null, error: 'Invalid token' }
  }

  // Get user profile
  const { data: profile, error: profileError } = await userHelpers.getProfile(user.id)
  
  if (profileError || !profile) {
    return { user, profile: null, error: 'Profile not found' }
  }

  return { user, profile, error: null }
}