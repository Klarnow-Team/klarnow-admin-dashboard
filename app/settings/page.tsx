'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, User, Bell, Shield, Palette, Save } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export default function SettingsPage() {
  const { user, getCurrentUserId, isAuthenticated } = useCurrentUser()
  
  const [formData, setFormData] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    notifications: 'all',
    theme: 'light',
    language: 'en'
  })

  // Update form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
      console.log('🎯 [Settings] User ID available:', user.id)
    }
  }, [user])

  const handleSave = () => {
    // Handle save logic here
    console.log('Settings saved:', formData)
    console.log('🎯 [Settings] Saving with user ID:', getCurrentUserId())
  }

  return (
    <Sidebar>
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your account and application preferences.
              </p>
            </div>

            {/* Settings Form */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Account Settings */}
              <Card className="border border-gray-200 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-[#8359ee]" />
                    <span>Account Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card className="border border-gray-200 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-[#8359ee]" />
                    <span>Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Configure your notification and display preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notifications">Notifications</Label>
                    <Select value={formData.notifications} onValueChange={(value) => setFormData({ ...formData, notifications: value })}>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select notification preference" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="all">All Notifications</SelectItem>
                        <SelectItem value="important">Important Only</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={formData.theme} onValueChange={(value) => setFormData({ ...formData, theme: value })}>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Settings */}
            <Card className="border border-gray-200 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-[#8359ee]" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>
                  Manage your security preferences and password settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card className="border border-gray-200 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-[#8359ee]" />
                  <span>Appearance</span>
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Appearance Customization</h3>
                  <p className="text-gray-500 mb-4">
                    Customize colors, fonts, and layout preferences
                  </p>
                  <Button variant="outline">
                    <Palette className="h-4 w-4 mr-2" />
                    Customize Appearance
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-[#8359ee] hover:bg-[#7245e8] text-white">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
    </Sidebar>
  )
}
