# CSV Import Guide

This guide explains how to import CSV data into your database using the `import-csv.ts` script.

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

2. Ensure your `.env` file has the `DATABASE_URL` configured.

## Usage

```bash
npm run import-csv <model> <csv-file-path>
# or
tsx scripts/import-csv.ts <model> <csv-file-path>
```

### Available Models

- `QuizSubmission`
- `Project`
- `Admin`
- `Task`
- `OnboardingAnswer`

### Examples

```bash
# Import quiz submissions
npm run import-csv QuizSubmission data/quiz-submissions.csv

# Import projects
npm run import-csv Project data/projects.csv

# Import admins
npm run import-csv Admin data/admins.csv
```

## CSV Format Requirements

### General Rules

1. **First row must be headers** - Column names should match database field names (snake_case or camelCase)
2. **Empty values** - Will be treated as null/undefined
3. **Dates** - Use ISO format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss`
4. **JSON fields** - Provide valid JSON strings
5. **Enums** - Use exact enum values (e.g., `LAUNCH`, `GROWTH`)

### Field Name Mapping

The script automatically maps common field name variations:
- `first_name` → `firstName`
- `user_id` → `userId`
- `created_at` → `createdAt`
- etc.

### Model-Specific Examples

#### QuizSubmission

```csv
first_name,last_name,email,phone_number,brand_name,logo_status,brand_goals,online_presence,audience,brand_style,timeline,preferred_kit
John,Doe,john@example.com,+1234567890,MyBrand,Yes,"[""brand awareness"",""sales""]","Website,Social Media","[""millennials"",""gen-z""]",Modern,3 months,LAUNCH
```

**Notes:**
- `brand_goals` and `audience` are JSON arrays - use double quotes and escape inner quotes
- `preferred_kit` must be `LAUNCH` or `GROWTH`

#### Project

```csv
onboarding_answer_id,user_id,name,email,plan,started_at,current_day_of_14,next_from_us,next_from_you,phases_state
uuid-here,user-uuid,My Project,project@example.com,GROWTH,2024-01-15,5,Action item 1,Action item 2,"{}"
```

**Notes:**
- `onboarding_answer_id` must reference an existing OnboardingAnswer
- `phases_state` is a JSON object
- `plan` must be `LAUNCH` or `GROWTH`

#### Admin

```csv
email,name,role,user_id
admin@example.com,Admin User,admin,
```

**Notes:**
- `user_id` is optional
- `role` defaults to "admin" if not provided

#### Task

```csv
project_id,title,description,type,status,due_date,completed_at,attachments,metadata
project-uuid,Complete design,Finish the logo design,UPLOAD_FILE,IN_PROGRESS,2024-02-01,,"[""file1.pdf""]","{}"
```

**Notes:**
- `type` must be: `UPLOAD_FILE`, `SEND_INFO`, `PROVIDE_DETAILS`, `REVIEW`, `OTHER`
- `status` must be: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `attachments` and `metadata` are JSON fields

#### OnboardingAnswer

```csv
user_id,answers,completed_at
user-uuid,"{""question1"":""answer1"",""question2"":""answer2""}",2024-01-01T10:00:00
```

**Notes:**
- `answers` is a JSON object containing all onboarding form data

## Troubleshooting

### Common Errors

1. **"Invalid date format"**
   - Ensure dates are in ISO format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss`

2. **"Invalid JSON"**
   - Check that JSON fields have proper quotes and escaping
   - Arrays: `["value1","value2"]`
   - Objects: `{"key":"value"}`

3. **"Invalid enum value"**
   - Check enum values match exactly (case-sensitive)
   - KitType: `LAUNCH` or `GROWTH`
   - TaskType: `UPLOAD_FILE`, `SEND_INFO`, `PROVIDE_DETAILS`, `REVIEW`, `OTHER`
   - TaskStatus: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

4. **"Foreign key constraint"**
   - Ensure referenced IDs exist (e.g., `project_id` must exist in projects table)
   - For Projects, ensure `onboarding_answer_id` exists

### Tips

- Test with a small CSV file first (1-2 rows)
- Check the console output for detailed error messages
- The script shows which rows succeeded and which failed
- All successful imports are committed; failed rows are skipped

## Example CSV Files

Create a `data/` directory in your project root and place your CSV files there:

```
project-root/
  data/
    quiz-submissions.csv
    projects.csv
    admins.csv
```

Then run:
```bash
npm run import-csv QuizSubmission data/quiz-submissions.csv
```

