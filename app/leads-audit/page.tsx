'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Mail, Globe, Instagram, Phone, MapPin, Briefcase, DollarSign, Calendar, Eye } from 'lucide-react'
import { apiService, Lead } from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useRouter } from 'next/navigation'

export default function LeadsAuditPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  
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

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoading(true)
      const result = await apiService.getLeads()
      if (result.success) {
        setLeads(result.data || [])
      }
    } catch (error) {
      console.error('❌ Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase()
    return (
      lead.business_name?.toLowerCase().includes(searchLower) ||
      lead.first_name?.toLowerCase().includes(searchLower) ||
      lead.last_name?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.location?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <Sidebar>
      <Header onLogout={handleLogout} user={user} />
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Leads Audit</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and manage all incoming business leads and inquiries
            </p>
          </div>

          {/* Search */}
          <Card className="mb-6 border-gray-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by business, name, email or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card className="border-gray-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                  Loading leads...
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-20 text-gray-500 italic">
                  No leads found matching your criteria.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">Business</TableHead>
                      <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                      <TableHead className="font-semibold text-gray-700">Source</TableHead>
                      <TableHead className="font-semibold text-gray-700">Value</TableHead>
                      <TableHead className="font-semibold text-gray-700">Created</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div className="font-medium text-gray-900">{lead.business_name}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" /> {lead.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">{lead.first_name} {lead.last_name}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Mail className="h-3 w-3 mr-1" /> {lead.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none font-normal">
                            {lead.lead_source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-green-700">{lead.client_value}</div>
                          <div className="text-[10px] text-gray-400">Monthly Rev: {lead.monthly_revenue}</div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(lead.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedLead(lead)
                              setIsDetailsDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
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
      </main>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Lead Details</DialogTitle>
            <DialogDescription>
              Complete information provided by {selectedLead?.business_name}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <DetailGroup label="Business Name" value={selectedLead.business_name} icon={<Briefcase />} />
                <DetailGroup label="Location" value={selectedLead.location} icon={<MapPin />} />
                <DetailGroup label="Full Name" value={`${selectedLead.first_name} ${selectedLead.last_name}`} icon={<UserCircle />} />
                <DetailGroup label="Role" value={selectedLead.role} icon={<Briefcase />} />
                <DetailGroup label="Email" value={selectedLead.email} icon={<Mail />} />
                <DetailGroup label="WhatsApp" value={selectedLead.whatsapp} icon={<Phone />} />
                <DetailGroup label="Lead Source" value={selectedLead.lead_source} icon={<Globe />} />
                <DetailGroup label="Primary Issue" value={selectedLead.primary_issue} />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                <DetailGroup label="Monthly Revenue" value={selectedLead.monthly_revenue} icon={<DollarSign />} />
                <DetailGroup label="Estimated Client Value" value={selectedLead.client_value} icon={<DollarSign />} />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm text-gray-500">
                 <div className="flex items-center gap-2">
                   <Globe className="h-4 w-4" />
                   <a href={selectedLead.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                     {selectedLead.website || 'No website'}
                   </a>
                 </div>
                 <div className="flex items-center gap-2">
                   <Instagram className="h-4 w-4" />
                   <a href={`https://instagram.com/${selectedLead.instagram?.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                     {selectedLead.instagram || 'No instagram'}
                   </a>
                 </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}

function DetailGroup({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{label}</span>
      <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
        {icon && <span className="text-gray-400 h-4 w-4 flex items-center justify-center">{icon}</span>}
        {value || <span className="text-gray-300 italic">Not provided</span>}
      </div>
    </div>
  )
}

function UserCircle(props: any) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
