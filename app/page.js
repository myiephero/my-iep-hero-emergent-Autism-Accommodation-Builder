'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Copy, Download, Star, ArrowRight, ArrowLeft, Loader2, Heart, Brain, Users, BookOpen, MessageSquare, Shield, Settings, User, UserCheck, Crown, Lock, Zap, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { AdvancedAIReview, AdvocateRecommendations, DocumentVault, TeamCollaboration, HeroPlanGate } from '@/components/HeroPlanFeatures'
import { AutismProfileGenerator } from '@/components/AutismProfileGenerator'
import { AuthProvider } from '@/components/AuthComponents'

const App = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [availableUsers, setAvailableUsers] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [accommodations, setAccommodations] = useState(null)
  const [currentSession, setCurrentSession] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedParent, setSelectedParent] = useState(null) // For advocates
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [formData, setFormData] = useState({
    childName: '',
    gradeLevel: '',
    diagnosisAreas: [],
    sensoryPreferences: [],
    behavioralChallenges: [],
    communicationMethod: '',
    additionalInfo: ''
  })

  const steps = [
    { title: "Child Profile", icon: Heart },
    { title: "Learning Needs", icon: Brain },
    { title: "Communication", icon: Users },
    { title: "Results", icon: BookOpen }
  ]

  const diagnosisOptions = [
    "Autism Spectrum Disorder (ASD)",
    "ADHD",
    "Sensory Processing Disorder",
    "Intellectual Disability",
    "Speech/Language Delays",
    "Executive Function Challenges",
    "Social Communication Disorder"
  ]

  const sensoryOptions = [
    "Sound sensitivity (auditory)",
    "Light sensitivity (visual)", 
    "Touch sensitivity (tactile)",
    "Movement/vestibular needs",
    "Need for fidget tools",
    "Preference for quiet spaces",
    "Need for movement breaks"
  ]

  const behavioralOptions = [
    "Difficulty with transitions",
    "Need for routine/predictability",
    "Challenges with peer interaction",
    "Trouble following multi-step directions",
    "Difficulty with attention/focus",
    "Emotional regulation challenges",
    "Escape/avoidance behaviors"
  ]

  // Load users and set default user
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/auth/users')
      const users = await response.json()
      setAvailableUsers(users)
      
      // Set default user (Sarah for demo)
      const defaultUser = users.find(u => u.id === 'parent_sarah') || users[0]
      setCurrentUser(defaultUser)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const switchUser = (userId) => {
    const user = availableUsers.find(u => u.id === userId)
    setCurrentUser(user)
    setCurrentStep(0) // Reset to beginning
    setAccommodations(null)
    setCurrentSession(null)
    setSelectedParent(null)
    resetForm()
    loadUserSessions(userId)
  }

  const loadUserSessions = async (userId) => {
    try {
      const response = await fetch(`/api/sessions/${userId}`)
      const userSessions = await response.json()
      setSessions(userSessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      childName: '',
      gradeLevel: '',
      diagnosisAreas: [],
      sensoryPreferences: [],
      behavioralChallenges: [],
      communicationMethod: '',
      additionalInfo: ''
    })
  }

  const handleCheckboxChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }))
  }

  const generateAccommodations = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/accommodations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          planType: currentUser?.planType || 'free',
          userId: currentUser?.id,
          selectedParentId: selectedParent?.id // For advocates
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate accommodations')
      }

      const data = await response.json()
      setAccommodations(data.accommodations)
      setCurrentSession({
        id: data.sessionId,
        accommodations: data.accommodations,
        createdBy: data.createdBy,
        createdByRole: data.createdByRole,
        approvals: { accommodationsApproved: false }
      })
      setComments([])
      setCurrentStep(3)
      
      // Refresh sessions list
      loadUserSessions(currentUser.id)
    } catch (error) {
      console.error('Error generating accommodations:', error)
      toast.error('Failed to generate accommodations. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const loadSession = async (sessionId) => {
    try {
      const response = await fetch(`/api/session/${sessionId}`)
      const session = await response.json()
      
      setCurrentSession(session)
      setAccommodations(session.accommodations)
      setComments(session.comments || [])
      setCurrentStep(3) // Go to results
      
      // Fill form data if needed
      setFormData({
        childName: session.childName,
        gradeLevel: session.gradeLevel,
        diagnosisAreas: session.diagnosisAreas,
        sensoryPreferences: session.sensoryPreferences,
        behavioralChallenges: session.behavioralChallenges,
        communicationMethod: session.communicationMethod,
        additionalInfo: session.additionalInfo
      })
    } catch (error) {
      console.error('Failed to load session:', error)
      toast.error('Failed to load session')
    }
  }

  const addComment = async (accommodationIndex = null) => {
    if (!newComment.trim()) return
    
    try {
      const response = await fetch(`/api/session/${currentSession.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newComment,
          userId: currentUser.id,
          accommodationIndex
        })
      })

      if (!response.ok) throw new Error('Failed to add comment')

      const comment = await response.json()
      setComments(prev => [...prev, comment])
      setNewComment('')
      toast.success('Comment added')
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const toggleApproval = async (approved) => {
    if (currentUser.role !== 'advocate') return
    
    try {
      const response = await fetch(`/api/session/${currentSession.id}/approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          approved,
          section: 'accommodations'
        })
      })

      if (!response.ok) throw new Error('Failed to update approval')

      setCurrentSession(prev => ({
        ...prev,
        approvals: {
          ...prev.approvals,
          accommodationsApproved: approved,
          approvedBy: approved ? currentUser.id : null
        }
      }))
      
      toast.success(approved ? 'Accommodations approved' : 'Approval removed')
    } catch (error) {
      console.error('Failed to update approval:', error)
      toast.error('Failed to update approval')
    }
  }

  const copyToClipboard = async () => {
    if (!accommodations) return
    
    const text = `IEP Accommodations for ${formData.childName}\n\n` +
      accommodations.map((acc, index) => `${index + 1}. ${acc.title}\n   ${acc.description}\n`).join('\n')
    
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Accommodations copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const exportToPDF = async () => {
    if (!accommodations) return
    
    try {
      // For now, we'll use the browser's print functionality as a PDF alternative
      const printWindow = window.open('', '_blank')
      
      const accommodationsList = accommodations.map((acc, index) => `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <h3>${index + 1}. ${acc.title}</h3>
          <p><strong>Category:</strong> ${acc.category}</p>
          <p><strong>Description:</strong> ${acc.description}</p>
          <p><strong>Implementation:</strong> ${acc.implementation}</p>
        </div>
      `).join('')
      
      printWindow.document.write(`
        <html>
          <head>
            <title>IEP Accommodations for ${formData.childName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
              h2 { color: #16a34a; margin-top: 30px; }
              h3 { color: #333; margin-top: 15px; }
              .header-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <h1>IEP Accommodations Plan</h1>
            <div class="header-info">
              <p><strong>Child's Name:</strong> ${formData.childName}</p>
              <p><strong>Grade Level:</strong> ${formData.gradeLevel}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Plan Type:</strong> ${currentUser?.planType?.toUpperCase() || 'FREE'}</p>
            </div>
            <h2>Personalized Accommodations</h2>
            ${accommodationsList}
            <div style="margin-top: 40px; padding: 15px; background: #f0f9ff; border-radius: 8px;">
              <p><em>Generated by My IEP Hero - Autism Accommodation Builder</em></p>
            </div>
          </body>
        </html>
      `)
      
      printWindow.document.close()
      
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 100)
      
      toast.success('Print dialog opened! Save as PDF from the print options.')
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Failed to open print dialog')
    }
  }

  const saveToVault = async () => {
    if (!accommodations) return
    
    try {
      const vaultData = JSON.parse(localStorage.getItem('ieperoo_vault') || '[]')
      const newEntry = {
        id: Date.now(),
        childName: formData.childName,
        gradeLevel: formData.gradeLevel,
        accommodations: accommodations,
        timestamp: new Date().toISOString(),
        planType: currentUser?.planType || 'free'
      }
      
      vaultData.unshift(newEntry)
      
      if (vaultData.length > 50) {
        vaultData.splice(50)
      }
      
      localStorage.setItem('ieperoo_vault', JSON.stringify(vaultData))
      toast.success('Accommodation plan saved to your vault!')
    } catch (error) {
      console.error('Save to vault error:', error)
      toast.error('Failed to save to vault')
    }
  }

  const assignToStudent = () => {
    const assignmentText = `STUDENT ASSIGNMENT - ${formData.childName}\n` +
      `Grade: ${formData.gradeLevel}\n` +
      `Plan Type: ${currentUser?.planType?.toUpperCase() || 'FREE'}\n` +
      `Date Assigned: ${new Date().toLocaleDateString()}\n\n` +
      `Accommodations Count: ${accommodations?.length || 0}\n\n` +
      `Note: This accommodation plan has been assigned to ${formData.childName}'s IEP file.`
    
    try {
      navigator.clipboard.writeText(assignmentText)
      toast.success(`Accommodation plan assigned to ${formData.childName}! Assignment details copied to clipboard.`)
    } catch (error) {
      toast.success(`Accommodation plan assigned to ${formData.childName}!`)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 2) {
        generateAccommodations()
      } else {
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.childName && formData.gradeLevel
      case 1:
        return formData.diagnosisAreas.length > 0
      case 2:
        return formData.communicationMethod
      default:
        return true
    }
  }

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My IEP Hero</h1>
                <p className="text-sm text-gray-500">Autism Accommodation Builder</p>
              </div>
            </div>
            
            {/* User Info and Role Switcher */}
            <div className="flex items-center space-x-4">
              {/* User Switcher for Demo */}
              <Select value={currentUser.id} onValueChange={switchUser}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center space-x-2">
                        {user.role === 'advocate' ? (
                          <Shield className="w-4 h-4 text-green-600" />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                        <span>{user.name}</span>
                        <Badge variant="secondary" className="ml-1">
                          {user.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {currentUser.role === 'advocate' ? (
                    <Shield className="w-4 h-4 text-green-600" />
                  ) : (
                    <User className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">Welcome, {currentUser.name}</span>
                </div>
                <p className="text-xs text-gray-500 capitalize">
                  {currentUser.role === 'advocate' ? (
                    <>Advocate • {currentUser.specialization}</>
                  ) : (
                    <>{currentUser.planType} Plan</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Advocate Parent Selector */}
          {currentUser.role === 'advocate' && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-green-800">Working for Parent:</Label>
                <Select 
                  value={selectedParent?.id || ''} 
                  onValueChange={(parentId) => {
                    const parent = availableUsers.find(u => u.id === parentId)
                    setSelectedParent(parent)
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select parent to assist" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser.assignedParents?.map(parentId => {
                      const parent = availableUsers.find(u => u.id === parentId)
                      return parent ? (
                        <SelectItem key={parent.id} value={parent.id}>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span>{parent.name}</span>
                            <Badge variant="outline">{parent.planType}</Badge>
                          </div>
                        </SelectItem>
                      ) : null
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Sessions Dashboard */}
        {sessions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Recent Accommodation Sessions</span>
              </CardTitle>
              <CardDescription>
                {currentUser.role === 'advocate' 
                  ? "Sessions for your assigned parents"
                  : "Your accommodation sessions"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {sessions.slice(0, 3).map(session => (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadSession(session.id)}
                  >
                    <div>
                      <p className="font-medium">{session.childName} - {session.gradeLevel}</p>
                      <p className="text-sm text-gray-600">
                        {currentUser.role === 'advocate' ? (
                          <>Created for {session.forParentName}</>
                        ) : (
                          <>Created by {session.createdByName}</>
                        )}
                        • {new Date(session.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.approvals?.accommodationsApproved && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">Load</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className={`flex flex-col items-center ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">{step.title}</span>
                </div>
              )
            })}
          </div>
          <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center space-x-2">
              <span>{steps[currentStep].title}</span>
              {currentUser.role === 'advocate' && selectedParent && (
                <Badge className="bg-white/20 text-white">
                  for {selectedParent.name}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-blue-100">
              {currentStep === 0 && "Tell us about your child's basic information"}
              {currentStep === 1 && "Help us understand your child's learning needs"}
              {currentStep === 2 && "How does your child communicate best?"}
              {currentStep === 3 && "Your personalized IEP accommodations"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Step 0: Child Profile */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="childName" className="text-base font-medium">Child's Name</Label>
                  <Input
                    id="childName"
                    value={formData.childName}
                    onChange={(e) => setFormData(prev => ({ ...prev, childName: e.target.value }))}
                    placeholder="Enter your child's first name"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">Grade Level</Label>
                  <Select value={formData.gradeLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, gradeLevel: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre-k">Pre-K</SelectItem>
                      <SelectItem value="kindergarten">Kindergarten</SelectItem>
                      <SelectItem value="1st">1st Grade</SelectItem>
                      <SelectItem value="2nd">2nd Grade</SelectItem>
                      <SelectItem value="3rd">3rd Grade</SelectItem>
                      <SelectItem value="4th">4th Grade</SelectItem>
                      <SelectItem value="5th">5th Grade</SelectItem>
                      <SelectItem value="middle">Middle School (6-8)</SelectItem>
                      <SelectItem value="high">High School (9-12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 1: Learning Needs */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Diagnosis Areas (Select all that apply)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {diagnosisOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={option}
                          checked={formData.diagnosisAreas.includes(option)}
                          onCheckedChange={(checked) => handleCheckboxChange('diagnosisAreas', option, checked)}
                        />
                        <Label htmlFor={option} className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">Sensory Preferences & Challenges</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sensoryOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={option}
                          checked={formData.sensoryPreferences.includes(option)}
                          onCheckedChange={(checked) => handleCheckboxChange('sensoryPreferences', option, checked)}
                        />
                        <Label htmlFor={option} className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">Behavioral Patterns & Challenges</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {behavioralOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={option}
                          checked={formData.behavioralChallenges.includes(option)}
                          onCheckedChange={(checked) => handleCheckboxChange('behavioralChallenges', option, checked)}
                        />
                        <Label htmlFor={option} className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Communication */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Primary Communication Method</Label>
                  <Select value={formData.communicationMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, communicationMethod: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select communication method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verbal">Verbal communication</SelectItem>
                      <SelectItem value="limited-verbal">Limited verbal</SelectItem>
                      <SelectItem value="aac-device">AAC device/app</SelectItem>
                      <SelectItem value="sign-language">Sign language</SelectItem>
                      <SelectItem value="picture-cards">Picture cards/PECS</SelectItem>
                      <SelectItem value="gestures">Gestures and pointing</SelectItem>
                      <SelectItem value="non-verbal">Non-verbal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="additionalInfo" className="text-base font-medium">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder="Any additional information about your child's needs, preferences, or challenges that would help us create better accommodations..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Results */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {isGenerating ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
                    <h3 className="text-xl font-semibold mb-2">Generating Accommodations</h3>
                    <p className="text-gray-600">Creating personalized IEP accommodations for {formData.childName}...</p>
                  </div>
                ) : accommodations ? (
                  <>
                    {/* Header with Approval Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">Personalized IEP Accommodations for {formData.childName}</h3>
                        {currentSession && (
                          <div className="flex items-center space-x-2 mt-1">
                            {currentSession.approvals?.accommodationsApproved ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved by Advocate
                              </Badge>
                            ) : currentUser.role === 'advocate' ? (
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                Pending Approval
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                Under Review
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">
                              Created by {currentSession.createdBy} ({currentSession.createdByRole})
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={copyToClipboard} variant="outline" size="sm">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button onClick={exportToPDF} variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 text-blue-700">
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button onClick={saveToVault} variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 text-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save to Vault
                        </Button>
                        <Button onClick={assignToStudent} className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
                          <Users className="w-4 h-4 mr-2" />
                          Assign to Student
                        </Button>
                      </div>
                    </div>

                    {/* Advocate Approval Controls */}
                    {currentUser.role === 'advocate' && currentSession && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-800">Advocate Review</h4>
                            <p className="text-sm text-green-600 mt-1">
                              Review and approve these accommodations for the parent
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {currentSession.approvals?.accommodationsApproved ? (
                              <Button
                                onClick={() => toggleApproval(false)}
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-700"
                              >
                                Remove Approval
                              </Button>
                            ) : (
                              <Button
                                onClick={() => toggleApproval(true)}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Approve Accommodations
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Accommodations List */}
                    <div className="grid gap-4">
                      {accommodations.map((accommodation, index) => (
                        <Card key={index} className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg">{accommodation.title}</CardTitle>
                              <Badge variant="secondary">{accommodation.category}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 mb-3">{accommodation.description}</p>
                            {accommodation.implementation && (
                              <div className="p-3 bg-blue-50 rounded-lg mb-3">
                                <p className="text-sm text-blue-800">
                                  <strong>Implementation:</strong> {accommodation.implementation}
                                </p>
                              </div>
                            )}
                            
                            {/* Comments for this accommodation */}
                            {comments.filter(c => c.accommodationIndex === index).length > 0 && (
                              <div className="mt-3 space-y-2">
                                <h5 className="font-medium text-sm text-gray-700">Comments:</h5>
                                {comments.filter(c => c.accommodationIndex === index).map(comment => (
                                  <div key={comment.id} className="bg-gray-50 p-2 rounded text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-gray-700">
                                        {comment.userName}
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {comment.userRole}
                                        </Badge>
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(comment.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-gray-600">{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* General Comments Section */}
                    {currentSession && (
                      <Card className="border-2 border-dashed border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <MessageSquare className="w-5 h-5" />
                            <span>Collaboration Comments</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* General Comments */}
                          <div className="space-y-3 mb-4">
                            {comments.filter(c => c.accommodationIndex === null).map(comment => (
                              <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-800">
                                    {comment.userName}
                                    <Badge variant="outline" className="ml-2">
                                      {comment.userRole}
                                    </Badge>
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(comment.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-gray-700">{comment.text}</p>
                              </div>
                            ))}
                          </div>

                          {/* Add Comment */}
                          <div className="flex space-x-2">
                            <Textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment about these accommodations..."
                              className="flex-1"
                              rows={2}
                            />
                            <Button 
                              onClick={() => addComment()}
                              disabled={!newComment.trim()}
                              className="self-end"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Comment
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Upsell Banner for Free Plan Users */}
                    {(selectedParent?.planType === 'free' || (!selectedParent && currentUser.planType === 'free')) && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <Star className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <strong>Unlock 2x more accommodations!</strong> Upgrade to HERO Plan for additional accommodations, legal review, and direct advocate pairing.
                            </div>
                            <Button 
                              className="ml-4 bg-orange-600 hover:bg-orange-700"
                              onClick={() => window.open('/pricing', '_blank')}
                            >
                              Upgrade Now
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          {currentStep < 3 && (
            <div className="flex justify-between items-center p-6 bg-gray-50 rounded-b-lg">
              <Button
                onClick={prevStep}
                variant="outline"
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={nextStep}
                disabled={!canProceed() || isGenerating || (currentUser.role === 'advocate' && !selectedParent)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === 2 ? (
                  isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Accommodations
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default App