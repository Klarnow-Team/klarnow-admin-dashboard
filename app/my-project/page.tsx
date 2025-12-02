'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, AlertCircle, Circle, Calendar, ExternalLink, RefreshCw } from 'lucide-react'
import { getPhaseStructureForKitType, mergePhaseStructureWithState, type PhasesState } from '@/lib/phase-structure'

// TypeScript types
type PhaseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'

interface MergedPhase {
  phase_id: string
  phase_number: number
  title: string
  subtitle: string | null
  day_range: string
  status: PhaseStatus
  started_at: string | null
  completed_at: string | null
  checklist: Array<{ label: string; is_done: boolean }>
}

interface Project {
  id: string
  user_id: string
  kit_type: 'LAUNCH' | 'GROWTH'
  current_day_of_14: number | null
  next_from_us: string | null
  next_from_you: string | null
  onboarding_finished: boolean
  onboarding_percent: number
  created_at: string
  updated_at: string
  phases_state?: PhasesState | null
  phases: MergedPhase[]
}

export default function MyProjectPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Fetch project with phases
  const fetchProject = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/my-project/phases-state', {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`)
      }

      const data = await response.json()
      setProject(data.project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project')
      console.error('Error fetching project:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  // Update checklist item
  const updateChecklistItem = async (phaseId: string, checklistLabel: string, isDone: boolean) => {
    try {
      setUpdating(`${phaseId}-${checklistLabel}`)
      
      // Optimistic update
      setProject(prev => {
        if (!prev) return null
        
        return {
          ...prev,
          phases: prev.phases.map(phase => {
            if (phase.phase_id === phaseId) {
              return {
                ...phase,
                checklist: phase.checklist.map(item =>
                  item.label === checklistLabel ? { ...item, is_done: isDone } : item
                )
              }
            }
            return phase
          })
        }
      })

      const response = await fetch('/api/my-project/phases-state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phase_id: phaseId,
          checklist_label: checklistLabel,
          is_done: isDone,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update checklist item')
      }

      // Update successful - optimistic update already applied, no need to refresh
      // The UI is already updated, just confirm the server update succeeded
      const result = await response.json()
      console.log('✅ Checklist item updated successfully:', result)
    } catch (err) {
      console.error('Failed to update checklist:', err)
      // Revert optimistic update by refreshing from server only on error
      await fetchProject()
      
      // Show error to user
      alert(err instanceof Error ? err.message : 'Failed to update checklist item')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'WAITING_ON_CLIENT':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: PhaseStatus) => {
    const variants: Record<PhaseStatus, string> = {
      NOT_STARTED: 'bg-gray-100 text-gray-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      WAITING_ON_CLIENT: 'bg-yellow-100 text-yellow-700',
      DONE: 'bg-green-100 text-green-700',
    }
    return variants[status] || variants.NOT_STARTED
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Loading your project...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600 mb-4">Error: {error}</div>
        <Button onClick={fetchProject}>Retry</Button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No project found.</p>
            <p className="text-sm text-gray-400">
              Your project will appear here once onboarding is complete.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentPhase = project.phases.find(p => p.status === 'IN_PROGRESS') ||
    project.phases.filter(p => p.status === 'DONE').pop()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">My Project</h1>
          <p className="text-sm text-gray-600">
            Track your project progress and complete checklist items
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProject}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Project Overview */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg mb-2">
                {project.kit_type} Kit
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                {project.current_day_of_14 && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Day {project.current_day_of_14} of 14
                  </span>
                )}
                <span>Onboarding: {project.onboarding_percent}% complete</span>
              </CardDescription>
            </div>
            <Badge className={project.kit_type === 'LAUNCH' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
              {project.kit_type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Next Actions */}
          {project.next_from_us && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Next from Us</h3>
              <p className="text-sm text-blue-800">{project.next_from_us}</p>
            </div>
          )}
          {project.next_from_you && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">Next from You</h3>
              <p className="text-sm text-yellow-800">{project.next_from_you}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Phase */}
      {currentPhase && (
        <Card className="mb-6 border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              {getStatusIcon(currentPhase.status)}
              <div className="flex-1">
                <CardTitle className="text-lg">
                  Phase {currentPhase.phase_number}: {currentPhase.title}
                </CardTitle>
                {currentPhase.subtitle && (
                  <CardDescription className="mt-1">{currentPhase.subtitle}</CardDescription>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-xs ${getStatusBadge(currentPhase.status)}`}>
                    {currentPhase.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-500">{currentPhase.day_range}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Checklist Items */}
            {currentPhase.checklist && currentPhase.checklist.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-3">Checklist</h4>
                <div className="space-y-2">
                  {currentPhase.checklist.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.is_done}
                        onChange={(e) =>
                          updateChecklistItem(currentPhase.phase_id, item.label, e.target.checked)
                        }
                        disabled={updating === `${currentPhase.phase_id}-${item.label}`}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <label
                        className={`text-sm flex-1 cursor-pointer ${
                          item.is_done ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                        onClick={() => updateChecklistItem(currentPhase.phase_id, item.label, !item.is_done)}
                      >
                        {item.label}
                      </label>
                      {updating === `${currentPhase.phase_id}-${item.label}` && (
                        <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Phases Overview */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">All Phases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {project.phases.map((phase) => {
            const completedItems = phase.checklist?.filter(item => item.is_done).length || 0
            const totalItems = phase.checklist?.length || 0
            const isActive = phase.status === 'IN_PROGRESS' || phase.status === 'WAITING_ON_CLIENT'
            
            return (
              <Card
                key={phase.phase_id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive ? 'border-2 border-blue-300' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(phase.status)}
                    <CardTitle className="text-sm">
                      Phase {phase.phase_number}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">{phase.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className={`text-xs w-full justify-center ${getStatusBadge(phase.status)}`}>
                      {phase.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-gray-500">{phase.day_range}</p>
                    {totalItems > 0 && (
                      <div className="text-xs text-gray-600">
                        {completedItems} / {totalItems} tasks complete
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

