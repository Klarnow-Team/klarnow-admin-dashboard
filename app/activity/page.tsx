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
  `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?'

  // Handle delete submission
  const handleDelete = (submission: QuizSubmission, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSubmissionToDelete(submission);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!submissionToDelete) return;

    try {
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
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSubmissionToDelete(null);
  };

  // Filter submissions by status
  const allSubmissions = submissions;
  const inProgressSubmissions = submissions.filter(
    (s) => s.logo_status === "in_progress"
  );
  const completedSubmissions = submissions.filter(
    (s) => s.logo_status === "completed"
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

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="w-12">
                <input type="checkbox" className="rounded border-gray-300" />
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
                className="hover:bg-gray-50 border-b border-gray-100"
              >
                <TableCell>
                  <input type="checkbox" className="rounded border-gray-300" />
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
                  {/* Search and Controls */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-100 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                        <Input
                          placeholder="Search..."
                          className="pl-8 pr-3 py-1.5 w-56 text-xs border-gray-200"
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-[#8359ee] rounded-full"></div>
                        <span>{allSubmissions.length} Total</span>
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
                  {/* Search and Controls */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-100 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                        <Input
                          placeholder="Search..."
                          className="pl-8 pr-3 py-1.5 w-56 text-xs border-gray-200"
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{inProgressSubmissions.length} In Progress</span>
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
                  {/* Search and Controls */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-100 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                        <Input
                          placeholder="Search..."
                          className="pl-8 pr-3 py-1.5 w-56 text-xs border-gray-200"
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{completedSubmissions.length} Completed</span>
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
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg"
            >
              Delete Submission
            </Button>
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
