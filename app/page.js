'use client'

import { useState } from 'react'
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
import { CheckCircle, Copy, Download, Star, ArrowRight, ArrowLeft, Loader2, Heart, Brain, Users, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

const App = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [accommodations, setAccommodations] = useState(null)
  const [formData, setFormData] = useState({
    childName: '',
    gradeLevel: '',
    diagnosisAreas: [],
    sensoryPreferences: [],
    behavioralChallenges: [],
    communicationMethod: '',
    additionalInfo: ''
  })

  // Mock user data (simple authentication simulation)
  const mockUser = {
    name: "Sarah Johnson",
    planType: "free", // or "hero"
    childrenCount: 2
  }

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
          planType: mockUser.planType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate accommodations')
      }

      const data = await response.json()
      setAccommodations(data.accommodations)
      setCurrentStep(3)
    } catch (error) {
      console.error('Error generating accommodations:', error)
      toast.error('Failed to generate accommodations. Please try again.')
    } finally {
      setIsGenerating(false)
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

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon!')
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
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Welcome, {mockUser.name}</p>
              <p className="text-xs text-gray-500 capitalize">{mockUser.planType} Plan</p>
            </div>
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
            <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
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
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Personalized IEP Accommodations for {formData.childName}</h3>
                      <div className="flex space-x-2">
                        <Button onClick={copyToClipboard} variant="outline" size="sm">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button onClick={exportToPDF} variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </div>

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
                            <p className="text-gray-700">{accommodation.description}</p>
                            {accommodation.implementation && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800"><strong>Implementation:</strong> {accommodation.implementation}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Upsell Banner for Free Plan Users */}
                    {mockUser.planType === 'free' && (
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
                disabled={!canProceed() || isGenerating}
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