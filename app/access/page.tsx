'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Shield, Plus, Edit, Trash2, Mail, User, Calendar, CheckCircle2Icon, AlertCircleIcon } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface Admin {
  id: number
  user_id: string
  email: string
  name: string
  role: string
  created_at: string
  updated_at: string
}

export default function AccessPage() {
  const { user, getCurrentUserId, isAuthenticated } = useCurrentUser()
  const supabase = createClient()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<{ id: number; email: string } | null>(null)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  })

  // Fetch admins on component mount
  useEffect(() => {
    fetchAdmins()
  }, [])

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

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/demo/admins')
      const result = await response.json()
      
      if (result.success) {
        setAdmins(result.data || [])
      } else {
        console.error('Error fetching admins:', result.error)
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        // Reset form and close dialog
        setFormData({ name: '', email: '', password: '', role: 'admin' })
        setIsDialogOpen(false)
        // Refresh admins list
        await fetchAdmins()
        showAlert('success', 'Admin created successfully!')
      } else {
        console.error('Error creating admin:', result.error)
        showAlert('error', 'Error creating admin: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating admin:', error)
      showAlert('error', 'Error creating admin')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAdmin = (admin: Admin, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAdminToDelete({ id: admin.id, email: admin.email })
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive'
      case 'admin':
        return 'default'
      case 'moderator':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Sidebar>
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
          <div className="space-y-6">
            {/* Alert Messages */}
            {alertMessage && (
              <Alert variant={alertMessage.type === 'error' ? 'destructive' : 'default'}>
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
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Access Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage admin users and their access permissions.
                </p>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#8359ee] hover:bg-[#7245e8] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Admin</DialogTitle>
                    <DialogDescription>
                      Create a new admin user with appropriate permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#8359ee] hover:bg-[#7245e8] text-white"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Admin'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Admins List */}
            <Card className="border border-gray-200 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-[#8359ee]" />
                  <span>Admin Users</span>
                </CardTitle>
                <CardDescription>
                  Manage admin users and their access levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-500">Loading admins...</div>
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
                    <p className="text-gray-500 mb-4">
                      Get started by adding your first admin user.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>{admin.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{admin.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(admin.role)}>
                                {admin.role.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {formatDate(admin.created_at)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={(e) => handleDeleteAdmin(admin, e)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
        </div>
      </main>

      {/* Delete Confirmation Modal (same style as dashboard) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-lg">
          <DialogHeader className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-50 rounded-full">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">!</span>
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Are you sure?
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm leading-relaxed">
              This action cannot be undone. All data associated with{' '}
              <span className="font-semibold text-gray-900">{adminToDelete?.email}</span>{' '}
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-6">
            <Button
              onClick={confirmDeleteAdmin}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Admin'}
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
    </Sidebar>
  )
}
