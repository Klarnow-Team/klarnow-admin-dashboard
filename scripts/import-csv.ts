/**
 * CSV Import Script
 *
 * Usage:
 *   tsx scripts/import-csv.ts <model> <csv-file-path>
 *
 * Examples:
 *   tsx scripts/import-csv.ts QuizSubmission data/quiz-submissions.csv
 *   tsx scripts/import-csv.ts Project data/projects.csv
 *   tsx scripts/import-csv.ts Admin data/admins.csv
 *
 * CSV Format:
 *   - First row should contain column headers matching the database field names
 *   - For JSON fields, provide JSON strings in the CSV
 *   - For enum fields, use the exact enum values (e.g., LAUNCH, GROWTH)
 *   - For dates, use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
 *   - Empty values will be treated as null/undefined
 */

import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient, KitType, TaskType, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Normalize CSV header name to handle various formats (spaces, underscores, case)
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/-/g, "_"); // Replace hyphens with underscores
}

// Map normalized CSV column names to Prisma field names
const fieldMappings: Record<string, Record<string, string>> = {
  QuizSubmission: {
    first_name: "firstName",
    last_name: "lastName",
    phone_number: "phoneNumber",
    referral: "referral",
    brand_name: "brandName",
    logo_status: "logoStatus",
    brand_goals: "brandGoals",
    online_presence: "onlinePresence",
    audience: "audience",
    brand_style: "brandStyle",
    timeline: "timeline",
    preferred_kit: "preferredKit",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  Project: {
    onboarding_answer_id: "onboardingAnswerId",
    user_id: "userId",
    started_at: "startedAt",
    current_day_of_14: "currentDayOf14",
    next_from_us: "nextFromUs",
    next_from_you: "nextFromYou",
    phases_state: "phasesState",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  Admin: {
    user_id: "userId",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  Task: {
    project_id: "projectId",
    due_date: "dueDate",
    completed_at: "completedAt",
    created_by: "createdBy",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  OnboardingAnswer: {
    user_id: "userId",
    completed_at: "completedAt",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
};

// Transform CSV row to Prisma data format
function transformRow(model: string, row: Record<string, string>): any {
  const mapping = fieldMappings[model] || {};
  const transformed: any = {};

  for (const [csvKey, value] of Object.entries(row)) {
    // Skip empty values
    if (value === "" || value === null || value === undefined) {
      continue;
    }

    // Normalize the CSV header and map to field name
    const normalizedKey = normalizeHeader(csvKey);
    const fieldName = mapping[normalizedKey] || normalizedKey;

    // Handle special field types
    let processedValue: any = value;

    // Parse JSON fields
    if (
      fieldName === "answers" ||
      fieldName === "brandGoals" ||
      fieldName === "audience" ||
      fieldName === "phasesState" ||
      fieldName === "attachments" ||
      fieldName === "metadata"
    ) {
      try {
        processedValue = JSON.parse(value);
      } catch (e) {
        // If not valid JSON, try parsing as array if it looks like one
        if (value.trim().startsWith("[") || value.trim().startsWith("{")) {
          console.warn(
            `Warning: Invalid JSON for ${fieldName}, using raw value`
          );
        } else {
          // Try to parse as comma-separated array
          processedValue = value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
        }
      }
    }

    // Parse enum fields
    if (fieldName === "plan" || fieldName === "preferredKit") {
      processedValue = value.toUpperCase() as KitType;
      if (!Object.values(KitType).includes(processedValue)) {
        throw new Error(`Invalid KitType: ${value}. Must be LAUNCH or GROWTH`);
      }
    }

    if (fieldName === "type") {
      processedValue = value.toUpperCase() as TaskType;
      if (!Object.values(TaskType).includes(processedValue)) {
        throw new Error(`Invalid TaskType: ${value}`);
      }
    }

    if (fieldName === "status") {
      processedValue = value.toUpperCase() as TaskStatus;
      if (!Object.values(TaskStatus).includes(processedValue)) {
        throw new Error(`Invalid TaskStatus: ${value}`);
      }
    }

    // Parse date fields
    if (
      fieldName.includes("At") ||
      fieldName.includes("Date") ||
      fieldName === "dueDate" ||
      fieldName === "completedAt" ||
      fieldName === "startedAt"
    ) {
      if (value) {
        processedValue = new Date(value);
        if (isNaN(processedValue.getTime())) {
          throw new Error(`Invalid date format for ${fieldName}: ${value}`);
        }
      }
    }

    // Parse integer fields
    if (fieldName === "currentDayOf14") {
      processedValue = parseInt(value, 10);
      if (isNaN(processedValue)) {
        throw new Error(`Invalid integer for ${fieldName}: ${value}`);
      }
    }

    transformed[fieldName] = processedValue;
  }

  return transformed;
}

async function importCSV(model: string, csvFilePath: string) {
  try {
    console.log(`\n📂 Reading CSV file: ${csvFilePath}`);
    const csvContent = readFileSync(csvFilePath, "utf-8");

    console.log("📊 Parsing CSV...");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    if (records.length === 0) {
      console.log("⚠️  No records found in CSV file");
      return;
    }

    console.log(`✅ Found ${records.length} records to import`);
    console.log(`📋 Model: ${model}`);
    console.log(`\n🔄 Starting import...\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      try {
        const data = transformRow(model, row);

        // Use Prisma's create method based on model
        let result: any;
        switch (model) {
          case "QuizSubmission":
            result = await prisma.quizSubmission.create({ data });
            break;
          case "Project":
            result = await (prisma as any).project.create({ data });
            break;
          case "Admin":
            result = await prisma.admin.create({ data });
            break;
          case "Task":
            result = await prisma.task.create({ data });
            break;
          case "OnboardingAnswer":
            result = await prisma.onboardingAnswer.create({ data });
            break;
          default:
            throw new Error(`Unknown model: ${model}`);
        }

        successCount++;
        console.log(
          `✅ Row ${rowNumber}: Created ${model} with ID ${result.id}`
        );
      } catch (error: any) {
        errorCount++;
        const errorMsg = error.message || String(error);
        errors.push({ row: rowNumber, error: errorMsg });
        console.error(`❌ Row ${rowNumber}: ${errorMsg}`);
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total: ${records.length}`);

    if (errors.length > 0) {
      console.log(`\n❌ Errors:`);
      errors.forEach(({ row, error }) => {
        console.log(`   Row ${row}: ${error}`);
      });
    }

    console.log(`\n✨ Import completed!\n`);
  } catch (error: any) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(`
❌ Usage: tsx scripts/import-csv.ts <model> <csv-file-path>

Available models:
  - QuizSubmission
  - Project
  - Admin
  - Task
  - OnboardingAnswer

Example:
  tsx scripts/import-csv.ts QuizSubmission data/quiz-submissions.csv
`);
  process.exit(1);
}

const [model, csvFilePath] = args;

// Validate model
const validModels = [
  "QuizSubmission",
  "Project",
  "Admin",
  "Task",
  "OnboardingAnswer",
];
if (!validModels.includes(model)) {
  console.error(`❌ Invalid model: ${model}`);
  console.error(`   Available models: ${validModels.join(", ")}`);
  process.exit(1);
}

// Resolve file path (support both relative and absolute paths)
const resolvedPath = csvFilePath.startsWith("/")
  ? csvFilePath
  : join(process.cwd(), csvFilePath);

importCSV(model, resolvedPath).catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
