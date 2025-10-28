'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, Edit, Trash2, ArrowRight, Users, Package, CheckCircle2Icon, AlertCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Sidebar from '@/components/sidebar'
import DashboardMetrics from '@/components/dashboard-metrics'
import DashboardSections from '@/components/dashboard-sections'
import Header from '@/components/header'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface Item {
  id: number
  name: string
  description: string
  status: string
  created_at: string
}

interface Admin {
  id: number
  user_id: string
  email: string
  name: string
  role: string
  created_at: string
}

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<{ id: number; email: string } | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' })
  const [adminFormData, setAdminFormData] = useState({ name: '', email: '', password: '', role: 'admin' })
  const router = useRouter()
  const supabase = createClient()

  // Dashboard metrics state
  const [dashboardMetrics, setDashboardMetrics] = useState({
    quizCompletions: 0,
    dailyActiveUsers: 0,
    totalAdmins: 0
  })

  // Use custom hook for user management
  const { user, getCurrentUserId, isAuthenticated } = useCurrentUser()

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertMessage({ type, message })
  }

  useEffect(() => {
    fetchItems()
    fetchAdmins()
    fetchQuizSubmissions()

    // Only subscribe to realtime if not in demo session
    const isDemoSession = document.cookie.includes('demo_session=active')
    
    if (!isDemoSession) {
      // Subscribe to real-time updates for items
      const itemsChannel = supabase
        .channel('items-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'items'
          },
          () => {
            console.log('🔄 Items changed, refetching...')
            fetchItems()
          }
        )
        .subscribe()

      // Subscribe to real-time updates for admins
      const adminsChannel = supabase
        .channel('admins-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admins'
          },
          () => {
            console.log('🔄 Admins changed, refetching...')
            fetchAdmins()
          }
        )
        .subscribe()

      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(itemsChannel)
        supabase.removeChannel(adminsChannel)
      }
    }
  }, [])

  // Update dashboard metrics when data changes
  useEffect(() => {
    // Calculate quiz completions (actual quiz submissions count)
    const quizCompletions = quizSubmissions.length

    // Calculate daily active users (quiz submissions created today)
    const today = new Date().toISOString().split('T')[0]
    const dailyActiveUsers = quizSubmissions.filter(submission => 
      submission.created_at && submission.created_at.startsWith(today)
    ).length

    // Total admins count
    const totalAdmins = admins.length

    const finalMetrics = {
      quizCompletions: quizCompletions,
      dailyActiveUsers: dailyActiveUsers,
      totalAdmins: totalAdmins
    }

    console.log('📊 Dashboard metrics calculated:', finalMetrics)
    console.log('📊 Quiz submissions count:', quizSubmissions.length)

    setDashboardMetrics(finalMetrics)
  }, [items, admins, quizSubmissions])

  // Log when user ID becomes available
  useEffect(() => {
    if (user?.id) {
      console.log('🎯 [Dashboard] User ID is now available:', user.id)
      console.log('🎯 [Dashboard] Current user data:', {
        name: user.name,
        email: user.email,
        id: user.id
      })
    }
  }, [user])

  const fetchItems = async () => {
    try {
      // Check if demo session is active
      const demoSession = document.cookie.includes('demo_session=active')
      
      if (demoSession) {
        // Use API route for demo user
        const response = await fetch('/api/demo/items')
        const result = await response.json()
        if (result.success) {
          setItems(result.data || [])
        }
      } else {
        // Use Supabase directly for authenticated users
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setItems(data || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdmins = async () => {
    try {
      console.log('🔍 Fetching admins...')
      
      // Check if demo session is active
      const demoSession = document.cookie.includes('demo_session=active')
      console.log('🔐 Demo session active:', demoSession)
      
      if (demoSession) {
        // Use API route for demo user with cache busting
        console.log('📡 Using demo API route...')
        const response = await fetch('/api/demo/admins', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store',
          }
        })
        const result = await response.json()
        console.log('📦 Demo API response:', result)
        
        if (result.success) {
          console.log('✅ Admins fetched successfully:', result.data)
          setAdmins(result.data || [])
        } else {
          console.error('❌ Failed to fetch admins from demo API:', result.error)
        }
      } else {
        // Use Supabase directly for authenticated users
        console.log('📡 Using Supabase directly...')
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Supabase error:', error)
          throw error
        }
        
        console.log('✅ Admins fetched from Supabase:', data)
        setAdmins(data || [])
      }
    } catch (error) {
      console.error('❌ Error fetching admins:', error)
    }
  }

  const fetchQuizSubmissions = async () => {
    try {
      console.log('🔍 Fetching quiz submissions for dashboard...')
      
      // Check if demo session is active
      const demoSession = document.cookie.includes('demo_session=active')
      
      if (demoSession) {
        // For demo, create some sample data
        const sampleSubmissions = [
          { id: '1', full_name: 'John Doe', email: 'john@example.com', created_at: new Date().toISOString() },
          { id: '2', full_name: 'Jane Smith', email: 'jane@example.com', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: '3', full_name: 'Bob Johnson', email: 'bob@example.com', created_at: new Date(Date.now() - 7200000).toISOString() }
        ]
        setQuizSubmissions(sampleSubmissions)
        console.log('✅ Demo quiz submissions set:', sampleSubmissions.length)
      } else {
        // Use Supabase directly for authenticated users
        const { data, error } = await supabase
          .from('quiz_submissions')
          .select('id, full_name, email, created_at')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Error fetching quiz submissions:', error)
          // Set empty array on error
          setQuizSubmissions([])
          return
        }
        
        console.log('✅ Quiz submissions fetched from Supabase:', data?.length || 0, 'records')
        setQuizSubmissions(data || [])
      }
    } catch (error) {
      console.error('❌ Error fetching quiz submissions:', error)
      setQuizSubmissions([])
    }
  }

  const handleCreateAdmin = async () => {
    try {
      console.log('🔨 Creating admin with data:', adminFormData)
      console.log('🔨 Current user ID:', getCurrentUserId())
      
      const adminDataWithCreator = {
        ...adminFormData,
        created_by: getCurrentUserId() // Add creator tracking
      }
      
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminDataWithCreator),
      })

      const result = await response.json()
      console.log('📦 Create admin response:', result)

      if (!response.ok) {
        console.error('❌ Failed to create admin:', result.error)
        showAlert('error', result.error || 'Failed to create admin')
        return
      }

      console.log('✅ Admin created successfully')
      setIsAdminModalOpen(false)
      setAdminFormData({ name: '', email: '', password: '', role: 'admin' })
      
      // Refresh admins list
      console.log('🔄 Refreshing admins list...')
      fetchAdmins()
      
      showAlert('success', 'Admin created successfully!')
    } catch (error) {
      console.error('❌ Error creating admin:', error)
      showAlert('error', 'Failed to create admin')
    }
  }

  const handleDeleteAdmin = (admin: Admin, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🗑️ Delete button clicked for admin:', admin.email)
    setAdminToDelete({ id: admin.id, email: admin.email })
    console.log('🔘 Opening delete modal...')
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return

    try {
      console.log('🗑️ Deleting admin:', adminToDelete)

      const demoSession = document.cookie.includes('demo_session=active')
      
      if (demoSession) {
        // For demo session, use API route
        const response = await fetch(`/api/demo/admins/${adminToDelete.id}`, {
          method: 'DELETE',
        })
        
        console.log('📦 Delete response status:', response.status)
        
        let result
        const text = await response.text()
        console.log('📦 Delete response text:', text)
        
        try {
          result = JSON.parse(text)
        } catch (e) {
          // If not JSON, use the text
          if (response.ok && !text) {
            result = { success: true }
          } else {
            throw new Error(text || 'Failed to delete admin')
          }
        }
        
        if (!response.ok) {
          throw new Error(result.error || text || 'Failed to delete admin')
        }
        
      } else {
        // Use Supabase directly for authenticated users
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('id', adminToDelete.id)

        if (error) throw error
      }

      console.log('✅ Admin deleted successfully')
      setIsDeleteModalOpen(false)
      setAdminToDelete(null)
      fetchAdmins()
      showAlert('success', 'Admin deleted successfully!')
    } catch (error: any) {
      console.error('❌ Error deleting admin:', error)
      showAlert('error', `Failed to delete admin: ${error.message}`)
    }
  }

  const cancelDeleteAdmin = () => {
    setIsDeleteModalOpen(false)
    setAdminToDelete(null)
  }

  const handleCreate = async () => {
    try {
      console.log('🔨 Creating item with data:', formData)
      console.log('🔨 Current user ID:', getCurrentUserId())
      
      const itemDataWithCreator = {
        ...formData,
        created_by: getCurrentUserId() // Add creator tracking
      }
      
      const demoSession = document.cookie.includes('demo_session=active')
      
      if (demoSession) {
        // Use API route for demo user
        const response = await fetch('/api/demo/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemDataWithCreator),
        })
        const result = await response.json()
        if (!result.success) throw new Error(result.error)
      } else {
        // Use Supabase directly for authenticated users
        const { error } = await supabase
          .from('items')
          .insert([itemDataWithCreator])
        if (error) throw error
      }
      
      setIsModalOpen(false)
      setFormData({ name: '', description: '', status: 'active' })
      fetchItems()
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingItem) return

    try {
      console.log('🔨 Updating item with data:', formData)
      console.log('🔨 Current user ID:', getCurrentUserId())
      
      const itemDataWithUpdater = {
        ...formData,
        updated_by: getCurrentUserId() // Add updater tracking
      }
      
      const demoSession = document.cookie.includes('demo_session=active')
      
      if (demoSession) {
        // Use API route for demo user
        const response = await fetch(`/api/demo/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemDataWithUpdater),
        })
        const result = await response.json()
        if (!result.success) throw new Error(result.error)
      } else {
        // Use Supabase directly for authenticated users
        const { error } = await supabase
          .from('items')
          .update(itemDataWithUpdater)
          .eq('id', editingItem.id)
        if (error) throw error
      }
      
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ name: '', description: '', status: 'active' })
      fetchItems()
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const demoSession = document.cookie.includes('demo_session=active')
      
      if (demoSession) {
        // Use API route for demo user
        const response = await fetch(`/api/demo/items/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!result.success) throw new Error(result.error)
      } else {
        // Use Supabase directly for authenticated users
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', id)
        if (error) throw error
      }
      
      fetchItems()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({ name: item.name, description: item.description, status: item.status })
    setIsModalOpen(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({ name: '', description: '', status: 'active' })
    setIsModalOpen(true)
  }

  return (
    <Sidebar>
      {/* Header */}
      <Header onLogout={handleLogout} user={user} />
      
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
          {/* Alert Messages */}
          {alertMessage && (
            <Alert variant={alertMessage.type === 'error' ? 'destructive' : 'default'} className="mb-6">
              {alertMessage.type === 'success' ? (
                <CheckCircle2Icon className="h-4 w-4" />
              ) : (
                <AlertCircleIcon className="h-4 w-4" />
              )}
              <AlertTitle>
                {alertMessage.type === 'success' ? 'Success!' : 'Error'}
              </AlertTitle>
              <AlertDescription>
                {alertMessage.message}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Plan, prioritize, and accomplish your tasks with ease.
            </p>
          </div>

          {/* Metrics Cards */}
          <DashboardMetrics
            quizCompletions={dashboardMetrics.quizCompletions}
            dailyActiveUsers={dashboardMetrics.dailyActiveUsers}
            totalAdmins={dashboardMetrics.totalAdmins}
          />

          {/* Additional Dashboard Sections */}
          <div className="mt-8">
            <DashboardSections />
          </div>

          {/* Admins Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-foreground">Admin Management</h2>
              <Button onClick={() => setIsAdminModalOpen(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add New Admin</span>
              </Button>
            </div>

            {/* Admins List */}
            {admins.length === 0 ? (
              <Card className="border border-gray-200 shadow-none">
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No admins found. Create your first admin!</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-gray-200 shadow-none">
                <CardHeader>
                  <CardDescription>
                    Total Admins: <span className="font-semibold">{admins.length}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.name}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Badge variant="default">{admin.role}</Badge>
                          </TableCell>
                          <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              onClick={(e) => handleDeleteAdmin(admin, e)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Item Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Create New Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Item name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <textarea
                id="item-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
                placeholder="Item description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingItem(null)
                setFormData({ name: '', description: '', status: 'active' })
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingItem ? handleUpdate : handleCreate}>
              <span>{editingItem ? 'Update' : 'Create'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-lg">
          <DialogHeader className="text-center space-y-4">
            {/* Warning Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-50 rounded-full">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">!</span>
              </div>
            </div>
            
            {/* Title */}
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Are you sure?
            </DialogTitle>
            
            {/* Description */}
            <DialogDescription className="text-gray-600 text-sm leading-relaxed">
              This action cannot be undone. All data associated with{' '}
              <span className="font-semibold text-gray-900">{adminToDelete?.email}</span>{' '}
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          {/* Action Buttons - Stacked */}
          <div className="space-y-3 mt-6">
            <Button
              onClick={confirmDeleteAdmin}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg"
            >
              Delete Admin
            </Button>
            <Button
              variant="outline"
              onClick={cancelDeleteAdmin}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Modal */}
      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                type="text"
                value={adminFormData.name}
                onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                placeholder="Admin name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                placeholder="Password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-role">Role</Label>
              <Select value={adminFormData.role} onValueChange={(value) => setAdminFormData({ ...adminFormData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdminModalOpen(false)
                setAdminFormData({ name: '', email: '', password: '', role: 'admin' })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin}>
              <span>Create Admin</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
