'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Crown, 
  Lock, 
  Zap, 
  Shield, 
  FileText, 
  Users, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  Eye,
  MessageSquare,
  UserPlus,
  Gavel,
  Brain,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

export const HeroPlanGate = ({ children, userPlanType, feature, onUpgrade }) => {
  if (userPlanType === 'hero' || userPlanType === 'advocate') {
    return children
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gray-100 bg-opacity-75 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
        <Card className="max-w-sm mx-4">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Crown className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg">Hero Plan Required</CardTitle>
            <CardDescription>
              Unlock {feature} with Hero Plan
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={onUpgrade}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Hero
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="filter blur-sm opacity-50">
        {children}
      </div>
    </div>
  )
}

export const AdvancedAIReview = ({ session, currentUser, onReviewComplete }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [review, setReview] = useState(null)
  const [legalAnalysis, setLegalAnalysis] = useState(null)

  const generateAdvancedReview = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/hero/advanced-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          userId: currentUser.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate advanced review')
      }

      const data = await response.json()
      setReview(data)
      setLegalAnalysis(data.legalAnalysis)
      onReviewComplete?.(data)
      toast.success('Advanced AI review completed!')
    } catch (error) {
      console.error('Advanced review error:', error)
      toast.error('Failed to generate advanced review')
    } finally {
      setIsGenerating(false)
    }
  }

  const isHeroPlan = currentUser?.planType === 'hero' || currentUser?.planType === 'advocate'

  return (
    <HeroPlanGate 
      userPlanType={currentUser?.planType} 
      feature="Advanced AI Review"
      onUpgrade={() => window.open('/pricing', '_blank')}
    >
      <Card className="border-2 border-gradient-to-r from-purple-200 to-blue-200">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Advanced AI Review</span>
            <Badge className="bg-white/20 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Hero
            </Badge>
          </CardTitle>
          <CardDescription className="text-purple-100">
            Deep legal compliance analysis and expert recommendations
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {!review ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Enhanced AI Analysis</h3>
                <p className="text-gray-600 mb-4">
                  Get comprehensive review covering legal compliance, missing elements, and expert recommendations
                </p>
              </div>
              
              <Button 
                onClick={generateAdvancedReview}
                disabled={isGenerating || !isHeroPlan}
                className="bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Advanced Review
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Assessment */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Overall Assessment
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label className="text-sm text-gray-600">Strength Score</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={parseInt(review.overall_assessment?.strength_score || '0') * 10} className="flex-1" />
                      <span className="text-sm font-medium">{review.overall_assessment?.strength_score}/10</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Compliance Score</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={parseInt(review.overall_assessment?.compliance_score || '0') * 10} className="flex-1" />
                      <span className="text-sm font-medium">{review.overall_assessment?.compliance_score}/10</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">{review.overall_assessment?.summary}</p>
              </div>

              {/* Legal Risk Analysis */}
              {legalAnalysis && (legalAnalysis.risks.length > 0 || legalAnalysis.warnings.length > 0) && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-800">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      ⚠️ Legal Attention Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {legalAnalysis.risks.map((risk, index) => (
                      <Alert key={index} className={`mb-3 ${
                        risk.level === 'high' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          risk.level === 'high' ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <AlertDescription>
                          <div className="font-medium">{risk.message}</div>
                          <div className="text-sm mt-1">{risk.recommendation}</div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Detailed Review Sections */}
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-700">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {review.detailed_review?.strengths?.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-700">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Areas of Concern
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {review.detailed_review?.concerns?.map((concern, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              {review.recommendations && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Expert Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {review.recommendations.immediate_actions?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-blue-800 mb-2">Immediate Actions</h4>
                          <ul className="space-y-1">
                            {review.recommendations.immediate_actions.map((action, index) => (
                              <li key={index} className="text-sm flex items-start space-x-2">
                                <Star className="w-3 h-3 text-blue-600 mt-1 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {review.recommendations.additional_accommodations?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-blue-800 mb-2">Suggested Additional Accommodations</h4>
                          <div className="space-y-2">
                            {review.recommendations.additional_accommodations.map((acc, index) => (
                              <div key={index} className="p-3 bg-white rounded border">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="font-medium text-sm">{acc.title}</h5>
                                  <Badge variant={acc.priority === 'high' ? 'destructive' : acc.priority === 'medium' ? 'default' : 'secondary'}>
                                    {acc.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">{acc.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </HeroPlanGate>
  )
}

export const AdvocateRecommendations = ({ currentUser }) => {
  const [advocates, setAdvocates] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentUser?.planType === 'hero') {
      loadAdvocateRecommendations()
    }
  }, [currentUser])

  const loadAdvocateRecommendations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/hero/advocate-recommendations/${currentUser.id}`)
      if (response.ok) {
        const data = await response.json()
        setAdvocates(data)
      }
    } catch (error) {
      console.error('Failed to load advocates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <HeroPlanGate 
      userPlanType={currentUser?.planType} 
      feature="Priority Advocate Pairing"
      onUpgrade={() => window.open('/pricing', '_blank')}
    >
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Priority Advocate Pairing</span>
            <Badge className="bg-white/20 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Hero
            </Badge>
          </CardTitle>
          <CardDescription className="text-green-100">
            Matched with top advocates specializing in your needs
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p>Finding your ideal advocates...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {advocates.map((advocate, index) => (
                <Card key={advocate.id} className={`border ${advocate.isPriority ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Shield className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold flex items-center space-x-2">
                            <span>{advocate.name}</span>
                            {advocate.isPriority && (
                              <Badge className="bg-green-600 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Your Advocate
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{advocate.specialization}</p>
                          <p className="text-xs text-gray-500">{advocate.credentials}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">{advocate.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">{advocate.experience}</p>
                        <Badge variant={
                          advocate.availability === 'high' ? 'default' : 
                          advocate.availability === 'medium' ? 'secondary' : 'outline'
                        }>
                          {advocate.availability} availability
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </HeroPlanGate>
  )
}

export const DocumentVault = ({ currentUser }) => {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentUser?.planType === 'hero') {
      loadDocuments()
    }
  }, [currentUser])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/hero/vault/${currentUser.id}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateIEPTemplate = async (sessionId) => {
    try {
      const response = await fetch('/api/hero/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: currentUser.id,
          templateType: 'full_iep'
        })
      })

      if (response.ok) {
        toast.success('IEP template generated and saved to vault!')
        loadDocuments() // Refresh the list
      }
    } catch (error) {
      toast.error('Failed to generate IEP template')
    }
  }

  return (
    <HeroPlanGate 
      userPlanType={currentUser?.planType} 
      feature="Document Vault & IEP Templates"
      onUpgrade={() => window.open('/pricing', '_blank')}
    >
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Document Vault</span>
            <Badge className="bg-white/20 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Hero
            </Badge>
          </CardTitle>
          <CardDescription className="text-blue-100">
            Generate and store IEP templates and documents
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading your documents...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents in vault yet</p>
                  <p className="text-sm">Generate IEP templates from your accommodation sessions</p>
                </div>
              ) : (
                documents.map((doc, index) => (
                  <Card key={doc.id} className="border border-gray-200 hover:border-blue-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{doc.title}</h4>
                            <p className="text-sm text-gray-500">
                              {doc.documentType} • Generated {new Date(doc.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </HeroPlanGate>
  )
}

export const TeamCollaboration = ({ currentUser, sessionId }) => {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [isInviting, setIsInviting] = useState(false)

  const inviteTeamMember = async () => {
    if (!inviteEmail) return

    setIsInviting(true)
    try {
      const response = await fetch('/api/hero/invite-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: currentUser.id,
          inviteEmail,
          role: inviteRole
        })
      })

      if (response.ok) {
        toast.success(`Team member invited successfully!`)
        setInviteEmail('')
      } else {
        throw new Error('Failed to invite team member')
      }
    } catch (error) {
      toast.error('Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <HeroPlanGate 
      userPlanType={currentUser?.planType} 
      feature="Team Collaboration"
      onUpgrade={() => window.open('/pricing', '_blank')}
    >
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Team Collaboration</span>
            <Badge className="bg-white/20 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Hero
            </Badge>
          </CardTitle>
          <CardDescription className="text-purple-100">
            Invite teachers, therapists, and other team members
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Team Member Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="invite-role">Access Level</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Viewer - Can view accommodations</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="commenter">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Commenter - Can view and comment</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={inviteTeamMember}
              disabled={!inviteEmail || isInviting}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isInviting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Invitation...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Team Member
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </HeroPlanGate>
  )
}