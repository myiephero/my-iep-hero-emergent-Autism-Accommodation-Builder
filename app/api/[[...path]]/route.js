import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

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

// OpenAI connection
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    // ===== EXISTING FUNCTIONALITY =====

    // Generate Accommodations - POST /api/accommodations/generate
    if (route === '/accommodations/generate' && method === 'POST') {
      const body = await request.json()
      const {
        childName,
        gradeLevel,
        diagnosisAreas,
        sensoryPreferences,
        behavioralChallenges,
        communicationMethod,
        additionalInfo,
        planType = 'free',
        userId,
        selectedParentId
      } = body

      if (!childName || !gradeLevel || !diagnosisAreas?.length || !communicationMethod) {
        return handleCORS(NextResponse.json(
          { error: "Missing required fields" }, 
          { status: 400 }
        ))
      }

      let actualUser = mockUsers[userId] || mockUsers['parent_sarah']
      let actualPlanType = planType

      if (selectedParentId && actualUser.role === 'advocate') {
        const parentUser = mockUsers[selectedParentId]
        if (parentUser) {
          actualPlanType = parentUser.planType
        }
      }

      // Enhanced prompt for Hero users
      const accommodationCount = actualPlanType === 'hero' ? 15 : 8
      const modelToUse = actualPlanType === 'hero' ? "gpt-4o" : "gpt-4o"
      
      const prompt = `You are an expert IEP accommodation specialist. Create ${accommodationCount} personalized, specific, and implementable IEP accommodations for a child with the following profile:

Child Name: ${childName}
Grade Level: ${gradeLevel}
Diagnosis Areas: ${diagnosisAreas.join(', ')}
Sensory Preferences: ${sensoryPreferences.join(', ')}
Behavioral Challenges: ${behavioralChallenges.join(', ')}
Communication Method: ${communicationMethod}
Additional Information: ${additionalInfo}

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

        const sessionId = uuidv4()
        const accommodationSession = {
          id: sessionId,
          childName,
          gradeLevel,
          diagnosisAreas,
          sensoryPreferences,
          behavioralChallenges,
          communicationMethod,
          additionalInfo,
          planType: actualPlanType,
          accommodations: accommodationsData.accommodations,
          createdBy: userId,
          forParent: selectedParentId || userId,
          status: 'draft',
          lastModified: new Date(),
          timestamp: new Date(),
          approvals: {
            accommodationsApproved: false,
            approvedBy: null,
            approvedAt: null
          }
        }

        await db.collection('accommodation_sessions').insertOne(accommodationSession)

        return handleCORS(NextResponse.json({
          sessionId,
          ...accommodationsData,
          createdBy: actualUser.name,
          createdByRole: actualUser.role,
          planType: actualPlanType
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

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute