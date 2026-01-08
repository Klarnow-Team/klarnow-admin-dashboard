'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserCircle, Search, Calendar, Trash2, Eye, Mail, Package } from 'lucide-react'

import { apiService, OnboardingAnswer, KitType } from '@/lib/api'

export default function OnboardingPage() {
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAnswer, setSelectedAnswer] = useState<OnboardingAnswer | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  // Fetch onboarding answers
  const fetchOnboardingAnswers = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching onboarding answers...')
      
      const result = await apiService.getOnboardingAnswers()
      
      if (result.success) {
        setAnswers(result.data || [])
        console.log('✅ Onboarding answers loaded:', result.count || 0, 'records')
      } else {
        console.error('❌ Failed to fetch onboarding answers')
        setAnswers([])
      }
    } catch (error) {
      console.error('❌ Error fetching onboarding answers:', error)
      setAnswers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOnboardingAnswers()
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter answers based on search term
  const filteredAnswers = answers.filter(answer => {
    const searchLower = searchTerm.toLowerCase()
    const email = answer.project?.email?.toLowerCase() || ''
    const name = answer.project?.name?.toLowerCase() || ''
    const userId = answer.user_id.toLowerCase()
    const plan = answer.project?.plan?.toLowerCase() || ''
    
    return (
      email.includes(searchLower) ||
      name.includes(searchLower) ||
      userId.includes(searchLower) ||
      plan.includes(searchLower)
    )
  })

  // Handle view details
  const handleViewDetails = (answer: OnboardingAnswer) => {
    setSelectedAnswer(answer)
    setIsDetailsDialogOpen(true)
  }

  // Get plan badge color
  const getPlanBadge = (plan: KitType | string | null | undefined) => {
    if (!plan) return null
    return plan === 'LAUNCH' ? (
      <Badge className="bg-blue-100 text-blue-700">Launch</Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-700">Growth</Badge>
    )
  }

  return (
    <Sidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Onboarding Answers</h1>
            <p className="text-sm text-gray-500 mt-1">
              View all user onboarding submissions
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email, name, user ID, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Answers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Onboarding Answers</CardTitle>
            <CardDescription>
              {filteredAnswers.length} {filteredAnswers.length === 1 ? 'answer' : 'answers'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8359ee] mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-500">Loading onboarding answers...</p>
                </div>
              </div>
            ) : filteredAnswers.length === 0 ? (
              <div className="text-center py-12">
                <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No onboarding answers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S/N</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnswers.map((answer, index) => (
                      <TableRow key={answer.id}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          {answer.project?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {answer.project?.email || answer.user_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPlanBadge(answer.project?.plan)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{formatDate(answer.completed_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(answer)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Onboarding Answer Details</DialogTitle>
            <DialogDescription>
              Complete onboarding form data for this user
            </DialogDescription>
          </DialogHeader>

          {selectedAnswer && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedAnswer.project && (
                    <>
                      {selectedAnswer.project.name && (
                        <div>
                          <span className="text-gray-500">Name:</span>
                          <p className="mt-1 font-medium">{selectedAnswer.project.name}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="mt-1 font-medium">{selectedAnswer.project.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Plan:</span>
                        <div className="mt-1">{getPlanBadge(selectedAnswer.project.plan)}</div>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-gray-500">Completed At:</span>
                    <p className="mt-1 font-medium">{formatDate(selectedAnswer.completed_at)}</p>
                  </div>
                </div>
              </div>

              {/* Onboarding Steps */}
              {selectedAnswer.answers?.steps && Array.isArray(selectedAnswer.answers.steps) && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Onboarding Steps</h3>
                  {selectedAnswer.answers.steps.map((step: any, stepIndex: number) => (
                    <Card key={stepIndex} className="border-l-4 border-l-[#8359ee]">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Step {step.step_number || stepIndex + 1}: {step.title || 'Untitled Step'}
                          </CardTitle>
                          <Badge className={
                            step.status === 'DONE' ? 'bg-green-100 text-green-700' :
                            step.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {step.status || 'NOT_STARTED'}
                          </Badge>
                        </div>
                        {step.time_estimate && (
                          <CardDescription>{step.time_estimate}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {step.fields && typeof step.fields === 'object' && (
                          <div className="space-y-4">
                            {Object.entries(step.fields).map(([fieldKey, fieldValue]: [string, any]) => {
                              // Skip empty values
                              if (!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)) {
                                return null
                              }

                              // Handle different field types
                              let displayValue: any = null

                              if (Array.isArray(fieldValue)) {
                                if (fieldValue.length > 0 && typeof fieldValue[0] === 'object') {
                                  // Array of objects (e.g., social_links)
                                  displayValue = (
                                    <div className="space-y-2">
                                      {fieldValue.map((item: any, idx: number) => (
                                        <div key={idx} className="pl-4 border-l-2 border-gray-200">
                                          {Object.entries(item).map(([k, v]: [string, any]) => (
                                            <div key={k} className="text-sm">
                                              <span className="font-medium capitalize">{k.replace('_', ' ')}:</span>{' '}
                                              <span className="text-gray-700">{String(v || 'N/A')}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  )
                                } else {
                                  // Array of strings
                                  displayValue = (
                                    <ul className="list-disc list-inside space-y-1">
                                      {fieldValue.map((item: string, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-700">{item}</li>
                                      ))}
                                    </ul>
                                  )
                                }
                              } else if (typeof fieldValue === 'object' && fieldValue !== null) {
                                displayValue = (
                                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(fieldValue, null, 2)}
                                  </pre>
                                )
                              } else {
                                displayValue = <span className="text-gray-700">{String(fieldValue)}</span>
                              }

                              return (
                                <div key={fieldKey} className="border-b pb-3 last:border-b-0 last:pb-0">
                                  <h4 className="font-medium text-sm text-gray-700 mb-1 capitalize">
                                    {fieldKey.replace(/_/g, ' ')}
                                  </h4>
                                  <div className="text-sm">{displayValue}</div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {step.required_fields_total && (
                          <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                            Completed: {step.required_fields_completed || 0} / {step.required_fields_total} required fields
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}

