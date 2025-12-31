'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Play, Pause, Square, Plus, Video, Zap, Globe, Settings, Sun, Link } from 'lucide-react'

export default function DashboardSections() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column - Analytics and Reminders */}
      <div className="lg:col-span-2 space-y-6">
        {/* Reminders */}
        <Card className="border border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-[#8359ee]" />
              <span>Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">Meeting with Arc Company</h4>
                  <p className="text-sm text-gray-600">02.00 pm - 04.00 pm</p>
                </div>
                <Button className="bg-[#8359ee] hover:bg-[#7245e8] text-white">
                  <Video className="h-4 w-4 mr-2" />
                  Start Meeting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project List */}
        <Card className="border border-gray-200 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project</CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Develop API Endpoints", due: "Nov 26, 2024", icon: Zap },
                { name: "Onboarding Flow", due: "Nov 28, 2024", icon: Globe },
                { name: "Build Dashboard", due: "Nov 30, 2024", icon: Settings },
                { name: "Optimize Page Load", due: "Dec 5, 2024", icon: Sun },
                { name: "Cross-Browser Testing", due: "Dec 6, 2024", icon: Link },
              ].map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#8359ee]/10 rounded-lg">
                      <project.icon className="h-4 w-4 text-[#8359ee]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">Due date: {project.due}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Team and Progress */}
      <div className="space-y-6">
        {/* Team Collaboration */}
        <Card className="border border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle>Team Collaboration</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Empty content */}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card className="border border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#8359ee]"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="41, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">41%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Project Ended</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-[#8359ee] rounded-full"></div>
                    <span className="text-gray-600">Completed</span>
                  </div>
                  <span className="font-medium">41%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">In Progress</span>
                  </div>
                  <span className="font-medium">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-600">Pending</span>
                  </div>
                  <span className="font-medium">24%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Tracker */}
        <Card className="bg-linear-to-br from-[#8359ee] to-[#6b46c1] text-white border border-gray-200 shadow-none">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Time Tracker</span>
              </div>
              <div className="text-3xl font-bold mb-4">01:24:08</div>
              <div className="flex space-x-2">
                <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  <Pause className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  <Square className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
