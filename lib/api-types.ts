// API Request and Response Types

// ============================================================================
// Common Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
  count?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationResponse {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface SendOTPRequest {
  email: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  otp?: string; // Only in development mode
}

export interface LoginRequest {
  email: string;
  otp_code: string;
}

export interface Admin {
  id: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  name?: string; // Kept for compatibility if needed elsewhere
}

export interface LoginResponse {
  message: string;
  access_token: string;
  token_type: string;
  admin: Admin;
}

export interface GetCurrentUserResponse {
  success: boolean;
  admin: Admin;
}

// ============================================================================
// Admin Management Types
// ============================================================================

export interface CreateAdminRequest {
  email: string;
  role: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  name?: string;
}

export interface CreateAdminResponse {
  success: boolean;
  data: AdminUser;
  message?: string;
}

export interface GetAdminsResponse {
  success: boolean;
  data: AdminUser[];
  count: number;
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskType =
  | "UPLOAD_FILE"
  | "SEND_INFO"
  | "PROVIDE_DETAILS"
  | "REVIEW"
  | "OTHER";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  attachments: TaskAttachment[];
  task_metadata: any;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    email: string;
    plan: "LAUNCH" | "GROWTH";
  } | null;
  responses?: TaskResponse[];
  client?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TaskResponse {
  id: string;
  text: string;
  created_at: string;
  created_by: string;
  attachments: TaskAttachment[];
}

export interface TaskAttachment {
  url: string;
  key: string;
  bucket: string;
  content_type: string;
  size: number;
  uploaded_at: string;
}

export interface GetTasksParams {
  project_id?: string;
  status?: TaskStatus;
  type?: TaskType;
}

export interface GetTasksResponse {
  success: boolean;
  data: Task[];
  count: number;
}

export interface CreateTaskRequest {
  project_id: string;
  title: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  due_date?: string;
  attachments?: any[];
  metadata?: any;
  created_by?: string;
}

export interface CreateTaskResponse {
  success: boolean;
  data: Task;
  message: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  due_date?: string | null;
  attachments?: any[];
  metadata?: any;
}

export interface GetTaskResponsesParams {
  email?: string;
  client_id?: string;
  client_email?: string;
  status?: TaskStatus;
  type?: TaskType;
  has_responses?: boolean;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface GetTaskResponsesResponse {
  tasks: Task[];
  pagination: PaginationResponse;
}

export interface GetAllTaskResponsesResponse {
  responses: Array<{
    id: string;
    task_id: string;
    task_title: string;
    client_id: string;
    client_name: string | null;
    client_email: string;
    text: string;
    created_at: string;
    created_by: string;
    attachments: TaskAttachment[];
  }>;
  pagination: PaginationResponse;
}

export interface TaskStatisticsParams {
  email?: string;
  client_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface TaskStatisticsResponse {
  total_tasks: number;
  tasks_by_status: {
    PENDING: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  tasks_by_type: {
    UPLOAD_FILE: number;
    SEND_INFO: number;
    PROVIDE_DETAILS: number;
    REVIEW: number;
    OTHER: number;
  };
  total_responses: number;
  tasks_with_responses: number;
  tasks_without_responses: number;
  average_response_time_hours: number;
  total_attachments: number;
}

// ============================================================================
// Project Types
// ============================================================================

export type KitType = "LAUNCH" | "GROWTH";
export type PhaseStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "WAITING_ON_CLIENT"
  | "DONE";
export type PhaseId = "PHASE_1" | "PHASE_2" | "PHASE_3" | "PHASE_4";

export interface Project {
  id: string;
  user_id: string;
  name: string | null;
  email: string;
  kit_type: KitType;
  plan?: KitType;
  onboarding_answers_id?: string;
  onboarding_percent: number;
  current_day_of_14: number;
  next_from_us: string | null;
  next_from_you: string | null;
  started_at?: string | null;
  created_at: string;
  updated_at: string;
  onboarding_finished?: boolean;
  phases_state?: any;
  phases?: Phase[];
}

export interface Phase {
  id: string;
  project_id: string;
  phase_number: number;
  phase_id: PhaseId;
  title: string;
  subtitle: string | null;
  day_range: string;
  status: PhaseStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  checklist_items: ChecklistItem[];
  phase_links: any[];
}

export interface ChecklistItem {
  id: string;
  phase_id: string;
  label: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GetProjectsResponse {
  success: boolean;
  data: Project[];
  count: number;
}

export interface GetProjectResponse {
  project: Project;
}

export interface UpdateProjectRequest {
  current_day_of_14?: number;
  next_from_us?: string;
  next_from_you?: string;
}

export interface GetProjectsWithPhasesParams {
  kit_type?: KitType;
  status?: PhaseStatus;
}

export interface GetProjectsWithPhasesResponse {
  projects: Project[];
  total: number;
}

export interface GetProjectPhasesResponse {
  phases: Phase[];
}

export interface UpdatePhaseStatusRequest {
  phase_id: PhaseId;
  status: PhaseStatus;
}

export interface UpdateChecklistItemRequest {
  phase_id: PhaseId;
  label: string;
  is_done: boolean;
}

export interface UpdateChecklistItemResponse {
  success: boolean;
  message: string;
  checklist: Record<string, boolean>;
  phase_id: PhaseId;
}

// ============================================================================
// Phase Templates Types
// ============================================================================

export interface PhaseTemplate {
  phase_id: PhaseId;
  phase_number: number;
  title: string;
  subtitle: string | null;
  day_range: string;
  checklist_labels: string[];
}

export interface GetPhaseTemplatesParams {
  kit_type: KitType;
}

export interface GetPhaseTemplatesResponse {
  phase_templates: PhaseTemplate[];
  kit_type: KitType;
}

// ============================================================================
// Onboarding Answers Types
// ============================================================================

export interface OnboardingAnswer {
  id: string;
  user_id: string;
  answers: any;
  completed_at: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    email: string;
    plan: KitType;
    startedAt: string | null;
  } | null;
}

export interface GetOnboardingAnswersResponse {
  success: boolean;
  data: OnboardingAnswer[];
  count: number;
}

export interface StartProjectResponse {
  success: boolean;
  project: {
    id: string;
    email: string;
    name: string | null;
    plan: KitType;
    startedAt: string;
    currentDayOf14: number;
    phasesState: any;
  };
  message: string;
}

// ============================================================================
// Quiz Submissions Types
// ============================================================================

export interface QuizSubmission {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  referral: string | null;
  brand_name: string;
  logo_status: string;
  brand_goals: string[];
  online_presence: string;
  audience: string[];
  brand_style: string;
  timeline: string;
  preferred_kit: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetQuizSubmissionsResponse {
  success: boolean;
  data: QuizSubmission[];
  count: number;
}

export interface GetQuizSubmissionResponse {
  success: boolean;
  data: QuizSubmission;
}

// ============================================================================
// Lead Types
// ============================================================================

export interface Lead {
  id: string;
  business_name: string;
  location: string;
  primary_issue: string;
  monthly_revenue: string;
  lead_source: string;
  client_value: string;
  first_name: string;
  last_name: string;
  role: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  created_at: string;
  updated_at: string;
}

export interface GetLeadsResponse {
  success: boolean;
  data: Lead[];
  count: number;
}

// ============================================================================
// Health & Debug Types
// ============================================================================

export interface HealthCheckResponse {
  status: "success" | "error";
  message: string;
  connected: boolean;
  database?: {
    projects: number;
    quizSubmissions: number;
    tasks: number;
  };
  timestamp?: string;
  error?: string;
  hint?: string;
  documentation?: string;
}

export interface DebugEnvResponse {
  environment: string;
  database: {
    hasUrl: boolean;
    urlLength: number;
    startsWithMySQL: boolean;
    hasHost: boolean;
    connectionInfo: {
      host: string;
      port: string;
      database: string;
      hasCredentials: boolean;
      protocol: string;
    };
    commonIssues: string[];
  };
  tips: string[];
}
