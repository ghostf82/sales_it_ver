const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Create admin client for service operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

module.exports = {
  supabase,
  supabaseAdmin
};