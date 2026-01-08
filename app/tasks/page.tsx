'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  ClipboardList, 
  Search, 
  Calendar, 
  Plus, 
  Eye, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Mail, 
  Upload, 
  FileText, 
  Send, 
  Trash2, 
  Download, 
  ExternalLink,
  Briefcase
} from 'lucide-react'
import { apiService, Task, TaskStatus, TaskType, Project } from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useRouter } from 'next/navigation'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)

  const [taskForm, setTaskForm] = useState({
    project_id: '',
    title: '',
    description: '',
    type: 'OTHER' as TaskType,
    status: 'PENDING' as TaskStatus,
    due_date: '',
  })
  
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

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiService.getTasks({
        status: statusFilter !== 'all' ? (statusFilter as TaskStatus) : undefined,
        type: typeFilter !== 'all' ? (typeFilter as TaskType) : undefined,
      })

      if (result.success) {
        setTasks(result.data || [])
      }
    } catch (error) {
      console.error('❌ Error fetching tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter])

  // Fetch projects for task assignment
  const fetchProjects = async () => {
    try {
      const result = await apiService.getProjects()
      if (result.success) {
        setProjects(result.data || [])
      }
    } catch (error) {
      console.error('❌ Error fetching projects:', error)
      setProjects([])
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [fetchTasks])

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => {
    const searchLower = searchTerm.toLowerCase()
    const title = task.title?.toLowerCase() || ''
    const description = task.description?.toLowerCase() || ''
    const projectName = task.project?.name?.toLowerCase() || ''
    const projectEmail = task.project?.email?.toLowerCase() || ''

    return (
      title.includes(searchLower) ||
      description.includes(searchLower) ||
      projectName.includes(searchLower) ||
      projectEmail.includes(searchLower)
    )
  })

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get status badge
  const getStatusBadge = (status: TaskStatus) => {
    const badges = {
      PENDING: <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>,
      IN_PROGRESS: <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>,
      COMPLETED: <Badge className="bg-green-100 text-green-700">Completed</Badge>,
      CANCELLED: <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>,
    }
    return badges[status] || badges.PENDING
  }

  // Get type icon
  const getTypeIcon = (type: TaskType) => {
    const icons = {
      UPLOAD_FILE: <Upload className="h-4 w-4" />,
      SEND_INFO: <Send className="h-4 w-4" />,
      PROVIDE_DETAILS: <FileText className="h-4 w-4" />,
      REVIEW: <Eye className="h-4 w-4" />,
      OTHER: <ClipboardList className="h-4 w-4" />,
    }
    return icons[type] || icons.OTHER
  }

  // Handle create task
  const handleCreateTask = async () => {
    if (!taskForm.project_id || !taskForm.title) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const result = await apiService.createTask({
        ...taskForm,
        due_date: taskForm.due_date || undefined,
      })

      if (result.success) {
        setIsTaskDialogOpen(false)
        setTaskForm({
          project_id: '',
          title: '',
          description: '',
          type: 'OTHER',
          status: 'PENDING',
          due_date: '',
        })
        await fetchTasks()
      } else {
        throw new Error('Failed to create task')
      }
    } catch (error: any) {
      console.error('❌ Error creating task:', error)
      alert(`Failed to create task: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Handle update task status
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const result = await apiService.updateTask(taskId, { status: newStatus })
      if (result.success) {
        await fetchTasks()
      }
    } catch (error: any) {
      console.error('❌ Error updating task status:', error)
      alert(`Failed to update task: ${error.message}`)
    }
  }

  // Handle delete task
  const confirmDelete = async () => {
    if (!taskToDelete) return

    try {
      const result = await apiService.deleteTask(taskToDelete.id)
      if (result.success) {
        setIsDeleteModalOpen(false)
        setTaskToDelete(null)
        await fetchTasks()
      }
    } catch (error: any) {
      console.error('❌ Error deleting task:', error)
      alert(`Failed to delete task: ${error.message}`)
    }
  }

  return (
    <Sidebar>
      <Header onLogout={handleLogout} user={user} />
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 border-none">Tasks Management</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Assign and track tasks for client project requirements
              </p>
            </div>
            <Button onClick={() => setIsTaskDialogOpen(true)} className="gap-2 bg-[#8359ee] hover:bg-[#7245e8]">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-gray-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="UPLOAD_FILE">Upload File</SelectItem>
                    <SelectItem value="SEND_INFO">Send Info</SelectItem>
                    <SelectItem value="PROVIDE_DETAILS">Provide Details</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table */}
          <Card className="border-gray-100 shadow-sm overflow-hidden text-[#111]">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                  Loading tasks...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-20 text-gray-500 italic">
                  No tasks found.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Task</TableHead>
                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Due Date</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div className="font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{task.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{task.project?.email || task.project_id}</div>
                          <div className="text-[10px] text-gray-500 flex items-center mt-1">
                            <Briefcase className="h-3 w-3 mr-1" /> {task.project?.name || 'Active Project'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            {getTypeIcon(task.type)}
                            {task.type.replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(task.status)}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(task.due_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedTask(task); setIsDetailsDialogOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {task.status !== 'COMPLETED' && (
                              <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { setTaskToDelete(task); setIsDeleteModalOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Task Creation Modal */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Client Task</DialogTitle>
            <DialogDescription>Assign a new requirement to a client project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={taskForm.project_id} onValueChange={(v) => setTaskForm({ ...taskForm, project_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.email} ({p.name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="e.g. Upload Brand Assets" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="What needs to be done?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={taskForm.type} onValueChange={(v) => setTaskForm({ ...taskForm, type: v as TaskType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPLOAD_FILE">Upload File</SelectItem>
                    <SelectItem value="SEND_INFO">Send Info</SelectItem>
                    <SelectItem value="PROVIDE_DETAILS">Provide Details</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={saving} className="bg-[#8359ee] hover:bg-[#7245e8]">
              {saving ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</span>
                  <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                    {getTypeIcon(selectedTask.type)}
                    {selectedTask.type.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{selectedTask.title}</p>
              </div>

              {selectedTask.description && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</span>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}

              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client Attachments</span>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedTask.attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded text-blue-600">
                             <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Attachment {i+1}</p>
                            <p className="text-[10px] text-gray-500">{att.content_type} • {(att.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={att.url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                               <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-[11px] text-gray-500">
                <div>Created: {formatDate(selectedTask.created_at)}</div>
                <div>Last Updated: {formatDate(selectedTask.updated_at)}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Task?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Are you sure you want to delete this task?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
