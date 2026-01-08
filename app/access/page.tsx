'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Shield, Plus, Edit, Trash2, Mail, User, Calendar, CheckCircle2Icon, AlertCircleIcon, ShieldCheck } from 'lucide-react'
import { apiService, AdminUser } from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useRouter } from 'next/navigation'

export default function AccessPage() {
  const { user } = useCurrentUser()
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<{ id: string; email: string } | null>(null)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    role: 'admin'
  })

  // Fetch admins on component mount
  useEffect(() => {
    fetchAdmins()
  }, [])

  // Auto-hide alerts
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  const handleLogout = async () => {
    apiService.clearToken()
    if (typeof window !== "undefined") {
      document.cookie =
        "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    }
    router.push("/login")
    router.refresh()
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertMessage({ type, message })
  }

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const result = await apiService.getAdmins()
      
      if (result.success) {
        setAdmins(result.data || [])
      }
    } catch (error) {
      console.error('❌ Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await apiService.createAdmin({
        email: formData.email,
        role: formData.role
      })

      if (result.success) {
        setFormData({ email: '', role: 'admin' })
        setIsDialogOpen(false)
        await fetchAdmins()
        showAlert('success', 'Admin created successfully!')
      } else {
        showAlert('error', 'Error creating admin')
      }
    } catch (error: any) {
      console.error('Error creating admin:', error)
      showAlert('error', error.message || 'Error creating admin')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Sidebar>
      <Header onLogout={handleLogout} user={user} />
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
          <div className="space-y-6">
            {alertMessage && (
              <Alert variant={alertMessage.type === 'error' ? 'destructive' : 'default'}>
                {alertMessage.type === 'success' ? <CheckCircle2Icon className="h-4 w-4" /> : <AlertCircleIcon className="h-4 w-4" />}
                <AlertTitle>{alertMessage.type === 'success' ? 'Success!' : 'Error'}</AlertTitle>
                <AlertDescription>{alertMessage.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Access Management</h1>
                <p className="text-xs text-gray-500 mt-0.5">Manage platform administrators and roles</p>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#8359ee] hover:bg-[#7245e8]">
                    <Plus className="h-4 w-4 mr-2" /> Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Admin</DialogTitle>
                    <DialogDescription>Grant administrative access to a new user.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="admin@klarnow.co.uk"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </form>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#8359ee] hover:bg-[#7245e8]">
                      {isSubmitting ? 'Creating...' : 'Create Admin'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-gray-100 shadow-sm overflow-hidden text-[#111]">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center py-20 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                    Loading admins...
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 italic">No admin users found.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Admin</TableHead>
                        <TableHead className="font-semibold text-gray-700">Role</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700">Added</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">{admin.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize bg-blue-50 text-blue-700 border-none font-normal px-2">
                              {admin.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={`h-1.5 w-1.5 rounded-full ${admin.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-xs text-gray-600">{admin.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {formatDate(admin.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="sm" className="text-gray-400">
                               <Edit className="h-4 w-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </Sidebar>
  )
}
