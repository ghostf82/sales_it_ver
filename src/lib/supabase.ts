import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Log Supabase configuration (without exposing full key)
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey.slice(0, 5) + '...',
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

let supabaseInstance;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  // Test the connection
  supabaseInstance.from('representatives').select('count').limit(1).single()
    .then(() => {
      console.log('Successfully connected to Supabase');
    })
    .catch((error) => {
      console.error('Error testing Supabase connection:', error);
    });

} catch (error) {
  console.error('Error initializing Supabase client:', error);
  throw new Error('Failed to initialize Supabase client');
}

export const supabase = supabaseInstance;

// Add error event listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.email);
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
  }
});