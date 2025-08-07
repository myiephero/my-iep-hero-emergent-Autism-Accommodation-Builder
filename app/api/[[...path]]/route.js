import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// OpenAI connection
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Auth middleware
const withAuth = async (request) => {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, profile: null, error: 'No authorization token provided' }
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return { user: null, profile: null, error: 'Invalid token' }
    }

    // Get user profile from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { user, profile: null, error: 'Profile not found' }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error('Auth error:', error)
    return { user: null, profile: null, error: 'Authentication failed' }
  }
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Updated Mock Users Data with Hero Plan features
const mockUsers = {
  'parent_sarah': {
    id: 'parent_sarah',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'parent',
    planType: 'free',
    assignedAdvocate: 'advocate_maria',
    children: [
      { name: 'Emma Johnson', grade: '3rd', id: 'child_emma' },
      { name: 'Alex Johnson', grade: '1st', id: 'child_alex' }
    ]
  },
  'parent_mike': {
    id: 'parent_mike',
    name: 'Mike Chen',
    email: 'mike.chen@example.com',
    role: 'parent',
    planType: 'hero',
    assignedAdvocate: 'advocate_maria',
    prioritySupport: true,
    legalReviewEnabled: true,
    children: [
      { name: 'David Chen', grade: '5th', id: 'child_david' }
    ]
  },
  'parent_lisa': {
    id: 'parent_lisa',
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@example.com',
    role: 'parent',
    planType: 'hero',
    assignedAdvocate: 'advocate_john',
    prioritySupport: true,
    legalReviewEnabled: true,
    children: [
      { name: 'Sofia Rodriguez', grade: '2nd', id: 'child_sofia' }
    ]
  },
  'advocate_maria': {
    id: 'advocate_maria',
    name: 'Maria Gonzalez',
    email: 'maria.gonzalez@ieperoo.com',
    role: 'advocate',
    planType: 'advocate',
    specialization: 'Autism & Developmental Disabilities',
    assignedParents: ['parent_sarah', 'parent_mike'],
    credentials: 'M.Ed., Special Education Advocate',
    rating: 4.9,
    experience: '8 years',
    availability: 'high'
  },
  'advocate_john': {
    id: 'advocate_john',
    name: 'John Thompson',
    email: 'john.thompson@ieperoo.com',
    role: 'advocate',
    planType: 'advocate',
    specialization: 'IEP Legal Compliance',
    assignedParents: ['parent_lisa'],
    credentials: 'J.D., Education Law',
    rating: 4.8,
    experience: '12 years',
    availability: 'medium'
  },
  'legal_reviewer': {
    id: 'legal_reviewer',
    name: 'Dr. Patricia Williams',
    email: 'patricia.williams@ieperoo.com',
    role: 'legal_reviewer',
    planType: 'legal',
    specialization: 'Special Education Law',
    credentials: 'J.D., Ph.D. Education Law',
    rating: 4.9,
    experience: '15 years'
  }
}

// Hero Plan Features - Legal Risk Assessment
const legalRiskAnalyzer = {
  assessRisks: (accommodationData) => {
    const risks = []
    const warnings = []
    
    // Check for missing essential accommodations
    if (!accommodationData.diagnosisAreas.includes('Autism Spectrum Disorder (ASD)')) {
      risks.push({
        type: 'missing_diagnosis',
        level: 'high',
        message: 'Autism diagnosis not clearly documented',
        recommendation: 'Ensure autism spectrum disorder is properly documented in IEP'
      })
    }
    
    // Check for sensory accommodations
    if (accommodationData.sensoryPreferences.length > 0 && accommodationData.accommodations.filter(acc => acc.category === 'Sensory').length < 2) {
      risks.push({
        type: 'insufficient_sensory',
        level: 'medium',
        message: 'Limited sensory accommodations for documented sensory needs',
        recommendation: 'Add more comprehensive sensory supports'
      })
    }
    
    // Check for behavioral supports
    if (accommodationData.behavioralChallenges.length > 0 && accommodationData.accommodations.filter(acc => acc.category === 'Behavioral').length < 2) {
      risks.push({
        type: 'insufficient_behavioral',
        level: 'medium',
        message: 'Limited behavioral supports for documented challenges',
        recommendation: 'Include more behavior intervention strategies'
      })
    }
    
    // Check for communication supports
    if (accommodationData.communicationMethod !== 'verbal' && accommodationData.accommodations.filter(acc => acc.category === 'Communication').length < 2) {
      risks.push({
        type: 'insufficient_communication',
        level: 'high',
        message: 'Inadequate communication supports for non-verbal student',
        recommendation: 'Add assistive technology and communication supports'
      })
    }
    
    // Check for measurable goals (simulated)
    warnings.push({
      type: 'evaluation_reminder',
      message: 'Ensure all accommodations have measurable outcomes and regular review dates',
      action: 'Schedule progress monitoring meetings'
    })
    
    return { risks, warnings }
  }
}

// Hero Plan Features - Advanced AI Prompts
const generateAdvancedReview = async (accommodationData) => {
  const prompt = `As an expert IEP legal compliance specialist and autism accommodation expert, provide a comprehensive multi-section analysis of this IEP accommodation plan:

CHILD PROFILE:
Name: ${accommodationData.childName}
Grade: ${accommodationData.gradeLevel}
Diagnosis: ${accommodationData.diagnosisAreas.join(', ')}
Sensory Needs: ${accommodationData.sensoryPreferences.join(', ')}
Behavioral Needs: ${accommodationData.behavioralChallenges.join(', ')}
Communication: ${accommodationData.communicationMethod}
Additional Info: ${accommodationData.additionalInfo}

CURRENT ACCOMMODATIONS:
${accommodationData.accommodations.map((acc, i) => `${i+1}. ${acc.title} (${acc.category})\n   ${acc.description}`).join('\n')}

Provide analysis in this exact JSON format:
{
  "overall_assessment": {
    "strength_score": "1-10 rating",
    "compliance_score": "1-10 rating", 
    "summary": "2-3 sentence overview"
  },
  "detailed_review": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "concerns": ["concern 1", "concern 2", "concern 3"],
    "missing_elements": ["missing item 1", "missing item 2"],
    "legal_compliance": {
      "status": "compliant|concerns|non-compliant",
      "issues": ["legal issue 1", "legal issue 2"]
    }
  },
  "recommendations": {
    "immediate_actions": ["action 1", "action 2"],
    "additional_accommodations": [
      {
        "title": "Recommended accommodation title",
        "category": "Academic|Behavioral|Sensory|Communication|Environmental",
        "description": "Detailed description",
        "priority": "high|medium|low"
      }
    ],
    "goals_suggestions": ["measurable goal 1", "measurable goal 2"]
  },
  "next_steps": {
    "timeline": "Recommended timeline for implementation",
    "team_meeting": "Suggested agenda items",
    "monitoring": "Progress monitoring recommendations"
  }
}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o for Hero features
      messages: [
        {
          role: "system", 
          content: "You are a leading expert in IEP development, special education law, and autism support strategies. Provide thorough, legally sound, and practical analysis. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    })

    const response = completion.choices[0].message.content
    let reviewData

    try {
      // Clean the response
      let cleanedResponse = response.trim()
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      reviewData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      throw new Error('Invalid response format from AI')
    }

    return reviewData
  } catch (error) {
    console.error('Advanced AI Review Error:', error)
    throw error
  }
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }))
    }

    // Auth endpoints
    if (route === '/auth/users' && method === 'GET') {
      return handleCORS(NextResponse.json(Object.values(mockUsers)))
    }

    if (route.startsWith('/auth/user/') && method === 'GET') {
      const userId = route.split('/')[3]
      const user = mockUsers[userId]
      if (!user) {
        return handleCORS(NextResponse.json({ error: "User not found" }, { status: 404 }))
      }
      return handleCORS(NextResponse.json(user))
    }

    // ===== HERO PLAN FEATURES =====

    // Advanced AI Review - POST /api/hero/advanced-review
    if (route === '/hero/advanced-review' && method === 'POST') {
      const body = await request.json()
      const { sessionId, userId } = body

      // Check user has Hero plan
      const user = mockUsers[userId]
      if (!user || user.planType !== 'hero') {
        return handleCORS(NextResponse.json(
          { error: "Advanced review requires Hero Plan" }, 
          { status: 403 }
        ))
      }

      // Get session data
      const session = await db.collection('accommodation_sessions').findOne({ id: sessionId })
      if (!session) {
        return handleCORS(NextResponse.json({ error: "Session not found" }, { status: 404 }))
      }

      try {
        // Generate advanced AI review
        const advancedReview = await generateAdvancedReview(session)
        
        // Perform legal risk analysis
        const legalAnalysis = legalRiskAnalyzer.assessRisks(session)
        
        // Save advanced review to database
        const reviewRecord = {
          id: uuidv4(),
          sessionId,
          userId,
          advancedReview,
          legalAnalysis,
          reviewType: 'hero_advanced',
          timestamp: new Date()
        }

        await db.collection('advanced_reviews').insertOne(reviewRecord)

        return handleCORS(NextResponse.json({
          reviewId: reviewRecord.id,
          ...advancedReview,
          legalAnalysis
        }))

      } catch (error) {
        console.error('Advanced Review Error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to generate advanced review" }, 
          { status: 500 }
        ))
      }
    }

    // Advocate Recommendations - GET /api/hero/advocate-recommendations/:userId
    if (route.startsWith('/hero/advocate-recommendations/') && method === 'GET') {
      const userId = route.split('/')[3]
      const user = mockUsers[userId]
      
      if (!user || user.planType !== 'hero') {
        return handleCORS(NextResponse.json(
          { error: "Advocate recommendations require Hero Plan" }, 
          { status: 403 }
        ))
      }

      // Get available advocates (prioritized for Hero users)
      const advocates = Object.values(mockUsers)
        .filter(u => u.role === 'advocate')
        .map(advocate => ({
          ...advocate,
          isPriority: user.assignedAdvocate === advocate.id,
          matchScore: calculateAdvocateMatch(user, advocate)
        }))
        .sort((a, b) => {
          if (a.isPriority) return -1
          if (b.isPriority) return 1
          return b.matchScore - a.matchScore
        })

      return handleCORS(NextResponse.json(advocates))
    }

    // Document Vault - GET /api/hero/vault/:userId
    if (route.startsWith('/hero/vault/') && method === 'GET') {
      const userId = route.split('/')[3]
      const user = mockUsers[userId]
      
      if (!user || user.planType !== 'hero') {
        return handleCORS(NextResponse.json(
          { error: "Document vault requires Hero Plan" }, 
          { status: 403 }
        ))
      }

      // Get user's stored documents
      const documents = await db.collection('document_vault')
        .find({ userId })
        .sort({ timestamp: -1 })
        .toArray()

      const cleanedDocs = documents.map(({ _id, ...doc }) => doc)
      return handleCORS(NextResponse.json(cleanedDocs))
    }

    // Generate IEP Template - POST /api/hero/generate-template
    if (route === '/hero/generate-template' && method === 'POST') {
      const body = await request.json()
      const { sessionId, userId, templateType = 'full_iep' } = body

      const user = mockUsers[userId]
      if (!user || user.planType !== 'hero') {
        return handleCORS(NextResponse.json(
          { error: "IEP templates require Hero Plan" }, 
          { status: 403 }
        ))
      }

      // Get session data
      const session = await db.collection('accommodation_sessions').findOne({ id: sessionId })
      if (!session) {
        return handleCORS(NextResponse.json({ error: "Session not found" }, { status: 404 }))
      }

      // Generate IEP template
      const template = await generateIEPTemplate(session, templateType)
      
      // Save to vault
      const vaultDoc = {
        id: uuidv4(),
        userId,
        sessionId,
        documentType: templateType,
        title: `IEP Template - ${session.childName}`,
        template,
        timestamp: new Date()
      }

      await db.collection('document_vault').insertOne(vaultDoc)

      return handleCORS(NextResponse.json(template))
    }

    // Team Collaboration - POST /api/hero/invite-team
    if (route === '/hero/invite-team' && method === 'POST') {
      const body = await request.json()
      const { sessionId, userId, inviteEmail, role = 'viewer' } = body

      const user = mockUsers[userId]
      if (!user || user.planType !== 'hero') {
        return handleCORS(NextResponse.json(
          { error: "Team collaboration requires Hero Plan" }, 
          { status: 403 }
        ))
      }

      // Create team invitation
      const invitation = {
        id: uuidv4(),
        sessionId,
        invitedBy: userId,
        inviteEmail,
        role, // viewer, commenter, editor
        status: 'pending',
        timestamp: new Date(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }

      await db.collection('team_invitations').insertOne(invitation)

      return handleCORS(NextResponse.json({ 
        message: "Team member invited successfully",
        invitationId: invitation.id 
      }))
    }

    // ===== AUTISM PROFILE GENERATOR =====

    // Generate Autism Profile - POST /api/autism-profiles/generate
    if (route === '/autism-profiles/generate' && method === 'POST') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      const body = await request.json()
      const {
        studentId,
        sensoryPreferences,
        communicationStyle,
        behavioralTriggers,
        homeSupports,
        goals
      } = body

      if (!studentId) {
        return handleCORS(NextResponse.json({ error: "Student ID is required" }, { status: 400 }))
      }

      try {
        // Verify access to this student
        let hasAccess = false
        let studentData = null

        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single()

        if (studentError || !student) {
          return handleCORS(NextResponse.json({ error: "Student not found" }, { status: 404 }))
        }

        studentData = student

        if (profile.role === 'parent' && student.parent_id === user.id) {
          hasAccess = true
        } else if (profile.role === 'advocate') {
          const { data: assignment } = await supabase
            .from('student_advocate_assignments')
            .select('id')
            .eq('student_id', studentId)
            .eq('advocate_id', user.id)
            .eq('is_active', true)
            .single()
          hasAccess = !!assignment
        }

        if (!hasAccess) {
          return handleCORS(NextResponse.json({ error: "Access denied to this student" }, { status: 403 }))
        }

        // Determine profile type based on user plan
        let profileType = 'standard'
        if (profile.role === 'advocate' || profile.plan_type === 'hero') {
          profileType = 'hero'
        }

        // Create comprehensive prompt for AI generation
        const prompt = `You are an expert autism specialist and special education advocate. Create a comprehensive, professional autism profile for educators based on the following information:

STUDENT INFORMATION:
Name: ${student.name}
Grade Level: ${student.grade_level}
Known Diagnoses: ${student.diagnosis_areas?.join(', ') || 'Not specified'}

SENSORY PREFERENCES:
Selected preferences: ${sensoryPreferences.selected?.join(', ') || 'None specified'}
What calms them: ${sensoryPreferences.calming_strategies || 'Not specified'}

COMMUNICATION STYLE:
Primary method: ${communicationStyle.primary_method || 'Not specified'}
Effective strategies: ${communicationStyle.effective_strategies || 'Not specified'}

BEHAVIORAL TRIGGERS:
Known triggers: ${behavioralTriggers.triggers?.join(', ') || 'None specified'}
Other situations: ${behavioralTriggers.other_triggers || 'Not specified'}

HOME SUPPORTS THAT WORK:
${homeSupports || 'No specific supports documented'}

GOALS FOR THIS YEAR:
${goals || 'No specific goals documented'}

Create a professional autism profile that includes:

1. STUDENT OVERVIEW (2-3 sentences summarizing the student's strengths and needs)

2. SENSORY CONSIDERATIONS (Specific sensory needs and recommended accommodations)

3. COMMUNICATION APPROACH (How the student communicates best and recommended strategies)

4. BEHAVIORAL SUPPORTS (Triggers to avoid and positive behavioral strategies)

5. RECOMMENDED CLASSROOM ACCOMMODATIONS (Specific, actionable accommodations for teachers)

6. GOALS AND PRIORITIES (Key areas of focus for educational support)

${profileType === 'hero' ? `

ENHANCED HERO PROFILE SECTIONS (additional):

7. INDIVIDUAL STRENGTHS & INTERESTS (Leverage unique abilities and special interests)

8. LEARNING STYLE & PREFERENCES (Specific teaching methods and approaches that work)

9. ENVIRONMENTAL CONSIDERATIONS (Optimal classroom setup and environmental factors)

10. LONG-TERM DEVELOPMENTAL OUTLOOK (Future planning and transition considerations)

${formData.supplementalDocuments?.length > 0 ? `

DOCUMENT INSIGHTS: The following information has been gathered from uploaded documents:
${formData.supplementalDocuments.map(doc => `- ${doc.name}: ${doc.content.substring(0, 200)}...`).join('\n')}
Please integrate these insights into the profile where relevant.
` : ''}

ENHANCED ANALYSIS: Provide detailed implementation strategies, specific classroom modifications, legal compliance considerations, and comprehensive accommodation recommendations. Generate a 5-6 paragraph profile with actionable insights for educators.` : ''}

Write in a professional, strengths-based tone that emphasizes the student's abilities while clearly outlining support needs. Use person-first language and focus on practical, implementable strategies for educators.

Format the response as a clear, organized profile that can be shared with teachers and support staff.`

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert autism specialist and special education advocate with deep knowledge of IDEA law, evidence-based practices, and strengths-based approaches to autism support. Create comprehensive, professional autism profiles for educational teams."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: profileType === 'hero' ? 2500 : 1500
        })

        const generatedProfile = completion.choices[0].message.content

        // Hero Plan: Generate additional insights and recommendations
        let profileInsights = null
        let helpfulSupports = []
        let situationsToAvoid = []
        let classroomTips = []

        if (profileType === 'hero') {
          try {
            const insightsPrompt = `Based on this autism profile, provide specific insights and actionable recommendations in JSON format:

PROFILE:
${generatedProfile}

STUDENT DATA:
- Sensory needs: ${sensoryPreferences.selected?.join(', ') || 'Not specified'}
- Communication: ${communicationStyle.primary_method || 'Not specified'}
- Behavioral triggers: ${behavioralTriggers.triggers?.join(', ') || 'Not specified'}
- Home supports: ${homeSupports || 'Not specified'}
- Goals: ${goals || 'Not specified'}

Respond with ONLY valid JSON in this exact format:
{
  "topNeeds": ["need1", "need2", "need3"],
  "topRecommendations": ["rec1", "rec2", "rec3"],
  "redFlags": ["flag1", "flag2", "flag3"],
  "helpfulSupports": ["support1", "support2", "support3", "support4"],
  "situationsToAvoid": ["situation1", "situation2", "situation3", "situation4"],
  "classroomTips": ["tip1", "tip2", "tip3", "tip4"]
}`

            const insightsCompletion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: "You are an expert autism specialist. Generate specific, actionable insights in valid JSON format only. No explanations or additional text."
                },
                {
                  role: "user",
                  content: insightsPrompt
                }
              ],
              temperature: 0.3,
              max_tokens: 1000
            })

            const insightsResponse = insightsCompletion.choices[0].message.content
            let cleanedInsights = insightsResponse.trim()
            
            // Clean JSON response
            if (cleanedInsights.startsWith('```json')) {
              cleanedInsights = cleanedInsights.replace(/^```json\s*/, '').replace(/\s*```$/, '')
            } else if (cleanedInsights.startsWith('```')) {
              cleanedInsights = cleanedInsights.replace(/^```\s*/, '').replace(/\s*```$/, '')
            }

            const insights = JSON.parse(cleanedInsights)
            profileInsights = {
              topNeeds: insights.topNeeds || [],
              topRecommendations: insights.topRecommendations || [],
              redFlags: insights.redFlags || []
            }
            helpfulSupports = insights.helpfulSupports || []
            situationsToAvoid = insights.situationsToAvoid || []
            classroomTips = insights.classroomTips || []

          } catch (insightsError) {
            console.error('Failed to generate insights:', insightsError)
            // Provide fallback insights if AI generation fails
            profileInsights = {
              topNeeds: ["Visual supports", "Structured routines", "Sensory regulation"],
              topRecommendations: ["Clear visual schedules", "Quiet workspace option", "Movement breaks"],
              redFlags: ["Loud, chaotic environments", "Sudden changes", "Overwhelming social demands"]
            }
            helpfulSupports = ["Visual schedules", "Calm down space", "Clear expectations", "Positive reinforcement"]
            situationsToAvoid = ["Unexpected changes", "Loud noises", "Crowded spaces", "Rushed transitions"]
            classroomTips = ["Provide advance notice", "Use visual cues", "Allow processing time", "Celebrate successes"]
          }
        }

        // Save to database
        const { data: autismProfile, error: saveError } = await supabase
          .from('autism_profiles')
          .insert([{
            user_id: user.id,
            student_id: studentId,
            sensory_preferences: sensoryPreferences,
            communication_style: communicationStyle,
            behavioral_triggers: behavioralTriggers,
            home_supports: homeSupports,
            goals: goals,
            generated_profile: generatedProfile,
            profile_type: profileType,
            // Hero Plan exclusive data
            ...(profileType === 'hero' && {
              individual_strengths: formData.individualStrengths || '',
              learning_style: formData.learningStyle || '', 
              environmental_preferences: formData.environmentalPreferences || '',
              supplemental_documents: formData.supplementalDocuments || [],
              profile_insights: profileInsights,
              helpful_supports: helpfulSupports,
              situations_to_avoid: situationsToAvoid,
              classroom_tips: classroomTips
            })
          }])
          .select()
          .single()

        if (saveError) throw saveError

        // Log profile generation
        await logUserEvent(user.id, 'autism_profile_generated', {
          studentId,
          studentName: student.name,
          profileType,
          profileLength: generatedProfile.length,
          hasSupplementalDocs: profileType === 'hero' && (formData.supplementalDocuments?.length > 0),
          insightsGenerated: profileType === 'hero' && profileInsights !== null
        })

        const response = {
          profileId: autismProfile.id,
          generatedProfile,
          profileType,
          studentName: student.name,
          createdBy: profile.first_name + ' ' + profile.last_name
        }

        // Add Hero Plan exclusive data to response
        if (profileType === 'hero') {
          response.profileInsights = profileInsights
          response.helpfulSupports = helpfulSupports
          response.situationsToAvoid = situationsToAvoid
          response.classroomTips = classroomTips
        }

        return handleCORS(NextResponse.json(response))

      } catch (error) {
        console.error('Autism Profile Generation Error:', error)
        return handleCORS(NextResponse.json({ error: "Failed to generate autism profile" }, { status: 500 }))
      }
    }

    // Get Autism Profiles - GET /api/autism-profiles
    if (route === '/autism-profiles' && method === 'GET') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      try {
        let query = supabase
          .from('autism_profiles')
          .select(`
            id,
            student_id,
            generated_profile,
            profile_type,
            is_shared,
            created_at,
            students (
              id,
              name,
              grade_level,
              parent_id
            )
          `)

        // Apply role-based filtering
        if (profile.role === 'parent') {
          query = query.eq('user_id', user.id)
        } else if (profile.role === 'advocate') {
          // Advocates see profiles for assigned students
          query = query.in('student_id', 
            // This would need a subquery - for now let's get all and filter
          )
        }

        const { data, error: fetchError } = await query
          .order('created_at', { ascending: false })
          .limit(50)

        if (fetchError) throw fetchError

        // For advocates, filter by assigned students
        let filteredData = data || []
        if (profile.role === 'advocate') {
          const { data: assignments } = await supabase
            .from('student_advocate_assignments')
            .select('student_id')
            .eq('advocate_id', user.id)
            .eq('is_active', true)

          const assignedStudentIds = assignments?.map(a => a.student_id) || []
          filteredData = filteredData.filter(profile => 
            assignedStudentIds.includes(profile.student_id)
          )
        }

        return handleCORS(NextResponse.json({ profiles: filteredData }))

      } catch (error) {
        console.error('Failed to fetch autism profiles:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 }))
      }
    }

    // Get Single Autism Profile - GET /api/autism-profiles/:profileId
    if (route.startsWith('/autism-profiles/') && route.split('/').length === 3 && method === 'GET') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      const profileId = route.split('/')[2]

      try {
        const { data: autismProfile, error: fetchError } = await supabase
          .from('autism_profiles')
          .select(`
            *,
            students (
              id,
              name,
              grade_level,
              parent_id
            )
          `)
          .eq('id', profileId)
          .single()

        if (fetchError || !autismProfile) {
          return handleCORS(NextResponse.json({ error: "Profile not found" }, { status: 404 }))
        }

        // Verify access
        let hasAccess = false
        if (profile.role === 'parent' && autismProfile.user_id === user.id) {
          hasAccess = true
        } else if (profile.role === 'advocate') {
          const { data: assignment } = await supabase
            .from('student_advocate_assignments')
            .select('id')
            .eq('student_id', autismProfile.student_id)
            .eq('advocate_id', user.id)
            .eq('is_active', true)
            .single()
          hasAccess = !!assignment
        }

        if (!hasAccess) {
          return handleCORS(NextResponse.json({ error: "Access denied" }, { status: 403 }))
        }

        return handleCORS(NextResponse.json(autismProfile))

      } catch (error) {
        console.error('Failed to fetch autism profile:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 }))
      }
    }

    // Share Autism Profile - POST /api/autism-profiles/:profileId/share
    if (route.match(/^\/autism-profiles\/[^\/]+\/share$/) && method === 'POST') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      const profileId = route.split('/')[2]
      const body = await request.json()
      const { shareWithEmails } = body

      try {
        // Update profile sharing status
        const { data, error: updateError } = await supabase
          .from('autism_profiles')
          .update({
            is_shared: true,
            shared_with: shareWithEmails || [],
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId)
          .eq('user_id', user.id) // Ensure user owns this profile
          .select()
          .single()

        if (updateError) throw updateError

        // Log sharing event
        await logUserEvent(user.id, 'autism_profile_shared', {
          profileId,
          sharedWith: shareWithEmails?.length || 0
        })

        return handleCORS(NextResponse.json({ 
          success: true, 
          message: 'Profile shared successfully' 
        }))

      } catch (error) {
        console.error('Failed to share autism profile:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to share profile' }, { status: 500 }))
      }
    }

    // Get User's Students - GET /api/students
    if (route === '/students' && method === 'GET') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      try {
        let students = []
        
        if (profile.role === 'parent') {
          // Parents see their own students
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('parent_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
          
          if (!error) students = data || []
        } else if (profile.role === 'advocate') {
          // Advocates see assigned students through student_advocate_assignments
          const { data, error } = await supabase
            .from('student_advocate_assignments')
            .select(`
              student_id,
              students (
                id,
                parent_id,
                name,
                grade_level,
                diagnosis_areas,
                sensory_preferences,
                behavioral_challenges,
                communication_method,
                additional_notes,
                date_of_birth,
                school_name,
                current_iep_date,
                is_active,
                created_at,
                updated_at
              )
            `)
            .eq('advocate_id', user.id)
            .eq('is_active', true)
          
          if (!error && data) {
            students = data.map(assignment => assignment.students).filter(Boolean)
          }
        }

        return handleCORS(NextResponse.json({ students }))
      } catch (error) {
        console.error('Failed to fetch students:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 }))
      }
    }

    // Create Student - POST /api/students
    if (route === '/students' && method === 'POST') {
      const { user, profile, error } = await withAuth(request)
      if (error || profile.role !== 'parent') {
        return handleCORS(NextResponse.json({ error: 'Only parents can create students' }, { status: 403 }))
      }

      const body = await request.json()
      const {
        name,
        grade_level,
        diagnosis_areas = [],
        sensory_preferences = [],
        behavioral_challenges = [],
        communication_method,
        additional_notes,
        date_of_birth,
        school_name,
        current_iep_date
      } = body

      if (!name || !grade_level) {
        return handleCORS(NextResponse.json({ error: 'Name and grade level are required' }, { status: 400 }))
      }

      try {
        const { data, error } = await supabase
          .from('students')
          .insert([{
            parent_id: user.id,
            name,
            grade_level,
            diagnosis_areas,
            sensory_preferences,
            behavioral_challenges,
            communication_method,
            additional_notes,
            date_of_birth,
            school_name,
            current_iep_date
          }])
          .select()
          .single()

        if (error) throw error

        // Log student creation
        await logUserEvent(user.id, 'student_created', { studentId: data.id, studentName: name })

        return handleCORS(NextResponse.json(data))
      } catch (error) {
        console.error('Failed to create student:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to create student' }, { status: 500 }))
      }
    }

    // Update Student - PUT /api/students/:studentId
    if (route.startsWith('/students/') && method === 'PUT') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      const studentId = route.split('/')[2]
      const body = await request.json()

      try {
        // Check if user has access to this student
        let hasAccess = false
        
        if (profile.role === 'parent') {
          const { data } = await supabase
            .from('students')
            .select('id')
            .eq('id', studentId)
            .eq('parent_id', user.id)
            .single()
          hasAccess = !!data
        } else if (profile.role === 'advocate') {
          const { data } = await supabase
            .from('student_advocate_assignments')
            .select('id')
            .eq('student_id', studentId)
            .eq('advocate_id', user.id)
            .eq('is_active', true)
            .single()
          hasAccess = !!data
        }

        if (!hasAccess) {
          return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
        }

        const { data, error } = await supabase
          .from('students')
          .update({
            ...body,
            updated_at: new Date().toISOString()
          })
          .eq('id', studentId)
          .select()
          .single()

        if (error) throw error

        // Log student update
        await logUserEvent(user.id, 'student_updated', { studentId, updates: Object.keys(body) })

        return handleCORS(NextResponse.json(data))
      } catch (error) {
        console.error('Failed to update student:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to update student' }, { status: 500 }))
      }
    }

    // Assign Advocate to Student - POST /api/students/:studentId/assign-advocate
    if (route.match(/^\/students\/[^\/]+\/assign-advocate$/) && method === 'POST') {
      const { user, profile, error } = await withAuth(request)
      if (error || profile.role !== 'parent') {
        return handleCORS(NextResponse.json({ error: 'Only parents can assign advocates' }, { status: 403 }))
      }

      const studentId = route.split('/')[2]
      const body = await request.json()
      const { advocateId } = body

      try {
        // Verify the student belongs to this parent
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id, name')
          .eq('id', studentId)
          .eq('parent_id', user.id)
          .single()

        if (studentError || !student) {
          return handleCORS(NextResponse.json({ error: 'Student not found' }, { status: 404 }))
        }

        // Create the assignment
        const { data, error } = await supabase
          .from('student_advocate_assignments')
          .insert([{
            student_id: studentId,
            advocate_id: advocateId,
            assigned_by: user.id
          }])
          .select()
          .single()

        if (error) throw error

        // Log the assignment
        await logUserEvent(user.id, 'advocate_assigned_to_student', { 
          studentId, 
          advocateId, 
          studentName: student.name 
        })
        
        await logUserEvent(advocateId, 'student_assigned', { 
          studentId, 
          parentId: user.id,
          studentName: student.name 
        })

        return handleCORS(NextResponse.json(data))
      } catch (error) {
        console.error('Failed to assign advocate:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to assign advocate' }, { status: 500 }))
      }
    }

    // Create Stripe Checkout Session - POST /api/billing/create-checkout
    if (route === '/billing/create-checkout' && method === 'POST') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      const body = await request.json()
      const { planType } = body

      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{
            price: planType === 'hero' ? 'price_hero_plan_monthly' : 'price_basic_plan',
            quantity: 1,
          }],
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?tab=billing&success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?tab=billing&cancelled=true`,
          customer_email: user.email,
          metadata: {
            userId: user.id,
            planType
          }
        })

        // Log subscription attempt
        await logUserEvent(user.id, 'subscription_attempt', { planType, sessionId: session.id })

        return handleCORS(NextResponse.json({ url: session.url }))
      } catch (error) {
        console.error('Stripe checkout error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 }))
      }
    }

    // Stripe Customer Portal - POST /api/billing/portal
    if (route === '/billing/portal' && method === 'POST') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        
        // Find customer by email
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        })

        let customerId = null
        if (customers.data.length > 0) {
          customerId = customers.data[0].id
        } else {
          // Create customer if doesn't exist
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId: user.id }
          })
          customerId = customer.id
        }

        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?tab=billing`,
        })

        return handleCORS(NextResponse.json({ url: session.url }))
      } catch (error) {
        console.error('Stripe portal error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 }))
      }
    }

    // Get Billing History - GET /api/billing/history
    if (route === '/billing/history' && method === 'GET') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        })

        if (customers.data.length === 0) {
          return handleCORS(NextResponse.json({ invoices: [] }))
        }

        const invoices = await stripe.invoices.list({
          customer: customers.data[0].id,
          limit: 10
        })

        return handleCORS(NextResponse.json({ invoices: invoices.data }))
      } catch (error) {
        console.error('Billing history error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch billing history' }, { status: 500 }))
      }
    }

    // Cancel Subscription - POST /api/billing/cancel
    if (route === '/billing/cancel' && method === 'POST') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        })

        if (customers.data.length === 0) {
          return handleCORS(NextResponse.json({ error: 'No subscription found' }, { status: 404 }))
        }

        const subscriptions = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: 'active',
          limit: 1
        })

        if (subscriptions.data.length === 0) {
          return handleCORS(NextResponse.json({ error: 'No active subscription found' }, { status: 404 }))
        }

        await stripe.subscriptions.cancel(subscriptions.data[0].id)

        // Update user plan in Supabase
        await supabase
          .from('user_profiles')
          .update({ plan_type: 'free', updated_at: new Date().toISOString() })
          .eq('id', user.id)

        // Log cancellation
        await logUserEvent(user.id, 'subscription_cancelled', { subscriptionId: subscriptions.data[0].id })

        return handleCORS(NextResponse.json({ success: true }))
      } catch (error) {
        console.error('Cancel subscription error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 }))
      }
    }

    // ===== PLAN ENFORCEMENT =====

    // Check Plan Access - POST /api/auth/check-plan
    if (route === '/auth/check-plan' && method === 'POST') {
      const body = await request.json()
      const { userId, requiredPlan, feature } = body

      // Get user profile from Supabase
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !profile) {
        return handleCORS(NextResponse.json({ hasAccess: false, error: 'User not found' }))
      }

      const hasAccess = profile.plan_type === requiredPlan || 
                       profile.plan_type === 'hero' || 
                       profile.role === 'advocate'

      // Log access attempt
      await logUserEvent(userId, 'plan_access_check', { 
        feature, 
        requiredPlan, 
        userPlan: profile.plan_type,
        hasAccess 
      })

      return handleCORS(NextResponse.json({ hasAccess, userPlan: profile.plan_type }))
    }

    // ===== LOGGING ENDPOINTS =====

    // Plan Enforcement Logging - POST /api/logging/plan-enforcement
    if (route === '/logging/plan-enforcement' && method === 'POST') {
      const body = await request.json()
      const { userId, feature, action } = body

      await logUserEvent(userId, 'plan_enforcement', { feature, action })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Hero Feature Usage Analytics - POST /api/analytics/hero-usage
    if (route === '/analytics/hero-usage' && method === 'POST') {
      const body = await request.json()
      const { feature, userId } = body

      await logUserEvent(userId, 'hero_feature_usage', { feature })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Advocate Match Logging - POST /api/logging/advocate-match
    if (route === '/logging/advocate-match' && method === 'POST') {
      const body = await request.json()
      const { parentId, advocateId, matchReason } = body

      await logUserEvent(parentId, 'advocate_matched', { advocateId, matchReason })
      await logUserEvent(advocateId, 'parent_assigned', { parentId, matchReason })
      
      // Trigger advocate notification email
      await sendAdvocateMatchNotification(advocateId, parentId)

      return handleCORS(NextResponse.json({ success: true }))
    }

    // User Signup Logging - POST /api/logging/signup
    if (route === '/logging/signup' && method === 'POST') {
      const body = await request.json()
      const { userId, userEmail, role, planType } = body

      await logUserEvent(userId, 'user_signup', { userEmail, role, planType })
      
      // Send welcome email based on plan type
      if (planType === 'hero') {
        await sendHeroPlanWelcomeEmail(userEmail, userId)
      } else {
        await sendWelcomeEmail(userEmail, userId)
      }

      return handleCORS(NextResponse.json({ success: true }))
    }

    // Generate Accommodations - POST /api/accommodations/generate
    if (route === '/accommodations/generate' && method === 'POST') {
      const { user, profile, error } = await withAuth(request)
      if (error) {
        return handleCORS(NextResponse.json({ error }, { status: 401 }))
      }

      const body = await request.json()
      const {
        studentId, // New: reference to student record
        childName,
        gradeLevel,
        diagnosisAreas,
        sensoryPreferences,
        behavioralChallenges,
        communicationMethod,
        additionalInfo,
        selectedParentId // For advocates working on behalf of parents
      } = body

      if (!studentId && (!childName || !gradeLevel || !diagnosisAreas?.length || !communicationMethod)) {
        return handleCORS(NextResponse.json(
          { error: "Student ID or complete child information is required" }, 
          { status: 400 }
        ))
      }

      let actualUser = profile
      let actualPlanType = profile.plan_type
      let studentData = null

      // If studentId is provided, fetch student data
      if (studentId) {
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single()

        if (studentError || !student) {
          return handleCORS(NextResponse.json({ error: "Student not found" }, { status: 404 }))
        }

        studentData = student

        // Verify access to this student
        if (profile.role === 'parent' && student.parent_id !== user.id) {
          return handleCORS(NextResponse.json({ error: "Access denied to this student" }, { status: 403 }))
        }

        if (profile.role === 'advocate') {
          const { data: assignment } = await supabase
            .from('student_advocate_assignments')
            .select('id')
            .eq('student_id', studentId)
            .eq('advocate_id', user.id)
            .eq('is_active', true)
            .single()

          if (!assignment) {
            return handleCORS(NextResponse.json({ error: "Access denied to this student" }, { status: 403 }))
          }

          // Get parent's plan type for advocates
          const { data: parent } = await supabase
            .from('user_profiles')
            .select('plan_type')
            .eq('id', student.parent_id)
            .single()
          
          if (parent) {
            actualPlanType = parent.plan_type
          }
        }
      }

      // Use student data if available, otherwise use provided data
      const accommodationData = {
        childName: studentData?.name || childName,
        gradeLevel: studentData?.grade_level || gradeLevel,
        diagnosisAreas: studentData?.diagnosis_areas || diagnosisAreas,
        sensoryPreferences: studentData?.sensory_preferences || sensoryPreferences,
        behavioralChallenges: studentData?.behavioral_challenges || behavioralChallenges,
        communicationMethod: studentData?.communication_method || communicationMethod,
        additionalInfo: studentData?.additional_notes || additionalInfo
      }

      // Enhanced prompt for Hero users
      const accommodationCount = actualPlanType === 'hero' ? 15 : 8
      const modelToUse = "gpt-4o"
      
      const prompt = `You are an expert IEP accommodation specialist. Create ${accommodationCount} personalized, specific, and implementable IEP accommodations for a child with the following profile:

Child Name: ${accommodationData.childName}
Grade Level: ${accommodationData.gradeLevel}
Diagnosis Areas: ${accommodationData.diagnosisAreas.join(', ')}
Sensory Preferences: ${accommodationData.sensoryPreferences.join(', ')}
Behavioral Challenges: ${accommodationData.behavioralChallenges.join(', ')}
Communication Method: ${accommodationData.communicationMethod}
Additional Information: ${accommodationData.additionalInfo}

${actualPlanType === 'hero' ? 'HERO PLAN: Provide enhanced, detailed accommodations with legal compliance considerations and implementation timelines.' : ''}

Generate accommodations that are:
1. Specific and actionable for teachers
2. Evidence-based and legally compliant
3. Tailored to this child's unique needs
4. Appropriate for their grade level
5. Cover different areas: academic, behavioral, sensory, communication, and environmental

Return the accommodations in this exact JSON format:
{
  "accommodations": [
    {
      "title": "Clear, concise accommodation title",
      "description": "Detailed description of the accommodation and when to use it",
      "category": "Academic|Behavioral|Sensory|Communication|Environmental",
      "implementation": "Specific steps for implementation"
    }
  ]
}

Focus on practical accommodations that address the specific challenges mentioned.`

      try {
        const completion = await openai.chat.completions.create({
          model: modelToUse,
          messages: [
            {
              role: "system",
              content: actualPlanType === 'hero' 
                ? "You are an expert IEP accommodation specialist with deep knowledge of autism support strategies, special education law, and evidence-based practices. For Hero Plan users, provide enhanced detail, legal compliance notes, and comprehensive implementation guidance. Always respond with valid JSON only."
                : "You are an expert IEP accommodation specialist with deep knowledge of autism support strategies, special education law, and evidence-based practices. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: actualPlanType === 'hero' ? 3500 : 2500
        })

        const response = completion.choices[0].message.content
        let accommodationsData

        try {
          let cleanedResponse = response.trim()
          
          if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
          } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
          }
          
          accommodationsData = JSON.parse(cleanedResponse)
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', parseError)
          throw new Error('Invalid response format from AI')
        }

        // Save to accommodation_sessions with student reference
        const { data: session, error: sessionError } = await supabase
          .from('accommodation_sessions')
          .insert([{
            student_id: studentId,
            child_name: accommodationData.childName,
            grade_level: accommodationData.gradeLevel,
            diagnosis_areas: accommodationData.diagnosisAreas,
            sensory_preferences: accommodationData.sensoryPreferences,
            behavioral_challenges: accommodationData.behavioralChallenges,
            communication_method: accommodationData.communicationMethod,
            additional_info: accommodationData.additionalInfo,
            plan_type: actualPlanType,
            accommodations: accommodationsData.accommodations,
            created_by: user.id,
            for_parent: studentData?.parent_id || user.id
          }])
          .select()
          .single()

        if (sessionError) throw sessionError

        // Log accommodation generation
        await logUserEvent(user.id, 'accommodations_generated', {
          studentId,
          studentName: accommodationData.childName,
          accommodationCount: accommodationsData.accommodations.length,
          planType: actualPlanType
        })

        return handleCORS(NextResponse.json({
          sessionId: session.id,
          ...accommodationsData,
          createdBy: profile.first_name + ' ' + profile.last_name,
          createdByRole: profile.role,
          planType: actualPlanType,
          studentId
        }))

      } catch (openaiError) {
        console.error('OpenAI API Error:', openaiError)
        return handleCORS(NextResponse.json(
          { error: "Failed to generate accommodations. Please try again." }, 
          { status: 500 }
        ))
      }
    }

    // Get Sessions
    if (route.startsWith('/sessions/') && method === 'GET') {
      const userId = route.split('/')[2]
      const user = mockUsers[userId]
      
      if (!user) {
        return handleCORS(NextResponse.json({ error: "User not found" }, { status: 404 }))
      }

      let query = {}
      
      if (user.role === 'parent') {
        query = { forParent: userId }
      } else if (user.role === 'advocate') {
        query = { forParent: { $in: user.assignedParents } }
      }

      const sessions = await db.collection('accommodation_sessions')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray()

      const enrichedSessions = sessions.map(({ _id, ...session }) => {
        const createdByUser = Object.values(mockUsers).find(u => u.id === session.createdBy)
        const forParentUser = mockUsers[session.forParent]
        
        return {
          ...session,
          createdByName: createdByUser?.name || 'Unknown',
          forParentName: forParentUser?.name || 'Unknown'
        }
      })
      
      return handleCORS(NextResponse.json(enrichedSessions))
    }

    // Get Single Session
    if (route.startsWith('/session/') && method === 'GET') {
      const sessionId = route.split('/')[2]
      
      const session = await db.collection('accommodation_sessions')
        .findOne({ id: sessionId })
      
      if (!session) {
        return handleCORS(NextResponse.json({ error: "Session not found" }, { status: 404 }))
      }

      const comments = await db.collection('session_comments')
        .find({ sessionId })
        .sort({ timestamp: 1 })
        .toArray()

      const enrichedComments = comments.map(({ _id, ...comment }) => {
        const user = Object.values(mockUsers).find(u => u.id === comment.userId)
        return {
          ...comment,
          userName: user?.name || 'Unknown',
          userRole: user?.role || 'unknown'
        }
      })

      const { _id, ...cleanSession } = session
      const createdByUser = Object.values(mockUsers).find(u => u.id === session.createdBy)
      const forParentUser = mockUsers[session.forParent]

      return handleCORS(NextResponse.json({
        ...cleanSession,
        createdByName: createdByUser?.name || 'Unknown',
        forParentName: forParentUser?.name || 'Unknown',
        comments: enrichedComments
      }))
    }

    // Add Comment
    if (route.match(/^\/session\/[^\/]+\/comments$/) && method === 'POST') {
      const sessionId = route.split('/')[2]
      const body = await request.json()
      const { text, userId, accommodationIndex } = body

      if (!text || !userId) {
        return handleCORS(NextResponse.json(
          { error: "Missing required fields" }, 
          { status: 400 }
        ))
      }

      const comment = {
        id: uuidv4(),
        sessionId,
        userId,
        text,
        accommodationIndex: accommodationIndex || null,
        timestamp: new Date()
      }

      await db.collection('session_comments').insertOne(comment)

      const user = Object.values(mockUsers).find(u => u.id === userId)
      
      return handleCORS(NextResponse.json({
        ...comment,
        userName: user?.name || 'Unknown',
        userRole: user?.role || 'unknown'
      }))
    }

    // Update Approval
    if (route.match(/^\/session\/[^\/]+\/approval$/) && method === 'PUT') {
      const sessionId = route.split('/')[2]
      const body = await request.json()
      const { userId, approved, section = 'accommodations' } = body

      const user = Object.values(mockUsers).find(u => u.id === userId)
      if (!user || user.role !== 'advocate') {
        return handleCORS(NextResponse.json(
          { error: "Only advocates can approve sessions" }, 
          { status: 403 }
        ))
      }

      const update = {
        [`approvals.${section}Approved`]: approved,
        [`approvals.approvedBy`]: approved ? userId : null,
        [`approvals.approvedAt`]: approved ? new Date() : null,
        lastModified: new Date()
      }

      await db.collection('accommodation_sessions').updateOne(
        { id: sessionId },
        { $set: update }
      )

      return handleCORS(NextResponse.json({ success: true, approved, section }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Helper Functions
function calculateAdvocateMatch(parent, advocate) {
  let score = 0
  
  // Experience bonus
  const experience = parseInt(advocate.experience?.split(' ')[0] || '0')
  score += Math.min(experience * 2, 20)
  
  // Rating bonus
  score += (advocate.rating || 4) * 10
  
  // Availability bonus
  if (advocate.availability === 'high') score += 15
  if (advocate.availability === 'medium') score += 10
  
  // Specialization match
  if (parent.children?.some(child => advocate.specialization?.includes('Autism'))) {
    score += 25
  }
  
  return Math.min(score, 100)
}

async function generateIEPTemplate(session, templateType) {
  const template = {
    id: uuidv4(),
    type: templateType,
    childInfo: {
      name: session.childName,
      grade: session.gradeLevel,
      diagnosis: session.diagnosisAreas,
      dateGenerated: new Date().toISOString().split('T')[0]
    },
    sections: {
      presentLevels: `${session.childName} is a ${session.gradeLevel} student diagnosed with ${session.diagnosisAreas.join(', ')}. Current performance levels and needs are documented based on recent assessments.`,
      goals: session.accommodations.slice(0, 5).map((acc, i) => ({
        id: i + 1,
        area: acc.category,
        goal: `By [DATE], when given ${acc.implementation}, ${session.childName} will ${acc.description} with 80% accuracy across 4 out of 5 consecutive trials.`,
        measurable: true
      })),
      accommodations: session.accommodations,
      services: [
        {
          service: 'Special Education',
          frequency: '5 times per week',
          duration: '60 minutes',
          location: 'Special Education Classroom'
        },
        {
          service: 'Speech/Language Therapy',
          frequency: '2 times per week', 
          duration: '30 minutes',
          location: 'Speech Room'
        }
      ]
    },
    generatedBy: 'My IEP Hero - Hero Plan',
    timestamp: new Date()
  }
  
  return template
}

// Logging helper function
async function logUserEvent(userId, eventType, eventData = {}) {
  try {
    await db.collection('user_events').insertOne({
      id: uuidv4(),
      userId,
      eventType,
      eventData,
      timestamp: new Date(),
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Failed to log user event:', error)
  }
}

// Email notification functions
async function sendWelcomeEmail(email, userId) {
  try {
    // This would integrate with your email service (Resend, SendGrid, etc.)
    console.log(`Sending welcome email to ${email}`)
    
    // For now, we'll just log it
    await logUserEvent(userId, 'welcome_email_sent', { email })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

async function sendHeroPlanWelcomeEmail(email, userId) {
  try {
    console.log(`Sending Hero Plan welcome email to ${email}`)
    await logUserEvent(userId, 'hero_welcome_email_sent', { email })
  } catch (error) {
    console.error('Failed to send Hero welcome email:', error)
  }
}

async function sendAdvocateMatchNotification(advocateId, parentId) {
  try {
    // Get advocate and parent details
    const { data: advocate } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', advocateId)
      .single()
      
    const { data: parent } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', parentId)
      .single()

    if (advocate && parent) {
      console.log(`Notifying advocate ${advocate.email} about new parent assignment: ${parent.email}`)
      await logUserEvent(advocateId, 'match_notification_sent', { parentId, parentEmail: parent.email })
    }
  } catch (error) {
    console.error('Failed to send advocate match notification:', error)
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute