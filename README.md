# Admin Dashboard

A modern admin dashboard built with Next.js 16, TypeScript, Tailwind CSS, and Prisma (MySQL).

## Features

- 🔐 Email OTP Authentication with Resend
- 📊 Full CRUD operations
- 🎨 Modern, responsive UI
- ⚡ Fast and performant
- 🔒 Secure session management

## Prerequisites

- Node.js 18+ installed
- A Resend account (for email OTP)
- MySQL database

## Setup Instructions

### 1. Database Setup

First, you need to create a table in your Supabase database. Go to your Supabase project SQL Editor and run:

```sql
-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read
CREATE POLICY "Users can read items" ON items
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert
CREATE POLICY "Users can insert items" ON items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update
CREATE POLICY "Users can update items" ON items
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete
CREATE POLICY "Users can delete items" ON items
  FOR DELETE
  USING (auth.role() = 'authenticated');
```

### 2. Set Up Environment Variables

Create a `.env.local` file with the following variables:

```env
DATABASE_URL=mysql://username:password@host:port/database_name?sslaccept=strict
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your-verified-email@yourdomain.com

# Optional: Default admin email for quick login (development/testing)
DEFAULT_ADMIN_EMAIL=your-admin-email@example.com
DEFAULT_ADMIN_OTP=000000
```

**Default Admin Email (Optional):**
- Set `DEFAULT_ADMIN_EMAIL` to an admin email address
- Set `DEFAULT_ADMIN_OTP` to a fixed OTP code (defaults to "000000")
- When using the default admin email, you can login with the fixed OTP without waiting for email delivery
- This is useful for development and testing

**Getting Resend API Key:**
1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Add it to your `.env.local` file

**Resend From Email:**
- Use a verified domain email address (e.g., `noreply@yourdomain.com`)
- Or use the default `onboarding@resend.dev` for testing (limited)

### 3. Create an Admin User

Run the setup script to create the initial admin user:

```bash
npm run create-admin
```

This will create an admin user. You can then login using email OTP authentication.

### 4. Install Dependencies

```bash
npm install
```

**Note:** Make sure to install the Resend package:
```bash
npm install resend
```

### 5. Run Database Migrations

After updating the Prisma schema, run:

```bash
npm run prisma:generate
npm run prisma:push
```

This will update your database schema to include OTP fields.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Go to the login page
2. Enter your email address
3. Click "Send OTP" - you'll receive a 6-digit code via email
4. Enter the OTP code to login
5. Navigate to the dashboard
6. Create, read, update, and delete items
7. Logout when done

## Project Structure

```
admin-dashboard/
├── app/
│   ├── dashboard/       # Dashboard page with CRUD operations
│   ├── login/           # Login page
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page (redirects)
│   └── globals.css      # Global styles
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/   # Login API (OTP verification)
│   │       └── send-otp/ # Send OTP API
├── lib/
│   └── prisma.ts        # Prisma client
└── .env.local           # Environment variables
```

## Environment Variables

### Local Development

Create a `.env.local` file with:

```env
DATABASE_URL=mysql://username:password@host:port/database_name?sslaccept=strict
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your-verified-email@yourdomain.com

# Optional: Default admin email for quick login
DEFAULT_ADMIN_EMAIL=your-admin-email@example.com
DEFAULT_ADMIN_OTP=000000
```

### Vercel Deployment

**⚠️ IMPORTANT:** You must set the following environment variables in Vercel:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add the following variables:
   - `DATABASE_URL` - Your MySQL connection string
   - `RESEND_API_KEY` - Your Resend API key
   - `RESEND_FROM_EMAIL` - Your verified email address (optional, defaults to onboarding@resend.dev)
3. Make sure to add them to **all environments** (Production, Preview, Development)
4. Redeploy your application

**Example DATABASE_URL format:**
```
mysql://username:password@host:3306/database_name?sslaccept=strict
```

**Database Health Check:**
After deployment, test your database connection:
- Visit: `https://your-app.vercel.app/api/health/db`
- This will show if your database is connected and working

📖 **See `VERCEL_DATABASE_SETUP.md` for detailed setup instructions.**

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Prisma** - Database ORM
- **MySQL** - Database
- **Resend** - Email service for OTP
- **Lucide React** - Icons

## License

MIT
