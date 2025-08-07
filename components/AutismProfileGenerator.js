'use client'

import React, { useState, useEffect } from 'react'
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
  Users,
  Upload,
  X,
  CheckCircle,
  XCircle,
  Lightbulb,
  Star,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Lock,
  Zap,
  Eye,
  Heart,
  Shield,
  Calendar,
  BookOpen,
  Mic,
  Volume2,
  Settings,
  PlusCircle,
  MinusCircle,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

// Hero Plan Upsell Modal Component
const HeroPlanUpsellModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-semibold">Upgrade to Hero Plan</h3>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Unlock enhanced autism profiles with premium features:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Star className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Enhanced 5-6 Paragraph Profiles</p>
                  <p className="text-sm text-gray-500">Comprehensive analysis with detailed sections</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Upload className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Document Upload & Analysis</p>
                  <p className="text-sm text-gray-500">Upload IEPs, evaluations for richer insights</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <BarChart3 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Supports vs. Triggers Chart</p>
                  <p className="text-sm text-gray-500">Visual reference for educators</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Advanced Export Options</p>
                  <p className="text-sm text-gray-500">PDF, DOCX, and save to vault</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Share2 className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Share with Advocate</p>
                  <p className="text-sm text-gray-500">Collaborate with your IEP team</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  window.open('/pricing', '_blank')
                  onClose()
                }}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Hero Plan
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full mt-2"
                onClick={onClose}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [showUpsellModal, setShowUpsellModal] = useState(false)
  const [topNeeds, setTopNeeds] = useState([])
  const [structuredProfile, setStructuredProfile] = useState(null)

  // Check if user has Hero Plan
  const isPremiumUser = profile?.plan_type === 'hero' || profile?.role === 'advocate'

  const steps = [
    { title: "Select Student", icon: User, description: "Choose which student to create a profile for" },
    { title: "Sensory Preferences", icon: Brain, description: "How they process sensory information" },
    { title: "Communication", icon: MessageSquare, description: "How they communicate best" },
    { title: "Behavioral Triggers", icon: AlertTriangle, description: "What situations are challenging" },
    { title: "Home & Goals", icon: Target, description: "Supports that work and future goals" },
    ...(isPremiumUser ? [
      { title: "Enhanced Details", icon: Crown, description: "Hero Plan: Additional insights & documents", premium: true },
    ] : []),
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

  // Hero Plan protected functions
  const requireHeroPlan = (action) => {
    if (!isPremiumUser) {
      setShowUpsellModal(true)
      return false
    }
    return true
  }

  // Hero Plan: File Upload with protection
  const handleFileUpload = (event) => {
    if (!requireHeroPlan('file upload')) return
    
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setIsUploadingDocument(true)
    
    try {
      const newDocuments = files.map((file) => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        content: `[${file.type}] ${file.name} content for AI analysis`
      }))
      
      setUploadedDocuments(prev => [...prev, ...newDocuments])
      setFormData(prev => ({
        ...prev,
        supplementalDocuments: [...prev.supplementalDocuments, ...newDocuments]
      }))
      
      toast.success(`${newDocuments.length} document(s) uploaded successfully!`)
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload documents')
    } finally {
      setIsUploadingDocument(false)
    }
  }

  const removeDocument = (documentId) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId))
    setFormData(prev => ({
      ...prev,
      supplementalDocuments: prev.supplementalDocuments.filter(doc => doc.id !== documentId)
    }))
    toast.success('Document removed')
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
          goals: formData.goals,
          // Hero Plan exclusive data
          ...(isPremiumUser && {
            individualStrengths: formData.individualStrengths,
            learningStyle: formData.learningStyle,
            environmentalPreferences: formData.environmentalPreferences,
            supplementalDocuments: formData.supplementalDocuments.map(doc => ({
              name: doc.name,
              type: doc.type,
              content: doc.content
            }))
          })
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate autism profile')
      }

      const data = await response.json()
      setGeneratedProfile(data.generatedProfile)
      setProfileId(data.profileId)
      
      // Hero Plan: Extract insights and supports/avoid lists
      if (isPremiumUser && data.profileInsights) {
        setProfileInsights(data.profileInsights)
        setHelpfulSupports(data.helpfulSupports || [])
        setSituationsToAvoid(data.situationsToAvoid || [])
        setClassroomTips(data.classroomTips || [])
      }
      
      setCurrentStep(isPremiumUser ? steps.length - 1 : steps.length - 1) // Go to results step
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
      
      // Enhanced PDF content for Hero Plan users
      const insightsSection = isPremiumUser && profileInsights ? `
        <div class="insights-section">
          <h2>🎯 Profile Insights</h2>
          <div class="insights-grid">
            <div class="insight-box">
              <h3>Top 3 Needs</h3>
              <ul>
                ${profileInsights.topNeeds?.map(need => `<li>${need}</li>`).join('') || '<li>General autism support</li>'}
              </ul>
            </div>
            <div class="insight-box">
              <h3>Top 3 Recommendations</h3>
              <ul>
                ${profileInsights.topRecommendations?.map(rec => `<li>${rec}</li>`).join('') || '<li>Structured environment</li>'}
              </ul>
            </div>
            <div class="insight-box alert">
              <h3>⚠️ Potential Red Flags</h3>
              <ul>
                ${profileInsights.redFlags?.map(flag => `<li>${flag}</li>`).join('') || '<li>Overstimulation</li>'}
              </ul>
            </div>
          </div>
        </div>

        <div class="supports-chart">
          <h2>📊 What Helps vs. What Hurts</h2>
          <div class="chart-grid">
            <div class="helps-section">
              <h3>✅ Supports That Help</h3>
              <ul>
                ${helpfulSupports.map(support => `<li>${support}</li>`).join('')}
              </ul>
            </div>
            <div class="hurts-section">
              <h3>❌ Situations to Avoid</h3>
              <ul>
                ${situationsToAvoid.map(situation => `<li>${situation}</li>`).join('')}
              </ul>
            </div>
            <div class="tips-section">
              <h3>📌 Classroom Tips</h3>
              <ul>
                ${classroomTips.map(tip => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      ` : ''

      const documentsSection = isPremiumUser && uploadedDocuments.length > 0 ? `
        <div class="documents-section">
          <h2>📎 Referenced Documents</h2>
          <ul class="document-list">
            ${uploadedDocuments.map(doc => `
              <li>
                <strong>${doc.name}</strong> 
                <span class="doc-meta">(${doc.type}, uploaded ${new Date(doc.uploadedAt).toLocaleDateString()})</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''
      
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
              h2 {
                color: #16a34a;
                margin-top: 30px;
                border-left: 4px solid #16a34a;
                padding-left: 15px;
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
              .insights-section {
                background: #fef3c7;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .insights-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 15px;
                margin-top: 15px;
              }
              .insight-box {
                background: white;
                padding: 15px;
                border-radius: 6px;
                border: 1px solid #d1d5db;
              }
              .insight-box.alert {
                border-color: #f59e0b;
                background: #fffbeb;
              }
              .insight-box h3 {
                margin-top: 0;
                color: #374151;
                font-size: 14px;
              }
              .insight-box ul {
                margin: 10px 0 0 0;
                padding-left: 20px;
              }
              .supports-chart {
                background: #f0f9ff;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .chart-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 15px;
                margin-top: 15px;
              }
              .helps-section, .hurts-section, .tips-section {
                background: white;
                padding: 15px;
                border-radius: 6px;
                border: 1px solid #d1d5db;
              }
              .helps-section {
                border-left: 4px solid #10b981;
              }
              .hurts-section {
                border-left: 4px solid #ef4444;
              }
              .tips-section {
                border-left: 4px solid #f59e0b;
              }
              .documents-section {
                background: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .document-list {
                list-style: none;
                padding: 0;
              }
              .document-list li {
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .doc-meta {
                color: #6b7280;
                font-size: 12px;
              }
              .footer {
                margin-top: 40px;
                padding: 15px;
                background: #f0f9ff;
                border-radius: 8px;
                font-size: 0.9em;
                color: #666;
                text-align: center;
              }
              .hero-badge {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 10px;
              }
              @media print { 
                body { margin: 20px; } 
                .no-print { display: none; }
                .insights-grid, .chart-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <h1>Autism Profile</h1>
            
            <div class="header-info">
              ${isPremiumUser ? '<div class="hero-badge">👑 HERO PLAN - Enhanced Profile</div>' : ''}
              <h2>Student Information</h2>
              <p><strong>Name:</strong> ${selectedStudent.name}</p>
              <p><strong>Grade Level:</strong> ${selectedStudent.grade_level}</p>
              <p><strong>Profile Generated:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Created By:</strong> ${profile.first_name} ${profile.last_name} (${profile.role})</p>
              <p><strong>Profile Type:</strong> ${isPremiumUser ? 'Hero Plan - Enhanced' : 'Standard'}</p>
            </div>

            ${documentsSection}

            <div class="profile-content">
              <h2>📋 Comprehensive Profile</h2>
              ${generatedProfile.replace(/\n/g, '<br>')}
            </div>

            ${insightsSection}

            <div class="footer">
              <p><strong>Generated by My IEP Hero - Autism Profile Generator</strong></p>
              <p>This ${isPremiumUser ? 'enhanced' : ''} profile is designed to help educators and support staff better understand and support ${selectedStudent.name}'s unique needs and strengths.</p>
              ${isPremiumUser ? '<p>🏆 This is a Hero Plan enhanced profile with comprehensive insights and recommendations.</p>' : ''}
            </div>
          </body>
        </html>
      `)
      
      printWindow.document.close()
      
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 100)
      
      toast.success('Enhanced PDF opened! Save from the print options.')
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Failed to open print dialog')
    }
  }

  // Hero Plan: Export to DOCX
  const exportToDocx = () => {
    if (!isPremiumUser) {
      toast.error('DOCX export is available for Hero Plan users')
      return
    }
    
    // Create a simple DOCX-like format (in real implementation, use docx library)
    const docxContent = [
      `AUTISM PROFILE - ${selectedStudent.name}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Created by: ${profile.first_name} ${profile.last_name}`,
      ``,
      `COMPREHENSIVE PROFILE:`,
      generatedProfile,
      ``,
      ...(profileInsights ? [
        `TOP 3 NEEDS:`,
        ...(profileInsights.topNeeds || []),
        ``,
        `TOP 3 RECOMMENDATIONS:`, 
        ...(profileInsights.topRecommendations || []),
        ``,
        `POTENTIAL RED FLAGS:`,
        ...(profileInsights.redFlags || []),
        ``
      ] : []),
      `SUPPORTS THAT HELP:`,
      ...helpfulSupports,
      ``,
      `SITUATIONS TO AVOID:`,
      ...situationsToAvoid,
      ``,
      `CLASSROOM TIPS:`,
      ...classroomTips
    ].join('\n')
    
    // Create and download the file
    const blob = new Blob([docxContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedStudent.name}-Autism-Profile.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Profile exported as text file (DOCX functionality requires additional libraries)')
  }

  // Hero Plan: Save to Student Vault
  const saveToVault = async () => {
    if (!requireHeroPlan('save to vault')) return
    
    try {
      // In real implementation, this would save to the document vault API
      const vaultEntry = {
        id: profileId,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        title: `Autism Profile - ${selectedStudent.name}`,
        type: 'autism_profile',
        content: generatedProfile,
        insights: profileInsights,
        supports: helpfulSupports,
        avoid: situationsToAvoid,
        tips: classroomTips,
        documents: uploadedDocuments,
        createdAt: new Date().toISOString(),
        createdBy: profile.first_name + ' ' + profile.last_name
      }
      
      // Save to localStorage for demo (in real app, use API)
      const vault = JSON.parse(localStorage.getItem('hero_student_vault') || '[]')
      vault.unshift(vaultEntry)
      localStorage.setItem('hero_student_vault', JSON.stringify(vault))
      
      toast.success('Profile saved to Student Vault! 🏆')
    } catch (error) {
      console.error('Save to vault error:', error)
      toast.error('Failed to save to vault')
    }
  }

  // Hero Plan: Share with Advocate
  const shareWithAdvocate = async () => {
    if (!requireHeroPlan('share with advocate')) return
    
    try {
      const response = await fetch(`/api/autism-profiles/${profileId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          message: 'I would like to share this autism profile for collaboration.'
        })
      })

      if (response.ok) {
        toast.success('Profile shared with your advocate! They will be notified.')
      } else {
        throw new Error('Failed to share profile')
      }
    } catch (error) {
      console.error('Share error:', error)
      toast.error('Failed to share profile. Please try again.')
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedStudent !== null
      case 1: return formData.sensoryPreferences.selected.length > 0 || formData.sensoryPreferences.calming_strategies
      case 2: return formData.communicationStyle.primary_method
      case 3: return formData.behavioralTriggers.triggers.length > 0 || formData.behavioralTriggers.other_triggers
      case 4: return formData.homeSupports || formData.goals
      case 5: // Hero Plan enhanced details step
        if (!isPremiumUser) return true // Skip for free users
        return formData.individualStrengths || formData.learningStyle || uploadedDocuments.length > 0
      default: return true
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Skip Hero Plan step for free users
      if (currentStep === 4 && !isPremiumUser) {
        generateProfile()
        return
      }
      
      // Generate profile after last input step
      const lastInputStep = isPremiumUser ? 5 : 4
      if (currentStep === lastInputStep) {
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
              {React.createElement(steps[currentStep].icon, { className: "w-6 h-6" })}
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

            {/* Step 5: Hero Plan Enhanced Details */}
            {currentStep === 5 && isPremiumUser && (
              <div className="space-y-6">
                {/* Premium Badge */}
                <Alert className="border-orange-200 bg-orange-50">
                  <Crown className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Hero Plan Enhancement:</strong> Add supplemental documents and additional insights to create a comprehensive 5-6 paragraph profile with detailed recommendations.
                  </AlertDescription>
                </Alert>

                {/* Document Upload Section */}
                <Card className="border-2 border-dashed border-orange-200 bg-orange-50/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-800">
                      <Upload className="w-5 h-5" />
                      <span>Supplemental Documents</span>
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Upload IEPs, evaluations, or other documents to enhance the AI analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleDocumentUpload}
                          className="hidden"
                          id="document-upload"
                          disabled={isUploadingDocument}
                        />
                        <label
                          htmlFor="document-upload"
                          className={`
                            flex items-center justify-center w-full p-6 border-2 border-dashed border-orange-300 
                            rounded-lg cursor-pointer hover:bg-orange-50 transition-colors
                            ${isUploadingDocument ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {isUploadingDocument ? (
                            <>
                              <Loader2 className="w-6 h-6 mr-3 animate-spin text-orange-600" />
                              <span className="text-orange-700">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 mr-3 text-orange-600" />
                              <span className="text-orange-700">Click to upload documents or drag and drop</span>
                            </>
                          )}
                        </label>
                      </div>

                      {uploadedDocuments.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-orange-800">Uploaded Documents:</Label>
                          {uploadedDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-4 h-4 text-orange-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                  <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeDocument(doc.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Details Fields */}
                <div className="grid gap-6">
                  <div>
                    <Label htmlFor="individual-strengths" className="text-base font-medium flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Individual Strengths & Interests</span>
                    </Label>
                    <Textarea
                      id="individual-strengths"
                      value={formData.individualStrengths}
                      onChange={(e) => setFormData(prev => ({ ...prev, individualStrengths: e.target.value }))}
                      placeholder="What are this student's unique strengths, talents, and special interests? How can these be leveraged in their education?"
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="learning-style" className="text-base font-medium flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-blue-500" />
                      <span>Learning Style & Preferences</span>
                    </Label>
                    <Textarea
                      id="learning-style"
                      value={formData.learningStyle}
                      onChange={(e) => setFormData(prev => ({ ...prev, learningStyle: e.target.value }))}
                      placeholder="How does this student learn best? Visual, hands-on, structured, with breaks, specific teaching methods that work well..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="environmental-preferences" className="text-base font-medium flex items-center space-x-2">
                      <Home className="w-4 h-4 text-green-500" />
                      <span>Environmental Preferences</span>
                    </Label>
                    <Textarea
                      id="environmental-preferences"
                      value={formData.environmentalPreferences}
                      onChange={(e) => setFormData(prev => ({ ...prev, environmentalPreferences: e.target.value }))}
                      placeholder="What classroom environments help this student thrive? Lighting, seating, noise levels, organization, visual supports..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Enhanced Generation:</strong> This additional information will help create a more comprehensive 5-6 paragraph profile with specific classroom recommendations and implementation strategies.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 6 (or 5 for free users): Generated Profile */}
            {((currentStep === 6 && isPremiumUser) || (currentStep === 5 && !isPremiumUser)) && (
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
                        {isPremiumUser && (
                          <>
                            <Button onClick={exportToDocx} variant="outline" className="bg-orange-50 hover:bg-orange-100">
                              <FileText className="w-4 h-4 mr-2" />
                              Export DOCX
                            </Button>
                            <Button onClick={saveToVault} className="bg-yellow-600 hover:bg-yellow-700">
                              <Crown className="w-4 h-4 mr-2" />
                              Save to Vault
                            </Button>
                          </>
                        )}
                        <Button 
                          onClick={shareWithAdvocate}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          {isPremiumUser ? 'Share with Advocate' : 'Share'}
                        </Button>
                      </div>
                    </div>

                    <Card className="border-l-4 border-l-purple-600">
                      <CardContent className="p-6">
                        {isPremiumUser && (
                          <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
                            <Crown className="w-3 h-3 mr-1" />
                            Enhanced Hero Profile - {generatedProfile ? Math.ceil(generatedProfile.split(' ').length / 200) + 2 : '5-6'} Paragraphs
                          </Badge>
                        )}
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-line text-gray-800 leading-relaxed">
                            {generatedProfile}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Hero Plan: Profile Insights Panel */}
                    {isPremiumUser && profileInsights && (
                      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-orange-800">
                            <BarChart3 className="w-5 h-5" />
                            <span>Profile Insights</span>
                            <Badge className="bg-orange-200 text-orange-800">Hero Plan</Badge>
                          </CardTitle>
                          <CardDescription className="text-orange-700">
                            AI-generated key insights and recommendations
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-4 rounded-lg border border-green-200">
                              <h4 className="font-semibold text-green-800 flex items-center mb-3">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Top 3 Needs
                              </h4>
                              <ul className="space-y-2">
                                {(profileInsights.topNeeds || ['Visual supports', 'Structured routines', 'Sensory breaks']).map((need, index) => (
                                  <li key={index} className="text-sm text-green-700 flex items-start">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    {need}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                              <h4 className="font-semibold text-blue-800 flex items-center mb-3">
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Top 3 Recommendations
                              </h4>
                              <ul className="space-y-2">
                                {(profileInsights.topRecommendations || ['Clear visual schedules', 'Quiet workspace option', 'Movement breaks']).map((rec, index) => (
                                  <li key={index} className="text-sm text-blue-700 flex items-start">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-red-200">
                              <h4 className="font-semibold text-red-800 flex items-center mb-3">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Potential Red Flags
                              </h4>
                              <ul className="space-y-2">
                                {(profileInsights.redFlags || ['Loud, chaotic environments', 'Sudden changes', 'Overwhelming social demands']).map((flag, index) => (
                                  <li key={index} className="text-sm text-red-700 flex items-start">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    {flag}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Hero Plan: Top Needs & Recommendations (Enhanced Section) */}
                    {isPremiumUser && topNeeds.length > 0 && (
                      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-indigo-800">
                            <Star className="w-5 h-5" />
                            <span>Top Needs & Recommendations</span>
                            <Badge className="bg-indigo-200 text-indigo-800">Hero Plan - Max 8 Items</Badge>
                          </CardTitle>
                          <CardDescription className="text-indigo-700">
                            Priority actions for parents and educators
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-indigo-900 flex items-center">
                                <Heart className="w-4 h-4 mr-2 text-red-500" />
                                Most Critical Needs
                              </h4>
                              <div className="space-y-3">
                                {topNeeds.slice(0, 4).map((need, index) => (
                                  <div key={index} className="bg-white p-3 rounded-lg border-l-4 border-red-400">
                                    <div className="flex items-start space-x-3">
                                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                        {index + 1}
                                      </span>
                                      <p className="text-sm text-gray-800 leading-relaxed">{need}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-semibold text-indigo-900 flex items-center">
                                <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                                Key Recommendations
                              </h4>
                              <div className="space-y-3">
                                {(profileInsights?.topRecommendations || [
                                  'Implement visual schedule system',
                                  'Create calm-down space in classroom',
                                  'Use clear, concrete language',
                                  'Provide sensory breaks every 30 minutes'
                                ]).slice(0, 4).map((rec, index) => (
                                  <div key={index} className="bg-white p-3 rounded-lg border-l-4 border-green-400">
                                    <div className="flex items-start space-x-3">
                                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                        {index + 1}
                                      </span>
                                      <p className="text-sm text-gray-800 leading-relaxed">{rec}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Hero Plan: What Helps / What Hurts Chart */}
                    {isPremiumUser && (helpfulSupports.length > 0 || situationsToAvoid.length > 0 || classroomTips.length > 0) && (
                      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-blue-800">
                            <BarChart3 className="w-5 h-5" />
                            <span>What Helps vs. What Hurts</span>
                            <Badge className="bg-blue-200 text-blue-800">Hero Plan</Badge>
                          </CardTitle>
                          <CardDescription className="text-blue-700">
                            Quick reference guide for educators and support staff
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                              <h4 className="font-semibold text-green-800 flex items-center mb-3">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                ✅ Supports That Help
                              </h4>
                              <ul className="space-y-2">
                                {(helpfulSupports.length > 0 ? helpfulSupports : [
                                  'Visual schedules and routines',
                                  'Quiet, organized workspace',
                                  'Clear, simple instructions',
                                  'Positive reinforcement'
                                ]).map((support, index) => (
                                  <li key={index} className="text-sm text-gray-700 flex items-start">
                                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                    {support}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
                              <h4 className="font-semibold text-red-800 flex items-center mb-3">
                                <XCircle className="w-4 h-4 mr-2" />
                                ❌ Situations to Avoid
                              </h4>
                              <ul className="space-y-2">
                                {(situationsToAvoid.length > 0 ? situationsToAvoid : [
                                  'Sudden changes in routine',
                                  'Loud, chaotic environments', 
                                  'Overwhelming social demands',
                                  'Lack of structure or predictability'
                                ]).map((situation, index) => (
                                  <li key={index} className="text-sm text-gray-700 flex items-start">
                                    <XCircle className="w-3 h-3 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                                    {situation}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500">
                              <h4 className="font-semibold text-yellow-800 flex items-center mb-3">
                                <Lightbulb className="w-4 h-4 mr-2" />
                                📌 Classroom Tips
                              </h4>
                              <ul className="space-y-2">
                                {(classroomTips.length > 0 ? classroomTips : [
                                  'Provide advance notice of changes',
                                  'Use visual cues and supports',
                                  'Allow movement and sensory breaks',
                                  'Celebrate small successes'
                                ]).map((tip, index) => (
                                  <li key={index} className="text-sm text-gray-700 flex items-start">
                                    <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Free Plan Upgrade Prompt */}
                    {!isPremiumUser && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <Crown className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <strong>Unlock Enhanced Profiles!</strong> Upgrade to Hero Plan for 5-6 paragraph profiles, document upload, "What Helps/What Hurts" charts, insights panel, DOCX export, and student vault access.
                            </div>
                            <Button 
                              className="ml-4 bg-orange-600 hover:bg-orange-700"
                              onClick={() => window.open('/pricing', '_blank')}
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade to Hero
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

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
          {((currentStep < 6 && isPremiumUser) || (currentStep < 5 && !isPremiumUser)) && (
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
                {((currentStep === 5 && isPremiumUser) || (currentStep === 4 && !isPremiumUser)) ? (
                  isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate {isPremiumUser ? 'Enhanced ' : ''}Profile
                    </>
                  )
                ) : (
                  <>
                    {currentStep === 4 && !isPremiumUser ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Profile
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
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