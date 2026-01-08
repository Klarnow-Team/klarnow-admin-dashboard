'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Play, Pause, Square, Plus, Video, Zap, Globe, Settings, Sun, Link, User } from 'lucide-react'
import { Project } from '@/lib/api'
import LinkNext from 'next/link'

interface DashboardSectionsProps {
  projects: Project[]
}

export default function DashboardSections({ projects }: DashboardSectionsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column - Analytics and Reminders */}
      <div className="lg:col-span-2 space-y-6">
        {/* Reminders */}
        <Card className="border border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Calendar className="h-4 w-4 text-[#8359ee]" />
              <span>Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">Meeting with Klarnow Team</h4>
                  <p className="text-sm text-gray-600">Checking project onboarding status</p>
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
              <CardTitle className="text-base font-semibold">Active Projects</CardTitle>
              <LinkNext href="/projects">
                <Button variant="outline" size="sm" className="text-xs h-8">
                  View All
                </Button>
              </LinkNext>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm italic">
                  No active projects found.
                </div>
              ) : (
                projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-[#8359ee]/10 rounded-lg">
                        <Zap className="h-4 w-4 text-[#8359ee]" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{project.email || project.name || 'Unnamed Project'}</p>
                        <p className="text-[11px] text-gray-500">Kit: {project.kit_type} • Day {project.current_day_of_14 || 1}/14</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-normal uppercase py-0 h-5">
                      {project.onboarding_percent}% complete
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Team and Progress */}
      <div className="space-y-6">
        {/* Project Progress Tracker */}
        <Card className="border border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
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
                    strokeDasharray="65, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">65%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">On-track for Q1 Goals</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-[#8359ee] rounded-full"></div>
                    <span className="text-gray-600">Completed Projects</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Active</span>
                  </div>
                  <span className="font-semibold">{projects.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Time Tracker */}
        <Card className="bg-linear-to-br from-[#8359ee] to-[#6b46c1] text-white border-0 shadow-lg">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-5 w-5" />
                <span className="font-semibold">Quick Access</span>
              </div>
              <p className="text-xs text-white/80 mb-4 leading-relaxed">
                Need to update a project status? Jump directly to the project manager.
              </p>
              <LinkNext href="/projects">
                <Button size="sm" variant="secondary" className="w-full bg-white text-[#8359ee] hover:bg-white/90 border-0 font-semibold h-9">
                  Go to Projects
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </LinkNext>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
