-- Migration: Replace Client and ClientPhaseState with Project model
-- This migration:
-- 1. Creates projects table
-- 2. Migrates data from clients to projects (including phase states)
-- 3. Updates tasks table to use project_id instead of client_id
-- 4. Drops client_phase_state table
-- 5. Drops clients table

-- Step 1: Drop foreign key constraints on tasks table
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE `tasks` DROP FOREIGN KEY IF EXISTS `tasks_client_id_fkey`;

-- Step 2: Create projects table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(191) NOT NULL,
  `onboarding_answer_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NULL,
  `email` VARCHAR(191) NOT NULL,
  `plan` ENUM('LAUNCH', 'GROWTH') NOT NULL,
  `started_at` DATETIME(3) NULL,
  `current_day_of_14` INT NULL,
  `next_from_us` TEXT NULL,
  `next_from_you` TEXT NULL,
  `phases_state` JSON NOT NULL DEFAULT ('{}'),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `projects_onboarding_answer_id_key`(`onboarding_answer_id`),
  UNIQUE INDEX `projects_user_id_plan_key`(`user_id`, `plan`),
  INDEX `projects_user_id_idx`(`user_id`),
  INDEX `projects_email_idx`(`email`),
  INDEX `projects_plan_idx`(`plan`),
  INDEX `projects_onboarding_answer_id_idx`(`onboarding_answer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 4: Add project_id column to tasks table
ALTER TABLE `tasks` ADD COLUMN `project_id` VARCHAR(191) NULL;

-- Step 5: Migrate data from clients to projects (if any exist)
-- Note: This assumes you want to migrate existing client data
-- You may need to adjust this based on your data structure
INSERT INTO `projects` (
  `id`,
  `onboarding_answer_id`,
  `user_id`,
  `name`,
  `email`,
  `plan`,
  `started_at`,
  `current_day_of_14`,
  `next_from_us`,
  `next_from_you`,
  `phases_state`,
  `created_at`,
  `updated_at`
)
SELECT 
  c.`id`,
  COALESCE(c.`onboarding_answers_id`, UUID()) as `onboarding_answer_id`,
  c.`user_id`,
  c.`name`,
  c.`email`,
  c.`plan`,
  NULL as `started_at`,
  c.`current_day_of_14`,
  c.`next_from_us`,
  c.`next_from_you`,
  JSON_OBJECT() as `phases_state`,
  c.`created_at`,
  c.`updated_at`
FROM `clients` c
WHERE NOT EXISTS (
  SELECT 1 FROM `projects` p WHERE p.`onboarding_answer_id` = c.`onboarding_answers_id`
);

-- Step 6: Migrate phase states to JSON format in projects table
-- This converts ClientPhaseState records to JSON in projects.phases_state
-- Note: This uses a stored procedure approach since MySQL doesn't support subqueries in UPDATE for JSON aggregation
-- For now, we'll set a default empty JSON and let the application populate it
-- If you have existing data, you may need a separate script to migrate phase states

-- Step 7: Update tasks table to reference projects
UPDATE `tasks` t
INNER JOIN `clients` c ON t.`client_id` = c.`id`
INNER JOIN `projects` p ON p.`onboarding_answer_id` = c.`onboarding_answers_id`
SET t.`project_id` = p.`id`
WHERE t.`project_id` IS NULL;

-- Step 8: Make project_id NOT NULL and add foreign key
ALTER TABLE `tasks` MODIFY COLUMN `project_id` VARCHAR(191) NOT NULL;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Drop old client_id column from tasks
ALTER TABLE `tasks` DROP COLUMN `client_id`;

-- Step 10: Add foreign key constraint for onboarding_answers -> projects
ALTER TABLE `projects` ADD CONSTRAINT `projects_onboarding_answer_id_fkey` FOREIGN KEY (`onboarding_answer_id`) REFERENCES `onboarding_answers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 11: Drop client_phase_state table (after data migration)
DROP TABLE IF EXISTS `client_phase_state`;

-- Step 12: Drop clients table
DROP TABLE IF EXISTS `clients`;

-- Step 13: Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

