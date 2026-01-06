# Klarnow Admin Dashboard - Complete API Documentation

This document contains all API routes, request/response formats, and implementation details needed to create a centralized backend service.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Admin Management](#admin-management)
3. [Tasks](#tasks)
4. [Projects](#projects)
5. [Phases & Checklists](#phases--checklists)
6. [Onboarding Answers](#onboarding-answers)
7. [Quiz Submissions](#quiz-submissions)
8. [Health & Debug](#health--debug)
9. [Database Schema](#database-schema)
10. [Environment Variables](#environment-variables)
11. [Dependencies](#dependencies)

---

## Authentication & Authorization

### POST /api/auth/send-otp

**Description:** Send OTP code to admin email for login

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP has been sent to your email address."
}
```

**Response (200 - Default Admin):**
```json
{
  "success": true,
  "message": "OTP ready. Use OTP: 000000",
  "otp": "000000" // Only in development mode
}
```

**Error Responses:**
- `400`: Missing email
- `500`: Email service or database error

**Environment Variables Required:**
- `RESEND_API_KEY`: Resend email service API key
- `RESEND_FROM_EMAIL`: Email address to send from (default: "onboarding@resend.dev")
- `DEFAULT_ADMIN_EMAIL`: Default admin email for development
- `DEFAULT_ADMIN_OTP`: Default OTP for default admin (default: "000000")

---

### POST /api/auth/login

**Description:** Authenticate admin with email and OTP

**Request Body:**
```json
{
  "email": "string (required)",
  "otp": "string (required, 6 digits)"
}
```

**Response (200):**
```json
{
  "success": true,
  "admin": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  }
}
```

**Response Headers:**
- `Set-Cookie`: `admin_session=authenticated; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`

**Error Responses:**
- `400`: Missing email or OTP
- `401`: Invalid email, OTP, or expired OTP
- `500`: Database or server error

**Notes:**
- OTP expires after 10 minutes
- OTP is cleared after successful login
- Default admin can use fixed OTP from environment variable

---

## Admin Management

### POST /api/admin/create-user

**Description:** Create a new admin user

**Request Body:**
```json
{
  "email": "string (required, valid email format)",
  "name": "string (required)",
  "password": "string (optional, min 8 characters)",
  "role": "string (optional, default: 'admin')"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime"
  },
  "message": "Admin created successfully"
}
```

**Error Responses:**
- `400`: Missing required fields, invalid email format, or password too short
- `409`: Admin with email already exists
- `500`: Server error

**Dependencies:**
- `bcrypt` for password hashing

---

### GET /api/demo/admins

**Description:** Get all admin users

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "user_id": "string | null",
      "email": "string",
      "name": "string",
      "role": "string",
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime"
    }
  ],
  "count": 0
}
```

**Error Responses:**
- `500`: Server error

---

### DELETE /api/demo/admins/[id]

**Description:** Delete an admin user

**Path Parameters:**
- `id`: Admin ID (string, required)

**Response (200):**
```json
{
  "success": true,
  "message": "Admin deleted successfully"
}
```

**Error Responses:**
- `400`: Missing admin ID
- `404`: Admin not found
- `500`: Server error

---

## Tasks

### GET /api/tasks

**Description:** Get all tasks with optional filtering

**Query Parameters:**
- `project_id` (string, optional): Filter by project ID
- `status` (enum, optional): `PENDING` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`
- `type` (enum, optional): `UPLOAD_FILE` | `SEND_INFO` | `PROVIDE_DETAILS` | `REVIEW` | `OTHER`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "project_id": "string",
      "title": "string",
      "description": "string | null",
      "type": "UPLOAD_FILE | SEND_INFO | PROVIDE_DETAILS | REVIEW | OTHER",
      "status": "PENDING | IN_PROGRESS | COMPLETED | CANCELLED",
      "due_date": "ISO 8601 datetime | null",
      "completed_at": "ISO 8601 datetime | null",
      "attachments": ["array of file objects"],
      "metadata": {},
      "created_by": "string | null",
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime",
      "project": {
        "id": "string",
        "name": "string",
        "email": "string",
        "plan": "LAUNCH | GROWTH"
      } | null
    }
  ],
  "count": 0
}
```

**Response Headers:**
- `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

**Error Responses:**
- `500`: Server error

---

### POST /api/tasks

**Description:** Create a new task

**Request Body:**
```json
{
  "project_id": "string (required)",
  "title": "string (required)",
  "description": "string (optional)",
  "type": "UPLOAD_FILE | SEND_INFO | PROVIDE_DETAILS | REVIEW | OTHER (default: OTHER)",
  "status": "PENDING | IN_PROGRESS | COMPLETED | CANCELLED (default: PENDING)",
  "due_date": "ISO 8601 datetime (optional)",
  "attachments": ["array of file objects"] (optional, default: []),
  "metadata": {} (optional, default: {}),
  "created_by": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "project_id": "string",
    "title": "string",
    "description": "string | null",
    "type": "string",
    "status": "string",
    "due_date": "ISO 8601 datetime | null",
    "completed_at": "ISO 8601 datetime | null",
    "attachments": [],
    "metadata": {},
    "created_by": "string | null",
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime",
    "project": {
      "id": "string",
      "name": "string",
      "email": "string",
      "plan": "LAUNCH | GROWTH"
    } | null
  },
  "message": "Task created successfully"
}
```

**Error Responses:**
- `400`: Missing required fields
- `404`: Project not found
- `500`: Server error

---

### GET /api/tasks/[id]

**Description:** Get a specific task by ID

**Path Parameters:**
- `id`: Task ID (string, required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "project_id": "string",
    "title": "string",
    "description": "string | null",
    "type": "string",
    "status": "string",
    "due_date": "ISO 8601 datetime | null",
    "completed_at": "ISO 8601 datetime | null",
    "attachments": [],
    "metadata": {},
    "created_by": "string | null",
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime",
    "project": {
      "id": "string",
      "name": "string",
      "email": "string",
      "plan": "LAUNCH | GROWTH"
    } | null
  }
}
```

**Error Responses:**
- `404`: Task not found
- `500`: Server error

---

### PATCH /api/tasks/[id]

**Description:** Update a task

**Path Parameters:**
- `id`: Task ID (string, required)

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "type": "UPLOAD_FILE | SEND_INFO | PROVIDE_DETAILS | REVIEW | OTHER (optional)",
  "status": "PENDING | IN_PROGRESS | COMPLETED | CANCELLED (optional)",
  "due_date": "ISO 8601 datetime | null (optional)",
  "attachments": ["array"] (optional),
  "metadata": {} (optional)
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Same format as GET /api/tasks/[id]
  },
  "message": "Task updated successfully"
}
```

**Notes:**
- When status is set to `COMPLETED`, `completed_at` is automatically set
- When status is changed from `COMPLETED`, `completed_at` is cleared

**Error Responses:**
- `404`: Task not found
- `500`: Server error

---

### DELETE /api/tasks/[id]

**Description:** Delete a task

**Path Parameters:**
- `id`: Task ID (string, required)

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Error Responses:**
- `404`: Task not found
- `500`: Server error

---

### GET /api/tasks/[id]/responses

**Description:** Get task responses (from metadata)

**Path Parameters:**
- `id`: Task ID (string, required)

**Query Parameters:**
- `email` (string, optional): Admin email for authentication (can also use `X-User-Email` header)

**Headers:**
- `X-User-Email` (string, optional): Admin email for authentication

**Response (200):**
```json
{
  "task": {
    "id": "string",
    "client_id": "string",
    "client_name": "string | null",
    "client_email": "string | null",
    "title": "string",
    "description": "string | null",
    "type": "string",
    "status": "string",
    "due_date": "ISO 8601 datetime | null",
    "completed_at": "ISO 8601 datetime | null",
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime"
  },
  "responses": [
    {
      "id": "string",
      "text": "string",
      "created_at": "ISO 8601 datetime",
      "created_by": "string",
      "attachments": [
        {
          "name": "string",
          "url": "string",
          "uploaded_at": "ISO 8601 datetime",
          "size": "number",
          "type": "string"
        }
      ]
    }
  ],
  "total_responses": 0
}
```

**Error Responses:**
- `401`: Unauthorized - email required
- `404`: Task not found
- `500`: Server error

---

### GET /api/tasks/responses

**Description:** Get all tasks with their responses (filtered)

**Query Parameters:**
- `email` (string, optional): Admin email for authentication (can also use `X-User-Email` header)
- `client_id` (string, optional): Filter by client/project ID
- `client_email` (string, optional): Filter by client/project email
- `status` (enum, optional): `PENDING` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`
- `type` (enum, optional): `UPLOAD_FILE` | `SEND_INFO` | `PROVIDE_DETAILS` | `REVIEW` | `OTHER`
- `has_responses` (boolean, optional): Filter tasks with/without responses
- `date_from` (ISO 8601 datetime, optional): Filter by creation date from
- `date_to` (ISO 8601 datetime, optional): Filter by creation date to
- `limit` (number, optional, default: 50, max: 100): Pagination limit
- `offset` (number, optional, default: 0): Pagination offset

**Headers:**
- `X-User-Email` (string, optional): Admin email for authentication

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "string",
      "client_id": "string",
      "client_name": "string | null",
      "client_email": "string | null",
      "title": "string",
      "description": "string | null",
      "type": "string",
      "status": "string",
      "due_date": "ISO 8601 datetime | null",
      "completed_at": "ISO 8601 datetime | null",
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime",
      "created_by": "string | null",
      "responses": [
        {
          "id": "string",
          "text": "string",
          "created_at": "ISO 8601 datetime",
          "created_by": "string",
          "attachments": []
        }
      ],
      "attachments": [],
      "metadata": {
        "responses": [],
        "attachments": []
      }
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

**Error Responses:**
- `401`: Unauthorized - email required
- `500`: Server error

---

### GET /api/tasks/responses/all

**Description:** Get all responses from all tasks (flattened)

**Query Parameters:**
- `email` (string, optional): Admin email for authentication (can also use `X-User-Email` header)
- `client_id` (string, optional): Filter by client/project ID
- `client_email` (string, optional): Filter by client/project email
- `date_from` (ISO 8601 datetime, optional): Filter responses by date from
- `date_to` (ISO 8601 datetime, optional): Filter responses by date to
- `limit` (number, optional, default: 50, max: 100): Pagination limit
- `offset` (number, optional, default: 0): Pagination offset

**Headers:**
- `X-User-Email` (string, optional): Admin email for authentication

**Response (200):**
```json
{
  "responses": [
    {
      "id": "string",
      "task_id": "string",
      "task_title": "string",
      "client_id": "string",
      "client_name": "string | null",
      "client_email": "string",
      "text": "string",
      "created_at": "ISO 8601 datetime",
      "created_by": "string",
      "attachments": [
        {
          "name": "string",
          "url": "string",
          "uploaded_at": "ISO 8601 datetime",
          "size": "number",
          "type": "string"
        }
      ]
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

**Error Responses:**
- `401`: Unauthorized - email required
- `500`: Server error

---

### GET /api/tasks/statistics

**Description:** Get task statistics

**Query Parameters:**
- `email` (string, optional): Admin email for authentication (can also use `X-User-Email` header)
- `client_id` (string, optional): Filter by client/project ID
- `date_from` (ISO 8601 datetime, optional): Filter by creation date from
- `date_to` (ISO 8601 datetime, optional): Filter by creation date to

**Headers:**
- `X-User-Email` (string, optional): Admin email for authentication

**Response (200):**
```json
{
  "total_tasks": 0,
  "tasks_by_status": {
    "PENDING": 0,
    "IN_PROGRESS": 0,
    "COMPLETED": 0,
    "CANCELLED": 0
  },
  "tasks_by_type": {
    "UPLOAD_FILE": 0,
    "SEND_INFO": 0,
    "PROVIDE_DETAILS": 0,
    "REVIEW": 0,
    "OTHER": 0
  },
  "total_responses": 0,
  "tasks_with_responses": 0,
  "tasks_without_responses": 0,
  "average_response_time_hours": 0.0,
  "total_attachments": 0
}
```

**Error Responses:**
- `401`: Unauthorized - email required
- `500`: Server error

---

## Projects

### GET /api/projects/clients

**Description:** Get all projects (clients)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "user_id": "string",
      "name": "string",
      "email": "string",
      "plan": "LAUNCH | GROWTH",
      "current_day_of_14": "number | null",
      "started_at": "ISO 8601 datetime | null",
      "created_at": "ISO 8601 datetime"
    }
  ],
  "count": 0
}
```

**Error Responses:**
- `500`: Server error

---

### GET /api/projects/[project_id]

**Description:** Get a specific project

**Path Parameters:**
- `project_id`: Project ID (string, required)

**Response (200):**
```json
{
  "project": {
    "id": "string",
    "email": "string",
    "plan": "LAUNCH | GROWTH",
    "current_day_of_14": "number | null",
    "next_from_us": "string | null",
    "next_from_you": "string | null",
    "started_at": "ISO 8601 datetime | null"
  }
}
```

**Error Responses:**
- `404`: Project not found
- `500`: Server error

---

### PATCH /api/projects/[project_id]

**Description:** Update project progress

**Path Parameters:**
- `project_id`: Project ID (string, required)

**Request Body:**
```json
{
  "current_day_of_14": "number (optional, 1-14)",
  "next_from_us": "string (optional)",
  "next_from_you": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Project progress updated successfully"
}
```

**Error Responses:**
- `400`: Invalid current_day_of_14 (must be 1-14)
- `404`: Project not found
- `500`: Server error

---

### GET /api/projects/phases

**Description:** Get all projects with their phases

**Query Parameters:**
- `kit_type` (enum, optional): `LAUNCH` | `GROWTH`
- `status` (enum, optional): `NOT_STARTED` | `IN_PROGRESS` | `WAITING_ON_CLIENT` | `DONE`

**Response (200):**
```json
{
  "projects": [
    {
      "id": "string",
      "user_id": "string",
      "kit_type": "LAUNCH | GROWTH",
      "current_day_of_14": "number | null",
      "next_from_us": "string | null",
      "next_from_you": "string | null",
      "onboarding_finished": true,
      "onboarding_percent": 100,
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime",
      "email": "string | null",
      "phases": [
        {
          "id": "string",
          "project_id": "string",
          "phase_number": 1,
          "phase_id": "PHASE_1 | PHASE_2 | PHASE_3 | PHASE_4",
          "title": "string",
          "subtitle": "string | null",
          "day_range": "string",
          "status": "NOT_STARTED | IN_PROGRESS | WAITING_ON_CLIENT | DONE",
          "started_at": "ISO 8601 datetime | null",
          "completed_at": "ISO 8601 datetime | null",
          "created_at": "ISO 8601 datetime",
          "updated_at": "ISO 8601 datetime",
          "checklist_items": [
            {
              "id": "string",
              "phase_id": "string",
              "label": "string",
              "is_done": false,
              "sort_order": 1,
              "created_at": "ISO 8601 datetime",
              "updated_at": "ISO 8601 datetime"
            }
          ],
          "phase_links": []
        }
      ]
    }
  ],
  "total": 0
}
```

**Error Responses:**
- `500`: Server error

---

### GET /api/projects/[project_id]/phases

**Description:** Get phases for a specific project

**Path Parameters:**
- `project_id`: Project ID (string, required)

**Response (200):**
```json
{
  "phases": [
    {
      "id": "string",
      "project_id": "string",
      "phase_number": 1,
      "phase_id": "PHASE_1 | PHASE_2 | PHASE_3 | PHASE_4",
      "title": "string",
      "subtitle": "string | null",
      "day_range": "string",
      "status": "NOT_STARTED | IN_PROGRESS | WAITING_ON_CLIENT | DONE",
      "started_at": "ISO 8601 datetime | null",
      "completed_at": "ISO 8601 datetime | null",
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime",
      "checklist_items": [
        {
          "id": "string",
          "phase_id": "string",
          "label": "string",
          "is_done": false,
          "sort_order": 1,
          "created_at": "ISO 8601 datetime",
          "updated_at": "ISO 8601 datetime"
        }
      ],
      "phase_links": []
    }
  ]
}
```

**Error Responses:**
- `404`: Project not found
- `500`: Server error

---

### GET /api/projects/[project_id]/phases/[phase_id]

**Description:** Get project info (phase_id is in path but not used in response)

**Path Parameters:**
- `project_id`: Project ID (string, required)
- `phase_id`: Phase ID (string, required, but not used)

**Response (200):**
```json
{
  "project": {
    "id": "string",
    "email": "string",
    "plan": "LAUNCH | GROWTH"
  }
}
```

**Error Responses:**
- `404`: Project not found
- `500`: Server error

---

### PATCH /api/projects/[project_id]/phases/[phase_id]

**Description:** Update phase status

**Path Parameters:**
- `project_id`: Project ID (string, required)
- `phase_id`: Phase ID (string, required, but not used from path)

**Request Body:**
```json
{
  "phase_id": "PHASE_1 | PHASE_2 | PHASE_3 | PHASE_4 (required)",
  "status": "NOT_STARTED | IN_PROGRESS | WAITING_ON_CLIENT | DONE (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Phase status updated successfully"
}
```

**Notes:**
- `started_at` is automatically set when status changes from `NOT_STARTED`
- `completed_at` is automatically set when status changes to `DONE`

**Error Responses:**
- `400`: Missing or invalid phase_id or status
- `404`: Project not found
- `500`: Server error

---

### PATCH /api/projects/[project_id]/phases/[phase_id]/checklist/[item_id]

**Description:** Update checklist item status

**Path Parameters:**
- `project_id`: Project ID (string, required)
- `phase_id`: Phase ID (string, required, but not used from path)
- `item_id`: Item ID (string, required, but not used from path)

**Request Body:**
```json
{
  "phase_id": "PHASE_1 | PHASE_2 | PHASE_3 | PHASE_4 (required)",
  "label": "string (required, checklist item label)",
  "is_done": "boolean (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Checklist item updated successfully",
  "checklist": {
    "label1": true,
    "label2": false
  },
  "phase_id": "PHASE_1"
}
```

**Error Responses:**
- `400`: Missing required fields
- `404`: Project not found
- `500`: Server error

---

### POST /api/projects/[project_id]/initialize-phases

**Description:** Initialize phases for a project (dummy endpoint - returns dummy data)

**Path Parameters:**
- `project_id`: Project ID (string, required)

**Response (200):**
```json
{
  "phases": [
    // Dummy phase data
  ],
  "message": "Phases initialized successfully"
}
```

**Note:** This endpoint currently returns dummy data. Implementation should initialize phases based on project plan.

---

### GET /api/projects/[project_id]/phases-state

**Description:** Get project phases state (dummy endpoint)

**Path Parameters:**
- `project_id`: Project ID (string, required)

**Response (200):**
```json
{
  "project": {
    // Dummy project data with phases
  }
}
```

**Note:** This endpoint currently returns dummy data.

---

### PATCH /api/projects/[project_id]/phases-state

**Description:** Update project phases state (dummy endpoint)

**Path Parameters:**
- `project_id`: Project ID (string, required)

**Request Body:**
```json
{
  // Any data
}
```

**Response (200):**
```json
{
  "project": {
    // Dummy project data
  },
  "message": "Project updated successfully"
}
```

**Note:** This endpoint currently returns dummy data.

---

## Phases & Checklists

### GET /api/phase-templates

**Description:** Get phase templates for a kit type

**Query Parameters:**
- `kit_type` (enum, required): `LAUNCH` | `GROWTH`

**Response (200):**
```json
{
  "phase_templates": [
    {
      "phase_id": "PHASE_1",
      "phase_number": 1,
      "title": "string",
      "subtitle": "string | null",
      "day_range": "string",
      "checklist_labels": ["string"]
    }
  ],
  "kit_type": "LAUNCH | GROWTH"
}
```

**Error Responses:**
- `400`: Missing or invalid kit_type
- `500`: Server error

**Note:** This endpoint currently returns dummy data. Phase structure is hardcoded in the application.

---

## Onboarding Answers

### GET /api/onboarding-answers

**Description:** Get all onboarding answers

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "user_id": "string",
      "answers": {},
      "completed_at": "ISO 8601 datetime",
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime",
      "project": {
        "id": "string",
        "name": "string",
        "email": "string",
        "plan": "LAUNCH | GROWTH",
        "startedAt": "ISO 8601 datetime | null"
      } | null
    }
  ],
  "count": 0
}
```

**Error Responses:**
- `500`: Server error

---

### POST /api/onboarding-answers/[id]/start-project

**Description:** Create a project from onboarding answers

**Path Parameters:**
- `id`: Onboarding answer ID (string, required)

**Response (200):**
```json
{
  "success": true,
  "project": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "plan": "LAUNCH | GROWTH",
    "startedAt": "ISO 8601 datetime",
    "currentDayOf14": 1,
    "phasesState": {
      "PHASE_1": {
        "status": "NOT_STARTED",
        "started_at": null,
        "completed_at": null,
        "checklist": {
          "label1": false,
          "label2": false
        }
      }
    }
  },
  "message": "Project started successfully"
}
```

**Error Responses:**
- `400`: Project already exists or failed to extract data from answers
- `404`: Onboarding answer not found
- `500`: Server error

**Notes:**
- Extracts `plan`, `email`, and `name` from onboarding answers JSON
- Initializes phases state based on plan (LAUNCH or GROWTH)
- Sets `startedAt` to current time
- Sets `currentDayOf14` to 1

---

## Quiz Submissions

### GET /api/quiz-submissions

**Description:** Get all quiz submissions

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "full_name": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone_number": "string | null",
      "brand_name": "string",
      "logo_status": "string",
      "brand_goals": ["string"],
      "online_presence": "string",
      "audience": ["string"],
      "brand_style": "string",
      "timeline": "string",
      "preferred_kit": "LAUNCH | GROWTH | null",
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime"
    }
  ],
  "count": 0
}
```

**Error Responses:**
- `500`: Server error

---

### GET /api/quiz-submissions/[id]

**Description:** Get a specific quiz submission

**Path Parameters:**
- `id`: Quiz submission ID (string, required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "full_name": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone_number": "string | null",
    "referral": "string | null",
    "brand_name": "string",
    "logo_status": "string",
    "brand_goals": ["string"],
    "online_presence": "string",
    "audience": ["string"],
    "brand_style": "string",
    "timeline": "string",
    "preferred_kit": "LAUNCH | GROWTH | null",
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime"
  }
}
```

**Error Responses:**
- `400`: Missing submission ID
- `404`: Quiz submission not found
- `500`: Server error

---

### DELETE /api/quiz-submissions/[id]

**Description:** Delete a quiz submission

**Path Parameters:**
- `id`: Quiz submission ID (string, required)

**Response (200):**
```json
{
  "success": true,
  "message": "Quiz submission deleted successfully"
}
```

**Error Responses:**
- `400`: Missing submission ID
- `404`: Quiz submission not found
- `500`: Server error

---

## Health & Debug

### GET /api/health/db

**Description:** Check database connection health

**Response (200):**
```json
{
  "status": "success",
  "message": "Database connection successful",
  "connected": true,
  "database": {
    "projects": 0,
    "quizSubmissions": 0,
    "tasks": 0
  },
  "timestamp": "ISO 8601 datetime"
}
```

**Error Response (500):**
```json
{
  "status": "error",
  "message": "Database connection failed",
  "connected": false,
  "error": "string",
  "hint": "string",
  "documentation": "VERCEL_DATABASE_SETUP.md"
}
```

---

### GET /api/debug/env

**Description:** Debug environment variables (without exposing sensitive data)

**Response (200):**
```json
{
  "environment": "development | production",
  "database": {
    "hasUrl": true,
    "urlLength": 0,
    "startsWithMySQL": true,
    "hasHost": true,
    "connectionInfo": {
      "host": "string",
      "port": "string",
      "database": "string",
      "hasCredentials": true,
      "protocol": "mysql"
    },
    "commonIssues": ["string"]
  },
  "tips": ["string"]
}
```

---

### POST /api/setup

**Description:** Setup endpoint (dummy endpoint)

**Response (200):**
```json
{
  "success": true,
  "message": "Setup completed successfully"
}
```

**Note:** This endpoint currently returns dummy data.

---

## My Project (Client-facing endpoints)

### GET /api/my-project

**Description:** Get current user's project (dummy endpoint)

**Response (200):**
```json
{
  "project": {
    // Dummy project data
  }
}
```

**Note:** This endpoint currently returns dummy data. Should be implemented with proper user authentication.

---

### GET /api/my-project/phases-state

**Description:** Get current user's project phases state (dummy endpoint)

**Response (200):**
```json
{
  "project": {
    // Dummy project data with phases
  }
}
```

**Note:** This endpoint currently returns dummy data.

---

### PATCH /api/my-project/phases-state

**Description:** Update current user's project phases state (dummy endpoint)

**Request Body:**
```json
{
  // Any data
}
```

**Response (200):**
```json
{
  "project": {
    // Dummy project data
  },
  "message": "Checklist item updated successfully"
}
```

**Note:** This endpoint currently returns dummy data.

---

### PATCH /api/my-project/checklist/[item_id]

**Description:** Update checklist item for current user's project (dummy endpoint)

**Path Parameters:**
- `item_id`: Item ID (string, required)

**Request Body:**
```json
{
  "is_done": "boolean"
}
```

**Response (200):**
```json
{
  "checklist_item": {
    "id": "string",
    "label": "string",
    "is_done": false
  },
  "message": "Checklist item updated successfully"
}
```

**Note:** This endpoint currently returns dummy data.

---

## Demo Endpoints

### GET /api/demo/items

**Description:** Get demo items (dummy endpoint)

**Response (200):**
```json
{
  "success": true,
  "data": [
    // Dummy items
  ]
}
```

---

### POST /api/demo/items

**Description:** Create demo item (dummy endpoint)

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "status": "string (optional, default: 'active')"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "status": "string",
    "createdAt": "ISO 8601 datetime"
  }
}
```

---

### PATCH /api/demo/items/[id]

**Description:** Update demo item (dummy endpoint)

**Path Parameters:**
- `id`: Item ID (string, required)

**Request Body:**
```json
{
  // Any fields
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    // Updated fields
  }
}
```

---

### DELETE /api/demo/items/[id]

**Description:** Delete demo item (dummy endpoint)

**Path Parameters:**
- `id`: Item ID (string, required)

**Response (200):**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

## Database Schema

### Models

#### Admin
```prisma
model Admin {
  id          String    @id @default(uuid())
  userId      String?   @map("user_id")
  email       String    @unique
  name        String
  password    String?
  otpCode     String?   @map("otp_code")
  otpExpiresAt DateTime? @map("otp_expires_at")
  role        String    @default("admin")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
}
```

#### Project
```prisma
model Project {
  id                  String   @id @default(uuid())
  onboardingAnswerId  String   @unique @map("onboarding_answer_id")
  userId              String   @map("user_id")
  name                String?
  email               String
  plan                KitType  // LAUNCH or GROWTH
  startedAt           DateTime? @map("started_at")
  currentDayOf14      Int?     @map("current_day_of_14")
  nextFromUs          String?  @map("next_from_us") @db.Text
  nextFromYou         String?  @map("next_from_you") @db.Text
  phasesState         Json     @default("{}")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  onboardingAnswer    OnboardingAnswer @relation(...)
  tasks               Task[]
}
```

#### Task
```prisma
model Task {
  id          String     @id @default(uuid())
  projectId   String     @map("project_id")
  title       String     @db.Text
  description String?    @db.Text
  type        TaskType   @default(OTHER)
  status      TaskStatus @default(PENDING)
  dueDate     DateTime?  @map("due_date")
  completedAt DateTime?  @map("completed_at")
  attachments Json?      @default("[]")
  metadata    Json?      @default("{}")
  createdBy   String?    @map("created_by")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  
  project     Project    @relation(...)
}
```

#### OnboardingAnswer
```prisma
model OnboardingAnswer {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  answers     Json
  completedAt DateTime @default(now()) @map("completed_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  project     Project? @relation(...)
}
```

#### QuizSubmission
```prisma
model QuizSubmission {
  id             String   @id @default(uuid())
  firstName      String   @map("first_name")
  lastName       String   @map("last_name")
  email          String
  phoneNumber    String?  @map("phone_number")
  referral       String?  @map("referral")
  brandName      String   @map("brand_name")
  logoStatus     String   @map("logo_status")
  brandGoals     Json     @default("[]") @map("brand_goals")
  onlinePresence String   @map("online_presence")
  audience       Json     @default("[]") @map("audience")
  brandStyle     String   @map("brand_style")
  timeline       String
  preferredKit   KitType? @map("preferred_kit")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
}
```

### Enums

```prisma
enum KitType {
  LAUNCH
  GROWTH
}

enum Status {
  NOT_STARTED
  IN_PROGRESS
  WAITING_ON_CLIENT
  DONE
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskType {
  UPLOAD_FILE
  SEND_INFO
  PROVIDE_DETAILS
  REVIEW
  OTHER
}
```

---

## Environment Variables

### Required

- `DATABASE_URL`: MySQL database connection string
  - Format: `mysql://user:password@host:port/database?sslaccept=strict`
  - Example: `mysql://user:pass@localhost:3306/klarnow_db?sslaccept=strict`

### Optional (for email functionality)

- `RESEND_API_KEY`: Resend email service API key
- `RESEND_FROM_EMAIL`: Email address to send from (default: "onboarding@resend.dev")

### Optional (for development)

- `DEFAULT_ADMIN_EMAIL`: Default admin email for development/testing
- `DEFAULT_ADMIN_OTP`: Default OTP for default admin (default: "000000")
- `NODE_ENV`: Environment mode (`development` | `production`)

---

## Dependencies

### Core Dependencies

- **Prisma**: ORM for database access
  - `@prisma/client`: Prisma client
  - `prisma`: Prisma CLI

- **Next.js**: Framework (if using Next.js)
  - `next`: Next.js framework

- **bcrypt**: Password hashing
  - `bcrypt`: Password hashing library

- **Resend**: Email service
  - `resend`: Email API client

### Database

- **MySQL**: Database (via Prisma)

### Phase Structure

The phase structure is hardcoded in the application. There are two kit types:

1. **LAUNCH Kit**: 4 phases
   - PHASE_1: Inputs & clarity (Days 0-2)
   - PHASE_2: Words that sell (Days 3-5)
   - PHASE_3: Design & build (Days 6-10)
   - PHASE_4: Test & launch (Days 11-14)

2. **GROWTH Kit**: 4 phases
   - PHASE_1: Strategy locked in (Days 0-2)
   - PHASE_2: Copy & email engine (Days 3-5)
   - PHASE_3: Build the funnel (Days 6-10)
   - PHASE_4: Test & handover (Days 11-14)

Each phase has:
- `phase_id`: Unique identifier (PHASE_1, PHASE_2, etc.)
- `phase_number`: Sequential number (1-4)
- `title`: Phase title
- `subtitle`: Phase subtitle
- `day_range`: Day range string
- `checklist_labels`: Array of checklist item labels

---

## Implementation Notes

### Authentication

- Current implementation uses OTP-based authentication
- Session is stored in HTTP-only cookies
- Some endpoints require email authentication via query parameter or header (`X-User-Email`)

### Task Responses

- Task responses are stored in the `metadata` JSON field of tasks
- Structure:
  ```json
  {
    "responses": [
      {
        "id": "string",
        "text": "string",
        "created_at": "ISO 8601 datetime",
        "created_by": "string",
        "attachments": []
      }
    ],
    "attachments": []
  }
  ```

### Phase State

- Phase state is stored in the `phasesState` JSON field of projects
- Structure:
  ```json
  {
    "PHASE_1": {
      "status": "NOT_STARTED | IN_PROGRESS | WAITING_ON_CLIENT | DONE",
      "started_at": "ISO 8601 datetime | null",
      "completed_at": "ISO 8601 datetime | null",
      "checklist": {
        "label1": true,
        "label2": false
      }
    }
  }
  ```

### Error Handling

- All endpoints return consistent error format:
  ```json
  {
    "error": "Error message",
    "details": "Additional details (development only)"
  }
  ```

- HTTP Status Codes:
  - `200`: Success
  - `201`: Created
  - `400`: Bad Request
  - `401`: Unauthorized
  - `404`: Not Found
  - `409`: Conflict
  - `500`: Internal Server Error

### Caching

- Most GET endpoints include no-cache headers:
  - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
  - `Pragma: no-cache`
  - `Expires: 0`

---

## API Base URL

For a centralized backend service, you would typically use:
- Development: `http://localhost:3000/api` or `http://localhost:8000/api`
- Production: `https://your-api-domain.com/api`

All endpoints are prefixed with `/api`.

---

## Rate Limiting & Security Recommendations

When implementing the centralized backend:

1. **Rate Limiting**: Implement rate limiting on all endpoints
2. **CORS**: Configure CORS to allow only your frontend applications
3. **Authentication**: Implement proper JWT or session-based authentication
4. **Input Validation**: Validate all input data
5. **SQL Injection**: Use parameterized queries (Prisma handles this)
6. **XSS Protection**: Sanitize user inputs
7. **HTTPS**: Always use HTTPS in production
8. **API Keys**: Consider API keys for service-to-service communication

---

## Testing Endpoints

Use these endpoints to test your implementation:

1. **Health Check**: `GET /api/health/db`
2. **Environment Debug**: `GET /api/debug/env`
3. **Database Connection**: Verify DATABASE_URL is set correctly

---

## Migration Notes

When migrating to a centralized backend:

1. **Database**: Use the same Prisma schema
2. **Environment Variables**: Set all required environment variables
3. **Phase Structure**: Implement the hardcoded phase structure logic
4. **Authentication**: Migrate OTP system or implement new auth
5. **File Uploads**: Implement file storage for task attachments
6. **Email Service**: Configure Resend or alternative email service

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Generated for**: Klarnow Admin Dashboard API Migration

