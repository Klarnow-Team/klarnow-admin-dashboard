'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Activity, Settings, Menu, X, Bell, MessageSquare, Download, Smartphone, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Activity',
    href: '/activity',
    icon: Activity,
  },
  {
    name: 'Access',
    href: '/access',
    icon: Shield,
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
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
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
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center justify-center flex-1">
              <img 
                src="/assets/klarnow.svg" 
                alt="Klarnow" 
                className="h-4 w-auto"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">MENU</p>
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
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">GENERAL</p>
              <Link
                href="/settings"
                className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <Settings className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                Settings
              </Link>
              <Link
                href="/help"
                className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <MessageSquare className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                Help
              </Link>
            </div>
          </nav>

          {/* Mobile App Promotion */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-linear-to-br from-[#8359ee] to-[#6b46c1] rounded-xl p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-2">
                  <Smartphone className="h-5 w-5" />
                  <span className="text-sm font-semibold">Download our Mobile App</span>
                </div>
                <p className="text-xs text-white/80 mb-3">Get the full experience on your mobile device</p>
                <Button size="sm" variant="secondary" className="bg-white text-[#8359ee] hover:bg-gray-100">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
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
