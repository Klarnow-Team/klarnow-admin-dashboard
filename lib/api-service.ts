/**
 * Centralized API Service
 *
 * This service handles all API requests and responses for the Klarnow Admin Dashboard.
 * It provides a consistent interface for making API calls with proper error handling,
 * authentication, and TypeScript types.
 */

import type {
  // Authentication
  SendOTPRequest,
  SendOTPResponse,
  LoginRequest,
  LoginResponse,
  GetCurrentUserResponse,
  // Admin Management
  CreateAdminRequest,
  CreateAdminResponse,
  GetAdminsResponse,
  // Tasks
  GetTasksParams,
  GetTasksResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  UpdateTaskRequest,
  GetTaskResponsesParams,
  GetTaskResponsesResponse,
  GetAllTaskResponsesResponse,
  TaskStatisticsParams,
  TaskStatisticsResponse,
  // Projects
  GetProjectsResponse,
  GetProjectResponse,
  UpdateProjectRequest,
  GetProjectsWithPhasesParams,
  GetProjectsWithPhasesResponse,
  GetProjectPhasesResponse,
  UpdatePhaseStatusRequest,
  UpdateChecklistItemRequest,
  UpdateChecklistItemResponse,
  // Phase Templates
  GetPhaseTemplatesParams,
  GetPhaseTemplatesResponse,
  // Onboarding Answers
  GetOnboardingAnswersResponse,
  StartProjectResponse,
  // Quiz Submissions
  GetQuizSubmissionsResponse,
  GetQuizSubmissionResponse,
  // Leads
  GetLeadsResponse,
  Lead,
  // Health & Debug
  HealthCheckResponse,
  DebugEnvResponse,
  // Common
  ApiResponse,
} from "./api-types";

/**
 * API Error class for better error handling with status codes
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if error is a network/connection error
   */
  isNetworkError(): boolean {
    return this.status === 0;
  }

  /**
   * Get user-friendly error message based on status code
   */
  getFriendlyMessage(): string {
    switch (this.status) {
      case 400:
        return (
          this.message ||
          "Invalid request. Please check your input and try again."
        );
      case 401:
        return this.message || "Unauthorized. Please log in and try again.";
      case 403:
        return (
          this.message ||
          "Access forbidden. You don't have permission to perform this action."
        );
      case 404:
        return (
          this.message ||
          "Resource not found. Please check the URL and try again."
        );
      case 409:
        return (
          this.message ||
          "Conflict. This resource already exists or has been modified."
        );
      case 408:
        return this.message || "Request timeout. Please try again.";
      case 429:
        return (
          this.message ||
          "Too many requests. Please wait a moment and try again."
        );
      case 500:
        return this.message || "Server error. Please try again later.";
      case 502:
        return (
          this.message || "Bad gateway. The server is temporarily unavailable."
        );
      case 503:
        return this.message || "Service unavailable. Please try again later.";
      case 0:
        return (
          this.message ||
          "Network error. Please check your connection and try again."
        );
      default:
        return this.message || "An error occurred. Please try again.";
    }
  }
}

/**
 * API Service Configuration
 */
interface ApiConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

/**
 * Main API Service Class
 */
class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private token: string | null = null;
  private readonly TOKEN_STORAGE_KEY = "klarnow_admin_token";

  constructor(config: ApiConfig = {}) {
    // Default base URL: use environment variable or default to local API server
    // Base URL should include /api since that's where the API is hosted
    const defaultBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

    this.baseUrl = config.baseUrl || defaultBaseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout || 30000;

    // Load token from localStorage if available (client-side only)
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (storedToken) {
        this.token = storedToken;
      }
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Set authentication email header (deprecated - use bearer token instead)
   */
  setAuthEmail(email: string) {
    this.defaultHeaders["X-User-Email"] = email;
  }

  /**
   * Clear authentication email header (deprecated - use bearer token instead)
   */
  clearAuthEmail() {
    delete this.defaultHeaders["X-User-Email"];
  }

  /**
   * Base fetch method with error handling based on status codes
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Prepare headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header with bearer token for authenticated endpoints
    if (requireAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "same-origin",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different status codes
      const status = response.status;

      // Success status codes (200-299)
      if (status >= 200 && status < 300) {
        // Handle non-JSON responses for success cases
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          // For 204 No Content or empty responses
          if (status === 204) {
            return {} as T;
          }
          // Try to parse as JSON anyway, fallback to empty object
          try {
            const data = await response.json();
            return data as T;
          } catch {
            return {} as T;
          }
        }

        const data = await response.json();
        return data as T;
      }

      // Handle error status codes
      const contentType = response.headers.get("content-type");
      let errorData: any = null;

      // Try to parse error response body
      if (contentType?.includes("application/json")) {
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, continue with null
        }
      }

      // Create error message based on status code and response data
      const errorMessage =
        errorData?.error ||
        errorData?.message ||
        this.getDefaultErrorMessage(status);

      // If we get a 401 Unauthorized, clear the token as it's likely expired or invalid
      if (status === 401 && requireAuth) {
        this.clearToken();
        // Optionally redirect to login (but don't do it here to avoid circular dependencies)
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.warn("⚠️ Token expired or invalid. Cleared from storage.");
        }
      }

      throw new ApiError(errorMessage, status, errorData);
    } catch (error) {
      clearTimeout(timeoutId);

      // If it's already an ApiError, re-throw it
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network/connection errors
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new ApiError("Request timeout. Please try again.", 408);
        }

        // Check for network errors (CORS, connection refused, etc.)
        if (
          error.message === "Failed to fetch" ||
          error.message.includes("NetworkError") ||
          error.message.includes("Network request failed")
        ) {
          throw new ApiError(
            "Network error. Unable to connect to the server. Please check your connection and ensure the API server is running.",
            0
          );
        }

        // Other errors
        throw new ApiError(error.message, 0, error);
      }

      throw new ApiError("An unknown error occurred", 0);
    }
  }

  /**
   * Get default error message based on HTTP status code
   */
  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return "Bad request. Please check your input and try again.";
      case 401:
        return "Unauthorized. Please log in and try again.";
      case 403:
        return "Forbidden. You don't have permission to perform this action.";
      case 404:
        return "Not found. The requested resource does not exist.";
      case 409:
        return "Conflict. This resource already exists or has been modified.";
      case 422:
        return "Unprocessable entity. The request was well-formed but contains semantic errors.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Internal server error. Please try again later.";
      case 502:
        return "Bad gateway. The server received an invalid response.";
      case 503:
        return "Service unavailable. The server is temporarily unavailable.";
      case 504:
        return "Gateway timeout. The server did not receive a timely response.";
      default:
        return `Request failed with status ${status}`;
    }
  }

  // ============================================================================
  // Authentication Methods
  // ============================================================================

  /**
   * Send OTP to admin email (no authentication required)
   */
  async sendOTP(request: SendOTPRequest): Promise<SendOTPResponse> {
    return this.fetch<SendOTPResponse>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify(request),
    }, false); // No auth required
  }

  /**
   * Login with email and OTP (no authentication required)
   * After successful login, the token is automatically stored
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.fetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(request),
    }, false); // No auth required

    // Store the access token after successful login
    if (response.access_token) {
      this.setToken(response.access_token);
    }

    return response;
  }

  /**
   * Get current authenticated admin user
   */
  async getCurrentUser(): Promise<GetCurrentUserResponse> {
    const result = await this.fetch<any>("/auth/me", {
      method: "GET",
    }, true); // Requires authentication

    // If result is already wrapped
    if (result && typeof result === "object" && result.success !== undefined) {
      if (result.admin) return result as GetCurrentUserResponse;
      // If it has success but no admin field, maybe it's the admin object itself?
      return {
        success: result.success,
        admin: result.data || result,
      };
    }

    // If result is the raw admin object
    return {
      success: true,
      admin: result,
    };
  }

  // ============================================================================
  // Admin Management Methods
  // ============================================================================

  /**
   * Create a new admin user
   */
  async createAdmin(request: CreateAdminRequest): Promise<CreateAdminResponse> {
    const result = await this.fetch<any>("/auth/admins", {
      method: "POST",
      body: JSON.stringify(request),
    });

    if (result && typeof result === "object" && result.success !== undefined) {
      return result as CreateAdminResponse;
    }

    return {
      success: true,
      data: result,
      message: "Admin created successfully",
    };
  }

  /**
   * Get all admin users
   */
  async getAdmins(): Promise<GetAdminsResponse> {
    const result = await this.fetch<any>("/auth/admins", {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
        count: result.length,
      };
    }

    if (result && typeof result === "object" && result.success !== undefined) {
      return result as GetAdminsResponse;
    }

    return {
      success: true,
      data: result?.data || [],
      count: result?.count || 0,
    };
  }

  /**
   * Delete an admin user
   */
  async deleteAdmin(id: string): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/demo/admins/${id}`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // Task Methods
  // ============================================================================

  /**
   * Get all tasks with optional filtering
   */
  async getTasks(params?: GetTasksParams): Promise<GetTasksResponse> {
    const queryParams = new URLSearchParams();
    if (params?.project_id) queryParams.append("project_id", params.project_id);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.type) queryParams.append("type", params.type);

    const queryString = queryParams.toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ""}`;

    const result = await this.fetch<any>(endpoint, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    // Check if result is already wrapped or is a raw array
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
        count: result.length,
      };
    }

    if (result && typeof result === "object" && result.success !== undefined) {
      return result as GetTasksResponse;
    }

    return {
      success: true,
      data: result?.data || [],
      count: result?.count || result?.data?.length || 0,
    };
  }

  /**
   * Get a specific task by ID
   */
  async getTask(id: string): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/tasks/${id}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  /**
   * Create a new task
   */
  async createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    return this.fetch<CreateTaskResponse>("/tasks", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Update a task
   */
  async updateTask(
    id: string,
    request: UpdateTaskRequest
  ): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(request),
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/tasks/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Get task responses
   */
  async getTaskResponses(
    id: string,
    email?: string
  ): Promise<GetTaskResponsesResponse> {
    const queryParams = new URLSearchParams();
    if (email) queryParams.append("email", email);

    const queryString = queryParams.toString();
    const endpoint = `/tasks/${id}/responses${queryString ? `?${queryString}` : ""}`;

    return this.fetch<GetTaskResponsesResponse>(endpoint, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  /**
   * Get all tasks with their responses
   */
  async getTasksWithResponses(
    params?: GetTaskResponsesParams
  ): Promise<GetTaskResponsesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.email) queryParams.append("email", params.email);
    if (params?.client_id) queryParams.append("client_id", params.client_id);
    if (params?.client_email)
      queryParams.append("client_email", params.client_email);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.has_responses !== undefined)
      queryParams.append("has_responses", String(params.has_responses));
    if (params?.date_from) queryParams.append("date_from", params.date_from);
    if (params?.date_to) queryParams.append("date_to", params.date_to);
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.offset) queryParams.append("offset", String(params.offset));

    const queryString = queryParams.toString();
    const endpoint = `/tasks/responses${queryString ? `?${queryString}` : ""}`;

    return this.fetch<GetTaskResponsesResponse>(endpoint, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  /**
   * Get all responses from all tasks (flattened)
   */
  async getAllTaskResponses(
    params?: GetTaskResponsesParams
  ): Promise<GetAllTaskResponsesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.email) queryParams.append("email", params.email);
    if (params?.client_id) queryParams.append("client_id", params.client_id);
    if (params?.client_email)
      queryParams.append("client_email", params.client_email);
    if (params?.date_from) queryParams.append("date_from", params.date_from);
    if (params?.date_to) queryParams.append("date_to", params.date_to);
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.offset) queryParams.append("offset", String(params.offset));

    const queryString = queryParams.toString();
    const endpoint = `/tasks/responses/all${queryString ? `?${queryString}` : ""}`;

    return this.fetch<GetAllTaskResponsesResponse>(endpoint, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(
    params?: TaskStatisticsParams
  ): Promise<TaskStatisticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.email) queryParams.append("email", params.email);
    if (params?.client_id) queryParams.append("client_id", params.client_id);
    if (params?.date_from) queryParams.append("date_from", params.date_from);
    if (params?.date_to) queryParams.append("date_to", params.date_to);

    const queryString = queryParams.toString();
    const endpoint = `/tasks/statistics${queryString ? `?${queryString}` : ""}`;

    return this.fetch<TaskStatisticsResponse>(endpoint, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  // ============================================================================
  // Project Methods
  // ============================================================================

  /**
   * Get all projects (clients)
   */
  async getProjects(): Promise<GetProjectsResponse> {
    const result = await this.fetch<any>("/projects/clients", {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
        count: result.length,
      };
    }

    if (result && typeof result === "object" && result.success !== undefined) {
      return result as GetProjectsResponse;
    }

    return {
      success: true,
      data: result?.data || [],
      count: result?.count || 0,
    };
  }

  /**
   * Get a specific project
   */
  async getProject(projectId: string): Promise<GetProjectResponse> {
    return this.fetch<GetProjectResponse>(`/projects/${projectId}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  /**
   * Update project progress
   */
  async updateProject(
    projectId: string,
    request: UpdateProjectRequest
  ): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(request),
    });
  }

  /**
   * Get all projects with their phases
   */
  async getProjectsWithPhases(
    params?: GetProjectsWithPhasesParams
  ): Promise<GetProjectsWithPhasesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.kit_type) queryParams.append("kit_type", params.kit_type);
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    const endpoint = `/projects/phases${queryString ? `?${queryString}` : ""}`;

    return this.fetch<GetProjectsWithPhasesResponse>(endpoint, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  /**
   * Get phases for a specific project
   */
  async getProjectPhases(projectId: string): Promise<GetProjectPhasesResponse> {
    return this.fetch<GetProjectPhasesResponse>(
      `/projects/${projectId}/phases`,
      {
        method: "GET",
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  /**
   * Get project info (phase_id is in path but not used)
   */
  async getProjectPhase(
    projectId: string,
    phaseId: string
  ): Promise<GetProjectResponse> {
    return this.fetch<GetProjectResponse>(
      `/projects/${projectId}/phases/${phaseId}`,
      {
        method: "GET",
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  /**
   * Update phase status
   */
  async updatePhaseStatus(
    projectId: string,
    phaseId: string,
    request: UpdatePhaseStatusRequest
  ): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/projects/${projectId}/phases/${phaseId}`, {
      method: "PATCH",
      body: JSON.stringify(request),
    });
  }

  /**
   * Update checklist item status
   */
  async updateChecklistItem(
    projectId: string,
    phaseId: string,
    itemId: string,
    request: UpdateChecklistItemRequest
  ): Promise<UpdateChecklistItemResponse> {
    return this.fetch<UpdateChecklistItemResponse>(
      `/projects/${projectId}/phases/${phaseId}/checklist/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Initialize phases for a project
   */
  async initializePhases(projectId: string): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/projects/${projectId}/initialize-phases`, {
      method: "POST",
    });
  }

  /**
   * Get project phases state
   */
  async getProjectPhasesState(projectId: string): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/projects/${projectId}/phases-state`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  /**
   * Update project phases state
   */
  async updateProjectPhasesState(
    projectId: string,
    data: any
  ): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/projects/${projectId}/phases-state`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // Phase Templates Methods
  // ============================================================================

  /**
   * Get phase templates for a kit type
   */
  async getPhaseTemplates(
    params: GetPhaseTemplatesParams
  ): Promise<GetPhaseTemplatesResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("kit_type", params.kit_type);

    return this.fetch<GetPhaseTemplatesResponse>(
      `/phase-templates?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // ============================================================================
  // Onboarding Answers Methods
  // ============================================================================

  /**
   * Get all onboarding answers
   */
  async getOnboardingAnswers(): Promise<GetOnboardingAnswersResponse> {
    const result = await this.fetch<any>("/onboarding-answers", {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
        count: result.length,
      };
    }

    if (result && typeof result === "object" && result.success !== undefined) {
      return result as GetOnboardingAnswersResponse;
    }

    return {
      success: true,
      data: result?.data || [],
      count: result?.count || 0,
    };
  }

  /**
   * Create a project from onboarding answers
   */
  async startProject(id: string): Promise<StartProjectResponse> {
    const result = await this.fetch<any>(
      `/onboarding-answers/${id}/start-project`,
      {
        method: "POST",
      }
    );

    if (result && typeof result === "object" && result.success !== undefined) {
      return result as StartProjectResponse;
    }

    return {
      success: true,
      ...result
    };
  }

  // ============================================================================
  // Leads Methods
  // ============================================================================

  /**
   * Get all leads
   */
  async getLeads(): Promise<GetLeadsResponse> {
    const result = await this.fetch<any>("/leads", {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    // Check if result is already wrapped or is a raw array
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
        count: result.length,
      };
    }

    if (result && typeof result === "object" && result.success !== undefined) {
      return result as GetLeadsResponse;
    }

    return {
      success: true,
      data: result?.data || [],
      count: result?.data?.length || 0,
    };
  }

  // ============================================================================
  // Quiz Submissions Methods
  // ============================================================================

  /**
   * Get all quiz submissions
   */
  async getQuizSubmissions(): Promise<GetQuizSubmissionsResponse> {
    const result = await this.fetch<any>("/quiz-submissions", {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    // Check if result is already wrapped or is a raw array
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
        count: result.length,
      };
    }

    if (result && typeof result === "object" && result.data && result.success !== undefined) {
      return result as GetQuizSubmissionsResponse;
    }

    // Default fallback for unexpected object format
    return {
      success: true,
      data: result?.data || (Array.isArray(result) ? result : []),
      count: result?.count || (Array.isArray(result) ? result.length : 0),
    };
  }

  /**
   * Get a specific quiz submission
   */
  async getQuizSubmission(id: string): Promise<GetQuizSubmissionResponse> {
    const result = await this.fetch<any>(`/quiz-submissions/${id}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    // If result is already wrapped
    if (result && typeof result === "object" && result.success !== undefined) {
      return result as GetQuizSubmissionResponse;
    }

    // If result is the raw data object
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Delete a quiz submission
   */
  async deleteQuizSubmission(id: string): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/quiz-submissions/${id}`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // Health & Debug Methods
  // ============================================================================

  /**
   * Check database connection health
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    return this.fetch<HealthCheckResponse>("/health/db", {
      method: "GET",
    });
  }

  /**
   * Debug environment variables
   */
  async debugEnv(): Promise<DebugEnvResponse> {
    return this.fetch<DebugEnvResponse>("/debug/env", {
      method: "GET",
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for custom instances
export { ApiService };
export default ApiService;
