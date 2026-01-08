'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Activity, Settings, Menu, X, Bell, MessageSquare, Download, Smartphone, Shield, BarChart3, UserCircle, FolderKanban, ClipboardList, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Leads Audit',
    href: '/leads-audit',
    icon: FileSearch,
  },
  {
    name: 'Brand Submission',
    href: '/brand-submission',
    icon: Activity,
  },
  {
    name: 'Access',
    href: '/access',
    icon: Shield,
  },
  {
    name: 'Project Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Onboarding',
    href: '/onboarding',
    icon: UserCircle,
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: ClipboardList,
  },
]

interface SidebarProps {
  children: React.ReactNode
}

export default function Sidebar({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <div className="flex items-center justify-center flex-1">
              <img 
                src="/assets/klarnow.svg" 
                alt="Klarnow" 
                className="h-5 w-auto"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-gray-400 hover:bg-gray-50"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Menu</p>
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
                      isActive
                        ? "bg-[#8359ee] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">General</p>
              <Link
                href="/settings"
                className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <Settings className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                Settings
              </Link>
            </div>
          </nav>

        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64 bg-white">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
            Admin Dashboard
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}
