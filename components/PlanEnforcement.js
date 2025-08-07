'use client'

import { useAuth } from '@/components/AuthComponents'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Lock, Zap, Shield, AlertTriangle, Star, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Enhanced Plan Gate with better UX
export const PlanEnforcementGate = ({ 
  children, 
  requiredPlan = 'hero', 
  feature, 
  description,
  benefits = [],
  onUpgrade,
  bypassForRoles = ['advocate'] // Advocates can access Hero features for their work
}) => {
  const { profile } = useAuth()
  const router = useRouter()
  
  // Allow bypass for certain roles
  if (bypassForRoles.includes(profile?.role)) {
    return children
  }
  
  // Check plan access
  if (profile?.plan_type === requiredPlan || profile?.plan_type === 'hero') {
    return children
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      router.push('/settings?tab=billing')
    }
    
    // Log plan enforcement event
    logPlanEnforcement(profile?.id, feature, 'upgrade_prompted')
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100/90 to-gray-200/90 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
        <Card className="max-w-md mx-4 border-2 border-orange-200 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Upgrade to Hero Plan</CardTitle>
            <CardDescription className="text-orange-100">
              {description || `Unlock ${feature} and more premium features`}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  This feature is exclusive to Hero Plan members
                </p>
                
                {benefits.length > 0 && (
                  <div className="text-left">
                    <h4 className="font-medium text-gray-800 mb-2">Hero Plan includes:</h4>
                    <ul className="space-y-1">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <Star className="w-3 h-3 text-orange-500 mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => router.push('/pricing')}
                >
                  Learn More
                </Button>
                <Button 
                  onClick={handleUpgrade}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                30-day money-back guarantee
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="filter blur-sm opacity-30 pointer-events-none">
        {children}
      </div>
    </div>
  )
}

// Route-level plan enforcement
export const useRouteGuard = (requiredPlan) => {
  const { profile } = useAuth()
  const router = useRouter()

  if (!profile) return { loading: true }
  
  const hasAccess = profile.plan_type === requiredPlan || 
                   profile.plan_type === 'hero' || 
                   profile.role === 'advocate'
  
  if (!hasAccess) {
    return { 
      loading: false, 
      hasAccess: false,
      redirectToUpgrade: () => router.push('/settings?tab=billing')
    }
  }
  
  return { loading: false, hasAccess: true }
}

// API-level plan enforcement
export const enforcePlanAccess = async (userId, requiredPlan, feature) => {
  try {
    const response = await fetch(`/api/auth/check-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, requiredPlan, feature })
    })
    
    const result = await response.json()
    
    if (!result.hasAccess) {
      logPlanEnforcement(userId, feature, 'access_denied')
      throw new Error('Plan upgrade required')
    }
    
    return true
  } catch (error) {
    throw error
  }
}

// Logging helper
const logPlanEnforcement = async (userId, feature, action) => {
  try {
    await fetch('/api/logging/plan-enforcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        feature,
        action,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('Failed to log plan enforcement:', error)
  }
}

// Usage tracking for Hero features
export const trackHeroFeatureUsage = async (feature, userId) => {
  try {
    await fetch('/api/analytics/hero-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature,
        userId,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('Failed to track Hero feature usage:', error)
  }
}

// Plan status indicator
export const PlanStatusBadge = ({ user, profile }) => {
  if (!profile) return null
  
  const isPremium = profile.plan_type === 'hero'
  
  return (
    <div className="flex items-center space-x-2">
      <Badge 
        className={isPremium ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'}
      >
        {isPremium ? (
          <>
            <Crown className="w-3 h-3 mr-1" />
            Hero Plan
          </>
        ) : (
          'Free Plan'
        )}
      </Badge>
      
      {!isPremium && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => window.open('/pricing', '_blank')}
          className="text-xs"
        >
          <ArrowRight className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      )}
    </div>
  )
}