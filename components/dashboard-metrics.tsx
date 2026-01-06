'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Package, Shield, TrendingUp } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  isPrimary?: boolean
}

function MetricCard({ title, value, description, icon: Icon, trend, isPrimary = false }: MetricCardProps) {
  return (
    <Card className={`${isPrimary ? 'bg-[#8359ee] text-white' : 'bg-white'} border border-gray-100 shadow-none`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-xs font-medium ${isPrimary ? 'text-gray-100' : 'text-gray-500'}`}>
              {title}
            </p>
            <div className={`text-2xl font-semibold mt-1.5 ${isPrimary ? 'text-white' : 'text-gray-900'}`}>
              {value}
            </div>
            {trend && (
              <div className="flex items-center mt-1.5">
                <TrendingUp className={`h-3 w-3 mr-1 ${isPrimary ? 'text-gray-200' : 'text-green-500'}`} />
                <span className={`text-[10px] ${isPrimary ? 'text-gray-200' : 'text-green-600'}`}>
                  {trend}
                </span>
              </div>
            )}
            <p className={`text-[10px] mt-1 ${isPrimary ? 'text-gray-300' : 'text-gray-400'}`}>
              {description}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${isPrimary ? 'bg-gray-200/40' : 'bg-[#8359ee]/5'}`}>
            <Icon className={`h-4 w-4 ${isPrimary ? 'text-white' : 'text-[#8359ee]'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardMetricsProps {
  quizCompletions: number
  numberOfProjects: number
  totalAdmins: number
}

export default function DashboardMetrics({ 
  quizCompletions, 
  numberOfProjects, 
  totalAdmins 
}: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title="Quiz Completions"
        value={quizCompletions.toLocaleString()}
        description="Users who completed quizzes"
        icon={CheckCircle}
        trend="+12% from last week"
        isPrimary={true}
      />
      <MetricCard
        title="Number of Projects"
        value={numberOfProjects.toLocaleString()}
        description="Total projects in system"
        icon={Package}
        trend="+8% from last month"
      />
      <MetricCard
        title="Total Admins"
        value={totalAdmins.toLocaleString()}
        description="Admin accounts in system"
        icon={Shield}
        trend="+2 this month"
      />
    </div>
  )
}
