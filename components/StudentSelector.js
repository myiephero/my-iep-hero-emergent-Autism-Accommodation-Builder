'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, User, Calendar, GraduationCap, Brain, Users, ArrowRight, AlertCircle, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

// Mock authentication hook for development
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

export const StudentSelector = ({ 
  selectedStudent, 
  onStudentSelect, 
  onStudentCreated,
  currentUser // Accept current user from parent
}) => {
  const { user, profile } = currentUser ? 
    // If passed from parent component, use that
    { 
      user: { id: currentUser.id, access_token: 'mock_token' }, 
      profile: { 
        ...currentUser, 
        role: currentUser.role, 
        plan_type: currentUser.planType, 
        first_name: currentUser.name?.split(' ')[0] || 'User', 
        last_name: currentUser.name?.split(' ')[1] || '' 
      } 
    } :
    // Otherwise use mock auth
    useMockAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    grade_level: '',
    diagnosis_areas: [],
    sensory_preferences: [],
    behavioral_challenges: [],
    communication_method: '',
    additional_notes: '',
    date_of_birth: '',
    school_name: '',
    current_iep_date: ''
  })

  useEffect(() => {
    loadStudents()
  }, [user])

  const loadStudents = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const createStudent = async () => {
    if (!createFormData.name || !createFormData.grade_level) {
      toast.error('Student name and grade level are required')
      return
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify(createFormData)
      })

      if (response.ok) {
        const newStudent = await response.json()
        setStudents(prev => [newStudent, ...prev])
        setShowCreateForm(false)
        setCreateFormData({
          name: '',
          grade_level: '',
          diagnosis_areas: [],
          sensory_preferences: [],
          behavioral_challenges: [],
          communication_method: '',
          additional_notes: '',
          date_of_birth: '',
          school_name: '',
          current_iep_date: ''
        })
        toast.success('Student created successfully!')
        onStudentCreated?.(newStudent)
      } else {
        throw new Error('Failed to create student')
      }
    } catch (error) {
      console.error('Failed to create student:', error)
      toast.error('Failed to create student')
    }
  }

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
    setCreateFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Label className="text-base font-medium">Select Student</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading students...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Select Student</Label>
          {profile?.role === 'parent' && (
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)} 
              size="sm" 
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          )}
        </div>

        {students.length > 0 ? (
          <Select 
            value={selectedStudent?.id || ''} 
            onValueChange={(studentId) => {
              const student = students.find(s => s.id === studentId)
              onStudentSelect(student)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a student to create accommodations for" />
            </SelectTrigger>
            <SelectContent>
              {students.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-gray-500">
                        {student.grade_level} • {student.diagnosis_areas?.slice(0, 2).join(', ')}
                        {student.diagnosis_areas?.length > 2 && ` +${student.diagnosis_areas.length - 2} more`}
                      </p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {profile?.role === 'advocate' ? (
                "No students have been assigned to you yet. Ask parents to assign their students to your advocacy services."
              ) : (
                "You don't have any students yet. Please add a student to create accommodations."
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Student Info */}
        {selectedStudent && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">{selectedStudent.name}</h4>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-blue-700">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {selectedStudent.grade_level}
                    </div>
                    <div className="flex items-center text-blue-700">
                      <Brain className="w-3 h-3 mr-1" />
                      {selectedStudent.diagnosis_areas?.length || 0} conditions
                    </div>
                    <div className="flex items-center text-blue-700">
                      <Users className="w-3 h-3 mr-1" />
                      {selectedStudent.communication_method || 'Not specified'}
                    </div>
                    <div className="flex items-center text-blue-700">
                      <Calendar className="w-3 h-3 mr-1" />
                      Added {new Date(selectedStudent.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {selectedStudent.diagnosis_areas && selectedStudent.diagnosis_areas.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {selectedStudent.diagnosis_areas.slice(0, 3).map((diagnosis, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {diagnosis}
                          </Badge>
                        ))}
                        {selectedStudent.diagnosis_areas.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{selectedStudent.diagnosis_areas.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Student Form */}
      {showCreateForm && profile?.role === 'parent' && (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50 rounded-t-lg">
            <CardTitle className="text-lg text-green-800">Add New Student</CardTitle>
            <CardDescription className="text-green-700">
              Create a student profile to generate personalized accommodations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentName">Student Name *</Label>
                <Input
                  id="studentName"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter student's full name"
                />
              </div>
              <div>
                <Label htmlFor="gradeLevel">Grade Level *</Label>
                <Select 
                  value={createFormData.grade_level} 
                  onValueChange={(value) => setCreateFormData(prev => ({ ...prev, grade_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={createFormData.date_of_birth}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={createFormData.school_name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, school_name: e.target.value }))}
                  placeholder="Current school"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">Diagnosis Areas (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {diagnosisOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`create-${option}`}
                      checked={createFormData.diagnosis_areas.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange('diagnosis_areas', option, checked)}
                    />
                    <Label htmlFor={`create-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={createFormData.additional_notes}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                placeholder="Any additional information about the student's needs..."
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <Button onClick={createStudent} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Student
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export const StudentQuickActions = ({ student, onUpdate }) => {
  if (!student) return null

  return (
    <div className="flex items-center space-x-2 text-sm">
      <Button size="sm" variant="outline">
        <BookOpen className="w-3 h-3 mr-1" />
        View Profile
      </Button>
      <Button size="sm" variant="outline">
        <Users className="w-3 h-3 mr-1" />
        Previous Sessions
      </Button>
    </div>
  )
}