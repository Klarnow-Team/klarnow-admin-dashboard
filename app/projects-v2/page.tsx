'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Clock, AlertCircle, Circle, ChevronRight, Calendar, Mail, Package, RefreshCw } from 'lucide-react'
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
  email: string | null
  phases_state?: PhasesState | null
}

interface ProjectWithPhases extends Project {
  phases: MergedPhase[]
}

export default function ProjectsPageV2() {
  const [projects, setProjects] = useState<ProjectWithPhases[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kitTypeFilter, setKitTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<ProjectWithPhases | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<MergedPhase | null>(null)
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false)
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  // Fetch projects with phases state
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (kitTypeFilter !== 'all') {
        params.append('kit_type', kitTypeFilter)
      }

      const response = await fetch(`/api/projects/clients?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Merge structure with state for each project
      const projectsWithPhases: ProjectWithPhases[] = (data.clients || []).map((project: Project) => {
        const structure = getPhaseStructureForKitType(project.kit_type)
        const phases = mergePhaseStructureWithState(structure, project.phases_state || null)
        
        return {
          ...project,
          phases,
        }
      })

      // Apply status filter if needed
      let filteredProjects = projectsWithPhases
      if (statusFilter !== 'all') {
        filteredProjects = projectsWithPhases.filter(project =>
          project.phases.some(phase => phase.status === statusFilter)
        )
      }

      setProjects(filteredProjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }, [kitTypeFilter, statusFilter])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Update phase status
  const updatePhaseStatus = async (projectId: string, phaseId: string, status: PhaseStatus) => {
    try {
      setUpdating(phaseId)
      const response = await fetch(`/api/projects/${projectId}/phases-state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phase_id: phaseId, status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update phase')
      }

      await fetchProjects()
      setIsPhaseDialogOpen(false)
      setSelectedPhase(null)
    } catch (err) {
      console.error('Failed to update phase:', err)
      alert(err instanceof Error ? err.message : 'Failed to update phase status')
    } finally {
      setUpdating(null)
    }
  }

  // Update checklist item
  const updateChecklistItem = async (
    projectId: string,
    phaseId: string,
    checklistLabel: string,
    isDone: boolean
  ) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases-state`, {
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

      await fetchProjects()
    } catch (err) {
      console.error('Failed to update checklist:', err)
      alert(err instanceof Error ? err.message : 'Failed to update checklist item')
    }
  }

  // Update project progress
  const updateProjectProgress = async (
    projectId: string,
    updates: {
      current_day_of_14?: number
      next_from_us?: string
      next_from_you?: string
    }
  ) => {
    try {
      setUpdating(projectId)
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update project')
      }

      await fetchProjects()
      setIsProgressDialogOpen(false)
      setSelectedProject(null)
    } catch (err) {
      console.error('Failed to update project:', err)
      alert(err instanceof Error ? err.message : 'Failed to update project progress')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'WAITING_ON_CLIENT':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
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
        <div className="text-center text-gray-500">Loading projects...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">Error: {error}</div>
        <Button onClick={fetchProjects} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Projects & Phases</h1>
          <p className="text-sm text-gray-600">
            Manage client projects and track phase progress through the 14-day cycle
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProjects}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <Select value={kitTypeFilter} onValueChange={setKitTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kit Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Kit Types</SelectItem>
            <SelectItem value="LAUNCH">LAUNCH</SelectItem>
            <SelectItem value="GROWTH">GROWTH</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Phase Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="WAITING_ON_CLIENT">Waiting on Client</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No projects found. Projects will appear here after clients complete onboarding.
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            const currentPhase = project.phases.find(p => p.status === 'IN_PROGRESS') ||
              project.phases.filter(p => p.status === 'DONE').pop()

            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">
                          {project.email || `Project ${project.id.slice(0, 8)}`}
                        </CardTitle>
                        <Badge className={project.kit_type === 'LAUNCH' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                          {project.kit_type}
                        </Badge>
                        {project.onboarding_finished && (
                          <Badge className="bg-green-100 text-green-700">Onboarding Complete</Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {project.email || 'No email'}
                        </span>
                        {project.current_day_of_14 && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Day {project.current_day_of_14} of 14
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {project.onboarding_percent}% complete
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project)
                        setIsProgressDialogOpen(true)
                      }}
                    >
                      Update Progress
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Current Phase Info */}
                  {currentPhase && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(currentPhase.status)}
                            <span className="font-medium text-sm">
                              Phase {currentPhase.phase_number}: {currentPhase.title}
                            </span>
                            <Badge className={`text-xs ${getStatusBadge(currentPhase.status)}`}>
                              {currentPhase.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {currentPhase.subtitle && (
                            <p className="text-xs text-gray-600 ml-6">{currentPhase.subtitle}</p>
                          )}
                          <p className="text-xs text-gray-500 ml-6 mt-1">{currentPhase.day_range}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project)
                            setSelectedPhase(currentPhase)
                            setIsPhaseDialogOpen(true)
                          }}
                        >
                          Manage <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Next Actions */}
                  {(project.next_from_us || project.next_from_you) && (
                    <div className="mb-4 space-y-2">
                      {project.next_from_us && (
                        <div className="text-xs">
                          <span className="font-medium text-gray-700">Next from us: </span>
                          <span className="text-gray-600">{project.next_from_us}</span>
                        </div>
                      )}
                      {project.next_from_you && (
                        <div className="text-xs">
                          <span className="font-medium text-gray-700">Next from you: </span>
                          <span className="text-gray-600">{project.next_from_you}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Phases Overview */}
                  <div className="grid grid-cols-4 gap-2">
                    {project.phases.map((phase) => (
                      <div
                        key={phase.phase_id}
                        className={`p-2 rounded border text-center cursor-pointer transition-colors ${
                          phase.status === 'IN_PROGRESS'
                            ? 'border-blue-300 bg-blue-50'
                            : phase.status === 'DONE'
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedProject(project)
                          setSelectedPhase(phase)
                          setIsPhaseDialogOpen(true)
                        }}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {getStatusIcon(phase.status)}
                          <span className="text-xs font-medium">Phase {phase.phase_number}</span>
                        </div>
                        <p className="text-[10px] text-gray-600 truncate">{phase.title}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{phase.day_range}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Phase Management Dialog */}
      <Dialog open={isPhaseDialogOpen} onOpenChange={setIsPhaseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPhase && selectedProject
                ? `Phase ${selectedPhase.phase_number}: ${selectedPhase.title}`
                : 'Manage Phase'}
            </DialogTitle>
            <DialogDescription>
              {selectedPhase?.subtitle && selectedPhase.subtitle}
              {selectedPhase?.day_range && ` • ${selectedPhase.day_range}`}
            </DialogDescription>
          </DialogHeader>

          {selectedPhase && selectedProject && (() => {
            // Get the latest phase data from projects state
            const latestProject = projects.find(p => p.id === selectedProject.id)
            const latestPhase = latestProject?.phases.find(p => p.phase_id === selectedPhase.phase_id) || selectedPhase
            
            return (
              <div className="space-y-6">
                {/* Status Update */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Phase Status</label>
                  <Select
                    value={latestPhase.status}
                    onValueChange={(value) =>
                      updatePhaseStatus(selectedProject.id, latestPhase.phase_id, value as PhaseStatus)
                    }
                    disabled={updating === latestPhase.phase_id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="WAITING_ON_CLIENT">Waiting on Client</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  {latestPhase.started_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Started: {new Date(latestPhase.started_at).toLocaleString()}
                    </p>
                  )}
                  {latestPhase.completed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Completed: {new Date(latestPhase.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Checklist Items */}
                {latestPhase.checklist && latestPhase.checklist.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Checklist Items</label>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {latestPhase.checklist.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-2 p-3 rounded border hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.is_done}
                            onChange={(e) =>
                              updateChecklistItem(
                                selectedProject.id,
                                latestPhase.phase_id,
                                item.label,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={`text-sm flex-1 cursor-pointer ${item.is_done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhaseDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Project Progress</DialogTitle>
            <DialogDescription>
              Track the current day, next actions, phases, and checklist items for this project
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (() => {
            // Get the latest project data from state to reflect real-time updates
            const latestProject = projects.find(p => p.id === selectedProject.id) || selectedProject
            
            return (
              <ProgressForm
                project={latestProject}
                onSave={(updates) => updateProjectProgress(selectedProject.id, updates)}
                onCancel={() => setIsProgressDialogOpen(false)}
                updating={updating === selectedProject.id}
                onPhaseStatusUpdate={(phaseId, status) => updatePhaseStatus(selectedProject.id, phaseId, status)}
                onChecklistUpdate={(phaseId, label, isDone) => updateChecklistItem(selectedProject.id, phaseId, label, isDone)}
                updatingPhase={updating}
              />
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Progress Form Component
function ProgressForm({
  project,
  onSave,
  onCancel,
  updating,
  onPhaseStatusUpdate,
  onChecklistUpdate,
  updatingPhase,
}: {
  project: ProjectWithPhases
  onSave: (updates: { current_day_of_14?: number; next_from_us?: string; next_from_you?: string }) => void
  onCancel: () => void
  updating: boolean
  onPhaseStatusUpdate: (phaseId: string, status: PhaseStatus) => void
  onChecklistUpdate: (phaseId: string, label: string, isDone: boolean) => void
  updatingPhase: string | null
}) {
  const [day, setDay] = useState<number>(project.current_day_of_14 || 1)
  const [nextFromUs, setNextFromUs] = useState<string>(project.next_from_us || '')
  const [nextFromYou, setNextFromYou] = useState<string>(project.next_from_you || '')

  // Update local state when project prop changes (from real-time updates)
  useEffect(() => {
    setDay(project.current_day_of_14 || 1)
    setNextFromUs(project.next_from_us || '')
    setNextFromYou(project.next_from_you || '')
  }, [project.current_day_of_14, project.next_from_us, project.next_from_you])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      current_day_of_14: day,
      next_from_us: nextFromUs,
      next_from_you: nextFromYou,
    })
  }

  const getStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'WAITING_ON_CLIENT':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
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

  return (
    <div className="space-y-6">
      {/* 14-Day Progress Section */}
      <form onSubmit={handleSubmit} className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">14-Day Progress</h3>
        <div>
          <label className="text-sm font-medium mb-2 block">Current Day (1-14)</label>
          <Input
            type="number"
            min="1"
            max="14"
            value={day}
            onChange={(e) => setDay(parseInt(e.target.value) || 1)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Next from Us</label>
          <Textarea
            value={nextFromUs}
            onChange={(e) => setNextFromUs(e.target.value)}
            placeholder="What is Klarnow doing next?"
            rows={3}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Next from You</label>
          <Textarea
            value={nextFromYou}
            onChange={(e) => setNextFromYou(e.target.value)}
            placeholder="What does the client need to do?"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={updating}>
            Cancel
          </Button>
          <Button type="submit" disabled={updating}>
            {updating ? 'Saving...' : 'Save Progress'}
          </Button>
        </div>
      </form>

      {/* Phases Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Phases & Checklist</h3>
        <div className="space-y-4">
          {project.phases.map((phase) => {
            const completedItems = phase.checklist.filter(item => item.is_done).length
            const totalItems = phase.checklist.length
            
            return (
              <Card key={phase.phase_id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(phase.status)}
                        <CardTitle className="text-base">
                          Phase {phase.phase_number}: {phase.title}
                        </CardTitle>
                      </div>
                      {phase.subtitle && (
                        <CardDescription className="mt-1">{phase.subtitle}</CardDescription>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs ${getStatusBadge(phase.status)}`}>
                          {phase.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">{phase.day_range}</span>
                        {totalItems > 0 && (
                          <span className="text-xs text-gray-500">
                            • {completedItems}/{totalItems} tasks complete
                          </span>
                        )}
                      </div>
                    </div>
                    <Select
                      value={phase.status}
                      onValueChange={(value) => onPhaseStatusUpdate(phase.phase_id, value as PhaseStatus)}
                      disabled={updatingPhase === phase.phase_id}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="WAITING_ON_CLIENT">Waiting on Client</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Checklist Items - Always show if checklist exists */}
                  <div className="mt-4">
                    <label className="text-sm font-semibold mb-3 block text-gray-900">
                      Checklist Items
                      {phase.checklist && phase.checklist.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          ({phase.checklist.filter(item => item.is_done).length} / {phase.checklist.length} complete)
                        </span>
                      )}
                    </label>
                    {phase.checklist && phase.checklist.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {phase.checklist.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                            onClick={() => {
                              if (updatingPhase !== item.label) {
                                onChecklistUpdate(phase.phase_id, item.label, !item.is_done)
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.is_done}
                              onChange={(e) => {
                                e.stopPropagation()
                                onChecklistUpdate(phase.phase_id, item.label, e.target.checked)
                              }}
                              disabled={updatingPhase === item.label}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            />
                            <span className={`text-sm flex-1 ${item.is_done ? 'line-through text-gray-500' : 'text-gray-900 font-medium'}`}>
                              {item.label}
                            </span>
                            {updatingPhase === item.label && (
                              <RefreshCw className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic p-3">
                        No checklist items for this phase
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

