const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Service Role Key')
  console.error('Please check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupAuthUser(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`)
    
    // Get user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return
    }
    
    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.log('✅ User not found in auth (already deleted or never existed)')
      return
    }
    
    console.log(`🗑️ Found user: ${user.id} (${user.email})`)
    console.log('🗑️ Deleting from auth...')
    
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError)
    } else {
      console.log('✅ User deleted from auth successfully')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: node scripts/cleanup-auth-user.js <email>')
  console.log('Example: node scripts/cleanup-auth-user.js test@example.com')
  process.exit(1)
}

cleanupAuthUser(email)
