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

// Mock Users Data (In production, this would come from a proper auth system)
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
    credentials: 'M.Ed., Special Education Advocate'
  },
  'advocate_john': {
    id: 'advocate_john',
    name: 'John Thompson',
    email: 'john.thompson@ieperoo.com',
    role: 'advocate',
    planType: 'advocate',
    specialization: 'IEP Legal Compliance',
    assignedParents: ['parent_lisa'],
    credentials: 'J.D., Education Law'
  }
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint - GET /api/root (since /api/ is not accessible with catch-all)
    if (route === '/root' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }))
    }
    // Root endpoint - GET /api/root (since /api/ is not accessible with catch-all)
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }))
    }

    // Auth endpoints
    // GET /api/auth/users - Get all users (for role switching in demo)
    if (route === '/auth/users' && method === 'GET') {
      return handleCORS(NextResponse.json(Object.values(mockUsers)))
    }

    // GET /api/auth/user/:id - Get specific user
    if (route.startsWith('/auth/user/') && method === 'GET') {
      const userId = route.split('/')[3]
      const user = mockUsers[userId]
      if (!user) {
        return handleCORS(NextResponse.json({ error: "User not found" }, { status: 404 }))
      }
      return handleCORS(NextResponse.json(user))
    }

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
        selectedParentId // For advocates working on behalf of parents
      } = body

      // Validate required fields
      if (!childName || !gradeLevel || !diagnosisAreas?.length || !communicationMethod) {
        return handleCORS(NextResponse.json(
          { error: "Missing required fields" }, 
          { status: 400 }
        ))
      }

      // Determine the actual user and plan type
      let actualUser = mockUsers[userId] || mockUsers['parent_sarah']
      let actualPlanType = planType

      // If advocate is generating for a parent
      if (selectedParentId && actualUser.role === 'advocate') {
        const parentUser = mockUsers[selectedParentId]
        if (parentUser) {
          actualPlanType = parentUser.planType
        }
      }

      // Create prompt for OpenAI
      const accommodationCount = actualPlanType === 'hero' ? 15 : 8
      
      const prompt = `You are an expert IEP accommodation specialist. Create ${accommodationCount} personalized, specific, and implementable IEP accommodations for a child with the following profile:

Child Name: ${childName}
Grade Level: ${gradeLevel}
Diagnosis Areas: ${diagnosisAreas.join(', ')}
Sensory Preferences: ${sensoryPreferences.join(', ')}
Behavioral Challenges: ${behavioralChallenges.join(', ')}
Communication Method: ${communicationMethod}
Additional Information: ${additionalInfo}

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

Focus on practical accommodations that address the specific challenges mentioned. Include accommodations for sensory needs, communication support, behavioral management, and academic access as relevant to this child's profile.`

      try {
        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert IEP accommodation specialist with deep knowledge of autism support strategies, special education law, and evidence-based practices. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2500
        })

        const response = completion.choices[0].message.content
        let accommodationsData

        try {
          // Clean the response to handle potential formatting issues
          let cleanedResponse = response.trim()
          
          // Remove any markdown code block formatting if present
          if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
          } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
          }
          
          accommodationsData = JSON.parse(cleanedResponse)
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', parseError)
          console.error('Raw response:', response)
          throw new Error('Invalid response format from AI')
        }

        // Save to database as accommodation session
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
          // Collaboration fields
          createdBy: userId,
          forParent: selectedParentId || userId, // Which parent this is for
          status: 'draft', // draft, reviewed, approved
          lastModified: new Date(),
          timestamp: new Date(),
          // Approval tracking
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
          createdByRole: actualUser.role
        }))

      } catch (openaiError) {
        console.error('OpenAI API Error:', openaiError)
        return handleCORS(NextResponse.json(
          { error: "Failed to generate accommodations. Please try again." }, 
          { status: 500 }
        ))
      }
    }

    // Get Sessions - GET /api/sessions/:userId
    if (route.startsWith('/sessions/') && method === 'GET') {
      const userId = route.split('/')[2]
      const user = mockUsers[userId]
      
      if (!user) {
        return handleCORS(NextResponse.json({ error: "User not found" }, { status: 404 }))
      }

      let query = {}
      
      if (user.role === 'parent') {
        // Parents see sessions created for them
        query = { forParent: userId }
      } else if (user.role === 'advocate') {
        // Advocates see sessions for all their assigned parents
        query = { forParent: { $in: user.assignedParents } }
      }

      const sessions = await db.collection('accommodation_sessions')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray()

      // Remove MongoDB's _id field and add user names
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

    // Get Single Session - GET /api/session/:sessionId
    if (route.startsWith('/session/') && method === 'GET') {
      const sessionId = route.split('/')[2]
      
      const session = await db.collection('accommodation_sessions')
        .findOne({ id: sessionId })
      
      if (!session) {
        return handleCORS(NextResponse.json({ error: "Session not found" }, { status: 404 }))
      }

      // Get comments for this session
      const comments = await db.collection('session_comments')
        .find({ sessionId })
        .sort({ timestamp: 1 })
        .toArray()

      // Enrich comments with user names
      const enrichedComments = comments.map(({ _id, ...comment }) => {
        const user = Object.values(mockUsers).find(u => u.id === comment.userId)
        return {
          ...comment,
          userName: user?.name || 'Unknown',
          userRole: user?.role || 'unknown'
        }
      })

      // Remove MongoDB _id and enrich session
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

    // Add Comment - POST /api/session/:sessionId/comments
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
        accommodationIndex: accommodationIndex || null, // null for general comments
        timestamp: new Date()
      }

      await db.collection('session_comments').insertOne(comment)

      // Get user info for response
      const user = Object.values(mockUsers).find(u => u.id === userId)
      
      return handleCORS(NextResponse.json({
        ...comment,
        userName: user?.name || 'Unknown',
        userRole: user?.role || 'unknown'
      }))
    }

    // Update Approval - PUT /api/session/:sessionId/approval
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

    // Status endpoints - POST /api/status
    if (route === '/status' && method === 'POST') {
      const body = await request.json()
      
      if (!body.client_name) {
        return handleCORS(NextResponse.json(
          { error: "client_name is required" }, 
          { status: 400 }
        ))
      }

      const statusObj = {
        id: uuidv4(),
        client_name: body.client_name,
        timestamp: new Date()
      }

      await db.collection('status_checks').insertOne(statusObj)
      return handleCORS(NextResponse.json(statusObj))
    }

    // Status endpoints - GET /api/status
    if (route === '/status' && method === 'GET') {
      const statusChecks = await db.collection('status_checks')
        .find({})
        .limit(1000)
        .toArray()

      // Remove MongoDB's _id field from response
      const cleanedStatusChecks = statusChecks.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedStatusChecks))
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

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute