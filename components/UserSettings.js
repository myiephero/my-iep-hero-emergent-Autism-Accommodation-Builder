'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthComponents'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Crown, 
  CreditCard, 
  Settings, 
  Shield, 
  Mail, 
  Calendar, 
  DollarSign,
  ExternalLink,
  Check,
  X,
  Loader2,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'

export const UserSettings = () => {
  const { user, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [billingHistory, setBillingHistory] = useState([])
  const [stripePortalLoading, setStripePortalLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    plan_type: '',
    specialization: '',
    credentials: ''
  })

  useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        role: profile.role || '',
        plan_type: profile.plan_type || '',
        specialization: profile.specialization || '',
        credentials: profile.credentials || ''
      })
      loadBillingHistory()
    }
  }, [profile])

  const loadBillingHistory = async () => {
    try {
      const response = await fetch('/api/billing/history', {
        headers: { 'Authorization': `Bearer ${user?.access_token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setBillingHistory(data.invoices || [])
      }
    } catch (error) {
      console.error('Failed to load billing history:', error)
    }
  }

  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      await updateProfile(profileData)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeToHero = async () => {
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({ 
          planType: 'hero',
          userId: user?.id 
        })
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast.error('Failed to start upgrade process')
      console.error(error)
    }
  }

  const openStripePortal = async () => {
    setStripePortalLoading(true)
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({ userId: user?.id })
      })

      const { url } = await response.json()
      if (url) {
        window.open(url, '_blank')
      }
    } catch (error) {
      toast.error('Failed to open billing portal')
      console.error(error)
    } finally {
      setStripePortalLoading(false)
    }
  }

  const cancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your Hero Plan subscription? You will lose access to premium features.')) {
      return
    }

    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({ userId: user?.id })
      })

      if (response.ok) {
        toast.success('Subscription cancelled successfully')
        // Refresh profile to update plan status
        window.location.reload()
      }
    } catch (error) {
      toast.error('Failed to cancel subscription')
      console.error(error)
    }
  }

  if (!user || !profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile, billing, and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and professional details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={profileData.role} onValueChange={(value) => setProfileData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="advocate">Advocate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="planType">Plan Type</Label>
                    <div className="flex items-center space-x-2">
                      <Badge className={profile.plan_type === 'hero' ? 'bg-orange-600' : 'bg-gray-600'}>
                        {profile.plan_type === 'hero' ? (
                          <>
                            <Crown className="w-3 h-3 mr-1" />
                            Hero Plan
                          </>
                        ) : (
                          'Free Plan'
                        )}
                      </Badge>
                      {profile.plan_type === 'free' && (
                        <Button size="sm" onClick={handleUpgradeToHero}>
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {profile.role === 'advocate' && (
                  <>
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={profileData.specialization}
                        onChange={(e) => setProfileData(prev => ({ ...prev, specialization: e.target.value }))}
                        placeholder="e.g., Autism & Developmental Disabilities"
                      />
                    </div>
                    <div>
                      <Label htmlFor="credentials">Credentials</Label>
                      <Input
                        id="credentials"
                        value={profileData.credentials}
                        onChange={(e) => setProfileData(prev => ({ ...prev, credentials: e.target.value }))}
                        placeholder="e.g., M.Ed., Special Education Advocate"
                      />
                    </div>
                  </>
                )}

                <Button onClick={handleProfileUpdate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your subscription details and billing information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={profile.plan_type === 'hero' ? 'bg-orange-600' : 'bg-gray-600'}>
                          {profile.plan_type === 'hero' ? (
                            <>
                              <Crown className="w-3 h-3 mr-1" />
                              Hero Plan
                            </>
                          ) : (
                            'Free Plan'
                          )}
                        </Badge>
                        {profile.plan_type === 'hero' && (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </div>
                      <p className="text-gray-600">
                        {profile.plan_type === 'hero' 
                          ? 'Access to all premium features including advanced AI review, priority support, and team collaboration.'
                          : 'Basic accommodation generation with up to 8 accommodations per session.'
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {profile.plan_type === 'hero' ? '$29' : '$0'}
                        <span className="text-sm text-gray-500">/month</span>
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex space-x-3">
                    {profile.plan_type === 'free' ? (
                      <Button onClick={handleUpgradeToHero} className="bg-orange-600 hover:bg-orange-700">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Hero
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={openStripePortal} 
                          disabled={stripePortalLoading}
                          variant="outline"
                        >
                          {stripePortalLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ExternalLink className="w-4 h-4 mr-2" />
                          )}
                          Manage Billing
                        </Button>
                        <Button 
                          onClick={cancelSubscription} 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel Subscription
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>Your recent invoices and payments</CardDescription>
                </CardHeader>
                <CardContent>
                  {billingHistory.length > 0 ? (
                    <div className="space-y-4">
                      {billingHistory.map((invoice, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{invoice.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(invoice.created * 1000).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(invoice.amount_paid / 100).toFixed(2)}</p>
                            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                              {invoice.status === 'paid' ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Paid
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  {invoice.status}
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No billing history available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about important updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Bell className="h-4 w-4" />
                    <AlertDescription>
                      Email notification preferences will be available soon. For now, all important updates will be sent to your registered email.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and privacy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Password changes and two-factor authentication settings will be available soon. Your account is secured with industry-standard encryption.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}