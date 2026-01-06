"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  MoreHorizontal,
  Plus,
  Table as TableIcon,
  Filter,
  ArrowUpDown,
  Users,
  DollarSign,
  Tag,
  Calendar as CalendarIcon,
  Trash2,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuizSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone_number?: string | null;
  referral?: string | null;
  brand_name: string;
  logo_status: string;
  brand_goals: string[];
  online_presence: string;
  audience: string[];
  brand_style: string;
  timeline: string;
  preferred_kit?: string | null;
  created_at: string;
  updated_at: string;
}

export default function ActivityPage() {
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] =
    useState<QuizSubmission | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<QuizSubmission | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Fetch quiz submissions
  const fetchQuizSubmissions = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching quiz submissions...");

      const response = await fetch("/api/quiz-submissions");
      const result = await response.json();

      if (result.success) {
        setSubmissions(result.data || []);
        console.log(
          "✅ Quiz submissions loaded:",
          result.count || 0,
          "records"
        );
      } else {
        console.error("Error fetching quiz submissions:", result.error);
        setSubmissions([]);
      }
    } catch (error) {
      console.error("❌ Error fetching quiz submissions:", error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizSubmissions();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getInitials = (first: string, last: string) =>
    `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";

  // Handle delete submission
  const handleDelete = (submission: QuizSubmission, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSubmissionToDelete(submission);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!submissionToDelete || deleting) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `/api/quiz-submissions/${submissionToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete submission");
      }

      console.log("✅ Submission deleted successfully");
      setIsDeleteModalOpen(false);
      setSubmissionToDelete(null);
      // Refresh the list
      await fetchQuizSubmissions();
    } catch (error: any) {
      console.error("❌ Error deleting submission:", error);
      alert(`Failed to delete submission: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSubmissionToDelete(null);
  };

  // Handle view submission details
  const handleViewDetails = async (
    submission: QuizSubmission,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoadingDetail(true);
      setSelectedSubmission(null);
      setIsDetailModalOpen(true);

      // Fetch full submission details
      const response = await fetch(`/api/quiz-submissions/${submission.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSelectedSubmission(result.data);
      } else {
        console.error("Error fetching submission details:", result.error);
        // Fallback to the submission data we already have
        setSelectedSubmission(submission);
      }
    } catch (error) {
      console.error("❌ Error fetching submission details:", error);
      // Fallback to the submission data we already have
      setSelectedSubmission(submission);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSubmission(null);
  };

  // Convert submissions to CSV format
  const convertToCSV = (submissionsList: QuizSubmission[]): string => {
    // Define CSV headers
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone Number",
      "Referral Source",
      "Brand Name",
      "Logo Status",
      "Brand Goals",
      "Online Presence",
      "Target Audience",
      "Brand Style",
      "Timeline",
      "Preferred Kit",
      "Created At",
      "Updated At",
    ];

    // Convert submissions to CSV rows
    const rows = submissionsList.map((submission) => {
      return [
        submission.id,
        submission.firstName || "",
        submission.lastName || "",
        submission.email || "",
        submission.phone_number || "",
        submission.referral || "",
        submission.brand_name || "",
        submission.logo_status || "",
        Array.isArray(submission.brand_goals)
          ? submission.brand_goals.join("; ")
          : "",
        submission.online_presence || "",
        Array.isArray(submission.audience)
          ? submission.audience.join("; ")
          : "",
        submission.brand_style || "",
        submission.timeline || "",
        submission.preferred_kit || "",
        submission.created_at || "",
        submission.updated_at || "",
      ];
    });

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string): string => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    return csvContent;
  };

  // Download submissions as CSV
  const downloadCSV = (submissionsToExport?: QuizSubmission[]) => {
    try {
      // Use provided submissions or all submissions
      const submissionsToUse = submissionsToExport || submissions;

      if (submissionsToUse.length === 0) {
        alert("No submissions to export.");
        return;
      }

      const csvContent = convertToCSV(submissionsToUse);

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const filename = submissionsToExport
        ? `selected_submissions_${new Date().toISOString().split("T")[0]}.csv`
        : `submissions_${new Date().toISOString().split("T")[0]}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("✅ CSV downloaded successfully");
    } catch (error) {
      console.error("❌ Error downloading CSV:", error);
      alert("Failed to download CSV. Please try again.");
    }
  };

  // Handle checkbox selection
  const handleSelectSubmission = (submissionId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = (submissionsList: QuizSubmission[]) => {
    if (
      selectedIds.size === submissionsList.length &&
      submissionsList.every((s) => selectedIds.has(s.id))
    ) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      setSelectedIds(new Set(submissionsList.map((s) => s.id)));
    }
  };

  // Get selected submissions
  const getSelectedSubmissions = (
    submissionsList: QuizSubmission[]
  ): QuizSubmission[] => {
    return submissionsList.filter((s) => selectedIds.has(s.id));
  };

  // Bulk delete selected submissions
  const handleBulkDelete = async () => {
    const selectedSubmissions = getSelectedSubmissions(submissions);

    if (selectedSubmissions.length === 0) {
      alert("No submissions selected.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedSubmissions.length} submission(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setBulkDeleting(true);
      const deletePromises = selectedSubmissions.map((submission) =>
        fetch(`/api/quiz-submissions/${submission.id}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.allSettled(deletePromises);

      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;

      if (failed > 0) {
        alert(
          `Deleted ${succeeded} submission(s) successfully. ${failed} failed.`
        );
      } else {
        console.log(`✅ Successfully deleted ${succeeded} submission(s)`);
      }

      // Clear selection and refresh
      setSelectedIds(new Set());
      await fetchQuizSubmissions();
    } catch (error: any) {
      console.error("❌ Error bulk deleting submissions:", error);
      alert(`Failed to delete submissions: ${error.message}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Bulk export selected submissions
  const handleBulkExport = () => {
    const selectedSubmissions = getSelectedSubmissions(submissions);

    if (selectedSubmissions.length === 0) {
      alert("No submissions selected.");
      return;
    }

    downloadCSV(selectedSubmissions);
  };

  // Search filter function
  const filterBySearch = (submissionList: QuizSubmission[]) => {
    if (!searchQuery.trim()) {
      return submissionList;
    }

    const query = searchQuery.toLowerCase().trim();
    return submissionList.filter((submission) => {
      const fullName =
        `${submission.firstName} ${submission.lastName}`.toLowerCase();
      const email = submission.email.toLowerCase();
      const brandName = submission.brand_name.toLowerCase();
      const brandStyle = submission.brand_style.toLowerCase();
      const phone = submission.phone_number?.toLowerCase() || "";
      const brandGoals = submission.brand_goals.join(" ").toLowerCase();
      const audience = submission.audience.join(" ").toLowerCase();
      const preferredKit = submission.preferred_kit?.toLowerCase() || "";

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        brandName.includes(query) ||
        brandStyle.includes(query) ||
        phone.includes(query) ||
        brandGoals.includes(query) ||
        audience.includes(query) ||
        preferredKit.includes(query)
      );
    });
  };

  // Filter submissions by status
  const allSubmissions = filterBySearch(submissions);
  const inProgressSubmissions = filterBySearch(
    submissions.filter((s) => s.logo_status === "in_progress")
  );
  const completedSubmissions = filterBySearch(
    submissions.filter((s) => s.logo_status === "completed")
  );

  // Reusable table component
  const renderTable = (filteredSubmissions: QuizSubmission[]) => {
    if (loading) {
      return (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8359ee] mx-auto mb-3"></div>
          <p className="text-xs text-gray-500">Loading...</p>
        </div>
      );
    }

    if (filteredSubmissions.length === 0) {
      return (
        <div className="text-center py-10">
          <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-700 mb-1">
            No Submissions Found
          </h3>
          <p className="text-xs text-gray-400">
            Submissions will appear here as they become available.
          </p>
        </div>
      );
    }

    const allSelected =
      filteredSubmissions.length > 0 &&
      filteredSubmissions.every((s) => selectedIds.has(s.id));
    const someSelected = filteredSubmissions.some((s) => selectedIds.has(s.id));

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={allSelected}
                  ref={(input) => {
                    if (input)
                      input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={() => handleSelectAll(filteredSubmissions)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-sm">
                Name
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>Client / Company</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Status</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-sm">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>Timeline</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-sm">
                <div className="flex items-center space-x-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Category</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-sm">
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Budget</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-sm">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.map((submission, index) => (
              <TableRow
                key={submission.id}
                className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                onClick={(e) => handleViewDetails(submission, e)}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedIds.has(submission.id)}
                    onChange={() => handleSelectSubmission(submission.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900 text-sm">
                    {submission.brand_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {submission.brand_style}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index % 4 === 0
                          ? "bg-[#8359ee]"
                          : index % 4 === 1
                          ? "bg-orange-500"
                          : index % 4 === 2
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                    >
                      <span className="text-white text-xs font-semibold">
                        {getInitials(submission.firstName, submission.lastName)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        {submission.firstName} {submission.lastName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {submission.email}
                      </div>
                      {submission.phone_number && (
                        <div className="text-xs text-gray-500">
                          {submission.phone_number}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        submission.logo_status === "completed"
                          ? "bg-green-500"
                          : submission.logo_status === "in_progress"
                          ? "bg-blue-500"
                          : submission.logo_status === "pending"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <select
                      className="bg-gray-100 border-0 rounded-full px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8359ee]"
                      defaultValue={submission.logo_status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => e.stopPropagation()}
                    >
                      <option value="completed">Completed</option>
                      <option value="in_progress">In progress</option>
                      <option value="pending">Pending</option>
                      <option value="on_hold">On hold</option>
                    </select>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        submission.timeline === "urgent"
                          ? "bg-red-500"
                          : submission.timeline === "asap"
                          ? "bg-yellow-500"
                          : submission.timeline === "flexible"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-700 capitalize">
                      {submission.timeline === "urgent"
                        ? "Today"
                        : submission.timeline === "asap"
                        ? "This week"
                        : submission.timeline === "flexible"
                        ? "Next month"
                        : submission.timeline}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-0.5 max-w-[200px]">
                    {submission.brand_goals &&
                    submission.brand_goals.length > 0 ? (
                      <>
                        {submission.brand_goals
                          .slice(0, 3)
                          .map((goal, goalIndex) => (
                            <Badge
                              key={goalIndex}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200 font-normal leading-tight"
                            >
                              {goal}
                            </Badge>
                          ))}
                        {submission.brand_goals.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200 font-normal"
                          >
                            +{submission.brand_goals.length - 3}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium text-gray-900">
                    {submission.preferred_kit || "TBD"}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={(e) => handleDelete(submission, e)}
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7 px-2"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Sidebar>
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Activity
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Monitor submissions and projects
                </p>
              </div>
              <Button
                onClick={() => downloadCSV()}
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3"
                disabled={loading || submissions.length === 0}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export CSV
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="brand-submissions" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 h-9">
                <TabsTrigger
                  value="brand-submissions"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:text-gray-900"
                >
                  Brand Submissions
                  <Badge
                    variant="secondary"
                    className="ml-1.5 text-[10px] px-1.5 py-0"
                  >
                    {allSubmissions.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="in-progress"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:text-gray-900"
                >
                  In Progress
                  <Badge
                    variant="secondary"
                    className="ml-1.5 text-[10px] px-1.5 py-0"
                  >
                    {inProgressSubmissions.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:text-gray-900"
                >
                  Completed
                  <Badge
                    variant="secondary"
                    className="ml-1.5 text-[10px] px-1.5 py-0"
                  >
                    {completedSubmissions.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Brand Submissions Tab */}
              <TabsContent value="brand-submissions" className="mt-6">
                <div className="space-y-4">
                  {/* Bulk Actions Toolbar */}
                  {selectedIds.size > 0 && (
                    <div className="bg-[#8359ee] text-white p-3 rounded-md flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">
                          {selectedIds.size} item
                          {selectedIds.size !== 1 ? "s" : ""} selected
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={handleBulkExport}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-3 bg-white text-[#8359ee] hover:bg-gray-100 border-0"
                          disabled={bulkDeleting}
                        >
                          <Download className="h-3 w-3 mr-1.5" />
                          Export Selected
                        </Button>
                        <Button
                          onClick={handleBulkDelete}
                          variant="destructive"
                          size="sm"
                          className="text-xs h-7 px-3 bg-red-600 hover:bg-red-700 text-white border-0"
                          disabled={bulkDeleting}
                        >
                          {bulkDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5 inline-block"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1.5" />
                              Delete Selected
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setSelectedIds(new Set())}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-3 text-white hover:bg-[#7a4fe0]"
                          disabled={bulkDeleting}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Search and Controls */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-100 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                        <Input
                          placeholder="Search by name, email, brand..."
                          className="pl-8 pr-3 py-1.5 w-56 text-xs border-gray-200"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-[#8359ee] rounded-full"></div>
                        <span>
                          {allSubmissions.length}{" "}
                          {searchQuery ? "found" : "Total"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                      >
                        <Filter className="h-3 w-3 mr-1" />
                        Filter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                      >
                        <ArrowUpDown className="h-3 w-3 mr-1" />
                        Sort
                      </Button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white rounded-md border border-gray-100 overflow-hidden">
                    {renderTable(allSubmissions)}
                  </div>
                </div>
              </TabsContent>

              {/* Projects in Progress Tab */}
              <TabsContent value="in-progress" className="mt-6">
                <div className="space-y-4">
                  {/* Bulk Actions Toolbar */}
                  {selectedIds.size > 0 && (
                    <div className="bg-[#8359ee] text-white p-3 rounded-md flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">
                          {selectedIds.size} item
                          {selectedIds.size !== 1 ? "s" : ""} selected
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={handleBulkExport}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-3 bg-white text-[#8359ee] hover:bg-gray-100 border-0"
                          disabled={bulkDeleting}
                        >
                          <Download className="h-3 w-3 mr-1.5" />
                          Export Selected
                        </Button>
                        <Button
                          onClick={handleBulkDelete}
                          variant="destructive"
                          size="sm"
                          className="text-xs h-7 px-3 bg-red-600 hover:bg-red-700 text-white border-0"
                          disabled={bulkDeleting}
                        >
                          {bulkDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5 inline-block"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1.5" />
                              Delete Selected
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setSelectedIds(new Set())}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-3 text-white hover:bg-[#7a4fe0]"
                          disabled={bulkDeleting}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Search and Controls */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-100 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                        <Input
                          placeholder="Search by name, email, brand..."
                          className="pl-8 pr-3 py-1.5 w-56 text-xs border-gray-200"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>
                          {inProgressSubmissions.length}{" "}
                          {searchQuery ? "found" : "In Progress"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                      >
                        <Filter className="h-3 w-3 mr-1" />
                        Filter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                      >
                        <ArrowUpDown className="h-3 w-3 mr-1" />
                        Sort
                      </Button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white rounded-md border border-gray-100 overflow-hidden">
                    {renderTable(inProgressSubmissions)}
                  </div>
                </div>
              </TabsContent>

              {/* Completed Projects Tab */}
              <TabsContent value="completed" className="mt-6">
                <div className="space-y-4">
                  {/* Bulk Actions Toolbar */}
                  {selectedIds.size > 0 && (
                    <div className="bg-[#8359ee] text-white p-3 rounded-md flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">
                          {selectedIds.size} item
                          {selectedIds.size !== 1 ? "s" : ""} selected
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={handleBulkExport}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-3 bg-white text-[#8359ee] hover:bg-gray-100 border-0"
                          disabled={bulkDeleting}
                        >
                          <Download className="h-3 w-3 mr-1.5" />
                          Export Selected
                        </Button>
                        <Button
                          onClick={handleBulkDelete}
                          variant="destructive"
                          size="sm"
                          className="text-xs h-7 px-3 bg-red-600 hover:bg-red-700 text-white border-0"
                          disabled={bulkDeleting}
                        >
                          {bulkDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5 inline-block"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1.5" />
                              Delete Selected
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setSelectedIds(new Set())}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-3 text-white hover:bg-[#7a4fe0]"
                          disabled={bulkDeleting}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Search and Controls */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-100 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                        <Input
                          placeholder="Search by name, email, brand..."
                          className="pl-8 pr-3 py-1.5 w-56 text-xs border-gray-200"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>
                          {completedSubmissions.length}{" "}
                          {searchQuery ? "found" : "Completed"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                      >
                        <Filter className="h-3 w-3 mr-1" />
                        Filter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                      >
                        <ArrowUpDown className="h-3 w-3 mr-1" />
                        Sort
                      </Button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white rounded-md border border-gray-100 overflow-hidden">
                    {renderTable(completedSubmissions)}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Submission Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-white border border-gray-200 rounded-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Submission Details
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Complete information about this brand submission
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8359ee]"></div>
              <span className="ml-3 text-sm text-gray-500">
                Loading details...
              </span>
            </div>
          ) : selectedSubmission ? (
            <div className="space-y-6 mt-4">
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Contact Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedSubmission.firstName}{" "}
                        {selectedSubmission.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedSubmission.email}
                      </p>
                    </div>
                    {selectedSubmission.phone_number && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Phone Number
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedSubmission.phone_number}
                        </p>
                      </div>
                    )}
                    {selectedSubmission.referral && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Referral Source
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedSubmission.referral}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Brand Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Brand Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Brand Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedSubmission.brand_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Brand Style</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedSubmission.brand_style}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Logo Status</p>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedSubmission.logo_status === "completed"
                              ? "bg-green-500"
                              : selectedSubmission.logo_status === "in_progress"
                              ? "bg-blue-500"
                              : selectedSubmission.logo_status === "pending"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }`}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {selectedSubmission.logo_status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Online Presence
                      </p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {selectedSubmission.online_presence.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Goals */}
              {selectedSubmission.brand_goals &&
                selectedSubmission.brand_goals.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Brand Goals
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedSubmission.brand_goals.map((goal, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2 py-1 bg-white text-gray-700 border-gray-300"
                          >
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Target Audience */}
              {selectedSubmission.audience &&
                selectedSubmission.audience.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Target Audience
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedSubmission.audience.map((audience, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2 py-1 bg-white text-gray-700 border-gray-300"
                          >
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Timeline & Preferences */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Timeline & Preferences
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Timeline</p>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedSubmission.timeline === "urgent"
                              ? "bg-red-500"
                              : selectedSubmission.timeline === "asap"
                              ? "bg-yellow-500"
                              : selectedSubmission.timeline === "flexible"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {selectedSubmission.timeline === "urgent"
                            ? "Today"
                            : selectedSubmission.timeline === "asap"
                            ? "This week"
                            : selectedSubmission.timeline === "flexible"
                            ? "Next month"
                            : selectedSubmission.timeline}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Preferred Kit
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedSubmission.preferred_kit || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Submission Dates
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created At</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(selectedSubmission.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(selectedSubmission.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-gray-500">
                No submission details available
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDetailModal}
              className="w-full sm:w-auto"
            >
              Close
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
              This action cannot be undone. The brand submission for{" "}
              <span className="font-semibold text-gray-900">
                {submissionToDelete?.brand_name}
              </span>{" "}
              by{" "}
              <span className="font-semibold text-gray-900">
                {submissionToDelete?.firstName} {submissionToDelete?.lastName}
              </span>{" "}
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          {/* Action Buttons - Stacked */}
          <div className="space-y-3 mt-6">
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Deleting...
                </>
              ) : (
                "Delete Submission"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deleting}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
