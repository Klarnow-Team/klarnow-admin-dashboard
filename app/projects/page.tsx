'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Clock, AlertCircle, Circle, ChevronRight, Calendar, Mail, Package } from 'lucide-react'
import { apiService, ApiError, Project, Phase, PhaseStatus, KitType } from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kitTypeFilter, setKitTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null)
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false)
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  
  const { user } = useCurrentUser()
  const router = useRouter()

  const handleLogout = async () => {
    apiService.clearToken()
    if (typeof window !== "undefined") {
      document.cookie =
        "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    }
    router.push("/login")
    router.refresh()
  }

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiService.getProjects()
      
      if (result.success) {
        let filtered = result.data || []
        
        if (kitTypeFilter !== 'all') {
          filtered = filtered.filter(p => p.kit_type === kitTypeFilter)
        }
        
        // Note: statusFilter filtering would ideally happen on the server
        // but since getProjects returns the project list, we filter locally if needed.
        // For now, listing all projects that match the kit type.
        
        setProjects(filtered)
      } else {
        setError("Failed to fetch projects")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }, [kitTypeFilter])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Update phase status
  const updatePhaseStatus = async (projectId: string, phaseId: string, status: PhaseStatus, onUpdate?: () => void, phaseNumber?: number, phaseIdString?: string) => {
    try {
      setUpdating(phaseId)
      const result = await apiService.updatePhaseStatus(projectId, phaseId, { 
        status,
        phase_id: (phaseIdString || '') as any
      })

      if (result.success) {
        await fetchProjects()
        if (onUpdate) {
          onUpdate()
        }
        if (!onUpdate) {
          setIsPhaseDialogOpen(false)
          setSelectedPhase(null)
        }
      }
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
    itemId: string,
    isDone: boolean,
    label: string,
    onUpdate?: () => void,
    phaseNumber?: number,
    phaseIdString?: string
  ) => {
    try {
      // Optimistic update
      setProjects(prevProjects =>
        prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              phases: project.phases?.map(phase =>
                phase.id === phaseId
                  ? {
                      ...phase,
                      checklist_items: phase.checklist_items?.map(item =>
                        item.id === itemId ? { ...item, is_done: isDone } : item
                      ),
                    }
                  : phase
              ),
            }
          }
          return project
        })
      )

      const result = await apiService.updateChecklistItem(projectId, phaseId, itemId, { 
        is_done: isDone,
        label: label,
        phase_id: (phaseIdString || '') as any
      })

      if (!result.success) {
        throw new Error('Failed to update checklist item')
      }

      if (onUpdate) {
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to update checklist:', err)
      await fetchProjects()
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
      const result = await apiService.updateProject(projectId, updates)

      if (result.success) {
        await fetchProjects()
        setIsProgressDialogOpen(false)
        setSelectedProject(null)
      }
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

  return (
    <Sidebar>
      <Header onLogout={handleLogout} user={user} />
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Projects & Phases</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage client projects and track phase progress through the 14-day cycle
            </p>
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
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading projects...</div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchProjects}>Retry</Button>
              </div>
            ) : projects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No projects found.
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => {
                const phases = project.phases || []
                const currentPhase = phases.find(p => p.status === 'IN_PROGRESS') ||
                  phases.filter(p => p.status === 'DONE').pop()

                return (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">
                              {project.email || project.name || `Project ${project.id.slice(0, 8)}`}
                            </CardTitle>
                            <Badge className={project.kit_type === 'LAUNCH' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                              {project.kit_type}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {project.email || 'No email'}
                            </span>
                            {project.current_day_of_14 !== null && (
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
                              <p className="text-xs text-gray-500 ml-6">{currentPhase.day_range}</p>
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

                      <div className="grid grid-cols-4 gap-2">
                        {phases.map((phase) => (
                          <div
                            key={phase.id}
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
                              <span className="text-xs font-medium">P{phase.phase_number}</span>
                            </div>
                            <p className="text-[10px] text-gray-600 truncate">{phase.title}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          <Dialog open={isPhaseDialogOpen} onOpenChange={setIsPhaseDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedPhase ? `Phase ${selectedPhase.phase_number}: ${selectedPhase.title}` : 'Manage Phase'}
                </DialogTitle>
              </DialogHeader>

              {selectedPhase && selectedProject && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phase Status</label>
                    <Select
                      value={selectedPhase.status}
                      onValueChange={(value) =>
                        updatePhaseStatus(
                          selectedProject.id, 
                          selectedPhase.id, 
                          value as PhaseStatus,
                          undefined,
                          selectedPhase.phase_number,
                          selectedPhase.phase_id
                        )
                      }
                      disabled={!!updating}
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
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Checklist Items</label>
                    <div className="space-y-2">
                      {selectedPhase.checklist_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 rounded border hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={item.is_done}
                            onChange={(e) =>
                              updateChecklistItem(
                                selectedProject.id,
                                selectedPhase.id,
                                item.id,
                                e.target.checked,
                                item.label,
                                undefined,
                                selectedPhase.phase_number,
                                selectedPhase.phase_id
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className={`text-sm flex-1 ${item.is_done ? 'line-through text-gray-500' : ''}`}>
                            {item.label}
                          </span>
                        </div>
                      )) || <p className="text-sm text-gray-500 italic">No items.</p>}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPhaseDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Update Project Progress</DialogTitle>
              </DialogHeader>
              {selectedProject && (
                <ProgressForm
                  project={selectedProject}
                  onSave={(updates) => updateProjectProgress(selectedProject.id, updates)}
                  onCancel={() => setIsProgressDialogOpen(false)}
                  updating={updating === selectedProject.id}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </Sidebar>
  )
}

function ProgressForm({ project, onSave, onCancel, updating }: {
  project: Project,
  onSave: (updates: any) => void,
  onCancel: () => void,
  updating: boolean
}) {
  const [day, setDay] = useState(project.current_day_of_14 || 1)
  const [nextFromUs, setNextFromUs] = useState(project.next_from_us || '')
  const [nextFromYou, setNextFromYou] = useState(project.next_from_you || '')

  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault()
      onSave({ current_day_of_14: day, next_from_us: nextFromUs, next_from_you: nextFromYou })
    }}>
      <div>
        <label className="text-sm font-medium mb-1 block">Current Day (1-14)</label>
        <Input type="number" min="1" max="14" value={day} onChange={(e) => setDay(parseInt(e.target.value) || 1)} required />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Next from Klarnow</label>
        <Textarea value={nextFromUs} onChange={(e) => setNextFromUs(e.target.value)} rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Next from Client</label>
        <Textarea value={nextFromYou} onChange={(e) => setNextFromYou(e.target.value)} rows={3} />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={updating}>{updating ? 'Updating...' : 'Save Changes'}</Button>
      </div>
    </form>
  )
}
