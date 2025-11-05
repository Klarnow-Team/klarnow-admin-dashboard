# Vercel Deployment Guide

This guide will help you deploy your Next.js admin dashboard to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your Supabase credentials ready

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import your project on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Click "Import"

3. **Configure your project**
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key (if needed for server-side operations)

   **Important**: Make sure to add these for all environments (Production, Preview, Development)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   Follow the prompts:
   - Link to existing project or create new
   - Confirm settings
   - Add environment variables when prompted

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Environment Variables Setup

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Note**: 
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` should be kept secret (don't use `NEXT_PUBLIC_` prefix)

## Post-Deployment

1. **Test your deployment**
   - Visit your Vercel URL
   - Test login functionality
   - Verify all features work

2. **Custom Domain (Optional)**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS as instructed

3. **Monitor deployments**
   - Check the Vercel dashboard for build logs
   - Monitor function logs for any errors

## Troubleshooting

- **Build fails**: Check build logs in Vercel dashboard
- **Environment variables not working**: Make sure they're added for the correct environment (Production/Preview/Development)
- **Supabase connection issues**: Verify your Supabase URL and keys are correct
- **CORS issues**: Check your Supabase project settings for allowed origins

## Next Steps

- Set up automatic deployments from your main branch
- Configure preview deployments for pull requests
- Set up monitoring and alerts


