"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Sidebar from "@/components/sidebar";
import DashboardSections from "@/components/dashboard-sections";
import Header from "@/components/header";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function DashboardPage() {
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Dashboard metrics state
  const [dashboardMetrics, setDashboardMetrics] = useState({
    quizCompletions: 0,
    numberOfProjects: 0,
  });

  // Use custom hook for user management
  const { user } = useCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchQuizSubmissions(),
        fetchProjects()
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Update dashboard metrics when data changes
  useEffect(() => {
    setDashboardMetrics({
      quizCompletions: quizSubmissions.length,
      numberOfProjects: projects.length,
    });
  }, [quizSubmissions, projects]);

  const fetchQuizSubmissions = async () => {
    try {
      const result = await apiService.getQuizSubmissions();
      if (result.success) {
        setQuizSubmissions(result.data || []);
      }
    } catch (error) {
      console.error("❌ Error fetching quiz submissions:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const result = await apiService.getProjects();
      if (result.success) {
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error("❌ Error fetching projects:", error);
    }
  };

  const handleLogout = async () => {
    apiService.clearToken();
    if (typeof window !== "undefined") {
      document.cookie =
        "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar>
      <Header onLogout={handleLogout} user={user} />

      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-6">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">
              Overview of your system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Quiz Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : dashboardMetrics.quizCompletions}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : dashboardMetrics.numberOfProjects}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <DashboardSections projects={projects} />
          </div>
        </div>
      </main>
    </Sidebar>
  );
}
