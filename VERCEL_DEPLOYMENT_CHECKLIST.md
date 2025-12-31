# Vercel Deployment Checklist - Database Setup

## ✅ Critical Steps (MUST DO)

### Step 1: Set DATABASE_URL Environment Variable

Your Prisma schema requires `DATABASE_URL` to connect to MySQL.

**How to add it:**

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Click **"Add New"** button
6. Fill in:
   - **Key:** `DATABASE_URL`
   - **Value:** Your MySQL connection string (see format below)
   - **Environment:** Select ALL THREE:
     - ☑️ **Production**
     - ☑️ **Preview**
     - ☑️ **Development**
7. Click **Save**

**Connection String Format:**
```
mysql://username:password@host:port/database_name?sslaccept=strict
```

**Example (Railway):**
```
mysql://root:password@trolley.proxy.rlwy.net:40004/railway?sslaccept=strict
```

**Example (PlanetScale):**
```
mysql://username:password@aws.connect.psdb.cloud/database_name?sslaccept=strict
```

### Step 2: REDEPLOY (CRITICAL!)

⚠️ **You MUST redeploy after adding environment variables!**

**Option A: Redeploy from Dashboard**
1. Go to **Deployments** tab in Vercel
2. Find your latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Wait for deployment to finish

**Option B: Push a Commit**
- Make any small change (add a comment, update README)
- Commit and push
- This triggers automatic redeployment

### Step 3: Verify Database Connection

After redeploying, test your database:

**Test Endpoint 1: Check if DATABASE_URL is detected**
```
https://your-app.vercel.app/api/debug/env
```

Should show:
```json
{
  "database": {
    "hasUrl": true,
    "connectionInfo": {
      "host": "your-host",
      "port": "3306",
      "database": "your-database"
    }
  }
}
```

**Test Endpoint 2: Test database connection**
```
https://your-app.vercel.app/api/health/db
```

Should show:
```json
{
  "status": "success",
  "message": "Database connection successful",
  "connected": true
}
```

## 🔍 Troubleshooting

### Problem: "DATABASE_URL is not set"

**Solution:**
- ✅ Verify you added `DATABASE_URL` to Vercel
- ✅ Check you added it to **Production** environment
- ✅ **REDEPLOY** after adding it

### Problem: "Cannot reach database server"

**Solution:**
- ✅ Check your database is running (not paused)
- ✅ Verify the connection string is correct
- ✅ Check database firewall allows connections from internet
- ✅ For Railway: Make sure database is active
- ✅ Try adding/removing SSL parameters:
  - `?sslaccept=strict` (try first)
  - `?ssl=true`
  - `?ssl=false` (if SSL doesn't work)

### Problem: "Authentication failed"

**Solution:**
- ✅ Check username and password in connection string
- ✅ URL-encode special characters in password:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

### Problem: "Unknown database"

**Solution:**
- ✅ Verify database name is correct
- ✅ Check the database exists in your MySQL server

### Problem: Build succeeds but database still doesn't work

**Solution:**
- ✅ Check Vercel function logs for errors
- ✅ Visit `/api/health/db` to see specific error
- ✅ Make sure you redeployed after setting DATABASE_URL

## 📋 Quick Checklist

Before asking for help, verify:

- [ ] Added `DATABASE_URL` to Vercel → Settings → Environment Variables
- [ ] Added to **Production**, **Preview**, AND **Development** environments
- [ ] Connection string format is correct (`mysql://...`)
- [ ] Connection string includes port number (`:3306` or your port)
- [ ] Added SSL parameter (`?sslaccept=strict` or similar)
- [ ] **REDEPLOYED** after adding the variable
- [ ] Database is running (not paused)
- [ ] Tested `/api/debug/env` - shows `hasUrl: true`
- [ ] Tested `/api/health/db` - shows `connected: true`

## 🎯 Your Current Setup

✅ **Build Script:** Already configured correctly
- `"build": "prisma generate && next build"`
- `"postinstall": "prisma generate"`

✅ **Prisma Schema:** Uses `DATABASE_URL` from environment

✅ **Database:** MySQL configured

## 📝 What You Need

**Only 2 things:**

1. **DATABASE_URL environment variable** in Vercel
   - Format: `mysql://user:pass@host:port/db?sslaccept=strict`
   - Must be added to Production environment

2. **Redeploy** after adding it
   - This is the #1 reason it doesn't work!

## 🚀 After Setup

Once connected:
- ✅ Dashboard will show real data
- ✅ Quiz submissions will load
- ✅ Projects will load
- ✅ Tasks will load

## 🔗 Test Your Database

Visit these URLs after deployment:

1. **Check environment:** `https://your-app.vercel.app/api/debug/env`
2. **Test connection:** `https://your-app.vercel.app/api/health/db`
3. **Test data:** `https://your-app.vercel.app/api/quiz-submissions`

## 💡 Common Mistakes

❌ **Adding DATABASE_URL but not redeploying**
- Solution: Always redeploy after adding env vars

❌ **Adding to wrong environment**
- Solution: Add to Production, Preview, AND Development

❌ **Wrong connection string format**
- Solution: Must start with `mysql://` and include port

❌ **Database not accessible**
- Solution: Check database is running and allows external connections

❌ **Missing SSL parameters**
- Solution: Add `?sslaccept=strict` to connection string

## 🆘 Still Not Working?

If you've done everything above:

1. **Share these test results:**
   - Output from `/api/debug/env`
   - Output from `/api/health/db`
   - Any error messages from Vercel logs

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Functions
   - Check function logs for errors
   - Look for Prisma or database errors

3. **Test Locally First:**
   - Set `DATABASE_URL` in `.env.local`
   - Run `npm run dev`
   - Test if database works locally
   - If local works but Vercel doesn't, it's an environment variable issue

## 📖 Related Documentation

- See `LOGIN_TROUBLESHOOTING.md` for login issues
- Check your database provider docs for connection string format




