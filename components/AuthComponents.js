'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Shield, Crown, Settings, Mail } from 'lucide-react'
import { toast } from 'sonner'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'
)

// Auth Context
const AuthContext = createContext({})

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading profile:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  }

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  const value = {
    user,
    profile,
    loading,
    session,
    signIn,
    signUp,
    signOut,
    updateProfile,
    supabase
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Auth Hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth Guard Component
export const AuthGuard = ({ children }) => {
  const { user, profile, loading } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onShowSignUp={() => setShowLogin(!showLogin)} showSignUp={showLogin} />
  }

  if (!profile) {
    return <ProfileSetup />
  }

  return children
}

// Login Form Component
const LoginForm = ({ onShowSignUp, showSignUp }) => {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('parent')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    try {
      if (showSignUp) {
        if (!firstName || !lastName) {
          toast.error('Please fill in all fields')
          return
        }
        
        await signUp(email, password, {
          firstName,
          lastName,
          role
        })
        toast.success('Account created! Please check your email to verify.')
      } else {
        await signIn(email, password)
        toast.success('Signed in successfully!')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">{showSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
          <CardDescription>
            {showSignUp 
              ? 'Join My IEP Hero to create personalized accommodations' 
              : 'Welcome back to My IEP Hero'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {showSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Parent/Guardian</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="advocate">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>IEP Advocate</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {showSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                showSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onShowSignUp}
              >
                {showSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Profile Setup Component
const ProfileSetup = () => {
  const { user, updateProfile } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('parent')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Pre-fill from user metadata if available
    if (user?.user_metadata) {
      setFirstName(user.user_metadata.firstName || '')
      setLastName(user.user_metadata.lastName || '')
      setRole(user.user_metadata.role || 'parent')
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!firstName || !lastName) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        role,
        plan_type: 'free'
      })
      toast.success('Profile created successfully!')
    } catch (error) {
      toast.error('Failed to create profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Tell us a bit more about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Parent/Guardian</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="advocate">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>IEP Advocate</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// User Profile Component
export const UserProfile = ({ user, profile }) => {
  const isPremium = profile?.plan_type === 'hero' || profile?.role === 'advocate'

  return (
    <div className="text-right">
      <div className="flex items-center space-x-2">
        {profile?.role === 'advocate' ? (
          <Shield className="w-4 h-4 text-green-600" />
        ) : (
          <User className="w-4 h-4 text-blue-600" />
        )}
        <span className="text-sm font-medium text-gray-900">
          Welcome, {profile?.first_name} {profile?.last_name}
        </span>
        {isPremium && (
          <Crown className="w-4 h-4 text-orange-600" />
        )}
      </div>
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <Mail className="w-3 h-3" />
        <span>{user?.email}</span>
        <span>•</span>
        <Badge variant={isPremium ? "default" : "secondary"} className="text-xs">
          {profile?.plan_type === 'hero' ? 'Hero Plan' : profile?.role || 'Free Plan'}
        </Badge>
      </div>
    </div>
  )
}