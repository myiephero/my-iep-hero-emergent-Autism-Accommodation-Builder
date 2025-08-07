'use client'

import { useState, useEffect } from 'react'
import { StudentSelector } from '@/components/StudentSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Brain, 
  MessageSquare, 
  AlertTriangle, 
  Home, 
  Target, 
  User,
  Copy,
  Download,
  Share2,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Crown,
  FileText,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

// Mock authentication hook for development - uses the current user from main app
const useMockAuth = () => {
  const [mockUser, setMockUser] = useState({
    id: 'parent_sarah',
    access_token: 'mock_token_12345'
  })
  const [mockProfile, setMockProfile] = useState({
    id: 'parent_sarah',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    role: 'parent',
    plan_type: 'free'
  })
  
  return { user: mockUser, profile: mockProfile }
}

export const AutismProfileGenerator = ({ currentUser }) => {
  const { user, profile } = currentUser ? 
    // If passed from parent component, use that
    { user: { id: currentUser.id, access_token: 'mock_token' }, profile: { ...currentUser, role: currentUser.role, plan_type: currentUser.planType, first_name: currentUser.name.split(' ')[0], last_name: currentUser.name.split(' ')[1] || '' } } :
    // Otherwise use mock auth
    useMockAuth()
    
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProfile, setGeneratedProfile] = useState(null)
  const [profileId, setProfileId] = useState(null)
  
  const [formData, setFormData] = useState({
    sensoryPreferences: {
      selected: [],
      calming_strategies: ''
    },
    communicationStyle: {
      primary_method: '',
      effective_strategies: ''
    },
    behavioralTriggers: {
      triggers: [],
      other_triggers: ''
    },
    homeSupports: '',
    goals: '',
    // Hero Plan exclusive fields
    supplementalDocuments: [],
    individualStrengths: '',
    learningStyle: '',
    environmentalPreferences: ''
  })

  // Hero Plan exclusive states
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [profileInsights, setProfileInsights] = useState(null)
  const [helpfulSupports, setHelpfulSupports] = useState([])
  const [situationsToAvoid, setSituationsToAvoid] = useState([])
  const [classroomTips, setClassroomTips] = useState([])
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)

  const steps = [
    { title: "Select Student", icon: User, description: "Choose which student to create a profile for" },
    { title: "Sensory Preferences", icon: Brain, description: "How they process sensory information" },
    { title: "Communication", icon: MessageSquare, description: "How they communicate best" },
    { title: "Behavioral Triggers", icon: AlertTriangle, description: "What situations are challenging" },
    { title: "Home & Goals", icon: Target, description: "Supports that work and future goals" },
    { title: "Generated Profile", icon: FileText, description: "Your personalized autism profile" }
  ]

  const sensoryOptions = [
    { id: 'auditory', label: 'Auditory (sounds, noise)', icon: '🔊' },
    { id: 'visual', label: 'Visual (lights, colors)', icon: '👁️' },
    { id: 'tactile', label: 'Tactile (touch, textures)', icon: '✋' },
    { id: 'smell', label: 'Smell (scents, odors)', icon: '👃' },
    { id: 'taste', label: 'Taste (food, textures)', icon: '👅' },
    { id: 'proprioceptive', label: 'Proprioceptive (body awareness)', icon: '🤸' },
    { id: 'vestibular', label: 'Vestibular (balance, movement)', icon: '🔄' }
  ]

  const communicationMethods = [
    'Verbal communication',
    'Nonverbal communication', 
    'AAC device or app',
    'Sign language',
    'Gestures and pointing',
    'Limited vocabulary',
    'Picture cards/PECS'
  ]

  const behaviorTriggerOptions = [
    'Transitions between activities',
    'Loud noises or sudden sounds',
    'Crowded spaces',
    'Unstructured time',
    'Bright or flashing lights',
    'Changes in routine',
    'Social demands',
    'Sensory overload',
    'Being rushed',
    'Unexpected touch'
  ]

  const handleSensoryChange = (option, checked) => {
    setFormData(prev => ({
      ...prev,
      sensoryPreferences: {
        ...prev.sensoryPreferences,
        selected: checked 
          ? [...prev.sensoryPreferences.selected, option]
          : prev.sensoryPreferences.selected.filter(item => item !== option)
      }
    }))
  }

  const handleTriggerChange = (trigger, checked) => {
    setFormData(prev => ({
      ...prev,
      behavioralTriggers: {
        ...prev.behavioralTriggers,
        triggers: checked 
          ? [...prev.behavioralTriggers.triggers, trigger]
          : prev.behavioralTriggers.triggers.filter(item => item !== trigger)
      }
    }))
  }

  const generateProfile = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/autism-profiles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          sensoryPreferences: formData.sensoryPreferences,
          communicationStyle: formData.communicationStyle,
          behavioralTriggers: formData.behavioralTriggers,
          homeSupports: formData.homeSupports,
          goals: formData.goals
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate autism profile')
      }

      const data = await response.json()
      setGeneratedProfile(data.generatedProfile)
      setProfileId(data.profileId)
      setCurrentStep(5) // Go to results step
      toast.success('Autism profile generated successfully!')

    } catch (error) {
      console.error('Error generating autism profile:', error)
      toast.error('Failed to generate autism profile. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!generatedProfile) return
    
    try {
      await navigator.clipboard.writeText(generatedProfile)
      toast.success('Autism profile copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const exportToPDF = async () => {
    if (!generatedProfile || !selectedStudent) return
    
    try {
      const printWindow = window.open('', '_blank')
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Autism Profile - ${selectedStudent.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                line-height: 1.6; 
                color: #333;
              }
              h1 { 
                color: #2563eb; 
                border-bottom: 3px solid #2563eb; 
                padding-bottom: 10px; 
              }
              .header-info { 
                background: #f8fafc; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
                border-left: 4px solid #2563eb;
              }
              .profile-content {
                margin: 20px 0;
                padding: 20px;
                background: white;
                border-radius: 8px;
                white-space: pre-line;
              }
              .footer {
                margin-top: 40px;
                padding: 15px;
                background: #f0f9ff;
                border-radius: 8px;
                font-size: 0.9em;
                color: #666;
              }
              @media print { 
                body { margin: 20px; } 
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>Autism Profile</h1>
            
            <div class="header-info">
              <h2>Student Information</h2>
              <p><strong>Name:</strong> ${selectedStudent.name}</p>
              <p><strong>Grade Level:</strong> ${selectedStudent.grade_level}</p>
              <p><strong>Profile Generated:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Created By:</strong> ${profile.first_name} ${profile.last_name} (${profile.role})</p>
            </div>

            <div class="profile-content">
              ${generatedProfile.replace(/\n/g, '<br>')}
            </div>

            <div class="footer">
              <p><strong>Generated by My IEP Hero - Autism Profile Generator</strong></p>
              <p>This profile is designed to help educators and support staff better understand and support ${selectedStudent.name}'s unique needs and strengths.</p>
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

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedStudent !== null
      case 1: return formData.sensoryPreferences.selected.length > 0 || formData.sensoryPreferences.calming_strategies
      case 2: return formData.communicationStyle.primary_method
      case 3: return formData.behavioralTriggers.triggers.length > 0 || formData.behavioralTriggers.other_triggers
      case 4: return formData.homeSupports || formData.goals
      default: return true
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 4) {
        generateProfile()
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

  const isPremiumUser = profile?.plan_type === 'hero' || profile?.role === 'advocate'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Autism Profile Generator</h1>
                <p className="text-gray-600">Create comprehensive profiles for educators and support teams</p>
              </div>
            </div>
            
            {isPremiumUser && (
              <Badge className="bg-orange-600 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Enhanced Profile
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className={`flex flex-col items-center ${index <= currentStep ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    index <= currentStep ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-center">{step.title}</span>
                </div>
              )
            })}
          </div>
          <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center space-x-2">
              <steps[currentStep].icon className="w-6 h-6" />
              <span>{steps[currentStep].title}</span>
            </CardTitle>
            <CardDescription className="text-purple-100">
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {/* Step 0: Student Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <StudentSelector
                  selectedStudent={selectedStudent}
                  onStudentSelect={setSelectedStudent}
                  onStudentCreated={(student) => {
                    setSelectedStudent(student)
                    toast.success('Student created! You can now generate their autism profile.')
                  }}
                />
                
                {selectedStudent && (
                  <Alert className="border-green-200 bg-green-50">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Great! You've selected <strong>{selectedStudent.name}</strong>. 
                      We'll create a comprehensive autism profile to help their educators understand their unique needs and strengths.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 1: Sensory Preferences */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium mb-4 block">Sensory Preferences & Sensitivities</Label>
                  <p className="text-gray-600 mb-6">Select the sensory areas where {selectedStudent?.name || 'the student'} shows preferences or sensitivities:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sensoryOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={option.id}
                          checked={formData.sensoryPreferences.selected.includes(option.id)}
                          onCheckedChange={(checked) => handleSensoryChange(option.id, checked)}
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-lg">{option.icon}</span>
                          <Label htmlFor={option.id} className="cursor-pointer">{option.label}</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="calming-strategies" className="text-base font-medium">What calms them down?</Label>
                  <Textarea
                    id="calming-strategies"
                    value={formData.sensoryPreferences.calming_strategies}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sensoryPreferences: {
                        ...prev.sensoryPreferences,
                        calming_strategies: e.target.value
                      }
                    }))}
                    placeholder="Describe sensory strategies, items, or environments that help them feel calm and regulated..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Communication Style */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium mb-4 block">Communication Style</Label>
                  <p className="text-gray-600 mb-4">How does {selectedStudent?.name || 'the student'} communicate best?</p>
                  
                  <Select 
                    value={formData.communicationStyle.primary_method} 
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      communicationStyle: {
                        ...prev.communicationStyle,
                        primary_method: value
                      }
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select primary communication method" />
                    </SelectTrigger>
                    <SelectContent>
                      {communicationMethods.map(method => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="communication-strategies" className="text-base font-medium">What communication strategies work best?</Label>
                  <Textarea
                    id="communication-strategies"
                    value={formData.communicationStyle.effective_strategies}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      communicationStyle: {
                        ...prev.communicationStyle,
                        effective_strategies: e.target.value
                      }
                    }))}
                    placeholder="Describe specific communication approaches, visual supports, prompting strategies, or techniques that help them communicate effectively..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Behavioral Triggers */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium mb-4 block">Behavioral Triggers</Label>
                  <p className="text-gray-600 mb-6">What situations or environments might be challenging for {selectedStudent?.name || 'the student'}?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {behaviorTriggerOptions.map((trigger) => (
                      <div key={trigger} className="flex items-center space-x-2">
                        <Checkbox
                          id={trigger}
                          checked={formData.behavioralTriggers.triggers.includes(trigger)}
                          onCheckedChange={(checked) => handleTriggerChange(trigger, checked)}
                        />
                        <Label htmlFor={trigger} className="text-sm cursor-pointer">{trigger}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="other-triggers" className="text-base font-medium">Other triggers or challenging situations?</Label>
                  <Textarea
                    id="other-triggers"
                    value={formData.behavioralTriggers.other_triggers}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      behavioralTriggers: {
                        ...prev.behavioralTriggers,
                        other_triggers: e.target.value
                      }
                    }))}
                    placeholder="Describe any other situations, environments, or factors that might be challenging..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Home Supports & Goals */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="home-supports" className="text-lg font-medium mb-2 block flex items-center space-x-2">
                    <Home className="w-5 h-5" />
                    <span>Home Supports That Work</span>
                  </Label>
                  <p className="text-gray-600 mb-4">What strategies or accommodations are effective at home?</p>
                  <Textarea
                    id="home-supports"
                    value={formData.homeSupports}
                    onChange={(e) => setFormData(prev => ({ ...prev, homeSupports: e.target.value }))}
                    placeholder="Describe routines, visual supports, environmental modifications, behavioral strategies, or other approaches that work well at home..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="goals" className="text-lg font-medium mb-2 block flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Goals & Priorities</span>
                  </Label>
                  <p className="text-gray-600 mb-4">What goals do you have for {selectedStudent?.name || 'the student'} this year?</p>
                  <Textarea
                    id="goals"
                    value={formData.goals}
                    onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                    placeholder="Describe academic, social, communication, or behavioral goals you'd like to focus on..."
                    rows={4}
                  />
                </div>

                {isPremiumUser && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <Sparkles className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Enhanced Profile:</strong> Your Hero Plan will generate a comprehensive profile with detailed implementation strategies, legal compliance notes, and specific accommodation recommendations.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 5: Generated Profile */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {isGenerating ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-purple-600" />
                    <h3 className="text-xl font-semibold mb-2">Generating Autism Profile</h3>
                    <p className="text-gray-600">Creating a comprehensive profile for {selectedStudent?.name}...</p>
                  </div>
                ) : generatedProfile ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Autism Profile for {selectedStudent?.name}</h3>
                        <p className="text-gray-600 mt-1">Professional profile ready to share with educators</p>
                      </div>
                      <div className="flex space-x-3">
                        <Button onClick={copyToClipboard} variant="outline">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button onClick={exportToPDF} variant="outline" className="bg-blue-50 hover:bg-blue-100">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>

                    <Card className="border-l-4 border-l-purple-600">
                      <CardContent className="p-6">
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-line text-gray-800 leading-relaxed">
                            {generatedProfile}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Alert className="border-green-200 bg-green-50">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Profile Generated Successfully!</strong> This comprehensive autism profile can be shared with teachers, therapists, and support staff to help them better understand and support {selectedStudent?.name}.
                      </AlertDescription>
                    </Alert>
                  </>
                ) : null}
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="flex justify-between items-center p-6 bg-gray-50 rounded-b-lg">
              <Button
                onClick={prevStep}
                variant="outline"
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>

              <Button
                onClick={nextStep}
                disabled={!canProceed() || isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {currentStep === 4 ? (
                  isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Profile
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