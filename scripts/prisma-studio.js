#!/usr/bin/env node

/**
 * Script to run Prisma Studio with environment variables loaded from .env
 */

require('dotenv').config();

const { execSync } = require('child_process');

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('📖 Make sure your .env file exists and contains DATABASE_URL');
  process.exit(1);
}

console.log('✅ DATABASE_URL loaded from .env');
console.log('🚀 Starting Prisma Studio...\n');

// Run prisma studio
try {
  execSync('npx prisma studio', {
    stdio: 'inherit',
    env: process.env,
  });
} catch (error) {
  // Prisma Studio exits with code 0 when closed normally
  process.exit(0);
}

