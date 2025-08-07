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
        planType = 'free'
      } = body

      // Validate required fields
      if (!childName || !gradeLevel || !diagnosisAreas?.length || !communicationMethod) {
        return handleCORS(NextResponse.json(
          { error: "Missing required fields" }, 
          { status: 400 }
        ))
      }

      // Create prompt for OpenAI
      const accommodationCount = planType === 'hero' ? 15 : 8
      
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

        // Save to database
        const accommodationRecord = {
          id: uuidv4(),
          childName,
          gradeLevel,
          diagnosisAreas,
          sensoryPreferences,
          behavioralChallenges,
          communicationMethod,
          additionalInfo,
          planType,
          accommodations: accommodationsData.accommodations,
          timestamp: new Date()
        }

        await db.collection('accommodations').insertOne(accommodationRecord)

        return handleCORS(NextResponse.json(accommodationsData))

      } catch (openaiError) {
        console.error('OpenAI API Error:', openaiError)
        return handleCORS(NextResponse.json(
          { error: "Failed to generate accommodations. Please try again." }, 
          { status: 500 }
        ))
      }
    }

    // Get Accommodations History - GET /api/accommodations
    if (route === '/accommodations' && method === 'GET') {
      const accommodationHistory = await db.collection('accommodations')
        .find({})
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray()

      // Remove MongoDB's _id field from response
      const cleanedHistory = accommodationHistory.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedHistory))
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